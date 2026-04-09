import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const bpiCalculatorRouter = createTRPCRouter({
  calculateEarnings: publicProcedure
    .input(
      z.object({
        packageId: z.string(),
        referrals: z.number().min(0).default(0),
        months: z.number().min(1).max(60).default(12),
      })
    )
    .query(async ({ input }) => {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) {
        return {
          monthlyEarnings: 0,
          totalEarnings: 0,
          referralBonus: 0,
          breakdown: { base: 0, referrals: 0 },
        };
      }

      const monthlyBase = pkg.price;
      // Each referral earns the L1 cash reward per month
      const referralBonus = input.referrals * (pkg.cash_l1 ?? 0);
      const totalMonthly = monthlyBase + referralBonus;
      const totalEarnings = totalMonthly * input.months;

      return {
        monthlyEarnings: totalMonthly,
        totalEarnings,
        referralBonus,
        breakdown: {
          base: monthlyBase,
          referrals: referralBonus,
        },
      };
    }),

  getPackageDetails: publicProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ input }) => {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) {
        return { name: "", price: 0, benefits: [] as string[] };
      }

      return {
        name: pkg.name,
        price: pkg.price + pkg.vat,
        benefits: pkg.features ?? [],
      };
    }),
});
