import type { PrismaClient } from "@prisma/client";

export type CspTierRecord = {
  tierNumber: number;
  name: string;
  contributionRight: number;
  maxSupportCap: number;
  minFulfilmentPct: number;
  isActive: boolean;
  isSpecial: boolean;
  sortOrder: number;
};

export interface ResolvedTier {
  tier: CspTierRecord | null;
  amountToNextTier: number | null;
}

const tierOrder = (tier: CspTierRecord) => [tier.contributionRight, tier.tierNumber];

export function resolveTier(activeTiers: CspTierRecord[], contributionRight: number): ResolvedTier {
  const sorted = [...activeTiers].sort((a, b) => {
    const [aContribution, aTier] = tierOrder(a);
    const [bContribution, bTier] = tierOrder(b);
    if (aContribution !== bContribution) return aContribution - bContribution;
    return aTier - bTier;
  });

  if (!sorted.length) {
    return { tier: null, amountToNextTier: null };
  }

  let currentTier: CspTierRecord | null = null;
  for (const tier of sorted) {
    if (tier.contributionRight <= contributionRight) {
      currentTier = tier;
      continue;
    }
    break;
  }

  const nextTier = sorted.find((tier) => tier.contributionRight > contributionRight) ?? null;

  return {
    tier: currentTier,
    amountToNextTier: nextTier ? Math.max(0, nextTier.contributionRight - contributionRight) : null,
  };
}

export async function loadActiveTiers(db: Pick<PrismaClient, "cspTier">): Promise<CspTierRecord[]> {
  return db.cspTier.findMany({
    where: { isActive: true },
    orderBy: [{ contributionRight: "asc" }, { tierNumber: "asc" }],
    select: {
      tierNumber: true,
      name: true,
      contributionRight: true,
      maxSupportCap: true,
      minFulfilmentPct: true,
      isActive: true,
      isSpecial: true,
      sortOrder: true,
    },
  });
}

type StandingDb = Pick<PrismaClient, "cspTier" | "cspContribution" | "cspMemberStanding" | "cspTopUpPurchase">;

/**
 * Corporate decision (follow-up Q13, 07/10/2026): a contribution a member
 * makes specifically to cover their own CSP time-extension fee does not
 * count towards their tier contribution-right. `CspTopUpPurchase.
 * contributedAmount` tracks exactly how much of a member's own
 * contributions went towards covering their own pending/applied/forfeited
 * purchase, capped at the fee itself (`amountPaid`) — anything contributed
 * beyond the fee still counts normally.
 */
async function sumTopUpCoveredContributions(db: StandingDb, userId: string): Promise<number> {
  const purchases = await db.cspTopUpPurchase.findMany({
    where: { userId },
    select: { contributedAmount: true, amountPaid: true },
  });
  return purchases.reduce((sum, p) => sum + Math.min(p.contributedAmount, p.amountPaid), 0);
}

async function backfillContributionRight(db: StandingDb, userId: string) {
  const aggregate = await db.cspContribution.aggregate({
    where: { contributorId: userId },
    _sum: { amount: true },
  });
  const topUpCovered = await sumTopUpCoveredContributions(db, userId);
  return Math.max(0, (aggregate._sum.amount ?? 0) - topUpCovered);
}

export function reconcileStandingFromContributionRight(
  activeTiers: CspTierRecord[],
  contributionRight: number,
) {
  const resolved = resolveTier(activeTiers, contributionRight);
  return {
    contributionRight,
    currentTierNumber: resolved.tier?.tierNumber ?? null,
  };
}

export async function ensureMemberStanding(db: StandingDb, userId: string) {
  const activeTiers = await loadActiveTiers(db);
  const existing = await db.cspMemberStanding.findUnique({ where: { userId } });
  const contributionRight = await backfillContributionRight(db, userId);
  const nextStanding = reconcileStandingFromContributionRight(activeTiers, contributionRight);

  if (!existing) {
    return db.cspMemberStanding.create({
      data: { userId, ...nextStanding },
    });
  }

  if (
    existing.contributionRight !== nextStanding.contributionRight ||
    existing.currentTierNumber !== nextStanding.currentTierNumber
  ) {
    return db.cspMemberStanding.update({
      where: { userId },
      data: nextStanding,
    });
  }

  return existing;
}

export async function reconcileMemberStandingContributionRight(
  db: StandingDb,
  userId: string,
) {
  return ensureMemberStanding(db, userId);
}

export async function recomputeMemberStandingContributionRight(
  db: StandingDb,
  userId: string,
) {
  return reconcileMemberStandingContributionRight(db, userId);
}

export function buildTierSnapshot(activeTiers: CspTierRecord[], contributionRight: number) {
  const resolved = resolveTier(activeTiers, contributionRight);
  return {
    ...resolved,
    currentTier: resolved.tier
      ? {
          tierNumber: resolved.tier.tierNumber,
          name: resolved.tier.name,
          maxSupportCap: resolved.tier.maxSupportCap,
        }
      : null,
    maxSupportCap: resolved.tier?.maxSupportCap ?? 0,
  };
}

export function validateTierSupportRequest(
  activeTiers: CspTierRecord[],
  contributionRight: number,
  requestedAmount: number,
) {
  const snapshot = buildTierSnapshot(activeTiers, contributionRight);
  if (!snapshot.tier) {
    return {
      ok: false as const,
      reason: "You are not yet eligible for a tier-based support request.",
      ...snapshot,
    };
  }

  if (requestedAmount > snapshot.maxSupportCap) {
    return {
      ok: false as const,
      reason: `Requested amount exceeds your tier support cap of ₦${snapshot.maxSupportCap.toLocaleString()}.`,
      ...snapshot,
    };
  }

  return {
    ok: true as const,
    reason: null as string | null,
    ...snapshot,
  };
}
