import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { getReferralChain } from "@/server/services/referral.service";
import { distributeBptReward } from "@/server/services/rewards.service";
import { PaymentProcessor } from "@/server/services/payment";
import { PaymentGateway, PaymentPurpose, PaymentStatus } from "@/server/services/payment/types";
import { randomUUID } from "crypto";
import { getPalliativeTier, isHighTierPackage, getWalletFieldName } from "@/lib/palliative";
import { recordRevenue } from "@/server/services/revenue.service";
import { activateMembershipAfterExternalPayment } from "@/server/services/membershipPayments.service";
import {
  notifyMembershipActivation,
  notifyMembershipRenewal,
  notifyEmpowermentActivation,
  notifyEmpowermentMaturity,
  notifyEmpowermentApproval,
  notifyEmpowermentRelease,
  notifyAdminEmpowermentPending,
  notifyReferralReward,
} from "@/server/services/notification.service";
import { 
  isCompositePackage, 
  processCompositePackagePurchase 
} from "@/server/services/compositePackages.service";

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

async function finalizeEmpowermentPackage(params: {
  sponsorId: string;
  beneficiary: { id: string; name: string | null; email: string | null };
  empowermentType: "CHILD_EDUCATION" | "VOCATIONAL_SKILL";
  packageFee: number;
  vat: number;
  totalCost: number;
}) {
  const { sponsorId, beneficiary, empowermentType, packageFee, vat, totalCost } = params;

  const GROSS_EMPOWERMENT_VALUE = 7250000;
  const GROSS_SPONSOR_REWARD = 1000000;
  const TAX_RATE = 0.075;

  const netEmpowermentValue = GROSS_EMPOWERMENT_VALUE * (1 - TAX_RATE);
  const netSponsorReward = GROSS_SPONSOR_REWARD * (1 - TAX_RATE);

  const activatedAt = new Date();
  const maturityDate = new Date(activatedAt);
  maturityDate.setMonth(maturityDate.getMonth() + 24);

  const empowermentPackage = await prisma.empowermentPackage.create({
    data: {
      id: randomUUID(),
      updatedAt: new Date(),
      sponsorId,
      beneficiaryId: beneficiary.id,
      packageFee,
      vat,
      empowermentType,
      status: "Active - Countdown Running",
      activatedAt,
      maturityDate,
      grossEmpowermentValue: GROSS_EMPOWERMENT_VALUE,
      netEmpowermentValue,
      grossSponsorReward: GROSS_SPONSOR_REWARD,
      netSponsorReward,
      beneficiaryCanView: true,
      beneficiaryCanWithdraw: false,
    },
  });

  await recordRevenue(prisma, {
    source: "OTHER",
    amount: totalCost,
    currency: "NGN",
    sourceId: empowermentPackage.id,
    description: `Empowerment package fee paid by ${sponsorId} for ${beneficiary.name || beneficiary.email || "beneficiary"}`,
  });

  await prisma.user.update({
    where: { id: beneficiary.id },
    data: { sponsorId },
  });

  await prisma.empowermentTransaction.create({
    data: {
      id: randomUUID(),
      empowermentPackageId: empowermentPackage.id,
      transactionType: "ACTIVATION",
      grossAmount: totalCost,
      taxAmount: 0,
      netAmount: totalCost,
      description: `Empowerment package activated by sponsor ${sponsorId} for beneficiary ${beneficiary.name || beneficiary.email || beneficiary.id}`,
      performedBy: sponsorId,
    },
  });

  await notifyEmpowermentActivation(sponsorId, beneficiary.id, maturityDate);

  return { maturityDate, empowermentPackage };
}

export const packageRouter = createTRPCRouter({
  getPackages: publicProcedure.query(async () => {
    return await prisma.membershipPackage.findMany();
  }),

  // Initiate membership payment (wallet or external gateway)
  initiateMembershipPayment: protectedProcedure
    .input(z.object({
      packageId: z.string(),
      selectedPalliative: z.enum(["car", "house", "land", "business", "solar", "education"]).optional(),
      gateway: z.enum(["wallet", "flutterwave"]).default("wallet"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: input.packageId } });
      if (!membershipPackage) throw new Error("Membership package not found.");

      const totalCost = membershipPackage.price + membershipPackage.vat;

      if (input.gateway === "wallet") {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { wallet: true } });
        if (!user) throw new Error("User not found");
        if ((user.wallet ?? 0) < totalCost) {
          throw new Error(`Insufficient wallet balance. You need NGN ${totalCost.toLocaleString()}`);
        }

        const walletReference = `MEM-WALLET-${Date.now()}`;

        // Deduct and record transaction
        await prisma.$transaction(async (tx) => {
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

        await recordRevenue(prisma, {
          source: "MEMBERSHIP_REGISTRATION",
          amount: totalCost,
          currency: "NGN",
          sourceId: input.packageId,
          description: `Membership purchase: ${membershipPackage.name}`,
        });

        return { success: true, gateway: "wallet", paymentUrl: null, reference: walletReference };
      }

      // External gateway flow (Flutterwave)
      const payment = await PaymentProcessor.processPayment({
        amount: totalCost,
        currency: "NGN",
        userId,
        packageId: input.packageId,
        email: ctx.session?.user?.email || "",
        name: ctx.session?.user?.name || "",
        paymentMethod: "flutterwave",
        purpose: PaymentPurpose.MEMBERSHIP,
        gateway: PaymentGateway.FLUTTERWAVE,
        metadata: {
          packageId: input.packageId,
          purpose: PaymentPurpose.MEMBERSHIP,
          selectedPalliative: input.selectedPalliative,
          userId,
        },
      });

      if (!payment.success) {
        throw new Error(payment.error || payment.message || "Failed to initiate payment");
      }

      const paymentRef = payment.transactionId || payment.reference || payment.gatewayReference || `MEM-FLW-${Date.now()}`;

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
          paymentMethod: input.gateway,
          gatewayReference: paymentRef,
          status: "pending",
          metadata: {
            packageId: input.packageId,
            selectedPalliative: input.selectedPalliative,
            purpose: PaymentPurpose.MEMBERSHIP,
          },
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        gateway: "flutterwave",
        paymentUrl: payment.paymentUrl,
        reference: paymentRef,
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
        amount: totalCost,
        currency: "NGN",
        sourceId: packageId,
        description: `Membership purchase: ${membershipPackage.name}`,
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
      if (process.env.NODE_ENV === "production") {
        throw new Error("Mock membership payments are disabled in production.");
      }
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
          },
        });

        // Build update data object
        const updateData: any = {};
        if (cashReward > 0) updateData.wallet = { increment: cashReward };
        
        // Route palliative rewards based on referrer's activation status
        if (palliativeReward > 0) {
          if (referrerData?.palliativeActivated && referrerData.selectedPalliative) {
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
        if (bptReward > 0) {
          await distributeBptReward(
            referrer.id, 
            bptReward, 
            `REFERRAL_L${level}`,
            `Referral reward L${level} from ${membershipPackage.name} activation`
          );
        }

        // Create separate transaction records for each wallet type
        const userBptShare = bptReward / 2; // Only user's 50%, buyback tracked separately
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

      // TODO: Implement actual payment processing logic here
      const paymentSuccessful = true;

      if (!paymentSuccessful) {
        throw new Error("Payment failed.");
      }

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

      if (gateway === "wallet") {
        if ((sponsor.wallet ?? 0) < TOTAL_COST) {
          throw new Error(`Insufficient wallet balance. You need NGN ${TOTAL_COST.toLocaleString()} to activate this empowerment package.`);
        }

        const paymentReference = `EMP-WALLET-${Date.now()}`;

        await prisma.$transaction(async (tx) => {
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
          beneficiary: { id: beneficiaryId, name: beneficiary.name, email: beneficiary.email },
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
      }

      const payment = await PaymentProcessor.processPayment({
        amount: TOTAL_COST,
        currency: "NGN",
        userId: sponsorId,
        packageId: `empowerment-${beneficiaryId}`,
        email: sponsor.email || "",
        name: sponsor.name || "",
        paymentMethod: gateway === "paystack" ? "paystack" : "flutterwave",
        purpose: PaymentPurpose.EMPOWERMENT,
        gateway: gateway === "paystack" ? PaymentGateway.PAYSTACK : PaymentGateway.FLUTTERWAVE,
        metadata: {
          sponsorId,
          beneficiaryId,
          empowermentType,
          purpose: PaymentPurpose.EMPOWERMENT,
        },
      });

      if (!payment.success) {
        throw new Error(payment.error || payment.message || "Failed to initiate payment");
      }

      const paymentRef = payment.transactionId || payment.reference || payment.gatewayReference || `EMP-${Date.now()}`;

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: sponsorId,
          transactionType: "EMPOWERMENT_PACKAGE_FEE",
          amount: -TOTAL_COST,
          description: `Empowerment package fee via ${gateway}`,
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
            sponsorId,
            beneficiaryId,
            empowermentType,
            packageFee: PACKAGE_FEE,
            vat: VAT,
            totalCost: TOTAL_COST,
          },
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        gateway,
        paymentUrl: payment.paymentUrl,
        reference: paymentRef,
        message: "Payment initiated. Complete payment to activate empowerment package.",
      };
    }),

  verifyEmpowermentPayment: protectedProcedure
    .input(z.object({
      gateway: z.nativeEnum(PaymentGateway),
      reference: z.string(),
      beneficiaryId: z.string().optional(),
      empowermentType: z.enum(["CHILD_EDUCATION", "VOCATIONAL_SKILL"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }

      const sponsorId = (ctx.session.user as any).id;

      if (input.gateway === PaymentGateway.WALLET) {
        throw new Error("Wallet payments do not require verification.");
      }

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
      const empowermentType = pendingMetadata.empowermentType || input.empowermentType;

      if (!beneficiaryId || !empowermentType) {
        throw new Error("Beneficiary and empowerment type are required to complete activation.");
      }

      const PACKAGE_FEE = 330000;
      const VAT = 24750;
      const TOTAL_COST = PACKAGE_FEE + VAT;

      if (verification.amount && Math.abs(verification.amount - TOTAL_COST) > 1) {
        throw new Error("Payment amount does not match the empowerment package fee.");
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
        select: { activeMembershipPackageId: true },
      });

      if (!sponsor?.activeMembershipPackageId) {
        throw new Error("You must have an active membership package to sponsor an empowerment package.");
      }

      const { maturityDate } = await finalizeEmpowermentPackage({
        sponsorId,
        beneficiary: { id: beneficiaryId, name: beneficiary.name, email: beneficiary.email },
        empowermentType,
        packageFee: PACKAGE_FEE,
        vat: VAT,
        totalCost: TOTAL_COST,
      });

      await prisma.pendingPayment.updateMany({
        where: { id: pending?.id },
        data: { status: "completed", updatedAt: new Date() },
      });

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
        message: "Empowerment package activated successfully. 24-month countdown has begun.",
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
      await prisma.renewalHistory.create({
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
      await recordRevenue(prisma, {
        source: "MEMBERSHIP_RENEWAL",
        amount: renewalFee,
        currency: "NGN",
        sourceId: packageId,
        description: `Membership renewal: ${membershipPackage.name}`,
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
      },
    });

    if (!user?.activeMembershipPackageId) {
      return null;
    }

    const membershipPackage = await prisma.membershipPackage.findUnique({
      where: { id: user.activeMembershipPackageId },
    });

    return {
      package: membershipPackage,
      activatedAt: user.membershipActivatedAt,
      expiresAt: user.membershipExpiresAt,
    };
  }),

  /**
   * Process membership upgrade
   */
  processUpgradePayment: protectedProcedure
    .input(z.object({ 
      packageId: z.string(),
      currentPackageId: z.string(),
      selectedPalliative: z.enum(["car", "house", "land", "business", "solar", "education"]).optional(),
      paymentMethod: z.enum(['wallet']).default('wallet'),
      frontendCalculatedCost: z.number().optional() // Frontend cost for validation
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { packageId, currentPackageId, selectedPalliative, paymentMethod = 'mock', frontendCalculatedCost } = input;

      // Get both packages
      const [newPackage, currentPackage] = await Promise.all([
        prisma.membershipPackage.findUnique({ where: { id: packageId } }),
        prisma.membershipPackage.findUnique({ where: { id: currentPackageId } }),
      ]);

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

      // Check wallet balance and deduct
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

      // Deduct from wallet
      await prisma.user.update({
        where: { id: userId },
        data: { wallet: { decrement: upgradeCost } }
      });

      // Create transaction record
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
      const bonusDifferences = {
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

      // Validate that we're not downgrading (prevent negative bonuses)
      const allBonusesPositive = Object.values(bonusDifferences).every(level =>
        level.cash >= 0 && level.palliative >= 0 && level.bpt >= 0 && level.cashback >= 0
      );
      
      if (!allBonusesPositive && !isFeatureBundle && !isAddonPackage) {
        throw new Error("Cannot downgrade to a package with lower referral rewards.");
      }

      // Simulate payment processing
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
        const referrerId = referralChain[level - 1];
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

  // Backfill VAT transactions - CORRECTED VERSION
  backfillMembershipVat: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
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
});
