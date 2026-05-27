import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const CURRENCY_CACHE_TTL_MS = 30_000;

let currencyListCache: { value: any[]; expiresAt: number } | null = null;
let currencyListInFlight: Promise<any[]> | null = null;

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

async function getCachedCurrencyList() {
  if (currencyListCache && isFresh(currencyListCache.expiresAt)) {
    return currencyListCache.value;
  }

  if (currencyListInFlight) {
    return currencyListInFlight;
  }

  currencyListInFlight = prisma.currencyManagement.findMany({
    orderBy: { default: "desc" },
  });

  try {
    const currencies = await currencyListInFlight;
    currencyListCache = {
      value: currencies,
      expiresAt: Date.now() + CURRENCY_CACHE_TTL_MS,
    };
    return currencies;
  } finally {
    currencyListInFlight = null;
  }
}

export const currencyRouter = createTRPCRouter({
  // Get all currencies
  getAll: publicProcedure.query(async () => {
    return await getCachedCurrencyList();
  }),

  // Get default currency
  getDefault: publicProcedure.query(async () => {
    const currencies = await getCachedCurrencyList();
    return currencies.find((currency) => currency.default === 1) || null;
  }),

  // Get exchange rates for all currencies
  getExchangeRates: publicProcedure.query(async () => {
    const currencies = await getCachedCurrencyList();
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
      const currencies = await getCachedCurrencyList();
      const fromCurrency = currencies.find((currency) => currency.symbol === input.from);
      const toCurrency = currencies.find((currency) => currency.symbol === input.to);

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
    const currencies = await getCachedCurrencyList();
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
