import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const ADMIN_CURRENCY_CACHE_TTL_MS = 30_000;
let adminCurrencyCache: { value: any[]; expiresAt: number } | null = null;
let adminCurrencyInFlight: Promise<any[]> | null = null;

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

async function getCachedAdminCurrencies() {
  if (adminCurrencyCache && isFresh(adminCurrencyCache.expiresAt)) {
    return adminCurrencyCache.value;
  }

  if (adminCurrencyInFlight) {
    return adminCurrencyInFlight;
  }

  adminCurrencyInFlight = prisma.currencyManagement.findMany({
    orderBy: [
      { default: "desc" },
      { symbol: "asc" },
    ],
  });

  try {
    const currencies = await adminCurrencyInFlight;
    adminCurrencyCache = {
      value: currencies,
      expiresAt: Date.now() + ADMIN_CURRENCY_CACHE_TTL_MS,
    };
    return currencies;
  } finally {
    adminCurrencyInFlight = null;
  }
}

function invalidateAdminCurrencyCache() {
  adminCurrencyCache = null;
}



export const adminCurrencyRouter = createTRPCRouter({
  // Get all currencies with details
  getAllCurrencies: adminProcedure.query(async () => {
    return await getCachedAdminCurrencies();
  }),

  // Update currency rate
  updateCurrencyRate: adminProcedure
    .input(
      z.object({
        currencyId: z.string(),
        rate: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const updated = await prisma.currencyManagement.update({
        where: { id: input.currencyId },
        data: { 
          rate: input.rate,
        },
      });

      invalidateAdminCurrencyCache();

      return {
        success: true,
        currency: updated,
      };
    }),

  // Set default currency
  setDefaultCurrency: adminProcedure
    .input(
      z.object({
        currencyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // First, remove default from all currencies
      await prisma.currencyManagement.updateMany({
        data: { default: null },
      });

      // Set the new default
      const updated = await prisma.currencyManagement.update({
        where: { id: input.currencyId },
        data: { default: 1 },
      });

      invalidateAdminCurrencyCache();

      return {
        success: true,
        currency: updated,
      };
    }),

  // Add new currency
  addCurrency: adminProcedure
    .input(
      z.object({
        name: z.string(),
        symbol: z.string(),
        sign: z.string(),
        rate: z.number().positive(),
        country: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const currency = await prisma.currencyManagement.create({
        data: {
          id: `${input.symbol}_${Date.now()}`,
          name: input.name,
          symbol: input.symbol,
          sign: input.sign,
          rate: input.rate,
          country: input.country,
        },
      });

      invalidateAdminCurrencyCache();

      return {
        success: true,
        currency,
      };
    }),

  // Delete currency
  deleteCurrency: adminProcedure
    .input(
      z.object({
        currencyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if it's the default currency
      const currency = await prisma.currencyManagement.findUnique({
        where: { id: input.currencyId },
      });

      if (currency?.default === 1) {
        throw new Error('Cannot delete the default currency');
      }

      await prisma.currencyManagement.delete({
        where: { id: input.currencyId },
      });

      invalidateAdminCurrencyCache();

      return {
        success: true,
      };
    }),

  // Get current BPToken price
  getBPTokenPrice: adminProcedure.query(async () => {
    const activePrice = await prisma.bPTokenPrice.findFirst({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    });

    return activePrice || { price: 0 };
  }),

  // Get BPToken price history
  getBPTokenPriceHistory: adminProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      return await prisma.bPTokenPrice.findMany({
        take: input.limit,
        orderBy: { updatedAt: 'desc' },
      });
    }),

  // Update BPToken price
  updateBPTokenPrice: adminProcedure
    .input(
      z.object({
        price: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id;

      // Deactivate all previous prices
      await prisma.bPTokenPrice.updateMany({
        where: { active: true },
        data: { active: false },
      });

      // Create new active price
      const newPrice = await prisma.bPTokenPrice.create({
        data: {
          price: input.price,
          updatedBy: adminId,
          active: true,
        },
      });

      return {
        success: true,
        price: newPrice,
      };
    }),

  // Get currency statistics
  getCurrencyStats: adminProcedure.query(async () => {
    const currencies = await getCachedAdminCurrencies();
    const defaultCurrency = currencies.find((c: any) => c.default === 1);
    
    const bpTokenPrice = await prisma.bPTokenPrice.findFirst({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      totalCurrencies: currencies.length,
      defaultCurrency: defaultCurrency?.symbol || 'NGN',
      bpTokenPrice: bpTokenPrice?.price || 0,
      lastBPTokenUpdate: bpTokenPrice?.updatedAt,
      currencies: currencies.map((c: any) => ({
        symbol: c.symbol,
        name: c.name,
        rate: c.rate,
        isDefault: c.default === 1,
      })),
    };
  }),
});
