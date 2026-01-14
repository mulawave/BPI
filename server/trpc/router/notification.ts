import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const notificationRouter = createTRPCRouter({
  getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return await prisma.notification.findMany({
      where: {
        OR: [{ userId }, { isGlobal: true }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        isGlobal: true,
        createdAt: true,
      },
    });
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      await prisma.notification.updateMany({
        where: {
          id: input.notificationId,
          userId: userId, // Ensure user can only update their own notifications
        },
        data: { isRead: true },
      });
      return { success: true };
    }),

  markMultipleAsRead: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      await prisma.notification.updateMany({
        where: {
          id: { in: input.notificationIds },
          userId: userId,
        },
        data: { isRead: true },
      });
      return { success: true };
    }),

  archiveNotifications: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      // For now, we'll mark them as read and you can add an 'archived' field to schema later
      await prisma.notification.updateMany({
        where: {
          id: { in: input.notificationIds },
          userId: userId,
        },
        data: { isRead: true },
      });
      return { success: true, message: 'Notifications archived' };
    }),

  deleteNotifications: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      await prisma.notification.deleteMany({
        where: {
          id: { in: input.notificationIds },
          userId: userId,
        },
      });
      return { success: true, message: 'Notifications deleted' };
    }),
});
