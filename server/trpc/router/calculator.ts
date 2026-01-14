import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// BPI Calculator logic from legacy PHP
export const bpiCalculatorRouter = createTRPCRouter({
  // Calculate BPI earnings projections
  calculateEarnings: publicProcedure
    .input(z.object({
      membershipType: z.enum(["regular", "silver_plus", "gold_plus"]),
      palliativePackageId: z.string().optional(),
      numberOfInvites: z.number().min(1).max(10000),
      currencyRate: z.number().default(1) // For currency conversion
    }))
    .mutation(async ({ ctx, input }) => {
      const { membershipType, numberOfInvites, currencyRate } = input;

      // Define earning levels for different membership types
      const membershipConfigs = {
        regular: {
          levels: 4,
          cashEarnings: [450, 225, 150, 150],
          bptEarnings: [150, 75, 50, 50],
          palliativeEarnings: [2460, 1200, 800, 800],
          shelterEarnings: [0, 0, 0, 0]
        },
        silver_plus: {
          levels: 4,
          cashEarnings: [1350, 855, 210, 210],
          bptEarnings: [850, 225, 50, 50],
          palliativeEarnings: [4800, 3120, 640, 640],
          shelterEarnings: [30000, 22500, 7500, 7500]
        },
        gold_plus: {
          levels: 10,
          cashEarnings: [3150, 1935, 570, 570, 0, 0, 0, 0, 0, 0],
          bptEarnings: [1850, 525, 150, 150, 0, 0, 0, 0, 0, 0],
          palliativeEarnings: [12000, 7490, 2080, 2080, 0, 0, 0, 0, 0, 0],
          shelterEarnings: [60000, 45000, 15000, 15000, 3000, 3000, 3000, 3000, 1500, 1500]
        }
      };

      const config = membershipConfigs[membershipType];
      
      let totalEarnings = {
        cash: 0,
        bpt: 0,
        palliative: 0,
        shelter: 0
      };

      // Calculate earnings based on referral levels
      for (let level = 0; level < config.levels; level++) {
        const referralsAtLevel = Math.pow(numberOfInvites, level);
        
        totalEarnings.cash += config.cashEarnings[level] * referralsAtLevel;
        totalEarnings.bpt += config.bptEarnings[level] * referralsAtLevel;
        totalEarnings.palliative += config.palliativeEarnings[level] * referralsAtLevel;
        totalEarnings.shelter += config.shelterEarnings[level] * referralsAtLevel;
      }

      // Apply currency rate and user multiplier
      const finalEarnings = {
        cashBonus: totalEarnings.cash * numberOfInvites * currencyRate,
        bptBonus: (totalEarnings.bpt * numberOfInvites) / 20, // BPT conversion rate
        palliativeBonus: totalEarnings.palliative * numberOfInvites * currencyRate,
        shelterReward: totalEarnings.shelter * numberOfInvites * currencyRate,
        levels: config.levels
      };

      // Get package upgrade thresholds
      const upgradeThresholds = {
        silver_plus: 100000 * currencyRate,
        gold_plus: 200000 * currencyRate
      };

      return {
        ...finalEarnings,
        membershipType,
        numberOfInvites,
        canUpgradeToSilver: membershipType === "regular" && finalEarnings.palliativeBonus >= upgradeThresholds.silver_plus,
        canUpgradeToGold: membershipType !== "gold_plus" && finalEarnings.palliativeBonus >= upgradeThresholds.gold_plus,
        upgradeThresholds
      };
    }),

  // Get available palliative packages
  getPackages: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.palliativePackage.findMany({
      where: { active: true },
      orderBy: { amount: 'asc' }
    });
  }),

  // Get package details
  getPackageDetails: publicProcedure
    .input(z.object({
      packageId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.palliativePackage.findUnique({
        where: { id: input.packageId },
        include: {
          PackageActivation: {
            where: { status: "active" },
            select: {
              User: {
                select: {
                  name: true
                }
              },
              createdAt: true
            }
          }
        }
      });
    }),

  // Calculate wallet limits based on package
  getWalletLimits: publicProcedure
    .input(z.object({
      packageId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Wallet limits based on package types
      const walletLimits = {
        "1": 40000000,  // Regular
        "2": 80000000,  // Silver Plus
        "3": 150000000, // Gold Plus
        "4": 200000000, // Premium
        "5": 300000000, // Platinum
        "6": 20000000,  // Basic
        "7": 10000000,  // Starter
        "8": 5000000,   // Mini
        "9": 10000000   // Standard
      };

      const limit = walletLimits[input.packageId as keyof typeof walletLimits] || 0;
      
      return {
        packageId: input.packageId,
        walletLimit: limit,
        formatted: new Intl.NumberFormat('en-US').format(limit)
      };
    })
});