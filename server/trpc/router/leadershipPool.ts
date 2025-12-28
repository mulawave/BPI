import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const leadershipPoolRouter = createTRPCRouter({
  // Get current qualification status
  getQualificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const qualification = await ctx.db.leadershipPoolQualification.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    // If no record exists, create one
    if (!qualification) {
      const newQualification = await ctx.db.leadershipPoolQualification.create({
        data: {
          userId: ctx.session.user.id,
        },
      });
      return newQualification;
    }

    return qualification;
  }),

  // Get detailed progress breakdown
  getProgressDetails: protectedProcedure.query(async ({ ctx }) => {
    const qualification = await ctx.db.leadershipPoolQualification.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    if (!qualification) {
      return {
        hasRegularPlus: false,
        option1: {
          current: 0,
          required: 70,
          percentage: 0,
        },
        option2: {
          firstGen: { current: 0, required: 50, percentage: 0 },
          secondGen: { current: 0, required: 50, percentage: 0 },
          total: { current: 0, required: 100, percentage: 0 },
        },
        isQualified: false,
        recommendedOption: null,
      };
    }

    const option1Progress = (qualification.sponsoredRegularPlus / 70) * 100;
    const option2FirstGen = (qualification.firstGenRegularPlus / 50) * 100;
    const option2SecondGen = (qualification.secondGenRegularPlus / 50) * 100;
    const option2Total = ((qualification.firstGenRegularPlus + qualification.secondGenRegularPlus) / 100) * 100;

    // Recommend which option is closer to completion
    let recommendedOption = null;
    if (!qualification.isQualified) {
      if (option1Progress > option2Total) {
        recommendedOption = 1;
      } else {
        recommendedOption = 2;
      }
    }

    return {
      hasRegularPlus: qualification.hasRegularPlusPackage,
      option1: {
        current: qualification.sponsoredRegularPlus,
        required: 70,
        percentage: Math.min(option1Progress, 100),
      },
      option2: {
        firstGen: {
          current: qualification.firstGenRegularPlus,
          required: 50,
          percentage: Math.min(option2FirstGen, 100),
        },
        secondGen: {
          current: qualification.secondGenRegularPlus,
          required: 50,
          percentage: Math.min(option2SecondGen, 100),
        },
        total: {
          current: qualification.firstGenRegularPlus + qualification.secondGenRegularPlus,
          required: 100,
          percentage: Math.min(option2Total, 100),
        },
      },
      isQualified: qualification.isQualified,
      qualifiedAt: qualification.qualifiedAt,
      currentTier: qualification.currentTier,
      recommendedOption,
    };
  }),

  // Get referral tree for leadership pool
  getReferralTree: protectedProcedure.query(async ({ ctx }) => {
    // Get user's referral tree
    const tree = await ctx.db.referralTree.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    if (!tree) {
      return {
        firstGeneration: [],
        secondGeneration: [],
      };
    }

    const firstGenIds = tree.firstGeneration as string[];
    const secondGenIds = tree.secondGeneration as string[];

    // Get first generation users with their packages
    const firstGen = await ctx.db.user.findMany({
      where: {
        id: { in: firstGenIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeMembershipPackageId: true,
        activated: true,
        createdAt: true,
      },
    });

    // Get second generation users
    const secondGen = await ctx.db.user.findMany({
      where: {
        id: { in: secondGenIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeMembershipPackageId: true,
        activated: true,
        sponsorId: true,
        createdAt: true,
      },
    });

    // Count Regular Plus members
    const firstGenRegularPlus = firstGen.filter(
      u => u.activeMembershipPackageId && u.activeMembershipPackageId.includes('regular-plus')
    );

    const secondGenRegularPlus = secondGen.filter(
      u => u.activeMembershipPackageId && u.activeMembershipPackageId.includes('regular-plus')
    );

    return {
      firstGeneration: firstGen.map(u => ({
        ...u,
        isRegularPlus: u.activeMembershipPackageId?.includes('regular-plus') || false,
      })),
      secondGeneration: secondGen.map(u => ({
        ...u,
        isRegularPlus: u.activeMembershipPackageId?.includes('regular-plus') || false,
      })),
      stats: {
        firstGenTotal: firstGen.length,
        firstGenRegularPlus: firstGenRegularPlus.length,
        secondGenTotal: secondGen.length,
        secondGenRegularPlus: secondGenRegularPlus.length,
      },
    };
  }),

  // Manually trigger qualification check
  checkQualification: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        activeMembershipPackageId: true,
      },
    });

    const hasRegularPlus = user?.activeMembershipPackageId?.includes('regular-plus') || false;

    // Get referral tree
    const tree = await ctx.db.referralTree.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    if (!tree) {
      return {
        checked: true,
        qualified: false,
        message: "No referral tree found",
      };
    }

    const firstGenIds = tree.firstGeneration as string[];
    const secondGenIds = tree.secondGeneration as string[];

    // Count Regular Plus members in each generation
    const firstGen = await ctx.db.user.findMany({
      where: {
        id: { in: firstGenIds },
        activeMembershipPackageId: { contains: 'regular-plus' },
        activated: true,
      },
    });

    const secondGen = await ctx.db.user.findMany({
      where: {
        id: { in: secondGenIds },
        activeMembershipPackageId: { contains: 'regular-plus' },
        activated: true,
      },
    });

    const firstGenCount = firstGen.length;
    const secondGenCount = secondGen.length;
    const totalRegularPlus = firstGenCount + secondGenCount;

    // Check qualification
    const option1Qualified = hasRegularPlus && totalRegularPlus >= 70;
    const option2Qualified = hasRegularPlus && firstGenCount >= 50 && secondGenCount >= 50;
    const isQualified = option1Qualified || option2Qualified;

    // Update or create qualification record
    await ctx.db.leadershipPoolQualification.upsert({
      where: {
        userId: ctx.session.user.id,
      },
      update: {
        hasRegularPlusPackage: hasRegularPlus,
        sponsoredRegularPlus: totalRegularPlus,
        firstGenRegularPlus: firstGenCount,
        secondGenRegularPlus: secondGenCount,
        isQualified,
        qualifiedAt: isQualified ? new Date() : null,
        qualificationOption: option1Qualified ? 1 : option2Qualified ? 2 : null,
        lastEvaluatedAt: new Date(),
      },
      create: {
        userId: ctx.session.user.id,
        hasRegularPlusPackage: hasRegularPlus,
        sponsoredRegularPlus: totalRegularPlus,
        firstGenRegularPlus: firstGenCount,
        secondGenRegularPlus: secondGenCount,
        isQualified,
        qualifiedAt: isQualified ? new Date() : null,
        qualificationOption: option1Qualified ? 1 : option2Qualified ? 2 : null,
        lastEvaluatedAt: new Date(),
      },
    });

    return {
      checked: true,
      qualified: isQualified,
      qualificationOption: option1Qualified ? 1 : option2Qualified ? 2 : null,
      stats: {
        hasRegularPlus,
        totalRegularPlus,
        firstGenCount,
        secondGenCount,
      },
      message: isQualified 
        ? "Congratulations! You are qualified for the Leadership Pool!" 
        : "Keep building your team to qualify",
    };
  }),
});
