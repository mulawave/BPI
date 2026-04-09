import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const COST_PER_PANEL_NAIRA = 150000;
const PANEL_SIZE_SQM = 2;
const PANEL_CAPACITY_KW = 0.55;
const AVG_TARIFF_PER_KWH = 225;
const MAX_BILL_COVERAGE = 0.85;

function buildSolarEstimate(roofArea: number, monthlyBill: number) {
  const safeRoofArea = Math.max(roofArea, 0);
  const safeMonthlyBill = Math.max(monthlyBill, 0);
  const estimatedPanels = Math.max(1, Math.ceil(safeRoofArea / PANEL_SIZE_SQM));
  const estimatedSystemSize = Number((estimatedPanels * PANEL_CAPACITY_KW).toFixed(1));
  const estimatedMonthlyUsage = Number((safeMonthlyBill / AVG_TARIFF_PER_KWH).toFixed(1));
  const generatedMonthlyOffset = estimatedSystemSize * 5 * 30 * 0.55;
  const coverageRatio = estimatedMonthlyUsage > 0
    ? Math.min(MAX_BILL_COVERAGE, generatedMonthlyOffset / estimatedMonthlyUsage)
    : 0;
  const estimatedSavings = Math.round(safeMonthlyBill * coverageRatio);
  const estimatedCost = estimatedPanels * COST_PER_PANEL_NAIRA;
  const paybackPeriod = Math.max(1, Math.ceil(estimatedCost / Math.max(estimatedSavings * 12, 1)));
  const recommendedSystem = `${estimatedSystemSize}kW hybrid rooftop solar package`;

  return {
    estimatedPanels,
    estimatedSystemSize,
    estimatedCost,
    estimatedSavings,
    estimatedMonthlyUsage,
    paybackPeriod,
    recommendedSystem,
  };
}

export const solarAssessmentRouter = createTRPCRouter({
  requestAssessment: protectedProcedure
    .input(
      z.object({
        address: z.string(),
        roofArea: z.number().positive(),
        monthlyElectricityBill: z.number().positive(),
        buildingType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");

      const estimate = buildSolarEstimate(input.roofArea, input.monthlyElectricityBill);

      return await prisma.solarAssessment.create({
        data: {
          id: randomUUID(),
          userId: ctx.session.user.id,
          assessmentStatus: "pending",
          location: input.address,
          propertyType: input.buildingType,
          currentEnergyBill: input.monthlyElectricityBill,
          averageMonthlyUsage: estimate.estimatedMonthlyUsage,
          roofArea: input.roofArea,
          estimatedSystemSize: estimate.estimatedSystemSize,
          estimatedSavings: estimate.estimatedSavings,
          recommendedSystem: estimate.recommendedSystem,
          quotedAmount: estimate.estimatedCost,
          updatedAt: new Date(),
        },
      });
    }),

  getMyAssessments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");

    return await prisma.solarAssessment.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getAssessmentById: protectedProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");

      const assessment = await prisma.solarAssessment.findFirst({
        where: {
          id: input.assessmentId,
          userId: ctx.session.user.id,
        },
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      return assessment;
    }),

  calculateEstimate: protectedProcedure
    .input(
      z.object({
        roofArea: z.number().positive(),
        monthlyBill: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      const estimate = buildSolarEstimate(input.roofArea, input.monthlyBill);

      return {
        estimatedPanels: estimate.estimatedPanels,
        estimatedCost: estimate.estimatedCost,
        monthlySavings: estimate.estimatedSavings,
        paybackPeriod: estimate.paybackPeriod,
        recommendedSystem: estimate.recommendedSystem,
      };
    }),
});
