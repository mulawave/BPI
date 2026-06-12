import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import type { Prisma, MembershipPackage } from "@prisma/client";
import { getReferralChain } from "@/server/services/referral.service";
import { distributeBptReward } from "@/server/services/rewards.service";
import { PaymentProcessor } from "@/server/services/payment";
import { resolveCryptoPaymentNetworkDetails } from "@/server/services/payment/cryptoPaymentDetails";
import { PAYMENT_FULFILLMENT_TYPES } from "@/server/services/payment/paymentMetadata";
import { PaymentGateway, PaymentPurpose, PaymentStatus } from "@/server/services/payment/types";
import { randomUUID } from "crypto";
import { assertMockPaymentsAllowed } from "@/lib/mockPayments";
import { getPalliativeTier, isHighTierPackage, getWalletFieldName } from "@/lib/palliative";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import {
  claimPendingPayment,
  markPendingPaymentReviewed,
} from "@/server/services/payment/pendingPaymentFulfillment";
import { activateMembershipAfterExternalPayment, upgradeMembershipAfterExternalPayment } from "@/server/services/membershipPayments.service";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { deriveMembershipExpiry } from "@/lib/membershipAccess";
import {
  notifyMembershipActivation,
  notifyMembershipRenewal,
  notifyEmpowermentActivation,
  notifyEmpowermentMaturity,
  notifyEmpowermentApproval,
  notifyEmpowermentRelease,
  notifyAdminEmpowermentPending,
  notifyEmpowermentOutcomeSet,
  notifyEmpowermentTrancheReleased,
  notifyEmpowermentSponsorReward,
  notifyEmpowermentCspWaiverActivated,
  notifyAdminOutcomeNotSet,
  notifyReferralReward,
} from "@/server/services/notification.service";
import { 
  isCompositePackage, 
  processCompositePackagePurchase 
} from "@/server/services/compositePackages.service";
import { finalizeEmpowermentPackage } from "@/server/services/empowermentPayments.service";

const PACKAGE_LIST_CACHE_TTL_MS = 30_000;
let packageListCache: { value: MembershipPackage[]; expiresAt: number } | null = null;
let packageListInFlight: Promise<MembershipPackage[]> | null = null;
const ACTIVE_MEMBERSHIP_CACHE_TTL_MS = 30_000;
const activeMembershipCache = new Map<
  string,
  {
    value: { package: MembershipPackage; activatedAt: Date | null; expiresAt: Date | null } | null;
    expiresAt: number;
  }
>();
const activeMembershipInFlight = new Map<
  string,
  Promise<{ package: MembershipPackage; activatedAt: Date | null; expiresAt: Date | null } | null>
>();

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

async function getCachedMembershipPackages() {
  if (packageListCache && isFresh(packageListCache.expiresAt)) {
    return packageListCache.value;
  }

  if (packageListInFlight) {
    return packageListInFlight;
  }

  packageListInFlight = prisma.membershipPackage.findMany();

  try {
    const packages = await packageListInFlight;
    packageListCache = {
      value: packages,
      expiresAt: Date.now() + PACKAGE_LIST_CACHE_TTL_MS,
    };
    return packages;
  } finally {
    packageListInFlight = null;
  }
}

async function getCachedActiveMembership(userId: string) {
  const cached = activeMembershipCache.get(userId);
  if (cached && isFresh(cached.expiresAt)) {
    return cached.value;
  }

  const inFlight = activeMembershipInFlight.get(userId);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
      },
    });

    if (!user?.activeMembershipPackageId) {
      activeMembershipCache.set(userId, {
        value: null,
        expiresAt: Date.now() + ACTIVE_MEMBERSHIP_CACHE_TTL_MS,
      });
      return null;
    }

    const membershipPackage = await prisma.membershipPackage.findUnique({
      where: { id: user.activeMembershipPackageId },
    });

    if (!membershipPackage) {
      activeMembershipCache.set(userId, {
        value: null,
        expiresAt: Date.now() + ACTIVE_MEMBERSHIP_CACHE_TTL_MS,
      });
      return null;
    }

    const { expiresAt } = deriveMembershipExpiry({
      membershipExpiresAt: user.membershipExpiresAt,
      membershipActivatedAt: user.membershipActivatedAt,
      renewalCycleDays: membershipPackage.renewalCycle,
    });

    const value = {
      package: membershipPackage,
      activatedAt: user.membershipActivatedAt,
      expiresAt,
    };

    activeMembershipCache.set(userId, {
      value,
      expiresAt: Date.now() + ACTIVE_MEMBERSHIP_CACHE_TTL_MS,
    });

    return value;
  })().finally(() => {
    activeMembershipInFlight.delete(userId);
  });

  activeMembershipInFlight.set(userId, request);
  return request;
}

function invalidateActiveMembershipCache(userId: string) {
  activeMembershipCache.delete(userId);
  activeMembershipInFlight.delete(userId);
}

// Helper to fetch numeric admin settings with a fallback
async function getAdminSetting(key: string, defaultValue: number): Promise<number> {
  const setting = await prisma.adminSettings.findUnique({
    where: { settingKey: key },
  });
  return setting ? parseFloat(setting.settingValue) : defaultValue;
}

const CSP_COMMUNITY_CREDIT_AMOUNT = 10000;
const qualifiesForCspCommunityCredit = (packageName: string) => {
  const qualifyingNames = [
    "Regular Plus",
    "Gold",
    "Gold Plus",
    "Platinum",
    "Platinum Plus",
    "Travel & Tour Agent",
    "Basic Early Retirement",
    "Child Educational / Vocational Support",
  ];
  return qualifyingNames.some((name) => name.toLowerCase() === packageName.toLowerCase());
};

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizePercent(maybePercent: number, fallback: number): number {
  if (!Number.isFinite(maybePercent)) return fallback;
  if (maybePercent < 0) return fallback;
  return maybePercent > 1 ? maybePercent / 100 : maybePercent;
}

function computeProfitFiat(params: {
  profitMode: "PERCENT" | "FIXED" | "HYBRID";
  profitPercent: number;
  profitFixedAmountFiat: number;
  baseFiat: number;
}): number {
  const profitPercent = normalizePercent(params.profitPercent, 0);
  const fixed = Number(params.profitFixedAmountFiat ?? 0);
  const baseFiat = Number(params.baseFiat ?? 0);

  let profitFiat = 0;
  if (params.profitMode === "PERCENT") {
    profitFiat = baseFiat * profitPercent;
  } else if (params.profitMode === "FIXED") {
    profitFiat = fixed;
  } else {
    profitFiat = baseFiat * profitPercent + fixed;
  }

  return clampNumber(profitFiat, 0, baseFiat);
}

// finalizeEmpowermentPackage is now imported from @/server/services/empowermentPayments.service

export const packageRouter = createTRPCRouter({
  getPackages: publicProcedure.query(async () => {
    return await getCachedMembershipPackages();
  }),

  // Initiate membership payment (wallet or external gateway)
  initiateMembershipPayment: protectedProcedure
    .input(z.object({
      packageId: z.string(),
      selectedPalliative: z.enum(["car", "house", "land", "business", "solar", "education"]).optional(),
      gateway: z.enum(["wallet", "flutterwave", "paystack", "crypto", "mock"]).default("wallet"),
      originalAmount: z.number().optional(),
      originalCurrency: z.string().optional(),
      originalTotalUsd: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: input.packageId } });
      if (!membershipPackage) throw new Error("Membership package not found.");

      const totalCost = membershipPackage.price + membershipPackage.vat;

      if (input.gateway === "wallet") {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { wallet: true, country: true, state: true },
        });
        if (!user) throw new Error("User not found");
        if ((user.wallet ?? 0) < totalCost) {
          throw new Error(`Insufficient wallet balance. You need NGN ${totalCost.toLocaleString()}`);
        }

        const walletReference = `MEM-WALLET-${Date.now()}`;

        // Deduct and record transaction
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.user.update({ where: { id: userId }, data: { wallet: { decrement: totalCost } } });
          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId,
              transactionType: "MEMBERSHIP_PAYMENT",
              amount: -totalCost,
              description: `${membershipPackage.name} membership via wallet`,
              status: "completed",
              reference: walletReference,
              walletType: "main",
            },
          });
        });

        await activateMembershipAfterExternalPayment({
          prisma,
          userId,
          packageId: input.packageId,
          selectedPalliative: input.selectedPalliative,
          paymentReference: walletReference,
          paymentMethodLabel: "Wallet",
          activatorName: ctx.session?.user?.name || ctx.session?.user?.email || "Member",
        });
        invalidateActiveMembershipCache(userId);

        const membershipProfitFiat = computeProfitFiat({
          profitMode: ((membershipPackage.profitMode ?? "PERCENT") as any) as "PERCENT" | "FIXED" | "HYBRID",
          profitPercent: Number(membershipPackage.profitPercent ?? 1),
          profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
          baseFiat: Number(membershipPackage.price ?? 0),
        });

        await recordRevenue(prisma, {
          source: "MEMBERSHIP_REGISTRATION",
          amount: membershipProfitFiat,
          currency: "NGN",
          sourceId: `MEMBERSHIP_REGISTRATION:${walletReference}`,
          description: `Membership purchase: ${membershipPackage.name}`,
          userId,
          packageId: membershipPackage.id,
          programType: "MEMBERSHIP",
          country: user.country ?? undefined,
          state: user.state ?? undefined,
          region: getNigerianRegion(user.state),
          metadata: {
            totalPaid: totalCost,
            basePrice: membershipPackage.price,
            vat: membershipPackage.vat,
            paymentMethod: "WALLET",
            selectedPalliative: input.selectedPalliative ?? null,
          },
        });

        return { success: true, gateway: "wallet", paymentUrl: null, reference: walletReference };
      }

      // Mock gateway (testing only)
      if (input.gateway === "mock") {
        assertMockPaymentsAllowed("Mock payments are not enabled in this environment.");

        const mockReference = `MEM-MOCK-${Date.now()}`;

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_PAYMENT",
            amount: -totalCost,
            description: `${membershipPackage.name} membership via mock payment`,
            status: "completed",
            reference: mockReference,
            walletType: "main",
          },
        });

        await activateMembershipAfterExternalPayment({
          prisma,
          userId,
          packageId: input.packageId,
          selectedPalliative: input.selectedPalliative,
          paymentReference: mockReference,
          paymentMethodLabel: "Mock",
          activatorName: ctx.session?.user?.name || ctx.session?.user?.email || "Member",
        });
        invalidateActiveMembershipCache(userId);

        return { success: true, gateway: "mock", paymentUrl: null, reference: mockReference };
      }

      // External gateway flow (Paystack, Flutterwave, or Crypto/Basqet)
      const gatewayEnum = input.gateway === "paystack"
        ? PaymentGateway.PAYSTACK
        : input.gateway === "flutterwave"
          ? PaymentGateway.FLUTTERWAVE
          : PaymentGateway.CRYPTO;

      const baseUrl = (await resolveAppBaseUrl()).replace(/\/$/, "");
      const callbackUrl = input.gateway === "crypto"
        ? `${baseUrl}/api/webhooks/crypto`
        : `${baseUrl}/api/webhooks/${input.gateway}/callback`;
      const paymentMethod = input.gateway === "crypto" ? "crypto" : input.gateway;

      const payment = await PaymentProcessor.processPayment({
        amount: totalCost,
        currency: "NGN",
        userId,
        packageId: input.packageId,
        email: ctx.session?.user?.email || "",
        name: ctx.session?.user?.name || "",
        paymentMethod,
        purpose: PaymentPurpose.MEMBERSHIP,
        gateway: gatewayEnum,
        cryptoCurrency: input.gateway === "crypto" ? "USDT" : undefined,
        metadata: {
          packageId: input.packageId,
          purpose: PaymentPurpose.MEMBERSHIP,
          fulfillmentType: PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP,
          selectedPalliative: input.selectedPalliative,
          userId,
          callbackUrl,
          originalAmount: input.originalAmount,
          originalCurrency: input.originalCurrency,
          originalTotalUsd: input.originalTotalUsd,
        },
      });

      if (!payment.success) {
        throw new Error(payment.error || payment.message || "Failed to initiate payment");
      }

      const paymentRef = payment.transactionId || payment.reference || payment.gatewayReference || `MEM-${input.gateway}-${Date.now()}`;

      // Create pending membership payment records for reconciliation
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "MEMBERSHIP_PAYMENT",
          amount: -totalCost,
          description: `${membershipPackage.name} membership via ${input.gateway}`,
          status: "pending",
          reference: paymentRef,
          walletType: "main",
        },
      });

      await prisma.pendingPayment.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "MEMBERSHIP",
          amount: totalCost,
          currency: "NGN",
          paymentMethod,
          gatewayReference: paymentRef,
          status: "pending",
          metadata: {
            packageId: input.packageId,
            selectedPalliative: input.selectedPalliative,
            purpose: PaymentPurpose.MEMBERSHIP,
            fulfillmentType: PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP,
            provider: payment.metadata?.provider,
            cryptoCurrency: payment.metadata?.cryptoCurrency,
            cryptoNetwork: payment.metadata?.cryptoNetwork,
            amountCrypto: payment.metadata?.amountCrypto,
            address: payment.metadata?.address,
            qrCode: payment.metadata?.qrCode,
            paymentFlow: payment.metadata?.paymentFlow,
            addressSource: payment.metadata?.addressSource,
            addressFormat: payment.metadata?.addressFormat,
            providerNetworkExact: payment.metadata?.providerNetworkExact,
            networkInstruction: payment.metadata?.networkInstruction,
            basqetAudit: payment.metadata?.basqetAudit,
          },
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        gateway: input.gateway,
        paymentUrl: payment.paymentUrl,
        reference: paymentRef,
        cryptoDetails: payment.metadata,
      };
    }),

  // Verify and activate membership after external payment
  verifyMembershipPayment: protectedProcedure
    .input(z.object({
      gateway: z.nativeEnum(PaymentGateway),
      reference: z.string(),
      packageId: z.string().optional(),
      selectedPalliative: z.enum(["car", "house", "land", "business", "solar", "education"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const verification = await PaymentProcessor.verifyPayment(input.gateway, input.reference);
      const successStates = [PaymentStatus.SUCCESS, PaymentStatus.SUCCESSFUL];

      if (!verification.success || (verification.status && !successStates.includes(verification.status))) {
        throw new Error(verification.error || verification.message || "Payment verification failed");
      }

      // Check if already processed (webhook may have auto-approved already)
      const alreadyProcessed = await prisma.pendingPayment.findFirst({
        where: {
          userId,
          gatewayReference: input.reference,
          transactionType: "MEMBERSHIP",
          status: { in: ["approved", "completed"] },
        },
      });

      if (alreadyProcessed) {
        console.log("[MEMBERSHIP] Payment already auto-approved by webhook, skipping duplicate activation:", input.reference);
        return {
          success: true,
          message: "Membership already activated",
          reference: input.reference,
        };
      }

      const pending = await prisma.pendingPayment.findFirst({
        where: {
          userId,
          gatewayReference: input.reference,
          transactionType: "MEMBERSHIP",
          status: { in: ["pending", "processing"] },
        },
      });

      const pendingMetadata = (pending?.metadata as Record<string, any> | undefined) || {};

      const packageId = pendingMetadata.packageId || input.packageId;
      const selectedPalliative = pendingMetadata.selectedPalliative || input.selectedPalliative;

      if (!packageId) {
        throw new Error("Package ID is required to complete membership activation.");
      }

      const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
      if (!membershipPackage) {
        throw new Error("Membership package not found.");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { country: true, state: true },
      });

      const totalCost = membershipPackage.price + membershipPackage.vat;
      if (verification.amount && Math.abs(verification.amount - totalCost) > 5) {
        console.warn("[WARN] [MEMBERSHIP] Verification amount mismatch", {
          expected: totalCost,
          verified: verification.amount,
          reference: input.reference,
        });
      }

      await activateMembershipAfterExternalPayment({
        prisma,
        userId,
        packageId,
        selectedPalliative,
        paymentReference: input.reference,
        paymentMethodLabel: input.gateway,
        activatorName: ctx.session?.user?.name || ctx.session?.user?.email || "Member",
      });
      invalidateActiveMembershipCache(userId);

      if (pending) {
        await prisma.pendingPayment.update({
          where: { id: pending.id },
          data: {
            status: "completed",
            reviewedBy: userId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...pendingMetadata,
                verification: {
                  status: verification.status,
                  amount: verification.amount,
                  reference: verification.reference,
                  transactionId: verification.transactionId,
                  gatewayReference: verification.gatewayReference,
                  metadata: verification.metadata,
                  message: verification.message,
                },
            },
          },
        });
      }

      await prisma.transaction.updateMany({
        where: {
          userId,
          reference: input.reference,
          transactionType: "MEMBERSHIP_PAYMENT",
        },
        data: { status: "completed" },
      });

      await recordRevenue(prisma, {
        source: "MEMBERSHIP_REGISTRATION",
        amount: computeProfitFiat({
          profitMode: ((membershipPackage.profitMode ?? "PERCENT") as any) as "PERCENT" | "FIXED" | "HYBRID",
          profitPercent: Number(membershipPackage.profitPercent ?? 1),
          profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
          baseFiat: Number(membershipPackage.price ?? 0),
        }),
        currency: "NGN",
        sourceId: `MEMBERSHIP_REGISTRATION:${input.reference}`,
        description: `Membership purchase: ${membershipPackage.name}`,
        userId,
        packageId: membershipPackage.id,
        programType: "MEMBERSHIP",
        country: user?.country ?? undefined,
        state: user?.state ?? undefined,
        region: getNigerianRegion(user?.state),
        metadata: {
          totalPaid: totalCost,
          basePrice: membershipPackage.price,
          vat: membershipPackage.vat,
          paymentMethod: input.gateway,
          selectedPalliative: selectedPalliative ?? null,
          verificationAmount: verification.amount ?? null,
          verificationReference: verification.reference ?? null,
        },
      });

      return {
        success: true,
        message: `${membershipPackage.name} activated successfully`,
        reference: input.reference,
      };
    }),

  // Mock Payment Gateway for Testing
  processMockPayment: protectedProcedure
    .input(z.object({ 
      packageId: z.string(),
      selectedPalliative: z.enum(["car", "house", "land", "business", "solar", "education"]).optional(),
      paymentMethod: z.enum(['wallet', 'mock']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      assertMockPaymentsAllowed("Mock membership payments are not enabled in this environment.");
      const userId = (ctx.session.user as any).id;
      const { packageId, selectedPalliative, paymentMethod = 'mock' } = input;

      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: packageId },
      });

      if (!membershipPackage) {
        throw new Error("Membership package not found.");
      }

      const addonPackages = [
        "Travel & Tour Agent",
        "Basic Early Retirement",
        "Child Educational/Vocational Support",
      ];
      const isAddonPackage = addonPackages.includes(membershipPackage.name);

      let totalCost = membershipPackage.price + membershipPackage.vat;

      if (isAddonPackage) {
        const regularPlusPackage = await prisma.membershipPackage.findFirst({
          where: { name: "Regular Plus" },
        });

        if (regularPlusPackage) {
          const regularPlusTotal = regularPlusPackage.price + regularPlusPackage.vat;
          const currentMembership = await prisma.user.findUnique({
            where: { id: userId },
            select: { activeMembershipPackageId: true },
          });

          if (currentMembership?.activeMembershipPackageId) {
            const currentPackage = await prisma.membershipPackage.findUnique({
              where: { id: currentMembership.activeMembershipPackageId },
              select: { price: true, vat: true },
            });

            const currentTotal = (currentPackage?.price || 0) + (currentPackage?.vat || 0);
            if (currentTotal >= regularPlusTotal) {
              totalCost = Math.max(0, totalCost - regularPlusTotal);
            }
          }
        }
      }

      // If payment method is wallet, check balance and deduct
      if (paymentMethod === 'wallet') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { wallet: true }
        });

        if (!user) {
          throw new Error("User not found.");
        }

        if (user.wallet < totalCost) {
          throw new Error(`Insufficient wallet balance. You have NGN ${user.wallet.toLocaleString()} but need NGN ${totalCost.toLocaleString()}`);
        }

        // Deduct from wallet
        await prisma.user.update({
          where: { id: userId },
          data: { wallet: { decrement: totalCost } }
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_PAYMENT",
            amount: -totalCost,
            description: `${membershipPackage.name} membership activation via wallet`,
            status: "completed",
            reference: `MEM-WALLET-${Date.now()}`,
            walletType: 'main',
          }
        });
      }

      // Determine palliative tier based on package price
      const palliativeTier = getPalliativeTier(membershipPackage.price);
      const isHighTier = isHighTierPackage(membershipPackage.name);

      // Validate palliative selection for high-tier packages
      if (isHighTier && !selectedPalliative) {
        throw new Error("Please select a palliative option for your membership tier.");
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set membership activation and expiry dates
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt);
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year

      // Get the referral chain (L1 to L4)
      const referralChain = await getReferralChain(userId, 4);

      // Track distributed amounts for transaction history
      const distributions: Array<{
        referrerId: string;
        level: number;
        cash: number;
        palliative: number;
        bpt: number;
        cashback: number;
      }> = [];

      // Distribute rewards to referrers
      for (let i = 0; i < referralChain.length; i++) {
        const referrer = referralChain[i];
        const level = (i + 1) as 1 | 2 | 3 | 4;

        const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
        const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
        const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
        const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;

        // Get referrer's palliative tier to route palliative rewards correctly
        const referrerData = await prisma.user.findUnique({
          where: { id: referrer.id },
          select: { 
            palliativeActivated: true, 
            selectedPalliative: true,
            palliativeTier: true,
            isShelter: true,
            shelter: true,
          },
        });

        // Build update data object
        const updateData: any = {};
        if (cashReward > 0) updateData.wallet = { increment: cashReward };
        
        // Shelter-active users: palliative rewards go directly to palliative wallet
        const hasShelter = (referrerData?.isShelter === 1) || ((referrerData?.shelter ?? 0) > 0);
        
        // Route palliative rewards based on referrer's shelter/activation status
        if (palliativeReward > 0) {
          if (hasShelter) {
            // Shelter active — deposit directly to palliative wallet, bypass journey
            updateData.palliative = { increment: palliativeReward };
          } else if (referrerData?.palliativeActivated && referrerData.selectedPalliative) {
            // Activated: Route to specific palliative wallet
            const walletField = getWalletFieldName(referrerData.selectedPalliative as any);
            updateData[walletField] = { increment: palliativeReward };
          } else if (referrerData?.palliativeTier === "lower") {
            // Lower tier not activated: Route to pooling wallet
            updateData.palliative = { increment: palliativeReward };
          } else {
            // Fallback to old palliative wallet for users without tier set
            updateData.palliative = { increment: palliativeReward };
          }
        }
        
        if (cashbackReward > 0) updateData.cashback = { increment: cashbackReward };

        // Update referrer wallets
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: referrer.id },
            data: updateData,
          });
        }

        // Distribute BPT rewards using the 50/50 split service
        let userBptShare = 0;
        if (bptReward > 0) {
          const bptResult = await distributeBptReward(
            referrer.id, 
            bptReward, 
            `REFERRAL_L${level}`,
            `Referral reward L${level} from ${membershipPackage.name} activation`
          );
          userBptShare = bptResult.userBptUnits;
        }

        // Create separate transaction records for each wallet type
        const timestamp = Date.now();
        const activatorName = ctx.session.user.name || 'New Member';

        // Main wallet transaction
        if (cashReward > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrer.id,
              transactionType: `REFERRAL_CASH_L${level}`,
              amount: cashReward,
              description: `L${level} Cash Wallet referral reward from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${userId})`,
              status: "completed",
              reference: `REF-CASH-${packageId}-L${level}-${timestamp}`,
            }
          });
        }

        // Palliative wallet transaction
        if (palliativeReward > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrer.id,
              transactionType: `REFERRAL_PALLIATIVE_L${level}`,
              amount: palliativeReward,
              description: `L${level} Palliative Wallet referral reward from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${userId})`,
              status: "completed",
              reference: `REF-PAL-${packageId}-L${level}-${timestamp}`,
            }
          });
        }

        // Cashback wallet transaction
        if (cashbackReward > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrer.id,
              transactionType: `REFERRAL_CASHBACK_L${level}`,
              amount: cashbackReward,
              description: `L${level} Cashback Wallet referral reward from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${userId})`,
              status: "completed",
              reference: `REF-CB-${packageId}-L${level}-${timestamp}`,
            }
          });
        }

        // BPT wallet transaction (user's 50% only)
        if (userBptShare > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrer.id,
              transactionType: `REFERRAL_BPT_L${level}`,
              amount: userBptShare,
              description: `L${level} BPT referral reward (50% user share) from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${userId})`,
              status: "completed",
              reference: `REF-BPT-${packageId}-L${level}-${timestamp}`,
              walletType: 'bpiToken',
            }
          });
        }

        // Track for summary
        distributions.push({
          referrerId: referrer.id,
          level,
          cash: cashReward,
          palliative: palliativeReward,
          bpt: bptReward,
          cashback: cashbackReward,
        });

        // Send notification to referrer
        await notifyReferralReward(
          referrer.id,
          activatorName,
          `${membershipPackage.name} (L${level}) referral reward`,
          cashReward + palliativeReward + bptReward + cashbackReward
        );
      }
      
      // Check if package includes MYNGUL Social Media benefit
      const myngulPackages = ["Gold Plus", "Platinum Plus", "Travel & Tour Agent", "Basic Early Retirement", "Child Educational / Vocational Support"];
      const includesMyngul = myngulPackages.includes(membershipPackage.name);
      const MYNGUL_CREDIT = 11000;
      let activationPin = null;

      // Check if this is a composite package
      if (isCompositePackage(membershipPackage.name)) {
        // Process composite package (Regular Plus + specialized wallet + Myngul)
        const compositeResult = await processCompositePackagePurchase({
          prisma,
          userId,
          packageName: membershipPackage.name,
          packageId,
          totalPaid: totalCost,
          referralDistributions: distributions,
          paymentReference: `COMPOSITE-${packageId}-${Date.now()}`,
        });

        // Send activation notification
        await notifyMembershipActivation(userId, membershipPackage.name, compositeResult.expiresAt);

        // Return composite package success response
        return {
          success: true,
          message: `${membershipPackage.name} package activated successfully! MYNGUL Activation PIN: ${compositeResult.myngulPin}`,
          expiresAt: compositeResult.expiresAt,
          distributions,
          totalDistributed: distributions.reduce((sum, d) => sum + d.cash + d.palliative + d.bpt + d.cashback, 0),
          myngulActivated: true,
          myngulPin: compositeResult.myngulPin,
          myngulCredit: MYNGUL_CREDIT,
          compositePackage: {
            membershipActivated: compositeResult.membershipPackageActivated,
            specializedWallet: compositeResult.specializedWalletCredited,
          }
        };
      }

      // Standard package processing continues below...

      // Generate activation PIN and credit social media wallet for MYNGUL packages
      if (includesMyngul) {
        // Generate a simple 8-digit PIN
        activationPin = `BPI-${Date.now().toString().slice(-8)}`;
        
        // Credit social media wallet
        await prisma.user.update({
          where: { id: userId },
          data: {
            socialMedia: { increment: MYNGUL_CREDIT },
            myngulActivationPin: activationPin,
          },
        });

        // Create transaction for social media credit
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MYNGUL_ACTIVATION",
            amount: MYNGUL_CREDIT,
            description: `MYNGUL Social Media Wallet Credit - ${membershipPackage.name} Activation`,
            status: "completed",
            reference: `MYNGUL-ACT-${packageId}-${Date.now()}`,
          },
        });
      }

      // Prepare palliative activation data
      const palliativeData: any = {
        palliativeTier,
      };

      if (isHighTier && selectedPalliative) {
        // High tier: Instant activation with selected palliative
        palliativeData.palliativeActivated = true;
        palliativeData.selectedPalliative = selectedPalliative;
        palliativeData.palliativeActivatedAt = activatedAt;
        
        // Create activation record
        await prisma.palliativeWalletActivation.create({
          data: {
            id: randomUUID(),
            userId,
            palliativeType: selectedPalliative,
            membershipTier: membershipPackage.name,
            activationType: "instant",
          },
        });
      } else if (palliativeTier === "lower") {
        // Lower tier: Set up for pooling activation
        palliativeData.palliativeActivated = false;
        palliativeData.palliative = 0;
      }

      const cspCommunityCredit = qualifiesForCspCommunityCredit(membershipPackage.name)
        ? CSP_COMMUNITY_CREDIT_AMOUNT
        : 0;

      // Update the user's active package and membership dates (include CSP credit if eligible)
      await prisma.user.update({
        where: { id: userId },
        data: { 
          activeMembershipPackageId: packageId,
          membershipActivatedAt: activatedAt,
          membershipExpiresAt: expiresAt,
          activated: true,
          ...(cspCommunityCredit > 0 ? { community: { increment: cspCommunityCredit } } : {}),
          ...palliativeData,
        },
      });

      // Create transaction record for the activation
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "MEMBERSHIP_ACTIVATION",
          amount: -(membershipPackage.price + membershipPackage.vat),
          description: `${membershipPackage.name} membership activation (Mock Payment)`,
          status: "completed",
          reference: `MOCK-${packageId}-${Date.now()}`,
        }
      });

      // Record CSP community credit (if applicable)
      if (cspCommunityCredit > 0) {
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "CSP_COMMUNITY_CREDIT",
            amount: cspCommunityCredit,
            description: `${membershipPackage.name} activation CSP community credit`,
            status: "completed",
            reference: `CSP-CREDIT-${packageId}-${Date.now()}`,
            walletType: "community",
          },
        });
      }

      // Create VAT transaction record
      if (membershipPackage.vat > 0) {
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "VAT",
            amount: membershipPackage.vat,
            description: `VAT on ${membershipPackage.name} membership activation`,
            status: "completed",
            reference: `VAT-${packageId}-${Date.now()}`,
          }
        });
      }

      // Send activation notification
      await notifyMembershipActivation(userId, membershipPackage.name, expiresAt);

      return { 
        success: true, 
        message: `${membershipPackage.name} package activated successfully!${includesMyngul ? ` MYNGUL Activation PIN: ${activationPin}` : ''}`,
        expiresAt,
        distributions,
        totalDistributed: distributions.reduce((sum, d) => sum + d.cash + d.palliative + d.bpt + d.cashback, 0),
        myngulActivated: includesMyngul,
        myngulPin: activationPin,
        myngulCredit: includesMyngul ? MYNGUL_CREDIT : 0,
      };
    }),

  activateStandard: protectedProcedure
    .input(z.object({ 
      packageId: z.string(),
      frontendCalculatedCost: z.number().optional() // Frontend cost for validation
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { packageId, frontendCalculatedCost } = input;

      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: packageId },
      });

      if (!membershipPackage) {
        throw new Error("Membership package not found.");
      }

      // COST VALIDATION: Verify frontend-submitted cost matches backend calculation
      const addonPackages = [
        "Travel & Tour Agent",
        "Basic Early Retirement",
        "Child Educational/Vocational Support",
      ];
      const isAddonPackage = addonPackages.includes(membershipPackage.name);

      let backendCalculatedCost = membershipPackage.price + membershipPackage.vat;

      if (isAddonPackage) {
        const regularPlusPackage = await prisma.membershipPackage.findFirst({
          where: { name: "Regular Plus" },
        });

        if (regularPlusPackage) {
          const regularPlusTotal = regularPlusPackage.price + regularPlusPackage.vat;
          const currentMembership = await prisma.user.findUnique({
            where: { id: userId },
            select: { activeMembershipPackageId: true },
          });

          if (currentMembership?.activeMembershipPackageId) {
            const currentPackage = await prisma.membershipPackage.findUnique({
              where: { id: currentMembership.activeMembershipPackageId },
              select: { price: true, vat: true },
            });

            const currentTotal = (currentPackage?.price || 0) + (currentPackage?.vat || 0);

            if (currentTotal >= regularPlusTotal) {
              backendCalculatedCost = Math.max(0, backendCalculatedCost - regularPlusTotal);
            }
          }
        }
      }
      
      if (frontendCalculatedCost !== undefined && frontendCalculatedCost !== null) {
        const tolerance = 0.01; // Allow 1 kobo difference for floating point
        const difference = Math.abs(frontendCalculatedCost - backendCalculatedCost);
        
        if (difference > tolerance) {
          throw new Error(
            `Cost validation failed: Frontend submitted NGN ${frontendCalculatedCost.toLocaleString()} but backend calculated NGN ${backendCalculatedCost.toLocaleString()} ` +
            `(Price: NGN ${membershipPackage.price}, VAT: NGN ${membershipPackage.vat}). ` +
            `Difference: NGN ${difference.toFixed(2)}. This may indicate tampering. Please refresh and try again.`
          );
        }
      }

      // Deduct from wallet (this path is wallet-only; for external gateways use initiateMembershipPayment)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: true },
      });
      if (!user) throw new Error("User not found");
      if ((user.wallet ?? 0) < backendCalculatedCost) {
        throw new Error(
          `Insufficient wallet balance. You have NGN ${(user.wallet ?? 0).toLocaleString()} but need NGN ${backendCalculatedCost.toLocaleString()}.`
        );
      }

      const walletReference = `MEM-STD-${Date.now()}`;
      await prisma.$transaction(async (tx: any) => {
        await tx.user.update({ where: { id: userId }, data: { wallet: { decrement: backendCalculatedCost } } });
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_PAYMENT",
            amount: -backendCalculatedCost,
            description: `${membershipPackage.name} membership via wallet (activateStandard)`,
            status: "completed",
            reference: walletReference,
            walletType: "main",
          },
        });
      });

      // Set membership activation and expiry dates
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt);
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year

      // Get the referral chain (L1 to L4)
      const referralChain = await getReferralChain(userId, 4);

      // Distribute rewards to referrers
      for (let i = 0; i < referralChain.length; i++) {
        const referrer = referralChain[i];
        const level = (i + 1) as 1 | 2 | 3 | 4;

        const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
        const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
        const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
        const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;

        // Build update data object
        const updateData: any = {};
        if (cashReward > 0) updateData.wallet = { increment: cashReward };
        if (palliativeReward > 0) updateData.palliative = { increment: palliativeReward };
        if (cashbackReward > 0) updateData.cashback = { increment: cashbackReward };

        // Update referrer wallets
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: referrer.id },
            data: updateData,
          });
        }

        // Distribute BPT rewards using the 50/50 split service
        if (bptReward > 0) {
          await distributeBptReward(
            referrer.id, 
            bptReward, 
            `REFERRAL_L${level}`,
            `Referral reward L${level} from ${membershipPackage.name} activation`
          );
        }
        
        // Handle shelter rewards for Gold Plus and Platinum Plus (10 levels)
        if (membershipPackage.name === "Gold Plus" || membershipPackage.name === "Platinum Plus") {
          const shelterLevel = level; // L1-L4 only for now
          const shelterAmount = (membershipPackage as any)[`shelter_l${shelterLevel}`];
          
          if (shelterAmount && shelterAmount > 0) {
            // Update shelter wallet
            await prisma.user.update({
              where: { id: referrer.id },
              data: {
                shelter: { increment: shelterAmount }
              }
            });
            
            // Record shelter reward (admin-only visibility)
            await prisma.shelterReward.create({
              data: {
                id: randomUUID(),
                userId: referrer.id,
                level: shelterLevel,
                amount: shelterAmount,
                packageType: membershipPackage.name === "Gold Plus" ? "GOLD_PLUS" : "PLATINUM_PLUS",
                sourceActivationId: packageId,
              }
            });
          }
        }
      }
      
      const cspCommunityCredit = qualifiesForCspCommunityCredit(membershipPackage.name)
        ? CSP_COMMUNITY_CREDIT_AMOUNT
        : 0;

      // Update the user's active package and membership dates
      await prisma.user.update({
        where: { id: userId },
        data: { 
          activeMembershipPackageId: packageId,
          membershipActivatedAt: activatedAt,
          membershipExpiresAt: expiresAt,
          activated: true,
          ...(cspCommunityCredit > 0 ? { community: { increment: cspCommunityCredit } } : {}),
        },
      });

      // Record CSP community credit (if applicable)
      if (cspCommunityCredit > 0) {
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "CSP_COMMUNITY_CREDIT",
            amount: cspCommunityCredit,
            description: `${membershipPackage.name} activation CSP community credit`,
            status: "completed",
            reference: `CSP-CREDIT-${packageId}-${Date.now()}`,
            walletType: "community",
          },
        });
      }

      // Send activation notification
      await notifyMembershipActivation(userId, membershipPackage.name, expiresAt);

      return { 
        success: true, 
        message: `${membershipPackage.name} package activated successfully!`,
        expiresAt 
      };
    }),
  
  activateEmpowerment: protectedProcedure
    .input(z.object({ 
      beneficiaryId: z.string(),
      empowermentType: z.enum(["CHILD_EDUCATION", "VOCATIONAL_SKILL"]),
      gateway: z.enum(["wallet", "paystack", "flutterwave"]).default("wallet"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const sponsorId = (ctx.session.user as any).id;
      const { beneficiaryId, empowermentType, gateway } = input;

      // BENEFICIARY VERIFICATION: Validate beneficiary exists and meets requirements
      const beneficiary = await prisma.user.findUnique({
        where: { id: beneficiaryId },
        select: {
          id: true,
          name: true,
          email: true,
          activated: true,
          EmpowermentPackage_EmpowermentPackage_beneficiaryIdToUser: {
            where: { status: { not: "Completed" } },
            select: { id: true, status: true }
          }
        }
      });

      if (!beneficiary) {
        throw new Error("Beneficiary user not found. Please ensure they have registered on the platform.");
      }

      if (!beneficiary.activated) {
        throw new Error("Beneficiary account is not activated. They must verify their email first.");
      }

      // Check if beneficiary already has an active empowerment package
      if (beneficiary.EmpowermentPackage_EmpowermentPackage_beneficiaryIdToUser.length > 0) {
        const existingPackage = beneficiary.EmpowermentPackage_EmpowermentPackage_beneficiaryIdToUser[0];
        throw new Error(`Beneficiary already has an active empowerment package (Status: ${existingPackage.status}). Only one package per beneficiary is allowed.`);
      }

      // Age verification disabled until dateOfBirth is available in the schema

      // SPONSOR APPROVAL TRACKING: Verify sponsor eligibility
      const sponsor = await prisma.user.findUnique({
        where: { id: sponsorId },
        select: {
          wallet: true,
          email: true,
          name: true,
          activeMembershipPackageId: true,
          EmpowermentPackage_EmpowermentPackage_sponsorIdToUser: {
            where: { status: { not: "Completed" } },
            select: { id: true }
          }
        }
      });

      if (!sponsor) {
        throw new Error("Sponsor not found");
      }

      if (!sponsor.activeMembershipPackageId) {
        throw new Error("You must have an active membership package to sponsor an empowerment package.");
      }

      console.log(`[EMPOWERMENT] Beneficiary verified: ${beneficiary.name} (${beneficiary.email})`);
      console.log(`[EMPOWERMENT] Sponsor approved: Active membership confirmed`);
      
      const PACKAGE_FEE = 330000;
      const VAT = 24750;
      const TOTAL_COST = PACKAGE_FEE + VAT; // NGN 354,750

      if (gateway !== "wallet") {
        const gatewayEnum = gateway === "paystack" ? PaymentGateway.PAYSTACK : PaymentGateway.FLUTTERWAVE;

        const payment = await PaymentProcessor.processPayment({
          amount: TOTAL_COST,
          currency: "NGN",
          userId: sponsorId,
          packageId: "empowerment",
          email: ctx.session?.user?.email || "",
          name: ctx.session?.user?.name || "",
          paymentMethod: gateway,
          purpose: PaymentPurpose.EMPOWERMENT,
          gateway: gatewayEnum,
          metadata: {
            beneficiaryId,
            empowermentType,
            purpose: PaymentPurpose.EMPOWERMENT,
            fulfillmentType: PAYMENT_FULFILLMENT_TYPES.EMPOWERMENT,
            sponsorId,
          },
        });

        if (!payment.success) {
          throw new Error(payment.error || payment.message || "Failed to initiate empowerment payment");
        }

        const paymentRef =
          payment.transactionId || payment.reference || payment.gatewayReference || `EMP-${gateway}-${Date.now()}`;

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId: sponsorId,
            transactionType: "EMPOWERMENT_PACKAGE_FEE",
            amount: -TOTAL_COST,
            description: `Empowerment package fee for ${beneficiary.name} (${beneficiary.email}) via ${gateway}`,
            status: "pending",
            reference: paymentRef,
            walletType: "main",
          },
        });

        await prisma.pendingPayment.create({
          data: {
            id: randomUUID(),
            userId: sponsorId,
            transactionType: "EMPOWERMENT",
            amount: TOTAL_COST,
            currency: "NGN",
            paymentMethod: gateway,
            gatewayReference: paymentRef,
            status: "pending",
            metadata: {
              beneficiaryId,
              empowermentType,
              packageFee: PACKAGE_FEE,
              vat: VAT,
              totalCost: TOTAL_COST,
              purpose: PaymentPurpose.EMPOWERMENT,
              fulfillmentType: PAYMENT_FULFILLMENT_TYPES.EMPOWERMENT,
            },
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          gateway,
          paymentUrl: payment.paymentUrl,
          reference: paymentRef,
          message: "Empowerment payment initialized. Complete payment to activate the package.",
        };
      }

      if ((sponsor.wallet ?? 0) < TOTAL_COST) {
        throw new Error(`Insufficient wallet balance. You need NGN ${TOTAL_COST.toLocaleString()} to activate this empowerment package.`);
      }

      const paymentReference = `EMP-WALLET-${Date.now()}`;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.user.update({
          where: { id: sponsorId },
          data: { wallet: { decrement: TOTAL_COST } },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: sponsorId,
            transactionType: "EMPOWERMENT_PACKAGE_FEE",
            amount: -TOTAL_COST,
            description: `Empowerment package fee for ${beneficiary.name} (${beneficiary.email})`,
            status: "completed",
            reference: paymentReference,
            walletType: "main",
          },
        });
      });

      const { maturityDate } = await finalizeEmpowermentPackage({
        sponsorId,
        beneficiary: {
          id: beneficiary.id,
          name: beneficiary.name,
          email: beneficiary.email,
        },
        empowermentType,
        packageFee: PACKAGE_FEE,
        vat: VAT,
        totalCost: TOTAL_COST,
      });

      return {
        success: true,
        message: "Empowerment package activated successfully. 24-month countdown has begun.",
        maturityDate,
      };
    }),
          getMyEmpowermentPackages: protectedProcedure.query(async ({ ctx }) => {
            const userId = (ctx.session?.user as any)?.id;
            if (!userId) {
              throw new Error("UNAUTHORIZED");
            }

            return await prisma.empowermentPackage.findMany({
              where: {
                OR: [{ sponsorId: userId }, { beneficiaryId: userId }],
              },
              select: {
                id: true,
                sponsorId: true,
                beneficiaryId: true,
                status: true,
                maturityDate: true,
                activatedAt: true,
                approvedAt: true,
                releasedAt: true,
                adminApproved: true,
                isConverted: true,
                fallbackEnabled: true,
                empowermentType: true,
                packageFee: true,
                vat: true,
                grossEmpowermentValue: true,
                netEmpowermentValue: true,
                grossSponsorReward: true,
                netSponsorReward: true,
                User_EmpowermentPackage_sponsorIdToUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                User_EmpowermentPackage_beneficiaryIdToUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { activatedAt: "desc" },
            });
          }),

  // Verify and activate empowerment after external payment
  verifyEmpowermentPayment: protectedProcedure
    .input(z.object({
      gateway: z.nativeEnum(PaymentGateway),
      reference: z.string(),
      beneficiaryId: z.string().optional(),
      empowermentType: z.enum(["CHILD_EDUCATION", "VOCATIONAL_SKILL"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sponsorId = (ctx.session?.user as any)?.id;
      if (!sponsorId) throw new Error("UNAUTHORIZED");

      const verification = await PaymentProcessor.verifyPayment(input.gateway, input.reference);
      const successStates = [PaymentStatus.SUCCESS, PaymentStatus.SUCCESSFUL];

      if (!verification.success || (verification.status && !successStates.includes(verification.status))) {
        throw new Error(verification.error || verification.message || "Payment verification failed");
      }

      const pending = await prisma.pendingPayment.findFirst({
        where: {
          userId: sponsorId,
          gatewayReference: input.reference,
          transactionType: "EMPOWERMENT",
          status: { in: ["pending", "processing"] },
        },
      });

      const pendingMetadata = (pending?.metadata as Record<string, any> | undefined) || {};

      const beneficiaryId = pendingMetadata.beneficiaryId || input.beneficiaryId;
      const empowermentType = (pendingMetadata.empowermentType || input.empowermentType) as
        | "CHILD_EDUCATION"
        | "VOCATIONAL_SKILL"
        | undefined;

      if (!beneficiaryId || !empowermentType) {
        throw new Error("Beneficiary and empowerment type are required to complete verification.");
      }

      const beneficiary = await prisma.user.findUnique({
        where: { id: beneficiaryId },
        select: {
          id: true,
          name: true,
          email: true,
          activated: true,
          EmpowermentPackage_EmpowermentPackage_beneficiaryIdToUser: {
            where: { status: { not: "Completed" } },
            select: { id: true, status: true },
          },
        },
      });

      if (!beneficiary) {
        throw new Error("Beneficiary user not found. Please ensure they have registered on the platform.");
      }

      if (!beneficiary.activated) {
        throw new Error("Beneficiary account is not activated. They must verify their email first.");
      }

      if (beneficiary.EmpowermentPackage_EmpowermentPackage_beneficiaryIdToUser.length > 0) {
        const existingPackage = beneficiary.EmpowermentPackage_EmpowermentPackage_beneficiaryIdToUser[0];
        throw new Error(`Beneficiary already has an active empowerment package (Status: ${existingPackage.status}). Only one package per beneficiary is allowed.`);
      }

      const sponsor = await prisma.user.findUnique({
        where: { id: sponsorId },
        select: {
          activeMembershipPackageId: true,
        },
      });

      if (!sponsor?.activeMembershipPackageId) {
        throw new Error("You must have an active membership package to sponsor an empowerment package.");
      }

      const PACKAGE_FEE = 330000;
      const VAT = 24750;
      const TOTAL_COST = PACKAGE_FEE + VAT;

      if (verification.amount && Math.abs(verification.amount - TOTAL_COST) > 5) {
        console.warn("[WARN] [EMPOWERMENT] Verification amount mismatch", {
          expected: TOTAL_COST,
          verified: verification.amount,
          reference: input.reference,
        });
      }

      const { maturityDate } = await finalizeEmpowermentPackage({
        sponsorId,
        beneficiary: {
          id: beneficiary.id,
          name: beneficiary.name,
          email: beneficiary.email,
        },
        empowermentType,
        packageFee: PACKAGE_FEE,
        vat: VAT,
        totalCost: TOTAL_COST,
      });

      if (pending) {
        await prisma.pendingPayment.update({
          where: { id: pending.id },
          data: {
            status: "completed",
            reviewedBy: sponsorId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...pendingMetadata,
              verification: {
                status: verification.status,
                amount: verification.amount,
                reference: verification.reference,
                transactionId: verification.transactionId,
                gatewayReference: verification.gatewayReference,
                metadata: verification.metadata,
                message: verification.message,
              },
            },
          },
        });
      }

      await prisma.transaction.updateMany({
        where: {
          userId: sponsorId,
          reference: input.reference,
          transactionType: "EMPOWERMENT_PACKAGE_FEE",
        },
        data: { status: "completed" },
      });

      return {
        success: true,
        message: "Empowerment package activated successfully.",
        reference: input.reference,
        maturityDate,
      };
    }),

  renewMembership: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { packageId } = input;

      // 1. Get user's current membership
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          PackageActivation: {
            where: { packageId },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!user || !user.activeMembershipPackageId) {
        throw new Error("No active membership found.");
      }

      // 2. Get the package details
      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: packageId },
      });

      if (!membershipPackage) {
        throw new Error("Membership package not found.");
      }

      if (!membershipPackage.hasRenewal) {
        throw new Error("This package does not support renewal.");
      }

      // 3. Check if membership has expired or is close to expiry
      const now = new Date();
      const expiresAt = user.membershipExpiresAt;
      
      // EARLY RENEWAL PREVENTION: Must be within 30 days of expiration
      if (!expiresAt) {
        throw new Error("No expiration date found. Please contact support.");
      }

      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const RENEWAL_WINDOW_DAYS = 30;
      
      if (daysUntilExpiry > RENEWAL_WINDOW_DAYS) {
        throw new Error(`Membership renewal available ${RENEWAL_WINDOW_DAYS} days before expiration. Your membership expires in ${daysUntilExpiry} days. Please renew after ${new Date(expiresAt.getTime() - RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString()}.`);
      }
      
      console.log(`[RENEWAL] Eligible for renewal: ${daysUntilExpiry} days until expiry`);

      // TODO: Implement actual payment processing
      const renewalFee = membershipPackage.renewalFee || membershipPackage.price;
      const vat = renewalFee * 0.075;
      const totalCost = renewalFee + vat;

      // 4. Calculate new expiry date
      const newExpiresAt = expiresAt && expiresAt > now 
        ? new Date(expiresAt.getTime() + (membershipPackage.renewalCycle * 24 * 60 * 60 * 1000))
        : new Date(now.getTime() + (membershipPackage.renewalCycle * 24 * 60 * 60 * 1000));

      // 5. Get referral chain for renewal rewards
      const referralChain = await getReferralChain(userId, 4);

      // Track total rewards distributed
      let totalCash = 0, totalPalliative = 0, totalBpt = 0, totalCashback = 0;
      let totalHealth = 0, totalMeal = 0, totalSecurity = 0;

      // 6. Distribute renewal rewards to referrers
      for (let i = 0; i < referralChain.length; i++) {
        const referrer = referralChain[i];
        const level = (i + 1) as 1 | 2 | 3 | 4;

        const cashReward = (membershipPackage as any)[`renewal_cash_l${level}`] || 0;
        const palliativeReward = (membershipPackage as any)[`renewal_palliative_l${level}`] || 0;
        const bptReward = (membershipPackage as any)[`renewal_bpt_l${level}`] || 0;
        const cashbackReward = (membershipPackage as any)[`renewal_cashback_l${level}`] || 0;
        const healthReward = (membershipPackage as any)[`renewal_health_l${level}`] || 0;
        const mealReward = (membershipPackage as any)[`renewal_meal_l${level}`] || 0;
        const securityReward = (membershipPackage as any)[`renewal_security_l${level}`] || 0;

        // Build update data
        const updateData: any = {};
        if (cashReward > 0) { updateData.wallet = { increment: cashReward }; totalCash += cashReward; }
        if (palliativeReward > 0) { updateData.palliative = { increment: palliativeReward }; totalPalliative += palliativeReward; }
        if (cashbackReward > 0) { updateData.cashback = { increment: cashbackReward }; totalCashback += cashbackReward; }
        if (healthReward > 0) { updateData.health = { increment: healthReward }; totalHealth += healthReward; }
        if (mealReward > 0) { updateData.meal = { increment: mealReward }; totalMeal += mealReward; }
        if (securityReward > 0) { updateData.security = { increment: securityReward }; totalSecurity += securityReward; }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: referrer.id },
            data: updateData,
          });
        }

        // Distribute BPT rewards
        if (bptReward > 0) {
          await distributeBptReward(
            referrer.id,
            bptReward,
            `RENEWAL_L${level}`,
            `Renewal reward L${level} from ${membershipPackage.name} renewal`
          );
          totalBpt += bptReward;
        }
      }

      // 7. Update user's membership expiry and renewal count
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipExpiresAt: newExpiresAt,
          renewalCount: { increment: 1 },
        },
      });

      // 8. Create renewal history record
      const renewalHistory = await prisma.renewalHistory.create({
        data: {
          id: randomUUID(),
          userId,
          packageId,
          packageName: membershipPackage.name,
          renewalNumber: user.renewalCount + 1,
          renewalFee,
          vat,
          totalPaid: totalCost,
          expiresAt: newExpiresAt,
          cashDistributed: totalCash,
          bptDistributed: totalBpt,
          palliativeDistributed: totalPalliative,
          cashbackDistributed: totalCashback,
          healthDistributed: totalHealth,
          mealDistributed: totalMeal,
          securityDistributed: totalSecurity,
        },
      });

      // Record revenue from membership renewal
      const renewalProfitFiat = computeProfitFiat({
        profitMode: ((membershipPackage.profitMode ?? "PERCENT") as any) as "PERCENT" | "FIXED" | "HYBRID",
        profitPercent: Number(membershipPackage.profitPercent ?? 1),
        profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
        baseFiat: Number(renewalFee ?? 0),
      });
      await recordRevenue(prisma, {
        source: "MEMBERSHIP_RENEWAL",
        amount: renewalProfitFiat,
        currency: "NGN",
        sourceId: `MEMBERSHIP_RENEWAL:${renewalHistory.id}`,
        description: `Membership renewal: ${membershipPackage.name}`,
        userId,
        packageId: membershipPackage.id,
        programType: "MEMBERSHIP_RENEWAL",
        country: (user as any).country ?? undefined,
        state: (user as any).state ?? undefined,
        region: (user as any).region ?? undefined,
        metadata: {
          totalPaid: totalCost,
          renewalFee,
          vat,
          renewalNumber: user.renewalCount + 1,
          renewalHistoryId: renewalHistory.id,
        },
      });

      // Send renewal notification
      await notifyMembershipRenewal(userId, membershipPackage.name, user.renewalCount + 1, newExpiresAt);

      return {
        success: true,
        message: `Membership renewed successfully! Valid until ${newExpiresAt.toLocaleDateString()}`,
        expiresAt: newExpiresAt,
        renewalNumber: user.renewalCount + 1,
      };
    }),

  // Empowerment Package Lifecycle Endpoints
  
  checkEmpowermentMaturity: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      const now = new Date();
      if (empowerment.maturityDate > now) {
        throw new Error("Package has not yet reached maturity (24 months).");
      }

      // Update status to pending maturity
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          status: "Pending Maturity (24 Months)",
        },
      });

      // Create transaction record
      await prisma.empowermentTransaction.create({
        data: {
          id: randomUUID(),
          empowermentPackageId: empowermentId,
          transactionType: "MATURITY",
          grossAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          taxAmount: 0,
          netAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          description: "Package reached 24-month maturity - pending admin approval",
          performedBy: (ctx.session.user as any).id,
        },
      });

      // Notify sponsor, beneficiary, and admins
      await notifyEmpowermentMaturity(empowerment.sponsorId, empowerment.beneficiaryId, empowermentId);
      const sponsor = await prisma.user.findUnique({ where: { id: empowerment.sponsorId } });
      await notifyAdminEmpowermentPending(empowermentId, sponsor?.name || "Unknown");

      return {
        success: true,
        message: "Empowerment package marked as mature. Awaiting admin approval.",
      };
    }),

  approveEmpowerment: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const adminId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      if (empowerment.status !== "Pending Maturity (24 Months)") {
        throw new Error("Package must be at maturity status to approve.");
      }

      const now = new Date();
      const TAX_RATE = 0.075;
      const totalTax = (empowerment.grossEmpowermentValue + empowerment.grossSponsorReward) * TAX_RATE;

      // Update empowerment package
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          adminApproved: true,
          approvedBy: adminId,
          approvedAt: now,
          status: "Approved - Activation Pending",
          totalTaxDeducted: totalTax,
        },
      });

      // Create approval transaction
      await prisma.empowermentTransaction.create({
        data: {
          id: randomUUID(),
          empowermentPackageId: empowermentId,
          transactionType: "APPROVAL",
          grossAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          taxAmount: totalTax,
          netAmount: empowerment.netEmpowermentValue + empowerment.netSponsorReward,
          description: "Admin approved empowerment release - 7.5% tax calculated",
          performedBy: adminId,
        },
      });

      // Notify sponsor and beneficiary
      await notifyEmpowermentApproval(
        empowerment.sponsorId,
        empowerment.beneficiaryId,
        empowerment.netEmpowermentValue,
        empowerment.netSponsorReward
      );

      return {
        success: true,
        message: "Empowerment approved successfully. Ready for fund release.",
        netAmounts: {
          beneficiary: empowerment.netEmpowermentValue,
          sponsor: empowerment.netSponsorReward,
          totalTax,
        },
      };
    }),

  releaseEmpowermentFunds: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const adminId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      if (empowerment.status !== "Approved - Activation Pending") {
        throw new Error("Package must be approved before releasing funds.");
      }

      const now = new Date();

      // Credit beneficiary (education/skill-restricted, non-withdrawable)
      await prisma.user.update({
        where: { id: empowerment.beneficiaryId },
        data: {
          education: { increment: empowerment.netEmpowermentValue },
        },
      });

      // Credit sponsor (fully available)
      await prisma.user.update({
        where: { id: empowerment.sponsorId },
        data: {
          wallet: { increment: empowerment.netSponsorReward },
        },
      });

      // Update empowerment status
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          status: "Empowerment Released (Tax Applied)",
          releasedAt: now,
        },
      });

      // Create release transaction
      await prisma.empowermentTransaction.create({
        data: {
          id: randomUUID(),
          empowermentPackageId: empowermentId,
          transactionType: "RELEASE",
          grossAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          taxAmount: empowerment.totalTaxDeducted,
          netAmount: empowerment.netEmpowermentValue + empowerment.netSponsorReward,
          description: `Released ${empowerment.netEmpowermentValue} to beneficiary (education wallet), ${empowerment.netSponsorReward} to sponsor`,
          performedBy: adminId,
        },
      });

      // Notify sponsor and beneficiary of fund release
      await notifyEmpowermentRelease(
        empowerment.sponsorId,
        empowerment.beneficiaryId,
        empowerment.netEmpowermentValue,
        empowerment.netSponsorReward
      );

      return {
        success: true,
        message: "Empowerment funds released successfully!",
        released: {
          beneficiary: empowerment.netEmpowermentValue,
          sponsor: empowerment.netSponsorReward,
        },
      };
    }),

  triggerFallbackProtection: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const adminId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      // Verify 24 months have passed
      const now = new Date();
      if (empowerment.maturityDate > now) {
        throw new Error("Fallback can only be triggered after 24-month maturity.");
      }

      // Calculate fallback amounts
      const fallbackGross = empowerment.fallbackGrossAmount;
      const fallbackNet = empowerment.fallbackNetAmount;
      const taxAmount = fallbackGross - fallbackNet;

      // Credit sponsor's wallet with fallback amount
      await prisma.user.update({
        where: { id: empowerment.sponsorId },
        data: {
          wallet: { increment: fallbackNet },
        },
      });

      // Update empowerment package
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          fallbackEnabled: true,
          status: "Fallback Protection Activated",
          totalTaxDeducted: taxAmount,
        },
      });

      // Create fallback transaction
      await prisma.empowermentTransaction.create({
        data: {
          id: randomUUID(),
          empowermentPackageId: empowermentId,
          transactionType: "FALLBACK",
          grossAmount: fallbackGross,
          taxAmount,
          netAmount: fallbackNet,
          description: "Fallback protection activated - Insurance-backed refund released to sponsor",
          performedBy: adminId,
        },
      });

      return {
        success: true,
        message: "Fallback protection activated successfully.",
        fallbackAmount: fallbackNet,
      };
    }),

  // ─── Outcome & Tranche Release Engine (spec v2) ──────────────────────────────

  /**
   * Admin sets the empowerment outcome (Full Approval / Partial Decline / Full Decline).
   * This replaces the old binary approveEmpowerment for new packages.
   * - Full Decline: refund + configurable interest to sponsor Cash Wallet; CSP waiver activated
   * - Partial Decline: credit portion to beneficiary education wallet; reduced sponsor reward; CSP waiver
   * - Full Approval: outcome recorded; staged tranche releases follow via releaseEmpowermentTranche
   */
  setEmpowermentOutcome: protectedProcedure
    .input(
      z.object({
        empowermentId: z.string(),
        outcomeType: z.enum([
          "FULL_APPROVAL",
          "PARTIAL_DECLINE_50",
          "PARTIAL_DECLINE_75",
          "PARTIAL_DECLINE_OTHER",
          "FULL_DECLINE",
        ]),
        customCreditPct: z.number().min(1).max(99).optional(), // only for PARTIAL_DECLINE_OTHER
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || (userRole !== "admin" && userRole !== "super_admin")) throw new Error("UNAUTHORIZED - Admin only");
      const adminId = (ctx.session.user as any).id;
      const { empowermentId, outcomeType, customCreditPct, notes } = input;

      const pkg = await prisma.empowermentPackage.findUnique({ where: { id: empowermentId } });
      if (!pkg) throw new Error("Empowerment package not found.");
      if (pkg.outcomeType) throw new Error("Outcome has already been set for this package.");

      // Validate PARTIAL_DECLINE_OTHER requires custom percent
      if (outcomeType === "PARTIAL_DECLINE_OTHER" && !customCreditPct) {
        throw new Error("customCreditPct is required for PARTIAL_DECLINE_OTHER.");
      }

      // ── Load configurable values from AdminSettings ──────────────────────────
      const refundInterestRate = await getAdminSetting("empowerment:refund_interest_rate", 0.15);
      const cspThreshold       = await getAdminSetting("empowerment:csp_min_threshold", 300000);
      const sponsorPct50       = await getAdminSetting("empowerment:sponsor_reward_pct_50", 0.10);
      const sponsorPct75       = await getAdminSetting("empowerment:sponsor_reward_pct_75", 0.05);
      const sponsorPctOther    = await getAdminSetting("empowerment:sponsor_reward_pct_other", 0.05);
      const TAX_RATE           = pkg.taxRate / 100;

      const now = new Date();
      let creditedPercent   = 0;
      let creditedGross     = 0;
      let creditedNet       = 0;
      let sponsorReward     = 0;
      let cspWaiverEnabled  = false;

      // ── Compute credited amounts by outcome ──────────────────────────────────
      if (outcomeType === "PARTIAL_DECLINE_50") {
        creditedPercent = 50;
        creditedGross   = pkg.grossEmpowermentValue * 0.5;
        creditedNet     = creditedGross * (1 - TAX_RATE);
        sponsorReward   = creditedNet * sponsorPct50;
        cspWaiverEnabled = true;
      } else if (outcomeType === "PARTIAL_DECLINE_75") {
        creditedPercent = 25;
        creditedGross   = pkg.grossEmpowermentValue * 0.25;
        creditedNet     = creditedGross * (1 - TAX_RATE);
        sponsorReward   = creditedNet * sponsorPct75;
        cspWaiverEnabled = true;
      } else if (outcomeType === "PARTIAL_DECLINE_OTHER") {
        creditedPercent = customCreditPct!;
        creditedGross   = pkg.grossEmpowermentValue * (creditedPercent / 100);
        creditedNet     = creditedGross * (1 - TAX_RATE);
        sponsorReward   = creditedNet * sponsorPctOther;
        cspWaiverEnabled = true;
      } else if (outcomeType === "FULL_DECLINE") {
        // Refund subscription fee + interest to sponsor Cash Wallet
        creditedPercent  = 0;
        creditedGross    = 0;
        creditedNet      = 0;
        sponsorReward    = 0;
        cspWaiverEnabled = true;
      } else {
        // FULL_APPROVAL — no immediate credit; tranches follow
        creditedPercent  = 100;
        creditedGross    = pkg.grossEmpowermentValue;
        creditedNet      = pkg.netEmpowermentValue;
        cspWaiverEnabled = false;
      }

      const taxAmount = creditedGross - creditedNet;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // ── Full Decline: refund + interest ────────────────────────────────────
        if (outcomeType === "FULL_DECLINE") {
          const refundBase     = pkg.packageFee;
          const interest       = refundBase * refundInterestRate;
          const totalRefund    = refundBase + interest;
          await tx.user.update({
            where: { id: pkg.sponsorId },
            data: { wallet: { increment: totalRefund } },
          });
          await tx.empowermentTransaction.create({
            data: {
              id: randomUUID(), empowermentPackageId: empowermentId,
              transactionType: "FULL_DECLINE_REFUND",
              grossAmount: totalRefund, taxAmount: 0, netAmount: totalRefund,
              description: `Full Decline — refund ₦${refundBase.toLocaleString()} + ${(refundInterestRate * 100).toFixed(0)}% interest = ₦${totalRefund.toLocaleString()} to sponsor Cash Wallet`,
              performedBy: adminId,
            },
          });
        }

        // ── Partial Decline: credit education wallet + sponsor reward ──────────
        if (["PARTIAL_DECLINE_50", "PARTIAL_DECLINE_75", "PARTIAL_DECLINE_OTHER"].includes(outcomeType)) {
          await tx.user.update({
            where: { id: pkg.beneficiaryId },
            data: { education: { increment: creditedNet } },
          });
          if (sponsorReward > 0) {
            await tx.user.update({
              where: { id: pkg.sponsorId },
              data: { wallet: { increment: sponsorReward } },
            });
          }
          await tx.empowermentTransaction.create({
            data: {
              id: randomUUID(), empowermentPackageId: empowermentId,
              transactionType: "PARTIAL_DECLINE_CREDIT",
              grossAmount: creditedGross, taxAmount, netAmount: creditedNet,
              description: `Partial Decline (${creditedPercent}%) — ₦${creditedNet.toLocaleString()} credited to beneficiary education wallet`,
              performedBy: adminId,
            },
          });
          if (sponsorReward > 0) {
            await tx.empowermentTransaction.create({
              data: {
                id: randomUUID(), empowermentPackageId: empowermentId,
                transactionType: "SPONSOR_REWARD",
                grossAmount: sponsorReward, taxAmount: 0, netAmount: sponsorReward,
                description: `Sponsor reward for ${outcomeType} — ₦${sponsorReward.toLocaleString()} to Cash Wallet`,
                performedBy: adminId,
              },
            });
          }
        }

        // ── Auto-upgrade beneficiary to Regular Plus (all outcomes except Full Approval first tranche) ──
        const shouldUpgradeNow = outcomeType !== "FULL_APPROVAL";

        // ── Update package ────────────────────────────────────────────────────
        await tx.empowermentPackage.update({
          where: { id: empowermentId },
          data: {
            outcomeType,
            creditedPercent,
            cspWaiverEnabled,
            refundInterestRate,
            sponsorRewardPaid:   outcomeType !== "FULL_APPROVAL" && sponsorReward > 0,
            sponsorRewardAmount: outcomeType !== "FULL_APPROVAL" ? sponsorReward : 0,
            beneficiaryUpgraded: shouldUpgradeNow,
            outcomeSetAt: now,
            outcomeSetBy: adminId,
            adminApproved: true,
            approvedBy: adminId,
            approvedAt: now,
            walletCreditAmount: creditedNet,
            rejectionReason: notes ?? null,
            status:
              outcomeType === "FULL_APPROVAL"         ? "Full Approval — Pending Tranche Release" :
              outcomeType === "FULL_DECLINE"          ? "Full Decline — Refund Processed" :
              `Partial Decline (${creditedPercent}%) — Funds Released`,
          },
        });
      });

      // ── Post-transaction notifications ────────────────────────────────────
      await notifyEmpowermentOutcomeSet(pkg.sponsorId, pkg.beneficiaryId, outcomeType, creditedNet);
      if (cspWaiverEnabled) {
        await notifyEmpowermentCspWaiverActivated(pkg.beneficiaryId, cspThreshold);
      }
      if (sponsorReward > 0 && outcomeType !== "FULL_APPROVAL") {
        await notifyEmpowermentSponsorReward(pkg.sponsorId, sponsorReward, outcomeType);
      }

      return {
        success: true,
        outcomeType,
        creditedPercent,
        creditedNet,
        sponsorReward,
        cspWaiverEnabled,
      };
    }),

  /**
   * Admin releases a percentage tranche for a Full Approval package.
   * - Enforces minimum 20% on tranche #1.
   * - Credits beneficiary education wallet.
   * - Triggers sponsor reward exactly once (first tranche only).
   * - Auto-upgrades beneficiary to Regular Plus on first tranche.
   * - Creates EmpowermentTranche ledger entry.
   * - Sets status to "Full Approval Completed" when 100% reached.
   */
  releaseEmpowermentTranche: protectedProcedure
    .input(
      z.object({
        empowermentId: z.string(),
        percent: z.number().min(1).max(100),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || (userRole !== "admin" && userRole !== "super_admin")) throw new Error("UNAUTHORIZED - Admin only");
      const adminId = (ctx.session.user as any).id;
      const { empowermentId, percent, notes } = input;

      const pkg = await prisma.empowermentPackage.findUnique({ where: { id: empowermentId } });
      if (!pkg) throw new Error("Empowerment package not found.");
      if (pkg.outcomeType !== "FULL_APPROVAL") throw new Error("Tranche release only applies to Full Approval packages.");
      if (pkg.totalReleasedPercent >= 100) throw new Error("All funds have already been released.");

      const remainingPercent = 100 - pkg.totalReleasedPercent;
      if (percent > remainingPercent) throw new Error(`Cannot release ${percent}% — only ${remainingPercent}% remains.`);

      // Load config before gate checks so configurable minimums are respected
      const [fullApprovalRewardPct, minFirstTranchePct] = await Promise.all([
        getAdminSetting("empowerment:sponsor_reward_pct_full_approval", 0.20),
        getAdminSetting("empowerment:min_first_tranche_pct", 20),
      ]);

      // Enforce configurable minimum % for first tranche (default 20%)
      const isFirstTranche = pkg.totalReleasedPercent === 0;
      if (isFirstTranche && percent < minFirstTranchePct) {
        throw new Error(`Minimum first release is ${minFirstTranchePct}%. Policy block — no state changes applied.`);
      }

      const TAX_RATE    = pkg.taxRate / 100;
      const grossAmount = pkg.grossEmpowermentValue * (percent / 100);
      const taxAmount   = grossAmount * TAX_RATE;
      const netAmount   = grossAmount - taxAmount;
      const sponsorRewardGross = isFirstTranche && !pkg.sponsorRewardPaid
        ? pkg.grossEmpowermentValue * fullApprovalRewardPct
        : 0;
      const sponsorRewardNet = sponsorRewardGross * (1 - TAX_RATE);

      const newReleasedPercent = pkg.totalReleasedPercent + percent;
      const newReleasedAmount  = pkg.totalReleasedAmount  + netAmount;
      const isComplete         = newReleasedPercent >= 100;

      // Count existing tranches for trancheNumber
      const trancheCount = await prisma.empowermentTranche.count({ where: { empowermentPackageId: empowermentId } });
      const trancheNumber = trancheCount + 1;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Credit beneficiary education wallet
        await tx.user.update({
          where: { id: pkg.beneficiaryId },
          data: { education: { increment: netAmount } },
        });

        // Sponsor reward on first tranche only
        if (isFirstTranche && sponsorRewardNet > 0) {
          await tx.user.update({
            where: { id: pkg.sponsorId },
            data: { empowermentSponsorReward: { increment: sponsorRewardNet } },
          });
          await tx.empowermentTransaction.create({
            data: {
              id: randomUUID(), empowermentPackageId: empowermentId,
              transactionType: "SPONSOR_REWARD",
              grossAmount: sponsorRewardGross, taxAmount: sponsorRewardGross - sponsorRewardNet, netAmount: sponsorRewardNet,
              description: `Full Approval sponsor reward (${(fullApprovalRewardPct * 100).toFixed(0)}% of total value) — triggered once at first tranche`,
              performedBy: adminId,
            },
          });
        }

        // Auto-upgrade beneficiary on first tranche (tracked via beneficiaryUpgraded flag on package)

        // Create tranche ledger entry
        await tx.empowermentTranche.create({
          data: {
            id: randomUUID(),
            empowermentPackageId: empowermentId,
            trancheNumber,
            percent,
            grossAmount,
            netAmount,
            taxAmount,
            performedBy: adminId,
            notes: notes ?? null,
          },
        });

        // Create release transaction
        await tx.empowermentTransaction.create({
          data: {
            id: randomUUID(), empowermentPackageId: empowermentId,
            transactionType: "TRANCHE_RELEASE",
            grossAmount, taxAmount, netAmount,
            description: `Tranche #${trancheNumber} released — ${percent}% (₦${netAmount.toLocaleString()} net to beneficiary education wallet)`,
            performedBy: adminId,
          },
        });

        // Update package rolling totals
        await tx.empowermentPackage.update({
          where: { id: empowermentId },
          data: {
            totalReleasedPercent: newReleasedPercent,
            totalReleasedAmount:  newReleasedAmount,
            sponsorRewardPaid:    isFirstTranche ? true : pkg.sponsorRewardPaid,
            sponsorRewardAmount:  isFirstTranche ? sponsorRewardNet : pkg.sponsorRewardAmount,
            beneficiaryUpgraded:  true,
            releasedAt:           isFirstTranche ? new Date() : pkg.releasedAt,
            status: isComplete ? "Full Approval Completed" : `Full Approval — ${newReleasedPercent}% Released`,
          },
        });
      });

      const remainingAfter = 100 - newReleasedPercent;
      await notifyEmpowermentTrancheReleased(pkg.sponsorId, pkg.beneficiaryId, trancheNumber, netAmount, remainingAfter);
      if (isFirstTranche && sponsorRewardNet > 0) {
        await notifyEmpowermentSponsorReward(pkg.sponsorId, sponsorRewardNet, "FULL_APPROVAL");
      }

      return {
        success: true,
        trancheNumber,
        percent,
        netAmount,
        totalReleasedPercent: newReleasedPercent,
        remainingPercent: remainingAfter,
        isComplete,
        sponsorRewardTriggered: isFirstTranche && sponsorRewardNet > 0,
      };
    }),

  /**
   * Query all tranche release records for a package (release history timeline).
   */
  getEmpowermentTranches: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) throw new Error("UNAUTHORIZED");
      return prisma.empowermentTranche.findMany({
        where: { empowermentPackageId: input.empowermentId },
        orderBy: { trancheNumber: "asc" },
      });
    }),

  /**
   * Admin-only: list all empowerment packages with filters.
   */
  getAdminEmpowermentPackages: protectedProcedure
    .input(
      z.object({
        page:        z.number().min(1).default(1),
        pageSize:    z.number().min(1).max(100).default(20),
        status:      z.string().optional(),
        outcomeType: z.string().optional(),
        search:      z.string().optional(),
        dateFrom:    z.string().optional(),
        dateTo:      z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || (userRole !== "admin" && userRole !== "super_admin")) throw new Error("UNAUTHORIZED - Admin only");

      const { page, pageSize, status, outcomeType, search, dateFrom, dateTo } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (status)      where.status      = { contains: status, mode: "insensitive" };
      if (outcomeType) where.outcomeType = outcomeType;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo)   where.createdAt.lte = new Date(dateTo);
      }
      if (search) {
        where.OR = [
          { User_EmpowermentPackage_sponsorIdToUser:     { name:  { contains: search, mode: "insensitive" } } },
          { User_EmpowermentPackage_beneficiaryIdToUser: { name:  { contains: search, mode: "insensitive" } } },
          { User_EmpowermentPackage_sponsorIdToUser:     { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [packages, total] = await Promise.all([
        prisma.empowermentPackage.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            User_EmpowermentPackage_sponsorIdToUser:     { select: { id: true, name: true, email: true } },
            User_EmpowermentPackage_beneficiaryIdToUser: { select: { id: true, name: true, email: true } },
            EmpowermentTransaction: { orderBy: { createdAt: "desc" }, take: 5 },
            EmpowermentTranche:     { orderBy: { trancheNumber: "asc" } },
          },
        }),
        prisma.empowermentPackage.count({ where }),
      ]);

      return { packages, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  /**
   * Admin: read/write empowerment programme configuration via AdminSettings.
   */
  getEmpowermentConfig: protectedProcedure.query(async ({ ctx }) => {
    const userRole = (ctx.session?.user as any)?.role;
    if (!ctx.session?.user || (userRole !== "admin" && userRole !== "super_admin")) throw new Error("UNAUTHORIZED - Admin only");
    const keys = [
      "empowerment:countdown_months",
      "empowerment:gross_value",
      "empowerment:csp_min_threshold",
      "empowerment:refund_interest_rate",
      "empowerment:min_first_tranche_pct",
      "empowerment:sponsor_reward_pct_full_approval",
      "empowerment:sponsor_reward_pct_50",
      "empowerment:sponsor_reward_pct_75",
      "empowerment:sponsor_reward_pct_other",
    ];
    const rows = await prisma.adminSettings.findMany({ where: { settingKey: { in: keys } } });
    const defaults: Record<string, string> = {
      "empowerment:countdown_months":              "26",
      "empowerment:gross_value":                   "7250000",
      "empowerment:csp_min_threshold":             "300000",
      "empowerment:refund_interest_rate":          "0.15",
      "empowerment:min_first_tranche_pct":         "20",
      "empowerment:sponsor_reward_pct_full_approval": "0.20",
      "empowerment:sponsor_reward_pct_50":         "0.10",
      "empowerment:sponsor_reward_pct_75":         "0.05",
      "empowerment:sponsor_reward_pct_other":      "0.05",
    };
    const result: Record<string, string> = { ...defaults };
    for (const row of rows) result[row.settingKey] = row.settingValue;
    return result;
  }),

  updateEmpowermentConfig: protectedProcedure
    .input(
      z.object({
        // Accepts a flat key-value map matching AdminSettings keys (matches UI config tab)
        values: z.record(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || (userRole !== "admin" && userRole !== "super_admin")) throw new Error("UNAUTHORIZED - Admin only");
      const adminId = (ctx.session.user as any).id;

      const allowedKeys = new Set([
        "empowerment:countdown_months",
        "empowerment:gross_value",
        "empowerment:csp_min_threshold",
        "empowerment:refund_interest_rate",
        "empowerment:min_first_tranche_pct",
        "empowerment:sponsor_reward_pct_full_approval",
        "empowerment:sponsor_reward_pct_50",
        "empowerment:sponsor_reward_pct_75",
        "empowerment:sponsor_reward_pct_other",
      ]);

      const updates = Object.entries(input.values).filter(([key]) => allowedKeys.has(key));
      if (updates.length === 0) return { success: true, updated: 0 };

      await Promise.all(
        updates.map(([key, value]) =>
          prisma.adminSettings.upsert({
            where:  { settingKey: key },
            update: { settingValue: value, updatedAt: new Date() },
            create: { id: randomUUID(), settingKey: key, settingValue: value, description: `Empowerment config: ${key}`, updatedAt: new Date() },
          })
        )
      );

      // TC-10: Audit log — written to general Transaction table to avoid EmpowermentPackage FK constraint
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          transactionType: "EMPOWERMENT_CONFIG_CHANGE",
          amount: 0,
          description: `Admin config updated (${updates.length} key(s)): ${updates.map(([k, v]) => `${k}=${v}`).join(", ")}`,
          status: "completed",
          reference: `CFG-${Date.now()}`,
          walletType: "main",
        },
      }).catch((err) => {
        console.error("[PACKAGE] Failed to write config change audit log:", err instanceof Error ? err.message : err);
      });

      return { success: true, updated: updates.length };
    }),

  convertToRegularPlus: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      if (empowerment.sponsorId !== userId) {
        throw new Error("Only the sponsor can request conversion.");
      }

      if (empowerment.isConverted) {
        throw new Error("Package has already been converted.");
      }

      // Get user's wallet balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      // Find Regular Plus package first to get actual pricing
      const regularPlusPackage = await prisma.membershipPackage.findFirst({
        where: { name: "Regular Plus" },
      });

      if (!regularPlusPackage) {
        throw new Error("Regular Plus package not found.");
      }

      // Calculate actual conversion cost from database
      const CONVERSION_COST = regularPlusPackage.price + regularPlusPackage.vat;
      const COMMUNITY_CREDIT = qualifiesForCspCommunityCredit(regularPlusPackage.name)
        ? CSP_COMMUNITY_CREDIT_AMOUNT
        : 0;

      if (user.wallet < CONVERSION_COST) {
        throw new Error(`Insufficient balance. Need ${CONVERSION_COST} for conversion.`);
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 365);

      // Deduct conversion cost, credit community wallet, activate Regular Plus
      await prisma.user.update({
        where: { id: userId },
        data: {
          wallet: { decrement: CONVERSION_COST },
          community: { increment: COMMUNITY_CREDIT },
          activeMembershipPackageId: regularPlusPackage.id,
          membershipActivatedAt: now,
          membershipExpiresAt: expiresAt,
          activated: true,
        },
      });

      // Update empowerment package
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          isConverted: true,
          convertedAt: now,
          conversionAmount: CONVERSION_COST,
          walletCreditAmount: COMMUNITY_CREDIT,
          status: "Converted to Regular Plus",
        },
      });

      // Create conversion transaction
      await prisma.empowermentTransaction.create({
        data: {
          id: randomUUID(),
          empowermentPackageId: empowermentId,
          transactionType: "CONVERSION",
          grossAmount: CONVERSION_COST,
          taxAmount: 0,
          netAmount: CONVERSION_COST,
          description: `Converted to Regular Plus - ${COMMUNITY_CREDIT} credited to community wallet (restricted)`,
          performedBy: userId,
        },
      });

      // Record CSP community credit for audit
      if (COMMUNITY_CREDIT > 0) {
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "CSP_COMMUNITY_CREDIT",
            amount: COMMUNITY_CREDIT,
            description: `Conversion to Regular Plus CSP community credit`,
            status: "completed",
            reference: `CSP-CREDIT-CONVERSION-${empowermentId}-${Date.now()}`,
            walletType: "community",
          },
        });
      }

      return {
        success: true,
        message: "Successfully converted to Regular Plus membership!",
        communityCredit: COMMUNITY_CREDIT,
        newExpiry: expiresAt,
      };
    }),

  /**
   * Get user's active membership package
   */
  getUserActiveMembership: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    const userId = (ctx.session.user as any).id;

    return getCachedActiveMembership(userId);
  }),

  /**
   * Process membership upgrade
   */
  processUpgradePayment: protectedProcedure
    .input(z.object({ 
      packageId: z.string(),
      currentPackageId: z.string(),
      selectedPalliative: z.enum(["car", "house", "land", "business", "solar", "education"]).optional(),
      paymentMethod: z.enum(['wallet', 'paystack', 'flutterwave', 'crypto', 'mock']).default('wallet'),
      frontendCalculatedCost: z.number().optional(),
      originalAmount: z.number().optional(),
      originalCurrency: z.string().optional(),
      originalTotalUsd: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { packageId, currentPackageId, selectedPalliative, paymentMethod = 'wallet', frontendCalculatedCost } = input;

      // Get both packages
      const newPackage: MembershipPackage | null = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
      const currentPackage: MembershipPackage | null = await prisma.membershipPackage.findUnique({ where: { id: currentPackageId } });

      if (!newPackage || !currentPackage) {
        throw new Error("Package not found.");
      }

      const addonPackages = [
        "Travel & Tour Agent",
        "Basic Early Retirement",
        "Child Educational/Vocational Support",
      ];
      const isAddonPackage = addonPackages.includes(newPackage.name);

      // DOWNGRADE PREVENTION: Ensure user is upgrading, not downgrading
      const currentTotal = currentPackage.price + currentPackage.vat;
      const newTotal = newPackage.price + newPackage.vat;
      
      if (!isAddonPackage) {
        if (newTotal < currentTotal) {
          throw new Error(`Cannot downgrade from ${currentPackage.name} (NGN ${currentTotal.toLocaleString()}) to ${newPackage.name} (NGN ${newTotal.toLocaleString()}). Downgrades are not permitted. Please contact support if you need assistance.`);
        }
        
        if (newTotal === currentTotal) {
          throw new Error(`${newPackage.name} has the same value as your current package (${currentPackage.name}). Please select a higher-tier package.`);
        }
      }

      // Determine if this is a true tier upgrade or a feature bundle add-on
      const isFeatureBundle = !!newPackage.baseMembershipPackageId;
      
      let upgradeCost: number;
      let shouldDistribute: boolean;
      let basePackage: any = null;
      let distributionReason = '';

      if (isAddonPackage) {
        const regularPlusPackage = await prisma.membershipPackage.findFirst({
          where: { name: "Regular Plus" },
        });

        const regularPlusTotal = regularPlusPackage
          ? regularPlusPackage.price + regularPlusPackage.vat
          : null;

        if (regularPlusTotal !== null && currentTotal >= regularPlusTotal) {
          upgradeCost = Math.max(0, newTotal - regularPlusTotal);
          shouldDistribute = false;
          basePackage = regularPlusPackage;
          distributionReason = "Addon package - member already Regular Plus or above, paying addon features cost only";
        } else {
          upgradeCost = newTotal;
          shouldDistribute = true;
          basePackage = regularPlusPackage;
          distributionReason = "Addon package - includes Regular Plus membership for current member";
        }
      } else if (isFeatureBundle) {
        if (!newPackage.baseMembershipPackageId) {
          throw new Error("Base membership package not found.");
        }

        // Feature bundle: Check if user already has the base tier
        basePackage = await prisma.membershipPackage.findUnique({ 
          where: { id: newPackage.baseMembershipPackageId } 
        });
        
        if (!basePackage) {
          throw new Error("Base membership package not found.");
        }

        const baseTotal = basePackage.price + basePackage.vat;

        if (currentTotal >= baseTotal) {
          // User already has base tier or higher: Pay only the difference (bundle features cost)
          upgradeCost = newTotal - baseTotal;
          shouldDistribute = false; // No distribution - they already paid for base tier
          distributionReason = `Addon package - user already has ${currentPackage.name} (>= ${basePackage.name}), paying only addon features cost`;
        } else {
          // User is below base tier: Pay for base upgrade + bundle features
          upgradeCost = newTotal - currentTotal;
          shouldDistribute = true; // Distribution happens for base tier upgrade
          distributionReason = `Addon package - user upgrading from ${currentPackage.name} to ${basePackage.name} base tier + addon features`;
        }
      } else {
        // True tier upgrade: Always pay full difference and distribute
        upgradeCost = newTotal - currentTotal;
        shouldDistribute = true;
        distributionReason = `True tier upgrade from ${currentPackage.name} to ${newPackage.name}`;
      }

      console.log(`\n[UPGRADE] Cost calculation:`, {
        from: currentPackage.name,
        to: newPackage.name,
        isAddon: isAddonPackage || isFeatureBundle,
        baseRequired: basePackage?.name,
        upgradeCost,
        shouldDistribute,
        reason: distributionReason
      });

      // COST VALIDATION: Compare frontend-submitted cost with backend-calculated cost
      if (frontendCalculatedCost !== undefined && frontendCalculatedCost !== null) {
        const tolerance = 0.01; // Allow 1 kobo difference for floating point
        const difference = Math.abs(frontendCalculatedCost - upgradeCost);
        
        if (difference > tolerance) {
          throw new Error(
            `Cost validation failed: Frontend submitted NGN ${frontendCalculatedCost.toLocaleString()} but backend calculated NGN ${upgradeCost.toLocaleString()}. ` +
            `Difference: NGN ${difference.toFixed(2)}. This may indicate tampering. Please refresh and try again.`
          );
        }
      }

      if (paymentMethod === 'wallet') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { wallet: true }
        });

        if (!user) {
          throw new Error("User not found.");
        }

        if (user.wallet < upgradeCost) {
          throw new Error(`Insufficient wallet balance. You have NGN ${user.wallet.toLocaleString()} but need NGN ${upgradeCost.toLocaleString()} for the upgrade.`);
        }

        await prisma.user.update({
          where: { id: userId },
          data: { wallet: { decrement: upgradeCost } }
        });

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_UPGRADE",
            amount: -upgradeCost,
            description: `Upgraded from ${currentPackage.name} to ${newPackage.name} via wallet${shouldDistribute ? ' (with referral distribution)' : ' (no distribution)'}`,
            status: "completed",
            reference: `UPG-WALLET-${Date.now()}`,
            walletType: 'main',
          }
        });
      }

      // Mock gateway (testing only) — no wallet deduction, instant upgrade
      if (paymentMethod === 'mock') {
        assertMockPaymentsAllowed("Mock payments are not enabled in this environment.");

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_UPGRADE",
            amount: -upgradeCost,
            description: `Upgraded from ${currentPackage.name} to ${newPackage.name} via mock payment${shouldDistribute ? ' (with referral distribution)' : ' (no distribution)'}`,
            status: "completed",
            reference: `UPG-MOCK-${Date.now()}`,
            walletType: 'main',
          }
        });
      }

      // Determine palliative tier for new package
      const newPalliativeTier = getPalliativeTier(newPackage.price);
      const isNewHighTier = isHighTierPackage(newPackage.name);

      // Check if user needs to select palliative (upgrading to high tier)
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { palliativeActivated: true, selectedPalliative: true },
      });

      // If upgrading to high tier and palliative not activated yet, require selection
      if (isNewHighTier && !currentUser?.palliativeActivated && !selectedPalliative) {
        throw new Error("Please select a palliative option for your new membership tier.");
      }

      if (upgradeCost <= 0 && !isAddonPackage) {
        throw new Error("Cannot upgrade to a lower or same tier package.");
      }

      // Calculate differential bonuses (new package rewards - old package rewards)
      const bonusDifferences: Record<"l1" | "l2" | "l3" | "l4", { cash: number; palliative: number; bpt: number; cashback: number }> = {
        l1: {
          cash: newPackage.cash_l1 - currentPackage.cash_l1,
          palliative: newPackage.palliative_l1 - currentPackage.palliative_l1,
          bpt: newPackage.bpt_l1 - currentPackage.bpt_l1,
          cashback: (newPackage.cashback_l1 || 0) - (currentPackage.cashback_l1 || 0),
        },
        l2: {
          cash: newPackage.cash_l2 - currentPackage.cash_l2,
          palliative: newPackage.palliative_l2 - currentPackage.palliative_l2,
          bpt: newPackage.bpt_l2 - currentPackage.bpt_l2,
          cashback: (newPackage.cashback_l2 || 0) - (currentPackage.cashback_l2 || 0),
        },
        l3: {
          cash: newPackage.cash_l3 - currentPackage.cash_l3,
          palliative: newPackage.palliative_l3 - currentPackage.palliative_l3,
          bpt: newPackage.bpt_l3 - currentPackage.bpt_l3,
          cashback: (newPackage.cashback_l3 || 0) - (currentPackage.cashback_l3 || 0),
        },
        l4: {
          cash: newPackage.cash_l4 - currentPackage.cash_l4,
          palliative: newPackage.palliative_l4 - currentPackage.palliative_l4,
          bpt: newPackage.bpt_l4 - currentPackage.bpt_l4,
          cashback: (newPackage.cashback_l4 || 0) - (currentPackage.cashback_l4 || 0),
        },
      };

      // Previously blocked upgrades when any referral reward differential was negative.
      // That produced false "downgrade" errors for legitimate paid upgrades where some
      // referral lines are lower. We now allow the upgrade as long as the target package
      // price is higher (checked above via upgradeCost > 0) and let downstream logic
      // handle distributions based on the actual differentials.

      // External gateways: initialize payment and return URL/details without completing upgrade yet
      if (paymentMethod === 'paystack' || paymentMethod === 'flutterwave' || paymentMethod === 'crypto') {
        const gatewayEnum = paymentMethod === 'paystack'
          ? PaymentGateway.PAYSTACK
          : paymentMethod === 'flutterwave'
            ? PaymentGateway.FLUTTERWAVE
            : PaymentGateway.CRYPTO;

        const baseUrl = (await resolveAppBaseUrl()).replace(/\/$/, "");
        const callbackUrl = paymentMethod === 'crypto'
          ? `${baseUrl}/api/webhooks/crypto`
          : `${baseUrl}/api/webhooks/${paymentMethod}/callback`;
        const resolvedPaymentMethod = paymentMethod === 'crypto' ? 'crypto' : paymentMethod;

        const payment = await PaymentProcessor.processPayment({
          amount: upgradeCost,
          currency: "NGN",
          userId,
          packageId,
          email: ctx.session?.user?.email || "",
          name: ctx.session?.user?.name || "",
          paymentMethod: resolvedPaymentMethod,
          purpose: PaymentPurpose.UPGRADE,
          gateway: gatewayEnum,
          cryptoCurrency: paymentMethod === 'crypto' ? 'USDT' : undefined,
          metadata: {
            packageId,
            currentPackageId,
            purpose: PaymentPurpose.UPGRADE,
            fulfillmentType: PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP_UPGRADE,
            userId,
            selectedPalliative,
            upgradeCost,
            shouldDistribute,
            callbackUrl,
            originalAmount: input.originalAmount,
            originalCurrency: input.originalCurrency,
            originalTotalUsd: input.originalTotalUsd,
          },
        });

        if (!payment.success) {
          throw new Error(payment.error || payment.message || "Failed to initiate upgrade payment");
        }

        const paymentRef = payment.transactionId || payment.reference || payment.gatewayReference || `UPG-${paymentMethod}-${Date.now()}`;

        // Pending transaction & payment records for reconciliation
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_UPGRADE",
            amount: -upgradeCost,
            description: `Upgrade to ${newPackage.name} via ${paymentMethod}`,
            status: "pending",
            reference: paymentRef,
            walletType: 'main',
          }
        });

        await prisma.pendingPayment.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MEMBERSHIP_UPGRADE",
            amount: upgradeCost,
            currency: "NGN",
            paymentMethod: resolvedPaymentMethod,
            gatewayReference: paymentRef,
            status: "pending",
            metadata: {
              packageId,
              currentPackageId,
              selectedPalliative,
              purpose: PaymentPurpose.UPGRADE,
              fulfillmentType: PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP_UPGRADE,
              shouldDistribute,
              provider: payment.metadata?.provider,
              cryptoCurrency: payment.metadata?.cryptoCurrency,
              cryptoNetwork: payment.metadata?.cryptoNetwork,
              amountCrypto: payment.metadata?.amountCrypto,
              address: payment.metadata?.address,
              qrCode: payment.metadata?.qrCode,
              paymentFlow: payment.metadata?.paymentFlow,
              addressSource: payment.metadata?.addressSource,
              addressFormat: payment.metadata?.addressFormat,
              providerNetworkExact: payment.metadata?.providerNetworkExact,
              networkInstruction: payment.metadata?.networkInstruction,
              basqetAudit: payment.metadata?.basqetAudit,
            },
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          gateway: paymentMethod,
          paymentUrl: payment.paymentUrl,
          reference: paymentRef,
          message: "Upgrade payment initialized. Complete payment to finalize upgrade.",
          cryptoDetails: payment.metadata,
        };
      }

      // Simulate payment processing for wallet path
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get current membership to preserve remaining time
      const currentMembership = await prisma.user.findUnique({
        where: { id: userId },
        select: { membershipActivatedAt: true, membershipExpiresAt: true }
      });

      // Extend from current expiry if still valid, otherwise start fresh
      const now = new Date();
      const activatedAt = now;
      let expiresAt: Date;
      
      if (currentMembership?.membershipExpiresAt && currentMembership.membershipExpiresAt > now) {
        // Extend from current expiry date
        expiresAt = new Date(currentMembership.membershipExpiresAt);
        expiresAt.setDate(expiresAt.getDate() + 365);
      } else {
        // Membership expired or doesn't exist, start fresh
        expiresAt = new Date(activatedAt);
        expiresAt.setDate(expiresAt.getDate() + 365);
      }

      // Get referral chain
      const referralChain = await getReferralChain(userId, 4);

      // Distribute differential bonuses to referral chain (only if shouldDistribute)
      if (shouldDistribute) {
      console.log(`\n[UPGRADE] Distribution enabled: ${distributionReason}`);
      
      // COMMISSION CAP VALIDATION: Use configured caps (defaults applied)
      const MAX_COMMISSION_L1 = 100000;
      const MAX_COMMISSION_L2 = 50000;
      const MAX_COMMISSION_L3 = 50000;
      const MAX_COMMISSION_L4 = 50000;
      const maxCommissions = [MAX_COMMISSION_L1, MAX_COMMISSION_L2, MAX_COMMISSION_L3, MAX_COMMISSION_L4];

      for (let level = 1; level <= 4; level++) {
        const referrer = referralChain[level - 1];
        const referrerId = typeof referrer === "string" ? referrer : referrer?.id;
        if (!referrerId) continue;

        const levelKey = `l${level}` as 'l1' | 'l2' | 'l3' | 'l4';
        const bonuses = bonusDifferences[levelKey];

        // Only distribute positive differences
        if (bonuses.cash > 0 || bonuses.palliative > 0 || bonuses.bpt > 0 || bonuses.cashback > 0) {
          // CAP CHECK: Ensure commission doesn't exceed max for this level
          const totalCommission = bonuses.cash + bonuses.palliative + bonuses.cashback + bonuses.bpt;
          const maxForLevel = maxCommissions[level - 1];
          
          if (totalCommission > maxForLevel) {
            console.warn(`[WARN] Commission cap exceeded for L${level}: NGN ${totalCommission} > NGN ${maxForLevel}. Capping at max.`);
            const ratio = maxForLevel / totalCommission;
            bonuses.cash = Math.floor(bonuses.cash * ratio);
            bonuses.palliative = Math.floor(bonuses.palliative * ratio);
            bonuses.cashback = Math.floor(bonuses.cashback * ratio);
            bonuses.bpt = Math.floor(bonuses.bpt * ratio);
          }
          // Get referrer's palliative tier to route palliative rewards correctly
          const referrerData = await prisma.user.findUnique({
            where: { id: referrerId },
            select: { 
              palliativeActivated: true, 
              selectedPalliative: true,
              palliativeTier: true,
            },
          });

          const updateData: any = {};
          if (bonuses.cash > 0) updateData.wallet = { increment: bonuses.cash };
          
          // Route palliative rewards based on referrer's activation status
          if (bonuses.palliative > 0) {
            if (referrerData?.palliativeActivated && referrerData.selectedPalliative) {
              // Activated: Route to specific palliative wallet
              const walletField = getWalletFieldName(referrerData.selectedPalliative as any);
              updateData[walletField] = { increment: bonuses.palliative };
            } else if (referrerData?.palliativeTier === "lower") {
              // Lower tier not activated: Route to pooling wallet
              updateData.palliative = { increment: bonuses.palliative };
            } else {
              // Fallback to old palliative wallet for users without tier set
              updateData.palliative = { increment: bonuses.palliative };
            }
          }
          
          if (bonuses.cashback > 0) updateData.cashback = { increment: bonuses.cashback };

          await prisma.user.update({
            where: { id: referrerId },
            data: updateData,
          });

          // Distribute BPT (50% to user, 50% to admin pool)
          if (bonuses.bpt > 0) {
            await distributeBptReward(referrerId, bonuses.bpt);
          }

          // DISTRIBUTED AMOUNT VALIDATION: Verify total matches expected
          const bonusTotal = bonuses.cash + bonuses.palliative + bonuses.cashback + bonuses.bpt;
          const expectedTotal = (newPackage as any)[`cash_l${level}`] - (currentPackage as any)[`cash_l${level}`] +
                                (newPackage as any)[`palliative_l${level}`] - (currentPackage as any)[`palliative_l${level}`] +
                                (newPackage as any)[`bpt_l${level}`] - (currentPackage as any)[`bpt_l${level}`] +
                                ((newPackage as any)[`cashback_l${level}`] || 0) - ((currentPackage as any)[`cashback_l${level}`] || 0);
          
          if (Math.abs(bonusTotal - expectedTotal) > 0.01) {
            console.warn(`[WARN] [VALIDATION] Bonus total mismatch for L${level}: calculated=${bonusTotal}, expected=${expectedTotal}`);
          }

          // Create transaction record
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrerId,
              transactionType: `membership_upgrade_bonus_l${level}`,
              amount: bonusTotal,
              description: `Referral bonus (differential) for ${newPackage.name} upgrade - Level ${level}`,
              status: "completed",
              reference: `UPGRADE-${Date.now()}-L${level}`,
            },
          });
          
          console.log(`  [UPGRADE] L${level} distributed: NGN ${bonusTotal} to referrer ${referrerId.substring(0, 8)}...`);

          // Notify referrer
          await notifyReferralReward(
            referrerId,
            userId,
            `Membership Upgrade Bonus (${newPackage.name}) - L${level}`,
            bonusTotal
          );
        }
      }
      } else {
        console.log(`\n[UPGRADE] Distribution skipped: ${distributionReason}`);
      } // End shouldDistribute check

      // Check if new package includes MYNGUL Social Media benefit
      const myngulPackages = ["Gold Plus", "Platinum Plus", "Travel & Tour Agent", "Basic Early Retirement", "Child Educational / Vocational Support"];
      const newPackageIncludesMyngul = myngulPackages.includes(newPackage.name);
      const currentPackageIncludesMyngul = myngulPackages.includes(currentPackage.name);
      const MYNGUL_CREDIT = 11000;
      let upgradePin = null;

      // If upgrading TO a MYNGUL package from a non-MYNGUL package, credit and generate PIN
      if (newPackageIncludesMyngul && !currentPackageIncludesMyngul) {
        upgradePin = `BPI-UPG-${Date.now().toString().slice(-8)}`;
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            socialMedia: { increment: MYNGUL_CREDIT },
            myngulActivationPin: upgradePin,
          },
        });

        // Create transaction for social media credit
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "MYNGUL_UPGRADE",
            amount: MYNGUL_CREDIT,
            description: `MYNGUL Social Media Wallet Credit - Upgrade to ${newPackage.name}`,
            status: "completed",
            reference: `MYNGUL-UPG-${packageId}-${Date.now()}`,
          },
        });
      }

      // Prepare palliative activation data for upgrade
      const palliativeUpdateData: any = {};
      
      // Update tier information
      palliativeUpdateData.palliativeTier = newPalliativeTier;

      // If upgrading to high tier and not already activated
      if (isNewHighTier && !currentUser?.palliativeActivated && selectedPalliative) {
        const activatedAt = new Date();
        palliativeUpdateData.palliativeActivated = true;
        palliativeUpdateData.selectedPalliative = selectedPalliative;
        palliativeUpdateData.palliativeActivatedAt = activatedAt;
        
        // Create activation record
        await prisma.palliativeWalletActivation.create({
          data: {
            id: randomUUID(),
            userId,
            palliativeType: selectedPalliative,
            membershipTier: newPackage.name,
            activationType: "instant",
          },
        });
        
        // If user had pooled amount in palliative wallet, transfer it to selected wallet
        const userWithPooled = await prisma.user.findUnique({
          where: { id: userId },
          select: { palliative: true },
        });
        
        if (userWithPooled && userWithPooled.palliative > 0) {
          const walletField = getWalletFieldName(selectedPalliative);
          palliativeUpdateData[walletField] = { increment: userWithPooled.palliative };
          palliativeUpdateData.palliative = 0;
          
          // Create transaction for the transfer
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId,
              transactionType: "PALLIATIVE_TRANSFER",
              amount: userWithPooled.palliative,
              description: `Transferred pooled palliative balance to ${selectedPalliative} wallet on upgrade to ${newPackage.name}`,
              status: "completed",
              reference: `PAL-TRANSFER-${Date.now()}`,
            },
          });
        }
      }

      const newQualifiesForCsp = qualifiesForCspCommunityCredit(newPackage.name);
      const currentQualifiesForCsp = qualifiesForCspCommunityCredit(currentPackage.name);
      const cspCommunityCredit = newQualifiesForCsp && !currentQualifiesForCsp ? CSP_COMMUNITY_CREDIT_AMOUNT : 0;

      // Update user's membership
      await prisma.user.update({
        where: { id: userId },
        data: {
          activeMembershipPackageId: packageId,
          membershipActivatedAt: activatedAt,
          membershipExpiresAt: expiresAt,
          ...(cspCommunityCredit > 0 ? { community: { increment: cspCommunityCredit } } : {}),
          ...palliativeUpdateData,
        },
      });

      // Create upgrade transaction for the user
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "membership_upgrade",
          amount: -upgradeCost,
          description: `Upgraded from ${currentPackage.name} to ${newPackage.name}`,
          status: "completed",
          reference: `UPGRADE-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        },
      });

      // Record CSP community credit (if applicable on upgrade)
      if (cspCommunityCredit > 0) {
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "CSP_COMMUNITY_CREDIT",
            amount: cspCommunityCredit,
            description: `Upgrade to ${newPackage.name} CSP community credit`,
            status: "completed",
            reference: `CSP-CREDIT-UPGRADE-${packageId}-${Date.now()}`,
            walletType: "community",
          },
        });
      }

      // Create VAT transaction for upgrade (differential VAT)
      const vatDifferential = newPackage.vat - currentPackage.vat;
      if (vatDifferential > 0) {
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "VAT",
            amount: vatDifferential,
            description: `VAT on ${currentPackage.name} to ${newPackage.name} upgrade`,
            status: "completed",
            reference: `VAT-UPG-${packageId}-${Date.now()}`,
          },
        });
      }

      // Notify user of successful upgrade
      await notifyMembershipActivation(
        userId,
        newPackage.name,
        expiresAt
      );

      return {
        success: true,
        message: `Successfully upgraded to ${newPackage.name}!${upgradePin ? ` MYNGUL Activation PIN: ${upgradePin}` : ''}`,
        upgradeCost,
        newExpiry: expiresAt,
        packageName: newPackage.name,
        myngulActivated: newPackageIncludesMyngul && !currentPackageIncludesMyngul,
        myngulPin: upgradePin,
        myngulCredit: (newPackageIncludesMyngul && !currentPackageIncludesMyngul) ? MYNGUL_CREDIT : 0,
      };
    }),

  // Backfill VAT transactions - CORRECTED VERSION (admin-only)
  backfillMembershipVat: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    const userRole = (ctx.session.user as any).role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      throw new Error("UNAUTHORIZED: Admin only. This endpoint modifies financial records.");
    }
    const userId = (ctx.session.user as any).id;

    // STEP 1: Delete ALL existing VAT transactions to clean up duplicates
    const deletedCount = await prisma.transaction.deleteMany({
      where: {
        userId,
        transactionType: "VAT",
      },
    });

    // STEP 2: Get all membership activation and upgrade transactions
    const membershipTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { transactionType: "MEMBERSHIP_ACTIVATION" },
          { transactionType: "membership_upgrade" },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (membershipTransactions.length === 0) {
      return { 
        success: false, 
        message: "No membership transactions found",
        deletedVatRecords: deletedCount.count,
      };
    }

    // STEP 3: Create VAT transaction for each membership payment
    const VAT_RATE = 0.075; // 7.5% VAT in Nigeria
    let totalVatCreated = 0;
    const vatRecords = [];

    for (const transaction of membershipTransactions) {
      // The transaction amount is negative (debit), so we make it positive
      const totalPaid = Math.abs(transaction.amount);
      
      // Calculate VAT from total: total = base + (base * 0.075) = base * 1.075
      // So: base = total / 1.075, and VAT = total - base
      const baseAmount = totalPaid / (1 + VAT_RATE);
      const vatAmount = totalPaid - baseAmount;

      // Create VAT transaction with the same date as the original transaction
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "VAT",
          amount: vatAmount,
          description: `VAT on ${transaction.description}`,
          status: "completed",
          reference: `VAT-${transaction.id}`,
          createdAt: transaction.createdAt,
        },
      });

      totalVatCreated += vatAmount;
      vatRecords.push({
        originalTransaction: transaction.description,
        totalPaid,
        baseAmount,
        vatAmount,
        date: transaction.createdAt,
      });
    }

    return {
      success: true,
      message: `Cleaned up ${deletedCount.count} duplicate VAT records and created ${vatRecords.length} correct VAT transaction(s)`,
      deletedVatRecords: deletedCount.count,
      totalVatAmount: totalVatCreated,
      records: vatRecords,
    };
  }),

  // ============================================================
  // EMPOWERMENT REWARD LOG (queryable endpoint for sponsor audit)
  // ============================================================
  getEmpowermentRewardLog: protectedProcedure
    .input(
      z.object({
        empowermentPackageId: z.string().optional(),
        sponsorId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string;
      const role = (ctx.session?.user as any)?.role as string;
      const isAdmin = role === 'admin' || role === 'super_admin';

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = { transactionType: { in: ['SPONSOR_REWARD', 'SENIOR_SPONSOR_REWARD', 'CSP_WAIVER_TRANSFER', 'CSP_WAIVER_APPLIED'] } };

      if (!isAdmin) {
        // Non-admins can only view reward logs for packages where they are beneficiary or sponsor
        const myPkgIds = await prisma.empowermentPackage.findMany({
          where: { OR: [{ beneficiaryId: userId }, { sponsorId: userId }] },
          select: { id: true },
        });
        where.empowermentPackageId = { in: myPkgIds.map((p: any) => p.id) };
      } else {
        if (input?.empowermentPackageId) where.empowermentPackageId = input.empowermentPackageId;
        if (input?.sponsorId) {
          const pkgIds = await prisma.empowermentPackage.findMany({
            where: { sponsorId: input.sponsorId },
            select: { id: true },
          });
          where.empowermentPackageId = { in: pkgIds.map((p: any) => p.id) };
        }
      }

      const [total, logs] = await Promise.all([
        prisma.empowermentTransaction.count({ where }),
        prisma.empowermentTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          include: {
            EmpowermentPackage: {
              select: {
                id: true,
                netEmpowermentValue: true,
                User_EmpowermentPackage_beneficiaryIdToUser: { select: { name: true, email: true } },
                User_EmpowermentPackage_sponsorIdToUser: { select: { name: true } },
              },
            },
          },
        }),
      ]);

      return { total, page, pageSize, logs };
    }),

  // ============================================================
  // ADMIN MATURITY REMINDER — trigger reminder for overdue packages
  // ============================================================
  sendMaturityReminder: protectedProcedure
    .input(z.object({ empowermentPackageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const role = (ctx.session?.user as any)?.role as string;
      if (role !== 'admin' && role !== 'super_admin') throw new Error('Admins only');

      const pkg = await prisma.empowermentPackage.findUnique({
        where: { id: input.empowermentPackageId },
        include: { User_EmpowermentPackage_beneficiaryIdToUser: { select: { name: true } } },
      });
      if (!pkg) throw new Error('Package not found');
      if (pkg.outcomeType) return { sent: false, reason: 'Outcome already set' };
      if (!pkg.maturityDate) return { sent: false, reason: 'No maturity date set' };

      await notifyAdminOutcomeNotSet(
        pkg.id,
        (pkg as any).User_EmpowermentPackage_beneficiaryIdToUser?.name ?? 'Unknown',
        pkg.maturityDate
      );

      return { sent: true };
    }),

  getMembershipCryptoPayment: protectedProcedure
    .input(z.object({ reference: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const pendingPayment = await prisma.pendingPayment.findFirst({
        where: {
          userId,
          gatewayReference: input.reference,
          paymentMethod: "crypto",
          transactionType: { in: ["MEMBERSHIP", "MEMBERSHIP_UPGRADE"] },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!pendingPayment) {
        throw new Error("Crypto membership payment not found.");
      }

      const meta = (pendingPayment.metadata as Record<string, any> | null) || {};
      const payResponseData = meta?.basqetAudit?.payResponse?.data || {};
      const resolvedNetworkDetails = resolveCryptoPaymentNetworkDetails({
        cryptoNetwork: meta.cryptoNetwork ?? null,
        paymentCurrency: payResponseData.payment_currency ?? null,
        address: meta.address || payResponseData.payment_address || null,
        networkInstruction: meta.networkInstruction ?? null,
        providerNetworkExact: meta.providerNetworkExact ?? null,
      });

      return {
        reference: pendingPayment.gatewayReference,
        status: pendingPayment.status,
        transactionType: pendingPayment.transactionType,
        amountNgn: pendingPayment.amount,
        reviewNotes: pendingPayment.reviewNotes,
        cryptoDetails: {
          address: meta.address || payResponseData.payment_address || null,
          amountCrypto: meta.amountCrypto ?? payResponseData.payment_amount ?? null,
          cryptoCurrency: meta.cryptoCurrency || payResponseData.payment_currency || "USDT",
          cryptoNetwork: resolvedNetworkDetails.cryptoNetwork,
          qrCode: meta.qrCode || payResponseData.qrCode || null,
          paymentFlow: meta.paymentFlow || null,
          addressSource: meta.addressSource || null,
          addressFormat: meta.addressFormat || resolvedNetworkDetails.addressFormat || null,
          providerNetworkExact: resolvedNetworkDetails.providerNetworkExact,
          networkInstruction: resolvedNetworkDetails.networkInstruction,
          provider: meta.provider || null,
        },
      };
    }),

  // Verify and activate any external payment (MEMBERSHIP, UPGRADE, EMPOWERMENT)
  // Called by the payment verification page after user returns from gateway
  verifyExternalPayment: protectedProcedure
    .input(z.object({
      gateway: z.nativeEnum(PaymentGateway),
      reference: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      // Look up the PendingPayment by reference (scoped to this user)
      const pending = await prisma.pendingPayment.findFirst({
        where: {
          gatewayReference: input.reference,
          userId,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!pending) {
        throw new Error("No payment record found for this reference.");
      }

      // Already processed — return success without re-processing
      if (pending.status === "approved" || pending.status === "completed") {
        return {
          success: true,
          message: "Payment already processed and activated.",
          transactionType: pending.transactionType,
          reference: input.reference,
          alreadyProcessed: true,
        };
      }

      // Verify payment with the gateway
      const verification = await PaymentProcessor.verifyPayment(input.gateway, input.reference);
      const successStates = [PaymentStatus.SUCCESS, PaymentStatus.SUCCESSFUL];

      if (!verification.success || (verification.status && !successStates.includes(verification.status))) {
        throw new Error(verification.error || verification.message || "Payment verification failed. Please contact support.");
      }

      const claim = await claimPendingPayment(prisma, {
        pendingPaymentId: pending.id,
        expectedUserId: userId,
        purpose: pending.transactionType,
        actor: `Payment verification page (${input.gateway})`,
        claimableStatuses: ["pending"],
      });

      if (claim.status === "already_processed") {
        return {
          success: true,
          message: "Payment already processed and activated.",
          transactionType: pending.transactionType,
          reference: input.reference,
          alreadyProcessed: true,
        };
      }

      if (claim.status === "in_progress") {
        return {
          success: true,
          message: "Payment confirmation is already in progress. Refresh shortly.",
          transactionType: pending.transactionType,
          reference: input.reference,
          alreadyProcessed: false,
          processing: true,
        };
      }

      if (claim.status === "missing") {
        throw new Error("No payment record found for this reference.");
      }

      const pendingMetadata = (pending.metadata as Record<string, any> | undefined) || {};
      const transactionType = pending.transactionType;

      // ── MEMBERSHIP ──────────────────────────────────────────────
      if (transactionType === "MEMBERSHIP") {
        const packageId = pendingMetadata.packageId;
        const selectedPalliative = pendingMetadata.selectedPalliative;

        if (!packageId) {
          throw new Error("Package ID missing from payment record. Please contact support.");
        }

        const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
        if (!membershipPackage) {
          throw new Error("Membership package not found.");
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { country: true, state: true, name: true, email: true },
        });

        await activateMembershipAfterExternalPayment({
          prisma,
          userId,
          packageId,
          selectedPalliative,
          paymentReference: input.reference,
          paymentMethodLabel: input.gateway,
          activatorName: user?.name || user?.email || ctx.session?.user?.name || "Member",
        });
        invalidateActiveMembershipCache(userId);

        await markPendingPaymentReviewed(prisma, {
          paymentId: pending.id,
          status: "completed",
          note: `Auto-completed via payment verification page (${input.gateway})`,
        });

        await prisma.transaction.updateMany({
          where: { userId, reference: input.reference, transactionType: "MEMBERSHIP_PAYMENT" },
          data: { status: "completed" },
        });

        try {
          await recordRevenue(prisma, {
            source: "MEMBERSHIP_REGISTRATION",
            amount: computeProfitFiat({
              profitMode: ((membershipPackage.profitMode ?? "PERCENT") as any) as "PERCENT" | "FIXED" | "HYBRID",
              profitPercent: Number(membershipPackage.profitPercent ?? 1),
              profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
              baseFiat: Number(membershipPackage.price ?? 0),
            }),
            currency: "NGN",
            sourceId: `MEMBERSHIP_REGISTRATION:${input.reference}`,
            description: `Membership: ${membershipPackage.name} (verified via callback)`,
            userId,
            packageId,
            programType: "MEMBERSHIP",
            country: user?.country ?? undefined,
            state: user?.state ?? undefined,
            region: getNigerianRegion(user?.state),
            metadata: {
              totalPaid: membershipPackage.price + membershipPackage.vat,
              basePrice: membershipPackage.price,
              vat: membershipPackage.vat,
              paymentMethod: input.gateway,
              selectedPalliative: selectedPalliative ?? null,
              verifiedViaCallback: true,
            },
          });
        } catch (err: any) {
          if (err?.code !== "P2002") throw err;
        }

        return {
          success: true,
          message: `${membershipPackage.name} membership activated successfully!`,
          transactionType,
          reference: input.reference,
          alreadyProcessed: false,
        };
      }

      // ── MEMBERSHIP_UPGRADE ──────────────────────────────────────
      if (transactionType === "MEMBERSHIP_UPGRADE") {
        const packageId = pendingMetadata.packageId;
        const currentPackageId = pendingMetadata.currentPackageId;
        const selectedPalliative = pendingMetadata.selectedPalliative;

        if (!packageId || !currentPackageId) {
          throw new Error("Package information missing from payment record. Please contact support.");
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { country: true, state: true, name: true, email: true },
        });

        await upgradeMembershipAfterExternalPayment({
          prisma,
          userId,
          packageId,
          currentPackageId,
          selectedPalliative,
          paymentReference: input.reference,
          paymentMethodLabel: input.gateway,
        });
        invalidateActiveMembershipCache(userId);

        await markPendingPaymentReviewed(prisma, {
          paymentId: pending.id,
          status: "completed",
          note: `Auto-completed via payment verification page (${input.gateway} upgrade)`,
        });

        await prisma.transaction.updateMany({
          where: { userId, reference: input.reference, transactionType: "MEMBERSHIP_UPGRADE" },
          data: { status: "completed" },
        });

        try {
          await recordRevenue(prisma, {
            source: "MEMBERSHIP_REGISTRATION",
            amount: pending.amount,
            currency: "NGN",
            sourceId: `MEMBERSHIP_UPGRADE:${input.reference}`,
            description: `Membership upgrade (verified via callback)`,
            userId,
            packageId,
            programType: "MEMBERSHIP_UPGRADE",
            country: user?.country ?? undefined,
            state: user?.state ?? undefined,
            region: getNigerianRegion(user?.state),
            metadata: {
              paymentMethod: input.gateway,
              fromPackageId: currentPackageId,
              toPackageId: packageId,
              verifiedViaCallback: true,
            },
          });
        } catch (err: any) {
          if (err?.code !== "P2002") throw err;
        }

        return {
          success: true,
          message: "Membership upgraded successfully!",
          transactionType,
          reference: input.reference,
          alreadyProcessed: false,
        };
      }

      // ── EMPOWERMENT ─────────────────────────────────────────────
      if (transactionType === "EMPOWERMENT") {
        await markPendingPaymentReviewed(prisma, {
          paymentId: pending.id,
          status: "approved",
          note: `Auto-approved via payment verification page (${input.gateway})`,
        });

        await prisma.transaction.updateMany({
          where: { reference: input.reference, userId, status: "pending" },
          data: { status: "completed" },
        });

        if (pendingMetadata.beneficiaryId && pendingMetadata.empowermentType) {
          const beneficiary = await prisma.user.findUnique({
            where: { id: pendingMetadata.beneficiaryId },
            select: { id: true, name: true, email: true },
          });
          if (beneficiary) {
            await finalizeEmpowermentPackage({
              sponsorId: userId,
              beneficiary,
              empowermentType: pendingMetadata.empowermentType,
              packageFee: pendingMetadata.packageFee ?? 330000,
              vat: pendingMetadata.vat ?? 24750,
              totalCost: pendingMetadata.totalCost ?? (pendingMetadata.packageFee ?? 330000) + (pendingMetadata.vat ?? 24750),
            });
          }
        }

        return {
          success: true,
          message: "Empowerment payment processed successfully!",
          transactionType,
          reference: input.reference,
          alreadyProcessed: false,
        };
      }

      // ── DEPOSIT / TOPUP ─────────────────────────────────────────
      if (transactionType === "DEPOSIT" || transactionType === "TOPUP") {
        const transaction = await prisma.transaction.findFirst({
          where: { reference: input.reference, userId, status: "pending", transactionType: "DEPOSIT" },
        });

        if (transaction) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { wallet: { increment: transaction.amount } },
            }),
            prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: "completed" },
            }),
          ]);

          await markPendingPaymentReviewed(prisma, {
            paymentId: pending.id,
            status: "approved",
            note: `Auto-approved via payment verification page (${input.gateway})`,
          });
        }

        return {
          success: true,
          message: "Wallet deposit processed successfully!",
          transactionType,
          reference: input.reference,
          alreadyProcessed: false,
        };
      }

      // ── STORE_PURCHASE ──────────────────────────────────────────
      if (transactionType === "STORE_PURCHASE") {
        const orderId = pendingMetadata.orderId;
        if (!orderId) {
          throw new Error("Order ID missing from payment record. Please contact support.");
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { product: { include: { pickupCenter: true } }, user: true, pickupCenter: true },
        });

        if (!order) {
          throw new Error("Store order not found. Please contact support.");
        }

        if (order.userId !== userId) {
          throw new Error("Order does not belong to this user.");
        }

        if (order.status === "PENDING") {
          let claimCode = "";
          let codeExists = true;
          while (codeExists) {
            const rand = Math.floor(100000 + Math.random() * 900000);
            claimCode = `BPI-${rand}-PC`;
            const found = await prisma.order.findFirst({ where: { claimCode } });
            codeExists = Boolean(found);
          }

          await prisma.order.update({
            where: { id: order.id },
            data: { status: "PROCESSING", claimStatus: "CODE_ISSUED", claimCode },
          });

          try {
            const { sendEmail } = await import("@/lib/email");
            if (order.user?.email) {
              await sendEmail({
                to: order.user.email,
                subject: "Your BPI pickup claim code",
                html: `<p>Hello ${order.user.name ?? ""},</p><p>Your order for <strong>${order.product?.name ?? "your item"}</strong> is confirmed.</p><p><strong>Claim Code:</strong> ${claimCode}</p><p>Please present this code and a valid ID at the pickup center to receive your item.</p>`,
              });
            }
          } catch { /* Email failures should not block approval */ }

          const profitFiat = Number((order.pricingSnapshot as any)?.profit_fiat ?? 0);
          const totalFiat = Number((order.pricingSnapshot as any)?.total_fiat ?? pending.amount ?? 0);
          const amountForPools = profitFiat > 0 ? profitFiat : totalFiat;
          if (amountForPools > 0) {
            try {
              await recordRevenue(prisma, {
                source: "STORE_PURCHASE",
                amount: amountForPools,
                currency: "NGN",
                sourceId: order.id,
                description: `Store purchase profit: ${order.product?.name || "Product"} (verified via callback)`,
                userId,
                orderId: order.id,
                productId: order.productId,
                programType: "STORE",
                country: order.user?.country ?? undefined,
                state: order.user?.state ?? undefined,
                region: getNigerianRegion(order.user?.state),
                metadata: {
                  paymentRef: input.reference,
                  profitFiat,
                  totalFiat,
                  verifiedViaCallback: true,
                },
              });
            } catch (err: any) {
              if (err?.code !== "P2002") throw err;
            }
          }
        }

        await prisma.transaction.updateMany({
          where: { reference: input.reference, userId, status: "pending" },
          data: { status: "completed" },
        });

        await markPendingPaymentReviewed(prisma, {
          paymentId: pending.id,
          status: "completed",
          note: `Auto-completed via payment verification page (${input.gateway} store purchase)`,
        });

        return {
          success: true,
          message: "Store purchase confirmed! Check your email for the pickup claim code.",
          transactionType,
          reference: input.reference,
          alreadyProcessed: false,
        };
      }

      // Unknown type — mark as reviewed but return a warning
      throw new Error(`Unknown payment type: ${transactionType}. Please contact support.`);
    }),

  // ═════════════════════════════════════════════════════════════════════════
  // MEMBERSHIP AUTO-RENEWAL (User-facing procedures)
  // ═════════════════════════════════════════════════════════════════════════

  getMembershipRenewalStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) throw new Error("UNAUTHORIZED");
    const userId = (ctx.session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        renewalCount: true,
      },
    });

    if (!user || !user.activeMembershipPackageId) {
      return { hasActiveMembership: false, error: "No active membership found" };
    }

    const membershipPackage = await prisma.membershipPackage.findUnique({
      where: { id: user.activeMembershipPackageId },
      select: { id: true, name: true, renewalFee: true, price: true, renewalCycle: true },
    });

    if (!membershipPackage) {
      return { hasActiveMembership: false, error: "Membership package not found" };
    }

    const now = new Date();
    const { expiresAt } = deriveMembershipExpiry({
      membershipExpiresAt: user.membershipExpiresAt,
      membershipActivatedAt: user.membershipActivatedAt,
      renewalCycleDays: membershipPackage.renewalCycle,
    });

    if (!expiresAt) {
      return {
        hasActiveMembership: true,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        currentPackage: membershipPackage.name,
        membershipActivatedAt: user.membershipActivatedAt,
        membershipExpiresAt: undefined,
        daysUntilExpiry: undefined,
        isExpired: true,
        isRenewalWindow: false,
        renewalFee: membershipPackage.renewalFee || membershipPackage.price,
        renewalCycleDays: membershipPackage.renewalCycle,
        totalRenewals: user.renewalCount,
        error: "Membership expiry is missing and could not be derived from the activation date.",
      };
    }

    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isExpired = daysUntilExpiry < 0;
    const isRenewalWindow = daysUntilExpiry <= 30 && daysUntilExpiry >= -365;

    return {
      hasActiveMembership: true,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      currentPackage: membershipPackage.name,
      membershipActivatedAt: user.membershipActivatedAt,
      membershipExpiresAt: expiresAt,
      daysUntilExpiry,
      isExpired,
      isRenewalWindow,
      renewalFee: membershipPackage.renewalFee || membershipPackage.price,
      renewalCycleDays: membershipPackage.renewalCycle,
      totalRenewals: user.renewalCount,
    };
  }),

  previewMembershipRenewal: protectedProcedure
    .input(z.object({ optionalUpgradePackageId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) throw new Error("UNAUTHORIZED");
      const userId = (ctx.session.user as any).id;

      try {
        const { validateAutoRenewalEligibility, getRenewalPackage } = await import(
          "@/server/services/membershipAutoRenewal.service"
        );
        const eligibility = await validateAutoRenewalEligibility(prisma, userId);

        if (!eligibility.eligible) {
          return {
            eligible: false,
            reason: eligibility.reason,
            membershipExpiresAt: eligibility.membershipExpiresAt,
            daysUntilExpiry: eligibility.daysUntilExpiry,
          };
        }

        const renewalPackageInfo = await getRenewalPackage(
          prisma,
          userId,
          input.optionalUpgradePackageId
        );
        const referralChain = await getReferralChain(userId, 4);
        const membershipPackage = await prisma.membershipPackage.findUnique({
          where: { id: renewalPackageInfo.packageId },
        });

        let totalCash = 0;
        let totalBpt = 0;
        let totalHealth = 0;
        let totalMeal = 0;
        let totalSecurity = 0;
        let totalPalliative = 0;
        let totalShelter = 0;

        for (let i = 0; i < referralChain.length; i++) {
          const level = i + 1;
          totalCash += (membershipPackage as any)?.[`renewal_cash_l${level}`] || 0;
          totalBpt += (membershipPackage as any)?.[`renewal_bpt_l${level}`] || 0;
          totalHealth += (membershipPackage as any)?.[`renewal_health_l${level}`] || 0;
          totalMeal += (membershipPackage as any)?.[`renewal_meal_l${level}`] || 0;
          totalSecurity += (membershipPackage as any)?.[`renewal_security_l${level}`] || 0;
          totalPalliative +=
            (membershipPackage as any)?.[`renewal_palliative_l${level}`] || 0;
          totalShelter += (membershipPackage as any)?.[`shelter_l${level}`] || 0;
        }

        return {
          eligible: true,
          userId,
          renewalPackage: renewalPackageInfo.packageName,
          renewalFee: renewalPackageInfo.renewalFee,
          vat: renewalPackageInfo.vat,
          totalCost: renewalPackageInfo.totalCost,
          isUpgrade: renewalPackageInfo.isUpgrade,
          referralCount: referralChain.length,
          estimatedRewards: {
            cash: totalCash,
            bpt: totalBpt,
            health: totalHealth,
            meal: totalMeal,
            security: totalSecurity,
            palliative: totalPalliative,
            shelter: totalShelter,
          },
        };
      } catch (err) {
        return {
          eligible: false,
          reason: `Preview failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    }),

  initiateUserAutoRenewal: protectedProcedure
    .input(z.object({ optionalUpgradePackageId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) throw new Error("UNAUTHORIZED");
      const userId = (ctx.session.user as any).id;

      try {
        const { processAutoRenewal } = await import(
          "@/server/services/membershipAutoRenewal.service"
        );
        const result = await processAutoRenewal(prisma, userId, input.optionalUpgradePackageId);

        if (!result.success) return { success: false, error: result.error };

        return {
          success: true,
          renewalHistoryId: result.renewalHistoryId,
          newExpiresAt: result.newExpiresAt,
          totalRewardsDistributed: result.totalRewardsDistributed,
          message: `Good news! Your membership has been automatically renewed. New expiry: ${result.newExpiresAt?.toLocaleDateString()}`,
        };
      } catch (err) {
        return {
          success: false,
          error: `Auto-renewal failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    }),

  getMembershipRenewalHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(20),
          page: z.number().int().min(1).default(1),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) throw new Error("UNAUTHORIZED");
      const userId = (ctx.session.user as any).id;
      const limit = input?.limit ?? 20;
      const page = input?.page ?? 1;
      const skip = (page - 1) * limit;

      const [renewals, total] = await Promise.all([
        prisma.renewalHistory.findMany({
          where: { userId },
          orderBy: { renewedAt: "desc" },
          skip,
          take: limit,
          select: {
            id: true,
            packageName: true,
            renewalNumber: true,
            renewalFee: true,
            vat: true,
            totalPaid: true,
            renewedAt: true,
            expiresAt: true,
            cashDistributed: true,
            bptDistributed: true,
            palliativeDistributed: true,
            healthDistributed: true,
            mealDistributed: true,
            securityDistributed: true,
          },
        }),
        prisma.renewalHistory.count({ where: { userId } }),
      ]);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        renewals: renewals.map((renewal) => ({
          renewalHistoryId: renewal.id,
          packageName: renewal.packageName,
          renewalNumber: renewal.renewalNumber,
          renewalFee: renewal.renewalFee,
          vat: renewal.vat,
          totalPaid: renewal.totalPaid,
          renewedAt: renewal.renewedAt,
          expiresAt: renewal.expiresAt,
          totalRewardsDistributed: {
            cash: renewal.cashDistributed,
            bpt: renewal.bptDistributed,
            palliative: renewal.palliativeDistributed,
            health: renewal.healthDistributed,
            meal: renewal.mealDistributed,
            security: renewal.securityDistributed,
          },
        })),
      };
    }),
});
