/**
 * Revenue Service
 * Centralized service for recording revenue from all sources
 */

import { PrismaClient } from "@prisma/client";

export type RevenueSource =
  | "COMMUNITY_SUPPORT"
  | "MEMBERSHIP_PURCHASE"
  | "MEMBERSHIP_RENEWAL"
  | "STORE_ORDER"
  | "WITHDRAWAL_FEE_CASH"
  | "WITHDRAWAL_FEE_BPT"
  | "YOUTUBE_SUBSCRIPTION"
  | "THIRD_PARTY_COMMISSION"
  | "LEADERSHIP_POOL_FEE"
  | "PALLIATIVE_DONATION"
  | "OTHER";

export interface RecordRevenueParams {
  source: RevenueSource;
  amount: number;
  currency?: "NGN" | "USD";
  sourceId?: string;
  description?: string;
}

/**
 * Record revenue and allocate using 50/30/20 split
 */
export async function recordRevenue(
  prisma: PrismaClient,
  params: RecordRevenueParams
) {
  const { source, amount, currency = "NGN", sourceId, description } = params;

  // Record revenue transaction
  const revenueTransaction = await prisma.revenueTransaction.create({
    data: {
      source,
      amount,
      currency,
      sourceId,
      description,
      status: "COMPLETED",
    },
  });

  // Allocate revenue (50/30/20 split)
  await allocateRevenue(prisma, revenueTransaction.id, amount);

  return revenueTransaction;
}

/**
 * Allocate revenue using 50/30/20 split
 * - 50% Company Reserve
 * - 30% Executive Pool (distributed daily at 8am)
 * - 20% Strategic Pools (5 pools, 4% each, distributed on-demand)
 */
async function allocateRevenue(
  prisma: PrismaClient,
  transactionId: string,
  amount: number
) {
  // 50% to Company Reserve
  const companyAmount = amount * 0.5;
  await prisma.revenueAllocation.create({
    data: {
      transactionId,
      destinationType: "COMPANY_RESERVE",
      amount: companyAmount,
      percentage: 50,
      status: "ALLOCATED",
    },
  });
  await prisma.companyReserve.upsert({
    where: { id: 1 },
    update: { balance: { increment: companyAmount } },
    create: { id: 1, balance: companyAmount },
  });

  // 30% to Executive Pool (pending daily distribution)
  const executiveAmount = amount * 0.3;
  await prisma.revenueAllocation.create({
    data: {
      transactionId,
      destinationType: "EXECUTIVE_POOL",
      amount: executiveAmount,
      percentage: 30,
      status: "PENDING",
    },
  });

  // 20% split among 5 strategic pools (4% each)
  const poolAmount = amount * 0.04;
  const poolTypes = [
    "LEADERSHIP",
    "STATE",
    "DIRECTORS",
    "TECHNOLOGY",
    "INVESTORS",
  ] as const;

  for (const poolType of poolTypes) {
    // Get or create pool
    const pool = await prisma.strategyPool.upsert({
      where: { type: poolType },
      update: { balance: { increment: poolAmount } },
      create: {
        type: poolType,
        balance: poolAmount,
      },
    });

    // Record allocation
    await prisma.revenueAllocation.create({
      data: {
        transactionId,
        destinationType: "STRATEGY_POOL",
        destinationId: pool.id,
        amount: poolAmount,
        percentage: 4,
        status: "PENDING",
      },
    });
  }
}

/**
 * Get revenue stats for dashboard
 */
export async function getRevenueStats(prisma: PrismaClient) {
  const [totalRevenue, companyReserve, executivePoolPending, strategicPools] =
    await Promise.all([
      prisma.revenueTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
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
          balance: true,
        },
      }),
    ]);

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    companyReserve: companyReserve?.balance || 0,
    executivePoolPending: executivePoolPending._sum.amount || 0,
    strategicPools: strategicPools.map((p) => ({
      type: p.type,
      balance: p.balance,
    })),
  };
}
