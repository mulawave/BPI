import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const communityUpdatesRouter = createTRPCRouter({
  getUpdates: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const updates = await prisma.communityUpdate.findMany({
        where: {
          isActive: true,
          ...(input.category ? { category: input.category } : {}),
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: input.limit,
        include: {
          User: {
            select: { firstname: true, lastname: true },
          },
          UpdateRead: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      await prisma.communityUpdate.updateMany({
        where: { id: { in: updates.map(u => u.id) } },
        data: { viewCount: { increment: 1 } },
      });

      return updates.map(update => ({
        ...update,
        isRead: update.UpdateRead.length > 0,
      }));
    }),

  getUpdateById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const update = await prisma.communityUpdate.findUnique({
        where: { id: input.id },
        include: {
          User: {
            select: { firstname: true, lastname: true },
          },
        },
      });

      if (update) {
        await prisma.communityUpdate.update({
          where: { id: input.id },
          data: { viewCount: { increment: 1 } },
        });
      }

      return update;
    }),

  markAsRead: protectedProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      await prisma.updateRead.upsert({
        where: {
          userId_updateId: {
            userId,
            updateId: input.updateId,
          },
        },
        create: {
          id: randomUUID(),
          userId,
          updateId: input.updateId,
        },
        update: {},
      });

      return { success: true };
    }),

  trackClick: protectedProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.communityUpdate.update({
        where: { id: input.updateId },
        data: { clickCount: { increment: 1 } },
      });

      return { success: true };
    }),
});
