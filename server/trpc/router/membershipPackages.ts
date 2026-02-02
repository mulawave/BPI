import { z } from "zod";
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
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input }) => {
      // Placeholder: Return null
      return null;
    }),

  purchasePackage: protectedProcedure
    .input(
      z.object({
        packageId: z.number(),
        paymentMethod: z.enum(["WALLET", "CARD", "BANK_TRANSFER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Placeholder: Return error
      throw new Error("Package purchase feature is under development");
    }),

  getMyPackage: protectedProcedure.query(async ({ ctx }) => {
    // Placeholder: Return null
    return null;
  }),

  // NOTE: For package upgrades, use package.processUpgradePayment instead
  // This stub is kept for backward compatibility but should not be used
});
