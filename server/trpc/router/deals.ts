import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const dealsRouter = createTRPCRouter({
  getActiveDeals: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      
      const deals = await prisma.bestDeal.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          ...(input.category ? { dealType: input.category } : {}),
        },
        orderBy: [
          { isFeatured: 'desc' },
          { endDate: 'asc' },
        ],
        take: input.limit,
        include: {
          DealClaim: true,
          _count: { select: { DealClaim: true } },
        },
      });

      return {
        deals: deals.map(deal => ({
          ...deal,
          remainingClaims: deal.usageLimit ? deal.usageLimit - deal.currentUsage : null,
        })),
        total: deals.length,
      };
    }),

  getDealById: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await prisma.bestDeal.findUnique({
        where: { id: input.dealId },
        include: {
          User: {
            select: { firstname: true, lastname: true },
          },
        },
      });

      return deal;
    }),

  claimDeal: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const deal = await prisma.bestDeal.findUnique({
        where: { id: input.dealId },
        include: {
          DealClaim: {
            where: { userId },
          },
        },
      });

      if (!deal) {
        throw new Error("Deal not found");
      }

      if (!deal.isActive || new Date() > deal.endDate) {
        throw new Error("Deal is no longer active");
      }

      if (deal.DealClaim.length >= deal.usagePerUser) {
        throw new Error("You have already claimed this deal");
      }

      if (deal.usageLimit && deal.currentUsage >= deal.usageLimit) {
        throw new Error("Deal limit reached");
      }

      await prisma.dealClaim.create({
        data: {
          id: randomUUID(),
          userId,
          dealId: input.dealId,
          discountAmount: deal.discountType === 'percentage' 
            ? (deal.originalPrice || 0) * (deal.discountValue / 100)
            : deal.discountValue,
        },
      });

      await prisma.bestDeal.update({
        where: { id: input.dealId },
        data: { currentUsage: { increment: 1 } },
      });

      return {
        success: true,
        message: "Deal claimed successfully",
      };
    }),

  getMyDeals: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    const claims = await prisma.dealClaim.findMany({
      where: { userId },
      include: {
        BestDeal: true,
      },
      orderBy: { claimedAt: 'desc' },
    });

    return claims;
  }),
});
