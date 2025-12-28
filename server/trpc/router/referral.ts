import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const referralRouter = createTRPCRouter({
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get referrals made by this user
    const referrals = await ctx.prisma.$queryRaw`
      SELECT 
        r.id,
        r.status,
        r."rewardPaid",
        r."createdAt",
        u.name as referredUserName,
        u.email as referredUserEmail
      FROM "Referral" r
      JOIN "User" u ON r."referredId" = u.id
      WHERE r."referrerId" = ${userId}
      ORDER BY r."createdAt" DESC
    `;

    return { referrals };
  }),

  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get referral statistics using Prisma aggregation
    const totalreferrals = await ctx.prisma.referral.count({
      where: { referrerId: userId }
    });

    const activereferrals = await ctx.prisma.referral.count({
      where: { 
        referrerId: userId,
        status: 'active'
      }
    });

    const paidreferrals = await ctx.prisma.referral.count({
      where: { 
        referrerId: userId,
        rewardPaid: true
      }
    });

    return {
      totalreferrals,
      activereferrals,
      paidreferrals,
    };
  }),
});