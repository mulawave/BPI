/**
 * Revenue Service
 * Centralized service for recording revenue from all sources
 */

import type { PrismaClient } from "@prisma/client";

export type RevenueSource =
  | "COMMUNITY_SUPPORT"
  | "MEMBERSHIP_REGISTRATION"
  | "MEMBERSHIP_RENEWAL"
  | "STORE_PURCHASE"
  | "WITHDRAWAL_FEE"
  | "DEPOSIT_FEE"
  | "YOUTUBE_SUBSCRIPTION"
  | "THIRD_PARTY_SERVICES"
  | "PALLIATIVE_PROGRAM"
  | "LEADERSHIP_POOL_FEE"
  | "TRAINING_CENTER"
  | "ELITE_CLUB_OPS"
  | "ELITE_CLUB_INVESTMENT_PROFIT"
  | "OTHER";

export interface RecordRevenueParams {
  source: RevenueSource;
  amount: number;
  currency?: "NGN" | "USD";
  sourceId?: string;
  description?: string;
  // Extended dimensions for reporting / governance.
  sourceKey?: string;
  userId?: string;
  programType?: string;
  productId?: string;
  orderId?: string;
  packageId?: string;
  country?: string;
  state?: string;
  region?: string;
  tokenSymbol?: string;
  metadata?: Record<string, unknown>;
}

const REVENUE_SPLIT_SETTING_KEYS = {
  companyPercent: "revenue_split_company_percent",
  executivePercent: "revenue_split_executive_percent",
  strategicPercent: "revenue_split_strategic_percent",
} as const;

const DEFAULT_SPLIT = {
  companyPercent: 50,
  executivePercent: 30,
  strategicPercent: 20,
} as const;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return null;
  if (value < 0 || value > 100) return null;
  return value;
}

type SplitConfig = {
  companyPercent: number;
  executivePercent: number;
  strategicPercent: number;
  versionId: string | null;
  version: number | null;
};

async function getSplitConfig(tx: any): Promise<SplitConfig> {
  // Preferred: versioned config
  try {
    const active = await tx.profitPoolConfigVersion.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    if (active) {
      const companyPercent = clampPercent(Number(active.companyPercent ?? DEFAULT_SPLIT.companyPercent));
      const executivePercent = clampPercent(Number(active.executivePercent ?? DEFAULT_SPLIT.executivePercent));
      const strategicPercent = clampPercent(Number(active.strategicPercent ?? DEFAULT_SPLIT.strategicPercent));

      if (
        companyPercent != null &&
        executivePercent != null &&
        strategicPercent != null &&
        Math.abs(companyPercent + executivePercent + strategicPercent - 100) <= 0.0001
      ) {
        return {
          companyPercent,
          executivePercent,
          strategicPercent,
          versionId: String(active.id),
          version: Number(active.version ?? 0),
        };
      }

      console.warn("[REVENUE SERVICE] Invalid ProfitPoolConfigVersion split; falling back", {
        id: active.id,
        version: active.version,
        companyPercent,
        executivePercent,
        strategicPercent,
      });
    }
  } catch (error: any) {
    console.warn("[REVENUE SERVICE] Failed reading ProfitPoolConfigVersion; falling back", {
      error: error?.message,
    });
  }

  // Fallback: legacy admin settings keys
  try {
    const [company, executive, strategic] = await Promise.all([
      tx.adminSettings.findUnique({ where: { settingKey: REVENUE_SPLIT_SETTING_KEYS.companyPercent } }),
      tx.adminSettings.findUnique({ where: { settingKey: REVENUE_SPLIT_SETTING_KEYS.executivePercent } }),
      tx.adminSettings.findUnique({ where: { settingKey: REVENUE_SPLIT_SETTING_KEYS.strategicPercent } }),
    ]);

    const companyPercent = clampPercent(company ? parseFloat(company.settingValue) : DEFAULT_SPLIT.companyPercent);
    const executivePercent = clampPercent(executive ? parseFloat(executive.settingValue) : DEFAULT_SPLIT.executivePercent);
    const strategicPercent = clampPercent(strategic ? parseFloat(strategic.settingValue) : DEFAULT_SPLIT.strategicPercent);

    if (
      companyPercent == null ||
      executivePercent == null ||
      strategicPercent == null ||
      Math.abs(companyPercent + executivePercent + strategicPercent - 100) > 0.0001
    ) {
      console.warn("[REVENUE SERVICE] Invalid revenue split settings; falling back to defaults", {
        companyPercent,
        executivePercent,
        strategicPercent,
      });
      return { ...DEFAULT_SPLIT, versionId: null, version: null };
    }

    return { companyPercent, executivePercent, strategicPercent, versionId: null, version: null };
  } catch (error: any) {
    console.warn("[REVENUE SERVICE] Failed reading split settings; falling back to defaults", {
      error: error?.message,
    });
    return { ...DEFAULT_SPLIT, versionId: null, version: null };
  }
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function fromCents(cents: number) {
  return cents / 100;
}

/**
 * Record revenue and allocate using 50/30/20 split
 */
export async function recordRevenue(
  prisma: PrismaClient,
  params: RecordRevenueParams
) {
  const {
    source,
    amount,
    currency = "NGN",
    sourceId,
    description,
    sourceKey,
    userId,
    programType,
    productId,
    orderId,
    packageId,
    country,
    state,
    region,
    tokenSymbol,
    metadata,
  } = params;

  // Validate amount
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  try {
    // Use transaction for atomicity
    return await prisma.$transaction(async (tx: any) => {
      const splitConfig = await getSplitConfig(tx);
      // Record revenue transaction (composite constraint on (source, sourceId) prevents duplicates)
      const revenueTransaction = await tx.revenueTransaction.create({
        data: {
          source,
          sourceKey: sourceKey ?? null,
          amount,
          currency,
          sourceId,
          description,
          userId: userId ?? null,
          programType: programType ?? null,
          productId: productId ?? null,
          orderId: orderId ?? null,
          packageId: packageId ?? null,
          country: country ?? null,
          state: state ?? null,
          region: region ?? null,
          tokenSymbol: tokenSymbol ?? null,
          metadata: metadata ?? null,
          profitPoolConfigVersionId: splitConfig.versionId,
          allocationStatus: "PENDING",
        },
      });

    // Allocate revenue (config-driven split)
    await allocateRevenue(tx, revenueTransaction.id, amount, splitConfig);

    // Mark as allocated
    await tx.revenueTransaction.update({
      where: { id: revenueTransaction.id },
      data: { 
        allocationStatus: "ALLOCATED",
        allocatedAt: new Date(),
      },
    });

      return revenueTransaction;
    });
  } catch (error: any) {
    console.error("[REVENUE SERVICE] Error recording revenue:", {
      source,
      amount,
      currency,
      sourceId,
      error: error.message,
      stack: error.stack,
    });
    
    // Handle duplicate idempotency key error from unique constraint
    if (error.code === "P2002" && sourceId) {
      throw new Error(`Revenue already recorded for source=${source} sourceId=${sourceId}`);
    }
    
    throw error;
  }
}

/**
 * Allocate revenue using 50/30/20 split
 * - 50% Company Reserve
 * - 30% Executive Pool (distributed daily at 8am)
 * - 20% Strategic Pools (5 pools, 4% each, distributed on-demand)
 */
async function allocateRevenue(
  prisma: any, // Transaction client
  transactionId: string,
  amount: number,
  split: { companyPercent: number; executivePercent: number; strategicPercent: number }
) {
  const COMPANY_RESERVE_ID = "company-reserve";
  try {
    console.log(`[REVENUE SERVICE] Allocating revenue: ₦${amount.toLocaleString()} for transaction ${transactionId}`);

    const totalCents = toCents(amount);
    const companyCents = Math.floor((totalCents * split.companyPercent) / 100);
    const executiveCents = Math.floor((totalCents * split.executivePercent) / 100);
    const strategicCents = totalCents - companyCents - executiveCents;
    
    // Company Reserve
    const companyAmount = fromCents(companyCents);
    await prisma.revenueAllocation.create({
      data: {
        revenueTransactionId: transactionId,
        destinationType: "COMPANY_RESERVE",
        amount: companyAmount,
        percentage: split.companyPercent,
        status: "ALLOCATED",
      },
    });
    await prisma.companyReserve.upsert({
      where: { id: COMPANY_RESERVE_ID },
      update: { 
        balance: { increment: companyAmount },
        totalReceived: { increment: companyAmount },
      },
      create: { 
        id: COMPANY_RESERVE_ID, 
        balance: companyAmount,
        totalReceived: companyAmount,
      },
    });

    // Executive Pool (pending daily distribution)
    const executiveAmount = fromCents(executiveCents);
    await prisma.revenueAllocation.create({
      data: {
        revenueTransactionId: transactionId,
        destinationType: "EXECUTIVE_POOL",
        amount: executiveAmount,
        percentage: split.executivePercent,
        status: "PENDING",
      },
    });

    // Strategic Pools split among 5 pools (equal share)
    const poolCount = 5;
    const basePoolCents = Math.floor(strategicCents / poolCount);
    const poolRemainderCents = strategicCents - basePoolCents * poolCount;
    const poolPercent = split.strategicPercent / poolCount;
    const poolConfigs = [
      { type: "LEADERSHIP", name: "Leadership Pool" },
      { type: "STATE", name: "State Pool" },
      { type: "DIRECTORS", name: "Directors Pool" },
      { type: "TECHNOLOGY", name: "Technology Pool" },
      { type: "INVESTORS", name: "Investors Pool" },
    ] as const;

    for (let idx = 0; idx < poolConfigs.length; idx++) {
      const { type: poolType, name } = poolConfigs[idx]!;
      const poolCents = basePoolCents + (idx < poolRemainderCents ? 1 : 0);
      const poolAmount = fromCents(poolCents);

      // Get or create pool
      const pool = await prisma.strategyPool.upsert({
        where: { type: poolType },
        update: { balance: { increment: poolAmount } },
        create: {
          type: poolType,
          name,
          balance: poolAmount,
        },
      });

      // Record allocation
      await prisma.revenueAllocation.create({
        data: {
          revenueTransactionId: transactionId,
          destinationType: "STRATEGY_POOL",
          destinationId: pool.id,
          amount: poolAmount,
          percentage: poolPercent,
          status: "PENDING",
        },
      });
    }

    console.log(
      `[REVENUE SERVICE] Allocation complete: Company ₦${companyAmount.toLocaleString()} (${split.companyPercent}%), ` +
        `Executive ₦${executiveAmount.toLocaleString()} (${split.executivePercent}%), ` +
        `Strategic ₦${fromCents(strategicCents).toLocaleString()} (${split.strategicPercent}%)`
    );
  } catch (error: any) {
    console.error("[REVENUE SERVICE] Error in allocation:", {
      transactionId,
      amount,
      error: error.message,
    });
    throw error;
  }
}

export async function getRevenueStats(prisma: PrismaClient) {
  try {
    const [totalRevenue, companyReserve, executivePoolPending, strategicPools] =
      await Promise.all([
      prisma.revenueTransaction.aggregate({
        _sum: { amount: true },
        where: { allocationStatus: "ALLOCATED" },
      }),
      prisma.companyReserve.findFirst({
        orderBy: { updatedAt: "desc" },
      }),
      prisma.revenueAllocation.aggregate({
        _sum: { amount: true },
        where: {
          destinationType: "EXECUTIVE_POOL",
          status: "PENDING",
        },
      }),
      prisma.strategyPool.findMany({
        select: {
          type: true,
          name: true,
          balance: true,
        },
      }),
    ]);

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    companyReserve: companyReserve?.balance || 0,
    companyTotalReceived: companyReserve?.totalReceived || 0,
    companyTotalSpent: companyReserve?.totalSpent || 0,
    executivePoolPending: executivePoolPending._sum.amount || 0,
    strategicPools: strategicPools.map((p: any) => ({
      type: p.type,
      name: p.name,
      balance: p.balance,
    })),
    };
  } catch (error: any) {
    console.error("[REVENUE SERVICE] Error getting stats:", error.message);
    throw error;
  }
}
