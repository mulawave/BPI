import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import {
  notifyCspBroadcastExtended,
  notifyCspContributionReceived,
  notifyCspContributionSent,
  notifyCspRequestApproved,
  notifyCspRequestReceived,
  notifyCspRequestProcessed,
  notifyCspRequestRejected,
  notifyCspRequestSubmitted,
  sendCspLifecycleEmail,
} from "@/server/services/notification.service";
import {
  buildTierSnapshot,
  ensureMemberStanding,
  loadActiveTiers,
  reconcileMemberStandingContributionRight,
  validateTierSupportRequest,
} from "@/server/services/csp-tier.service";
import {
  reconcileSponsorCoolingProgress,
  selectEffectiveCoolingState,
} from "@/server/services/csp-cooling.service";
import {
  buildCspDonationCertificateUrl,
  loadActiveCspDonationBadgeCategories,
  resolveCspDonationBadgeCategory,
} from "@/server/services/csp-donations.service";
import { isCspBroadcastVisible, getCspBroadcastHiddenReason } from "@/lib/csp/broadcastVisibility";
import { loadTierConfig, type TierConfig } from "@/server/services/csp-config.service";
import { getCspAdminOverview as fetchCspAdminOverview } from "@/server/services/csp-admin-overview.service";

// Hardcoded fallback defaults – overridden by AdminSettings when set
const DEFAULTS = {
  minPerContribution: 500,
  national: {
    minMembership: "regular plus",
    minDirects: 2,
    minCumulativeContrib: 10000,
    minDistinctRequests: 10,
    broadcastHours: 48,
    minThreshold: 10000,
  },
  global: {
    minMembership: "regular plus",
    minDirects: 10,
    minCumulativeContrib: 20000,
    minDistinctRequests: 10,
    broadcastHours: 48,
    minThreshold: 20000,
  },
  waitReductionMonthlyTarget: 10000, // ₦10k/month = 1 month deducted from cooldown
};

type CategoryKey = "national" | "global";

interface EligibilityConfig {
  minPerContribution: number;
  national: { minMembership: string; minDirects: number; minCumulativeContrib: number; minDistinctRequests: number; broadcastHours: number; minThreshold: number };
  global: { minMembership: string; minDirects: number; minCumulativeContrib: number; minDistinctRequests: number; broadcastHours: number; minThreshold: number };
  waitReductionMonthlyTarget: number;
}


async function loadEligibilityConfig(db: typeof prisma): Promise<EligibilityConfig> {
  const keys = [
    "csp_min_per_contribution",
    "csp_national_min_membership",
    "csp_national_min_directs",
    "csp_national_min_cumulative_contrib",
    "csp_national_min_distinct_requests",
    "csp_national_broadcast_hours",
    "csp_national_min_threshold",
    "csp_global_min_membership",
    "csp_global_min_directs",
    "csp_global_min_cumulative_contrib",
    "csp_global_min_distinct_requests",
    "csp_global_broadcast_hours",
    "csp_global_min_threshold",
    "csp_wait_reduction_monthly_target",
  ];
  const rows = await db.adminSettings.findMany({ where: { settingKey: { in: keys } } });
  const m = new Map(rows.map((r: any) => [r.settingKey, r.settingValue]));
  const n = (key: string, def: number) => { const v = parseFloat(m.get(key) ?? ""); return isFinite(v) && v >= 0 ? v : def; };
  const s = (key: string, def: string) => m.get(key) ?? def;
  return {
    minPerContribution: n("csp_min_per_contribution", DEFAULTS.minPerContribution),
    national: {
      minMembership: s("csp_national_min_membership", DEFAULTS.national.minMembership),
      minDirects: n("csp_national_min_directs", DEFAULTS.national.minDirects),
      minCumulativeContrib: n("csp_national_min_cumulative_contrib", DEFAULTS.national.minCumulativeContrib),
      minDistinctRequests: n("csp_national_min_distinct_requests", DEFAULTS.national.minDistinctRequests),
      broadcastHours: n("csp_national_broadcast_hours", DEFAULTS.national.broadcastHours),
      minThreshold: n("csp_national_min_threshold", DEFAULTS.national.minThreshold),
    },
    global: {
      minMembership: s("csp_global_min_membership", DEFAULTS.global.minMembership),
      minDirects: n("csp_global_min_directs", DEFAULTS.global.minDirects),
      minCumulativeContrib: n("csp_global_min_cumulative_contrib", DEFAULTS.global.minCumulativeContrib),
      minDistinctRequests: n("csp_global_min_distinct_requests", DEFAULTS.global.minDistinctRequests),
      broadcastHours: n("csp_global_broadcast_hours", DEFAULTS.global.broadcastHours),
      minThreshold: n("csp_global_min_threshold", DEFAULTS.global.minThreshold),
    },
    waitReductionMonthlyTarget: n("csp_wait_reduction_monthly_target", DEFAULTS.waitReductionMonthlyTarget),
  };
}


const MEMBERSHIP_ORDER = ["basic", "regular", "regular plus", "gold", "gold plus", "platinum", "platinum plus"] as const;

type MembershipOrder = typeof MEMBERSHIP_ORDER[number];

function assertAdmin(session: any) {
  const role = session?.user?.role;
  if (!role || (role !== "admin" && role !== "superadmin" && role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
}

function normalizeMembership(value?: string | null): MembershipOrder | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return MEMBERSHIP_ORDER.find((m) => m === normalized) ?? null;
}

function meetsMembership(current: MembershipOrder | null, required: string) {
  if (!current) return false;
  const currentIndex = MEMBERSHIP_ORDER.indexOf(current);
  const requiredIndex = MEMBERSHIP_ORDER.indexOf(required as MembershipOrder);
  if (requiredIndex === -1) return false;
  return currentIndex >= requiredIndex;
}

type MembershipPackagePriceRow = {
  id: string;
  name: string;
  price: number | null;
};

function buildMembershipPriceLookup(packages: MembershipPackagePriceRow[]) {
  const byId = new Map<string, number | null>();
  const byName = new Map<string, number | null>();
  for (const pkg of packages) {
    byId.set(pkg.id, pkg.price);
    byName.set(pkg.name.trim().toLowerCase(), pkg.price);
  }
  return { byId, byName };
}

function resolveMembershipPrice(
  lookup: ReturnType<typeof buildMembershipPriceLookup>,
  required: string,
) {
  return lookup.byName.get(required.trim().toLowerCase()) ?? null;
}

function evaluateMembershipRequirement(params: {
  membershipActive: boolean;
  membership: MembershipOrder | null;
  userPrice: number | null;
  requiredMembership: string;
  requiredPrice: number | null;
}) {
  const { membershipActive, membership, userPrice, requiredMembership, requiredPrice } = params;
  if (membershipActive && userPrice != null && requiredPrice != null) {
    return userPrice >= requiredPrice;
  }
  return meetsMembership(membership, requiredMembership);
}

function computeEligibilityFlags(params: {
  category: CategoryKey;
  membershipMeets: boolean;
  membershipMeetsRegularPlus: boolean;
  qualifiedDirects: number; // directs with at least Regular membership
  cumulativeContributions: number;
  requestsContributed: number;
  hasAnyActivatedCountry: boolean;
  userCountryIsActivated: boolean;
  config: EligibilityConfig;
}) {
  const {
    category, membershipMeets, membershipMeetsRegularPlus,
    qualifiedDirects, cumulativeContributions, requestsContributed,
    hasAnyActivatedCountry, userCountryIsActivated, config,
  } = params;

  const rules = config[category];
  const hasMembership = membershipMeets;
  const hasDistinct = requestsContributed >= rules.minDistinctRequests;
  const hasContrib = cumulativeContributions >= rules.minCumulativeContrib;

  if (category === "national") {
    const hasDirects = qualifiedDirects >= rules.minDirects;
    const eligible = hasMembership && hasDirects && hasContrib && hasDistinct;
    return { eligible, hasMembership, hasDirects, hasContrib, hasDistinct, globalPath: null as string | null };
  }

  // Global — two paths
  // Path A: Regular Plus, admin-configured directs, ₦20k contrib, at least one active country globally
  const pathAMembership = membershipMeetsRegularPlus;
  const pathADirects = qualifiedDirects >= config.global.minDirects;
  const pathAEligible = pathAMembership && pathADirects && hasContrib && hasDistinct && hasAnyActivatedCountry;

  // Path B: user's own country activated, admin-configured directs, ₦20k contrib
  const pathBDirects = qualifiedDirects >= config.global.minDirects;
  const pathBEligible = pathBDirects && hasContrib && hasDistinct && userCountryIsActivated;

  const eligible = pathAEligible || pathBEligible;
  const hasDirects = pathADirects || pathBDirects;
  const globalPath = pathAEligible ? "A" : pathBEligible ? "B" : null;

  return { eligible, hasMembership, hasDirects, hasContrib, hasDistinct, globalPath };
}

/**
 * Loads CSP fee percentages from AdminSettings, falling back to spec-correct defaults.
 * Distribution: 80% recipient | 5% BPI Profit Pool | 2% sponsor | 2% state | 4% management | 7% reserve = 100%
 */
async function loadCspFeePercentages(tx: any): Promise<{
  recipient: number; admin: number; sponsor: number; state: number; management: number; reserve: number;
}> {
  const keys = [
    "csp_fee_recipient_pct",
    "csp_fee_admin_pct",
    "csp_fee_sponsor_pct",
    "csp_fee_state_pct",
    "csp_fee_management_pct",
    "csp_fee_reserve_pct",
  ];
  const rows = await tx.adminSettings.findMany({ where: { settingKey: { in: keys } } });
  const map = new Map(rows.map((r: any) => [r.settingKey, parseFloat(r.settingValue ?? "")]));
  const g = (key: string, def: number) => {
    const v = map.get(key);
    return typeof v === "number" && isFinite(v) && v >= 0 ? v : def;
  };
  return {
    recipient:  g("csp_fee_recipient_pct",  0.80),
    admin:      g("csp_fee_admin_pct",      0.05), // BPI Profit Pool
    sponsor:    g("csp_fee_sponsor_pct",    0.02), // direct sponsor — spec: 2%
    state:      g("csp_fee_state_pct",      0.02), // state wallet — spec: 2%
    management: g("csp_fee_management_pct", 0.04), // management wallet — spec: 4%
    reserve:    g("csp_fee_reserve_pct",    0.07), // reserve pool — spec: 7%
  };
}

async function ensureSystemWallet(tx: any, name: string, walletType: string) {
  return tx.systemWallet.upsert({
    where: { name },
    update: { updatedAt: new Date() },
    create: {
      id: randomUUID(),
      name,
      walletType,
      balanceNgn: 0,
      balanceUsd: 0,
      balanceBpt: 0,
      updatedAt: new Date(),
    },
  });
}

export const cspRouter = createTRPCRouter({
  getEligibility: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");

    // ── Phase 1: fetch config + user profile in parallel ─────────────────────
    const [config, tierConfig, user] = await Promise.all([
      loadEligibilityConfig(prisma),
      loadTierConfig(prisma),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          wallet: true,
          community: true,
          countryId: true,
          country: true, // ISO string field
        },
      }),
    ]);

    const userCountryCode = (user as any)?.country ?? null;

    // ── Phase 2: fire all remaining independent queries in parallel ───────────
    const [
      membershipPackages,
      allReferrals,
      contributionGroups,
      userCountryRecord,
      anyActivatedCountry,
      latestReleased,
      memberStanding,
      activeTiers,
      latestKycSubmission,
      autoDebitSetting,
      autoContributeSetting,
    ] = await Promise.all([
      prisma.membershipPackage.findMany({
        select: { id: true, name: true, price: true },
      }),

      // Direct referrals
      prisma.referral.findMany({
        where: { referrerId: userId },
        select: { referredId: true },
      }),

      // Contribution stats
      prisma.cspContribution.groupBy({
        by: ["requestId"],
        where: { contributorId: userId },
        _sum: { amount: true },
      }),

      // User's country activation record
      userCountryCode
        ? prisma.cspCountry.findUnique({ where: { countryCode: userCountryCode } })
        : Promise.resolve(null),

      // Any globally-activated country
      prisma.cspCountry.findFirst({ where: { isNationalActive: true } }),

      // Cooldown — most recent released request
      prisma.cspSupportRequest.findFirst({
        where: { userId, status: "released", cooldownEndsAt: { not: null } },
        orderBy: { releasedAt: "desc" },
        select: { id: true, cooldownEndsAt: true, cooldownMonths: true, releasedAt: true },
      }),

      ensureMemberStanding(prisma, userId),
      loadActiveTiers(prisma),
      prisma.kycSubmission.findFirst({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        select: { status: true },
      }),
      prisma.walletAutoDebitSetting.findUnique({
        where: { userId },
        select: { isEnabled: true },
      }),
      prisma.cspAutoContributeSetting.findUnique({
        where: { userId },
        select: { isEnabled: true },
      }),
    ]);

    const membershipLookup = buildMembershipPriceLookup(membershipPackages);
    const membershipName = user?.activeMembershipPackageId
      ? membershipPackages.find((pkg) => pkg.id === user.activeMembershipPackageId)?.name ?? null
      : null;
    const membership = normalizeMembership(membershipName);
    // Use activeMembershipPackageId as the source of truth (same as user.getDetails),
    // NOT membershipActivatedAt which may be null for some activated members.
    const membershipActive = Boolean(user?.activeMembershipPackageId && membershipName);
    const membershipPrice = user?.activeMembershipPackageId
      ? membershipLookup.byId.get(user.activeMembershipPackageId) ?? null
      : null;
    const requiredNationalMembershipPrice = resolveMembershipPrice(membershipLookup, config.national.minMembership);
    const requiredGlobalMembershipPrice = resolveMembershipPrice(membershipLookup, config.global.minMembership);
    const requiredRegularPlusPrice = resolveMembershipPrice(membershipLookup, "regular plus");
    const membershipMeetsNational = evaluateMembershipRequirement({
      membershipActive,
      membership,
      userPrice: membershipPrice,
      requiredMembership: config.national.minMembership,
      requiredPrice: requiredNationalMembershipPrice,
    });
    const membershipMeetsGlobal = evaluateMembershipRequirement({
      membershipActive,
      membership,
      userPrice: membershipPrice,
      requiredMembership: config.global.minMembership,
      requiredPrice: requiredGlobalMembershipPrice,
    });
    const membershipMeetsRegularPlus = evaluateMembershipRequirement({
      membershipActive,
      membership,
      userPrice: membershipPrice,
      requiredMembership: "regular plus",
      requiredPrice: requiredRegularPlusPrice,
    });

    const referredIds = allReferrals.map((r: any) => r.referredId);
    const cumulativeContributions = contributionGroups.reduce((sum: number, row: any) => sum + (row._sum.amount ?? 0), 0);
    const requestsContributed = contributionGroups.length;

    const userCountryIsActivated = userCountryRecord?.isNationalActive ?? false;
    const hasAnyActivatedCountry = anyActivatedCountry !== null;
    const kycApproved = latestKycSubmission?.status === "approved";
    const autoDebitEnabled = autoDebitSetting?.isEnabled ?? false;
    const autoContributeEnabled = autoContributeSetting?.isEnabled ?? false;
    const tierSnapshot = buildTierSnapshot(activeTiers, memberStanding.contributionRight);
    const sponsorProgress = tierConfig.tierModelEnabled
      ? await prisma.$transaction((tx) =>
          reconcileSponsorCoolingProgress(
            tx,
            userId,
            {
              sponsorshipRequiredCount: tierConfig.sponsorshipRequiredCount,
              sponsorshipReducedCoolingMonths: tierConfig.sponsorshipReducedCoolingMonths,
              sponsorshipRequiresKyc: tierConfig.sponsorshipRequiresKyc,
              sponsorshipRequiresRegularPlus: tierConfig.sponsorshipRequiresRegularPlus,
              sponsorshipAutoApply: tierConfig.sponsorshipAutoApply,
            },
            { autoApply: tierConfig.sponsorshipAutoApply }
          )
        )
      : null;
    const cooling = selectEffectiveCoolingState({
      tierModelEnabled: tierConfig.tierModelEnabled,
      releasedCooldownEndsAt: latestReleased?.cooldownEndsAt ?? null,
      releasedCooldownMonths: latestReleased?.cooldownMonths ?? null,
      standingCoolingEndsAt: sponsorProgress?.standing.coolingEndsAt ?? memberStanding.coolingEndsAt ?? null,
      standingCoolingMonthsBase: sponsorProgress?.standing.coolingMonthsBase ?? memberStanding.coolingMonthsBase ?? null,
      standingLastSupportReleasedAt: sponsorProgress?.standing.lastSupportReleasedAt ?? memberStanding.lastSupportReleasedAt ?? null,
      now: new Date(),
    });
    const tierStanding = sponsorProgress?.standing ?? memberStanding;
    const tierEligibility = !tierConfig.tierModelEnabled || (
      (!tierConfig.requireKyc || kycApproved) &&
      (!tierConfig.requireAutoDebit || autoDebitEnabled) &&
      (!tierConfig.requireAutoContribute || autoContributeEnabled) &&
      tierStanding.contributionRight >= tierConfig.minContributionRight &&
      tierSnapshot.tier !== null &&
      !cooling.isActive
    );

    // ── Phase 3: qualified-directs count (depends on referredIds + pkg IDs) ───
    let qualifiedDirects = 0;
    if (referredIds.length > 0) {
      const regularPkgIdSet = new Set(
        membershipPackages
          .filter((pkg) => ["regular", "regular plus", "gold", "gold plus", "platinum", "platinum plus"].includes(pkg.name.trim().toLowerCase()))
          .map((pkg) => pkg.id)
      );
      const qualifiedUsers = await prisma.user.findMany({
        where: {
          id: { in: referredIds },
          membershipActivatedAt: { not: null },
          activeMembershipPackageId: { in: [...regularPkgIdSet] },
        },
        select: { id: true },
      });
      qualifiedDirects = qualifiedUsers.length;
    }

    const categories = {
      national: computeEligibilityFlags({ category: "national", membershipMeets: membershipMeetsNational, membershipMeetsRegularPlus, qualifiedDirects, cumulativeContributions, requestsContributed, hasAnyActivatedCountry, userCountryIsActivated, config }),
      global: computeEligibilityFlags({ category: "global", membershipMeets: membershipMeetsGlobal, membershipMeetsRegularPlus, qualifiedDirects, cumulativeContributions, requestsContributed, hasAnyActivatedCountry, userCountryIsActivated, config }),
    } as const;

    const tierAdjustedCategories = tierConfig.tierModelEnabled
      ? {
          national: { ...categories.national, eligible: categories.national.eligible && tierEligibility },
          global: { ...categories.global, eligible: categories.global.eligible && tierEligibility },
        }
      : categories;

    // B8: Send qualification notification when user first becomes eligible
    const anyEligible = tierAdjustedCategories.national.eligible || tierAdjustedCategories.global.eligible;
    if (anyEligible) {
      const existingQualNotification = await prisma.notification.findFirst({
        where: {
          userId,
          title: "CSP Eligibility Met",
        },
        select: { id: true },
      });
      if (!existingQualNotification) {
        await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId,
            title: "CSP Eligibility Met",
            message: "Congratulations! You now meet the eligibility requirements for the Community Support Program. You can submit a support request.",
            link: "/csp",
            isRead: false,
          },
        });
      }
    }

    return {
      membershipName,
      membershipLabel: membershipName ?? "No active membership",
      membershipActive,
      directReferrals: allReferrals.length,
      qualifiedDirects,
      cumulativeContributions,
      minContributionRequired: config.national.minCumulativeContrib,
      minDistinctRequests: config.national.minDistinctRequests,
      minPerContribution: config.minPerContribution,
      requestsContributed,
      categories: tierAdjustedCategories,
      contributionRight: memberStanding.contributionRight,
      currentTier: tierSnapshot.currentTier,
      maxSupportCap: tierSnapshot.maxSupportCap,
      amountToNextTier: tierSnapshot.amountToNextTier,
      contributionMultiplier: tierConfig.contributionMultiplier,
      tierModelEnabled: tierConfig.tierModelEnabled,
      kycApproved,
      autoDebitEnabled,
      autoContributeEnabled,
      walletBalance: (user as any)?.wallet ?? 0,
      communityBalance: (user as any)?.community ?? 0,
      userCountryCode,
      userCountryIsActivated,
      hasAnyActivatedCountry,
      cooldown: tierConfig.tierModelEnabled
        ? (cooling.cooldownEndsAt
            ? {
                source: cooling.source,
                requestId: latestReleased?.id ?? null,
                cooldownMonths: cooling.cooldownMonths,
                cooldownEndsAt: cooling.cooldownEndsAt,
                releasedAt: cooling.lastSupportReleasedAt,
                isActive: cooling.isActive,
              }
            : null)
        : (latestReleased ? {
            requestId: latestReleased.id,
            cooldownMonths: latestReleased.cooldownMonths,
            cooldownEndsAt: latestReleased.cooldownEndsAt,
            releasedAt: latestReleased.releasedAt,
            isActive: cooling.isActive,
          } : null),
      sponsorProgress: tierConfig.tierModelEnabled
        ? {
            directSponsorCount: tierStanding.directSponsorCount,
            requiredCount: tierConfig.sponsorshipRequiredCount,
            reducedCoolingMonths: tierConfig.sponsorshipReducedCoolingMonths,
            reducedCoolingEndsAt: sponsorProgress?.decision.reducedCoolingEndsAt ?? null,
            qualifies: sponsorProgress?.decision.qualifies ?? false,
            shouldShorten: sponsorProgress?.decision.shouldShorten ?? false,
            applied: sponsorProgress?.applied ?? false,
          }
        : null,
      categoryConfig: {
        national: {
          label: "National",
          minDirects: config.national.minDirects,
          broadcastHours: config.national.broadcastHours,
          minThreshold: config.national.minThreshold,
          minCumulativeContrib: config.national.minCumulativeContrib,
          minDistinctRequests: config.national.minDistinctRequests,
        },
        global: {
          label: "Global",
          minDirects: config.global.minDirects,
          broadcastHours: config.global.broadcastHours,
          minThreshold: config.global.minThreshold,
          minCumulativeContrib: config.global.minCumulativeContrib,
          minDistinctRequests: config.global.minDistinctRequests,
        },
      },
    };
  }),

  /** Get the current user's CSP donation recognition records */
  getMyCspRecognition: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");

    const [donations, badges] = await Promise.all([
      prisma.cspDonation.findMany({
        where: { donorUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.cspTimeReductionBadge.findMany({
        where: { ownerUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          Category: {
            select: {
              id: true,
              name: true,
              badgeType: true,
              coolingReductionMonths: true,
            },
          },
        },
      }),
    ]);

    const totalDonatedAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

    return {
      totalDonatedAmount,
      donationCount: donations.length,
      badgeCount: badges.length,
      latestDonation: donations[0]
        ? {
            ...donations[0],
            certificateUrl:
              donations[0].certificateUrl ?? buildCspDonationCertificateUrl(donations[0].id),
          }
        : null,
      donations: donations.map((donation) => ({
        ...donation,
        certificateUrl:
          donation.certificateUrl ?? buildCspDonationCertificateUrl(donation.id),
      })),
      badges: badges.map(({ Category, ...badge }) => ({
        ...badge,
        category: Category
          ? {
              id: Category.id,
              name: Category.name,
              badgeType: Category.badgeType,
              coolingReductionMonths: Category.coolingReductionMonths,
            }
          : null,
      })),
    };
  }),

  /** Record a CSP donation and issue the permanent recognition badge */
  recordCspDonation: protectedProcedure
    .input(z.object({
      donorName: z.string().min(2).max(120),
      amount: z.number().int().positive(),
      donorEmail: z.string().email().optional().nullable(),
      organization: z.string().min(2).max(160).optional().nullable(),
      donorUserId: z.string().optional().nullable(),
      recognitionPref: z.enum(["public", "private", "anonymous"]).default("public"),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminUserId = (ctx.session?.user as any)?.id as string;
      if (!adminUserId) throw new Error("UNAUTHORIZED");

      if (input.donorUserId) {
        const donor = await prisma.user.findUnique({
          where: { id: input.donorUserId },
          select: { id: true },
        });
        if (!donor) throw new Error("Donor user not found");
      }

      const categories = await loadActiveCspDonationBadgeCategories(prisma);
      const badgeCategory = resolveCspDonationBadgeCategory(categories, input.amount);
      const donationId = randomUUID();

      const result = await prisma.$transaction(async (tx) => {
        const donation = await tx.cspDonation.create({
          data: {
            id: donationId,
            donorUserId: input.donorUserId ?? null,
            donorName: input.donorName,
            donorEmail: input.donorEmail ?? null,
            organization: input.organization ?? null,
            amount: input.amount,
            category: badgeCategory?.name ?? null,
            recognitionPref: input.recognitionPref,
            status: "completed",
            certificateUrl: buildCspDonationCertificateUrl(donationId),
          },
        });

        if (!badgeCategory) {
          return { donation, badge: null, badgeCategory: null };
        }

        const badgeId = randomUUID();
        const badge = await tx.cspTimeReductionBadge.create({
          data: {
            id: badgeId,
            categoryId: badgeCategory.id,
            ownerUserId: input.donorUserId ?? null,
            sourceDonationId: donation.id,
            reductionMonths: badgeCategory.coolingReductionMonths,
            status: "available",
            expiresAt: null,
            usageLimit: 1,
          },
        });

        const updatedDonation = await tx.cspDonation.update({
          where: { id: donation.id },
          data: {
            badgeAwardedId: badge.id,
          },
        });

        return { donation: updatedDonation, badge, badgeCategory };
      });

      await prisma.cspRuleChangeLog.create({
        data: {
          id: randomUUID(),
          adminUserId,
          ruleKey: "csp_donation_recorded",
          previousValue: null,
          newValue: JSON.stringify({
            donationId: result.donation.id,
            amount: result.donation.amount,
            badgeCategory: result.badgeCategory?.name ?? null,
          }),
          reason: "Recorded CSP donation and issued recognition badge",
        },
      });

      return {
        success: true,
        donation: {
          ...result.donation,
          certificateUrl: buildCspDonationCertificateUrl(result.donation.id),
        },
        badge: result.badge,
        badgeCategory: result.badgeCategory,
      };
    }),

  /** Gift one of my available Time Reduction Badges to another CSP member. */
  giftTimeReductionBadge: protectedProcedure
    .input(z.object({
      badgeId: z.string(),
      recipient: z.string().trim().min(2).max(160), // email or SSC
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const badge = await prisma.cspTimeReductionBadge.findUnique({
        where: { id: input.badgeId },
        include: { Category: { select: { badgeType: true, coolingReductionMonths: true } } },
      });
      if (!badge || badge.ownerUserId !== userId) {
        throw new Error("Badge not found or you do not own it.");
      }
      if (badge.status !== "available") {
        throw new Error("Only available badges can be gifted.");
      }

      const query = input.recipient.trim();
      const recipient = await prisma.user.findFirst({
        where: { OR: [{ email: query }, { ssc: query }] },
        select: { id: true, name: true, firstname: true, lastname: true, email: true },
      });
      if (!recipient) throw new Error("Recipient not found. Use their registered email or SSC.");
      if (recipient.id === userId) throw new Error("You cannot gift a badge to yourself.");

      await prisma.$transaction([
        prisma.cspTimeReductionBadge.update({
          where: { id: badge.id },
          data: { ownerUserId: recipient.id },
        }),
        prisma.cspBadgeTransfer.create({
          data: {
            id: randomUUID(),
            badgeId: badge.id,
            fromUserId: userId,
            toUserId: recipient.id,
            type: "gift",
            status: "completed",
          },
        }),
        prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: recipient.id,
            title: "You received a Time Reduction Badge",
            message: `A CSP member gifted you a ${badge.Category?.badgeType ?? "Time Reduction"} badge worth ${badge.reductionMonths} month(s) of cooling reduction. Redeem it from your CSP dashboard.`,
            link: "/csp",
            isRead: false,
          },
        }),
      ]);

      return { success: true, recipientName: recipient.firstname || recipient.name || recipient.email };
    }),

  /** Redeem one of my available Time Reduction Badges to shorten my active cooling period. */
  redeemTimeReductionBadge: protectedProcedure
    .input(z.object({ badgeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const badge = await prisma.cspTimeReductionBadge.findUnique({
        where: { id: input.badgeId },
      });
      if (!badge || badge.ownerUserId !== userId) {
        throw new Error("Badge not found or you do not own it.");
      }
      if (badge.status !== "available") {
        throw new Error("This badge has already been used.");
      }

      const standing = await ensureMemberStanding(prisma, userId);
      const now = new Date();
      const currentEnds = standing.coolingEndsAt;
      if (!currentEnds || currentEnds <= now) {
        throw new Error("You have no active cooling period to reduce right now.");
      }

      const reduced = new Date(currentEnds);
      reduced.setMonth(reduced.getMonth() - badge.reductionMonths);
      const newEnds = reduced <= now ? null : reduced;

      // Also shorten the most recent released request's cooldown (legacy path).
      const latestReleased = await prisma.cspSupportRequest.findFirst({
        where: { userId, status: "released", cooldownEndsAt: { gt: now } },
        orderBy: { releasedAt: "desc" },
        select: { id: true, cooldownEndsAt: true },
      });

      const ops: any[] = [
        prisma.cspTimeReductionBadge.update({
          where: { id: badge.id },
          data: { status: "redeemed" },
        }),
        prisma.cspMemberStanding.update({
          where: { userId },
          data: { coolingEndsAt: newEnds },
        }),
        prisma.cspBadgeTransfer.create({
          data: {
            id: randomUUID(),
            badgeId: badge.id,
            fromUserId: userId,
            toUserId: userId,
            type: "redeem",
            status: "completed",
          },
        }),
        prisma.notification.create({
          data: {
            id: randomUUID(),
            userId,
            title: "Cooling period reduced",
            message: `You redeemed a Time Reduction Badge and shortened your cooling period by ${badge.reductionMonths} month(s).`,
            link: "/csp",
            isRead: false,
          },
        }),
      ];

      if (latestReleased?.cooldownEndsAt) {
        const legacyReduced = new Date(latestReleased.cooldownEndsAt);
        legacyReduced.setMonth(legacyReduced.getMonth() - badge.reductionMonths);
        ops.push(prisma.cspSupportRequest.update({
          where: { id: latestReleased.id },
          data: { cooldownEndsAt: legacyReduced <= now ? now : legacyReduced },
        }));
      }

      await prisma.$transaction(ops);

      return { success: true, reducedMonths: badge.reductionMonths, coolingEndsAt: newEnds };
    }),

  /** Admin: list recorded CSP donations (paginated). */
  adminListCspDonations: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const [donations, total] = await Promise.all([
        prisma.cspDonation.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: { Donor: { select: { id: true, name: true, firstname: true, lastname: true, email: true } } },
        }),
        prisma.cspDonation.count(),
      ]);
      return {
        donations: donations.map((d) => ({ ...d, certificateUrl: d.certificateUrl ?? buildCspDonationCertificateUrl(d.id) })),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }),

  /** Admin: list every donation badge category (includes inactive). */
  adminListDonationBadgeCategories: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    return prisma.cspDonationBadgeCategory.findMany({
      orderBy: [{ minAmount: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true, name: true, minAmount: true, maxAmount: true,
        badgeType: true, coolingReductionMonths: true, isActive: true, sortOrder: true,
      },
    });
  }),

  /** Admin: create/update donation badge categories. Zero values allowed. */
  adminUpsertDonationBadgeCategories: protectedProcedure
    .input(z.object({
      categories: z.array(z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1).max(120),
        minAmount: z.number().int().min(0),
        maxAmount: z.number().int().min(0).nullable(),
        badgeType: z.string().trim().min(1).max(120),
        coolingReductionMonths: z.number().int().min(0),
        isActive: z.boolean(),
        sortOrder: z.number().int().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminUserId = (ctx.session?.user as any)?.id as string;
      if (!adminUserId) throw new Error("UNAUTHORIZED");

      const ops = input.categories.map((c) => {
        const data = {
          name: c.name,
          minAmount: c.minAmount,
          maxAmount: c.maxAmount,
          badgeType: c.badgeType,
          coolingReductionMonths: c.coolingReductionMonths,
          isActive: c.isActive,
          ...(c.sortOrder !== undefined ? { sortOrder: c.sortOrder } : {}),
        };
        return prisma.cspDonationBadgeCategory.upsert({
          where: { name: c.name },
          update: data,
          create: { id: c.id ?? randomUUID(), ...data },
        });
      });

      await prisma.$transaction([
        ...ops,
        prisma.cspRuleChangeLog.create({
          data: {
            id: randomUUID(),
            adminUserId,
            ruleKey: "csp_donation_badge_categories",
            previousValue: null,
            newValue: JSON.stringify(input.categories.map((c) => ({ name: c.name, minAmount: c.minAmount, reduction: c.coolingReductionMonths }))),
            reason: "Updated CSP donation badge categories",
          },
        }),
      ]);

      return { success: true, updated: input.categories.length };
    }),

  submitRequest: protectedProcedure
    .input(z.object({
      category: z.enum(["national", "global"]),
      amount: z.number().int().positive(),
      purpose: z.string().min(3),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const [config, tierConfig, user, membershipPackages] = await Promise.all([
        loadEligibilityConfig(prisma),
        loadTierConfig(prisma),
        prisma.user.findUnique({
          where: { id: userId },
          select: { activeMembershipPackageId: true, membershipActivatedAt: true, country: true, community: true, email: true },
        }),
        prisma.membershipPackage.findMany({
          select: { id: true, name: true, price: true },
        }),
      ]);

      const membershipLookup = buildMembershipPriceLookup(membershipPackages);
      const membershipName = user?.activeMembershipPackageId
        ? membershipPackages.find((pkg) => pkg.id === user.activeMembershipPackageId)?.name ?? null
        : null;
      const membership = normalizeMembership(membershipName);
      const membershipActive = Boolean(user?.membershipActivatedAt && membershipName);
      const membershipPrice = user?.activeMembershipPackageId
        ? membershipLookup.byId.get(user.activeMembershipPackageId) ?? null
        : null;
      const requiredNationalMembershipPrice = resolveMembershipPrice(membershipLookup, config.national.minMembership);
      const requiredGlobalMembershipPrice = resolveMembershipPrice(membershipLookup, config.global.minMembership);
      const requiredRegularPlusPrice = resolveMembershipPrice(membershipLookup, "regular plus");
      const membershipMeetsNational = evaluateMembershipRequirement({
        membershipActive,
        membership,
        userPrice: membershipPrice,
        requiredMembership: config.national.minMembership,
        requiredPrice: requiredNationalMembershipPrice,
      });
      const membershipMeetsGlobal = evaluateMembershipRequirement({
        membershipActive,
        membership,
        userPrice: membershipPrice,
        requiredMembership: config.global.minMembership,
        requiredPrice: requiredGlobalMembershipPrice,
      });
      const membershipMeetsRegularPlus = evaluateMembershipRequirement({
        membershipActive,
        membership,
        userPrice: membershipPrice,
        requiredMembership: "regular plus",
        requiredPrice: requiredRegularPlusPrice,
      });

      // Qualified directs
      const allReferrals = await prisma.referral.findMany({ where: { referrerId: userId }, select: { referredId: true } });
      const referredIds = allReferrals.map((r: any) => r.referredId);
      let qualifiedDirects = 0;
      if (referredIds.length > 0) {
        const regularPkgIdSet = new Set(
          membershipPackages
            .filter((pkg) => ["regular", "regular plus", "gold", "gold plus", "platinum", "platinum plus"].includes(pkg.name.trim().toLowerCase()))
            .map((pkg) => pkg.id)
        );
        const qualifiedUsers = await prisma.user.findMany({
          where: { id: { in: referredIds }, membershipActivatedAt: { not: null }, activeMembershipPackageId: { in: [...regularPkgIdSet] } },
          select: { id: true },
        });
        qualifiedDirects = qualifiedUsers.length;
      }

      const contributionGroups = await prisma.cspContribution.groupBy({
        by: ["requestId"],
        where: { contributorId: userId },
        _sum: { amount: true },
      });
      const cumulativeContributions = contributionGroups.reduce((sum: number, row: any) => sum + (row._sum.amount ?? 0), 0);
      const requestsContributed = contributionGroups.length;

      const userCountryCode = (user as any)?.country ?? null;
      const [userCountryRecord, anyActivatedCountry] = await Promise.all([
        userCountryCode ? prisma.cspCountry.findUnique({ where: { countryCode: userCountryCode } }) : Promise.resolve(null),
        prisma.cspCountry.findFirst({ where: { isNationalActive: true } }),
      ]);
      const userCountryIsActivated = userCountryRecord?.isNationalActive ?? false;
      const hasAnyActivatedCountry = anyActivatedCountry !== null;

      const eligibilityFlags = computeEligibilityFlags({
        category: input.category,
        membershipMeets: input.category === "national" ? membershipMeetsNational : membershipMeetsGlobal,
        membershipMeetsRegularPlus,
        qualifiedDirects,
        cumulativeContributions,
        requestsContributed,
        hasAnyActivatedCountry,
        userCountryIsActivated,
        config,
      });

      // CSP WAIVER: Check if user has an active empowerment CSP waiver (bypasses eligibility)
      const cspWaiverPkg = await prisma.empowermentPackage.findFirst({
        where: { beneficiaryId: userId, cspWaiverEnabled: true, cspWaiverUsed: false },
        select: { id: true },
      });
      const hasCspWaiver = !!cspWaiverPkg;

      if (!eligibilityFlags.eligible && !hasCspWaiver) {
        throw new Error("You do not meet the eligibility requirements for this category.");
      }

      // CSP WAIVER: Enforce minimum community wallet balance threshold
      if (hasCspWaiver) {
        const cspMinThresholdRecord = await prisma.adminSettings.findUnique({
          where: { settingKey: "empowerment:csp_min_threshold" },
          select: { settingValue: true },
        });
        const cspMinThreshold = cspMinThresholdRecord ? Number(cspMinThresholdRecord.settingValue) : 300000;
        const communityBalance = user?.community ?? 0;
        if (communityBalance < cspMinThreshold) {
          throw new Error(
            `Your Community Wallet balance (₦${communityBalance.toLocaleString()}) must be at least ₦${cspMinThreshold.toLocaleString()} to apply your CSP waiver. Please transfer funds from your Education Wallet first.`
          );
        }
      }

      // Enforce cooldown from the active source for the current mode
      if (tierConfig.tierModelEnabled) {
        const standing = await ensureMemberStanding(prisma, userId);
        const cooling = selectEffectiveCoolingState({
          tierModelEnabled: true,
          releasedCooldownEndsAt: null,
          standingCoolingEndsAt: standing.coolingEndsAt ?? null,
          standingCoolingMonthsBase: standing.coolingMonthsBase ?? null,
          standingLastSupportReleasedAt: standing.lastSupportReleasedAt ?? null,
        });
        if (cooling.isActive && cooling.cooldownEndsAt) {
          throw new Error(`You are in a cooldown period. Your earliest next request date is ${cooling.cooldownEndsAt.toLocaleDateString()}.`);
        }
      } else {
        const latestReleased = await prisma.cspSupportRequest.findFirst({
          where: { userId, status: "released", cooldownEndsAt: { not: null } },
          orderBy: { releasedAt: "desc" },
          select: { cooldownEndsAt: true },
        });
        if (latestReleased?.cooldownEndsAt && latestReleased.cooldownEndsAt > new Date()) {
          throw new Error(`You are in a cooldown period. Your earliest next request date is ${latestReleased.cooldownEndsAt.toLocaleDateString()}.`);
        }
      }

      const existingActive = await prisma.cspSupportRequest.findFirst({
        where: { userId, status: { in: ["pending", "broadcasting", "approved"] } },
      });
      if (existingActive) throw new Error("You already have an active or pending support request.");

      // Apply 20% markup: the broadcast target is 120% of the requested amount
      const rules = config[input.category];
      const requestedAmount = input.amount;
      const markupTarget = Math.ceil(requestedAmount * 1.2);
      const thresholdAmount = Math.max(markupTarget, rules.minThreshold);

      let tierStanding: Awaited<ReturnType<typeof ensureMemberStanding>> | null = null;
      let tierResult: ReturnType<typeof validateTierSupportRequest> | null = null;
      if (tierConfig.tierModelEnabled) {
        const [standing, tiers, latestKyc, autoDebit, autoContribute] = await Promise.all([
          ensureMemberStanding(prisma, userId),
          loadActiveTiers(prisma),
          prisma.kycSubmission.findFirst({
            where: { userId },
            orderBy: { submittedAt: "desc" },
            select: { status: true },
          }),
          prisma.walletAutoDebitSetting.findUnique({
            where: { userId },
            select: { isEnabled: true },
          }),
          prisma.cspAutoContributeSetting.findUnique({
            where: { userId },
            select: { isEnabled: true },
          }),
        ]);

        tierStanding = standing;
        tierResult = validateTierSupportRequest(tiers, standing.contributionRight, requestedAmount);

        const kycApproved = latestKyc?.status === "approved";
        const autoDebitEnabled = autoDebit?.isEnabled ?? false;
        const autoContributeEnabled = autoContribute?.isEnabled ?? false;

        if (!hasCspWaiver) {
          if (tierConfig.requireKyc && !kycApproved) {
            throw new Error("KYC approval is required for tier-based CSP requests.");
          }
          if (tierConfig.requireAutoDebit && !autoDebitEnabled) {
            throw new Error("Auto-Debit must be enabled for tier-based CSP requests.");
          }
          if (tierConfig.requireAutoContribute && !autoContributeEnabled) {
            throw new Error("Auto-Contribute must be enabled for tier-based CSP requests.");
          }
          if (standing.contributionRight < tierConfig.minContributionRight) {
            throw new Error(`You need at least ₦${tierConfig.minContributionRight.toLocaleString()} in Contribution Right to request support.`);
          }
          if (!tierResult?.ok) {
            throw new Error(tierResult?.reason ?? "You are not yet eligible for a tier-based support request.");
          }
        }
      }

      const request = await prisma.cspSupportRequest.create({
        data: {
          userId,
          category: input.category,
          amount: thresholdAmount,
          requestedAmount,
          purpose: input.purpose,
          notes: input.notes,
          status: "pending",
          thresholdAmount,
          raisedAmount: 0,
          contributorsCount: 0,
          countryCode: userCountryCode,
          ...(tierResult?.currentTier
            ? {
                tierNumber: tierResult.currentTier.tierNumber,
                tierContributionRight: tierStanding?.contributionRight ?? null,
                minFulfilmentPct: tierResult.tier?.minFulfilmentPct ?? null,
              }
            : {}),
        },
      });

      await notifyCspRequestSubmitted(userId, input.category, thresholdAmount);
      await notifyCspRequestReceived(userId, input.category, thresholdAmount);
      if (user?.email) {
        try { await sendCspLifecycleEmail(user.email, "received", { category: input.category, amount: thresholdAmount, status: "pending" }); }
        catch (e) { console.error("[CSP] Lifecycle email failed:", e); }
      }

      // CSP WAIVER: Mark waiver as used after successful CSP request submission
      if (hasCspWaiver && cspWaiverPkg) {
        await prisma.empowermentPackage.update({
          where: { id: cspWaiverPkg.id },
          data: { cspWaiverUsed: true },
        }).catch((err) => {
          console.error(`[CSP] Failed to mark waiver ${cspWaiverPkg.id} as used:`, err instanceof Error ? err.message : err);
        });
        // Audit log the CSP waiver usage
        await prisma.empowermentTransaction.create({
          data: {
            id: randomUUID(),
            empowermentPackageId: cspWaiverPkg.id,
            transactionType: "CSP_WAIVER_APPLIED",
            grossAmount: thresholdAmount,
            taxAmount: 0,
            netAmount: thresholdAmount,
            description: `CSP waiver applied on ${input.category} request (₦${thresholdAmount.toLocaleString()})`,
            performedBy: userId,
          },
        }).catch((err) => {
          console.error(`[CSP] Failed to create waiver audit log for ${cspWaiverPkg.id}:`, err instanceof Error ? err.message : err);
        });
      }

      return { requestId: request.id, status: request.status, requestedAmount, thresholdAmount };
    }),

  approveRequest: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      broadcastHours: z.number().int().positive().optional(),
      cooldownMonths: z.union([z.literal(6), z.literal(12), z.literal(24), z.literal(36)]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({ where: { id: input.requestId } });
      if (!request) throw new Error("Request not found");
      if (request.status !== "pending") throw new Error("Only pending requests can be approved");

      const [config, tierConfig] = await Promise.all([
        loadEligibilityConfig(prisma),
        loadTierConfig(prisma),
      ]);
      const rules = config[request.category as CategoryKey] ?? config.national;
      const hours = input.broadcastHours ?? rules.broadcastHours;
      const broadcastExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

      const updated = await prisma.cspSupportRequest.update({
        where: { id: request.id },
        data: {
          status: "broadcasting",
          broadcastExpiresAt,
          approvedAt: new Date(),
          approvedBy: (ctx.session?.user as any)?.id ?? "admin",
          cooldownMonths: input.cooldownMonths ?? tierConfig.defaultCoolingMonthsMin,
        },
      });

      await notifyCspRequestApproved(request.userId, request.category, request.thresholdAmount, broadcastExpiresAt);
      await notifyCspRequestProcessed(request.userId, request.category, request.thresholdAmount, "broadcasting");
      const beneficiary = await prisma.user.findUnique({ where: { id: request.userId }, select: { email: true } });
      if (beneficiary?.email) {
        try { await sendCspLifecycleEmail(beneficiary.email, "processed", { category: request.category, amount: request.thresholdAmount, status: "broadcasting" }); }
        catch (e) { console.error("[CSP] Lifecycle email failed:", e); }
      }

      return { requestId: updated.id, status: updated.status, broadcastExpiresAt: updated.broadcastExpiresAt, cooldownMonths: updated.cooldownMonths };
    }),

  adminListRequests: protectedProcedure
    .input(
      z
        .object({
          status: z.array(z.enum(["pending", "approved", "broadcasting", "ready_for_release", "released", "closed", "rejected"])).optional(),
          page: z.number().int().positive().optional(),
          pageSize: z.number().int().positive().max(100).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const statusFilter = input?.status ?? ["pending", "approved", "broadcasting", "ready_for_release"];

      const [items, total] = await prisma.$transaction([
        prisma.cspSupportRequest.findMany({
          where: { 
            status: { in: statusFilter },
            // Include both user requests and active admin defaults
          },
          include: {
            User: { select: { id: true, name: true, email: true, activeMembershipPackageId: true } },
            Contributions: { select: { amount: true } },
          },
          orderBy: [
            { isAdminDefault: "desc" }, // Admin defaults first
            { createdAt: "desc" }
          ],
          skip,
          take: pageSize,
        }),
        prisma.cspSupportRequest.count({ where: { status: { in: statusFilter } } }),
      ]);

      return { items, total, page, pageSize };
    }),

  getLiveStatus: protectedProcedure
    .input(z.object({ requestId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const request = input?.requestId
        ? await prisma.cspSupportRequest.findFirst({ where: { id: input.requestId, userId } })
        : await prisma.cspSupportRequest.findFirst({
            where: { userId, status: { in: ["broadcasting", "approved", "pending"] } },
            orderBy: { createdAt: "desc" },
          });

      if (!request) return null;

      const remainingSeconds = request.broadcastExpiresAt
        ? Math.max(0, Math.floor((request.broadcastExpiresAt.getTime() - Date.now()) / 1000))
        : null;

      return {
        requestId: request.id,
        category: request.category,
        status: request.status,
        amount: request.amount,
        thresholdAmount: request.thresholdAmount,
        raisedAmount: request.raisedAmount,
        contributorsCount: request.contributorsCount,
        broadcastExpiresAt: request.broadcastExpiresAt,
        approvedAt: request.approvedAt,
        remainingSeconds,
        remainingAmount: Math.max(0, request.thresholdAmount - request.raisedAmount),
      };
    }),

  listHistory: protectedProcedure
    .input(z.object({ page: z.number().int().positive().optional(), pageSize: z.number().int().positive().max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const skip = (page - 1) * pageSize;

      const [items, total] = await prisma.$transaction([
        prisma.cspSupportRequest.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.cspSupportRequest.count({ where: { userId } }),
      ]);

      return { items, total, page, pageSize };
    }),

  listBroadcasts: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");

    const now = new Date();

    // Auto-close expired non-default broadcasts before listing
    await prisma.cspSupportRequest.updateMany({
      where: { isAdminDefault: false, status: "broadcasting", broadcastExpiresAt: { lt: now } },
      data: { status: "closed" },
    });

    // B5: Get user's country for national geo-scoping
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });
    const userCountry = (user as any)?.country ?? null;

    const requests = await prisma.cspSupportRequest.findMany({
      where: {
        isActive: true,
        OR: [
          { isAdminDefault: false, status: "broadcasting", broadcastExpiresAt: { gt: now } },
          { isAdminDefault: true, isActive: true, status: "broadcasting" },
        ],
      },
      orderBy: [{ isAdminDefault: "desc" }, { createdAt: "desc" }],
      // No User include — all PII stripped at API layer for anonymity
    });

    // B5: Filter national requests by user's country (global requests visible to all)
    // B6: Use broadcast visibility guard to filter out expired/inactive broadcasts
    const visible = requests.filter((req) => {
      // B6: Check broadcast visibility
      if (!isCspBroadcastVisible(req)) return false;

      // B5: Geo-scope national requests
      if (req.category === "national" && req.countryCode && userCountry) {
        return req.countryCode === userCountry;
      }

      return true;
    });

    return visible.map((req) => ({
      id: req.id,
      // userId is intentionally omitted to preserve anonymity
      category: req.category,
      amount: req.amount,
      purpose: req.purpose,
      notes: req.notes,
      status: req.status,
      thresholdAmount: req.thresholdAmount,
      raisedAmount: req.raisedAmount,
      contributorsCount: req.contributorsCount,
      broadcastExpiresAt: req.broadcastExpiresAt,
      isAdminDefault: req.isAdminDefault,
      isActive: req.isActive,
    }));
  }),

  contribute: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        amount: z.number().int().positive(),
        walletType: z.enum(["community", "wallet"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contributorId = (ctx.session?.user as any)?.id as string | undefined;
      if (!contributorId) throw new Error("UNAUTHORIZED");

      const [config, tierConfig] = await Promise.all([
        loadEligibilityConfig(prisma),
        loadTierConfig(prisma),
      ]);

      if (input.amount < config.minPerContribution) {
        throw new Error(`Minimum contribution is ₦${config.minPerContribution.toLocaleString()}`);
      }

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: true },
      });

      if (!request) throw new Error("Support request not found");
      if (request.status !== "broadcasting") throw new Error("This request is not currently accepting contributions");

      // Admin default requests don't have expiry; regular requests do
      if (!request.isAdminDefault && request.broadcastExpiresAt && request.broadcastExpiresAt.getTime() < Date.now()) {
        await prisma.cspSupportRequest.update({ where: { id: request.id }, data: { status: "closed" } });
        throw new Error("Broadcast window has expired");
      }

      if (request.userId === contributorId) {
        throw new Error("You cannot contribute to your own support request");
      }

      const contributor = await prisma.user.findUnique({
        where: { id: contributorId },
        select: { wallet: true, community: true },
      });

      if (!contributor) throw new Error("Contributor not found");
      const sourceBalance = input.walletType === "community" ? contributor.community : contributor.wallet;
      if (sourceBalance < input.amount) {
        throw new Error("Insufficient balance in selected wallet");
      }

      const holdingWalletName = `CSP Holding - ${request.id}`;

      // --- Auto-extension thresholds ---
      const EXTENSION_BY_AMOUNT = [
        { threshold: 100000, hours: 168 },
        { threshold: 80000,  hours: 72 },
        { threshold: 60000,  hours: 48 },
        { threshold: 40000,  hours: 24 },
      ];
      const newRaisedAmount = request.raisedAmount + input.amount;
      let autoExtendHours = 0;
      for (const tier of EXTENSION_BY_AMOUNT) {
        if (request.raisedAmount < tier.threshold && newRaisedAmount >= tier.threshold) {
          autoExtendHours = tier.hours;
          break;
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: contributorId },
          data: { [input.walletType]: { decrement: input.amount } },
        });

        const holdingWallet = await ensureSystemWallet(tx, holdingWalletName, "CSP_HOLDING");

        const contribution = await tx.cspContribution.create({
          data: {
            requestId: request.id,
            contributorId,
            amount: input.amount,
            walletType: input.walletType,
          },
        });

        await reconcileMemberStandingContributionRight(tx, contributorId);

        const newStatus = newRaisedAmount >= request.thresholdAmount ? "ready_for_release" : request.status;

        // Auto-extend broadcast if a contribution threshold is crossed
        let newExpiry = request.broadcastExpiresAt;
        if (autoExtendHours > 0 && !request.isAdminDefault && newStatus !== "ready_for_release") {
          const baseDate = newExpiry && newExpiry > new Date() ? newExpiry : new Date();
          newExpiry = new Date(baseDate.getTime() + autoExtendHours * 60 * 60 * 1000);
          await tx.cspBroadcastExtension.create({
            data: { requestId: request.id, type: "paid", value: newRaisedAmount, hoursGranted: autoExtendHours },
          });
        }

        const updatedRequest = await tx.cspSupportRequest.update({
          where: { id: request.id },
          data: {
            raisedAmount: { increment: input.amount },
            contributorsCount: { increment: 1 },
            status: newStatus,
            ...(newExpiry !== request.broadcastExpiresAt ? { broadcastExpiresAt: newExpiry } : {}),
          },
        });

        await tx.systemWallet.update({
          where: { id: holdingWallet.id },
          data: { balanceNgn: { increment: input.amount } },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: contributorId,
            transactionType: "CSP_CONTRIBUTION",
            amount: -input.amount,
            description: `CSP contribution to request ${request.id}`,
            status: "completed",
            walletType: input.walletType,
          },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: request.userId,
            transactionType: "CSP_SUPPORT_INFLOW_HOLDING",
            amount: input.amount,
            description: `CSP support held for request ${request.id}`,
            status: "pending",
            walletType: "holding",
          },
        });

        return { contribution, updatedRequest, autoExtendHours };
      });

      // --- Post-release wait-period reduction ---
      // If this contributor has an active cooldown, track their monthly contribution for wait reduction
      const tierStanding = tierConfig.tierModelEnabled
        ? await ensureMemberStanding(prisma, contributorId)
        : null;
      const activeCooldown: any = tierConfig.tierModelEnabled
        ? tierStanding
        : await prisma.cspSupportRequest.findFirst({
            where: {
              userId: contributorId,
              status: "released",
              cooldownEndsAt: { gt: new Date() },
            },
            orderBy: { releasedAt: "desc" },
            select: { id: true, cooldownEndsAt: true, cooldownMonths: true },
          });

      const cooldownActive = tierConfig.tierModelEnabled
        ? Boolean(activeCooldown?.coolingEndsAt && activeCooldown.coolingEndsAt > new Date())
        : Boolean(activeCooldown && activeCooldown.cooldownEndsAt && activeCooldown.cooldownEndsAt > new Date());

      if (cooldownActive) {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const MONTHLY_CAP = config.waitReductionMonthlyTarget; // ₦10,000

        const activeCooldownRequest = tierConfig.tierModelEnabled
          ? await prisma.cspSupportRequest.findFirst({
              where: {
                userId: contributorId,
                status: "closed",
                fulfilledAt: { not: null },
              },
              orderBy: { fulfilledAt: "desc" },
              select: { id: true, fulfilledAt: true },
            })
          : null;

        const cooldownRequestId = tierConfig.tierModelEnabled
          ? activeCooldownRequest?.id ?? null
          : activeCooldown.id;
        const activeCooldownEndsAt = tierConfig.tierModelEnabled
          ? (activeCooldown.coolingEndsAt ?? null)
          : activeCooldown.cooldownEndsAt;

        if (!cooldownRequestId || !activeCooldownEndsAt) {
          // No request to anchor the monthly reduction log to.
        } else {
          // Upsert the log for this month
          const existing = await prisma.cspWaitReductionLog.findUnique({
            where: { userId_requestId_monthKey: { userId: contributorId, requestId: cooldownRequestId, monthKey } },
          });

          const prevAmount = existing?.amountContrib ?? 0;
          const newAmount = Math.min(prevAmount + input.amount, MONTHLY_CAP);

          const alreadyReduced = existing?.monthReduced ?? false;
          const justHitCap = !alreadyReduced && newAmount >= MONTHLY_CAP;

          await prisma.cspWaitReductionLog.upsert({
            where: { userId_requestId_monthKey: { userId: contributorId, requestId: cooldownRequestId, monthKey } },
            update: { amountContrib: newAmount, monthReduced: alreadyReduced || justHitCap, updatedAt: new Date() },
            create: {
              userId: contributorId,
              requestId: cooldownRequestId,
              monthKey,
              amountContrib: newAmount,
              monthReduced: justHitCap,
            },
          });

          // If threshold just hit, deduct 1 month from cooldownEndsAt
          if (justHitCap && activeCooldownEndsAt) {
            const newCooldownEnd = new Date(activeCooldownEndsAt);
            newCooldownEnd.setMonth(newCooldownEnd.getMonth() - 1);
            if (tierConfig.tierModelEnabled) {
              await prisma.cspMemberStanding.update({
                where: { userId: contributorId },
                data: { coolingEndsAt: newCooldownEnd },
              });
            } else {
              await prisma.cspSupportRequest.update({
                where: { id: cooldownRequestId },
                data: { cooldownEndsAt: newCooldownEnd },
              });
            }
          }
        }
      }

      await notifyCspContributionSent(contributorId, input.amount, input.walletType);
      await notifyCspContributionReceived(request.userId, input.amount);
      if (result.autoExtendHours > 0) {
        await notifyCspBroadcastExtended(request.userId, result.autoExtendHours);
      }

      return {
        success: true,
        contributionId: result.contribution.id,
        requestId: request.id,
        autoExtendHours: result.autoExtendHours,
      };
    }),

  releaseFunds: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminUserId = (ctx.session?.user as any)?.id as string | undefined;

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: { select: { id: true, sponsorId: true, state: true, email: true } } },
      });

      if (!request) throw new Error("Support request not found");
      if (request.status === "released") {
        throw new Error("Funds have already been released for this request");
      }
      if (request.status !== "broadcasting" && request.status !== "ready_for_release") {
        throw new Error(`Cannot release funds for a request with status "${request.status}"`);
      }
      if (request.raisedAmount <= 0) {
        throw new Error("No funds available to release yet");
      }

      const holdingWalletName = `CSP Holding - ${request.id}`;
      const holdingWallet = await ensureSystemWallet(prisma, holdingWalletName, "CSP_HOLDING");
      if (holdingWallet.balanceNgn <= 0) {
        throw new Error("No funds available in holding wallet");
      }

      const total = Math.min(holdingWallet.balanceNgn, request.raisedAmount);
      if (total <= 0) throw new Error("No funds to release");

      // Load admin-configurable CSP fee percentages (with hardcoded defaults)
      const pct = await loadCspFeePercentages(prisma);
      const tierConfig = await loadTierConfig(prisma);

      // ─── 120% Disbursement Rule ───────────────────────────────────────────
      // Path A — Fully funded (raisedAmount >= thresholdAmount):
      //   Beneficiary receives 100% of their original requestedAmount.
      //   The 20% markup surplus is split across admin pools proportionally.
      // Path B — Partially funded (raisedAmount < thresholdAmount):
      //   Beneficiary receives pct.recipient (80%) of total raised.
      //   Admin pools receive their configured percentages of the remainder.
      // ─────────────────────────────────────────────────────────────────────
      const fullyFunded =
        request.thresholdAmount > 0 &&
        request.raisedAmount >= request.thresholdAmount &&
        request.requestedAmount != null &&
        request.requestedAmount > 0;

      let shares: { recipient: number; admin: number; sponsor: number; state: number; management: number; reserve: number };

      if (fullyFunded) {
        // Path A: recipient gets exactly requestedAmount; remainder is the markup pool
        const recipientShare = Math.min(request.requestedAmount!, total);
        const markupPool = total - recipientShare;
        // Split markupPool among admin pools proportionally to their configured weights
        const adminPoolWeight = pct.admin + pct.sponsor + pct.state + pct.management + pct.reserve;
        const safeWeight = adminPoolWeight > 0 ? adminPoolWeight : 1;
        const adminShare     = Math.floor(markupPool * (pct.admin      / safeWeight));
        const sponsorShare   = Math.floor(markupPool * (pct.sponsor    / safeWeight));
        const stateShare     = Math.floor(markupPool * (pct.state      / safeWeight));
        const managementShare= Math.floor(markupPool * (pct.management / safeWeight));
        const reserveShare   = markupPool - adminShare - sponsorShare - stateShare - managementShare;
        shares = {
          recipient:  recipientShare,
          admin:      adminShare,
          sponsor:    sponsorShare,
          state:      stateShare,
          management: managementShare,
          reserve:    reserveShare,
        };
      } else {
        // Path B: apply configured percentages to total raised
        const adminShare      = Math.floor(total * pct.admin);
        const sponsorShare    = Math.floor(total * pct.sponsor);
        const stateShare      = Math.floor(total * pct.state);
        const managementShare = Math.floor(total * pct.management);
        const reserveShare    = Math.floor(total * pct.reserve);
        const allocated       = adminShare + sponsorShare + stateShare + managementShare + reserveShare;
        shares = {
          recipient:  total - allocated, // remainder (≈80%) all goes to recipient
          admin:      adminShare,
          sponsor:    sponsorShare,
          state:      stateShare,
          management: managementShare,
          reserve:    reserveShare,
        };
      }

      await prisma.$transaction(async (tx) => {
        const holding = await ensureSystemWallet(tx, holdingWalletName, "CSP_HOLDING");

        await tx.systemWallet.update({
          where: { id: holding.id },
          data: { balanceNgn: { decrement: total } },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: { wallet: { increment: shares.recipient } },
        });

        if (request.User?.sponsorId && shares.sponsor > 0) {
          await tx.user.update({
            where: { id: request.User.sponsorId },
            data: { wallet: { increment: shares.sponsor } },
          });
        }

        const adminWallet = await ensureSystemWallet(tx, "CSP Admin Wallet", "EXECUTIVE_POOL");
        await tx.systemWallet.update({ where: { id: adminWallet.id }, data: { balanceNgn: { increment: shares.admin } } });

        const stateWallet = await ensureSystemWallet(tx, "CSP State Wallet", "STATE_REVENUE_POOL");
        await tx.systemWallet.update({ where: { id: stateWallet.id }, data: { balanceNgn: { increment: shares.state } } });

        const managementWallet = await ensureSystemWallet(tx, "CSP Management Wallet", "CSP_MANAGEMENT_RESERVE");
        await tx.systemWallet.update({ where: { id: managementWallet.id }, data: { balanceNgn: { increment: shares.management } } });

        const reserveWallet = await ensureSystemWallet(tx, "CSP Reserve Wallet", "CSP_RESERVE");
        await tx.systemWallet.update({ where: { id: reserveWallet.id }, data: { balanceNgn: { increment: shares.reserve } } });

        // Recipient share is credited to the member's Main (cash) Wallet —
        // the `wallet` field, which is the withdrawable balance.
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: request.userId,
            transactionType: "CSP_PAYOUT",
            amount: shares.recipient,
            description: `CSP support released to your Main Cash Wallet (request ${request.id})`,
            status: "completed",
            walletType: "wallet",
          },
        });

        if (request.User?.sponsorId && shares.sponsor > 0) {
          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: request.User.sponsorId,
              transactionType: "CSP_SPONSOR_REWARD",
              amount: shares.sponsor,
              description: `Sponsor reward from request ${request.id}`,
              status: "completed",
              walletType: "wallet",
            },
          });
        }

        // Compute cooldownEndsAt from cooldownMonths set at approval
        const releasedAt = new Date();
        let cooldownEndsAt: Date | null = null;
        if (request.cooldownMonths && request.cooldownMonths > 0) {
          cooldownEndsAt = new Date(releasedAt);
          cooldownEndsAt.setMonth(cooldownEndsAt.getMonth() + request.cooldownMonths);
        }

        await tx.cspSupportRequest.update({
          where: { id: request.id },
          data: {
            status: "released",
            releasedAt,
            cooldownEndsAt,
            // Remove the request from the broadcast entirely so members no
            // longer see it (covers admin-default requests kept alive by isActive).
            isActive: false,
            broadcastExpiresAt: null,
          },
        });

        // A2: When tier model is enabled, also update CspMemberStanding cooling
        // so the beneficiary's cooldown is tracked in the correct place.
        if (tierConfig.tierModelEnabled) {
          await ensureMemberStanding(tx, request.userId);
          await tx.cspMemberStanding.update({
            where: { userId: request.userId },
            data: {
              lastSupportReleasedAt: releasedAt,
              coolingEndsAt: cooldownEndsAt,
              coolingMonthsBase: request.cooldownMonths ?? tierConfig.defaultCoolingMonthsMin,
            },
          });
        }

        // Full audit trail for the admin action.
        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            userId: adminUserId ?? request.userId,
            action: "CSP_RELEASE_FUNDS",
            entity: "CSP_SUPPORT_REQUEST",
            entityId: request.id,
            metadata: {
              beneficiaryUserId: request.userId,
              category: request.category,
              totalReleased: total,
              recipientCredited: shares.recipient,
              creditedWallet: "wallet",
              creditedWalletLabel: "Main Cash Wallet",
              fullyFunded,
              shares,
              cooldownMonths: request.cooldownMonths ?? null,
              cooldownEndsAt,
            },
            ipAddress: "",
            userAgent: "",
          },
        });
      });

      await recordRevenue(prisma, {
        source: "COMMUNITY_SUPPORT",
        amount: shares.admin + shares.state + shares.management + shares.reserve,
        currency: "NGN",
        sourceId: request.id,
        description: `CSP release system share for request ${request.id}`,
        userId: request.userId,
        programType: "CSP",
        state: request.User?.state ?? undefined,
        region: getNigerianRegion(request.User?.state),
        metadata: {
          requestId: request.id,
          totalReleased: total,
          shares,
        },
      });

      await notifyCspRequestProcessed(request.userId, request.category, shares.recipient, "released");
      if (request.User?.email) {
        try { await sendCspLifecycleEmail(request.User.email, "processed", {
          category: request.category,
          amount: shares.recipient,
          status: "released",
          requestedAmount: request.requestedAmount ?? undefined,
          totalRaised: total,
          fullyFunded,
          shares,
        }); }
        catch (e) { console.error("[CSP] Lifecycle email failed:", e); }
      }

      return { success: true, released: total, shares, fullyFunded };
    }),

  extendBroadcast: protectedProcedure
    .input(z.object({ requestId: z.string(), hours: z.number().int().positive().max(168), reason: z.enum(["paid", "referrals"]), value: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const updated = await prisma.$transaction(async (tx) => {
        const request = await tx.cspSupportRequest.findUnique({ where: { id: input.requestId } });
        if (!request) throw new Error("Request not found");
        if (request.status !== "broadcasting") throw new Error("Only broadcasting requests can be extended");

        // C3: Enforce cumulative 7-day (168h) cap on manual extensions
        const existingExtensions = await tx.cspBroadcastExtension.findMany({
          where: { requestId: request.id, type: { in: ["paid", "referrals"] } },
          select: { hoursGranted: true },
        });
        const cumulativeHours = existingExtensions.reduce((sum, ext) => sum + ext.hoursGranted, 0);
        const MAX_CUMULATIVE_HOURS = 168; // 7 days cap per spec
        if (cumulativeHours + input.hours > MAX_CUMULATIVE_HOURS) {
          const remaining = Math.max(0, MAX_CUMULATIVE_HOURS - cumulativeHours);
          throw new Error(
            `Cumulative extension cap is 7 days (168h). Already granted: ${cumulativeHours}h. Remaining: ${remaining}h. Requested: ${input.hours}h.`
          );
        }

        const baseDate = request.broadcastExpiresAt && request.broadcastExpiresAt > new Date() ? request.broadcastExpiresAt : new Date();
        const broadcastExpiresAt = new Date(baseDate.getTime() + input.hours * 60 * 60 * 1000);

        const saved = await tx.cspSupportRequest.update({ where: { id: request.id }, data: { broadcastExpiresAt } });

        await tx.cspBroadcastExtension.create({
          data: {
            requestId: request.id,
            type: input.reason,
            value: input.value,
            hoursGranted: input.hours,
          },
        });

        return saved;
      });

      await notifyCspBroadcastExtended(updated.userId, input.hours);

      return { requestId: updated.id, broadcastExpiresAt: updated.broadcastExpiresAt, reason: input.reason, value: input.value };
    }),

  // Admin-only: Create default/base CSP requests that bypass all criteria
  createAdminDefaultRequest: protectedProcedure
    .input(z.object({
      userId: z.string().optional(), // Can use system user or specific user
      category: z.enum(["national", "global"]),
      amount: z.number().int().positive(),
      purpose: z.string().min(3),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      // Use provided userId or create a system CSP user
      let targetUserId = input.userId;
      if (!targetUserId) {
        // Check if system CSP user exists
        let systemUser = await prisma.user.findFirst({
          where: { email: "csp-system@beepagroafrica.com" },
        });

        if (!systemUser) {
          // Create system CSP user
          systemUser = await prisma.user.create({
            data: {
              id: randomUUID(),
              email: "csp-system@beepagroafrica.com",
              name: "CSP System",
              userType: "user",
              activated: true,
            },
          });
        }
        targetUserId = systemUser.id;
      }

      const rule = DEFAULTS[input.category as "national" | "global"];
      const thresholdAmount = Math.max(input.amount, rule.minThreshold);

      const request = await prisma.cspSupportRequest.create({
        data: {
          userId: targetUserId,
          category: input.category,
          amount: thresholdAmount,
          requestedAmount: input.amount, // D4: Set requestedAmount so releaseFunds Path A works
          purpose: input.purpose,
          notes: input.notes,
          status: "broadcasting", // Auto-approved
          thresholdAmount,
          raisedAmount: 0,
          contributorsCount: 0,
          isAdminDefault: true,
          isActive: true,
          approvedBy: (ctx.session?.user as any)?.id ?? "admin",
          approvedAt: new Date(),
          // No broadcast expiry - remains until goal met or admin turns off
          broadcastExpiresAt: null,
        },
      });

      return { requestId: request.id, status: request.status };
    }),

  // Admin-only: Toggle active status of default requests
  toggleAdminDefaultRequest: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) throw new Error("Request not found");
      if (!request.isAdminDefault) throw new Error("Only admin default requests can be toggled");

      const updated = await prisma.cspSupportRequest.update({
        where: { id: input.requestId },
        data: {
          isActive: input.isActive,
          // B3: Don't set status to "closed" when deactivating — "closed" means fulfilled.
          // Only set status to "broadcasting" when reactivating.
          ...(input.isActive ? { status: "broadcasting" as const } : {}),
        },
      });

      return { requestId: updated.id, isActive: updated.isActive, status: updated.status };
    }),

  // Admin-only: Mark default request as complete
  markAdminDefaultComplete: protectedProcedure
    .input(z.object({
      requestId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: { select: { id: true, name: true, email: true, sponsorId: true } } },
      });

      if (!request) throw new Error("Request not found");
      if (!request.isAdminDefault) throw new Error("Only admin default requests can be marked complete");

      // B4: If the request raised funds, release them before closing.
      if (request.raisedAmount > 0) {
        const holdingWalletName = `CSP Holding - ${request.id}`;
        const holdingWallet = await ensureSystemWallet(prisma, holdingWalletName, "CSP_HOLDING");
        if (holdingWallet.balanceNgn > 0) {
          const total = Math.min(holdingWallet.balanceNgn, request.raisedAmount);
          const pct = await loadCspFeePercentages(prisma);

          const fullyFunded =
            request.thresholdAmount > 0 &&
            request.raisedAmount >= request.thresholdAmount &&
            request.requestedAmount != null &&
            request.requestedAmount > 0;

          let shares: { recipient: number; admin: number; sponsor: number; state: number; management: number; reserve: number };

          if (fullyFunded) {
            const recipientShare = Math.min(request.requestedAmount!, total);
            const markupPool = total - recipientShare;
            const adminPoolWeight = pct.admin + pct.sponsor + pct.state + pct.management + pct.reserve;
            const safeWeight = adminPoolWeight > 0 ? adminPoolWeight : 1;
            const adminShare = Math.floor(markupPool * (pct.admin / safeWeight));
            const sponsorShare = Math.floor(markupPool * (pct.sponsor / safeWeight));
            const stateShare = Math.floor(markupPool * (pct.state / safeWeight));
            const managementShare = Math.floor(markupPool * (pct.management / safeWeight));
            const reserveShare = markupPool - adminShare - sponsorShare - stateShare - managementShare;
            shares = { recipient: recipientShare, admin: adminShare, sponsor: sponsorShare, state: stateShare, management: managementShare, reserve: reserveShare };
          } else {
            const adminShare = Math.floor(total * pct.admin);
            const sponsorShare = Math.floor(total * pct.sponsor);
            const stateShare = Math.floor(total * pct.state);
            const managementShare = Math.floor(total * pct.management);
            const reserveShare = Math.floor(total * pct.reserve);
            const allocated = adminShare + sponsorShare + stateShare + managementShare + reserveShare;
            shares = { recipient: total - allocated, admin: adminShare, sponsor: sponsorShare, state: stateShare, management: managementShare, reserve: reserveShare };
          }

          await prisma.$transaction(async (tx) => {
            const holding = await ensureSystemWallet(tx, holdingWalletName, "CSP_HOLDING");
            await tx.systemWallet.update({
              where: { id: holding.id },
              data: { balanceNgn: { decrement: total } },
            });
            await tx.user.update({
              where: { id: request.userId },
              data: { wallet: { increment: shares.recipient } },
            });
            if (request.User?.sponsorId && shares.sponsor > 0) {
              await tx.user.update({
                where: { id: request.User.sponsorId },
                data: { wallet: { increment: shares.sponsor } },
              });
            }
            const adminWallet = await ensureSystemWallet(tx, "CSP Admin Wallet", "EXECUTIVE_POOL");
            await tx.systemWallet.update({ where: { id: adminWallet.id }, data: { balanceNgn: { increment: shares.admin } } });
            const stateWallet = await ensureSystemWallet(tx, "CSP State Wallet", "STATE_REVENUE_POOL");
            await tx.systemWallet.update({ where: { id: stateWallet.id }, data: { balanceNgn: { increment: shares.state } } });
            const managementWallet = await ensureSystemWallet(tx, "CSP Management Wallet", "CSP_MANAGEMENT_RESERVE");
            await tx.systemWallet.update({ where: { id: managementWallet.id }, data: { balanceNgn: { increment: shares.management } } });
            const reserveWallet = await ensureSystemWallet(tx, "CSP Reserve Wallet", "CSP_RESERVE");
            await tx.systemWallet.update({ where: { id: reserveWallet.id }, data: { balanceNgn: { increment: shares.reserve } } });
            await tx.transaction.create({
              data: {
                id: randomUUID(),
                userId: request.userId,
                transactionType: "CSP_PAYOUT",
                amount: shares.recipient,
                description: `CSP support released (admin default request ${request.id})`,
                status: "completed",
                walletType: "wallet",
              },
            });
            const adminUserId = (ctx.session?.user as any)?.id as string | undefined;
            await tx.auditLog.create({
              data: {
                id: randomUUID(),
                userId: adminUserId ?? request.userId,
                action: "CSP_RELEASE_FUNDS",
                entity: "CSP_SUPPORT_REQUEST",
                entityId: request.id,
                metadata: {
                  beneficiaryUserId: request.userId,
                  category: request.category,
                  totalReleased: total,
                  recipientCredited: shares.recipient,
                  fullyFunded,
                  shares,
                  adminDefault: true,
                },
                ipAddress: "",
                userAgent: "",
              },
            });
          });

          await notifyCspRequestProcessed(request.userId, request.category, shares.recipient, "released");
          if (request.User?.email) {
            try { await sendCspLifecycleEmail(request.User.email, "processed", {
              category: request.category,
              amount: shares.recipient,
              status: "released",
              requestedAmount: request.requestedAmount ?? undefined,
              totalRaised: total,
              fullyFunded,
              shares,
            }); }
            catch (e) { console.error("[CSP] Lifecycle email failed:", e); }
          }
        }
      }

      const updated = await prisma.cspSupportRequest.update({
        where: { id: input.requestId },
        data: {
          status: "closed",
          isActive: false,
        },
      });

      return { requestId: updated.id, status: updated.status };
    }),

  // Reject a CSP request with reason
  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.string().uuid(), reason: z.string().min(10).max(500) }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: true },
      });

      if (!request) throw new Error("Request not found");
      if (request.status !== "pending") throw new Error("Only pending requests can be rejected");

      // B1: Mark as rejected instead of deleting (preserves audit trail)
      await prisma.cspSupportRequest.update({
        where: { id: input.requestId },
        data: {
          status: "rejected",
          rejectionReason: input.reason,
        },
      });

      // Send email and notification to user
      await notifyCspRequestRejected(
        request.userId,
        request.category,
        input.reason
      );
      await notifyCspRequestProcessed(request.userId, request.category, request.requestedAmount ?? request.thresholdAmount, "rejected");
      const beneficiary = await prisma.user.findUnique({ where: { id: request.userId }, select: { email: true } });
      if (beneficiary?.email) {
        try { await sendCspLifecycleEmail(beneficiary.email, "processed", { category: request.category, amount: request.requestedAmount ?? request.thresholdAmount, status: "rejected" }); }
        catch (e) { console.error("[CSP] Lifecycle email failed:", e); }
      }

      return { success: true };
    }),

  // List all admin default requests
  listAdminDefaultRequests: protectedProcedure
    .query(async ({ ctx }) => {
      assertAdmin(ctx.session);

      const requests = await prisma.cspSupportRequest.findMany({
        where: { isAdminDefault: true },
        include: {
          User: { select: { id: true, name: true, email: true } },
          Contributions: { select: { amount: true, contributorId: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return requests;
    }),

  /**
   * Get current CSP fee percentages (admin-configurable, with spec-correct defaults)
   * Distribution: 80% recipient | 5% admin | 2% sponsor | 2% state | 4% management | 7% reserve
   */
  getCspFeeSettings: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    return loadCspFeePercentages(prisma);
  }),

  /**
   * Update CSP fee percentages (admin only).
   * All values are decimal fractions (e.g. 0.05 = 5%).
   * The sum of all percentages must equal exactly 1.0.
   */
  updateCspFeeSettings: protectedProcedure
    .input(
      z.object({
        recipient: z.number().min(0).max(1),
        admin: z.number().min(0).max(1),
        sponsor: z.number().min(0).max(1),
        state: z.number().min(0).max(1),
        management: z.number().min(0).max(1),
        reserve: z.number().min(0).max(1),
      }).refine((v) => {
        const total = v.recipient + v.admin + v.sponsor + v.state + v.management + v.reserve;
        return Math.abs(total - 1.0) < 0.0001;
      }, { message: "All CSP fee percentages must sum to exactly 1.0 (100%)" })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const entries = [
        { settingKey: "csp_fee_recipient_pct",  settingValue: String(input.recipient),  description: "CSP fee: recipient share (spec: 80%)" },
        { settingKey: "csp_fee_admin_pct",       settingValue: String(input.admin),      description: "CSP fee: BPI Profit Pool share (spec: 5%)" },
        { settingKey: "csp_fee_sponsor_pct",     settingValue: String(input.sponsor),    description: "CSP fee: direct sponsor share (spec: 2%)" },
        { settingKey: "csp_fee_state_pct",       settingValue: String(input.state),      description: "CSP fee: state wallet share (spec: 2%)" },
        { settingKey: "csp_fee_management_pct",  settingValue: String(input.management), description: "CSP fee: management wallet share (spec: 4%)" },
        { settingKey: "csp_fee_reserve_pct",     settingValue: String(input.reserve),    description: "CSP fee: reserve pool share (spec: 7%)" },
      ];
      await prisma.$transaction(
        entries.map((e) => prisma.adminSettings.upsert({
          where: { settingKey: e.settingKey },
          update: { settingValue: e.settingValue },
          create: { id: randomUUID(), settingKey: e.settingKey, settingValue: e.settingValue, description: e.description, updatedAt: new Date() },
        }))
      );
      return { success: true };
    }),

  // ─── Wait Period Status ──────────────────────────────────────────────────────

  /** Returns the current user's cooldown status and monthly wait-reduction progress */
  getWaitStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");

    const [config, tierConfig] = await Promise.all([
      loadEligibilityConfig(prisma),
      loadTierConfig(prisma),
    ]);
    const now = new Date();

    const [activeRequest, sponsorProgress]: [any, any] = tierConfig.tierModelEnabled
      ? await Promise.all([
          prisma.cspMemberStanding.findUnique({
            where: { userId },
            select: { coolingEndsAt: true, coolingMonthsBase: true, lastSupportReleasedAt: true, directSponsorCount: true },
          }),
          prisma.$transaction((tx) =>
            reconcileSponsorCoolingProgress(
              tx,
              userId,
              {
                sponsorshipRequiredCount: tierConfig.sponsorshipRequiredCount,
                sponsorshipReducedCoolingMonths: tierConfig.sponsorshipReducedCoolingMonths,
                sponsorshipRequiresKyc: tierConfig.sponsorshipRequiresKyc,
                sponsorshipRequiresRegularPlus: tierConfig.sponsorshipRequiresRegularPlus,
                sponsorshipAutoApply: tierConfig.sponsorshipAutoApply,
              },
              { autoApply: false }
            )
          ),
        ])
      : [
          await prisma.cspSupportRequest.findFirst({
            where: { userId, status: "released", cooldownEndsAt: { not: null } },
            orderBy: { releasedAt: "desc" },
            select: { id: true, cooldownMonths: true, cooldownEndsAt: true, releasedAt: true },
          }),
          null,
        ];

    if (!tierConfig.tierModelEnabled) {
      if (!activeRequest || !activeRequest.cooldownEndsAt) {
        return { hasCooldown: false, cooldownEndsAt: null, cooldownMonths: null, monthlyProgress: null };
      }

      const isActive = activeRequest.cooldownEndsAt > now;
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const thisMonth = await prisma.cspWaitReductionLog.findUnique({
        where: { userId_requestId_monthKey: { userId, requestId: activeRequest.id, monthKey } },
      });

      return {
        hasCooldown: isActive,
        cooldownEndsAt: activeRequest.cooldownEndsAt,
        cooldownMonths: activeRequest.cooldownMonths,
        releasedAt: activeRequest.releasedAt,
        monthlyProgress: {
          monthKey,
          contributed: thisMonth?.amountContrib ?? 0,
          target: config.waitReductionMonthlyTarget,
          pct: Math.min(100, Math.round(((thisMonth?.amountContrib ?? 0) / config.waitReductionMonthlyTarget) * 100)),
          reduced: thisMonth?.monthReduced ?? false,
        },
      };
    }

    const cooling = selectEffectiveCoolingState({
      tierModelEnabled: true,
      releasedCooldownEndsAt: null,
      standingCoolingEndsAt: activeRequest?.coolingEndsAt ?? null,
      standingCoolingMonthsBase: activeRequest?.coolingMonthsBase ?? null,
      standingLastSupportReleasedAt: activeRequest?.lastSupportReleasedAt ?? null,
      now,
    });

    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const activeCooldownRequest = await prisma.cspSupportRequest.findFirst({
      where: {
        userId,
        status: "closed",
        fulfilledAt: { not: null },
      },
      orderBy: { fulfilledAt: "desc" },
      select: { id: true },
    });
    const thisMonth = activeCooldownRequest
      ? await prisma.cspWaitReductionLog.findUnique({
          where: { userId_requestId_monthKey: { userId, requestId: activeCooldownRequest.id, monthKey } },
        })
      : null;

    return {
      hasCooldown: cooling.isActive,
      cooldownEndsAt: cooling.cooldownEndsAt,
      cooldownMonths: cooling.cooldownMonths,
      releasedAt: cooling.lastSupportReleasedAt,
      source: cooling.source,
      sponsorProgress: sponsorProgress
        ? {
            directSponsorCount: sponsorProgress.standing.directSponsorCount,
            requiredCount: sponsorProgress.decision.requiredCount,
            reducedCoolingMonths: sponsorProgress.decision.reducedCoolingMonths,
            reducedCoolingEndsAt: sponsorProgress.decision.reducedCoolingEndsAt,
            qualifies: sponsorProgress.decision.qualifies,
            shouldShorten: sponsorProgress.decision.shouldShorten,
            applied: sponsorProgress.applied,
          }
        : null,
      monthlyProgress: cooling.isActive
        ? {
            monthKey,
            contributed: thisMonth?.amountContrib ?? 0,
            target: config.waitReductionMonthlyTarget,
            pct: Math.min(100, Math.round(((thisMonth?.amountContrib ?? 0) / config.waitReductionMonthlyTarget) * 100)),
            reduced: thisMonth?.monthReduced ?? false,
          }
        : null,
    };
  }),

  // ─── Country Activation ──────────────────────────────────────────────────────

  /** List all CSP country records (admin) */
  listCspCountries: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    return prisma.cspCountry.findMany({ orderBy: { countryName: "asc" } });
  }),

  /** Create or update a CSP country record (admin) */
  upsertCspCountry: protectedProcedure
    .input(z.object({
      countryCode: z.string().min(2).max(3).toUpperCase(),
      countryName: z.string().min(1),
      isNationalActive: z.boolean().optional(),
      isGlobalActive: z.boolean().optional(),
      activationThreshold: z.number().int().min(0).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const existing = await prisma.cspCountry.findUnique({ where: { countryCode: input.countryCode } });
      const wasActivated = existing?.isNationalActive ?? false;
      const nowActivated = input.isNationalActive ?? existing?.isNationalActive ?? false;

      const record = await prisma.cspCountry.upsert({
        where: { countryCode: input.countryCode },
        update: {
          countryName: input.countryName,
          ...(input.isNationalActive !== undefined ? { isNationalActive: input.isNationalActive } : {}),
          ...(input.isGlobalActive !== undefined ? { isGlobalActive: input.isGlobalActive } : {}),
          ...(input.activationThreshold !== undefined ? { activationThreshold: input.activationThreshold } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          // Set activatedAt when first activated
          ...(!wasActivated && nowActivated ? { activatedAt: new Date() } : {}),
          updatedAt: new Date(),
        },
        create: {
          countryCode: input.countryCode,
          countryName: input.countryName,
          isNationalActive: input.isNationalActive ?? false,
          isGlobalActive: input.isGlobalActive ?? false,
          activationThreshold: input.activationThreshold ?? 10000,
          notes: input.notes,
          activatedAt: nowActivated ? new Date() : undefined,
          updatedAt: new Date(),
        },
      });
      return record;
    }),

  /** Increment a country's regular activation count and auto-activate when threshold is reached (admin) */
  updateCountryActivationCount: protectedProcedure
    .input(z.object({ countryCode: z.string(), incrementBy: z.number().int().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const country = await prisma.cspCountry.findUnique({ where: { countryCode: input.countryCode } });
      if (!country) throw new Error(`Country ${input.countryCode} not found`);

      const newCount = country.regularActivationCount + input.incrementBy;
      const shouldActivate = !country.isNationalActive && newCount >= country.activationThreshold;

      const updated = await prisma.cspCountry.update({
        where: { countryCode: input.countryCode },
        data: {
          regularActivationCount: newCount,
          ...(shouldActivate ? { isNationalActive: true, activatedAt: new Date() } : {}),
          updatedAt: new Date(),
        },
      });
      return updated;
    }),

  // ─── Reserve Pool Transfer ───────────────────────────────────────────────────

  /**
   * Transfer funds from the CSP Reserve Wallet to a specific user's community wallet.
   * Used for beneficiaries whose campaigns did not meet the target.
   */
  transferReserveToUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      amount: z.number().int().positive(),
      reason: z.string().min(5),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const reserveWallet = await ensureSystemWallet(prisma, "CSP Reserve Wallet", "CSP_RESERVE");
      if (reserveWallet.balanceNgn < input.amount) {
        throw new Error(`Insufficient reserve balance. Available: ₦${reserveWallet.balanceNgn.toLocaleString()}`);
      }

      const targetUser = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, name: true, email: true } });
      if (!targetUser) throw new Error("Target user not found");

      await prisma.$transaction(async (tx) => {
        const reserve = await ensureSystemWallet(tx, "CSP Reserve Wallet", "CSP_RESERVE");
        await tx.systemWallet.update({
          where: { id: reserve.id },
          data: { balanceNgn: { decrement: input.amount } },
        });
        await tx.user.update({
          where: { id: input.userId },
          data: { community: { increment: input.amount } },
        });
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: input.userId,
            transactionType: "CSP_RESERVE_TRANSFER",
            amount: input.amount,
            description: `CSP Reserve transfer: ${input.reason}`,
            status: "completed",
            walletType: "community",
          },
        });
      });

      return { success: true, userId: input.userId, amount: input.amount };
    }),

  // ─── Eligibility Config CMS ──────────────────────────────────────────────────

  /** Get current CSP eligibility thresholds (admin) */
  getCspEligibilityConfig: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    return loadEligibilityConfig(prisma);
  }),

  /** Update CSP eligibility thresholds (admin) */
  updateCspEligibilityConfig: protectedProcedure
    .input(z.object({
      minPerContribution:                z.number().int().min(0).optional(),
      national_minMembership:            z.string().optional(),
      national_minDirects:               z.number().int().min(0).optional(),
      national_minCumulativeContrib:     z.number().int().min(0).optional(),
      national_minDistinctRequests:      z.number().int().min(0).optional(),
      national_broadcastHours:           z.number().int().min(0).optional(),
      national_minThreshold:             z.number().int().min(0).optional(),
      global_minMembership:              z.string().optional(),
      global_minDirects:                 z.number().int().min(0).optional(),
      global_minCumulativeContrib:       z.number().int().min(0).optional(),
      global_minDistinctRequests:        z.number().int().min(0).optional(),
      global_broadcastHours:             z.number().int().min(0).optional(),
      global_minThreshold:               z.number().int().min(0).optional(),
      waitReductionMonthlyTarget:        z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const mapping: Record<string, string | number | undefined> = {
        csp_min_per_contribution:              input.minPerContribution,
        csp_national_min_membership:           input.national_minMembership,
        csp_national_min_directs:              input.national_minDirects,
        csp_national_min_cumulative_contrib:   input.national_minCumulativeContrib,
        csp_national_min_distinct_requests:    input.national_minDistinctRequests,
        csp_national_broadcast_hours:          input.national_broadcastHours,
        csp_national_min_threshold:            input.national_minThreshold,
        csp_global_min_membership:             input.global_minMembership,
        csp_global_min_directs:                input.global_minDirects,
        csp_global_min_cumulative_contrib:     input.global_minCumulativeContrib,
        csp_global_min_distinct_requests:      input.global_minDistinctRequests,
        csp_global_broadcast_hours:            input.global_broadcastHours,
        csp_global_min_threshold:              input.global_minThreshold,
        csp_wait_reduction_monthly_target:     input.waitReductionMonthlyTarget,
      };
      const entries = Object.entries(mapping).filter(([, v]) => v !== undefined);
      await prisma.$transaction(
        entries.map(([key, val]) => prisma.adminSettings.upsert({
          where: { settingKey: key },
          update: { settingValue: String(val), updatedAt: new Date() },
          create: { id: randomUUID(), settingKey: key, settingValue: String(val), updatedAt: new Date() },
        }))
      );
      return { success: true, updatedKeys: entries.map(([k]) => k) };
    }),

  /** Get current CSP tier model configuration (admin) */
  getCspTierConfig: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    return loadTierConfig(prisma);
  }),

  /** List CSP tier rule change logs (admin) */
  adminListCspRuleChangeLogs: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(10),
      ruleKey: z.string().trim().min(1).max(120).optional(),
    }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const where = input.ruleKey
        ? { ruleKey: { contains: input.ruleKey, mode: "insensitive" as const } }
        : {};

      const [logs, total] = await prisma.$transaction([
        prisma.cspRuleChangeLog.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: {
            AdminUser: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.cspRuleChangeLog.count({ where }),
      ]);

      return {
        logs,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      };
    }),

  /** Update CSP tier model configuration (admin) */
  updateCspTierConfig: protectedProcedure
    .input(z.object({
      tierModelEnabled: z.boolean().optional(),
      contributionMultiplier: z.number().int().min(0).optional(),
      minContributionRight: z.number().int().min(0).optional(),
      requireKyc: z.boolean().optional(),
      requireAutoDebit: z.boolean().optional(),
      requireAutoContribute: z.boolean().optional(),
      defaultBroadcastHours: z.number().int().min(0).optional(),
      autoExtensionHours: z.number().int().min(0).optional(),
      maxAutoExtensions: z.number().int().min(0).optional(),
      defaultCoolingMonthsMin: z.number().int().min(0).optional(),
      defaultCoolingMonthsMax: z.number().int().min(0).optional(),
      sponsorshipRequiredCount: z.number().int().min(0).optional(),
      sponsorshipReducedCoolingMonths: z.number().int().min(0).optional(),
      sponsorshipRequiresKyc: z.boolean().optional(),
      sponsorshipRequiresRegularPlus: z.boolean().optional(),
      sponsorshipAutoApply: z.boolean().optional(),
      badgeGiftingEnabled: z.boolean().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminUserId = (ctx.session?.user as any)?.id as string;
      if (!adminUserId) throw new Error("UNAUTHORIZED");
      const reason = input.reason?.trim() || null;
      const mapping: Record<string, string | number | boolean | undefined> = {
        csp_tier_model_enabled: input.tierModelEnabled,
        csp_contribution_multiplier: input.contributionMultiplier,
        csp_min_contribution_right: input.minContributionRight,
        csp_require_kyc: input.requireKyc,
        csp_require_auto_debit: input.requireAutoDebit,
        csp_require_auto_contribute: input.requireAutoContribute,
        csp_default_broadcast_hours: input.defaultBroadcastHours,
        csp_auto_extension_hours: input.autoExtensionHours,
        csp_max_auto_extensions: input.maxAutoExtensions,
        csp_default_cooling_months_min: input.defaultCoolingMonthsMin,
        csp_default_cooling_months_max: input.defaultCoolingMonthsMax,
        csp_sponsorship_required_count: input.sponsorshipRequiredCount,
        csp_sponsorship_reduced_cooling_months: input.sponsorshipReducedCoolingMonths,
        csp_sponsorship_requires_kyc: input.sponsorshipRequiresKyc,
        csp_sponsorship_requires_regular_plus: input.sponsorshipRequiresRegularPlus,
        csp_sponsorship_auto_apply: input.sponsorshipAutoApply,
        csp_badge_gifting_enabled: input.badgeGiftingEnabled,
      };
      const entries = Object.entries(mapping).filter(([, v]) => v !== undefined);
      const currentRows = await prisma.adminSettings.findMany({ where: { settingKey: { in: entries.map(([key]) => key) } } });
      const previousByKey = new Map(currentRows.map((row) => [row.settingKey, row.settingValue]));
      const changedEntries = entries.filter(([key, value]) => previousByKey.get(key) !== String(value));
      await prisma.$transaction([
        ...changedEntries.map(([key, val]) => prisma.adminSettings.upsert({
          where: { settingKey: key },
          update: { settingValue: String(val), updatedAt: new Date() },
          create: { id: randomUUID(), settingKey: key, settingValue: String(val), updatedAt: new Date() },
        })),
        ...changedEntries.map(([key, val]) => prisma.cspRuleChangeLog.create({
          data: {
            id: randomUUID(),
            adminUserId,
            ruleKey: key,
            previousValue: previousByKey.get(key) ?? null,
            newValue: String(val),
            reason,
          },
        })),
      ]);
      return { success: true, updatedKeys: changedEntries.map(([k]) => k) };
    }),

  /** List every CSP tier row for admin management (includes inactive) */
  adminListCspTiers: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    return prisma.cspTier.findMany({
      orderBy: [{ sortOrder: "asc" }, { tierNumber: "asc" }],
      select: {
        id: true,
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
  }),

  /** Create or update CSP tier rows (admin). Zero values are allowed. */
  adminUpsertCspTiers: protectedProcedure
    .input(z.object({
      tiers: z.array(z.object({
        id: z.string().optional(),
        tierNumber: z.number().int().min(0),
        name: z.string().trim().min(1).max(120),
        contributionRight: z.number().int().min(0),
        maxSupportCap: z.number().int().min(0),
        minFulfilmentPct: z.number().int().min(0).max(100),
        isActive: z.boolean(),
        isSpecial: z.boolean().optional(),
        sortOrder: z.number().int().min(0).optional(),
      })).min(1),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminUserId = (ctx.session?.user as any)?.id as string;
      if (!adminUserId) throw new Error("UNAUTHORIZED");
      const reason = input.reason?.trim() || null;

      const existing = await prisma.cspTier.findMany({
        select: {
          id: true, tierNumber: true, name: true, contributionRight: true,
          maxSupportCap: true, minFulfilmentPct: true, isActive: true, isSpecial: true, sortOrder: true,
        },
      });
      const byNumber = new Map(existing.map((t) => [t.tierNumber, t]));

      const ops: any[] = [];
      const logs: any[] = [];
      for (const tier of input.tiers) {
        const prev = byNumber.get(tier.tierNumber) ?? null;
        const data = {
          name: tier.name,
          contributionRight: tier.contributionRight,
          maxSupportCap: tier.maxSupportCap,
          minFulfilmentPct: tier.minFulfilmentPct,
          isActive: tier.isActive,
          ...(tier.isSpecial !== undefined ? { isSpecial: tier.isSpecial } : {}),
          ...(tier.sortOrder !== undefined ? { sortOrder: tier.sortOrder } : {}),
        };
        ops.push(prisma.cspTier.upsert({
          where: { tierNumber: tier.tierNumber },
          update: data,
          create: {
            tierNumber: tier.tierNumber,
            isSpecial: tier.isSpecial ?? false,
            sortOrder: tier.sortOrder ?? tier.tierNumber,
            ...data,
          },
        }));

        // Audit each changed field via the shared rule-change log.
        const trackedFields: Array<[string, string | number | boolean, string | number | boolean | null]> = [
          ["name", tier.name, prev?.name ?? null],
          ["contributionRight", tier.contributionRight, prev?.contributionRight ?? null],
          ["maxSupportCap", tier.maxSupportCap, prev?.maxSupportCap ?? null],
          ["minFulfilmentPct", tier.minFulfilmentPct, prev?.minFulfilmentPct ?? null],
          ["isActive", tier.isActive, prev?.isActive ?? null],
        ];
        for (const [field, next, previous] of trackedFields) {
          if (previous === null || String(previous) !== String(next)) {
            logs.push(prisma.cspRuleChangeLog.create({
              data: {
                id: randomUUID(),
                adminUserId,
                ruleKey: `csp_tier_${tier.tierNumber}_${field}`,
                previousValue: previous === null ? null : String(previous),
                newValue: String(next),
                reason,
              },
            }));
          }
        }
      }

      await prisma.$transaction([...ops, ...logs]);
      return { success: true, updated: input.tiers.length };
    }),

  /** Seed default CSP tier rows if the table is empty (admin) */
  seedDefaultCspTiers: protectedProcedure.mutation(async ({ ctx }) => {
    assertAdmin(ctx.session);
    const adminUserId = (ctx.session?.user as any)?.id as string;
    if (!adminUserId) throw new Error("UNAUTHORIZED");

    const existingCount = await prisma.cspTier.count();
    if (existingCount > 0) {
      return { success: true, message: "Tiers already exist", count: existingCount };
    }

    const defaultTiers = [
      { tierNumber: 1, name: "Tier 1", contributionRight: 10000, maxSupportCap: 200000 },
      { tierNumber: 2, name: "Tier 2", contributionRight: 20000, maxSupportCap: 400000 },
      { tierNumber: 3, name: "Tier 3", contributionRight: 30000, maxSupportCap: 600000 },
      { tierNumber: 4, name: "Tier 4", contributionRight: 50000, maxSupportCap: 1000000 },
      { tierNumber: 5, name: "Tier 5", contributionRight: 75000, maxSupportCap: 1500000 },
      { tierNumber: 6, name: "Tier 6", contributionRight: 100000, maxSupportCap: 2000000 },
      { tierNumber: 7, name: "Tier 7", contributionRight: 125000, maxSupportCap: 2500000 },
      { tierNumber: 8, name: "Tier 8", contributionRight: 150000, maxSupportCap: 3000000 },
      { tierNumber: 9, name: "Tier 9", contributionRight: 175000, maxSupportCap: 3500000 },
      { tierNumber: 10, name: "Tier 10", contributionRight: 200000, maxSupportCap: 4000000 },
      { tierNumber: 11, name: "Tier 11", contributionRight: 225000, maxSupportCap: 4500000 },
      { tierNumber: 12, name: "Tier 12", contributionRight: 250000, maxSupportCap: 5000000 },
      { tierNumber: 13, name: "Tier 13", contributionRight: 275000, maxSupportCap: 5500000 },
      { tierNumber: 14, name: "Tier 14", contributionRight: 300000, maxSupportCap: 6000000 },
      { tierNumber: 15, name: "Tier 15", contributionRight: 325000, maxSupportCap: 6500000 },
      { tierNumber: 16, name: "Tier 16", contributionRight: 350000, maxSupportCap: 7000000 },
      { tierNumber: 17, name: "Tier 17", contributionRight: 375000, maxSupportCap: 7500000 },
      { tierNumber: 18, name: "Tier 18", contributionRight: 400000, maxSupportCap: 8000000 },
      { tierNumber: 19, name: "Tier 19", contributionRight: 450000, maxSupportCap: 9000000 },
      { tierNumber: 20, name: "Tier 20", contributionRight: 500000, maxSupportCap: 10000000 },
    ];

    await prisma.cspTier.createMany({
      data: defaultTiers.map((t) => ({
        ...t,
        minFulfilmentPct: 30,
        isActive: true,
        isSpecial: false,
        sortOrder: t.tierNumber,
      })),
    });

    // Log the action
    await prisma.cspRuleChangeLog.create({
      data: {
        id: randomUUID(),
        adminUserId,
        ruleKey: "csp_tiers_seeded",
        previousValue: "0",
        newValue: String(defaultTiers.length),
        reason: "Seeded default CSP tiers from admin panel",
      },
    });

    return { success: true, message: `Seeded ${defaultTiers.length} default tiers`, count: defaultTiers.length };
  }),

  /** Apply the sponsor-based cooling reduction for a member (admin) */
  applyCspSponsorCoolingReduction: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminUserId = (ctx.session?.user as any)?.id as string | undefined;
      if (!adminUserId) throw new Error("UNAUTHORIZED");

      const tierConfig = await loadTierConfig(prisma);
      if (!tierConfig.tierModelEnabled) {
        throw new Error("Tier model is disabled.");
      }

      const result = await prisma.$transaction((tx) =>
        reconcileSponsorCoolingProgress(
          tx,
          input.userId,
          {
            sponsorshipRequiredCount: tierConfig.sponsorshipRequiredCount,
            sponsorshipReducedCoolingMonths: tierConfig.sponsorshipReducedCoolingMonths,
            sponsorshipRequiresKyc: tierConfig.sponsorshipRequiresKyc,
            sponsorshipRequiresRegularPlus: tierConfig.sponsorshipRequiresRegularPlus,
            sponsorshipAutoApply: tierConfig.sponsorshipAutoApply,
          },
          {
            forceApply: true,
            adminUserId,
            reason: input.reason?.trim() || null,
          }
        )
      );

      return {
        success: true,
        applied: result.applied,
        directSponsorCount: result.standing.directSponsorCount,
        requiredCount: result.decision.requiredCount,
        reducedCoolingEndsAt: result.decision.reducedCoolingEndsAt,
        currentCoolingEndsAt: result.decision.currentCoolingEndsAt,
      };
    }),

  // ============================================
  // CSP AUTO-CONTRIBUTE USER SETTINGS
  // ============================================
  getAutoContributeSettings: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string;
    if (!userId) throw new Error("UNAUTHORIZED");

    const setting = await prisma.cspAutoContributeSetting.findUnique({
      where: { userId },
    });

    return setting ?? {
      isEnabled: false,
      minAmountPerRequest: 500,
      maxAmountPerRequest: 1000,
    };
  }),

  saveAutoContributeSettings: protectedProcedure
    .input(z.object({
      isEnabled: z.boolean(),
      minAmountPerRequest: z.number().int().min(100),
      maxAmountPerRequest: z.number().int().min(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string;
      if (!userId) throw new Error("UNAUTHORIZED");

      if (input.maxAmountPerRequest < input.minAmountPerRequest) {
        throw new Error("Maximum amount per request must be greater than or equal to minimum.");
      }

      // If enabling, check community wallet balance
      if (input.isEnabled) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { community: true },
        });
        if (!user || user.community < input.minAmountPerRequest) {
          throw new Error("Insufficient community wallet balance to enable auto-contribute. Please fund your community wallet first.");
        }
      }

      const setting = await prisma.cspAutoContributeSetting.upsert({
        where: { userId },
        create: {
          userId,
          isEnabled: input.isEnabled,
          minAmountPerRequest: input.minAmountPerRequest,
          maxAmountPerRequest: input.maxAmountPerRequest,
        },
        update: {
          isEnabled: input.isEnabled,
          minAmountPerRequest: input.minAmountPerRequest,
          maxAmountPerRequest: input.maxAmountPerRequest,
        },
      });

      // If just enabled, trigger an immediate auto-contribute run
      if (input.isEnabled) {
        const { runCspAutoContribute } = await import("@/server/services/cspAutoContribute.service");
        // Fire and forget — don't block the response
        runCspAutoContribute({ prisma, userId }).catch((err) => {
          console.error(`[CSP_AUTO_CONTRIBUTE] Error for user ${userId}:`, err);
        });
      }

      return { success: true, setting };
    }),

  getAutoContributeLogs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string;
      if (!userId) throw new Error("UNAUTHORIZED");

      const logs = await prisma.cspAutoContributeLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: {
          Request: { select: { id: true, purpose: true, amount: true } },
        },
      });

      return logs;
    }),

  // ============================================
  // ADMIN: CSP AUTO-CONTRIBUTE MANAGEMENT
  // ============================================
  adminGetAutoContributeUsers: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      enabledOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      const where = input.enabledOnly ? { isEnabled: true } : {};
      const [settings, total] = await Promise.all([
        prisma.cspAutoContributeSetting.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            User: { select: { id: true, name: true, email: true, community: true, firstname: true, lastname: true } },
          },
        }),
        prisma.cspAutoContributeSetting.count({ where }),
      ]);

      // Get global disable status
      const globalSetting = await prisma.adminSettings.findUnique({
        where: { settingKey: "csp_auto_contribute_disabled" },
      });

      return {
        settings,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
        globalDisabled: globalSetting?.settingValue === "true",
      };
    }),

  adminToggleAutoContributeGlobal: protectedProcedure
    .input(z.object({ disabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      await prisma.adminSettings.upsert({
        where: { settingKey: "csp_auto_contribute_disabled" },
        update: { settingValue: input.disabled ? "true" : "false", updatedAt: new Date() },
        create: { id: randomUUID(), settingKey: "csp_auto_contribute_disabled", settingValue: input.disabled ? "true" : "false", updatedAt: new Date() },
      });

      return { success: true, globalDisabled: input.disabled };
    }),

  /** Manually trigger the recurring auto-contribute sweep (admin). */
  adminRunAutoContributeSweep: protectedProcedure
    .mutation(async ({ ctx }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      const { runCspAutoContributeSweep } = await import("@/server/jobs/cspAutoContributeSweep");
      const result = await runCspAutoContributeSweep();
      return result;
    }),

  adminToggleAutoContributeUser: protectedProcedure
    .input(z.object({ userId: z.string(), disabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      if (input.disabled) {
        // Disable this user's auto-contribute
        await prisma.cspAutoContributeSetting.updateMany({
          where: { userId: input.userId },
          data: { isEnabled: false },
        });
        await prisma.adminSettings.upsert({
          where: { settingKey: `csp_auto_contribute_disabled_${input.userId}` },
          update: { settingValue: "true", updatedAt: new Date() },
          create: { id: randomUUID(), settingKey: `csp_auto_contribute_disabled_${input.userId}`, settingValue: "true", updatedAt: new Date() },
        });
      } else {
        // Remove per-user disable flag
        await prisma.adminSettings.deleteMany({
          where: { settingKey: `csp_auto_contribute_disabled_${input.userId}` },
        });
      }

      return { success: true };
    }),

  adminGetAutoContributeLogs: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      const where = input.userId ? { userId: input.userId } : {};
      const [logs, total] = await Promise.all([
        prisma.cspAutoContributeLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            User: { select: { id: true, name: true, email: true, firstname: true, lastname: true } },
            Request: { select: { id: true, purpose: true, amount: true, userId: true } },
          },
        }),
        prisma.cspAutoContributeLog.count({ where }),
      ]);

      return { logs, total, page: input.page, totalPages: Math.ceil(total / input.limit) };
    }),

  // B9: Admin CSV export — support requests
  adminExportRequests: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      category: z.enum(["national", "global"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      const where: any = {};
      if (input?.status) where.status = input.status;
      if (input?.category) where.category = input.category;

      const requests = await prisma.cspSupportRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          User: { select: { id: true, name: true, email: true, firstname: true, lastname: true } },
        },
      });

      const headers = [
        "ID", "User", "Email", "Category", "Amount", "RequestedAmount",
        "Purpose", "Status", "ThresholdAmount", "RaisedAmount",
        "ContributorsCount", "BroadcastExpiresAt", "ApprovedAt", "ReleasedAt",
        "CooldownMonths", "CooldownEndsAt", "IsAdminDefault", "IsActive", "CreatedAt",
      ];

      const rows = requests.map((r) => [
        r.id,
        r.User?.name ?? r.User?.firstname ?? "",
        r.User?.email ?? "",
        r.category,
        r.amount,
        r.requestedAmount ?? "",
        r.purpose,
        r.status,
        r.thresholdAmount,
        r.raisedAmount,
        r.contributorsCount,
        r.broadcastExpiresAt?.toISOString() ?? "",
        r.approvedAt?.toISOString() ?? "",
        r.releasedAt?.toISOString() ?? "",
        r.cooldownMonths ?? "",
        r.cooldownEndsAt?.toISOString() ?? "",
        r.isAdminDefault ? "true" : "false",
        r.isActive ? "true" : "false",
        r.createdAt.toISOString(),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => {
          const s = String(cell ?? "");
          return s.includes(",") || s.includes("\"") || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        }).join(","))
        .join("\n");

      return { csv, filename: `csp-requests-${new Date().toISOString().slice(0, 10)}.csv` };
    }),

  // B9: Admin CSV export — contributions
  adminExportContributions: protectedProcedure
    .input(z.object({
      requestId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string;
      if (!adminId) throw new Error("UNAUTHORIZED");
      const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { userType: true, role: true } });
      const effectiveRole = admin?.role || admin?.userType;
      if (effectiveRole !== "admin" && effectiveRole !== "superadmin" && effectiveRole !== "super_admin") throw new Error("FORBIDDEN");

      const where: any = {};
      if (input?.requestId) where.requestId = input.requestId;

      const contributions = await prisma.cspContribution.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          Contributor: { select: { id: true, name: true, email: true } },
          Request: { select: { id: true, purpose: true, userId: true } },
        },
      });

      const headers = [
        "ID", "RequestID", "RequestPurpose", "ContributorID",
        "ContributorName", "ContributorEmail", "Amount", "WalletType", "CreatedAt",
      ];

      const rows = contributions.map((c) => [
        c.id,
        c.requestId,
        c.Request?.purpose ?? "",
        c.contributorId,
        c.Contributor?.name ?? "",
        c.Contributor?.email ?? "",
        c.amount,
        c.walletType,
        c.createdAt.toISOString(),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => {
          const s = String(cell ?? "");
          return s.includes(",") || s.includes("\"") || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        }).join(","))
        .join("\n");

      return { csv, filename: `csp-contributions-${new Date().toISOString().slice(0, 10)}.csv` };
    }),

  // E4: Admin diagnostics API for hidden broadcast reasons
  getBroadcastVisibilityDiagnostics: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    const now = new Date();
    const broadcasts = await prisma.cspSupportRequest.findMany({
      where: { status: "broadcasting" },
      select: { id: true, isActive: true, isAdminDefault: true, status: true, broadcastExpiresAt: true },
    });
    const hiddenReasonCounts: Record<string, number> = {};
    let visibleCount = 0;
    for (const b of broadcasts) {
      const reason = getCspBroadcastHiddenReason(b, now);
      if (reason) {
        hiddenReasonCounts[reason] = (hiddenReasonCounts[reason] ?? 0) + 1;
      } else {
        visibleCount++;
      }
    }
    return { total: broadcasts.length, visible: visibleCount, hiddenReasonCounts };
  }),

  // E7a: CSP communication feed — notifications addressed to this user with CSP: prefix
  getCommunicationFeed: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");
    const notifications = await prisma.notification.findMany({
      where: { userId, title: { startsWith: "CSP:" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, message: true, link: true, isRead: true, createdAt: true },
    });
    return notifications;
  }),

  getCspAdminOverview: protectedProcedure
    .input(z.object({
      auditPage: z.number().int().min(1).default(1),
      auditLimit: z.number().int().min(1).max(50).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      return fetchCspAdminOverview(input?.auditPage ?? 1, input?.auditLimit ?? 10);
    }),
});
