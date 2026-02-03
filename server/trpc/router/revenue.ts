import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use the centralized service instead
      const { recordRevenue } = await import("../../services/revenue.service");
      
      const revenueTransaction = await recordRevenue(ctx.prisma, {
        source: input.source,
        amount: input.amount,
        currency: input.currency,
        sourceId: input.sourceId,
        description: input.description,
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
   * Assign user to executive role
   */
  assignExecutiveRole: protectedProcedure
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
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

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
          adminId: ctx.session!.user.id,
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
  removeExecutiveRole: protectedProcedure
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
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      await ctx.prisma.executiveShareholder.update({
        where: { role: input.role },
        data: { userId: null },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
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
  getStrategicPools: protectedProcedure.query(async ({ ctx }) => {
    // Admin check
    if ((ctx.session?.user as any)?.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Check if user is already in this pool
      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: { Members: true },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      const alreadyMember = pool.Members.some(
        (m: any) => m.userId === input.userId && m.isActive
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
          addedBy: ctx.session!.user.id,
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

      // Get pending allocations for this pool
      const pendingAllocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          destinationId: pool.id,
          destinationType: "STRATEGY_POOL",
          status: "PENDING",
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

      // Calculate share per member (equal split)
      const sharePerMember = totalAmount / pool.Members.length;

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
              memberCount: pool.Members.length,
              amountPerMember: Number(allocation.amount) / pool.Members.length,
              status: "COMPLETED",
              distributedAt: new Date(),
              distributedBy: ctx.session!.user.id,
            },
          });
          distributions.push(poolDist);
        }

        // Distribute to each member's shareholder wallet
        for (const member of pool.Members) {
          await tx.user.update({
            where: { id: member.userId },
            data: {
              shareholder: {
                increment: sharePerMember,
              },
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

        // Update pool balance
        await tx.strategyPool.update({
          where: { id: pool.id },
          data: { balance: { decrement: totalAmount } },
        });

        return { distributions, totalAmount, sharePerMember };
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "POOL_DISTRIBUTED",
          description: `Distributed ₦${result.totalAmount.toLocaleString()} to ${pool.Members.length} members`,
          metadata: {
            poolType: input.poolType,
            totalAmount: result.totalAmount,
            memberCount: pool.Members.length,
            sharePerMember: result.sharePerMember,
          },
        },
      });

      return {
        success: true,
        totalAmount: result.totalAmount,
        memberCount: pool.Members.length,
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
          where: { allocationStatus: "ALLOCATED" },
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
            name: true,
            balance: true,
          },
        }),
        // Recent transactions
        ctx.prisma.revenueTransaction.findMany({
          where: { allocationStatus: "ALLOCATED" },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        // Recent distributions
        ctx.prisma.executiveDistribution.findMany({
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

      return breakdown.map((item: any) => ({
        source: item.source,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count,
      }));
    }),

  /**
   * Search users for pool assignment
   */
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
      })
    )
    .query(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

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
});

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
