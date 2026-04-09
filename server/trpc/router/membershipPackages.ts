import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const membershipPackagesRouter = createTRPCRouter({
  getPackages: publicProcedure.query(async () => {
    const packages = await prisma.membershipPackage.findMany({
      orderBy: { price: "asc" },
    });
    return packages;
  }),

  getPackageById: publicProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ input }) => {
      return prisma.membershipPackage.findUnique({
        where: { id: input.packageId },
      });
    }),

  purchasePackage: protectedProcedure
    .input(
      z.object({
        packageId: z.string(),
        paymentMethod: z.enum(["WALLET", "CARD", "BANK_TRANSFER"]),
      })
    )
    .mutation(async () => {
      throw new TRPCError({
        code: "METHOD_NOT_SUPPORTED",
        message:
          "Use package.initiateMembershipPayment instead. This endpoint is deprecated.",
      });
    }),

  getMyPackage: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeMembershipPackageId: true },
    });

    if (!user?.activeMembershipPackageId) return null;

    return prisma.membershipPackage.findUnique({
      where: { id: user.activeMembershipPackageId },
    });
  }),
});
