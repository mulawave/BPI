import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const bpiCalculatorRouter = createTRPCRouter({
  calculateEarnings: publicProcedure
    .input(
      z.object({
        packageType: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]),
        referrals: z.number().min(0).default(0),
        months: z.number().min(1).max(60).default(12),
      })
    )
    .query(async ({ input }) => {
      // Placeholder calculation
      const baseEarnings = {
        BRONZE: 5000,
        SILVER: 10000,
        GOLD: 20000,
        PLATINUM: 50000,
        DIAMOND: 100000,
      };

      const monthlyBase = baseEarnings[input.packageType];
      const referralBonus = input.referrals * 1000;
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
    .input(z.object({ packageType: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]) }))
    .query(async ({ input }) => {
      // Placeholder: Return package info
      return {
        name: input.packageType,
        price: 0,
        benefits: [],
      };
    }),
});
