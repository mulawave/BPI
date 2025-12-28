import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const notificationRouter = createTRPCRouter({
  getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
});
