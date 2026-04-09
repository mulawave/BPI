import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { randomUUID } from "crypto";

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
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
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

      const materials = await ctx.prisma.promotionalMaterial.findMany({
        where,
        take: input.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          MaterialDownload: {
            where: {
              userId: userId,
            },
          },
        },
      });

      // Resolve user's active package price for access control
      let userPackagePrice = 0;
      if (user?.activeMembershipPackageId) {
        const userPkg = await ctx.prisma.membershipPackage.findUnique({
          where: { id: user.activeMembershipPackageId },
          select: { price: true },
        });
        userPackagePrice = userPkg?.price ?? 0;
      }

      const userRank = (user as any)?.rank ?? "Newbie";

      // Known rank hierarchy (lowest to highest)
      const RANK_ORDER = ["Newbie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ambassador"];

      // Filter by access control
      const accessibleMaterials = materials.filter((material) => {
        // Check package level — compare by price of the minimum required package
        if (material.minPackageLevel) {
          // minPackageLevel stores a package name; we resolve its price lazily below
          (material as any)._needsPkgCheck = true;
        }

        // Check rank
        if (material.minRank) {
          const userIdx = RANK_ORDER.indexOf(userRank);
          const minIdx = RANK_ORDER.indexOf(material.minRank);
          if (minIdx >= 0 && (userIdx < 0 || userIdx < minIdx)) {
            return false;
          }
        }

        return true;
      });

      // Batch-resolve minPackageLevel prices for materials that need it
      const pkgNames = [
        ...new Set(
          accessibleMaterials
            .filter((m) => m.minPackageLevel)
            .map((m) => m.minPackageLevel as string)
        ),
      ];
      const pkgPrices: Record<string, number> = {};
      if (pkgNames.length > 0) {
        const pkgs = await ctx.prisma.membershipPackage.findMany({
          where: { name: { in: pkgNames } },
          select: { name: true, price: true },
        });
        for (const p of pkgs) pkgPrices[p.name] = p.price;
      }

      const finalMaterials = accessibleMaterials.filter((material) => {
        if (material.minPackageLevel) {
          const requiredPrice = pkgPrices[material.minPackageLevel] ?? 0;
          if (userPackagePrice < requiredPrice) return false;
        }
        return true;
      });

      return {
        materials: finalMaterials.map(m => ({
          ...m,
          // UI expects these names
          downloads: m.downloadCount,
          views: m.shareCount,

          hasDownloaded: m.MaterialDownload.length > 0,
          lastDownloadedAt: m.MaterialDownload[0]?.downloadedAt,
        })),
        totalCount: finalMaterials.length,
      };
    }),

  // Download/track material
  downloadMaterial: protectedProcedure
    .input(z.object({ materialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const material = await ctx.prisma.promotionalMaterial.findUnique({
        where: { id: input.materialId },
      });

      if (!material || !material.isActive) {
        return { success: false, error: "Material not found or inactive" };
      }

      // Track download
      await ctx.prisma.materialDownload.create({
        data: {
          id: randomUUID(),
          userId: userId,
          materialId: input.materialId,
        },
      });

      // Increment download count
      await ctx.prisma.promotionalMaterial.update({
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
      await ctx.prisma.promotionalMaterial.update({
        where: { id: input.materialId },
        data: {
          shareCount: { increment: 1 },
        },
      });

      return { success: true };
    }),

  // Get download history
  getMyDownloads: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const downloads = await ctx.prisma.materialDownload.findMany({
      where: {
        userId: userId,
      },
      include: {
        PromotionalMaterial: true,
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
    const materials = await ctx.prisma.promotionalMaterial.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return materials.map(m => m.category);
  }),
});
