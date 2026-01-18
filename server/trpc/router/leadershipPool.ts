import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const leadershipPoolRouter = createTRPCRouter({
  getPoolInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    // Get total pool amount from all sources
    const pools = await prisma.leadershipPool.findMany();
    const totalPool = pools.reduce((sum, pool) => sum + pool.amount, 0);

    // Get user's qualification status
    const qualification = await prisma.leadershipPoolQualification.findUnique({
      where: { userId },
    });

    // Count total qualified members
    const members = await prisma.leadershipPoolQualification.count({
      where: { isQualified: true },
    });

    // Calculate user's share based on their pool share percentage
    const myShare = qualification?.isQualified
      ? totalPool * (qualification.poolSharePercentage / 100)
      : 0;

    // Get user's rank among qualified members
    const allQualified = await prisma.leadershipPoolQualification.findMany({
      where: { isQualified: true },
      orderBy: { poolSharePercentage: 'desc' },
      select: { userId: true },
    });
    const rank = allQualified.findIndex(q => q.userId === userId) + 1;

    return {
      totalPool,
      myShare,
      rank: rank || 0,
      members,
      isQualified: qualification?.isQualified || false,
      tier: qualification?.currentTier || null,
      sharePercentage: qualification?.poolSharePercentage || 0,
    };
  }),

  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      // Get top qualified members with user details
      const leaders = await prisma.leadershipPoolQualification.findMany({
        where: { isQualified: true },
        orderBy: { poolSharePercentage: 'desc' },
        take: input.limit,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      // Get total pool for earnings calculation
      const pools = await prisma.leadershipPool.findMany();
      const totalPool = pools.reduce((sum, pool) => sum + pool.amount, 0);

      // Get user's referral count from Referral table
      const formattedLeaders = await Promise.all(
        leaders.map(async (leader, index) => {
          const referrals = await prisma.referral.count({
            where: { referrerId: leader.userId },
          });

          return {
            rank: index + 1,
            userId: leader.userId,
            name: `${leader.User.firstname || ''} ${leader.User.lastname || ''}`.trim() || 'Anonymous',
            earnings: totalPool * (leader.poolSharePercentage / 100),
            sharePercentage: leader.poolSharePercentage,
            tier: leader.currentTier || 'Bronze',
            referrals,
          };
        })
      );

      // Find user's rank
      const allQualified = await prisma.leadershipPoolQualification.findMany({
        where: { isQualified: true },
        orderBy: { poolSharePercentage: 'desc' },
        select: { userId: true },
      });
      const myRank = allQualified.findIndex(q => q.userId === userId) + 1;

      return {
        leaders: formattedLeaders,
        myRank: myRank || 0,
      };
    }),

  claimPoolReward: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    // Check if user is qualified
    const qualification = await prisma.leadershipPoolQualification.findUnique({
      where: { userId },
    });

    if (!qualification?.isQualified) {
      return {
        success: false,
        amount: 0,
        message: "You are not qualified for leadership pool rewards",
      };
    }

    // Get total pool
    const pools = await prisma.leadershipPool.findMany();
    const totalPool = pools.reduce((sum, pool) => sum + pool.amount, 0);

    // Calculate claimable amount
    const claimableAmount = totalPool * (qualification.poolSharePercentage / 100);

    if (claimableAmount <= 0) {
      return {
        success: false,
        amount: 0,
        message: "No rewards available to claim at this time",
      };
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "LEADERSHIP_POOL_REWARD",
        amount: claimableAmount,
        description: `Leadership Pool Reward - ${qualification.currentTier || 'Bronze'} Tier`,
        status: "completed",
        reference: `LP-${Date.now()}`,
      },
    });

    // Update user's wallet balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        wallet: {
          increment: claimableAmount,
        },
      },
    });

    return {
      success: true,
      amount: claimableAmount,
      message: `Successfully claimed ${claimableAmount}`,
    };
  }),

  getMyPoolHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    // Get user's leadership pool reward transactions
    const history = await prisma.transaction.findMany({
      where: {
        userId,
        transactionType: "LEADERSHIP_POOL_REWARD",
        status: "completed",
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return history.map(record => ({
      id: record.id,
      amount: record.amount,
      description: record.description,
      date: record.createdAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      period: new Date(record.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      reference: record.reference || '',
    }));
  }),

  getPoolSources: protectedProcedure.query(async ({ ctx }) => {
    // Get all pool sources
    const sources = await prisma.leadershipPool.findMany({
      orderBy: { amount: 'desc' },
    });

    const totalPool = sources.reduce((sum, pool) => sum + pool.amount, 0);

    return sources.map(source => ({
      id: source.id,
      name: source.source,
      amount: source.amount,
      description: source.description,
      percentage: totalPool > 0 ? (source.amount / totalPool) * 100 : 0,
    }));
  }),

  getPoolSettings: protectedProcedure.query(async () => {
    // Get Leadership Pool admin settings
    const settings = await prisma.adminSettings.findMany({
      where: {
        settingKey: {
          in: ['leadershipPoolAmount', 'leadershipPoolEnabled', 'leadershipPoolMaxParticipants'],
        },
      },
    });

    return {
      amount: parseInt(settings.find(s => s.settingKey === 'leadershipPoolAmount')?.settingValue || '50000000'),
      enabled: settings.find(s => s.settingKey === 'leadershipPoolEnabled')?.settingValue === 'true',
      maxParticipants: parseInt(settings.find(s => s.settingKey === 'leadershipPoolMaxParticipants')?.settingValue || '100'),
    };
  }),
});
