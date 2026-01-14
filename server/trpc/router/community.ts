import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const communityRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async () => {
    // Get total platform users
    const totalUsers = await prisma.user.count();
    
    // Get users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get users with palliative activated (those with palliativeActivated = true)
    const palliativeActiveUsers = await prisma.user.count({
      where: {
        palliativeActivated: true,
      },
    });

    // Get users with verified emails
    const verifiedUsers = await prisma.user.count({
      where: {
        emailVerified: {
          not: null,
        },
      },
    });

    // Get users by membership status
    const activeMembers = await prisma.user.count({
      where: {
        activated: true,
      },
    });

    // Get 7-day signup trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7DaysSignups = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: true,
    });

    // Process into daily counts
    const dailySignups = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const count = last7DaysSignups.filter(signup => {
        const signupDate = new Date(signup.createdAt);
        return signupDate >= date && signupDate < nextDay;
      }).reduce((sum, item) => sum + item._count, 0);

      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        signups: count,
      };
    });

    // Get today's signups
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaySignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // Get this week's signups
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: weekStart,
        },
      },
    });

    // Calculate active rate (users who logged in recently or have activity)
    // For now, we'll estimate based on verified emails
    const activeRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
    
    // Palliative activation rate
    const palliativeRate = totalUsers > 0 ? Math.round((palliativeActiveUsers / totalUsers) * 100) : 0;
    
    // Calculate growth trend percentage (comparing last 7 days to previous 7 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const previous7DaysSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
    });

    const current7DaysSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const growthTrend = previous7DaysSignups > 0 
      ? Math.round(((current7DaysSignups - previous7DaysSignups) / previous7DaysSignups) * 100)
      : current7DaysSignups > 0 ? 100 : 0;

    // Get level distribution across all users
    const allUsers = await prisma.user.findMany({
      select: {
        level1Count: true,
        level2Count: true,
        level3Count: true,
        level4Count: true,
      },
    });

    const totalLevelCounts = allUsers.reduce(
      (acc, user) => ({
        level1: acc.level1 + (user.level1Count || 0),
        level2: acc.level2 + (user.level2Count || 0),
        level3: acc.level3 + (user.level3Count || 0),
        level4: acc.level4 + (user.level4Count || 0),
      }),
      { level1: 0, level2: 0, level3: 0, level4: 0 }
    );

    return {
      platform: {
        totalUsers,
        activeMembers,
        verifiedUsers,
        palliativeActiveUsers,
        newUsersThisMonth,
        todaySignups,
        weekSignups,
        activeRate,
        palliativeRate,
        growthTrend,
      },
      levels: totalLevelCounts,
      dailySignups,
    };
  }),
});
