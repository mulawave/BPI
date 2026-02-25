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
  notifyCspRequestRejected,
  notifyCspRequestSubmitted,
} from "@/server/services/notification.service";

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
  const n = (key: string, def: number) => { const v = parseFloat(m.get(key) ?? ""); return isFinite(v) && v > 0 ? v : def; };
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
  if (!role || (role !== "admin" && role !== "superadmin")) {
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

function computeEligibilityFlags(params: {
  category: CategoryKey;
  membership: MembershipOrder | null;
  membershipActive: boolean;
  qualifiedDirects: number; // directs with at least Regular membership
  cumulativeContributions: number;
  requestsContributed: number;
  hasAnyActivatedCountry: boolean;
  userCountryIsActivated: boolean;
  config: EligibilityConfig;
}) {
  const {
    category, membership, membershipActive,
    qualifiedDirects, cumulativeContributions, requestsContributed,
    hasAnyActivatedCountry, userCountryIsActivated, config,
  } = params;

  const rules = config[category];
  const hasMembership = membershipActive && meetsMembership(membership, rules.minMembership);
  const hasDistinct = requestsContributed >= rules.minDistinctRequests;
  const hasContrib = cumulativeContributions >= rules.minCumulativeContrib;

  if (category === "national") {
    const hasDirects = qualifiedDirects >= rules.minDirects;
    const eligible = hasMembership && hasDirects && hasContrib && hasDistinct;
    return { eligible, hasMembership, hasDirects, hasContrib, hasDistinct, globalPath: null as string | null };
  }

  // Global — two paths
  // Path A: Regular Plus, 10 qualified directs, ₦20k contrib, at least one active country globally
  const pathAMembership = membershipActive && meetsMembership(membership, "regular plus");
  const pathADirects = qualifiedDirects >= 10;
  const pathAEligible = pathAMembership && pathADirects && hasContrib && hasDistinct && hasAnyActivatedCountry;

  // Path B: user's own country activated, 20 qualified directs, ₦20k contrib
  const pathBDirects = qualifiedDirects >= 20;
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

    const [config, user] = await Promise.all([
      loadEligibilityConfig(prisma),
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

    const membershipName = user?.activeMembershipPackageId
      ? (await prisma.membershipPackage.findUnique({
          where: { id: user.activeMembershipPackageId },
          select: { name: true },
        }))?.name ?? null
      : null;

    const membership = normalizeMembership(membershipName);
    const membershipActive = Boolean(user?.membershipActivatedAt && membershipName);

    // Count only qualified directs: referred users with at least a Regular membership
    const allReferrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      select: { referredId: true },
    });
    const referredIds = allReferrals.map((r: any) => r.referredId);
    let qualifiedDirects = 0;
    if (referredIds.length > 0) {
      const regularPkgIds = await prisma.membershipPackage.findMany({
        where: { name: { in: ["Regular", "Regular Plus", "Gold", "Gold Plus", "Platinum", "Platinum Plus"] } },
        select: { id: true },
      });
      const regularPkgIdSet = new Set(regularPkgIds.map((p: any) => p.id));
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

    const contributionGroups = await prisma.cspContribution.groupBy({
      by: ["requestId"],
      where: { contributorId: userId },
      _sum: { amount: true },
    });
    const cumulativeContributions = contributionGroups.reduce((sum: number, row: any) => sum + (row._sum.amount ?? 0), 0);
    const requestsContributed = contributionGroups.length;

    // Country activation check
    const userCountryCode = (user as any)?.country ?? null;
    const [userCountryRecord, anyActivatedCountry] = await Promise.all([
      userCountryCode
        ? prisma.cspCountry.findUnique({ where: { countryCode: userCountryCode } })
        : Promise.resolve(null),
      prisma.cspCountry.findFirst({ where: { isNationalActive: true } }),
    ]);
    const userCountryIsActivated = userCountryRecord?.isNationalActive ?? false;
    const hasAnyActivatedCountry = anyActivatedCountry !== null;

    const categories = {
      national: computeEligibilityFlags({ category: "national", membership, membershipActive, qualifiedDirects, cumulativeContributions, requestsContributed, hasAnyActivatedCountry, userCountryIsActivated, config }),
      global: computeEligibilityFlags({ category: "global", membership, membershipActive, qualifiedDirects, cumulativeContributions, requestsContributed, hasAnyActivatedCountry, userCountryIsActivated, config }),
    } as const;

    // Cooldown status from most recent released request
    const latestReleased = await prisma.cspSupportRequest.findFirst({
      where: { userId, status: "released", cooldownEndsAt: { not: null } },
      orderBy: { releasedAt: "desc" },
      select: { id: true, cooldownEndsAt: true, cooldownMonths: true, releasedAt: true },
    });
    const cooldownActive = latestReleased?.cooldownEndsAt ? latestReleased.cooldownEndsAt > new Date() : false;

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
      categories,
      walletBalance: (user as any)?.wallet ?? 0,
      communityBalance: (user as any)?.community ?? 0,
      userCountryCode,
      userCountryIsActivated,
      hasAnyActivatedCountry,
      cooldown: latestReleased ? {
        requestId: latestReleased.id,
        cooldownMonths: latestReleased.cooldownMonths,
        cooldownEndsAt: latestReleased.cooldownEndsAt,
        releasedAt: latestReleased.releasedAt,
        isActive: cooldownActive,
      } : null,
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

      const [config, user] = await Promise.all([
        loadEligibilityConfig(prisma),
        prisma.user.findUnique({
          where: { id: userId },
          select: { activeMembershipPackageId: true, membershipActivatedAt: true, country: true },
        }),
      ]);

      const membershipName = user?.activeMembershipPackageId
        ? (await prisma.membershipPackage.findUnique({ where: { id: user.activeMembershipPackageId }, select: { name: true } }))?.name ?? null
        : null;
      const membership = normalizeMembership(membershipName);
      const membershipActive = Boolean(user?.membershipActivatedAt && membershipName);

      // Qualified directs
      const allReferrals = await prisma.referral.findMany({ where: { referrerId: userId }, select: { referredId: true } });
      const referredIds = allReferrals.map((r: any) => r.referredId);
      let qualifiedDirects = 0;
      if (referredIds.length > 0) {
        const regularPkgIds = await prisma.membershipPackage.findMany({
          where: { name: { in: ["Regular", "Regular Plus", "Gold", "Gold Plus", "Platinum", "Platinum Plus"] } },
          select: { id: true },
        });
        const regularPkgIdSet = new Set(regularPkgIds.map((p: any) => p.id));
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
        membership,
        membershipActive,
        qualifiedDirects,
        cumulativeContributions,
        requestsContributed,
        hasAnyActivatedCountry,
        userCountryIsActivated,
        config,
      });

      if (!eligibilityFlags.eligible) {
        throw new Error("You do not meet the eligibility requirements for this category.");
      }

      // Enforce cooldown from last released request
      const latestReleased = await prisma.cspSupportRequest.findFirst({
        where: { userId, status: "released", cooldownEndsAt: { not: null } },
        orderBy: { releasedAt: "desc" },
        select: { cooldownEndsAt: true },
      });
      if (latestReleased?.cooldownEndsAt && latestReleased.cooldownEndsAt > new Date()) {
        throw new Error(`You are in a cooldown period. Your earliest next request date is ${latestReleased.cooldownEndsAt.toLocaleDateString()}.`);
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
        },
      });

      await notifyCspRequestSubmitted(userId, input.category, thresholdAmount);

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

      const config = await loadEligibilityConfig(prisma);
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
          cooldownMonths: input.cooldownMonths ?? null,
        },
      });

      await notifyCspRequestApproved(request.userId, request.category, request.thresholdAmount, broadcastExpiresAt);

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

    const requests = await prisma.cspSupportRequest.findMany({
      where: {
        OR: [
          { status: "broadcasting" },
          { isAdminDefault: true, isActive: true },
        ],
      },
      orderBy: [{ isAdminDefault: "desc" }, { createdAt: "desc" }],
      // No User include — all PII stripped at API layer for anonymity
    });

    return requests.map((req) => ({
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

      const config = await loadEligibilityConfig(prisma);

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
      const activeCooldown = await prisma.cspSupportRequest.findFirst({
        where: {
          userId: contributorId,
          status: "released",
          cooldownEndsAt: { gt: new Date() },
        },
        orderBy: { releasedAt: "desc" },
        select: { id: true, cooldownEndsAt: true, cooldownMonths: true },
      });

      if (activeCooldown) {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const MONTHLY_CAP = config.waitReductionMonthlyTarget; // ₦10,000

        // Upsert the log for this month
        const existing = await prisma.cspWaitReductionLog.findUnique({
          where: { userId_requestId_monthKey: { userId: contributorId, requestId: activeCooldown.id, monthKey } },
        });

        const prevAmount = existing?.amountContrib ?? 0;
        const newAmount = Math.min(prevAmount + input.amount, MONTHLY_CAP);

        const alreadyReduced = existing?.monthReduced ?? false;
        const justHitCap = !alreadyReduced && newAmount >= MONTHLY_CAP;

        await prisma.cspWaitReductionLog.upsert({
          where: { userId_requestId_monthKey: { userId: contributorId, requestId: activeCooldown.id, monthKey } },
          update: { amountContrib: newAmount, monthReduced: alreadyReduced || justHitCap, updatedAt: new Date() },
          create: {
            userId: contributorId,
            requestId: activeCooldown.id,
            monthKey,
            amountContrib: newAmount,
            monthReduced: justHitCap,
          },
        });

        // If threshold just hit, deduct 1 month from cooldownEndsAt
        if (justHitCap && activeCooldown.cooldownEndsAt) {
          const newCooldownEnd = new Date(activeCooldown.cooldownEndsAt);
          newCooldownEnd.setMonth(newCooldownEnd.getMonth() - 1);
          await prisma.cspSupportRequest.update({
            where: { id: activeCooldown.id },
            data: { cooldownEndsAt: newCooldownEnd },
          });
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

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: { select: { id: true, sponsorId: true, state: true } } },
      });

      if (!request) throw new Error("Support request not found");
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
      const shares = {
        recipient: Math.floor(total * pct.recipient),
        admin: Math.floor(total * pct.admin),
        sponsor: Math.floor(total * pct.sponsor),
        state: Math.floor(total * pct.state),
        management: Math.floor(total * pct.management),
        reserve: Math.floor(total * pct.reserve),
      };
      const allocated = shares.recipient + shares.admin + shares.sponsor + shares.state + shares.management + shares.reserve;
      const remainder = total - allocated;
      shares.recipient += remainder; // push rounding remainder to recipient

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
            description: `CSP payout for request ${request.id}`,
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

      return { success: true, released: total, shares };
    }),

  extendBroadcast: protectedProcedure
    .input(z.object({ requestId: z.string(), hours: z.number().int().positive().max(168), reason: z.enum(["paid", "referrals"]), value: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const updated = await prisma.$transaction(async (tx) => {
        const request = await tx.cspSupportRequest.findUnique({ where: { id: input.requestId } });
        if (!request) throw new Error("Request not found");
        if (request.status !== "broadcasting") throw new Error("Only broadcasting requests can be extended");

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
          status: input.isActive ? "broadcasting" : "closed",
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
      });

      if (!request) throw new Error("Request not found");
      if (!request.isAdminDefault) throw new Error("Only admin default requests can be marked complete");

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

      // Delete the request from database
      await prisma.cspSupportRequest.delete({
        where: { id: input.requestId },
      });

      // Send email and notification to user
      await notifyCspRequestRejected(
        request.userId,
        request.category,
        input.reason
      );

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

    const config = await loadEligibilityConfig(prisma);
    const now = new Date();

    const activeRequest = await prisma.cspSupportRequest.findFirst({
      where: { userId, status: "released", cooldownEndsAt: { not: null } },
      orderBy: { releasedAt: "desc" },
      select: { id: true, cooldownMonths: true, cooldownEndsAt: true, releasedAt: true },
    });

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
      activationThreshold: z.number().int().positive().optional(),
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
      minPerContribution:                z.number().int().positive().optional(),
      national_minMembership:            z.string().optional(),
      national_minDirects:               z.number().int().min(1).optional(),
      national_minCumulativeContrib:     z.number().int().positive().optional(),
      national_minDistinctRequests:      z.number().int().positive().optional(),
      national_broadcastHours:           z.number().int().positive().optional(),
      national_minThreshold:             z.number().int().positive().optional(),
      global_minMembership:              z.string().optional(),
      global_minDirects:                 z.number().int().min(1).optional(),
      global_minCumulativeContrib:       z.number().int().positive().optional(),
      global_minDistinctRequests:        z.number().int().positive().optional(),
      global_broadcastHours:             z.number().int().positive().optional(),
      global_minThreshold:               z.number().int().positive().optional(),
      waitReductionMonthlyTarget:        z.number().int().positive().optional(),
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
});

