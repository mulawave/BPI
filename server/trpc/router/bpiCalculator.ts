import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const bpiCalculatorRouter = createTRPCRouter({
  // Calculate potential earnings
  calculateEarnings: protectedProcedure
    .input(
      z.object({
        currentPackage: z.string().optional(),
        investmentAmount: z.number().min(0),
        referralCount: z.number().min(0).default(0),
        teamSize: z.number().min(0).default(0),
        timePeriodMonths: z.number().min(1).max(120).default(12),
        includeGenerationalBonus: z.boolean().default(true),
        includePackageMaturity: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get package details if specified
      let packageDetails = null;
      if (input.currentPackage) {
        packageDetails = await ctx.db.membershipPackage.findUnique({
          where: { id: input.currentPackage },
        });
      }

      // Calculate direct referral commission (example: 10% per referral)
      const directReferralRate = 0.10;
      const avgReferralValue = input.investmentAmount;
      const directReferralEarnings = input.referralCount * avgReferralValue * directReferralRate;

      // Calculate generational bonus (example rates)
      let generationalEarnings = 0;
      if (input.includeGenerationalBonus) {
        const gen2Rate = 0.05; // 5% from 2nd generation
        const gen3Rate = 0.03; // 3% from 3rd generation
        const gen4Rate = 0.02; // 2% from 4th generation

        // Estimate team distribution
        const gen2Count = Math.floor(input.teamSize * 0.4);
        const gen3Count = Math.floor(input.teamSize * 0.35);
        const gen4Count = Math.floor(input.teamSize * 0.25);

        generationalEarnings = 
          (gen2Count * avgReferralValue * gen2Rate) +
          (gen3Count * avgReferralValue * gen3Rate) +
          (gen4Count * avgReferralValue * gen4Rate);
      }

      // Calculate package maturity earnings
      let maturityEarnings = 0;
      if (input.includePackageMaturity && packageDetails) {
        // Example: Package matures at 150% of investment after specific period
        const maturityRate = 1.5;
        const maturityMonths = 12; // Assuming 12 months maturity
        const cyclesCompleted = Math.floor(input.timePeriodMonths / maturityMonths);
        maturityEarnings = input.investmentAmount * (maturityRate - 1) * cyclesCompleted;
      }

      // Calculate monthly passive income
      const monthlyPassive = (directReferralEarnings + generationalEarnings) / input.timePeriodMonths;

      // Total projected earnings
      const totalEarnings = directReferralEarnings + generationalEarnings + maturityEarnings;

      // Calculate ROI
      const roi = input.investmentAmount > 0 
        ? ((totalEarnings / input.investmentAmount) * 100) 
        : 0;

      // Calculate break-even time
      const breakEvenMonths = input.investmentAmount > 0 && monthlyPassive > 0
        ? Math.ceil(input.investmentAmount / monthlyPassive)
        : null;

      // Save calculation to history
      const calculation = await ctx.db.bPICalculation.create({
        data: {
          userId: ctx.session.user.id,
          calculationType: 'earnings',
          inputParameters: input,
          currentPackage: input.currentPackage,
          investmentAmount: input.investmentAmount,
          referralCount: input.referralCount,
          teamSize: input.teamSize,
          timePeriodMonths: input.timePeriodMonths,
          calculatedEarnings: totalEarnings,
          projectedEarnings: totalEarnings,
          breakEvenMonths: breakEvenMonths,
          roi: roi,
        },
      });

      return {
        calculationId: calculation.id,
        breakdown: {
          directReferralEarnings,
          generationalEarnings,
          maturityEarnings,
          totalEarnings,
        },
        metrics: {
          roi: Number(roi.toFixed(2)),
          breakEvenMonths,
          monthlyPassiveIncome: Number(monthlyPassive.toFixed(2)),
          dailyPassiveIncome: Number((monthlyPassive / 30).toFixed(2)),
        },
        recommendations: {
          recommendUpgrade: packageDetails ? false : true,
          suggestedPackage: null, // Could add logic to suggest better package
          potentialIncrease: null,
        },
      };
    }),

  // Get calculation history
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const calculations = await ctx.db.bPICalculation.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        take: input.limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return calculations;
    }),

  // Get saved calculation details
  getCalculation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const calculation = await ctx.db.bPICalculation.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return calculation;
    }),

  // Delete calculation
  deleteCalculation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.bPICalculation.deleteMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),
});
