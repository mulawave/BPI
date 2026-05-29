// @ts-nocheck
/**
 * Promo Activation Service
 *
 * Handles revenue-isolated free membership activations via promo campaigns.
 * Revenue pipeline (recordRevenue / wallet distributions) is deliberately
 * bypassed — these activations are fully funded by the admin and must never
 * touch the financial ledger.
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { activateMembershipAfterExternalPayment } from "./membershipPayments.service";

export type ActivePromo = {
  id: string;
  name: string;
  quota: number;
  usedCount: number;
  remaining: number;
  targetPackageId: string | null;
};

const ACTIVE_PROMO_CACHE_TTL_MS = 15_000;
let activePromoCache: { value: ActivePromo | null; expiresAt: number } | null = null;
let activePromoInFlight: Promise<ActivePromo | null> | null = null;

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

export function invalidateActivePromoCache() {
  activePromoCache = null;
}

function getPromoStartBoundary(date: Date | null) {
  if (!date) return null;
  const boundary = new Date(date);
  boundary.setHours(0, 0, 0, 0);
  return boundary;
}

function getPromoEndBoundary(date: Date | null) {
  if (!date) return null;
  const boundary = new Date(date);
  boundary.setHours(23, 59, 59, 999);
  return boundary;
}

/**
 * Returns the first active, non-expired promo campaign that still has quota.
 * Returns null if no promo is currently available.
 */
export async function getActivePromo(
  prisma: PrismaClient,
): Promise<ActivePromo | null> {
  if (activePromoCache && isFresh(activePromoCache.expiresAt)) {
    return activePromoCache.value;
  }

  if (activePromoInFlight) {
    return activePromoInFlight;
  }

  activePromoInFlight = (async () => {
  const now = new Date();

  const campaigns = await prisma.promoCampaign.findMany({
    where: {
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const campaign =
    campaigns.find((c) => {
      const startBoundary = getPromoStartBoundary(c.startDate);
      const endBoundary = getPromoEndBoundary(c.endDate);

      if (c.usedCount >= c.quota) return false;
      if (startBoundary && startBoundary > now) return false;
      if (endBoundary && endBoundary < now) return false;

      return true;
    }) ?? null;
  const value = !campaign
    ? null
    : {
    id: campaign.id,
    name: campaign.name,
    quota: campaign.quota,
    usedCount: campaign.usedCount,
    remaining: campaign.quota - campaign.usedCount,
    targetPackageId: campaign.targetPackageId,
    };

  activePromoCache = {
    value,
    expiresAt: Date.now() + ACTIVE_PROMO_CACHE_TTL_MS,
  };

  return value;
  })();

  try {
    return await activePromoInFlight;
  } finally {
    activePromoInFlight = null;
  }
}

/**
 * Atomically claims a promo activation for a user.
 *
 * Guards:
 * - User must not have already claimed any promo
 * - User must not already have an active membership
 * - Campaign must still be active and have quota remaining
 * - If campaign targets a specific package, the requested package must match
 *
 * On success: membership is activated via the standard service (which handles
 * referral chains, wallet distributions for existing members, notifications) but
 * recordRevenue() is NOT called — keeping the revenue ledger clean.
 */
export async function claimPromoActivation(
  prisma: PrismaClient,
  params: {
    userId: string;
    campaignId: string;
    packageId: string;
  },
): Promise<{ success: true; expiresAt: Date }> {
  const { userId, campaignId, packageId } = params;

  return prisma.$transaction(
    async (tx) => {
      // ── 1. Check campaign is still valid ─────────────────────────────────
      const campaign = await tx.promoCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign || !campaign.isActive) {
        throw new Error("PROMO_NOT_ACTIVE");
      }
      if (campaign.usedCount >= campaign.quota) {
        throw new Error("PROMO_QUOTA_EXHAUSTED");
      }

      const now = new Date();
      const startBoundary = getPromoStartBoundary(campaign.startDate);
      const endBoundary = getPromoEndBoundary(campaign.endDate);

      if (startBoundary && startBoundary > now) {
        throw new Error("PROMO_NOT_STARTED");
      }
      if (endBoundary && endBoundary < now) {
        throw new Error("PROMO_EXPIRED");
      }

      // Package must match if campaign targets a specific one
      if (campaign.targetPackageId && campaign.targetPackageId !== packageId) {
        throw new Error("PROMO_PACKAGE_MISMATCH");
      }

      // ── 2. Guard: user must not have already claimed ──────────────────────
      const existingClaim = await tx.promoActivationClaim.findUnique({
        where: { userId },
      });
      if (existingClaim) {
        throw new Error("PROMO_ALREADY_CLAIMED");
      }

      // ── 3. Guard: user must not already have an active membership ─────────
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { membershipExpiresAt: true },
      });
      if (!user) throw new Error("USER_NOT_FOUND");

      if (user.membershipExpiresAt && user.membershipExpiresAt > now) {
        throw new Error("MEMBERSHIP_ALREADY_ACTIVE");
      }

      // ── 4. Activate membership (no revenue recording) ────────────────────
      // We generate a deterministic promo reference so idempotency is preserved.
      const promoReference = `PROMO-${campaignId.slice(0, 8)}-${userId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;

      const result = await activateMembershipAfterExternalPayment({
        prisma: tx,
        userId,
        packageId,
        paymentReference: promoReference,
        paymentMethodLabel: `Promo Campaign: ${campaign.name}`,
        activatorName: "Promo System",
      });

      if (!result.success) {
        throw new Error("ACTIVATION_FAILED");
      }

      // ── 5. Record the claim ───────────────────────────────────────────────
      await tx.promoActivationClaim.create({
        data: {
          userId,
          campaignId,
          packageId,
        },
      });

      // ── 6. Increment usedCount ────────────────────────────────────────────
      await tx.promoCampaign.update({
        where: { id: campaignId },
        data: { usedCount: { increment: 1 } },
      });

      invalidateActivePromoCache();

      return { success: true as const, expiresAt: result.expiresAt as Date };
    },
    { timeout: 30_000 },
  );
}
