import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const currencyRouter = createTRPCRouter({
  // Get all currencies
  getAll: publicProcedure.query(async () => {
    return await prisma.currencyManagement.findMany({
      orderBy: { default: 'desc' },
    });
  }),

  // Get default currency
  getDefault: publicProcedure.query(async () => {
    return await prisma.currencyManagement.findFirst({
      where: { default: 1 },
    });
  }),

  // Get exchange rates for all currencies
  getExchangeRates: publicProcedure.query(async () => {
    const currencies = await prisma.currencyManagement.findMany();
    const rates: Record<string, number> = {};
    currencies.forEach((currency) => {
      rates[currency.symbol] = currency.rate;
    });
    return rates;
  }),

  // Convert currency
  convertCurrency: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      const fromCurrency = await prisma.currencyManagement.findFirst({
        where: { symbol: input.from },
      });
      const toCurrency = await prisma.currencyManagement.findFirst({
        where: { symbol: input.to },
      });

      if (!fromCurrency || !toCurrency) {
        throw new Error('Currency not supported');
      }

      const fromRate = fromCurrency.rate;
      const toRate = toCurrency.rate;
      const converted = (input.amount / fromRate) * toRate;

      return {
        original: input.amount,
        converted,
        from: input.from,
        to: input.to,
        rate: toRate / fromRate,
      };
    }),

  // Get supported currencies
  getSupportedCurrencies: publicProcedure.query(async () => {
    const currencies = await prisma.currencyManagement.findMany();
    return currencies.map((c) => c.symbol);
  }),

  // Set user's preferred currency
  setUserCurrency: protectedProcedure
    .input(
      z.object({
        currencyId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error('User not authenticated');
      }

      const userId = (ctx.session.user as any).id;

      // Verify currency exists
      const currency = await prisma.currencyManagement.findUnique({
        where: { id: input.currencyId },
      });

      if (!currency) {
        throw new Error('Currency not found');
      }

      // Update user's preferred currency in session or database
      // For now, we'll return success (you can extend this to save to user profile)
      return {
        success: true,
        currency,
      };
    }),
});
