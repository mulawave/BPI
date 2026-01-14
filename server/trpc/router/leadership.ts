import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Helper function to send leadership notifications
async function sendLeadershipNotification(
  userId: string,
  type: string,
  data: {
    title: string;
    message: string;
    color?: string;
    icon?: string;
    metadata?: any;
  }
) {
  await prisma.notification.create({
    data: {
      id: randomUUID(),
      userId,
      title: data.title,
      message: data.message,
      link: "/dashboard", // Link to dashboard where Leadership Pool modal can be opened
      isRead: false,
    },
  });
}

// Helper to check and send milestone notifications
async function checkAndSendMilestones(
  userId: string,
  directCount: number,
  firstGenCount: number,
  secondGenCount: number
) {
  // Option 1 milestones
  const option1Milestones = [
    { count: 10, name: "10_sponsors", title: "10 Sponsors!", message: "Great start! You've sponsored 10 Regular Plus members. Only 60 more to qualify!" },
    { count: 25, name: "25_sponsors", title: "25 Sponsors - Halfway!", message: "You're making progress! 25 sponsors completed. Keep going!" },
    { count: 50, name: "50_sponsors", title: "50 Sponsors - Amazing!", message: "Incredible! You've reached 50 sponsors. Just 20 more to qualify!" },
    { count: 70, name: "70_sponsors", title: "🎉 Qualified!", message: "Congratulations! You've qualified for the ₦50M Leadership Pool via Option 1!" },
  ];

  for (const milestone of option1Milestones) {
    if (directCount >= milestone.count) {
      await sendLeadershipNotification(userId, "LEADERSHIP_MILESTONE", {
        title: milestone.title,
        message: milestone.message,
        metadata: { milestone: milestone.name, count: directCount },
      });
    }
  }

  // Option 2 milestones
  if (firstGenCount >= 50 && secondGenCount >= 50) {
    await sendLeadershipNotification(userId, "LEADERSHIP_QUALIFIED", {
      title: "🎉 Qualified via Option 2!",
      message: "Congratulations! You've qualified for the ₦50M Leadership Pool with your amazing team!",
      color: "from-green-500 to-emerald-500",
      icon: "Trophy",
      metadata: { qualificationPath: "option2" },
    });
  }
}

export const leadershipRouter = createTRPCRouter({
  // Get user's qualification progress
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("Unauthorized");
    }
    const userId = (ctx.session.user as any).id;

    // Get or create qualification record
    let qualification = await prisma.leadershipPoolQualification.findUnique({
      where: { userId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            activeMembershipPackageId: true,
          },
        },
      },
    });

    if (!qualification) {
      qualification = await prisma.leadershipPoolQualification.create({
        data: { id: randomUUID(), userId, updatedAt: new Date() },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              activeMembershipPackageId: true,
            },
          },
        },
      });
    }

    // First, get the package IDs for Regular Plus and higher
    const eligiblePackages = await prisma.membershipPackage.findMany({
      where: {
        name: { in: ['Regular Plus', 'Premium', 'Gold', 'Platinum', 'Diamond'] },
      },
      select: { id: true },
    });
    const eligiblePackageIds = eligiblePackages.map(p => p.id);

    // Get direct referrals from Referral table (Option 1 count)
    const directReferrals = await prisma.referral.findMany({
      where: {
        referrerId: userId,
      },
      include: {
        User_Referral_referredIdToUser: {
          select: {
            id: true,
            activeMembershipPackageId: true,
          },
        },
      },
    });

    // Filter for Regular Plus+ referrals
    const directRegularPlus = directReferrals.filter(ref => 
      ref.User_Referral_referredIdToUser.activeMembershipPackageId && 
      eligiblePackageIds.includes(ref.User_Referral_referredIdToUser.activeMembershipPackageId)
    );
    const directSponsors = directRegularPlus.length;

    // Get first generation users (for Option 2)
    const firstGenUserIds = directRegularPlus.map(ref => ref.User_Referral_referredIdToUser.id);
    
    // Get second generation count (referrals of your referrals)
    const secondGenReferrals = await prisma.referral.findMany({
      where: {
        referrerId: { in: firstGenUserIds },
      },
      include: {
        User_Referral_referredIdToUser: {
          select: {
            activeMembershipPackageId: true,
          },
        },
      },
    });

    const secondGenRegularPlus = secondGenReferrals.filter(ref =>
      ref.User_Referral_referredIdToUser.activeMembershipPackageId &&
      eligiblePackageIds.includes(ref.User_Referral_referredIdToUser.activeMembershipPackageId)
    );
    const secondGenCount = secondGenRegularPlus.length;

    // Check if user has Regular Plus or higher by looking up their package
    const userPackage = qualification.User.activeMembershipPackageId
      ? await prisma.membershipPackage.findUnique({
          where: { id: qualification.User.activeMembershipPackageId },
          select: { name: true },
        })
      : null;

    const isRegularPlus = userPackage?.name && 
      ['Regular Plus', 'Premium', 'Gold', 'Platinum', 'Diamond'].includes(userPackage.name);

    // Calculate progress
    const option1Progress = Math.min((directSponsors / 70) * 100, 100);
    const option2Progress = Math.min(
      ((firstGenUserIds.length / 50) * 50 + (secondGenCount / 50) * 50),
      100
    );

    // Determine next milestone
    let nextMilestone = null;
    let nextSteps = [];

    if (!isRegularPlus) {
      nextSteps.push({
        step: 1,
        title: "Upgrade to Regular Plus",
        description: "Activate or upgrade your membership to Regular Plus",
        completed: false,
        action: "upgrade",
      });
    } else {
      nextSteps.push({
        step: 1,
        title: "Upgrade to Regular Plus",
        description: "Membership status verified",
        completed: true,
      });

      if (directSponsors < 70) {
        const remaining = 70 - directSponsors;
        nextSteps.push({
          step: 2,
          title: `Sponsor ${remaining} more Regular Plus members`,
          description: `Option 1: You have ${directSponsors}/70 sponsors (${option1Progress.toFixed(1)}% complete)`,
          completed: false,
          action: "invite",
        });

        if (directSponsors >= 10 && directSponsors < 25) {
          nextMilestone = "25_sponsors";
        } else if (directSponsors >= 25 && directSponsors < 50) {
          nextMilestone = "50_sponsors";
        } else if (directSponsors >= 50 && directSponsors < 70) {
          nextMilestone = "completion";
        }
      }

      if (firstGenUserIds.length < 50 || secondGenCount < 50) {
        const firstGenRemaining = Math.max(0, 50 - firstGenUserIds.length);
        const secondGenRemaining = Math.max(0, 50 - secondGenCount);
        
        nextSteps.push({
          step: 3,
          title: "Complete Option 2 (Alternative Path)",
          description: `First Gen: ${firstGenUserIds.length}/50, Second Gen: ${secondGenCount}/50`,
          completed: false,
          action: "invite",
          details: {
            firstGenRemaining,
            secondGenRemaining,
            progress: option2Progress,
          },
        });
      }
    }

    // Get total qualified count
    const totalQualified = await prisma.leadershipPoolQualification.count({
      where: { isQualified: true },
    });

    const spotsRemaining = Math.max(0, 100 - totalQualified);

    // Check and send milestone notifications
    await checkAndSendMilestones(
      userId,
      directSponsors,
      firstGenUserIds.length,
      secondGenCount
    );

    // Update the qualification record with latest counts
    await prisma.leadershipPoolQualification.update({
      where: { userId },
      data: {
        hasRegularPlusPackage: isRegularPlus || false,
        sponsoredRegularPlus: directSponsors,
        firstGenRegularPlus: firstGenUserIds.length,
        secondGenRegularPlus: secondGenCount,
      },
    });

    return {
      qualification,
      currentProgress: {
        isRegularPlus,
        option1: {
          directCount: directSponsors,
          required: 70,
          percentage: option1Progress,
          qualified: directSponsors >= 70,
        },
        option2: {
          firstGenCount: firstGenUserIds.length,
          secondGenCount,
          firstGenRequired: 50,
          secondGenRequired: 50,
          percentage: option2Progress,
          qualified: firstGenUserIds.length >= 50 && secondGenCount >= 50,
        },
      },
      nextSteps,
      nextMilestone,
      spotsRemaining,
      totalQualified,
      isQualified: qualification.isQualified,
      qualificationRank: null,
    };
  }),

  // Get leaderboard (top 100 qualified members)
  getLeaderboard: publicProcedure.query(async () => {
    const leaderboard = await prisma.leadershipPoolQualification.findMany({
      where: { isQualified: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true,
          },
        },
      },
    });

    return leaderboard.map((qual: any, index: any) => ({
      rank: index + 1,
      userId: qual.User.id,
      name: qual.User.name,
      image: qual.User.image,
      userRank: qual.User.rank,
      qualifiedAt: qual.qualifiedAt,
      qualificationPath: qual.qualificationOption === 1 ? 'option1' : 'option2',
      totalDistributed: 0,
    }));
  }),

  // Update qualification status (called by cron or admin)
  updateQualificationStatus: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const userId = input.userId;

      // Get qualification record
      let qualification = await prisma.leadershipPoolQualification.findUnique({
        where: { userId },
      });

      if (!qualification) {
        qualification = await prisma.leadershipPoolQualification.create({
          data: { id: randomUUID(), userId, updatedAt: new Date() },
        });
      }

      // Check if user is Regular Plus
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeMembershipPackageId: true },
      });

      // Get user's package if they have one
      const userPackage = user?.activeMembershipPackageId
        ? await prisma.membershipPackage.findUnique({
            where: { id: user.activeMembershipPackageId },
            select: { name: true },
          })
        : null;

      const isRegularPlus = userPackage?.name && 
        ['Regular Plus', 'Premium', 'Gold', 'Platinum', 'Diamond'].includes(userPackage.name);

      // Get eligible package IDs
      const eligiblePackages = await prisma.membershipPackage.findMany({
        where: {
          name: { in: ['Regular Plus', 'Premium', 'Gold', 'Platinum', 'Diamond'] },
        },
        select: { id: true },
      });
      const eligiblePackageIds = eligiblePackages.map(p => p.id);

      // Count sponsors using Referral table
      const directReferrals = await prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          User_Referral_referredIdToUser: {
            select: {
              id: true,
              activeMembershipPackageId: true,
            },
          },
        },
      });

      const directRegularPlus = directReferrals.filter(ref =>
        ref.User_Referral_referredIdToUser.activeMembershipPackageId &&
        eligiblePackageIds.includes(ref.User_Referral_referredIdToUser.activeMembershipPackageId)
      );
      const directSponsors = directRegularPlus.length;
      const firstGenUserIds = directRegularPlus.map(ref => ref.User_Referral_referredIdToUser.id);

      const secondGenReferrals = await prisma.referral.findMany({
        where: { referrerId: { in: firstGenUserIds } },
        include: {
          User_Referral_referredIdToUser: {
            select: { activeMembershipPackageId: true },
          },
        },
      });

      const secondGenCount = secondGenReferrals.filter(ref =>
        ref.User_Referral_referredIdToUser.activeMembershipPackageId &&
        eligiblePackageIds.includes(ref.User_Referral_referredIdToUser.activeMembershipPackageId)
      ).length;

      // Check qualification
      const option1Qualified = isRegularPlus && directSponsors >= 70;
      const option2Qualified = isRegularPlus && firstGenUserIds.length >= 50 && secondGenCount >= 50;

      const isNowQualified = option1Qualified || option2Qualified;

      // If newly qualified and spots available
      if (isNowQualified && !qualification.isQualified) {
        const currentQualifiedCount = await prisma.leadershipPoolQualification.count({
          where: { isQualified: true },
        });

        if (currentQualifiedCount < 100) {
          await prisma.leadershipPoolQualification.update({
            where: { userId },
            data: {
              isQualified: true,
              qualifiedAt: new Date(),
              hasRegularPlusPackage: isRegularPlus || false,
              sponsoredRegularPlus: directSponsors,
              firstGenRegularPlus: firstGenUserIds.length,
              secondGenRegularPlus: secondGenCount,
              qualificationOption: option1Qualified ? 1 : 2,
            },
          });

          return { success: true, qualified: true, rank: currentQualifiedCount + 1 };
        }
      } else {
        // Update progress even if not qualified yet
        await prisma.leadershipPoolQualification.update({
          where: { userId },
          data: {
            hasRegularPlusPackage: isRegularPlus || false,
            sponsoredRegularPlus: directSponsors,
            firstGenRegularPlus: firstGenUserIds.length,
            secondGenRegularPlus: secondGenCount,
          },
        });
      }

      return { success: true, qualified: false };
    }),

  // Get challenge statistics (public)
  getChallengeStats: publicProcedure.query(async () => {
    const totalQualified = await prisma.leadershipPoolQualification.count({
      where: { isQualified: true },
    });

    const spotsRemaining = Math.max(0, 100 - totalQualified);

    const option1Qualified = await prisma.leadershipPoolQualification.count({
      where: {
        isQualified: true,
        qualificationOption: 1,
      },
    });

    const option2Qualified = await prisma.leadershipPoolQualification.count({
      where: {
        isQualified: true,
        qualificationOption: 2,
      },
    });

    const totalParticipants = await prisma.leadershipPoolQualification.count({
      where: { hasRegularPlusPackage: true },
    });

    return {
      totalQualified,
      spotsRemaining,
      option1Qualified,
      option2Qualified,
      totalParticipants,
      challengeActive: spotsRemaining > 0,
    };
  }),

  // ========== ADMIN ENDPOINTS ==========

  // Get all qualified members (admin only)
  adminGetAllQualified: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Add admin role check
      // if (ctx.session.user.role !== 'admin') throw new Error("Admin only");

      const qualified = await prisma.leadershipPoolQualification.findMany({
        where: { isQualified: true },
        orderBy: { qualifiedAt: 'asc' },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              mobile: true,
              createdAt: true,
            },
          },
        },
      });

      return qualified;
    }),

  // Get all participants and their progress (admin only)
  adminGetAllParticipants: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        filter: z.enum(['all', 'qualified', 'in_progress', 'close_to_qualifying']).optional().default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO: Add admin role check

      let where: any = {};

      if (input.filter === 'qualified') {
        where.isQualified = true;
      } else if (input.filter === 'in_progress') {
        where.hasRegularPlusPackage = true;
        where.isQualified = false;
      } else if (input.filter === 'close_to_qualifying') {
        where.hasRegularPlusPackage = true;
        where.isQualified = false;
        where.OR = [
          { sponsoredRegularPlus: { gte: 63 } }, // 90% of 70
          { 
            AND: [
              { firstGenRegularPlus: { gte: 45 } },
              { secondGenRegularPlus: { gte: 45 } },
            ],
          },
        ];
      }

      const participants = await prisma.leadershipPoolQualification.findMany({
        where,
        skip: input.offset,
        take: input.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      const total = await prisma.leadershipPoolQualification.count({ where });

      return {
        participants,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Manually adjust qualification status (admin only)
  adminSetQualification: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        qualified: z.boolean(),
        rank: z.number().optional(),
        path: z.enum(['option1', 'option2']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Add admin role check

      const qualification = await prisma.leadershipPoolQualification.findUnique({
        where: { userId: input.userId },
      });

      if (!qualification) {
        throw new Error("User not found in leadership challenge");
      }

      if (input.qualified) {
        // Manually qualify user
        const rank = input.rank || (await prisma.leadershipPoolQualification.count({
          where: { isQualified: true },
        })) + 1;

        await prisma.leadershipPoolQualification.update({
          where: { userId: input.userId },
          data: {
            isQualified: true,
            qualifiedAt: new Date(),
            qualificationOption: input.path === 'option2' ? 2 : 1,
          },
        });

        // Send notification
        await sendLeadershipNotification(input.userId, "LEADERSHIP_QUALIFIED", {
          title: "🎉 Manually Qualified!",
          message: `Congratulations! An administrator has qualified you for the Leadership Pool at rank #${rank}!`,
          color: "from-green-500 to-emerald-500",
        });

        return { success: true, rank };
      } else {
        // Disqualify user
        await prisma.leadershipPoolQualification.update({
          where: { userId: input.userId },
          data: {
            isQualified: false,
            qualifiedAt: null,
            qualificationOption: null,
          },
        });

        return { success: true };
      }
    }),

  // Send bulk notification to participants (admin only)
  adminSendBulkNotification: protectedProcedure
    .input(
      z.object({
        targetGroup: z.enum(['all_qualified', 'all_participants', 'close_to_qualifying']),
        title: z.string(),
        message: z.string(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Add admin role check

      let userIds: string[] = [];

      if (input.targetGroup === 'all_qualified') {
        const qualified = await prisma.leadershipPoolQualification.findMany({
          where: { isQualified: true },
          select: { userId: true },
        });
        userIds = qualified.map((q: any) => q.userId);
      } else if (input.targetGroup === 'all_participants') {
        const participants = await prisma.leadershipPoolQualification.findMany({
          where: { hasRegularPlusPackage: true },
          select: { userId: true },
        });
        userIds = participants.map((q: any) => q.userId);
      } else if (input.targetGroup === 'close_to_qualifying') {
        const closeUsers = await prisma.leadershipPoolQualification.findMany({
          where: {
            hasRegularPlusPackage: true,
            isQualified: false,
            OR: [
              { sponsoredRegularPlus: { gte: 63 } },
              { 
                AND: [
                  { firstGenRegularPlus: { gte: 45 } },
                  { secondGenRegularPlus: { gte: 45 } },
                ],
              },
            ],
          },
          select: { userId: true },
        });
        userIds = closeUsers.map((q: any) => q.userId);
      }

      // Send notification to all targeted users
      for (const userId of userIds) {
        await sendLeadershipNotification(userId, "LEADERSHIP_ANNOUNCEMENT", {
          title: input.title,
          message: input.message,
          color: input.color || "from-blue-500 to-indigo-500",
        });
      }

      return { success: true, sentTo: userIds.length };
    }),

  // Get challenge analytics (admin only)
  adminGetAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Add admin role check

      const totalQualified = await prisma.leadershipPoolQualification.count({
        where: { isQualified: true },
      });

      const totalParticipants = await prisma.leadershipPoolQualification.count({
        where: { hasRegularPlusPackage: true },
      });

      const option1Count = await prisma.leadershipPoolQualification.count({
        where: { isQualified: true, qualificationOption: 1 },
      });

      const option2Count = await prisma.leadershipPoolQualification.count({
        where: { isQualified: true, qualificationOption: 2 },
      });

      const closeToQualifying = await prisma.leadershipPoolQualification.count({
        where: {
          hasRegularPlusPackage: true,
          isQualified: false,
          OR: [
            { sponsoredRegularPlus: { gte: 60 } },
            { 
              AND: [
                { firstGenRegularPlus: { gte: 40 } },
                { secondGenRegularPlus: { gte: 40 } },
              ],
            },
          ],
        },
      });

      // Get recent qualifications (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentQualifications = await prisma.leadershipPoolQualification.count({
        where: {
          isQualified: true,
          qualifiedAt: { gte: sevenDaysAgo },
        },
      });

      return {
        totalQualified,
        totalParticipants,
        spotsRemaining: 100 - totalQualified,
        option1Qualified: option1Count,
        option2Qualified: option2Count,
        closeToQualifying,
        recentQualifications,
        qualificationRate: totalParticipants > 0 
          ? ((totalQualified / totalParticipants) * 100).toFixed(1)
          : '0',
      };
    }),
});
