import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { reconcileThirdPartyMatrixPlacementsForSubmittedLinks } from "@/server/services/thirdPartyMatrix.service";

export const thirdPartyMatrixRouter = createTRPCRouter({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const sponsorId = ctx.session!.user.id;

    const directDownlines = await ctx.prisma.user.findMany({
      where: { sponsorId },
      select: { id: true },
    });

    await reconcileThirdPartyMatrixPlacementsForSubmittedLinks({
      prisma: ctx.prisma,
      userIds: [sponsorId, ...directDownlines.map((d) => d.id)],
      sourceFlow: "admin-repair",
    });

    const [nodes, placements, lastPlacement, sponsorState, settings] = await Promise.all([
      ctx.prisma.thirdPartyMatrixNode.findMany({
        where: { sponsorId, isActive: true },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          sequence: true,
          leftUserId: true,
          rightUserId: true,
          leftWeight: true,
          rightWeight: true,
          createdAt: true,
        },
      }),
      ctx.prisma.thirdPartyMatrixPlacement.findMany({
        where: { sponsorId },
        select: { leg: true, createdAt: true },
      }),
      ctx.prisma.thirdPartyMatrixPlacement.findFirst({
        where: { sponsorId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, leg: true },
      }),
      ctx.prisma.thirdPartyMatrixSponsorState.findUnique({
        where: { sponsorId },
        select: { nextPreferredLeg: true },
      }),
      (ctx.prisma.thirdPartyMatrixSettings as any).findUnique({
        where: { id: "default" },
        select: { isEnabled: true, allowAutoPlacement: true },
      }),
    ]);

    const settingsRecord = settings as any;

    const totalNodes = nodes.length;
    const filledLeft = nodes.filter((n) => !!n.leftUserId).length;
    const filledRight = nodes.filter((n) => !!n.rightUserId).length;
    const totalPlacements = placements.length;
    const openLegs = totalNodes * 2 - (filledLeft + filledRight);
    const leftPlacements = placements.filter((p) => p.leg === "LEFT").length;
    const rightPlacements = placements.filter((p) => p.leg === "RIGHT").length;
    const imbalance = Math.abs(leftPlacements - rightPlacements);

    return {
      totalNodes,
      totalPlacements,
      filledLeft,
      filledRight,
      openLegs,
      imbalance,
      leftPlacements,
      rightPlacements,
      nextPreferredLeg: sponsorState?.nextPreferredLeg ?? "LEFT",
      lastPlacementAt: lastPlacement?.createdAt ?? null,
      lastPlacementLeg: lastPlacement?.leg ?? null,
      isEnabled: settingsRecord?.isEnabled ?? true,
      allowAutoPlacement: settingsRecord?.allowAutoPlacement ?? true,
    };
  }),

  getMyNodes: protectedProcedure.query(async ({ ctx }) => {
    const sponsorId = ctx.session!.user.id;

    const nodes = await ctx.prisma.thirdPartyMatrixNode.findMany({
      where: { sponsorId, isActive: true },
      orderBy: { sequence: "asc" },
      include: {
        leftUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        rightUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    return nodes.map((node) => ({
      id: node.id,
      sequence: node.sequence,
      leftWeight: node.leftWeight,
      rightWeight: node.rightWeight,
      leftUser: node.leftUser
        ? {
            id: node.leftUser.id,
            name: `${node.leftUser.firstname || ""} ${node.leftUser.lastname || ""}`.trim() || node.leftUser.email || "Member",
            email: node.leftUser.email,
          }
        : null,
      rightUser: node.rightUser
        ? {
            id: node.rightUser.id,
            name: `${node.rightUser.firstname || ""} ${node.rightUser.lastname || ""}`.trim() || node.rightUser.email || "Member",
            email: node.rightUser.email,
          }
        : null,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    }));
  }),

  getPlacementHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const sponsorId = ctx.session!.user.id;
      const limit = input?.limit ?? 50;

      const rows = await ctx.prisma.thirdPartyMatrixPlacementAudit.findMany({
        where: { sponsorId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        nodeId: row.nodeId,
        leg: row.leg,
        decisionBranch: row.decisionBranch,
        sourceFlow: row.sourceFlow,
        createdAt: row.createdAt,
        user: {
          id: row.user.id,
          name: `${row.user.firstname || ""} ${row.user.lastname || ""}`.trim() || row.user.email || "Member",
          email: row.user.email,
        },
      }));
    }),

  getTeamReport: protectedProcedure.query(async ({ ctx }) => {
    const sponsorId = ctx.session!.user.id;

    const downlineRows = await ctx.prisma.user.findMany({
      where: { sponsorId },
      select: { id: true },
    });

    await reconcileThirdPartyMatrixPlacementsForSubmittedLinks({
      prisma: ctx.prisma,
      userIds: [sponsorId, ...downlineRows.map((d) => d.id)],
      sourceFlow: "admin-repair",
    });

    const directDownlines = downlineRows.length;

    const placedTeam = await ctx.prisma.thirdPartyMatrixPlacement.count({
      where: { sponsorId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPlacements = await ctx.prisma.thirdPartyMatrixPlacement.count({
      where: {
        sponsorId,
        createdAt: { gte: today },
      },
    });

    return {
      directDownlines,
      placedTeam,
      pendingTeam: Math.max(0, directDownlines - placedTeam),
      todayPlacements,
      completionRate: directDownlines > 0 ? Math.round((placedTeam / directDownlines) * 100) : 0,
    };
  }),
});
