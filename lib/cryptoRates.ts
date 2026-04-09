/**
 * Crypto Exchange Rate Service
 * Fetches live rates from CoinGecko with admin override via PaymentGatewayConfig.
 * Caches rates in-memory for 5 minutes to avoid hitting API rate limits.
 */

// Lazy-load prisma to avoid eager initialization during build
const getPrisma = async () => (await import("@/lib/prisma")).prisma;

// CoinGecko IDs for supported cryptocurrencies
const COINGECKO_IDS: Record<string, string> = {
  USDT: "tether",
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  USDC: "usd-coin",
  SOL: "solana",
};

interface CachedRate {
  rateNgn: number;
  rateUsd: number;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const rateCache = new Map<string, CachedRate>();

/**
 * Get exchange rate for a crypto symbol in NGN and USD.
 * Priority: admin override in DB → live CoinGecko API → cached fallback.
 */
export async function getCryptoRate(symbol: string): Promise<{ rateNgn: number; rateUsd: number; source: "admin" | "live" | "cache" }> {
  const upperSymbol = symbol.toUpperCase();

  // 1. Check admin override in PaymentGatewayConfig
  const prisma = await getPrisma();
  const config = await prisma.paymentGatewayConfig.findFirst({
    where: { gatewayName: "crypto", isActive: true },
    select: { currentPriceNgn: true, currentPriceUsd: true, fees: true },
  });

  // If admin set a manual rate, use it (non-null and > 0 means override is active)
  if (config?.currentPriceNgn && config.currentPriceNgn > 0 && config?.currentPriceUsd && config.currentPriceUsd > 0) {
    return { rateNgn: config.currentPriceNgn, rateUsd: config.currentPriceUsd, source: "admin" };
  }

  // Also check per-symbol overrides in fees JSON: { "rates": { "USDT": { "ngn": 1650, "usd": 1.0 } } }
  if (config?.fees && typeof config.fees === "object") {
    const fees = config.fees as Record<string, any>;
    const symbolRate = fees?.rates?.[upperSymbol];
    if (symbolRate?.ngn > 0 && symbolRate?.usd > 0) {
      return { rateNgn: symbolRate.ngn, rateUsd: symbolRate.usd, source: "admin" };
    }
  }

  // 2. Check cache
  const cached = rateCache.get(upperSymbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { rateNgn: cached.rateNgn, rateUsd: cached.rateUsd, source: "cache" };
  }

  // 3. Fetch from CoinGecko
  const coinId = COINGECKO_IDS[upperSymbol];
  if (!coinId) {
    // If no CoinGecko ID mapped, try using the symbol as-is (won't work for most, fallback to cache)
    if (cached) {
      return { rateNgn: cached.rateNgn, rateUsd: cached.rateUsd, source: "cache" };
    }
    throw new Error(`No exchange rate available for ${upperSymbol}`);
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=ngn,usd`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const rateNgn = data[coinId]?.ngn;
    const rateUsd = data[coinId]?.usd;

    if (typeof rateNgn !== "number" || typeof rateUsd !== "number") {
      throw new Error(`Invalid CoinGecko response for ${coinId}`);
    }

    // Cache the result
    rateCache.set(upperSymbol, { rateNgn, rateUsd, fetchedAt: Date.now() });

    return { rateNgn, rateUsd, source: "live" };
  } catch (error) {
    console.error(`[CryptoRates] Failed to fetch rate for ${upperSymbol}:`, error);

    // Fall back to stale cache
    if (cached) {
      return { rateNgn: cached.rateNgn, rateUsd: cached.rateUsd, source: "cache" };
    }

    throw new Error(`Unable to fetch exchange rate for ${upperSymbol}. Please try again later.`);
  }
}

/**
 * Get rates for multiple symbols at once (batch query — single CoinGecko call)
 */
export async function getCryptoRates(symbols: string[]): Promise<Record<string, { rateNgn: number; rateUsd: number }>> {
  const coinIds = symbols
    .map((s) => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean);

  if (coinIds.length === 0) return {};

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=ngn,usd`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`CoinGecko batch error: ${response.status}`);

    const data = await response.json();
    const result: Record<string, { rateNgn: number; rateUsd: number }> = {};

    for (const symbol of symbols) {
      const id = COINGECKO_IDS[symbol.toUpperCase()];
      if (id && data[id]) {
        result[symbol.toUpperCase()] = {
          rateNgn: data[id].ngn,
          rateUsd: data[id].usd,
        };
        rateCache.set(symbol.toUpperCase(), {
          rateNgn: data[id].ngn,
          rateUsd: data[id].usd,
          fetchedAt: Date.now(),
        });
      }
    }

    return result;
  } catch (error) {
    console.error("[CryptoRates] Batch fetch failed:", error);
    // Return cached values where available
    const result: Record<string, { rateNgn: number; rateUsd: number }> = {};
    for (const symbol of symbols) {
      const cached = rateCache.get(symbol.toUpperCase());
      if (cached) {
        result[symbol.toUpperCase()] = { rateNgn: cached.rateNgn, rateUsd: cached.rateUsd };
      }
    }
    return result;
  }
}

/** Clear rate cache (e.g. when admin updates override) */
export function clearCryptoRateCache() {
  rateCache.clear();
}
