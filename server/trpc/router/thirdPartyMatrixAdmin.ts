import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "../trpc";
import {
  placeUserInThirdPartyMatrix,
  reconcileThirdPartyMatrixPlacementsForSubmittedLinks,
} from "@/server/services/thirdPartyMatrix.service";

export const thirdPartyMatrixAdminRouter = createTRPCRouter({
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.thirdPartyMatrixSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", updatedAt: new Date() },
    });
    return settings as any;
  }),

  updateSettings: adminProcedure
    .input(
      z.object({
        isEnabled: z.boolean().optional(),
        allowAutoPlacement: z.boolean().optional(),
        allowAdminMaintenance: z.boolean().optional(),
        maxPlacementRetries: z.number().int().min(1).max(20).optional(),
        alertImbalanceThreshold: z.number().int().min(1).max(50).optional(),
      })
    )
    // @ts-ignore
    .mutation(async ({ ctx, input }) => {
      const settings = await (ctx.prisma.thirdPartyMatrixSettings as any).upsert({
        where: { id: "default" },
        update: input as any,
        create: {
          id: "default",
          updatedAt: new Date(),
          isEnabled: input.isEnabled ?? true,
          allowAutoPlacement: input.allowAutoPlacement ?? true,
          allowAdminMaintenance: input.allowAdminMaintenance ?? true,
          maxPlacementRetries: input.maxPlacementRetries ?? 3,
          alertImbalanceThreshold: input.alertImbalanceThreshold ?? 4,
        },
      });

      return {
        success: true,
        message: "Matrix settings updated",
        settings,
      };
    }),

  getOverview: adminProcedure.query(async ({ ctx }) => {
    await reconcileThirdPartyMatrixPlacementsForSubmittedLinks({
      prisma: ctx.prisma,
      sourceFlow: "admin-repair",
    });

    const [sponsors, nodes, placements, audits, latest] = await Promise.all([
      ctx.prisma.thirdPartyMatrixNode.groupBy({
        by: ["sponsorId"],
      }),
      ctx.prisma.thirdPartyMatrixNode.count(),
      ctx.prisma.thirdPartyMatrixPlacement.count(),
      ctx.prisma.thirdPartyMatrixPlacementAudit.count(),
      ctx.prisma.thirdPartyMatrixPlacementAudit.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          sponsor: {
            select: {
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const [leftPlacements, rightPlacements, fullNodes, openNodes] = await Promise.all([
      ctx.prisma.thirdPartyMatrixPlacement.count({ where: { leg: "LEFT" } }),
      ctx.prisma.thirdPartyMatrixPlacement.count({ where: { leg: "RIGHT" } }),
      ctx.prisma.thirdPartyMatrixNode.count({
        where: {
          NOT: [{ leftUserId: null }, { rightUserId: null }],
        },
      }),
      ctx.prisma.thirdPartyMatrixNode.count({
        where: {
          OR: [{ leftUserId: null }, { rightUserId: null }],
        },
      }),
    ]);

    return {
      totalSponsors: sponsors.length,
      totalNodes: nodes,
      totalPlacements: placements,
      totalAudits: audits,
      leftPlacements,
      rightPlacements,
      imbalance: Math.abs(leftPlacements - rightPlacements),
      fullNodes,
      openNodes,
      latestActivity: latest.map((row) => ({
        id: row.id,
        leg: row.leg,
        decisionBranch: row.decisionBranch,
        sourceFlow: row.sourceFlow,
        createdAt: row.createdAt,
        sponsorName:
          `${row.sponsor.firstname || ""} ${row.sponsor.lastname || ""}`.trim() || row.sponsor.email || "Sponsor",
        userName: `${row.user.firstname || ""} ${row.user.lastname || ""}`.trim() || row.user.email || "Member",
      })),
    };
  }),

  listSponsors: adminProcedure
    .input(
      z
        .object({
          query: z.string().nullish(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const query = input?.query?.trim();

      await reconcileThirdPartyMatrixPlacementsForSubmittedLinks({
        prisma: ctx.prisma,
        sourceFlow: "admin-repair",
      });

      const matchingSponsors = await ctx.prisma.user.findMany({
        where: query
          ? {
              OR: [
                { firstname: { contains: query, mode: "insensitive" } },
                { lastname: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        select: { id: true },
      });

      const matchedIds = matchingSponsors.map((row) => row.id);
      if (query && matchedIds.length === 0) {
        return [];
      }

      const rows = await ctx.prisma.thirdPartyMatrixNode.groupBy({
        by: ["sponsorId"],
        _count: { sponsorId: true },
        where: query
          ? {
              sponsorId: {
                in: matchedIds,
              },
            }
          : undefined,
        orderBy: {
          sponsorId: "asc",
        },
        take: limit,
      });

      const sponsorIds = rows.map((r) => r.sponsorId);
      const sponsors = await ctx.prisma.user.findMany({
        where: { id: { in: sponsorIds } },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      });

      const sponsorMap = new Map(sponsors.map((s) => [s.id, s]));

      const stats = await Promise.all(
        sponsorIds.map(async (sponsorId: string) => {
          const [placements, leftCount, rightCount] = await Promise.all([
            ctx.prisma.thirdPartyMatrixPlacement.count({ where: { sponsorId } }),
            ctx.prisma.thirdPartyMatrixPlacement.count({ where: { sponsorId, leg: "LEFT" } }),
            ctx.prisma.thirdPartyMatrixPlacement.count({ where: { sponsorId, leg: "RIGHT" } }),
          ]);
          return { sponsorId, placements, leftCount, rightCount };
        })
      );

      const statMap = new Map(stats.map((s: { sponsorId: string; placements: number; leftCount: number; rightCount: number }) => [s.sponsorId, s]));

      return rows.map((row) => {
        const sponsor = sponsorMap.get(row.sponsorId);
        const stat = statMap.get(row.sponsorId);
        return {
          sponsorId: row.sponsorId,
          sponsorName:
            `${sponsor?.firstname || ""} ${sponsor?.lastname || ""}`.trim() || sponsor?.email || "Sponsor",
          sponsorEmail: sponsor?.email || null,
          nodeCount: row._count.sponsorId,
          placementCount: stat?.placements ?? 0,
          leftCount: stat?.leftCount ?? 0,
          rightCount: stat?.rightCount ?? 0,
          imbalance: Math.abs((stat?.leftCount ?? 0) - (stat?.rightCount ?? 0)),
        };
      });
    }),

  getPlatformAnalytics: adminProcedure.query(async ({ ctx }) => {
    const platforms = await ctx.prisma.thirdPartyPlatform.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        DefaultAdminUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const rows = await Promise.all(
      platforms.map(async (platform: any) => {
        const ownerId = platform.defaultAdminUserId || null;

        const [totalSubmissions, totalRegistrations, recentSubmissions, ownerDownlineRows] = await Promise.all([
          ctx.prisma.userThirdPartyLink.count({ where: { platformId: platform.id } }),
          // Registrations = link submissions (submitting a link = completed external registration)
          ctx.prisma.userThirdPartyLink.count({ where: { platformId: platform.id } }),
          ctx.prisma.userThirdPartyLink.findMany({
            where: { platformId: platform.id },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: {
              User: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          }),
          ownerId
            ? ctx.prisma.user.findMany({
                where: { sponsorId: ownerId },
                select: { id: true },
              })
            : Promise.resolve([]),
        ]);

        const downlineIds = ownerDownlineRows.map((r: any) => r.id);

        const [downlineSubmissions, downlineRegistrations] = downlineIds.length
          ? await Promise.all([
              ctx.prisma.userThirdPartyLink.count({
                where: {
                  platformId: platform.id,
                  userId: { in: downlineIds },
                },
              }),
              // Downline "registered" = downline submitted their link
              ctx.prisma.userThirdPartyLink.count({
                where: {
                  platformId: platform.id,
                  userId: { in: downlineIds },
                },
              }),
            ])
          : [0, 0];

        const ownerDownlines = downlineIds.length;
        const downlineCompletionRate = ownerDownlines > 0 ? Math.round((downlineRegistrations / ownerDownlines) * 100) : 0;

        return {
          platformId: platform.id,
          platformName: platform.name,
          isActive: platform.isActive,
          ownerId,
          ownerName:
            `${platform.DefaultAdminUser?.firstname || ""} ${platform.DefaultAdminUser?.lastname || ""}`.trim() ||
            platform.DefaultAdminUser?.email ||
            "Unassigned",
          ownerRole: platform.DefaultAdminUser?.role || null,
          totalSubmissions,
          totalRegistrations,
          ownerDownlines,
          downlineSubmissions,
          downlineRegistrations,
          downlineCompletionRate,
          recentSubmissions: recentSubmissions.map((sub: any) => ({
            id: sub.id,
            createdAt: sub.createdAt,
            userId: sub.userId,
            userName:
              `${sub.User?.firstname || ""} ${sub.User?.lastname || ""}`.trim() ||
              sub.User?.email ||
              "Member",
            userEmail: sub.User?.email || null,
          })),
        };
      })
    );

    return rows;
  }),

  searchUsersForReset: adminProcedure
    .input(
      z.object({
        query: z.string().trim().min(2),
        limit: z.number().int().min(1).max(50).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          OR: [
            { firstname: { contains: input.query, mode: "insensitive" } },
            { lastname: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          sponsorId: true,
        },
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });

      const sponsorIds = Array.from(new Set(users.map((u) => u.sponsorId).filter(Boolean))) as string[];
      const sponsors = sponsorIds.length
        ? await ctx.prisma.user.findMany({
            where: { id: { in: sponsorIds } },
            select: { id: true, firstname: true, lastname: true, email: true },
          })
        : [];
      const sponsorMap = new Map(sponsors.map((s) => [s.id, s]));

      return users.map((u) => {
        const sponsor = u.sponsorId ? sponsorMap.get(u.sponsorId) : null;
        return {
          id: u.id,
          name: `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.email || "Member",
          email: u.email,
          sponsorId: u.sponsorId,
          sponsorName: sponsor
            ? `${sponsor.firstname || ""} ${sponsor.lastname || ""}`.trim() || sponsor.email || "Sponsor"
            : null,
        };
      });
    }),

  resetUserPlatformSubmission: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        platformId: z.string().min(1),
        removeRegistration: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user, platform] = await Promise.all([
        ctx.prisma.user.findUnique({
          where: { id: input.userId },
          select: { id: true, firstname: true, lastname: true, email: true },
        }),
        ctx.prisma.thirdPartyPlatform.findUnique({
          where: { id: input.platformId },
          select: { id: true, name: true },
        }),
      ]);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (!platform) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Platform not found" });
      }

      const result = await ctx.prisma.$transaction(async (tx) => {
        const deletedLink = await tx.userThirdPartyLink.deleteMany({
          where: {
            userId: input.userId,
            platformId: input.platformId,
          },
        });

        const deletedRegistration = input.removeRegistration
          ? await tx.thirdPartyRegistration.deleteMany({
              where: {
                userId: input.userId,
                platformId: input.platformId,
              },
            })
          : { count: 0 };

        return {
          deletedLinks: deletedLink.count,
          deletedRegistrations: deletedRegistration.count,
        };
      });

      return {
        success: true,
        message: `Reset complete for ${(user.firstname || "") + " " + (user.lastname || "")}`.trim() || user.email || "user",
        platformName: platform.name,
        ...result,
      };
    }),

  getSponsorDetails: adminProcedure
    .input(z.object({ sponsorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sponsor = await ctx.prisma.user.findUnique({
        where: { id: input.sponsorId },
        select: { id: true, firstname: true, lastname: true, email: true },
      });

      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }

      const [nodes, placements] = await Promise.all([
        ctx.prisma.thirdPartyMatrixNode.findMany({
          where: { sponsorId: input.sponsorId },
          orderBy: { sequence: "asc" },
          include: {
            leftUser: { select: { firstname: true, lastname: true, email: true } },
            rightUser: { select: { firstname: true, lastname: true, email: true } },
          },
        }),
        ctx.prisma.thirdPartyMatrixPlacementAudit.findMany({
          where: { sponsorId: input.sponsorId },
          take: 100,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        }),
      ]);

      return {
        sponsor: {
          id: sponsor.id,
          name: `${sponsor.firstname || ""} ${sponsor.lastname || ""}`.trim() || sponsor.email || "Sponsor",
          email: sponsor.email,
        },
        nodes,
        placements,
      };
    }),

  repairPlacement: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        sponsorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await placeUserInThirdPartyMatrix({
        prisma: ctx.prisma,
        userId: input.userId,
        sponsorId: input.sponsorId,
        sourceFlow: "admin-repair",
      });

      if (!result.placed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Repair failed: ${result.reason}`,
        });
      }

      return {
        success: true,
        message: "Placement repaired successfully",
        placement: result.placement,
      };
    }),

  resetSponsorNodes: adminProcedure
    .input(z.object({ sponsorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.thirdPartyMatrixSettings.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", updatedAt: new Date() },
      });

      if (!settings.allowAdminMaintenance) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admin maintenance actions are disabled",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.thirdPartyMatrixPlacement.deleteMany({ where: { sponsorId: input.sponsorId } });
        await tx.thirdPartyMatrixNode.deleteMany({ where: { sponsorId: input.sponsorId } });
        await tx.thirdPartyMatrixSponsorState.deleteMany({ where: { sponsorId: input.sponsorId } });
      });

      return {
        success: true,
        message: "Sponsor matrix nodes reset",
      };
    }),

  getPlacementReport: adminProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        sponsorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.thirdPartyMatrixPlacementAudit.findMany({
        where: {
          sponsorId: input.sponsorId,
          createdAt:
            input.from || input.to
              ? {
                  gte: input.from,
                  lte: input.to,
                }
              : undefined,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
        include: {
          sponsor: { select: { firstname: true, lastname: true, email: true } },
          user: { select: { firstname: true, lastname: true, email: true } },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        leg: row.leg,
        decisionBranch: row.decisionBranch,
        sourceFlow: row.sourceFlow,
        sponsorName:
          `${row.sponsor.firstname || ""} ${row.sponsor.lastname || ""}`.trim() || row.sponsor.email || "Sponsor",
        userName: `${row.user.firstname || ""} ${row.user.lastname || ""}`.trim() || row.user.email || "Member",
      }));
    }),

  exportPlacementReportCsv: adminProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.thirdPartyMatrixPlacementAudit.findMany({
        where:
          input.from || input.to
            ? {
                createdAt: {
                  gte: input.from,
                  lte: input.to,
                },
              }
            : undefined,
        orderBy: { createdAt: "desc" },
        take: 2000,
        include: {
          sponsor: { select: { firstname: true, lastname: true, email: true } },
          user: { select: { firstname: true, lastname: true, email: true } },
        },
      });

      const header = ["date", "sponsor", "member", "leg", "decision_branch", "source_flow"];
      const lines = rows.map((row) => {
        const sponsor = `${row.sponsor.firstname || ""} ${row.sponsor.lastname || ""}`.trim() || row.sponsor.email || "Sponsor";
        const user = `${row.user.firstname || ""} ${row.user.lastname || ""}`.trim() || row.user.email || "Member";
        return [
          row.createdAt.toISOString(),
          sponsor,
          user,
          row.leg,
          row.decisionBranch,
          row.sourceFlow,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",");
      });

      return {
        fileName: `third-party-matrix-report-${Date.now()}.csv`,
        csv: [header.join(","), ...lines].join("\n"),
      };
    }),
});
