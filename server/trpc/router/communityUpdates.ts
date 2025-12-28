import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const communityUpdatesRouter = createTRPCRouter({
  // Get all updates for current user (with targeting logic)
  getUpdates: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          activeMembershipPackageId: true,
          rank: true,
          country: true,
        },
      });

      const where: any = {
        isActive: true,
        publishedAt: { lte: new Date() },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      };

      // Apply category filter
      if (input.category) {
        where.category = input.category;
      }

      const updates = await ctx.db.communityUpdate.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' },
        ],
        include: {
          creator: {
            select: {
              name: true,
              image: true,
            },
          },
          readBy: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      // Filter by targeting
      const filteredUpdates = updates.filter((update) => {
        // Check package targeting
        if (update.targetPackages) {
          const targetPackages = JSON.parse(update.targetPackages);
          if (targetPackages.length > 0 && !targetPackages.includes(user?.activeMembershipPackageId)) {
            return false;
          }
        }

        // Check rank targeting
        if (update.targetRanks) {
          const targetRanks = JSON.parse(update.targetRanks);
          if (targetRanks.length > 0 && !targetRanks.includes(user?.rank)) {
            return false;
          }
        }

        // Check region targeting
        if (update.targetRegions) {
          const targetRegions = JSON.parse(update.targetRegions);
          if (targetRegions.length > 0 && !targetRegions.includes(user?.country)) {
            return false;
          }
        }

        return true;
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (filteredUpdates.length > input.limit) {
        const nextItem = filteredUpdates.pop();
        nextCursor = nextItem!.id;
      }

      return {
        updates: filteredUpdates.map(update => ({
          ...update,
          isRead: update.readBy.length > 0,
        })),
        nextCursor,
      };
    }),

  // Get single update details
  getUpdateDetails: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const update = await ctx.db.communityUpdate.findUnique({
        where: { id: input.id },
        include: {
          creator: {
            select: {
              name: true,
              image: true,
            },
          },
          readBy: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!update) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Update not found",
        });
      }

      return {
        ...update,
        isRead: update.readBy.length > 0,
      };
    }),

  // Mark update as read
  markAsRead: protectedProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already read
      const existing = await ctx.db.updateRead.findUnique({
        where: {
          userId_updateId: {
            userId: ctx.session.user.id,
            updateId: input.updateId,
          },
        },
      });

      if (existing) {
        return { success: true, alreadyRead: true };
      }

      // Mark as read
      await ctx.db.updateRead.create({
        data: {
          userId: ctx.session.user.id,
          updateId: input.updateId,
        },
      });

      // Increment view count
      await ctx.db.communityUpdate.update({
        where: { id: input.updateId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      return { success: true, alreadyRead: false };
    }),

  // Track CTA click
  trackClick: protectedProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.communityUpdate.update({
        where: { id: input.updateId },
        data: {
          clickCount: { increment: 1 },
        },
      });

      return { success: true };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        activeMembershipPackageId: true,
        rank: true,
        country: true,
      },
    });

    const allUpdates = await ctx.db.communityUpdate.findMany({
      where: {
        isActive: true,
        publishedAt: { lte: new Date() },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      select: {
        id: true,
        targetPackages: true,
        targetRanks: true,
        targetRegions: true,
      },
    });

    // Filter by targeting
    const eligibleUpdateIds = allUpdates
      .filter((update) => {
        if (update.targetPackages) {
          const targetPackages = JSON.parse(update.targetPackages);
          if (targetPackages.length > 0 && !targetPackages.includes(user?.activeMembershipPackageId)) {
            return false;
          }
        }

        if (update.targetRanks) {
          const targetRanks = JSON.parse(update.targetRanks);
          if (targetRanks.length > 0 && !targetRanks.includes(user?.rank)) {
            return false;
          }
        }

        if (update.targetRegions) {
          const targetRegions = JSON.parse(update.targetRegions);
          if (targetRegions.length > 0 && !targetRegions.includes(user?.country)) {
            return false;
          }
        }

        return true;
      })
      .map(u => u.id);

    const readCount = await ctx.db.updateRead.count({
      where: {
        userId: ctx.session.user.id,
        updateId: { in: eligibleUpdateIds },
      },
    });

    return {
      unreadCount: eligibleUpdateIds.length - readCount,
      totalCount: eligibleUpdateIds.length,
    };
  }),
});
