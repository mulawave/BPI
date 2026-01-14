import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
      // Placeholder: Return error
      throw new Error("Solar assessment feature is under development");
    }),

  getMyAssessments: protectedProcedure.query(async ({ ctx }) => {
    // Placeholder: Return empty array
    return [];
  }),

  getAssessmentById: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Placeholder: Return null
      return null;
    }),

  calculateEstimate: protectedProcedure
    .input(
      z.object({
        roofArea: z.number().positive(),
        monthlyBill: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      // Placeholder calculation
      const estimatedPanels = Math.ceil(input.roofArea / 2);
      const estimatedCost = estimatedPanels * 150000;
      const monthlySavings = input.monthlyBill * 0.7;

      return {
        estimatedPanels,
        estimatedCost,
        monthlySavings,
        paybackPeriod: Math.ceil(estimatedCost / (monthlySavings * 12)),
      };
    }),
});
