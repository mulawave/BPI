import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const userRouter = createTRPCRouter({
  getDetails: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        empowermentPackages: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // For activeMembership, we need to get the package details
    let activeMembership = null;
    if (user.activeMembershipPackageId) {
        activeMembership = await prisma.membershipPackage.findUnique({
            where: { id: user.activeMembershipPackageId }
        });
    }

    return {
      ...user,
      activeMembership, // This will be the full package object or null
    };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const id = (session!.user as any).id as string;
    const me = await ctx.prisma.user.findUnique({ where: { id } });
    return { id: me?.id, email: me?.email, name: me?.name, role: me?.role };
  }),
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const id = (session!.user as any).id as string;
      await ctx.prisma.user.update({ where: { id }, data: { name: input.name } });
      return { success: true };
    })
});
