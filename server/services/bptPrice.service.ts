import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

/**
 * Fetches the current admin-set BPT price (₦ per 1 BPT) from the database.
 * This is the SINGLE SOURCE OF TRUTH for BPT pricing across the platform.
 *
 * All server-side code that needs the BPT price should use this function
 * instead of hardcoding fallback values.
 *
 * @param tx - Optional transaction client (for use inside $transaction blocks)
 * @returns The active BPT price in naira. Throws if no price is configured.
 */
export async function getActiveBptPrice(tx?: TxClient): Promise<number> {
  const db = tx ?? prisma;
  const activePrice = await (db as any).bPTokenPrice.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!activePrice || activePrice.price <= 0) {
    throw new Error(
      "BPT price not configured. An admin must set a BPT price in Currency Manager before BPT operations can proceed."
    );
  }

  return activePrice.price;
}

/**
 * Converts a naira amount to BPT units using the current admin-set price.
 *
 * Formula: nairaAmount / bptPrice = bptUnits
 */
export function nairaToBpt(nairaAmount: number, bptPrice: number): number {
  if (bptPrice <= 0) throw new Error("BPT price must be greater than zero");
  return Math.round((nairaAmount / bptPrice) * 100) / 100;
}

/**
 * Converts BPT units to naira using the current admin-set price.
 *
 * Formula: bptUnits * bptPrice = nairaAmount
 */
export function bptToNaira(bptUnits: number, bptPrice: number): number {
  return Math.round(bptUnits * bptPrice * 100) / 100;
}
