import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const bpiRouter = createTRPCRouter({
  // Get or create BPI member profile
    getBpiMember: protectedProcedure
    .query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
    }
    
    const userId = (ctx.session.user as any).id;

    let member = await ctx.prisma.bpiMember.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    });

    // Create BPI member if doesn't exist
    if (!member) {
      member = await ctx.prisma.bpiMember.create({
        data: {
          userId,
          referralLink: Math.random().toString(36).substring(2, 15)
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true
            }
          }
        }
      });
    }

    return member;
  }),

  // Get account summary with assets and earnings
  getAccountSummary: protectedProcedure
    .query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
    }

    const userId = (ctx.session.user as any).id;
    
    const member = await ctx.prisma.bpiMember.findUnique({
      where: { userId }
    });

    if (!member) {
      return {
        totalAssets: 0,
        youtubeEarnings: 0,
        wallet: 0,
        spendable: 0,
        cashback: 0
      };
    }

    // Calculate total assets
    const totalAssets = member.wallet + member.spendable + member.cashback;

    // Get YouTube earnings from transactions
    const youtubeEarnings = await ctx.prisma.transaction.aggregate({
      where: {
        userId,
        transactionType: "youtube_earning",
        status: "successful"
      },
      _sum: {
        amount: true
      }
    });

    return {
      totalAssets,
      youtubeEarnings: youtubeEarnings._sum.amount || 0,
      wallet: member.wallet,
      spendable: member.spendable,
      cashback: member.cashback,
      membershipType: member.membershipType,
      isActivated: member.isActivated,
      defaultCurrency: member.defaultCurrency
    };
  }),

  // Get profile completion status
    getProfileStatus: protectedProcedure
    .query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
    }

    const userId = (ctx.session.user as any).id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        bpiMember: true
      }
    });

    if (!user) return { completionPercentage: 0, missingFields: [] };

    const requiredFields = ['name', 'email'];
    const memberFields = ['profilePic'];
    
    let completedFields = 0;
    const missingFields = [];

    // Check user fields
    requiredFields.forEach(field => {
      if (user[field as keyof typeof user]) {
        completedFields++;
      } else {
        missingFields.push(field);
      }
    });

    // Check member fields
    if (user.bpiMember) {
      memberFields.forEach(field => {
        if ((user.bpiMember as any)?.[field]) {
          completedFields++;
        } else {
          missingFields.push(field);
        }
      });
    } else {
      missingFields.push(...memberFields);
    }

    const totalFields = requiredFields.length + memberFields.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      completionPercentage,
      missingFields,
      isComplete: completionPercentage === 100
    };
  }),

  // Get community statistics
  getCommunityStats: publicProcedure.query(async ({ ctx }) => {
    // Get or create stats record
    let stats = await ctx.prisma.communityStats.findFirst();
    
    if (!stats) {
      // Create initial stats
      const totalMembers = await ctx.prisma.user.count();
      const palliativeMembers = await ctx.prisma.bpiMember.count({
        where: { isActivated: true }
      });
      const totalPartners = await ctx.prisma.partner.count({
        where: { status: true }
      });
      const totalOffers = await ctx.prisma.partnerOffer.count({
        where: { status: true }
      });
      const activeTickets = await ctx.prisma.palliativeTicket.count({
        where: { status: "active" }
      });

      stats = await ctx.prisma.communityStats.create({
        data: {
          totalMembers,
          palliativeMembers,
          totalPartners,
          totalOffers,
          activeTickets
        }
      });
    }

    return stats;
  }),

  // Get leadership pool information
  getLeadershipPool: publicProcedure.query(async ({ ctx }) => {
    const pools = await ctx.prisma.leadershipPool.findMany();
    
    // Calculate total pool value
    const totalPoolValue = pools.reduce((sum: number, pool: any) => sum + pool.amount, 0);
    
    return {
      pools,
      totalPoolValue,
      lastUpdated: new Date()
    };
  }),

  // Get recent transactions
  getRecentTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10)
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
      }
      
      const userId = (ctx.session.user as any).id;
      
      return await ctx.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: {
          id: true,
          transactionType: true,
          amount: true,
          description: true,
          status: true,
          createdAt: true
        }
      });
    }),

  // Submit YouTube channel
  submitYoutubeChannel: protectedProcedure
    .input(z.object({
      channelName: z.string().min(1, "Channel name is required"),
      channelUrl: z.string().url("Please provide a valid YouTube URL"),
      subscribers: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
      }
      
      const userId = (ctx.session.user as any).id;
      
      // Check if user already has a channel
      const existingChannel = await ctx.prisma.youtubeChannel.findFirst({
        where: { userId }
      });

      if (existingChannel) {
        throw new Error("You already have a submitted channel. Please contact support to update it.");
      }

      return await ctx.prisma.youtubeChannel.create({
        data: {
          userId,
          channelName: input.channelName,
          channelUrl: input.channelUrl,
          subscribers: input.subscribers
        }
      });
    }),

  // Get verified YouTube channels
  getVerifiedChannels: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20)
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.youtubeChannel.findMany({
        where: { 
          status: "verified",
          verified: true 
        },
        orderBy: { subscribers: 'desc' },
        take: input.limit,
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });
    }),

  // Get user's palliative tickets
  getMyTickets: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" });
    }
    
    const userId = (ctx.session.user as any).id;
    
    return await ctx.prisma.palliativeTicket.findMany({
      where: { userId },
      include: {
        offer: {
          include: {
            partner: true
          }
        },
        category: true,
        creator: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }),

  // Get recent palliative tickets (public)
  getRecentTickets: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10)
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.palliativeTicket.findMany({
        where: { status: "active" },
        include: {
          offer: {
            include: {
              partner: true
            }
          },
          category: true,
          creator: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      });
    }),

  // Get partner offers
  getPartnerOffers: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20)
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.partnerOffer.findMany({
        where: { status: true },
        include: {
          partner: true
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      });
    }),
});