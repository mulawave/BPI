import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dealsRouter = createTRPCRouter({
  // Get all active deals
  getActiveDeals: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        dealType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          activeMembershipPackageId: true,
          rank: true,
        },
      });

      const now = new Date();

      const where: any = {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      };

      if (input.dealType) {
        where.dealType = input.dealType;
      }

      const deals = await ctx.db.bestDeal.findMany({
        where,
        take: input.limit,
        orderBy: [
          { isFeatured: 'desc' },
          { endDate: 'asc' },
        ],
        include: {
          claims: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      // Filter by eligibility and add eligibility info
      const dealsWithEligibility = deals.map((deal) => {
        let isEligible = true;
        const reasons: string[] = [];

        // Check package eligibility
        if (deal.eligiblePackages) {
          const eligiblePackages = JSON.parse(deal.eligiblePackages);
          if (eligiblePackages.length > 0 && !eligiblePackages.includes(user?.activeMembershipPackageId)) {
            isEligible = false;
            reasons.push("Package level required");
          }
        }

        // Check rank eligibility
        if (deal.eligibleRanks) {
          const eligibleRanks = JSON.parse(deal.eligibleRanks);
          if (eligibleRanks.length > 0 && !eligibleRanks.includes(user?.rank)) {
            isEligible = false;
            reasons.push("Rank requirement not met");
          }
        }

        // Check usage limits
        const userClaimCount = deal.claims.length;
        if (userClaimCount >= deal.usagePerUser) {
          isEligible = false;
          reasons.push("Already claimed maximum times");
        }

        if (deal.usageLimit && deal.currentUsage >= deal.usageLimit) {
          isEligible = false;
          reasons.push("Deal limit reached");
        }

        // Calculate time remaining
        const timeRemaining = deal.endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

        return {
          ...deal,
          isEligible,
          ineligibilityReasons: reasons,
          userClaimCount,
          daysRemaining,
          hoursRemaining,
          isExpiringSoon: daysRemaining <= 3,
        };
      });

      return {
        deals: dealsWithEligibility,
        eligibleCount: dealsWithEligibility.filter(d => d.isEligible).length,
      };
    }),

  // Claim a deal
  claimDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          activeMembershipPackageId: true,
          rank: true,
        },
      });

      const deal = await ctx.db.bestDeal.findUnique({
        where: { id: input.dealId },
        include: {
          claims: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!deal) {
        return { success: false, error: "Deal not found" };
      }

      if (!deal.isActive) {
        return { success: false, error: "Deal is no longer active" };
      }

      const now = new Date();
      if (now < deal.startDate || now > deal.endDate) {
        return { success: false, error: "Deal has expired" };
      }

      // Check eligibility
      if (deal.eligiblePackages) {
        const eligiblePackages = JSON.parse(deal.eligiblePackages);
        if (eligiblePackages.length > 0 && !eligiblePackages.includes(user?.activeMembershipPackageId)) {
          return { success: false, error: "You don't meet the package requirements" };
        }
      }

      if (deal.eligibleRanks) {
        const eligibleRanks = JSON.parse(deal.eligibleRanks);
        if (eligibleRanks.length > 0 && !eligibleRanks.includes(user?.rank)) {
          return { success: false, error: "You don't meet the rank requirements" };
        }
      }

      // Check usage limits
      if (deal.claims.length >= deal.usagePerUser) {
        return { success: false, error: "You have already claimed this deal the maximum number of times" };
      }

      if (deal.usageLimit && deal.currentUsage >= deal.usageLimit) {
        return { success: false, error: "This deal has reached its usage limit" };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (deal.discountType === 'percentage') {
        discountAmount = (deal.originalPrice || 0) * (deal.discountValue / 100);
      } else {
        discountAmount = deal.discountValue;
      }

      // Create claim
      const claim = await ctx.db.dealClaim.create({
        data: {
          userId: ctx.session.user.id,
          dealId: input.dealId,
          discountAmount,
        },
      });

      // Update deal usage count
      await ctx.db.bestDeal.update({
        where: { id: input.dealId },
        data: {
          currentUsage: { increment: 1 },
        },
      });

      return {
        success: true,
        claim,
        discountAmount,
        message: "Deal claimed successfully!",
      };
    }),

  // Get user's claimed deals
  getMyClaims: protectedProcedure.query(async ({ ctx }) => {
    const claims = await ctx.db.dealClaim.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        deal: true,
      },
      orderBy: {
        claimedAt: 'desc',
      },
    });

    return claims;
  }),

  // Check deal eligibility
  checkEligibility: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          activeMembershipPackageId: true,
          rank: true,
        },
      });

      const deal = await ctx.db.bestDeal.findUnique({
        where: { id: input.dealId },
        include: {
          claims: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!deal) {
        return { eligible: false, reasons: ["Deal not found"] };
      }

      const reasons: string[] = [];
      let eligible = true;

      if (!deal.isActive) {
        eligible = false;
        reasons.push("Deal is not active");
      }

      const now = new Date();
      if (now < deal.startDate || now > deal.endDate) {
        eligible = false;
        reasons.push("Deal has expired");
      }

      if (deal.eligiblePackages) {
        const eligiblePackages = JSON.parse(deal.eligiblePackages);
        if (eligiblePackages.length > 0 && !eligiblePackages.includes(user?.activeMembershipPackageId)) {
          eligible = false;
          reasons.push("Package level required");
        }
      }

      if (deal.eligibleRanks) {
        const eligibleRanks = JSON.parse(deal.eligibleRanks);
        if (eligibleRanks.length > 0 && !eligibleRanks.includes(user?.rank)) {
          eligible = false;
          reasons.push("Rank requirement not met");
        }
      }

      if (deal.claims.length >= deal.usagePerUser) {
        eligible = false;
        reasons.push("Already claimed maximum times");
      }

      if (deal.usageLimit && deal.currentUsage >= deal.usageLimit) {
        eligible = false;
        reasons.push("Deal limit reached");
      }

      return {
        eligible,
        reasons,
        userClaimCount: deal.claims.length,
        maxClaims: deal.usagePerUser,
      };
    }),
});
