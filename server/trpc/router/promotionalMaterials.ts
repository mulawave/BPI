import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const promotionalMaterialsRouter = createTRPCRouter({
  // Get all materials
  getMaterials: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        type: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
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

      const where: any = {
        isActive: true,
      };

      if (input.category) {
        where.category = input.category;
      }

      if (input.type) {
        where.type = input.type;
      }

      const materials = await ctx.db.promotionalMaterial.findMany({
        where,
        take: input.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          downloads: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      // Filter by access control
      const accessibleMaterials = materials.filter((material) => {
        // Check package level
        if (material.minPackageLevel) {
          // TODO: Add package level comparison logic
          // For now, assume all packages have access
        }

        // Check rank
        if (material.minRank) {
          // TODO: Add rank comparison logic
        }

        return true;
      });

      return {
        materials: accessibleMaterials.map(m => ({
          ...m,
          hasDownloaded: m.downloads.length > 0,
          lastDownloadedAt: m.downloads[0]?.downloadedAt,
        })),
        totalCount: accessibleMaterials.length,
      };
    }),

  // Download/track material
  downloadMaterial: protectedProcedure
    .input(z.object({ materialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const material = await ctx.db.promotionalMaterial.findUnique({
        where: { id: input.materialId },
      });

      if (!material || !material.isActive) {
        return { success: false, error: "Material not found or inactive" };
      }

      // Track download
      await ctx.db.materialDownload.create({
        data: {
          userId: ctx.session.user.id,
          materialId: input.materialId,
        },
      });

      // Increment download count
      await ctx.db.promotionalMaterial.update({
        where: { id: input.materialId },
        data: {
          downloadCount: { increment: 1 },
        },
      });

      return {
        success: true,
        fileUrl: material.fileUrl,
      };
    }),

  // Track share
  trackShare: protectedProcedure
    .input(z.object({ materialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.promotionalMaterial.update({
        where: { id: input.materialId },
        data: {
          shareCount: { increment: 1 },
        },
      });

      return { success: true };
    }),

  // Get download history
  getMyDownloads: protectedProcedure.query(async ({ ctx }) => {
    const downloads = await ctx.db.materialDownload.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        material: true,
      },
      orderBy: {
        downloadedAt: 'desc',
      },
      take: 50,
    });

    return downloads;
  }),

  // Get categories
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const materials = await ctx.db.promotionalMaterial.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return materials.map(m => m.category);
  }),
});
