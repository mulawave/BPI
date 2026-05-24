import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import { randomUUID } from "crypto";
import type { RevenueSource } from "@prisma/client";

const REVENUE_POOL_START_DATE = new Date("2026-05-01T00:00:00.000Z");
const REVENUE_SOURCE_CUTS_SETTING_KEY = "revenue_source_pool_cuts_v1";
const SOURCE_CUT_SYNC_SAFE_STATUSES = new Set(["PENDING", "ALLOCATED"]);

const SUPPORTED_REVENUE_SOURCES = [
  "COMMUNITY_SUPPORT",
  "MEMBERSHIP_REGISTRATION",
  "MEMBERSHIP_RENEWAL",
  "STORE_PURCHASE",
  "WITHDRAWAL_FEE",
  "YOUTUBE_SUBSCRIPTION",
  "THIRD_PARTY_SERVICES",
  "PALLIATIVE_PROGRAM",
  "LEADERSHIP_POOL_FEE",
  "TRAINING_CENTER",
  "ELITE_CLUB_OPS",
  "ELITE_CLUB_INVESTMENT_PROFIT",
  "OTHER",
] as const;

const REVENUE_SOURCE_LABELS: Record<string, string> = {
  COMMUNITY_SUPPORT: "Community Support",
  MEMBERSHIP_REGISTRATION: "Membership Registration",
  MEMBERSHIP_RENEWAL: "Membership Renewal",
  STORE_PURCHASE: "Store Purchase",
  WITHDRAWAL_FEE: "Withdrawal Fee",
  YOUTUBE_SUBSCRIPTION: "YouTube Subscription",
  THIRD_PARTY_SERVICES: "Third Party Services",
  PALLIATIVE_PROGRAM: "Palliative Program",
  LEADERSHIP_POOL_FEE: "Leadership Pool Fee",
  TRAINING_CENTER: "Training Center",
  ELITE_CLUB_OPS: "Elite Club Ops",
  ELITE_CLUB_INVESTMENT_PROFIT: "Elite Club Investment Profit",
  OTHER: "Other",
};

type SourceSplitConfig = {
  companyPercent: number;
  executivePercent: number;
  strategicPercent: number;
};

function normalizeSplit(input: SourceSplitConfig): SourceSplitConfig {
  const companyPercent = Number(input.companyPercent);
  const executivePercent = Number(input.executivePercent);
  const strategicPercent = Number(input.strategicPercent);
  return {
    companyPercent,
    executivePercent,
    strategicPercent,
  };
}

function isValidSplit(input: SourceSplitConfig) {
  return (
    Number.isFinite(input.companyPercent) &&
    Number.isFinite(input.executivePercent) &&
    Number.isFinite(input.strategicPercent) &&
    input.companyPercent >= 0 &&
    input.executivePercent >= 0 &&
    input.strategicPercent >= 0 &&
    input.companyPercent <= 100 &&
    input.executivePercent <= 100 &&
    input.strategicPercent <= 100 &&
    Math.abs(input.companyPercent + input.executivePercent + input.strategicPercent - 100) < 0.0001
  );
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function fromCents(cents: number) {
  return cents / 100;
}

function calculateSplitCents(totalAmount: number, split: SourceSplitConfig) {
  const totalCents = toCents(totalAmount);
  const companyCents = Math.floor((totalCents * split.companyPercent) / 100);
  const executiveCents = Math.floor((totalCents * split.executivePercent) / 100);
  const strategicCents = totalCents - companyCents - executiveCents;
  const basePoolCents = Math.floor(strategicCents / 5);
  const remainder = strategicCents - basePoolCents * 5;

  return {
    companyCents,
    executiveCents,
    strategicCents,
    strategicPoolCents: [
      basePoolCents + (remainder > 0 ? 1 : 0),
      basePoolCents + (remainder > 1 ? 1 : 0),
      basePoolCents + (remainder > 2 ? 1 : 0),
      basePoolCents + (remainder > 3 ? 1 : 0),
      basePoolCents + (remainder > 4 ? 1 : 0),
    ],
  };
}

async function getBaseProfitSplitSettings(prismaLike: any) {
  const activeVersion = await prismaLike.profitPoolConfigVersion.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });

  if (activeVersion) {
    return {
      companyPercent: Number(activeVersion.companyPercent ?? 50),
      executivePercent: Number(activeVersion.executivePercent ?? 30),
      strategicPercent: Number(activeVersion.strategicPercent ?? 20),
    };
  }

  const keys = [
    "revenue_split_company_percent",
    "revenue_split_executive_percent",
    "revenue_split_strategic_percent",
  ] as const;

  const settings = await prismaLike.adminSettings.findMany({
    where: { settingKey: { in: [...keys] } },
    select: { settingKey: true, settingValue: true },
  });

  const map = new Map(settings.map((row: any) => [row.settingKey, row.settingValue]));
  return {
    companyPercent: Number.parseFloat(String(map.get("revenue_split_company_percent") ?? "50")) || 50,
    executivePercent: Number.parseFloat(String(map.get("revenue_split_executive_percent") ?? "30")) || 30,
    strategicPercent: Number.parseFloat(String(map.get("revenue_split_strategic_percent") ?? "20")) || 20,
  };
}

async function getRevenueSourceCutSettings(prismaLike: any) {
  const baseSplit = normalizeSplit(await getBaseProfitSplitSettings(prismaLike));
  const row = await prismaLike.adminSettings.findUnique({
    where: { settingKey: REVENUE_SOURCE_CUTS_SETTING_KEY },
    select: { settingValue: true, updatedAt: true },
  });

  let overrides: Record<string, SourceSplitConfig> = {};
  if (row?.settingValue) {
    try {
      const parsed = JSON.parse(String(row.settingValue));
      const sourceRows = parsed?.sources && typeof parsed.sources === "object" ? parsed.sources : {};
      const next: Record<string, SourceSplitConfig> = {};
      for (const source of SUPPORTED_REVENUE_SOURCES) {
        const raw = (sourceRows as any)[source];
        if (!raw) continue;
        const split = normalizeSplit({
          companyPercent: Number(raw.companyPercent),
          executivePercent: Number(raw.executivePercent),
          strategicPercent: Number(raw.strategicPercent),
        });
        if (isValidSplit(split)) {
          next[source] = split;
        }
      }
      overrides = next;
    } catch {
      overrides = {};
    }
  }

  return {
    baseSplit,
    overrides,
    updatedAt: row?.updatedAt ?? null,
  };
}

function withRevenuePoolCutoff(startDate?: Date) {
  if (!startDate || startDate < REVENUE_POOL_START_DATE) {
    return REVENUE_POOL_START_DATE;
  }
  return startDate;
}

/**
 * Revenue Allocation Router
 * Handles all revenue tracking, allocation (50/30/20), and distribution
 */

// Helper to check if user is admin
function requireAdmin(session: any) {
  const userRole = (session?.user as any)?.role;
  if (userRole !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Admin access required" 
    });
  }
}

const revenueAnalyticsFiltersSchema = z
  .object({
    source: z
      .enum([
        "COMMUNITY_SUPPORT",
        "MEMBERSHIP_REGISTRATION",
        "MEMBERSHIP_RENEWAL",
        "STORE_PURCHASE",
        "WITHDRAWAL_FEE",
        "YOUTUBE_SUBSCRIPTION",
        "THIRD_PARTY_SERVICES",
        "PALLIATIVE_PROGRAM",
        "LEADERSHIP_POOL_FEE",
        "TRAINING_CENTER",
        "OTHER",
      ])
      .optional(),
    sourceKey: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    programType: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
    orderId: z.string().min(1).optional(),
    packageId: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    tokenSymbol: z.string().min(1).optional(),
  })
  .strict();

function buildRevenueTransactionFilter(filters?: z.infer<typeof revenueAnalyticsFiltersSchema>) {
  if (!filters) return {};

  const where: Record<string, unknown> = {};

  if (filters.source) where.source = filters.source;
  if (filters.sourceKey) where.sourceKey = filters.sourceKey;
  if (filters.userId) where.userId = filters.userId;
  if (filters.programType) where.programType = filters.programType;
  if (filters.productId) where.productId = filters.productId;
  if (filters.orderId) where.orderId = filters.orderId;
  if (filters.packageId) where.packageId = filters.packageId;
  if (filters.country) where.country = filters.country;
  if (filters.state) where.state = filters.state;
  if (filters.region) where.region = filters.region;
  if (filters.tokenSymbol) where.tokenSymbol = filters.tokenSymbol;

  return where;
}

export const revenueRouter = createTRPCRouter({
  /**
   * Get revenue split settings (Company/Executive/Strategic)
   */
  getProfitSplitSettings: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const activeVersion = await (ctx.prisma as any).profitPoolConfigVersion.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    if (activeVersion) {
      return {
        companyPercent: Number(activeVersion.companyPercent ?? 50),
        executivePercent: Number(activeVersion.executivePercent ?? 30),
        strategicPercent: Number(activeVersion.strategicPercent ?? 20),
        versionId: String(activeVersion.id),
        version: Number(activeVersion.version ?? 0),
      };
    }

    const keys = [
      "revenue_split_company_percent",
      "revenue_split_executive_percent",
      "revenue_split_strategic_percent",
    ] as const;

    const settings = await ctx.prisma.adminSettings.findMany({
      where: { settingKey: { in: [...keys] } },
      select: { settingKey: true, settingValue: true },
    });

    const map = new Map(
      settings.map((s: { settingKey: string; settingValue: string | null }) => [
        s.settingKey,
        s.settingValue,
      ])
    );

    const companyPercent = parseFloat(
      String(map.get("revenue_split_company_percent") ?? "50")
    );
    const executivePercent = parseFloat(
      String(map.get("revenue_split_executive_percent") ?? "30")
    );
    const strategicPercent = parseFloat(
      String(map.get("revenue_split_strategic_percent") ?? "20")
    );

    return {
      companyPercent: Number.isFinite(companyPercent) ? companyPercent : 50,
      executivePercent: Number.isFinite(executivePercent) ? executivePercent : 30,
      strategicPercent: Number.isFinite(strategicPercent) ? strategicPercent : 20,
      versionId: null,
      version: null,
    };
  }),

  /**
   * Update revenue split settings (must sum to 100)
   */
  updateProfitSplitSettings: protectedProcedure
    .input(
      z
        .object({
          companyPercent: z.number().min(0).max(100),
          executivePercent: z.number().min(0).max(100),
          strategicPercent: z.number().min(0).max(100),
        })
        .refine(
          (v) => Math.abs(v.companyPercent + v.executivePercent + v.strategicPercent - 100) < 0.0001,
          {
            message: "Percentages must sum to 100",
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const rows = [
        {
          settingKey: "revenue_split_company_percent",
          settingValue: String(input.companyPercent),
          description: "Revenue split: Company Reserve percent",
        },
        {
          settingKey: "revenue_split_executive_percent",
          settingValue: String(input.executivePercent),
          description: "Revenue split: Executive Pool percent",
        },
        {
          settingKey: "revenue_split_strategic_percent",
          settingValue: String(input.strategicPercent),
          description: "Revenue split: Strategic Pools total percent",
        },
      ];

      const created = await ctx.prisma.$transaction(async (tx) => {
        await Promise.all(
          rows.map((r) =>
            tx.adminSettings.upsert({
              where: { settingKey: r.settingKey },
              update: {
                settingValue: r.settingValue,
                description: r.description,
                updatedAt: new Date(),
              },
              create: {
                id: randomUUID(),
                settingKey: r.settingKey,
                settingValue: r.settingValue,
                description: r.description,
                updatedAt: new Date(),
              },
            })
          )
        );

        const maxVersion = await (tx as any).profitPoolConfigVersion.aggregate({
          _max: { version: true },
        });
        const nextVersion = Number(maxVersion?._max?.version ?? 0) + 1;

        await (tx as any).profitPoolConfigVersion.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        return (tx as any).profitPoolConfigVersion.create({
          data: {
            version: nextVersion,
            isActive: true,
            companyPercent: input.companyPercent,
            executivePercent: input.executivePercent,
            strategicPercent: input.strategicPercent,
          },
        });
      });

      return { success: true, versionId: String(created.id), version: Number(created.version ?? 0) };
    }),

  /**
   * Get approved source-specific allocation cuts and effective values.
   */
  getSourceCutSettings: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const { baseSplit, overrides, updatedAt } = await getRevenueSourceCutSettings(ctx.prisma as any);

    return {
      baseSplit,
      updatedAt,
      sources: SUPPORTED_REVENUE_SOURCES.map((source) => ({
        source,
        label: REVENUE_SOURCE_LABELS[source] ?? source,
        approvedSplit: overrides[source] ?? baseSplit,
        usesOverride: Boolean(overrides[source]),
      })),
    };
  }),

  /**
   * Set approved source-specific allocation cuts. Every source must sum to 100.
   */
  updateSourceCutSettings: protectedProcedure
    .input(
      z.object({
        sources: z.array(
          z.object({
            source: z.string(),
            companyPercent: z.number().min(0).max(100),
            executivePercent: z.number().min(0).max(100),
            strategicPercent: z.number().min(0).max(100),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const normalized: Record<string, SourceSplitConfig> = {};
      for (const row of input.sources) {
        if (!SUPPORTED_REVENUE_SOURCES.includes(row.source as any)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unsupported revenue source: ${row.source}`,
          });
        }
        const split = normalizeSplit({
          companyPercent: row.companyPercent,
          executivePercent: row.executivePercent,
          strategicPercent: row.strategicPercent,
        });
        if (!isValidSplit(split)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid split for ${row.source}. Values must be 0-100 and sum to 100.`,
          });
        }
        normalized[row.source] = split;
      }

      const payload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        updatedBy: (ctx.session?.user as any)?.id ?? null,
        sources: normalized,
      };

      await ctx.prisma.adminSettings.upsert({
        where: { settingKey: REVENUE_SOURCE_CUTS_SETTING_KEY },
        update: {
          settingValue: JSON.stringify(payload),
          description: "Approved per-source allocation cuts for company/executive/strategic pools",
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          settingKey: REVENUE_SOURCE_CUTS_SETTING_KEY,
          settingValue: JSON.stringify(payload),
          description: "Approved per-source allocation cuts for company/executive/strategic pools",
          updatedAt: new Date(),
        },
      });

      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "SOURCE_CUT_SETTINGS_UPDATED",
          description: `Updated approved source allocation cuts for ${Object.keys(normalized).length} sources`,
          metadata: JSON.parse(JSON.stringify({ sourceCount: Object.keys(normalized).length })),
        },
      });

      return { success: true, sourceCount: Object.keys(normalized).length };
    }),

  /**
   * Audit how each revenue source is actually allocated vs approved cuts.
   */
  getSourceAllocationAudit: protectedProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(365).default(30),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dynamicStart = new Date();
      dynamicStart.setDate(dynamicStart.getDate() - (input?.days ?? 30));
      const dateFrom = withRevenuePoolCutoff(input?.dateFrom ?? dynamicStart);
      const dateTo = input?.dateTo ?? new Date();

      const { baseSplit, overrides } = await getRevenueSourceCutSettings(ctx.prisma as any);

      const [transactions, allocations] = await Promise.all([
        ctx.prisma.revenueTransaction.findMany({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
          },
          select: {
            id: true,
            source: true,
            amount: true,
            allocationStatus: true,
          },
        }),
        ctx.prisma.revenueAllocation.findMany({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
          },
          include: {
            RevenueTransaction: {
              select: { source: true },
            },
          },
        }),
      ]);

      const rows = new Map<string, {
        source: string;
        label: string;
        txCount: number;
        grossRevenue: number;
        companyActual: number;
        executiveActual: number;
        strategicActual: number;
      }>();

      for (const source of SUPPORTED_REVENUE_SOURCES) {
        rows.set(source, {
          source,
          label: REVENUE_SOURCE_LABELS[source] ?? source,
          txCount: 0,
          grossRevenue: 0,
          companyActual: 0,
          executiveActual: 0,
          strategicActual: 0,
        });
      }

      for (const tx of transactions as any[]) {
        const source = String(tx.source);
        if (!rows.has(source)) continue;
        const row = rows.get(source)!;
        row.txCount += 1;
        row.grossRevenue += Number(tx.amount || 0);
      }

      for (const alloc of allocations as any[]) {
        const source = String(alloc.RevenueTransaction?.source || "OTHER");
        if (!rows.has(source)) continue;
        const row = rows.get(source)!;
        const amount = Number(alloc.amount || 0);
        if (alloc.destinationType === "COMPANY_RESERVE") row.companyActual += amount;
        else if (alloc.destinationType === "EXECUTIVE_POOL") row.executiveActual += amount;
        else if (alloc.destinationType === "STRATEGIC_POOL" || alloc.destinationType === "STRATEGY_POOL") row.strategicActual += amount;
      }

      const auditRows = Array.from(rows.values()).map((row) => {
        const approvedSplit = overrides[row.source] ?? baseSplit;
        const expected = {
          company: (row.grossRevenue * approvedSplit.companyPercent) / 100,
          executive: (row.grossRevenue * approvedSplit.executivePercent) / 100,
          strategic: (row.grossRevenue * approvedSplit.strategicPercent) / 100,
        };
        const variance = {
          company: row.companyActual - expected.company,
          executive: row.executiveActual - expected.executive,
          strategic: row.strategicActual - expected.strategic,
        };
        const aligns = Math.abs(variance.company) < 0.01 && Math.abs(variance.executive) < 0.01 && Math.abs(variance.strategic) < 0.01;

        return {
          ...row,
          approvedSplit,
          expected,
          variance,
          aligns,
        };
      });

      return {
        period: { dateFrom, dateTo },
        baseSplit,
        rows: auditRows,
        summary: {
          totalGrossRevenue: auditRows.reduce((sum, row) => sum + row.grossRevenue, 0),
          totalCompanyActual: auditRows.reduce((sum, row) => sum + row.companyActual, 0),
          totalExecutiveActual: auditRows.reduce((sum, row) => sum + row.executiveActual, 0),
          totalStrategicActual: auditRows.reduce((sum, row) => sum + row.strategicActual, 0),
          alignedSources: auditRows.filter((row) => row.aligns).length,
          nonAlignedSources: auditRows.filter((row) => !row.aligns).length,
        },
      };
    }),

  /**
   * Recalculate and persist allocations using approved source cuts.
   */
  syncSourceAllocationRecords: protectedProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        source: z.string().optional(),
        dryRun: z.boolean().default(false),
        limit: z.number().min(1).max(5000).default(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dynamicStart = new Date();
      dynamicStart.setDate(dynamicStart.getDate() - 30);
      const dateFrom = withRevenuePoolCutoff(input.dateFrom ?? dynamicStart);
      const dateTo = input.dateTo ?? new Date();

      const { baseSplit, overrides } = await getRevenueSourceCutSettings(ctx.prisma as any);
      const pools = await ctx.prisma.strategyPool.findMany({
        where: { type: { in: ["LEADERSHIP", "STATE", "DIRECTORS", "TECHNOLOGY", "INVESTORS"] } },
        select: { id: true, type: true },
      });
      const poolTypeOrder = ["LEADERSHIP", "STATE", "DIRECTORS", "TECHNOLOGY", "INVESTORS"] as const;
      const orderedPools = poolTypeOrder
        .map((type) => pools.find((p: any) => p.type === type))
        .filter(Boolean) as Array<{ id: string; type: string }>;

      if (orderedPools.length !== 5) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "All 5 strategic pools must exist before running source allocation sync.",
        });
      }

      const reserve = await ctx.prisma.companyReserve.findFirst({ orderBy: { updatedAt: "desc" } });
      const reserveId = reserve?.id ?? "company-reserve";
      if (!reserve) {
        await ctx.prisma.companyReserve.create({
          data: { id: reserveId, balance: 0, totalReceived: 0, totalSpent: 0 },
        });
      }

      const transactions = await ctx.prisma.revenueTransaction.findMany({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          ...(input.source ? { source: input.source as RevenueSource } : {}),
          allocationStatus: { in: ["PENDING", "ALLOCATED", "DISTRIBUTED", "COMPLETED"] },
        },
        include: {
          Allocations: {
            include: {
              ExecutiveDistributions: true,
              PoolDistributions: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: input.limit,
      });

      let scanned = 0;
      let updated = 0;
      let skippedAligned = 0;
      let skippedLocked = 0;
      let skippedInvalid = 0;
      const deltas = {
        company: 0,
        executive: 0,
        strategic: 0,
      };

      for (const tx of transactions as any[]) {
        scanned += 1;
        const source = String(tx.source);
        const approvedSplit = overrides[source] ?? baseSplit;
        const allocations = Array.isArray(tx.Allocations) ? tx.Allocations : [];

        if (!SOURCE_CUT_SYNC_SAFE_STATUSES.has(String(tx.allocationStatus))) {
          skippedLocked += 1;
          continue;
        }

        const hasLockedDistribution = allocations.some((alloc: any) => {
          const hasExec = (alloc.ExecutiveDistributions || []).some((d: any) => d.status === "COMPLETED");
          const hasPool = (alloc.PoolDistributions || []).some((d: any) => d.status === "COMPLETED");
          return hasExec || hasPool || alloc.status === "DISTRIBUTED" || alloc.status === "COMPLETED";
        });

        if (hasLockedDistribution) {
          skippedLocked += 1;
          continue;
        }

        const companyAlloc = allocations.find((a: any) => a.destinationType === "COMPANY_RESERVE");
        const executiveAlloc = allocations.find((a: any) => a.destinationType === "EXECUTIVE_POOL");
        const strategicAllocs = allocations
          .filter((a: any) => a.destinationType === "STRATEGY_POOL" || a.destinationType === "STRATEGIC_POOL")
          .sort((a: any, b: any) => String(a.destinationId || "").localeCompare(String(b.destinationId || "")));

        if (!companyAlloc || !executiveAlloc || strategicAllocs.length !== 5) {
          skippedInvalid += 1;
          continue;
        }

        const splitCents = calculateSplitCents(Number(tx.amount || 0), approvedSplit);
        const companyNew = fromCents(splitCents.companyCents);
        const executiveNew = fromCents(splitCents.executiveCents);

        const poolNewById = new Map<string, number>();
        orderedPools.forEach((pool, idx) => {
          poolNewById.set(pool.id, fromCents(splitCents.strategicPoolCents[idx] || 0));
        });

        const companyOld = Number(companyAlloc.amount || 0);
        const executiveOld = Number(executiveAlloc.amount || 0);
        const poolOldById = new Map<string, number>();
        strategicAllocs.forEach((alloc: any) => {
          poolOldById.set(String(alloc.destinationId), Number(alloc.amount || 0));
        });

        const poolDeltaTotal = orderedPools.reduce((sum, p) => {
          const nextAmount = poolNewById.get(p.id) || 0;
          const prevAmount = poolOldById.get(p.id) || 0;
          return sum + (nextAmount - prevAmount);
        }, 0);

        const companyDelta = companyNew - companyOld;
        const executiveDelta = executiveNew - executiveOld;

        const isAligned =
          Math.abs(companyDelta) < 0.01 &&
          Math.abs(executiveDelta) < 0.01 &&
          Math.abs(poolDeltaTotal) < 0.01;

        if (isAligned) {
          skippedAligned += 1;
          continue;
        }

        if (!input.dryRun) {
          await ctx.prisma.$transaction(async (txDb: any) => {
            await txDb.revenueAllocation.update({
              where: { id: companyAlloc.id },
              data: {
                amount: companyNew,
                percentage: approvedSplit.companyPercent,
              },
            });

            await txDb.revenueAllocation.update({
              where: { id: executiveAlloc.id },
              data: {
                amount: executiveNew,
                percentage: approvedSplit.executivePercent,
              },
            });

            for (const alloc of strategicAllocs) {
              const destinationId = String(alloc.destinationId);
              await txDb.revenueAllocation.update({
                where: { id: alloc.id },
                data: {
                  amount: poolNewById.get(destinationId) || 0,
                  percentage: approvedSplit.strategicPercent / 5,
                },
              });
            }

            if (Math.abs(companyDelta) >= 0.01) {
              await txDb.companyReserve.update({
                where: { id: reserveId },
                data: {
                  balance: { increment: companyDelta },
                  totalReceived: { increment: companyDelta },
                },
              });
            }

            for (const pool of orderedPools) {
              const delta = (poolNewById.get(pool.id) || 0) - (poolOldById.get(pool.id) || 0);
              if (Math.abs(delta) < 0.01) continue;
              await txDb.strategyPool.update({
                where: { id: pool.id },
                data: { balance: { increment: delta } },
              });
            }
          });
        }

        updated += 1;
        deltas.company += companyDelta;
        deltas.executive += executiveDelta;
        deltas.strategic += poolDeltaTotal;
      }

      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: input.dryRun ? "SOURCE_CUT_SYNC_DRY_RUN" : "SOURCE_CUT_SYNC_EXECUTED",
          description: `${input.dryRun ? "Dry run" : "Executed"} source cut sync on ${scanned} transactions`,
          metadata: JSON.parse(
            JSON.stringify({
              period: { dateFrom, dateTo },
              input,
              result: { scanned, updated, skippedAligned, skippedLocked, skippedInvalid, deltas },
            }),
          ),
        },
      });

      return {
        success: true,
        dryRun: input.dryRun,
        scanned,
        updated,
        skippedAligned,
        skippedLocked,
        skippedInvalid,
        deltas,
      };
    }),

  /**
   * Record a revenue transaction and allocate it
   * Called by various revenue sources (payments, CSP, store, etc.)
   */
  recordRevenue: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "COMMUNITY_SUPPORT",
          "MEMBERSHIP_REGISTRATION",
          "MEMBERSHIP_RENEWAL",
          "STORE_PURCHASE",
          "WITHDRAWAL_FEE",
          "YOUTUBE_SUBSCRIPTION",
          "THIRD_PARTY_SERVICES",
          "PALLIATIVE_PROGRAM",
          "LEADERSHIP_POOL_FEE",
          "TRAINING_CENTER",
          "OTHER",
        ]),
        amount: z.number().positive(),
        currency: z.enum(["NGN", "USD"]).default("NGN"),
        sourceId: z.string().optional(), // Reference to source transaction
        description: z.string().optional(),
        sourceKey: z.string().optional(),
        userId: z.string().optional(),
        programType: z.string().optional(),
        productId: z.string().optional(),
        orderId: z.string().optional(),
        packageId: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
        region: z.string().optional(),
        tokenSymbol: z.string().optional(),
        metadata: z.unknown().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use the centralized service instead
      const { recordRevenue } = await import("../../services/revenue.service");

      const normalizedMetadata =
        input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
          ? (input.metadata as Record<string, unknown>)
          : undefined;
      
      const revenueTransaction = await recordRevenue(ctx.prisma, {
        source: input.source,
        amount: input.amount,
        currency: input.currency,
        sourceId: input.sourceId,
        description: input.description,
        sourceKey: input.sourceKey,
        userId: input.userId,
        programType: input.programType,
        productId: input.productId,
        orderId: input.orderId,
        packageId: input.packageId,
        country: input.country,
        state: input.state,
        region: input.region,
        tokenSymbol: input.tokenSymbol,
        metadata: normalizedMetadata,
      });

      return {
        success: true,
        transactionId: revenueTransaction.id,
        amount: Number(revenueTransaction.amount),
      };
    }),

  /**
   * Get executive shareholders with their assignments
   */
  getExecutiveShareholders: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    return ctx.prisma.executiveShareholder.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { percentage: "desc" },
    });
  }),

  /**
   * Create a new executive position (dynamic role)
   */
  createExecutivePosition: protectedProcedure
    .input(
      z.object({
        role: z.string().min(2).max(50),
        percentage: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const roleKey = normalizeRoleName(input.role);
      const normalizedRole = roleKey;

      const existingRole = await ctx.prisma.executiveShareholder.findUnique({
        where: { role: roleKey },
      });

      if (existingRole) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Role ${normalizedRole} already exists.`,
        });
      }

      // Admin override: allow creating roles even if totals temporarily exceed 100%.

      const shareholder = await ctx.prisma.executiveShareholder.create({
        data: {
          role: roleKey,
          percentage: input.percentage,
          userId: null,
        },
      });

      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "CREATE_EXECUTIVE",
          description: `Created executive position ${normalizedRole} at ${input.percentage}%`,
          metadata: {
            role: normalizedRole,
            percentage: input.percentage,
          },
        },
      });

      return shareholder;
    }),

  /**
   * Assign user to executive role
   */
  assignExecutiveRole: protectedProcedure
    .input(
      z
        .object({
          shareholderId: z.string().optional(),
          role: z.string().optional(),
          userId: z.string(),
        })
        .refine((data) => data.shareholderId || data.role, {
          message: "Provide role or shareholderId",
        })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const roleKey = input.role ? normalizeRoleName(input.role) : undefined;

      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: input.shareholderId
          ? { id: input.shareholderId }
          : { role: roleKey },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (!shareholder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Executive position not found. Create it first.",
        });
      }

      if (shareholder.userId && shareholder.userId !== input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${shareholder.role} is already assigned to another user`,
        });
      }

      const updatedShareholder = await ctx.prisma.executiveShareholder.update({
        where: { id: shareholder.id },
        data: { userId: input.userId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "ASSIGN_EXECUTIVE",
          description: `Assigned ${shareholder.role} to user ${updatedShareholder.User?.name || updatedShareholder.User?.email || input.userId}`,
          metadata: {
            role: shareholder.role,
            userId: input.userId,
          },
        },
      });

      return updatedShareholder;
    }),

  /**
   * Remove user from executive role
   */
  removeExecutiveRole: protectedProcedure
    .input(
      z
        .object({
          shareholderId: z.string().optional(),
          role: z.string().optional(),
        })
        .refine((data) => data.shareholderId || data.role, {
          message: "Provide role or shareholderId",
        })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const roleKey = input.role ? normalizeRoleName(input.role) : undefined;

      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: input.shareholderId ? { id: input.shareholderId } : { role: roleKey },
      });

      if (!shareholder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Executive position not found" });
      }

      await ctx.prisma.executiveShareholder.update({
        where: { id: shareholder.id },
        data: { userId: null },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "REMOVE_EXECUTIVE",
          description: `Removed ${shareholder.role}`,
          metadata: { role: shareholder.role, shareholderId: shareholder.id },
        },
      });

      return { success: true };
    }),

  /**
   * Delete executive position entirely
   */
  deleteExecutivePosition: protectedProcedure
    .input(
      z.object({
        shareholderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: { id: input.shareholderId },
      });

      if (!shareholder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Executive position not found" });
      }

      // Can't delete if user is currently assigned
      if (shareholder.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete position with assigned user. Clear user first.",
        });
      }

      // Can't delete if position has balance
      if (Number(shareholder.currentBalance || 0) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete position with outstanding balance. Withdraw funds first.",
        });
      }

      // Delete the position
      await ctx.prisma.executiveShareholder.delete({
        where: { id: input.shareholderId },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "DELETE_EXECUTIVE_POSITION",
          description: `Deleted executive position: ${shareholder.role}`,
          metadata: { role: shareholder.role, shareholderId: shareholder.id },
        },
      });

      return { success: true };
    }),

  /**
   * Get all strategic pools with members
   */
  getStrategicPools: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const { limit = 10, offset = 0 } = input || {};

      return ctx.prisma.strategyPool.findMany({
        include: {
          Members: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                },
              },
            },
            take: limit,
            skip: offset,
          },
        },
      });
    }),

  /**
   * Add member to strategic pool
   */
  addPoolMember: protectedProcedure
    .input(
      z.object({
        poolType: z.enum([
          "LEADERSHIP",
          "STATE",
          "DIRECTORS",
          "TECHNOLOGY",
          "INVESTORS",
        ]),
        userId: z.string(),
        eligibilityCriteria: z.string().optional(),
        qualificationNote: z.string().optional(),
        qualificationStatus: z.string().optional(),
        customPercentage: z.number().min(0).max(100).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Check if user is already in this pool
      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: {
          Members: { where: { isActive: true } },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      const alreadyMember = (pool.Members as any[]).some(
        (m) => m.userId === input.userId
      );
      if (alreadyMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this pool",
        });
      }

      // Enforce max member cap (configurable per pool; defaults: LEADERSHIP=1000, others=unlimited)
      const maxMembers = (pool as any).maxMembers;
      if (maxMembers != null && (pool.Members as any[]).length >= maxMembers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.poolType} pool is at the maximum capacity of ${maxMembers} members`,
        });
      }

      // Add member
      const member = await ctx.prisma.poolMember.create({
        data: {
          poolId: pool.id,
          userId: input.userId,
          addedBy: ctx.session!.user.id,
          ...(input.eligibilityCriteria ? { eligibilityCriteria: input.eligibilityCriteria } : {}),
          ...(input.qualificationNote ? { qualificationNote: input.qualificationNote } : {}),
          ...(input.qualificationStatus ? { qualificationStatus: input.qualificationStatus } : {}),
          ...(input.customPercentage != null ? { customPercentage: input.customPercentage } : {}),
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "MEMBER_ADDED",
          description: `Added user ${input.userId} to ${input.poolType} pool`,
          metadata: {
            poolType: input.poolType,
            userId: input.userId,
          },
        },
      });

      return member;
    }),

  /**
   * Remove member from strategic pool
   */
  removePoolMember: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const member = await ctx.prisma.poolMember.findUnique({
        where: { id: input.memberId },
        include: { Pool: true },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Soft delete (mark as inactive)
      await ctx.prisma.poolMember.update({
        where: { id: input.memberId },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: member.Pool.id,
          adminId: ctx.session!.user.id,
          actionType: "MEMBER_REMOVED",
          description: `Removed user ${member.userId} from ${member.Pool.type} pool`,
          metadata: {
            poolType: member.Pool.type,
            userId: member.userId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Update pool configuration (frequency, max members, percentage, description)
   */
  updatePoolConfig: protectedProcedure    .input(
      z.object({
        poolType: z.enum(["LEADERSHIP", "STATE", "DIRECTORS", "TECHNOLOGY", "INVESTORS"]),
        distributionFrequency: z.enum(["MANUAL", "MONTHLY", "QUARTERLY", "BI_ANNUAL", "ANNUAL"]).optional(),
        maxMembers: z.number().int().min(1).nullable().optional(),
        percentage: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const { poolType, ...rest } = input;
      const data: Record<string, unknown> = {};
      if (rest.distributionFrequency !== undefined) data.distributionFrequency = rest.distributionFrequency;
      if (rest.maxMembers !== undefined) data.maxMembers = rest.maxMembers;
      if (rest.percentage !== undefined) data.percentage = rest.percentage;
      if (rest.description !== undefined) data.description = rest.description;
      const pool = await ctx.prisma.strategyPool.update({
        where: { type: poolType },
        data,
      });
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "CONFIG_UPDATED",
          description: `Updated config for ${poolType} pool`,
          metadata: JSON.parse(JSON.stringify({ changes: data })),
        },
      });
      return pool;
    }),

  /**
   * Update an existing pool member's eligibility / qualification fields
   */
  updatePoolMember: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        eligibilityCriteria: z.string().nullable().optional(),
        qualificationNote: z.string().nullable().optional(),
        qualificationStatus: z.string().nullable().optional(),
        customPercentage: z.number().min(0).max(100).nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const { memberId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.eligibilityCriteria !== undefined) data.eligibilityCriteria = fields.eligibilityCriteria;
      if (fields.qualificationNote !== undefined) data.qualificationNote = fields.qualificationNote;
      if (fields.qualificationStatus !== undefined) data.qualificationStatus = fields.qualificationStatus;
      if (fields.customPercentage !== undefined) data.customPercentage = fields.customPercentage;
      if (fields.isActive !== undefined) {
        data.isActive = fields.isActive;
        if (!fields.isActive) data.leftAt = new Date();
      }
      const member = await ctx.prisma.poolMember.update({ where: { id: memberId }, data });
      return member;
    }),

  // ─── Technology Pool: Project Budget Tracking ────────────────────────────────

  /**
   * Create a new Technology Pool project proposal
   */
  createTechProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        description: z.string().optional(),
        category: z.enum(["PRODUCT_DEV", "INFRASTRUCTURE", "SECURITY", "R_AND_D", "TOOLING", "OTHER"]).optional(),
        approvedBudget: z.number().positive(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        milestones: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const techPool = await ctx.prisma.strategyPool.findUnique({ where: { type: "TECHNOLOGY" } });
      if (!techPool) throw new TRPCError({ code: "NOT_FOUND", message: "Technology pool not found" });
      const project = await (ctx.prisma as any).techPoolProject.create({
        data: {
          poolId: techPool.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? "OTHER",
          approvedBudget: input.approvedBudget,
          status: "PROPOSED",
          proposedBy: ctx.session!.user.id,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          milestones: input.milestones ? JSON.stringify(input.milestones) : null,
        },
      });
      return project;
    }),

  /**
   * Approve or reject a Technology Pool project
   */
  approveTechProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        action: z.enum(["APPROVE", "REJECT", "ON_HOLD"]),
        roiNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const statusMap: Record<string, string> = { APPROVE: "APPROVED", REJECT: "REJECTED", ON_HOLD: "ON_HOLD" };
      const project = await (ctx.prisma as any).techPoolProject.update({
        where: { id: input.projectId },
        data: {
          status: statusMap[input.action],
          approvedBy: input.action === "APPROVE" ? ctx.session!.user.id : undefined,
          approvedAt: input.action === "APPROVE" ? new Date() : undefined,
          ...(input.roiNotes ? { roiNotes: input.roiNotes } : {}),
        },
      });
      return project;
    }),

  /**
   * Record spend against an approved Technology Pool project
   */
  recordTechSpend: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        amount: z.number().positive(),
        description: z.string().min(5),
        receipt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const project = await (ctx.prisma as any).techPoolProject.findUnique({ where: { id: input.projectId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      if (project.status !== "APPROVED" && project.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be APPROVED before recording spend" });
      }
      const remaining = Number(project.approvedBudget) - Number(project.totalSpent);
      if (input.amount > remaining) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Spend exceeds remaining budget (₦${remaining.toLocaleString()})` });
      }
      const [spend] = await ctx.prisma.$transaction([
        (ctx.prisma as any).techPoolSpend.create({
          data: {
            projectId: input.projectId,
            amount: input.amount,
            description: input.description,
            receipt: input.receipt ?? null,
            spentBy: ctx.session!.user.id,
          },
        }),
        (ctx.prisma as any).techPoolProject.update({
          where: { id: input.projectId },
          data: {
            totalSpent: { increment: input.amount },
            status: "IN_PROGRESS",
          },
        }),
      ]);
      return spend;
    }),

  /**
   * List Technology Pool projects
   */
  listTechProjects: protectedProcedure
    .input(z.object({
      status: z.enum(["PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "ON_HOLD"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const projects = await (ctx.prisma as any).techPoolProject.findMany({
        where: input?.status ? { status: input.status } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          Spends: { orderBy: { createdAt: "desc" } },
          ProposedBy: { select: { id: true, name: true, email: true } },
          ApprovedBy: { select: { id: true, name: true, email: true } },
        },
      });
      return projects;
    }),

  /**
   * Update Tech Pool project ROI notes / milestones / status to COMPLETED
   */
  updateTechProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        roiNotes: z.string().optional(),
        milestones: z.array(z.string()).optional(),
        status: z.enum(["PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "ON_HOLD"]).optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const data: Record<string, unknown> = {};
      if (input.roiNotes !== undefined) data.roiNotes = input.roiNotes;
      if (input.milestones !== undefined) data.milestones = JSON.stringify(input.milestones);
      if (input.status !== undefined) data.status = input.status;
      if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
      return (ctx.prisma as any).techPoolProject.update({ where: { id: input.projectId }, data });
    }),

  /**
   * Distribute strategic pool to members
   */
  distributePool: protectedProcedure
    .input(
      z.object({
        poolType: z.enum([
          "LEADERSHIP",
          "STATE",
          "DIRECTORS",
          "TECHNOLOGY",
          "INVESTORS",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: {
          Members: {
            where: { isActive: true },
            include: {
              User: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      if (pool.Members.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot distribute to pool with no members",
        });
      }

      // --- DIRECTORS POOL: validate no suspended members before distribution ---
      if (input.poolType === "DIRECTORS") {
        const suspended = pool.Members.filter((m: any) => m.qualificationStatus === "SUSPENDED");
        if (suspended.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot distribute: ${suspended.length} director(s) have SUSPENDED status (${suspended.map((m: any) => m.User?.name || m.userId).join(", ")}) — review eligibility before distributing`,
          });
        }
      }

      // --- INVESTORS POOL: filter to non-suspended members only ---
      let eligibleMembers = pool.Members;
      if (input.poolType === "INVESTORS") {
        eligibleMembers = pool.Members.filter((m: any) => m.qualificationStatus !== "SUSPENDED");
        if (eligibleMembers.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No eligible investors — all members have SUSPENDED status",
          });
        }
      }

      // --- STATE / DIRECTORS POOL: capture beneficiary snapshot for audit ---
      const beneficiarySnapshot = (input.poolType === "STATE" || input.poolType === "DIRECTORS")
        ? pool.Members.map((m: any) => ({
            userId: m.userId,
            name: m.User?.name || "Unknown",
            email: m.User?.email || "Unknown",
            qualificationStatus: m.qualificationStatus ?? "ACTIVE",
            customPercentage: m.customPercentage != null ? Number(m.customPercentage) : null,
          }))
        : undefined;

      // Get pending allocations for this pool
      const pendingAllocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          destinationId: pool.id,
          destinationType: { in: ["STRATEGY_POOL", "STRATEGIC_POOL"] },
          status: "PENDING",
          createdAt: { gte: REVENUE_POOL_START_DATE },
        },
      });

      const totalAmount = pendingAllocations.reduce(
        (sum: number, alloc: any) => sum + Number(alloc.amount),
        0
      );

      if (totalAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No funds available to distribute",
        });
      }

      // Calculate distribution based on custom percentages or equal split
      // (eligibleMembers already excludes SUSPENDED investors/etc.)
      const hasCustomPercentages = eligibleMembers.some((m: any) => m.customPercentage != null);
      
      let memberShares: { userId: string; amount: number; percentage: number }[] = [];
      
      if (hasCustomPercentages) {
        // Use custom percentages
        const totalCustomPercentage = eligibleMembers.reduce(
          (sum: number, m: any) => sum + (Number(m.customPercentage) || 0),
          0
        );
        
        if (Math.abs(totalCustomPercentage - 100) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Custom percentages must sum to 100% (current: ${totalCustomPercentage}%)`,
          });
        }
        
        memberShares = eligibleMembers.map((m: any) => ({
          userId: m.userId,
          amount: (totalAmount * Number(m.customPercentage)) / 100,
          percentage: Number(m.customPercentage),
        }));
      } else {
        // Equal split
        const sharePerMember = totalAmount / eligibleMembers.length;
        const percentagePerMember = 100 / eligibleMembers.length;
        
        memberShares = eligibleMembers.map((m: any) => ({
          userId: m.userId,
          amount: sharePerMember,
          percentage: percentagePerMember,
        }));
      }

      // Use transaction for atomicity
      const result = await ctx.prisma.$transaction(async (tx: any) => {
        const distributions = [];

        // Create pool distributions for each allocation
        for (const allocation of pendingAllocations) {
          const poolDist = await tx.poolDistribution.create({
            data: {
              allocationId: allocation.id,
              poolId: pool.id,
              totalAmount: Number(allocation.amount),
              memberCount: eligibleMembers.length,
              amountPerMember: totalAmount / eligibleMembers.length,
              status: "COMPLETED",
              distributedAt: new Date(),
              distributedBy: ctx.session!.user.id,
            },
          });
          distributions.push(poolDist);
        }

        // Distribute to each member's shareholder wallet based on shares
        for (const share of memberShares) {
          // Credit user's main shareholder wallet
          await tx.user.update({
            where: { id: share.userId },
            data: {
              shareholder: {
                increment: share.amount,
              },
            },
          });

          // Credit pool member wallet balances
          await tx.poolMember.updateMany({
            where: {
              poolId: pool.id,
              userId: share.userId,
              isActive: true,
            },
            data: {
              totalEarned: {
                increment: share.amount,
              },
              currentBalance: {
                increment: share.amount,
              },
              lastDistributionAt: new Date(),
            },
          });
        }

        // Mark allocations as distributed
        await tx.revenueAllocation.updateMany({
          where: {
            id: { in: pendingAllocations.map((a: any) => a.id) },
          },
          data: {
            status: "DISTRIBUTED",
            distributedAt: new Date(),
          },
        });

        // Update pool balance and distribution tracking
        const now = new Date();
        const freq = (pool as any).distributionFrequency ?? "MANUAL";
        let nextDistributionAt: Date | null = null;
        if (freq === "MONTHLY") {
          nextDistributionAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else if (freq === "QUARTERLY") {
          nextDistributionAt = new Date(now.getFullYear(), now.getMonth() + 3, 1);
        } else if (freq === "BI_ANNUAL") {
          nextDistributionAt = new Date(now.getFullYear(), now.getMonth() + 6, 1);
        } else if (freq === "ANNUAL") {
          nextDistributionAt = new Date(now.getFullYear() + 1, 0, 1);
        }
        await tx.strategyPool.update({
          where: { id: pool.id },
          data: {
            balance: { decrement: totalAmount },
            lastDistributedAt: now,
            ...(nextDistributionAt ? { nextDistributionAt } : {}),
          },
        });

        const averageSharePerMember = totalAmount / memberShares.length;
        return { distributions, totalAmount, sharePerMember: averageSharePerMember, memberCount: memberShares.length };
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "POOL_DISTRIBUTED",
          description: `Distributed ₦${result.totalAmount.toLocaleString()} to ${result.memberCount} members`,
          metadata: JSON.parse(JSON.stringify({
            poolType: input.poolType,
            totalAmount: result.totalAmount,
            memberCount: result.memberCount,
            sharePerMember: result.sharePerMember,
            memberShares: memberShares.map((share) => {
              const member = eligibleMembers.find((m: any) => m.userId === share.userId);
              return {
                userId: share.userId,
                name: member?.User?.name || null,
                email: member?.User?.email || null,
                amount: share.amount,
                percentage: share.percentage,
              };
            }),
            ...(beneficiarySnapshot ? { beneficiarySnapshot } : {}),
            distributedAt: new Date().toISOString(),
          })),
        },
      });

      return {
        success: true,
        totalAmount: result.totalAmount,
        memberCount: result.memberCount,
        sharePerMember: result.sharePerMember,
        distributions: result.distributions.length,
      };
    }),

  /**
   * Get revenue dashboard stats
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const [totalRevenue, companyReserve, executivePool, strategicPools, recentTransactions, recentDistributions] =
      await Promise.all([
        // Total revenue
        ctx.prisma.revenueTransaction.aggregate({
          _sum: { amount: true },
          where: { allocationStatus: "ALLOCATED", createdAt: { gte: REVENUE_POOL_START_DATE } },
        }),
        // Company reserve
        ctx.prisma.companyReserve.findFirst({
          orderBy: { updatedAt: "desc" },
        }),
        // Executive pool pending
        ctx.prisma.revenueAllocation.aggregate({
          _sum: { amount: true },
          where: {
            destinationType: "EXECUTIVE_POOL",
            status: "PENDING",
            createdAt: { gte: REVENUE_POOL_START_DATE },
          },
        }),
        // Strategic pools
        ctx.prisma.strategyPool.findMany({
          select: {
            type: true,
            name: true,
            balance: true,
          },
        }),
        // Recent transactions
        ctx.prisma.revenueTransaction.findMany({
          where: { allocationStatus: "ALLOCATED", createdAt: { gte: REVENUE_POOL_START_DATE } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        // Recent distributions
        ctx.prisma.executiveDistribution.findMany({
          where: { createdAt: { gte: REVENUE_POOL_START_DATE } },
          include: {
            Shareholder: {
              include: {
                User: {
                  select: { name: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      companyReserve: Number(companyReserve?.balance) || 0,
      companyTotalReceived: Number(companyReserve?.totalReceived) || 0,
      companyTotalSpent: Number(companyReserve?.totalSpent) || 0,
      executivePoolPending: Number(executivePool._sum.amount) || 0,
      strategicPools: strategicPools.map((p: any) => ({
        type: p.type,
        name: p.name,
        balance: Number(p.balance),
      })),
      recentTransactions: recentTransactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
      })),
      recentDistributions: recentDistributions.map((d: any) => ({
        ...d,
        amount: Number(d.amount),
        percentage: Number(d.percentage),
      })),
    };
  }),

  /**
   * Get revenue breakdown by source
   */
  getRevenueBreakdown: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const where: any = {
        allocationStatus: "ALLOCATED",
        createdAt: { gte: REVENUE_POOL_START_DATE },
      };

      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = withRevenuePoolCutoff(input.startDate);
        else where.createdAt.gte = REVENUE_POOL_START_DATE;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }

      const breakdown = await ctx.prisma.revenueTransaction.groupBy({
        by: ["source"],
        _sum: { amount: true },
        _count: true,
        where,
      });

      return breakdown.map((item: any) => ({
        source: item.source,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count,
      }));
    }),

  /**
   * Search users for pool assignment
   */
  /**
   * Get company reserve details with transaction history
   */
  getCompanyReserve: protectedProcedure
    .input(
      z.object({
        includeTransactions: z.boolean().default(false),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ ctx, input }): Promise<any> => {
      requireAdmin(ctx.session);
      const { includeTransactions = false, limit = 50 } = input || {};

      if (includeTransactions) {
        return await ctx.prisma.companyReserve.findFirst({
          orderBy: { updatedAt: "desc" },
          include: {
            Transactions: {
              include: {
                ApprovedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: limit,
            },
          },
        });
      }

      return await ctx.prisma.companyReserve.findFirst({
        orderBy: { updatedAt: "desc" },
      });
    }),

  /**
   * Record a spend from company reserve
   */
  spendFromReserve: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        category: z.enum([
          "SALARIES",
          "INFRASTRUCTURE",
          "MARKETING",
          "LEGAL",
          "OPERATIONS",
          "OTHER",
        ]),
        description: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const reserve = await ctx.prisma.companyReserve.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      if (!reserve) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company reserve not found",
        });
      }

      if (Number(reserve.balance) < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient balance. Available: ₦${Number(reserve.balance).toLocaleString()}`,
        });
      }

      const result = await ctx.prisma.$transaction(async (tx: any) => {
        // Deduct from reserve
        const updated = await tx.companyReserve.update({
          where: { id: reserve.id },
          data: {
            balance: { decrement: input.amount },
            totalSpent: { increment: input.amount },
          },
        });

        // Record transaction
        const transaction = await tx.companyReserveTransaction.create({
          data: {
            reserveId: reserve.id,
            amount: input.amount,
            type: "OPERATIONAL_SPEND",
            category: input.category,
            description: input.description,
            approvedBy: ctx.session!.user.id,
          },
        });

        return { reserve: updated, transaction };
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "SPEND_FROM_RESERVE",
          description: `Spent ₦${input.amount.toLocaleString()} on ${input.category}: ${input.description}`,
          metadata: {
            amount: input.amount,
            category: input.category,
            transactionId: result.transaction.id,
          },
        },
      });

      return result;
    }),

  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: input.query, mode: "insensitive" } },
            { name: { contains: input.query, mode: "insensitive" } },
            { username: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
        take: 20,
      });
    }),

  /**
   * Get admin action history
   */
  getAdminActions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.prisma.revenueAdminAction.findMany({
        include: {
          Admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * Get revenue breakdown by source for charts
   */
  getRevenueBySource: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dynamicStartDate = new Date();
      dynamicStartDate.setDate(dynamicStartDate.getDate() - input.days);
      const startDate = withRevenuePoolCutoff(dynamicStartDate);

      const transactions = await ctx.prisma.revenueTransaction.groupBy({
        by: ["source"],
        where: {
          createdAt: {
            gte: startDate,
          },
          ...buildRevenueTransactionFilter(input.filters),
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      return transactions.map(
        (t: { source: string; _sum: { amount: unknown }; _count: { id: number } }) => ({
          source: t.source,
          amount: Number(t._sum.amount || 0),
          count: t._count.id,
        })
      );
    }),

  /**
   * Get revenue trend over time (last N days)
   */
  getRevenueTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dynamicStartDate = new Date();
      dynamicStartDate.setDate(dynamicStartDate.getDate() - input.days);
      const startDate = withRevenuePoolCutoff(dynamicStartDate);

      // Get allocations
      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          ...(input.filters
            ? {
                RevenueTransaction: {
                  createdAt: {
                    gte: startDate,
                  },
                  ...buildRevenueTransactionFilter(input.filters),
                },
              }
            : undefined),
        },
        select: {
          createdAt: true,
          amount: true,
          destinationType: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group by date and destination type
      const dailyData = new Map<string, {
        total: number;
        companyReserve: number;
        executivePool: number;
        strategicPools: number;
      }>();

      allocations.forEach(
        (allocation: { createdAt: Date; amount: unknown; destinationType: string }) => {
        const dateKey = allocation.createdAt.toISOString().split("T")[0];
        const existing = dailyData.get(dateKey!) || {
          total: 0,
          companyReserve: 0,
          executivePool: 0,
          strategicPools: 0,
        };

        const amount = Number(allocation.amount);
        existing.total += amount;

        if (allocation.destinationType === "COMPANY_RESERVE") {
          existing.companyReserve += amount;
        } else if (allocation.destinationType === "EXECUTIVE_POOL") {
          existing.executivePool += amount;
        } else if (allocation.destinationType === "STRATEGIC_POOL") {
          existing.strategicPools += amount;
        }

        dailyData.set(dateKey!, existing);
        }
      );

      // Fill in missing dates with zeros
      const result: Array<{
        date: Date;
        total: number;
        companyReserve: number;
        executivePool: number;
        strategicPools: number;
      }> = [];

      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        const data = dailyData.get(dateKey!) || {
          total: 0,
          companyReserve: 0,
          executivePool: 0,
          strategicPools: 0,
        };

        result.push({
          date,
          ...data,
        });
      }

      return result;
    }),

  /**
   * Get all allocations for timeline
   */
  getAllocations: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        source: z.string().optional(),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Get allocations with transaction info
      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where:
          input.source || input.filters
            ? {
                createdAt: { gte: REVENUE_POOL_START_DATE },
                RevenueTransaction: {
                  createdAt: { gte: REVENUE_POOL_START_DATE },
                  ...(input.source
                    ? { source: input.source as RevenueSource }
                    : undefined),
                  ...buildRevenueTransactionFilter(input.filters),
                },
              }
            : { createdAt: { gte: REVENUE_POOL_START_DATE } },
        include: {
          RevenueTransaction: {
            select: {
              source: true,
              description: true,
              amount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
      });

      // Transform to expected format with split amounts
      return allocations.map(
        (alloc: {
          id: string;
          createdAt: Date;
          amount: unknown;
          destinationType: string;
          RevenueTransaction?: { source: string; description: string | null; amount: unknown } | null;
        }) => ({
          id: alloc.id,
          createdAt: alloc.createdAt,
          totalAmount: Number(alloc.RevenueTransaction?.amount || 0),
          companyReserveAmount:
            alloc.destinationType === "COMPANY_RESERVE" ? Number(alloc.amount) : 0,
          executivePoolAmount:
            alloc.destinationType === "EXECUTIVE_POOL" ? Number(alloc.amount) : 0,
          strategicPoolsAmount:
            alloc.destinationType === "STRATEGIC_POOL" ? Number(alloc.amount) : 0,
          source: alloc.RevenueTransaction?.source || "OTHER",
          Transaction: {
            description: alloc.RevenueTransaction?.description,
          },
        })
      );
    }),

  /**
   * Create monthly snapshot (manually or via cron)
   */
  createSnapshot: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2020),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Check if snapshot already exists
      const existing = await ctx.prisma.revenueSnapshot.findUnique({
        where: {
          month_year: {
            month: input.month,
            year: input.year,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Snapshot for ${input.month}/${input.year} already exists`,
        });
      }

      // Calculate start and end dates for the month
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      const effectiveStartDate = withRevenuePoolCutoff(startDate);

      if (endDate < REVENUE_POOL_START_DATE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Revenue pool snapshots are available only from May 2026 onward.",
        });
      }

      // Get all transactions for the month
      const transactions = await ctx.prisma.revenueTransaction.findMany({
        where: {
          createdAt: {
            gte: effectiveStartDate,
            lte: endDate,
          },
        },
      });

      // Calculate totals by source
      const bySource: Record<string, number> = {
        COMMUNITY_SUPPORT: 0,
        MEMBERSHIP_REGISTRATION: 0,
        MEMBERSHIP_RENEWAL: 0,
        STORE_PURCHASE: 0,
        WITHDRAWAL_FEE: 0,
        YOUTUBE_SUBSCRIPTION: 0,
        THIRD_PARTY_SERVICES: 0,
        PALLIATIVE_PROGRAM: 0,
        LEADERSHIP_POOL_FEE: 0,
        TRAINING_CENTER: 0,
        ELITE_CLUB_OPS: 0,
        ELITE_CLUB_INVESTMENT_PROFIT: 0,
        OTHER: 0,
      };

      let totalRevenue = 0;
      transactions.forEach((t: { amount: unknown; source: string }) => {
        const amount = Number(t.amount);
        totalRevenue += amount;
        bySource[t.source as keyof typeof bySource] += amount;
      });

      // Get allocations for the month
      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          createdAt: {
            gte: effectiveStartDate,
            lte: endDate,
          },
        },
      });

      // Calculate totals by destination type
      const companyReserveTotal = allocations
        .filter((a: { destinationType: string }) => a.destinationType === "COMPANY_RESERVE")
        .reduce((sum: number, a: { amount: unknown }) => sum + Number(a.amount), 0);
      const executivePoolTotal = allocations
        .filter((a: { destinationType: string }) => a.destinationType === "EXECUTIVE_POOL")
        .reduce((sum: number, a: { amount: unknown }) => sum + Number(a.amount), 0);
      const strategicPoolsTotal = allocations
        .filter((a: { destinationType: string }) => a.destinationType === "STRATEGIC_POOL")
        .reduce((sum: number, a: { amount: unknown }) => sum + Number(a.amount), 0);

      // Get distributions
      const execDistributions = await ctx.prisma.executiveDistribution.findMany({
        where: {
          createdAt: {
            gte: effectiveStartDate,
            lte: endDate,
          },
        },
      });

      const poolDistributions = await ctx.prisma.poolDistribution.findMany({
        where: {
          createdAt: {
            gte: effectiveStartDate,
            lte: endDate,
          },
        },
      });

      const executivesDistributed = execDistributions.reduce(
        (sum: number, d: { amount: unknown }) => sum + Number(d.amount),
        0
      );
      const poolsDistributed = poolDistributions.reduce(
        (sum: number, d: { totalAmount: unknown }) => sum + Number(d.totalAmount),
        0
      );

      // Create snapshot
      const snapshot = await ctx.prisma.revenueSnapshot.create({
        data: {
          month: input.month,
          year: input.year,
          totalRevenue,
          companyReserveTotal,
          executivePoolTotal,
          strategicPoolsTotal,
          communitySupport: bySource.COMMUNITY_SUPPORT,
          membershipRegistration: bySource.MEMBERSHIP_REGISTRATION,
          membershipRenewal: bySource.MEMBERSHIP_RENEWAL,
          storePurchase: bySource.STORE_PURCHASE,
          withdrawalFee: bySource.WITHDRAWAL_FEE,
          youtubeSubscription: bySource.YOUTUBE_SUBSCRIPTION,
          thirdPartyServices: bySource.THIRD_PARTY_SERVICES,
          palliativeProgram: bySource.PALLIATIVE_PROGRAM,
          leadershipPoolFee: bySource.LEADERSHIP_POOL_FEE,
          trainingCenter: bySource.TRAINING_CENTER,
          other: bySource.OTHER,
          executivesDistributed,
          poolsDistributed,
          transactionCount: transactions.length,
          createdBy: (ctx.session!.user as any).id,
        },
      });

      // Log action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: (ctx.session!.user as any).id,
          actionType: "CREATE_SNAPSHOT",
          description: `Created revenue snapshot for ${input.month}/${input.year}`,
          metadata: { snapshotId: snapshot.id, totalRevenue },
        },
      });

      return snapshot;
    }),

  /**
   * Get all snapshots
   */
  getSnapshots: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.prisma.revenueSnapshot.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: input.limit,
      });
    }),

  /**
   * Get detailed revenue source breakdown
   */
  getRevenueSourceDetails: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "COMMUNITY_SUPPORT",
          "MEMBERSHIP_REGISTRATION",
          "MEMBERSHIP_RENEWAL",
          "STORE_PURCHASE",
          "WITHDRAWAL_FEE",
          "YOUTUBE_SUBSCRIPTION",
          "THIRD_PARTY_SERVICES",
          "PALLIATIVE_PROGRAM",
          "LEADERSHIP_POOL_FEE",
          "TRAINING_CENTER",
          "OTHER",
        ]),
        days: z.number().default(30),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dynamicStartDate = new Date();
      dynamicStartDate.setDate(dynamicStartDate.getDate() - input.days);
      const startDate = withRevenuePoolCutoff(dynamicStartDate);

      const transactions = await ctx.prisma.revenueTransaction.findMany({
        where: {
          source: input.source,
          createdAt: {
            gte: startDate,
          },
          ...buildRevenueTransactionFilter(input.filters),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      const total = transactions.reduce(
        (sum: number, t: { amount: unknown }) => sum + Number(t.amount),
        0
      );
      const count = transactions.length;
      const average = count > 0 ? total / count : 0;

      return {
        source: input.source,
        total,
        count,
        average,
        transactions,
      };
    }),

  /**
   * Full source-to-destination command center for pool forensics and disbursement tracking.
   */
  getPoolForensicsCommandCenter: protectedProcedure
    .input(
      z
        .object({
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
          poolType: z
            .enum(["LEADERSHIP", "STATE", "DIRECTORS", "TECHNOLOGY", "INVESTORS"])
            .optional(),
          source: z
            .enum([
              "COMMUNITY_SUPPORT",
              "MEMBERSHIP_REGISTRATION",
              "MEMBERSHIP_RENEWAL",
              "STORE_PURCHASE",
              "WITHDRAWAL_FEE",
              "YOUTUBE_SUBSCRIPTION",
              "THIRD_PARTY_SERVICES",
              "PALLIATIVE_PROGRAM",
              "LEADERSHIP_POOL_FEE",
              "TRAINING_CENTER",
              "OTHER",
            ])
            .optional(),
          limit: z.number().min(10).max(200).default(100),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dateFrom = withRevenuePoolCutoff(input?.dateFrom);
      const dateTo = input?.dateTo ?? new Date();

      const allocationWhere: any = {
        createdAt: { gte: dateFrom, lte: dateTo },
        destinationType: { in: ["STRATEGY_POOL", "STRATEGIC_POOL"] },
      };

      const pools = await ctx.prisma.strategyPool.findMany({
        select: { id: true, type: true, name: true },
      });
      const poolIdByType = new Map(pools.map((p: any) => [p.type, p.id]));
      if (input?.poolType) {
        const poolId = poolIdByType.get(input.poolType);
        if (!poolId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pool not found" });
        }
        allocationWhere.destinationId = poolId;
      }

      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where: allocationWhere,
        include: {
          RevenueTransaction: {
            select: {
              id: true,
              source: true,
              sourceKey: true,
              amount: true,
              sourceId: true,
              userId: true,
              description: true,
              createdAt: true,
              User: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 100,
      });

      const sourceOrigin = new Map<string, { source: string; grossRevenue: number; remittedToPools: number; allocations: number; uniqueOrigins: Set<string> }>();
      const poolDestination = new Map<string, { poolId: string; poolType: string; poolName: string; allocated: number; distributed: number; pending: number; allocationCount: number }>();

      for (const alloc of allocations as any[]) {
        const tx = alloc.RevenueTransaction;
        if (!tx) continue;
        if (input?.source && tx.source !== input.source) continue;

        const sourceKey = tx.source;
        const sourceRow = sourceOrigin.get(sourceKey) || {
          source: sourceKey,
          grossRevenue: 0,
          remittedToPools: 0,
          allocations: 0,
          uniqueOrigins: new Set<string>(),
        };
        sourceRow.grossRevenue += Number(tx.amount || 0);
        sourceRow.remittedToPools += Number(alloc.amount || 0);
        sourceRow.allocations += 1;
        sourceRow.uniqueOrigins.add(String(tx.sourceId || tx.id));
        sourceOrigin.set(sourceKey, sourceRow);

        const poolMeta = pools.find((p: any) => p.id === alloc.destinationId);
        if (!poolMeta) continue;
        const poolRow = poolDestination.get(poolMeta.id) || {
          poolId: poolMeta.id,
          poolType: poolMeta.type,
          poolName: poolMeta.name,
          allocated: 0,
          distributed: 0,
          pending: 0,
          allocationCount: 0,
        };
        poolRow.allocated += Number(alloc.amount || 0);
        poolRow.allocationCount += 1;
        if (alloc.status === "DISTRIBUTED" || alloc.status === "COMPLETED") poolRow.distributed += Number(alloc.amount || 0);
        if (alloc.status === "PENDING" || alloc.status === "PROCESSING") poolRow.pending += Number(alloc.amount || 0);
        poolDestination.set(poolMeta.id, poolRow);
      }

      const [poolDistributions, executiveDistributions, adminActions] = await Promise.all([
        ctx.prisma.poolDistribution.findMany({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
            ...(input?.poolType ? { Pool: { type: input.poolType } } : {}),
          },
          include: {
            Pool: { select: { id: true, name: true, type: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 100,
        }),
        ctx.prisma.executiveDistribution.findMany({
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          include: {
            Shareholder: {
              include: { User: { select: { id: true, name: true, email: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 100,
        }),
        ctx.prisma.poolAdminAction.findMany({
          where: {
            actionType: "POOL_DISTRIBUTED",
            createdAt: { gte: dateFrom, lte: dateTo },
            ...(input?.poolType ? { Pool: { type: input.poolType } } : {}),
          },
          include: {
            Pool: { select: { id: true, name: true, type: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 100,
        }),
      ]);

      const disbursementSummary = {
        strategic: {
          pending: poolDistributions
            .filter((d: any) => d.status === "PENDING" || d.status === "PROCESSING")
            .reduce((sum: number, d: any) => sum + Number(d.totalAmount || 0), 0),
          approved: poolDistributions
            .filter((d: any) => d.status === "COMPLETED")
            .reduce((sum: number, d: any) => sum + Number(d.totalAmount || 0), 0),
        },
        executive: {
          pending: executiveDistributions
            .filter((d: any) => d.status === "PENDING" || d.status === "PROCESSING")
            .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
          approved: executiveDistributions
            .filter((d: any) => d.status === "COMPLETED")
            .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
        },
      };

      const beneficiaryTotals = new Map<string, { userId: string; name: string | null; email: string | null; poolType: string; totalPaid: number; paymentCount: number }>();
      for (const action of adminActions as any[]) {
        const metadata = action.metadata as any;
        const shares = Array.isArray(metadata?.memberShares) ? metadata.memberShares : [];
        for (const share of shares) {
          const key = `${share.userId}:${action.Pool?.type || "UNKNOWN"}`;
          const row = beneficiaryTotals.get(key) || {
            userId: share.userId,
            name: share.name || null,
            email: share.email || null,
            poolType: action.Pool?.type || "UNKNOWN",
            totalPaid: 0,
            paymentCount: 0,
          };
          row.totalPaid += Number(share.amount || 0);
          row.paymentCount += 1;
          beneficiaryTotals.set(key, row);
        }
      }

      return {
        policy: {
          startDate: REVENUE_POOL_START_DATE,
          effectiveFrom: dateFrom,
          effectiveTo: dateTo,
          message: "Only post-cutoff revenue (from May 1, 2026) is counted for pool inflow and disbursement tracking.",
        },
        totals: {
          poolInflow: allocations.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0),
          poolDisbursedApproved: disbursementSummary.strategic.approved,
          poolDisbursedPending: disbursementSummary.strategic.pending,
          executiveDisbursedApproved: disbursementSummary.executive.approved,
          executiveDisbursedPending: disbursementSummary.executive.pending,
        },
        sourceOrigins: Array.from(sourceOrigin.values()).map((s) => ({
          ...s,
          uniqueOriginCount: s.uniqueOrigins.size,
          remittedPercent: s.grossRevenue > 0 ? (s.remittedToPools / s.grossRevenue) * 100 : 0,
        })),
        poolDestinations: Array.from(poolDestination.values()),
        allocationTrail: allocations.map((a: any) => ({
          allocationId: a.id,
          allocationStatus: a.status,
          allocationAmount: Number(a.amount || 0),
          allocationCreatedAt: a.createdAt,
          destinationType: a.destinationType,
          destinationId: a.destinationId,
          transaction: a.RevenueTransaction
            ? {
                id: a.RevenueTransaction.id,
                source: a.RevenueTransaction.source,
                sourceKey: a.RevenueTransaction.sourceKey,
                sourceId: a.RevenueTransaction.sourceId,
                description: a.RevenueTransaction.description,
                amount: Number(a.RevenueTransaction.amount || 0),
                createdAt: a.RevenueTransaction.createdAt,
                originUser: a.RevenueTransaction.User,
              }
            : null,
        })),
        disbursements: {
          strategic: poolDistributions.map((d: any) => ({
            id: d.id,
            status: d.status,
            poolType: d.Pool?.type,
            poolName: d.Pool?.name,
            totalAmount: Number(d.totalAmount || 0),
            memberCount: d.memberCount,
            amountPerMember: Number(d.amountPerMember || 0),
            distributedAt: d.distributedAt,
            createdAt: d.createdAt,
          })),
          executive: executiveDistributions.map((d: any) => ({
            id: d.id,
            status: d.status,
            role: d.Shareholder?.role,
            beneficiary: d.Shareholder?.User,
            amount: Number(d.amount || 0),
            percentage: Number(d.percentage || 0),
            distributedAt: d.distributedAt,
            createdAt: d.createdAt,
          })),
        },
        beneficiaryTotals: Array.from(beneficiaryTotals.values()).sort((a, b) => b.totalPaid - a.totalPaid),
      };
    }),

  /**
   * Manual Revenue Allocation
   * Allows admin to manually allocate revenue from Company Reserve to Executive or Pool
   */
  manualAllocation: protectedProcedure
    .input(
      z.object({
        destinationType: z.enum(["EXECUTIVE", "POOL"]),
        destinationId: z.string(), // Executive shareholder ID or Pool ID
        amount: z.number().positive(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const userId = (ctx.session?.user as any)?.id;

      // Deduct from company reserve
      await ctx.prisma.companyReserveTransaction.create({
        data: {
          reserveId: "1",
          amount: -input.amount, // Negative = spending
          type: "OPERATIONAL_SPEND",
          category: "MANUAL_ALLOCATION",
          description: `Manual allocation to ${input.destinationType}: ${input.reason}`,
          approvedBy: userId,
          metadata: {
            destinationType: input.destinationType,
            destinationId: input.destinationId,
          },
        },
      });

      // Add to destination
      if (input.destinationType === "EXECUTIVE") {
        const shareholder = await ctx.prisma.executiveShareholder.update({
          where: { id: input.destinationId },
          data: {
            currentBalance: { increment: input.amount },
            totalEarned: { increment: input.amount },
          },
        });

        await ctx.prisma.executiveWalletTransaction.create({
          data: {
            shareholderId: input.destinationId,
            amount: input.amount,
            type: "ADJUSTMENT",
            description: `Manual allocation: ${input.reason}`,
            metadata: { approvedBy: userId },
          },
        });

        return {
          success: true,
          message: `₦${input.amount.toLocaleString()} allocated to executive`,
        };
      } else {
        // Pool allocation
        const pool = await ctx.prisma.strategyPool.update({
          where: { id: input.destinationId },
          data: {
            balance: { increment: input.amount },
          },
        });

        return {
          success: true,
          message: `₦${input.amount.toLocaleString()} allocated to ${pool.name}`,
        };
      }
    }),

  /**
   * Inter-Pool Transfer
   * Transfer funds between Company Reserve and Strategic Pools
   */
  poolTransfer: protectedProcedure
    .input(
      z.object({
        from: z.string(), // "COMPANY_RESERVE" or pool ID
        to: z.string(), // "COMPANY_RESERVE" or pool ID
        amount: z.number().positive(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const userId = (ctx.session?.user as any)?.id;

      // Handle transfers
      if (input.from === "COMPANY_RESERVE") {
        // From reserve to pool
        await ctx.prisma.companyReserveTransaction.create({
          data: {
            reserveId: "1",
            amount: -input.amount,
            type: "TRANSFER_TO_POOL",
            category: "POOL_TRANSFER",
            description: `Transfer to pool: ${input.reason}`,
            approvedBy: userId,
            metadata: { to: input.to },
          },
        });

        await ctx.prisma.strategyPool.update({
          where: { id: input.to },
          data: { balance: { increment: input.amount } },
        });
      } else if (input.to === "COMPANY_RESERVE") {
        // From pool to reserve
        await ctx.prisma.strategyPool.update({
          where: { id: input.from },
          data: { balance: { decrement: input.amount } },
        });

        await ctx.prisma.companyReserveTransaction.create({
          data: {
            reserveId: "1",
            amount: input.amount,
            type: "TRANSFER_FROM_POOL",
            category: "POOL_TRANSFER",
            description: `Transfer from pool: ${input.reason}`,
            approvedBy: userId,
            metadata: { from: input.from },
          },
        });
      } else {
        // Between pools
        await ctx.prisma.strategyPool.update({
          where: { id: input.from },
          data: { balance: { decrement: input.amount } },
        });

        await ctx.prisma.strategyPool.update({
          where: { id: input.to },
          data: { balance: { increment: input.amount } },
        });
      }

      return {
        success: true,
        message: `₦${input.amount.toLocaleString()} transferred successfully`,
      };
    }),

  /**
   * Adjust Executive Percentages
   * Update percentage allocations for executive roles
   */
  adjustExecutivePercentages: protectedProcedure
    .input(
      z.object({
        percentages: z.array(
          z.object({
            shareholderId: z.string(),
            percentage: z.number().min(0).max(100),
          })
        ),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const userId = (ctx.session?.user as any)?.id;

      const existing = await ctx.prisma.executiveShareholder.findMany({
        select: { id: true, role: true },
      });

      if (existing.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No executive positions found" });
      }

      // Ensure all positions are covered
      if (input.percentages.length !== existing.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide percentages for every executive position",
        });
      }

      const total = input.percentages.reduce((sum, p) => sum + p.percentage, 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Executive percentages must sum to 100%. Current total: ${total}%`,
        });
      }

      // Update each shareholder's percentage
      for (const { shareholderId, percentage } of input.percentages) {
        await ctx.prisma.executiveShareholder.update({
          where: { id: shareholderId },
          data: { percentage },
        });
      }

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: userId,
          actionType: "ADJUST_PERCENTAGES",
          description: `Adjusted executive percentages: ${input.reason}`,
          metadata: {
            percentages: input.percentages,
            reason: input.reason,
          },
        },
      });

      return {
        success: true,
        message: "Executive percentages updated successfully",
      };
    }),

  /**
   * Executive Wallet Withdrawal
   * Allow executives to withdraw from their current balance
   */
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        shareholderId: z.string(),
        amount: z.number().positive(),
        reason: z.string().min(10),
        bankDetails: z.object({
          bankName: z.string(),
          accountNumber: z.string(),
          accountName: z.string(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;

      // Get shareholder
      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: { id: input.shareholderId },
        include: { User: true },
      });

      if (!shareholder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Executive shareholder not found",
        });
      }

      // Check if user is admin or the shareholder themselves
      const isAdmin = (ctx.session?.user as any)?.role === "admin";
      const isOwner = shareholder.userId === userId;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only withdraw from your own wallet",
        });
      }

      // Check sufficient balance
      if (Number(shareholder.currentBalance) < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient balance. Available: ₦${Number(shareholder.currentBalance).toLocaleString()}`,
        });
      }

      // Deduct from balance
      await ctx.prisma.executiveShareholder.update({
        where: { id: input.shareholderId },
        data: {
          currentBalance: { decrement: input.amount },
        },
      });

      // Record withdrawal transaction
      await ctx.prisma.executiveWalletTransaction.create({
        data: {
          shareholderId: input.shareholderId,
          amount: -input.amount, // Negative for withdrawal
          type: "WITHDRAWAL",
          description: input.reason,
          metadata: {
            requestedBy: userId,
            bankDetails: input.bankDetails,
            status: input.amount >= 100000 ? "PENDING_APPROVAL" : "APPROVED",
          },
        },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: userId,
          actionType: "EXECUTIVE_WITHDRAWAL",
          description: `Withdrawal request: ₦${input.amount.toLocaleString()} by ${shareholder.User?.name || shareholder.role}`,
          metadata: {
            shareholderId: input.shareholderId,
            amount: input.amount,
            reason: input.reason,
          },
        },
      });

      return {
        success: true,
        message: input.amount >= 100000
          ? `Withdrawal request of ₦${input.amount.toLocaleString()} submitted for admin approval`
          : `₦${input.amount.toLocaleString()} withdrawn successfully`,
        requiresApproval: input.amount >= 100000,
      };
    }),

  /**
   * Get pools with overdue scheduled distributions (nextDistributionAt <= now)
   */
  getOverduePools: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);
    const now = new Date();
    // Cast to any because nextDistributionAt / distributionFrequency are new schema fields
    // not yet reflected in generated Prisma TS types
    return (ctx.prisma as any).strategyPool.findMany({
      where: {
        nextDistributionAt: { lte: now },
        isActive: true,
        distributionFrequency: { not: "MANUAL" },
      },
      select: {
        id: true,
        type: true,
        name: true,
        nextDistributionAt: true,
        distributionFrequency: true,
        balance: true,
        Members: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });
  }),

  /**
   * Sync LEADERSHIP pool member active/inactive status from LeadershipPoolQualification records.
   * Activates members whose isQualified=true and deactivates those with isQualified=false.
   */
  syncLeadershipQualifications: protectedProcedure.mutation(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const pool = await ctx.prisma.strategyPool.findUnique({
      where: { type: "LEADERSHIP" },
      include: { Members: true },
    });

    if (!pool) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Leadership pool not found" });
    }

    const memberUserIds = pool.Members.map((m: any) => m.userId);
    if (memberUserIds.length === 0) {
      return { success: true, activated: 0, deactivated: 0 };
    }

    const qualifications = await ctx.prisma.leadershipPoolQualification.findMany({
      where: { userId: { in: memberUserIds } },
      select: { userId: true, isQualified: true },
    });

    const qualMap = new Map(qualifications.map((q: any) => [q.userId, q.isQualified]));

    let activated = 0;
    let deactivated = 0;

    for (const member of pool.Members) {
      const isQualified = qualMap.get(member.userId);
      if (isQualified === undefined) continue; // No qualification record — leave as-is

      if (isQualified && !member.isActive) {
        await ctx.prisma.poolMember.update({
          where: { id: member.id },
          data: { isActive: true, leftAt: null },
        });
        activated++;
      } else if (!isQualified && member.isActive) {
        await ctx.prisma.poolMember.update({
          where: { id: member.id },
          data: { isActive: false, leftAt: new Date() },
        });
        deactivated++;
      }
    }

    // Audit log
    await ctx.prisma.poolAdminAction.create({
      data: {
        poolId: pool.id,
        adminId: ctx.session!.user.id,
        actionType: "QUALIFICATIONS_SYNCED",
        description: `Synced leadership qualifications: ${activated} activated, ${deactivated} deactivated`,
        metadata: JSON.parse(JSON.stringify({ activated, deactivated, syncedAt: new Date().toISOString() })),
      },
    });

    return { success: true, activated, deactivated };
  }),

  /**
   * Get executive wallet transactions (for the logged-in executive or admin)
   */
  getMyWalletTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      const isAdmin = (ctx.session?.user as any)?.role === "admin";

      // Find shareholder for this user
      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: { userId },
      });

      if (!shareholder && !isAdmin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not an executive shareholder",
        });
      }

      // If admin, return all transactions; otherwise only user's transactions
      const transactions = await ctx.prisma.executiveWalletTransaction.findMany({
        where: isAdmin ? {} : { shareholderId: shareholder!.id },
        include: {
          Shareholder: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return transactions;
    }),

  /**
   * Revenue Allocation Audit Query
   * Verifies 50/30/20 split compliance and alignment between allocations, distributions, and current pool state
   */
  auditRevenueAllocationIntegrity: protectedProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const dateFrom = withRevenuePoolCutoff(input?.dateFrom);
      const dateTo = input?.dateTo ?? new Date();

      // 1. Total Revenue Recorded (ALLOCATED transactions only)
      const totalRevenueAgg = await ctx.prisma.revenueTransaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          allocationStatus: "ALLOCATED",
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      });
      const totalRevenue = Number(totalRevenueAgg._sum.amount || 0);
      const transactionCount = totalRevenueAgg._count;

      // 2. Allocations by Destination Type (what was actually allocated out)
      const allocations = await ctx.prisma.revenueAllocation.groupBy({
        by: ["destinationType"],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      });

      const allocByType: Record<string, { sum: number; count: number }> = {
        COMPANY_RESERVE: { sum: 0, count: 0 },
        EXECUTIVE_POOL: { sum: 0, count: 0 },
        STRATEGIC_POOL: { sum: 0, count: 0 },
      };

      let totalAllocated = 0;
      for (const row of allocations) {
        const sum = Number(row._sum.amount || 0);
        const count = Number(row._count?.id || 0);
        allocByType[row.destinationType] = { sum, count };
        totalAllocated += sum;
      }

      // 3. Calculate expected allocations (50/30/20)
      const expectedCompanyReserve = totalRevenue * 0.5;
      const expectedExecutivePool = totalRevenue * 0.3;
      const expectedStrategicPools = totalRevenue * 0.2;

      // 4. Current Pool Balances (what's currently sitting in pools)
      const companyReserve = await ctx.prisma.companyReserve.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      const strategicPools = await ctx.prisma.strategyPool.findMany({
        select: { type: true, name: true, balance: true },
      });
      const strategicPoolsTotal = strategicPools.reduce((sum, p) => sum + Number(p.balance || 0), 0);

      // 5. Distribution Analysis
      const executiveDistributions = await ctx.prisma.executiveDistribution.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
      });
      const poolDistributions = await ctx.prisma.poolDistribution.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
      });

      const executiveDistributed = Number(executiveDistributions._sum.amount || 0);
      const poolsDistributed = Number(poolDistributions._sum.totalAmount || 0);

      // 6. Allocation Status Breakdown (pending vs distributed)
      const allocationsByStatus = await ctx.prisma.revenueAllocation.groupBy({
        by: ["destinationType", "status"],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      });

      const statusByType: Record<string, Record<string, { sum: number; count: number }>> = {};
      for (const row of allocationsByStatus) {
        const type = row.destinationType;
        if (!statusByType[type]) statusByType[type] = {};
        statusByType[type][row.status] = {
          sum: Number(row._sum.amount || 0),
          count: Number(row._count?.id || 0),
        };
      }

      // 7. Compliance Check: Variance Analysis
      const companyReserveVariance = allocByType.COMPANY_RESERVE.sum - expectedCompanyReserve;
      const executivePoolVariance = allocByType.EXECUTIVE_POOL.sum - expectedExecutivePool;
      const strategicPoolsVariance = allocByType.STRATEGIC_POOL.sum - expectedStrategicPools;
      const totalAllocatedVariance = totalAllocated - totalRevenue;

      // Determine if compliant (within 1% tolerance for rounding)
      const tolerancePercent = 0.01;
      const companyReserveCompliant = Math.abs(companyReserveVariance / expectedCompanyReserve) <= tolerancePercent;
      const executivePoolCompliant = Math.abs(executivePoolVariance / expectedExecutivePool) <= tolerancePercent;
      const strategicPoolsCompliant = Math.abs(strategicPoolsVariance / expectedStrategicPools) <= tolerancePercent;
      const totalAllocatedCompliant = Math.abs(totalAllocatedVariance / totalRevenue) <= tolerancePercent;

      return {
        // Period metadata
        period: {
          startDate: dateFrom,
          endDate: dateTo,
        },

        // Total Revenue Recorded
        revenue: {
          totalRecorded: totalRevenue,
          transactionCount,
        },

        // Allocation Targets (50/30/20)
        expectedAllocations: {
          companyReserve: expectedCompanyReserve,
          executivePool: expectedExecutivePool,
          strategicPools: expectedStrategicPools,
          total: expectedCompanyReserve + expectedExecutivePool + expectedStrategicPools,
        },

        // Actual Allocations
        actualAllocations: {
          companyReserve: allocByType.COMPANY_RESERVE.sum,
          companyReserveCount: allocByType.COMPANY_RESERVE.count,
          executivePool: allocByType.EXECUTIVE_POOL.sum,
          executivePoolCount: allocByType.EXECUTIVE_POOL.count,
          strategicPools: allocByType.STRATEGIC_POOL.sum,
          strategicPoolsCount: allocByType.STRATEGIC_POOL.count,
          total: totalAllocated,
        },

        // Variance Analysis (difference from expected)
        variances: {
          companyReserve: {
            difference: companyReserveVariance,
            differencePercent: expectedCompanyReserve > 0 ? (companyReserveVariance / expectedCompanyReserve) * 100 : 0,
            compliant: companyReserveCompliant,
          },
          executivePool: {
            difference: executivePoolVariance,
            differencePercent: expectedExecutivePool > 0 ? (executivePoolVariance / expectedExecutivePool) * 100 : 0,
            compliant: executivePoolCompliant,
          },
          strategicPools: {
            difference: strategicPoolsVariance,
            differencePercent: expectedStrategicPools > 0 ? (strategicPoolsVariance / expectedStrategicPools) * 100 : 0,
            compliant: strategicPoolsCompliant,
          },
          totalAllocated: {
            difference: totalAllocatedVariance,
            differencePercent: totalRevenue > 0 ? (totalAllocatedVariance / totalRevenue) * 100 : 0,
            compliant: totalAllocatedCompliant,
          },
        },

        // Current Pool States
        currentState: {
          companyReserveBalance: Number(companyReserve?.balance || 0),
          companyReserveTotalReceived: Number(companyReserve?.totalReceived || 0),
          companyReserveTotalSpent: Number(companyReserve?.totalSpent || 0),
          strategicPoolsBalance: strategicPoolsTotal,
          strategicPoolsBreakdown: strategicPools.map((p) => ({
            type: p.type,
            name: p.name,
            balance: Number(p.balance || 0),
          })),
        },

        // Distribution Tracking
        distributions: {
          executiveDistributed,
          executiveDistributionCount: executiveDistributions._count,
          poolsDistributed,
          poolsDistributionCount: poolDistributions._count,
        },

        // Allocation Status (pending vs distributed)
        allocationStatus: Object.entries(statusByType).reduce(
          (acc, [type, statuses]) => ({
            ...acc,
            [type]: Object.entries(statuses).reduce(
              (statusAcc, [status, data]) => ({
                ...statusAcc,
                [status]: data,
              }),
              {}
            ),
          }),
          {}
        ),

        // Overall Compliance Summary
        compliance: {
          allocationSplit50_30_20Compliant:
            companyReserveCompliant &&
            executivePoolCompliant &&
            strategicPoolsCompliant &&
            totalAllocatedCompliant,
          allocationVarianceTolerance: `${(tolerancePercent * 100).toFixed(1)}%`,
          summary: (() => {
            const failures = [];
            if (!companyReserveCompliant) failures.push("Company Reserve allocation variance exceeds tolerance");
            if (!executivePoolCompliant) failures.push("Executive Pool allocation variance exceeds tolerance");
            if (!strategicPoolsCompliant) failures.push("Strategic Pools allocation variance exceeds tolerance");
            if (!totalAllocatedCompliant) failures.push("Total allocated variance exceeds tolerance");
            return failures.length === 0
              ? "✅ All 50/30/20 allocations are within tolerance and compliant"
              : `❌ Compliance issues: ${failures.join("; ")}`;
          })(),
        },

        // Alignment Check: Flow-to-Balance
        alignmentCheck: {
          companyReserveFlowCheck: {
            allocated: allocByType.COMPANY_RESERVE.sum,
            distributed: 0, // Company reserve doesn't have distributions like pools
            currentBalance: Number(companyReserve?.balance || 0),
            explanation: "Company Reserve: [allocated] - [operational spend] = [balance]",
            balanceShouldBe: allocByType.COMPANY_RESERVE.sum - Number(companyReserve?.totalSpent || 0),
            balanceActual: Number(companyReserve?.balance || 0),
            flowCloses: allocByType.COMPANY_RESERVE.sum - Number(companyReserve?.totalSpent || 0) === Number(companyReserve?.balance || 0),
          },
          executivePoolFlowCheck: {
            allocated: allocByType.EXECUTIVE_POOL.sum,
            distributed: executiveDistributed,
            pending: allocByType.EXECUTIVE_POOL.sum - executiveDistributed,
            explanation: "Executive Pool: [allocated] = [distributed] + [pending]",
            flowCloses: allocByType.EXECUTIVE_POOL.sum === executiveDistributed + (statusByType.EXECUTIVE_POOL?.PENDING?.sum || 0),
          },
          strategicPoolsFlowCheck: {
            allocated: allocByType.STRATEGIC_POOL.sum,
            distributed: poolsDistributed,
            currentBalance: strategicPoolsTotal,
            pending: allocByType.STRATEGIC_POOL.sum - poolsDistributed,
            explanation: "Strategic Pools: [allocated] - [distributed] + [internal transfers] = [balance]",
            flowCloses: Math.abs(allocByType.STRATEGIC_POOL.sum - poolsDistributed - strategicPoolsTotal) <= 1, // Allow 1 naira for rounding
          },
        },
      };
    }),
});

/**
 * Helper: Get percentage for executive role
 */
function getRolePercentage(
  role: string
): number {
  const normalized = normalizeRoleName(role);
  const percentages = {
    CEO: 30,
    CTO: 20,
    HEAD_OF_TRAVEL: 20,
    CMO: 10,
    OLIVER: 5,
    MORRISON: 5,
    ANNIE: 10,
  } as Record<string, number>;
  return percentages[normalized] ?? 0;
}

/**
 * Normalize role display string into a consistent key
 */
function normalizeRoleName(role: string): string {
  return role.trim().toUpperCase().replace(/\s+/g, "_");
}
