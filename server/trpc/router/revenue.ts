import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "../trpc";
import { Prisma } from "@prisma/client";

/**
 * Revenue Allocation Router
 * Handles all revenue tracking, allocation (50/30/20), and distribution
 */

export const revenueRouter = createTRPCRouter({
  /**
   * Record a revenue transaction and allocate it
   * Called by various revenue sources (payments, CSP, store, etc.)
   */
  recordRevenue: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "COMMUNITY_SUPPORT",
          "MEMBERSHIP_PURCHASE",
          "MEMBERSHIP_RENEWAL",
          "STORE_ORDER",
          "WITHDRAWAL_FEE_CASH",
          "WITHDRAWAL_FEE_BPT",
          "YOUTUBE_SUBSCRIPTION",
          "THIRD_PARTY_COMMISSION",
          "LEADERSHIP_POOL_FEE",
          "PALLIATIVE_DONATION",
          "OTHER",
        ]),
        amount: z.number().positive(),
        currency: z.enum(["NGN", "USD"]).default("NGN"),
        sourceId: z.string().optional(), // Reference to source transaction
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Record revenue transaction
      const revenueTransaction = await ctx.prisma.revenueTransaction.create({
        data: {
          source: input.source,
          amount: input.amount,
          currency: input.currency,
          sourceId: input.sourceId,
          description: input.description,
          status: "COMPLETED",
        },
      });

      // Allocate revenue (50/30/20 split)
      await allocateRevenue(ctx.prisma, revenueTransaction);

      return {
        success: true,
        transactionId: revenueTransaction.id,
        amount: revenueTransaction.amount,
      };
    }),

  /**
   * Get executive shareholders with their assignments
   */
  getExecutiveShareholders: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.executiveShareholder.findMany({
      include: {
        user: {
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
   * Assign user to executive role
   */
  assignExecutiveRole: adminProcedure
    .input(
      z.object({
        role: z.enum([
          "CEO",
          "CTO",
          "HEAD_OF_TRAVEL",
          "CMO",
          "OLIVER",
          "MORRISON",
          "ANNIE",
        ]),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if role is already assigned
      const existing = await ctx.prisma.executiveShareholder.findUnique({
        where: { role: input.role },
      });

      if (existing && existing.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Role ${input.role} is already assigned to another user`,
        });
      }

      // Assign or update
      const shareholder = await ctx.prisma.executiveShareholder.upsert({
        where: { role: input.role },
        update: { userId: input.userId },
        create: {
          role: input.role,
          userId: input.userId,
          percentage: getRolePercentage(input.role),
        },
        include: {
          user: {
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
          adminId: ctx.session.user.id,
          action: "ASSIGN_EXECUTIVE",
          targetRole: input.role,
          targetUserId: input.userId,
          metadata: {
            role: input.role,
            userId: input.userId,
          },
        },
      });

      return shareholder;
    }),

  /**
   * Remove user from executive role
   */
  removeExecutiveRole: adminProcedure
    .input(
      z.object({
        role: z.enum([
          "CEO",
          "CTO",
          "HEAD_OF_TRAVEL",
          "CMO",
          "OLIVER",
          "MORRISON",
          "ANNIE",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.executiveShareholder.update({
        where: { role: input.role },
        data: { userId: null },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session.user.id,
          action: "REMOVE_EXECUTIVE",
          targetRole: input.role,
          metadata: { role: input.role },
        },
      });

      return { success: true };
    }),

  /**
   * Get all strategic pools with members
   */
  getStrategicPools: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.strategyPool.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        allocations: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }),

  /**
   * Add member to strategic pool
   */
  addPoolMember: adminProcedure
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is already in this pool
      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: { members: true },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      const alreadyMember = pool.members.some(
        (m) => m.userId === input.userId
      );
      if (alreadyMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this pool",
        });
      }

      // Add member
      const member = await ctx.prisma.poolMember.create({
        data: {
          poolId: pool.id,
          userId: input.userId,
        },
        include: {
          user: {
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
          adminId: ctx.session.user.id,
          action: "ADD_POOL_MEMBER",
          targetPoolType: input.poolType,
          targetUserId: input.userId,
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
  removePoolMember: adminProcedure
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.poolMember.findUnique({
        where: { id: input.memberId },
        include: { pool: true },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      await ctx.prisma.poolMember.delete({
        where: { id: input.memberId },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session.user.id,
          action: "REMOVE_POOL_MEMBER",
          targetPoolType: member.pool.type,
          targetUserId: member.userId,
          metadata: {
            poolType: member.pool.type,
            userId: member.userId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Distribute strategic pool to members
   */
  distributePool: adminProcedure
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
      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: {
          members: true,
          allocations: {
            where: { status: "PENDING" },
          },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      if (pool.members.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot distribute to pool with no members",
        });
      }

      // Get total pending amount
      const totalAmount = pool.allocations.reduce(
        (sum, alloc) => sum + alloc.amount,
        0
      );

      if (totalAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No funds available to distribute",
        });
      }

      // Calculate share per member (equal split)
      const sharePerMember = totalAmount / pool.members.length;

      // Distribute to each member's shareholder wallet
      const distributions = [];
      for (const member of pool.members) {
        // Credit shareholder wallet
        await ctx.prisma.user.update({
          where: { id: member.userId },
          data: {
            shareholder: {
              increment: sharePerMember,
            },
          },
        });

        // Record distribution
        const dist = await ctx.prisma.poolAllocation.create({
          data: {
            poolId: pool.id,
            userId: member.userId,
            amount: sharePerMember,
            status: "DISTRIBUTED",
          },
        });
        distributions.push(dist);
      }

      // Mark allocations as distributed
      await ctx.prisma.revenueAllocation.updateMany({
        where: {
          id: { in: pool.allocations.map((a) => a.id) },
        },
        data: { status: "DISTRIBUTED" },
      });

      // Reset pool balance
      await ctx.prisma.strategyPool.update({
        where: { id: pool.id },
        data: { balance: 0 },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session.user.id,
          action: "DISTRIBUTE_POOL",
          targetPoolType: input.poolType,
          metadata: {
            poolType: input.poolType,
            totalAmount,
            memberCount: pool.members.length,
            sharePerMember,
          },
        },
      });

      return {
        success: true,
        totalAmount,
        memberCount: pool.members.length,
        sharePerMember,
        distributions,
      };
    }),

  /**
   * Get revenue dashboard stats
   */
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalRevenue,
      companyReserve,
      executivePool,
      strategicPools,
      recentTransactions,
      recentDistributions,
    ] = await Promise.all([
      // Total revenue
      ctx.prisma.revenueTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
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
        },
      }),
      // Strategic pools
      ctx.prisma.strategyPool.findMany({
        select: {
          type: true,
          balance: true,
        },
      }),
      // Recent transactions
      ctx.prisma.revenueTransaction.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Recent distributions
      ctx.prisma.executiveDistribution.findMany({
        include: {
          shareholder: {
            include: {
              user: {
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
      totalRevenue: totalRevenue._sum.amount || 0,
      companyReserve: companyReserve?.balance || 0,
      executivePoolPending: executivePool._sum.amount || 0,
      strategicPools: strategicPools.map((p) => ({
        type: p.type,
        balance: p.balance,
      })),
      recentTransactions,
      recentDistributions,
    };
  }),

  /**
   * Get revenue breakdown by source
   */
  getRevenueBreakdown: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.RevenueTransactionWhereInput = {
        status: "COMPLETED",
      };

      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = input.startDate;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }

      const breakdown = await ctx.prisma.revenueTransaction.groupBy({
        by: ["source"],
        _sum: { amount: true },
        _count: true,
        where,
      });

      return breakdown.map((item) => ({
        source: item.source,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count,
      }));
    }),

  /**
   * Search users for pool assignment
   */
  searchUsers: adminProcedure
    .input(
      z.object({
        query: z.string().min(2),
      })
    )
    .query(async ({ ctx, input }) => {
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
  getAdminActions: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.revenueAdminAction.findMany({
        include: {
          admin: {
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
});

/**
 * Helper: Allocate revenue using 50/30/20 split
 */
async function allocateRevenue(
  prisma: any,
  transaction: { id: string; amount: number }
) {
  const amount = transaction.amount;

  // 50% to Company Reserve
  const companyAmount = amount * 0.5;
  await prisma.revenueAllocation.create({
    data: {
      transactionId: transaction.id,
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

  // 30% to Executive Pool
  const executiveAmount = amount * 0.3;
  await prisma.revenueAllocation.create({
    data: {
      transactionId: transaction.id,
      destinationType: "EXECUTIVE_POOL",
      amount: executiveAmount,
      percentage: 30,
      status: "PENDING", // Will be distributed daily
    },
  });

  // 20% split among 5 strategic pools (4% each)
  const poolAmount = amount * 0.04; // 4% per pool

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
        transactionId: transaction.id,
        destinationType: "STRATEGY_POOL",
        destinationId: pool.id,
        amount: poolAmount,
        percentage: 4,
        status: "PENDING", // Will be distributed on-demand
      },
    });
  }
}

/**
 * Helper: Get percentage for executive role
 */
function getRolePercentage(
  role:
    | "CEO"
    | "CTO"
    | "HEAD_OF_TRAVEL"
    | "CMO"
    | "OLIVER"
    | "MORRISON"
    | "ANNIE"
): number {
  const percentages = {
    CEO: 30,
    CTO: 20,
    HEAD_OF_TRAVEL: 20,
    CMO: 10,
    OLIVER: 5,
    MORRISON: 5,
    ANNIE: 10,
  };
  return percentages[role];
}
