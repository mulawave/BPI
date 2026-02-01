export interface TokenRate {
  symbol: string;
  rate_to_fiat: number; // 1 token => fiat units (NGN equivalent)
  source: "fixed" | "admin_daily" | "oracle_future";
  effective_at: string;
}

export const mockTokenRates: TokenRate[] = [
  { symbol: "BPT", rate_to_fiat: 500, source: "fixed", effective_at: new Date().toISOString() },
  { symbol: "PACT", rate_to_fiat: 150, source: "fixed", effective_at: new Date().toISOString() },
];
