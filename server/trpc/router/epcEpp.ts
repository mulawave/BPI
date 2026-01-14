import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const epcEppRouter = createTRPCRouter({
  getMyStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    let epcStatus = await prisma.ePCandEPP.findUnique({
      where: { userId },
    });

    if (!epcStatus) {
      epcStatus = await prisma.ePCandEPP.create({
        data: {
          id: randomUUID(),
          userId,
          updatedAt: new Date(),
        },
      });
    }

    return epcStatus;
  }),

  getLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      const leaders = await prisma.ePCandEPP.findMany({
        where: { totalPoints: { gt: 0 } },
        orderBy: { totalPoints: 'desc' },
        take: input.limit,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      return {
        leaders: leaders.map((leader, index) => ({
          userId: leader.userId,
          name: `${leader.User.firstname || ''} ${leader.User.lastname || ''}`.trim() || 'Anonymous',
          points: leader.totalPoints,
          rank: leader.currentRank,
          region: leader.region,
        })),
      };
    }),

  getProgramInfo: protectedProcedure.query(async ({ ctx }) => {
    return {
      name: "Energy Performance Certification Program",
      description: "Earn points through activities and climb the ranks",
      enrolled: true,
    };
  }),
});
