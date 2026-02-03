/**
 * Revenue Service
 * Centralized service for recording revenue from all sources
 */

import { PrismaClient } from "@prisma/client";

export type RevenueSource =
  | "COMMUNITY_SUPPORT"
  | "MEMBERSHIP_REGISTRATION"
  | "MEMBERSHIP_RENEWAL"
  | "STORE_PURCHASE"
  | "WITHDRAWAL_FEE"
  | "YOUTUBE_SUBSCRIPTION"
  | "THIRD_PARTY_SERVICES"
  | "PALLIATIVE_PROGRAM"
  | "LEADERSHIP_POOL_FEE"
  | "TRAINING_CENTER"
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

  // Use transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // Check for duplicate by sourceId
    if (sourceId) {
      const existing = await tx.revenueTransaction.findFirst({
        where: { sourceId },
      });
      if (existing) {
        throw new Error(`Revenue already recorded for sourceId: ${sourceId}`);
      }
    }

    // Record revenue transaction
    const revenueTransaction = await tx.revenueTransaction.create({
      data: {
        source,
        amount,
        currency,
        sourceId,
        description,
        allocationStatus: "PENDING",
      },
    });

    // Allocate revenue (50/30/20 split)
    await allocateRevenue(tx, revenueTransaction.id, amount);

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
  amount: number
) {
  // 50% to Company Reserve
  const companyAmount = amount * 0.5;
  await prisma.revenueAllocation.create({
    data: {
      revenueTransactionId: transactionId,
      destinationType: "COMPANY_RESERVE",
      amount: companyAmount,
      percentage: 50,
      status: "ALLOCATED",
    },
  });
  await prisma.companyReserve.upsert({
    where: { id: 1 },
    update: { 
      balance: { increment: companyAmount },
      totalReceived: { increment: companyAmount },
    },
    create: { 
      id: 1, 
      balance: companyAmount,
      totalReceived: companyAmount,
    },
  });

  // 30% to Executive Pool (pending daily distribution)
  const executiveAmount = amount * 0.3;
  await prisma.revenueAllocation.create({
    data: {
      revenueTransactionId: transactionId,
      destinationType: "EXECUTIVE_POOL",
      amount: executiveAmount,
      percentage: 30,
      status: "PENDING",
    },
  });

  // 20% split among 5 strategic pools (4% each)
  const poolAmount = amount * 0.04;
  const poolConfigs = [
    { type: "LEADERSHIP", name: "Leadership Pool" },
    { type: "STATE", name: "State Pool" },
    { type: "DIRECTORS", name: "Directors Pool" },
    { type: "TECHNOLOGY", name: "Technology Pool" },
    { type: "INVESTORS", name: "Investors Pool" },
  ] as const;

  for (const { type: poolType, name } of poolConfigs) {
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
    strategicPools: strategicPools.map((p) => ({
      type: p.type,
      name: p.name,
      balance: p.balance,
    })),
  };
}
