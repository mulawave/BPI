import type { PrismaClient } from "@prisma/client";
import { ensureMemberStanding } from "@/server/services/csp-tier.service";

export type EffectiveCoolingState = {
  source: "standing" | "request" | null;
  cooldownEndsAt: Date | null;
  cooldownMonths: number | null;
  isActive: boolean;
  lastSupportReleasedAt: Date | null;
};

export type SponsorCoolingReductionDecision = {
  directSponsorCount: number;
  requiredCount: number;
  reducedCoolingMonths: number;
  qualifies: boolean;
  currentCoolingEndsAt: Date | null;
  reducedCoolingEndsAt: Date | null;
  shouldShorten: boolean;
};

export type SponsorProgressConfig = {
  sponsorshipRequiredCount: number;
  sponsorshipReducedCoolingMonths: number;
  sponsorshipRequiresKyc: boolean;
  sponsorshipRequiresRegularPlus: boolean;
  sponsorshipAutoApply: boolean;
  /** Sponsored members must hold a current (unexpired) membership. */
  sponsorshipRequiresActive?: boolean;
  /** Minimum lifetime CSP contribution (₦) each sponsored member must have made. */
  sponsorshipMinContribution?: number;
};

type CoolingDb = Pick<
  PrismaClient,
  "referral" | "user" | "kycSubmission" | "membershipPackage" | "cspMemberStanding" | "cspRuleChangeLog" | "cspTier" | "cspContribution" | "cspTopUpPurchase"
>;

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function selectEffectiveCoolingState(params: {
  tierModelEnabled: boolean;
  releasedCooldownEndsAt: Date | null;
  releasedCooldownMonths?: number | null;
  standingCoolingEndsAt: Date | null;
  standingCoolingMonthsBase?: number | null;
  standingLastSupportReleasedAt: Date | null;
  now?: Date;
}): EffectiveCoolingState {
  const now = params.now ?? new Date();

  if (params.tierModelEnabled) {
    const cooldownEndsAt =
      params.standingLastSupportReleasedAt && params.standingCoolingEndsAt
        ? params.standingCoolingEndsAt
        : null;

    return {
      source: "standing",
      cooldownEndsAt,
      cooldownMonths: params.standingCoolingMonthsBase ?? null,
      isActive: Boolean(cooldownEndsAt && cooldownEndsAt > now),
      lastSupportReleasedAt: params.standingLastSupportReleasedAt,
    };
  }

  const cooldownEndsAt = params.releasedCooldownEndsAt ?? null;
  return {
    source: "request",
    cooldownEndsAt,
    cooldownMonths: params.releasedCooldownMonths ?? null,
    isActive: Boolean(cooldownEndsAt && cooldownEndsAt > now),
    lastSupportReleasedAt: null,
  };
}

export function computeSponsorCoolingReduction(params: {
  directSponsorCount: number;
  requiredCount: number;
  reducedCoolingMonths: number;
  lastSupportReleasedAt: Date | null;
  currentCoolingEndsAt: Date | null;
}): SponsorCoolingReductionDecision {
  const qualifies = params.directSponsorCount >= params.requiredCount;
  const reducedCoolingEndsAt = params.lastSupportReleasedAt
    ? addMonths(params.lastSupportReleasedAt, params.reducedCoolingMonths)
    : null;
  const shouldShorten =
    qualifies &&
    Boolean(params.currentCoolingEndsAt && reducedCoolingEndsAt && reducedCoolingEndsAt < params.currentCoolingEndsAt);

  return {
    directSponsorCount: params.directSponsorCount,
    requiredCount: params.requiredCount,
    reducedCoolingMonths: params.reducedCoolingMonths,
    qualifies,
    currentCoolingEndsAt: params.currentCoolingEndsAt,
    reducedCoolingEndsAt,
    shouldShorten,
  };
}

export async function loadDirectSponsorCount(
  db: Pick<PrismaClient, "referral" | "user" | "kycSubmission" | "membershipPackage" | "cspContribution">,
  userId: string,
  config: SponsorProgressConfig,
  now: Date = new Date(),
) {
  const referrals = await db.referral.findMany({
    where: { referrerId: userId },
    select: { referredId: true },
  });

  if (referrals.length === 0) {
    return { directSponsorCount: 0 };
  }

  const referredIds = referrals.map((row) => row.referredId);

  const regularPlusPackages = config.sponsorshipRequiresRegularPlus
    ? await db.membershipPackage.findMany({
        where: {
          name: {
            in: ["Regular Plus", "Gold", "Gold Plus", "Platinum", "Platinum Plus"],
          },
        },
        select: { id: true },
      })
    : [];

  const directUsers = await db.user.findMany({
    where: {
      id: { in: referredIds },
      ...(config.sponsorshipRequiresRegularPlus
        ? {
            membershipActivatedAt: { not: null },
            activeMembershipPackageId: {
              in: regularPlusPackages.map((row) => row.id),
            },
          }
        : {}),
      ...(config.sponsorshipRequiresActive
        ? { membershipExpiresAt: { gt: now } }
        : {}),
    },
    select: { id: true, activeMembershipPackageId: true },
  });

  const minContribution = Math.max(0, config.sponsorshipMinContribution ?? 0);
  const contributedEnough = new Set<string>();
  if (minContribution > 0 && directUsers.length > 0) {
    const sums = await db.cspContribution.groupBy({
      by: ["contributorId"],
      where: { contributorId: { in: directUsers.map((u) => u.id) } },
      _sum: { amount: true },
    });
    for (const row of sums as Array<{ contributorId: string; _sum: { amount: number | null } }>) {
      if ((row._sum.amount ?? 0) >= minContribution) contributedEnough.add(row.contributorId);
    }
  }

  const latestKycRows = config.sponsorshipRequiresKyc
    ? await db.kycSubmission.findMany({
        where: { userId: { in: referredIds } },
        orderBy: [{ userId: "asc" }, { submittedAt: "desc" }],
        select: { userId: true, status: true },
      })
    : [];

  const regularPlusPackageIds = new Set(regularPlusPackages.map((row) => row.id));
  const latestKycByUser = new Map<string, string>();
  for (const row of latestKycRows as Array<{ userId: string; status: string }>) {
    if (!latestKycByUser.has(row.userId)) {
      latestKycByUser.set(row.userId, row.status);
    }
  }

  let directSponsorCount = 0;
  for (const user of directUsers as Array<{ id: string; activeMembershipPackageId: string | null }>) {
    const regularPlusOk =
      !config.sponsorshipRequiresRegularPlus ||
      (user.activeMembershipPackageId !== null && regularPlusPackageIds.has(user.activeMembershipPackageId));
    const kycOk =
      !config.sponsorshipRequiresKyc || latestKycByUser.get(user.id) === "approved";

    const contributionOk = minContribution <= 0 || contributedEnough.has(user.id);

    if (regularPlusOk && kycOk && contributionOk) {
      directSponsorCount++;
    }
  }

  return { directSponsorCount };
}

export async function reconcileSponsorCoolingProgress(
  db: CoolingDb,
  userId: string,
  config: SponsorProgressConfig,
  options?: {
    autoApply?: boolean;
    forceApply?: boolean;
    adminUserId?: string;
    reason?: string | null;
    now?: Date;
  },
) {
  const now = options?.now ?? new Date();
  const standing = await ensureMemberStanding(db, userId);
  const { directSponsorCount } = await loadDirectSponsorCount(db, userId, config);

  let nextStanding = standing;
  if (standing.directSponsorCount !== directSponsorCount) {
    nextStanding = await db.cspMemberStanding.update({
      where: { userId },
      data: { directSponsorCount },
    });
  }

  const decision = computeSponsorCoolingReduction({
    directSponsorCount,
    requiredCount: config.sponsorshipRequiredCount,
    reducedCoolingMonths: config.sponsorshipReducedCoolingMonths,
    lastSupportReleasedAt: nextStanding.lastSupportReleasedAt,
    currentCoolingEndsAt: nextStanding.coolingEndsAt,
  });

  const shouldApply = Boolean(
    (options?.forceApply ?? false) ? decision.shouldShorten : ((options?.autoApply ?? false) && decision.shouldShorten),
  );
  if (!shouldApply) {
    return {
      standing: nextStanding,
      decision,
      applied: false,
    };
  }

  const updatedStanding = await db.cspMemberStanding.update({
    where: { userId },
    data: {
      coolingEndsAt: decision.reducedCoolingEndsAt,
      coolingMonthsBase: config.sponsorshipReducedCoolingMonths,
    },
  });

  if (options?.adminUserId) {
    await db.cspRuleChangeLog.create({
      data: {
        adminUserId: options.adminUserId,
        ruleKey: "csp_sponsorship_cooling_reduction",
        previousValue: nextStanding.coolingEndsAt ? nextStanding.coolingEndsAt.toISOString() : null,
        newValue: decision.reducedCoolingEndsAt ? decision.reducedCoolingEndsAt.toISOString() : null,
        reason: options.reason ?? null,
      },
    });
  }

  return {
    standing: updatedStanding,
    decision,
    applied: true,
  };
}
