import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const thirdPartyPlatformsRouter = createTRPCRouter({
  // Get all active platforms for current user (filtered - exclude completed ones)
  getAvailablePlatforms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;

    // Get all active platforms
    const allPlatforms = await ctx.prisma.thirdPartyPlatform.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Get platforms user has already submitted
    const userSubmittedPlatforms = await ctx.prisma.userThirdPartyLink.findMany({
      where: { userId },
      select: { platformId: true },
    });

    const submittedPlatformIds = new Set(
      userSubmittedPlatforms.map((link: { platformId: string }) => link.platformId)
    );

    // Filter out platforms user has already submitted
    const availablePlatforms = allPlatforms.filter(
      (platform: any) => !submittedPlatformIds.has(platform.id)
    );

    // Get user's sponsor to show their links
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { sponsorId: true },
    });

    // For each available platform, get the appropriate referral link
    const platformsWithLinks = await Promise.all(
      availablePlatforms.map(async (platform: any) => {
        let referralLink = platform.adminDefaultLink;
        let linkOwner = "BPI Admin";

        if (user?.sponsorId) {
          // Check if sponsor has submitted a link for this platform
          const sponsorLink = await ctx.prisma.userThirdPartyLink.findUnique({
            where: {
              userId_platformId: {
                userId: user.sponsorId,
                platformId: platform.id,
              },
            },
            include: {
              User: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          });

          if (sponsorLink) {
            referralLink = sponsorLink.referralLink;
            linkOwner = `${sponsorLink.User.firstname || ''} ${sponsorLink.User.lastname || ''}`.trim() || "Your Sponsor";
          }
        }

        return {
          ...platform,
          referralLink,
          linkOwner,
        };
      })
    );

    return platformsWithLinks;
  }),

  // Submit user's referral link for a platform
  submitReferralLink: protectedProcedure
    .input(
      z.object({
        platformId: z.string(),
        referralLink: z.string().url({ message: "Please enter a valid URL" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;

      // Check if platform exists and is active
      const platform = await ctx.prisma.thirdPartyPlatform.findFirst({
        where: {
          id: input.platformId,
          isActive: true,
        },
      });

      if (!platform) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found or inactive",
        });
      }

      // Check if user already submitted a link for this platform
      const existingLink = await ctx.prisma.userThirdPartyLink.findUnique({
        where: {
          userId_platformId: {
            userId,
            platformId: input.platformId,
          },
        },
      });

      if (existingLink) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already submitted a link for this platform",
        });
      }

      // Create the user's referral link
      const userLink = await ctx.prisma.userThirdPartyLink.create({
        data: {
          id: randomUUID(),
          userId,
          platformId: input.platformId,
          referralLink: input.referralLink,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Your ${platform.name} referral link has been saved successfully!`,
      };
    }),

  // Get user's submitted platforms with stats
  getMyPlatformsWithStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;

    // Get user's submitted links
    const userLinks = await ctx.prisma.userThirdPartyLink.findMany({
      where: { userId },
      include: {
          ThirdPartyPlatform: true,
      },
    });

    // Get total direct downlines count
    const directDownlines = await ctx.prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true },
    });

    const totalDirectDownlines = directDownlines.length;
    const downlineIds = directDownlines.map((d) => d.id);

    // For each platform, calculate stats
    const platformsWithStats = await Promise.all(
      userLinks.map(async (link: any) => {
        // Count how many direct downlines have registered using this user's link
        const registrations = await ctx.prisma.thirdPartyRegistration.findMany({
          where: {
            platformId: link.platformId,
            referredByUserId: userId,
            userId: { in: downlineIds }, // Only count direct downlines
          },
          include: {
            User_ThirdPartyRegistration_userIdToUser: {
              select: {
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        });

        const registeredCount = registrations.length;
        const pendingCount = totalDirectDownlines - registeredCount;
        const completionRate =
          totalDirectDownlines > 0
            ? Math.round((registeredCount / totalDirectDownlines) * 100)
            : 0;

        return {
          platform: link.platform,
          referralLink: link.referralLink,
          totalDirectDownlines,
          registeredCount,
          pendingCount,
          completionRate,
          registeredUsers: registrations.map((r: any) => ({
            name: `${r.user.firstname || ''} ${r.user.lastname || ''}`.trim() || r.user.email,
            registeredAt: r.registeredAt,
          })),
        };
      })
    );

    return platformsWithStats;
  }),

  // Get pending downlines for a specific platform (for reminders)
  getPendingDownlines: protectedProcedure
    .input(z.object({ platformId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;

      // Get all direct downlines
      const directDownlines = await ctx.prisma.user.findMany({
        where: { sponsorId: userId },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      });

      // Get registrations for this platform
      const registrations = await ctx.prisma.thirdPartyRegistration.findMany({
        where: {
          platformId: input.platformId,
          referredByUserId: userId,
        },
        select: { userId: true },
      });

      const registeredUserIds = new Set(registrations.map((r: any) => r.userId));

      // Filter out registered users
      const pendingDownlines = directDownlines.filter(
        (downline) => !registeredUserIds.has(downline.id)
      );

      return pendingDownlines.map((d) => ({
        id: d.id,
        name: `${d.firstname || ''} ${d.lastname || ''}`.trim() || d.email || 'Member',
        email: d.email,
      }));
    }),

  // Mark a registration (when user clicks sponsor's link and completes)
  markRegistration: protectedProcedure
    .input(
      z.object({
        platformId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;

      // Get user's sponsor
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { sponsorId: true },
      });

      if (!user?.sponsorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have a sponsor",
        });
      }

      // Check if already registered
      const existing = await ctx.prisma.thirdPartyRegistration.findUnique({
        where: {
          userId_platformId: {
            userId,
            platformId: input.platformId,
          },
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Registration already recorded",
        };
      }

      // Create registration record
      await ctx.prisma.thirdPartyRegistration.create({
        data: {
          id: randomUUID(),
          userId,
          platformId: input.platformId,
          referredByUserId: user.sponsorId,
        },
      });

      return {
        success: true,
        message: "Registration recorded successfully",
      };
    }),

  // Get summary stats for dashboard card
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;

    // Count total active platforms
    const totalPlatforms = await ctx.prisma.thirdPartyPlatform.count({
      where: { isActive: true },
    });

    // Count platforms user has completed (submitted links)
    const completedPlatforms = await ctx.prisma.userThirdPartyLink.count({
      where: { userId },
    });

    const pendingPlatforms = totalPlatforms - completedPlatforms;

    // Get total direct downlines
    const totalDirectDownlines = await ctx.prisma.user.count({
      where: { sponsorId: userId },
    });

    // Get total registrations made by downlines using user's links
    const totalRegistrations = await ctx.prisma.thirdPartyRegistration.count({
      where: { referredByUserId: userId },
    });

    return {
      totalPlatforms,
      completedPlatforms,
      pendingPlatforms,
      totalDirectDownlines,
      totalRegistrations,
    };
  }),
});
