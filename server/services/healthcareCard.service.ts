/**
 * Healthcare card.
 *
 * Corporate decision (follow-up Q16, 07/10/2026): a yearly ₦30,000
 * subscription (admin-adjustable) gives a ₦300,000 health cover (admin-
 * adjustable) that does not carry over on renewal, a monthly usage cap of
 * 10%-20% of the cover, and a discount on centre services based on the
 * member's CSP tier. ₦10,000 of the fee goes to the member's own Community
 * Wallet; ₦20,000 goes to the BPI project account. Regular Plus or higher is
 * required from Tier 2 upward (Tier 1 is open to Regular).
 */

import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { ensureBpiProjectAccount } from "@/server/services/bpiProjectAccount.service";
import { ensureMemberStanding } from "@/server/services/csp-tier.service";
import { isCspMembershipCurrent } from "@/server/services/csp-ledger.service";
import { activateMembershipAfterExternalPayment } from "@/server/services/membershipPayments.service";

type TxClient = PrismaClient | Prisma.TransactionClient;

export const HEALTHCARE_SETTINGS_KEYS = {
  price: "healthcare_card_price",
  coverAmount: "healthcare_cover_amount",
  communityShare: "healthcare_community_share",
  monthlyMinPct: "healthcare_monthly_min_pct",
  monthlyMaxPct: "healthcare_monthly_max_pct",
  discountTier1to3Pct: "healthcare_discount_tier_1_3_pct",
  discountTier4to6Pct: "healthcare_discount_tier_4_6_pct",
  discountTier7PlusPct: "healthcare_discount_tier_7plus_pct",
  requireRegularPlusFromTier: "healthcare_require_regular_plus_from_tier",
} as const;

export type HealthcareCardSettings = {
  price: number;
  coverAmount: number;
  communityShare: number; // of `price`, the rest goes to the BPI project account
  monthlyMinPct: number;
  monthlyMaxPct: number;
  discountTier1to3Pct: number;
  discountTier4to6Pct: number;
  discountTier7PlusPct: number;
  requireRegularPlusFromTier: number; // tiers below this are open to Regular; from this tier up, Regular Plus+ is required
};

export const DEFAULT_HEALTHCARE_SETTINGS: HealthcareCardSettings = {
  price: 30000,
  coverAmount: 300000,
  communityShare: 10000,
  monthlyMinPct: 10,
  monthlyMaxPct: 20,
  discountTier1to3Pct: 10,
  discountTier4to6Pct: 20,
  discountTier7PlusPct: 40,
  requireRegularPlusFromTier: 2,
};

/**
 * Corporate decision (BPI-CSP "How It Works", 09/10/2026): "Option 2:
 * Promotional Healthcare Card Activation — ₦30,000" is an admin on/off
 * toggle with no fixed end date, open to any member (new or existing). It
 * is the same ₦30,000 subscription as the regular Healthcare Card — the
 * only difference is that a member with no active membership is first
 * granted a free promotional Regular membership, so the card alone is
 * enough to get started.
 */
export const HEALTHCARE_PROMO_BUNDLE_SETTINGS_KEY = "healthcare_promo_bundle_enabled";

export async function isHealthcarePromoBundleEnabled(db: TxClient): Promise<boolean> {
  const row = await db.adminSettings.findUnique({ where: { settingKey: HEALTHCARE_PROMO_BUNDLE_SETTINGS_KEY } });
  return row?.settingValue === "true";
}

const MEMBERSHIP_ORDER = ["regular", "regular plus", "gold", "gold plus", "platinum", "platinum plus"] as const;

export async function loadHealthcareSettings(db: TxClient): Promise<HealthcareCardSettings> {
  const rows = await db.adminSettings.findMany({ where: { settingKey: { in: Object.values(HEALTHCARE_SETTINGS_KEYS) } } });
  const map = new Map(rows.map((r) => [r.settingKey, r.settingValue]));
  const num = (key: string, def: number) => {
    const v = Number(map.get(key));
    return Number.isFinite(v) && v >= 0 ? v : def;
  };
  return {
    price: num(HEALTHCARE_SETTINGS_KEYS.price, DEFAULT_HEALTHCARE_SETTINGS.price),
    coverAmount: num(HEALTHCARE_SETTINGS_KEYS.coverAmount, DEFAULT_HEALTHCARE_SETTINGS.coverAmount),
    communityShare: num(HEALTHCARE_SETTINGS_KEYS.communityShare, DEFAULT_HEALTHCARE_SETTINGS.communityShare),
    monthlyMinPct: num(HEALTHCARE_SETTINGS_KEYS.monthlyMinPct, DEFAULT_HEALTHCARE_SETTINGS.monthlyMinPct),
    monthlyMaxPct: num(HEALTHCARE_SETTINGS_KEYS.monthlyMaxPct, DEFAULT_HEALTHCARE_SETTINGS.monthlyMaxPct),
    discountTier1to3Pct: num(HEALTHCARE_SETTINGS_KEYS.discountTier1to3Pct, DEFAULT_HEALTHCARE_SETTINGS.discountTier1to3Pct),
    discountTier4to6Pct: num(HEALTHCARE_SETTINGS_KEYS.discountTier4to6Pct, DEFAULT_HEALTHCARE_SETTINGS.discountTier4to6Pct),
    discountTier7PlusPct: num(HEALTHCARE_SETTINGS_KEYS.discountTier7PlusPct, DEFAULT_HEALTHCARE_SETTINGS.discountTier7PlusPct),
    requireRegularPlusFromTier: num(HEALTHCARE_SETTINGS_KEYS.requireRegularPlusFromTier, DEFAULT_HEALTHCARE_SETTINGS.requireRegularPlusFromTier),
  };
}

export function discountPctForTier(settings: HealthcareCardSettings, tierNumber: number | null): number {
  if (!tierNumber || tierNumber < 1) return 0;
  if (tierNumber <= 3) return settings.discountTier1to3Pct;
  if (tierNumber <= 6) return settings.discountTier4to6Pct;
  return settings.discountTier7PlusPct;
}

/** Regular is only eligible for Tier 1; Regular Plus and above are eligible at every tier. */
export function membershipMeetsHealthcareRequirement(
  settings: HealthcareCardSettings,
  membershipName: string | null | undefined,
  tierNumber: number | null,
): boolean {
  const normalized = (membershipName ?? "").trim().toLowerCase();
  const isRegularOnly = normalized === "regular";
  if (!isRegularOnly) return true; // Regular Plus and above always qualify
  return (tierNumber ?? 1) < settings.requireRegularPlusFromTier;
}

function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function generateSscCode(): string {
  // "BPI-" + 10 random uppercase alphanumeric characters.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `BPI-${s}`;
}

/**
 * Subscribes or renews a member's healthcare card for one year. Debits the
 * Main Wallet, splits the fee, and resets the cover (unused cover does not
 * carry over).
 */
export async function subscribeHealthcareCard(
  prisma: PrismaClient,
  input: { userId: string },
): Promise<{ cardId: string; sscCode: string; coverAmount: number; expiresAt: Date }> {
  const settings = await loadHealthcareSettings(prisma);

  return prisma.$transaction(async (tx) => {
    const debited = await tx.user.updateMany({
      where: { id: input.userId, wallet: { gte: settings.price } },
      data: { wallet: { decrement: settings.price } },
    });
    if (debited.count === 0) throw new Error("Insufficient Main Wallet balance for the healthcare card.");

    const communityShare = Math.min(settings.communityShare, settings.price);
    const projectShare = settings.price - communityShare;

    if (communityShare > 0) {
      await tx.user.update({ where: { id: input.userId }, data: { community: { increment: communityShare } } });
      await tx.transaction.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          transactionType: "HEALTHCARE_CARD_COMMUNITY_SHARE",
          amount: communityShare,
          description: "Healthcare card subscription — share to your Community Wallet",
          status: "completed",
          walletType: "community",
        },
      });
    }
    if (projectShare > 0) {
      const projectWallet = await ensureBpiProjectAccount(tx);
      await tx.systemWallet.update({ where: { id: projectWallet.id }, data: { balanceNgn: { increment: projectShare } } });
    }

    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        transactionType: "HEALTHCARE_CARD_SUBSCRIPTION",
        amount: -settings.price,
        description: "Healthcare card subscription/renewal",
        status: "completed",
        walletType: "main",
      },
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const existing = await tx.healthcareCard.findUnique({ where: { userId: input.userId } });
    const card = existing
      ? await tx.healthcareCard.update({
          where: { userId: input.userId },
          data: {
            status: "active",
            coverAmount: settings.coverAmount,
            coverUsed: 0, // unused cover does not carry over
            monthKey: monthKeyOf(now),
            monthUsed: 0,
            issuedAt: now,
            expiresAt,
          },
        })
      : await tx.healthcareCard.create({
          data: {
            id: randomUUID(),
            userId: input.userId,
            sscCode: generateSscCode(),
            status: "active",
            coverAmount: settings.coverAmount,
            coverUsed: 0,
            monthKey: monthKeyOf(now),
            monthUsed: 0,
            issuedAt: now,
            expiresAt,
          },
        });

    return { cardId: card.id, sscCode: card.sscCode, coverAmount: card.coverAmount, expiresAt: card.expiresAt };
  });
}

/**
 * Looks up a member's live tier number and membership name, for the
 * discount calculation and eligibility check.
 */
export async function loadMemberHealthcareProfile(
  prisma: PrismaClient,
  userId: string,
): Promise<{ membershipName: string | null; tierNumber: number | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeMembershipPackageId: true },
  });
  const membershipPackage = user?.activeMembershipPackageId
    ? await prisma.membershipPackage.findUnique({ where: { id: user.activeMembershipPackageId }, select: { name: true } })
    : null;
  const standing = await ensureMemberStanding(prisma, userId);
  return { membershipName: membershipPackage?.name ?? null, tierNumber: standing.currentTierNumber };
}

/**
 * Records one use of the card at a centre, after the SSC/QR has been
 * resolved to a card. Covered services deduct from cover (capped at the
 * monthly and yearly limits); discount-only services apply the discount
 * with no cover deduction — the member pays the provider the discounted
 * price directly.
 */
export async function redeemHealthcareCard(
  prisma: PrismaClient,
  input: { sscCode: string; centreId: string; serviceId?: string; recordedByUserId?: string },
): Promise<{
  redemptionId: string;
  discountPct: number;
  servicePrice: number;
  discountAmount: number;
  coveredAmount: number;
  memberPays: number;
}> {
  const card = await prisma.healthcareCard.findUnique({ where: { sscCode: input.sscCode } });
  if (!card) throw new Error("Card not found.");
  if (card.status !== "active" || card.expiresAt < new Date()) throw new Error("This card is not active.");

  const service = input.serviceId
    ? await prisma.healthcareService.findUnique({ where: { id: input.serviceId } })
    : null;
  if (input.serviceId && !service) throw new Error("Service not found.");
  if (service && service.centreId !== input.centreId) throw new Error("This service does not belong to that centre.");

  const settings = await loadHealthcareSettings(prisma);
  const { tierNumber } = await loadMemberHealthcareProfile(prisma, card.userId);
  const discountPct = discountPctForTier(settings, tierNumber);
  const servicePrice = service?.price ?? 0;
  const discountAmount = Math.floor((servicePrice * discountPct) / 100);

  const now = new Date();
  const monthKey = monthKeyOf(now);

  return prisma.$transaction(async (tx) => {
    // Reset the monthly counter if we've rolled into a new month.
    const freshCard = await tx.healthcareCard.findUniqueOrThrow({ where: { id: card.id } });
    const monthUsedBefore = freshCard.monthKey === monthKey ? freshCard.monthUsed : 0;

    let coveredAmount = 0;
    let memberPays = servicePrice - discountAmount;

    if (service && !service.discountOnly) {
      // Covered service: BPI settles the centre from the cover, up to the
      // yearly cover and the monthly cap; discount applies to what's covered.
      const coveredPrice = servicePrice - discountAmount;
      const monthlyCap = Math.floor((settings.monthlyMaxPct / 100) * card.coverAmount);
      const remainingMonthly = Math.max(0, monthlyCap - monthUsedBefore);
      const remainingYearly = Math.max(0, card.coverAmount - freshCard.coverUsed);
      coveredAmount = Math.min(coveredPrice, remainingMonthly, remainingYearly);
      memberPays = coveredPrice - coveredAmount;
    }

    await tx.healthcareCard.update({
      where: { id: card.id },
      data: {
        coverUsed: { increment: coveredAmount },
        monthKey,
        monthUsed: monthUsedBefore + coveredAmount,
      },
    });

    const redemption = await tx.healthcareCardRedemption.create({
      data: {
        id: randomUUID(),
        cardId: card.id,
        centreId: input.centreId,
        serviceId: input.serviceId ?? null,
        servicePrice,
        discountPct,
        discountAmount,
        coveredAmount,
        memberPays,
        recordedByUserId: input.recordedByUserId ?? null,
      },
    });

    return { redemptionId: redemption.id, discountPct, servicePrice, discountAmount, coveredAmount, memberPays };
  });
}

/**
 * "Option 2: Promotional Healthcare Card Activation — ₦30,000" (BPI-CSP
 * "How It Works", 09/10/2026). Open to any member — new or existing — while
 * an admin has the bundle switched on. A member with no current membership
 * is first granted a free promotional "Regular" membership (no referral
 * commissions, since nothing is paid for the membership itself), then the
 * standard ₦30,000 Healthcare Card subscription runs unchanged — its
 * existing default split (₦10,000 to the member's Community Wallet,
 * ₦20,000 to the BPI Health & Project Account) already matches the bundle
 * exactly.
 */
export async function subscribeHealthcareCardPromoBundle(
  prisma: PrismaClient,
  input: { userId: string },
): Promise<{ cardId: string; sscCode: string; coverAmount: number; expiresAt: Date; grantedPromoMembership: boolean }> {
  const enabled = await isHealthcarePromoBundleEnabled(prisma);
  if (!enabled) throw new Error("The promotional Healthcare Card activation is not available right now.");

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { activeMembershipPackageId: true, membershipExpiresAt: true },
  });
  if (!user) throw new Error("User not found.");

  let grantedPromoMembership = false;
  if (!isCspMembershipCurrent(user)) {
    const regularPackage = await prisma.membershipPackage.findFirst({
      where: { name: "Regular", isActive: true },
    });
    if (!regularPackage) throw new Error("The Regular membership package is not configured.");

    const result = await activateMembershipAfterExternalPayment({
      prisma,
      userId: input.userId,
      packageId: regularPackage.id,
      paymentReference: `HCARD-PROMO-${input.userId}`,
      paymentMethodLabel: "Promotional Healthcare Card Bundle",
      activatorName: "Promo System",
      skipRewards: true,
    });
    grantedPromoMembership = !result.alreadyProcessed;
  }

  const card = await subscribeHealthcareCard(prisma, { userId: input.userId });
  return { ...card, grantedPromoMembership };
}
