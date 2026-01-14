import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { 
  PALLIATIVE_THRESHOLD, 
  getPalliativeTier, 
  getWalletFieldName,
  calculateThresholdProgress,
  canActivatePalliative 
} from "@/lib/palliative";

export const palliativeRouter = createTRPCRouter({
  /**
   * Get all available palliative options
   */
  getPalliativeOptions: publicProcedure.query(async ({ ctx }) => {
    const options = await ctx.prisma.palliativeOption.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' }
    });
    
    return options;
  }),

  /**
   * Get specific palliative option by slug
   */
  getPalliativeOption: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const option = await ctx.prisma.palliativeOption.findUnique({
        where: { slug: input.slug }
      });
      
      return option;
    }),

  /**
   * Activate palliative (lower-tier members only)
   * For higher-tier members, activation happens during membership signup
   */
  activatePalliative: protectedProcedure
    .input(z.object({
      palliativeType: z.enum(["car", "house", "land", "business", "solar", "education"])
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = ctx.session.user.id;

      // Get user with membership info
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          palliative: true,
          palliativeActivated: true,
          palliativeTier: true,
          selectedPalliative: true,
          activeMembershipPackageId: true,
        }
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Validation checks
      if (user.palliativeTier !== "lower") {
        throw new Error("This activation method is for lower-tier members only. Higher-tier members activate during signup.");
      }

      if (user.palliativeActivated) {
        throw new Error("Palliative already activated");
      }

      if (user.palliative < PALLIATIVE_THRESHOLD) {
        throw new Error(
          `Minimum threshold of ₦${PALLIATIVE_THRESHOLD.toLocaleString()} not reached. Current balance: ₦${user.palliative.toLocaleString()}`
        );
      }

      // Get the wallet field name for the selected palliative type
      const walletField = getWalletFieldName(input.palliativeType);

      // Get membership package name
      const membershipPackage = await ctx.prisma.membershipPackage.findUnique({
        where: { id: user.activeMembershipPackageId! },
        select: { name: true }
      });

      // Transfer balance and activate
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          palliativeActivated: true,
          selectedPalliative: input.palliativeType,
          palliativeActivatedAt: new Date(),
          [walletField]: { increment: user.palliative }, // Transfer full balance
          palliative: 0 // Clear pooling wallet
        }
      });

      // Create activation record
      await ctx.prisma.palliativeWalletActivation.create({
        data: {
          id: randomUUID(),
          userId,
          palliativeType: input.palliativeType,
          membershipTier: membershipPackage?.name || "Unknown",
          activationType: "threshold",
          thresholdAmount: user.palliative
        }
      });

      // Create transaction record
      await ctx.prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "PALLIATIVE_ACTIVATION",
          amount: user.palliative,
          description: `Activated ${input.palliativeType} palliative at ₦${PALLIATIVE_THRESHOLD.toLocaleString()} threshold`,
          status: "Successful"
        }
      });

      return { 
        success: true, 
        activatedWallet: input.palliativeType,
        transferredAmount: user.palliative
      };
    }),

  /**
   * Get user's palliative journey stats (for lower-tier members)
   */
  getPalliativeJourney: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        palliative: true,
        palliativeActivated: true,
        selectedPalliative: true,
        palliativeTier: true,
        shelter: true,
        car: true,
        land: true,
        business: true,
        solar: true,
        education: true,
        health: true,
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get ALL recent earnings that contributed to palliative wallet (not just specific transaction types)
    const recentEarnings = await ctx.prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { transactionType: { in: ["PALLIATIVE_EARNING", "REFERRAL_PALLIATIVE"] } },
          { 
            description: { contains: "Palliative" }
          },
          {
            AND: [
              { transactionType: "REFERRAL_BONUS" },
              { description: { contains: "10%" } } // 10% referral bonus goes to palliative
            ]
          }
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
        reference: true,
      }
    });

    // Get ACTUAL referral counts from Referral table (correct way)
    const level1Referrals = await ctx.prisma.referral.findMany({
      where: { referrerId: userId },
      select: { referredId: true }
    });

    const level1Ids = level1Referrals.map(r => r.referredId);
    
    const level2Referrals = level1Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level1Ids } },
      select: { referredId: true }
    }) : [];

    const level2Ids = level2Referrals.map(r => r.referredId);

    const level3Referrals = level2Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level2Ids } },
      select: { referredId: true }
    }) : [];

    const level3Ids = level3Referrals.map(r => r.referredId);

    const level4Referrals = level3Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level3Ids } },
      select: { referredId: true }
    }) : [];

    // Calculate stats
    const percentageComplete = calculateThresholdProgress(user.palliative);
    const remaining = Math.max(PALLIATIVE_THRESHOLD - user.palliative, 0);
    const canActivate = canActivatePalliative(user.palliative, user.palliativeActivated);

    // Calculate total network from ACTUAL data
    const totalNetwork = level1Referrals.length + level2Referrals.length + level3Referrals.length + level4Referrals.length;

    return {
      palliativeWallet: user.palliative,
      threshold: PALLIATIVE_THRESHOLD,
      remaining,
      percentageComplete,
      canActivate,
      isActivated: user.palliativeActivated,
      selectedPalliative: user.selectedPalliative,
      tier: user.palliativeTier,
      recentEarnings,
      networkStats: {
        directReferrals: level1Referrals.length,
        totalNetwork,
        level2: level2Referrals.length,
        level3: level3Referrals.length,
        level4: level4Referrals.length,
      },
      // Activated palliative wallet balances
      activatedWallets: user.palliativeActivated && user.selectedPalliative ? {
        car: user.car,
        house: user.shelter,
        land: user.land,
        business: user.business,
        solar: user.solar || 0,
        education: user.education,
        health: user.health,
      } : null,
    };
  }),

  /**
   * Get user's activated palliative status and progress
   */
  getActivatedPalliative: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        palliativeActivated: true,
        selectedPalliative: true,
        palliativeActivatedAt: true,
        shelter: true,
        car: true,
        land: true,
        business: true,
        solar: true,
        education: true,
        health: true,
      }
    });

    if (!user || !user.palliativeActivated || !user.selectedPalliative) {
      return null;
    }

    // Get the palliative option details
    const option = await ctx.prisma.palliativeOption.findUnique({
      where: { slug: user.selectedPalliative }
    });

    if (!option) {
      return null;
    }

    // Get current wallet balance for selected palliative
    const walletField = getWalletFieldName(user.selectedPalliative as any);
    const currentBalance = (user as any)[walletField] || 0;

    // Calculate progress toward target
    const progressPercentage = (currentBalance / option.targetAmount) * 100;
    const remaining = Math.max(option.targetAmount - currentBalance, 0);

    // Check if maturity has been reached
    const hasMatured = currentBalance >= option.targetAmount;

    // Check for existing maturity record
    const maturityRecord = await ctx.prisma.palliativeMaturity.findFirst({
      where: {
        userId,
        palliativeType: user.selectedPalliative,
        status: { in: ["pending", "claimed", "approved"] }
      },
      orderBy: { dateCompleted: 'desc' }
    });

    return {
      palliativeType: user.selectedPalliative,
      palliativeName: option.name,
      targetAmount: option.targetAmount,
      currentBalance,
      progressPercentage,
      remaining,
      hasMatured,
      activatedAt: user.palliativeActivatedAt,
      maturityRecord,
      icon: option.icon,
      description: option.description,
    };
  }),

  /**
   * Check for maturity and create maturity record
   */
  checkMaturity: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        palliativeActivated: true,
        selectedPalliative: true,
        shelter: true,
        car: true,
        land: true,
        business: true,
        solar: true,
        education: true,
      }
    });

    if (!user || !user.palliativeActivated || !user.selectedPalliative) {
      return { matured: false, message: "Palliative not activated" };
    }

    // Get the palliative option details
    const option = await ctx.prisma.palliativeOption.findUnique({
      where: { slug: user.selectedPalliative }
    });

    if (!option) {
      return { matured: false, message: "Palliative option not found" };
    }

    // Get current wallet balance
    const walletField = getWalletFieldName(user.selectedPalliative as any);
    const currentBalance = (user as any)[walletField] || 0;

    // Check if matured
    if (currentBalance < option.targetAmount) {
      return { 
        matured: false, 
        message: `Not yet matured. Current: ₦${currentBalance.toLocaleString()}, Target: ₦${option.targetAmount.toLocaleString()}` 
      };
    }

    // Check if maturity record already exists
    const existingMaturity = await ctx.prisma.palliativeMaturity.findFirst({
      where: {
        userId,
        palliativeType: user.selectedPalliative,
        status: { in: ["pending", "claimed", "approved"] }
      }
    });

    if (existingMaturity) {
      return { matured: true, message: "Maturity already recorded", record: existingMaturity };
    }

    // Create maturity record
    const maturityRecord = await ctx.prisma.palliativeMaturity.create({
      data: {
        id: randomUUID(),
        userId,
        palliativeType: user.selectedPalliative,
        targetAmount: option.targetAmount,
        completedAmount: currentBalance,
        status: "pending",
      }
    });

    // Create notification
    await ctx.prisma.notification.create({
      data: {
        id: randomUUID(),
        userId,
        title: "🎉 Palliative Maturity Reached!",
        message: `Congratulations! Your ${option.name} has reached the target amount of ₦${option.targetAmount.toLocaleString()}. You can now claim your palliative benefit.`,
        link: "/dashboard",
      }
    });

    return { 
      matured: true, 
      message: "Congratulations! Palliative has matured",
      record: maturityRecord 
    };
  }),
});
