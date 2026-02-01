import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { randomUUID } from "crypto";

// Admin middleware
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }
  const userRole = (ctx.session.user as any).role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new Error("UNAUTHORIZED: You must be an admin to perform this action.");
  }
  return next();
});

export const digitalFarmRouter = createTRPCRouter({
  // Get all available crops
  getCrops: protectedProcedure.query(async ({ ctx }) => {
    const crops = await ctx.prisma.cropType.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return crops;
  }),

  // Get user's plots
  getMyPlots: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    const plots = await ctx.prisma.farmPlot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        Activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return plots;
  }),

  // Get plot by ID
  getPlotById: protectedProcedure
    .input(z.object({ plotId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const plot = await ctx.prisma.farmPlot.findFirst({
        where: {
          id: input.plotId,
          userId,
        },
        include: {
          Activities: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return plot;
    }),

  // Plant a new crop
  plantCrop: protectedProcedure
    .input(
      z.object({
        cropType: z.string(),
        plotName: z.string(),
        plotSize: z.number().min(0.1).max(100),
        investmentAmount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      // Get crop details
      const crop = await ctx.prisma.cropType.findUnique({
        where: { name: input.cropType },
      });

      if (!crop) {
        throw new Error("Crop not found");
      }

      // Validate investment
      if (input.investmentAmount < crop.minInvestment || input.investmentAmount > crop.maxInvestment) {
        throw new Error(`Investment must be between ₦${crop.minInvestment.toLocaleString()} and ₦${crop.maxInvestment.toLocaleString()}`);
      }

      // Check user balance
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: true },
      });

      if (!user || user.wallet < input.investmentAmount) {
        throw new Error("Insufficient wallet balance");
      }

      // Calculate estimates
      const estimatedYield = input.plotSize * crop.yieldPerHectare;
      const estimatedRevenue = estimatedYield * crop.pricePerKg;
      const harvestDate = new Date();
      harvestDate.setDate(harvestDate.getDate() + crop.growthDuration);

      // Deduct from wallet
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          wallet: { decrement: input.investmentAmount },
        },
      });

      // Create plot
      const plot = await ctx.prisma.farmPlot.create({
        data: {
          id: randomUUID(),
          userId,
          plotName: input.plotName,
          cropType: input.cropType,
          plotSize: input.plotSize,
          investmentAmount: input.investmentAmount,
          stage: "seeded",
          progress: 0,
          daysRemaining: crop.growthDuration,
          estimatedYield,
          estimatedRevenue,
          harvestDate,
          imageUrl: crop.imageUrl,
        },
      });

      // Create activity log
      await ctx.prisma.farmActivity.create({
        data: {
          id: randomUUID(),
          plotId: plot.id,
          activityType: "seeding",
          description: `Planted ${input.cropType} on ${input.plotSize} hectares`,
        },
      });

      // Create transaction record
      await ctx.prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "DIGITAL_FARM_INVESTMENT",
          amount: input.investmentAmount,
          description: `Invested in Digital Farm - ${input.plotName}`,
          status: "completed",
          reference: plot.id,
          walletType: "main",
        },
      });

      return plot;
    }),

  // Harvest a plot
  harvestPlot: protectedProcedure
    .input(z.object({ plotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Not authenticated");

      const plot = await ctx.prisma.farmPlot.findFirst({
        where: {
          id: input.plotId,
          userId,
          status: "active",
        },
      });

      if (!plot) {
        throw new Error("Plot not found or already harvested");
      }

      if (plot.progress < 100) {
        throw new Error("Crop is not ready for harvest yet");
      }

      // Calculate actual yield (with some randomness)
      const yieldVariance = 0.9 + Math.random() * 0.2; // 90% to 110%
      const actualYield = plot.estimatedYield * yieldVariance;
      const crop = await ctx.prisma.cropType.findUnique({
        where: { name: plot.cropType },
      });
      const actualRevenue = actualYield * (crop?.pricePerKg || 0);

      // Update plot
      const updatedPlot = await ctx.prisma.farmPlot.update({
        where: { id: input.plotId },
        data: {
          stage: "completed",
          status: "harvested",
          progress: 100,
          actualYield,
          actualRevenue,
          completedAt: new Date(),
        },
      });

      // Credit user wallet
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          wallet: { increment: actualRevenue },
        },
      });

      // Create activity log
      await ctx.prisma.farmActivity.create({
        data: {
          id: randomUUID(),
          plotId: input.plotId,
          activityType: "harvesting",
          description: `Harvested ${actualYield.toFixed(2)} kg, earned ₦${actualRevenue.toLocaleString()}`,
        },
      });

      // Create transaction record
      await ctx.prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "DIGITAL_FARM_EARNINGS",
          amount: actualRevenue,
          description: `Digital Farm Harvest - ${plot.plotName}`,
          status: "completed",
          reference: plot.id,
          walletType: "main",
        },
      });

      return {
        plot: updatedPlot,
        actualYield,
        actualRevenue,
        profit: actualRevenue - plot.investmentAmount,
      };
    }),

  // Get farm statistics
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("Not authenticated");

    const plots = await ctx.prisma.farmPlot.findMany({
      where: { userId },
    });

      const totalInvested = plots.reduce((sum: number, plot) => sum + plot.investmentAmount, 0);
    const totalEarned = plots.reduce((sum: number, plot) => sum + (plot.actualRevenue || 0), 0);
    const activePlots = plots.filter((p: any) => p.status === "active").length;
    const harvestedPlots = plots.filter((p: any) => p.status === "harvested").length;

    return {
      totalPlots: plots.length,
      activePlots,
      harvestedPlots,
      totalInvested,
      totalEarned,
      netProfit: totalEarned - totalInvested,
      roi: totalInvested > 0 ? ((totalEarned - totalInvested) / totalInvested) * 100 : 0,
    };
  }),

  // Admin: Get all crops
  adminGetCrops: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.cropType.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }),

  // Admin: Create crop
  adminCreateCrop: adminProcedure
    .input(
      z.object({
        name: z.string(),
        category: z.string(),
        description: z.string(),
        growthDuration: z.number(),
        minInvestment: z.number(),
        maxInvestment: z.number(),
        yieldPerHectare: z.number(),
        pricePerKg: z.number(),
        imageUrl: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.cropType.create({
        data: {
          id: randomUUID(),
          ...input,
          isActive: true,
        },
      });
    }),

  // Admin: Update crop
  adminUpdateCrop: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        growthDuration: z.number().optional(),
        minInvestment: z.number().optional(),
        maxInvestment: z.number().optional(),
        yieldPerHectare: z.number().optional(),
        pricePerKg: z.number().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.cropType.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    }),

  // Admin: Delete crop
  adminDeleteCrop: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.cropType.delete({
        where: { id: input.id },
      });
    }),

  // Admin: Get all plots
  adminGetAllPlots: adminProcedure
    .input(
      z.object({
        status: z.enum(["active", "harvested", "failed"]).optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) where.status = input.status;

      return await ctx.prisma.farmPlot.findMany({
        where,
        take: input.limit || 50,
        orderBy: { createdAt: 'desc' },
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
      });
    }),

  // Admin: Get statistics
  adminGetStats: adminProcedure.query(async ({ ctx }) => {
    const totalPlots = await ctx.prisma.farmPlot.count();
    const activePlots = await ctx.prisma.farmPlot.count({ where: { status: "active" } });
    const harvestedPlots = await ctx.prisma.farmPlot.count({ where: { status: "harvested" } });

    const investmentSum = await ctx.prisma.farmPlot.aggregate({
      _sum: { investmentAmount: true },
    });

    const revenueSum = await ctx.prisma.farmPlot.aggregate({
      _sum: { actualRevenue: true },
      where: { status: "harvested" },
    });

    return {
      totalPlots,
      activePlots,
      harvestedPlots,
      totalInvestment: investmentSum._sum.investmentAmount || 0,
      totalRevenue: revenueSum._sum.actualRevenue || 0,
    };
  }),
});
