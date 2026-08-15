/**
 * Store Router Business Logic Tests
 *
 * Validates: normalizePercent, clampNumber, normalizeRewardPercent,
 * profit calculation modes (PERCENT/FIXED/HYBRID), token payment math,
 * claim code format, hybrid min-token enforcement, and referral reward
 * payout routing.
 *
 * Pure-function replications from server/trpc/router/store.ts.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Replicated Pure Functions (from server/trpc/router/store.ts L17-L32)
// ---------------------------------------------------------------------------

function normalizePercent(maybePercent: number, fallback: number): number {
  if (!Number.isFinite(maybePercent) || maybePercent < 0) return fallback;
  if (maybePercent > 1) return maybePercent / 100;
  return maybePercent;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeRewardPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 1 ? value / 100 : value;
  return clampNumber(normalized, 0, 1);
}

// ---------------------------------------------------------------------------
// Profit Calculation (from store.ts L1020-L1033)
// ---------------------------------------------------------------------------

type ProfitMode = "PERCENT" | "FIXED" | "HYBRID";

function calculateProfit(
  mode: ProfitMode,
  totalFiat: number,
  profitPercent: number,
  profitFixedPerUnit: number,
  quantity: number
): number {
  let profit = 0;
  if (mode === "PERCENT") {
    profit = totalFiat * profitPercent;
  } else if (mode === "FIXED") {
    profit = profitFixedPerUnit * quantity;
  } else if (mode === "HYBRID") {
    profit = totalFiat * profitPercent + profitFixedPerUnit * quantity;
  }
  return clampNumber(profit, 0, totalFiat);
}

// ---------------------------------------------------------------------------
// Token Payment Math (from store.ts L1035-L1037)
// ---------------------------------------------------------------------------

function calculateTokenPayment(
  totalFiat: number,
  tokenLimitPercent: number,
  tokenRate: number
) {
  const tokenPortionFiat = Math.min(totalFiat * tokenLimitPercent, totalFiat);
  const tokenAmount = tokenRate > 0 ? tokenPortionFiat / tokenRate : 0;
  const fiatPortion = totalFiat - tokenPortionFiat;
  return { tokenPortionFiat, tokenAmount, fiatPortion };
}

// ---------------------------------------------------------------------------
// Hybrid Min-Token Enforcement (from store.ts L1580-L1590)
// ---------------------------------------------------------------------------

function isHybridTokenSufficient(
  tokenPortionFiat: number,
  grossFiat: number,
  effectiveMinTokenPercent: number
): boolean {
  return tokenPortionFiat >= grossFiat * effectiveMinTokenPercent;
}

// ---------------------------------------------------------------------------
// Claim Code Validation (from store.ts verifyClaimCode regex)
// ---------------------------------------------------------------------------

const CLAIM_CODE_REGEX = /^BPI-[0-9]{6}-PC$/i;

function isValidClaimCode(code: string): boolean {
  return CLAIM_CODE_REGEX.test(code.trim());
}

// ---------------------------------------------------------------------------
// Reward Payout Calculation (from settleStoreReferralRewards L117-L130)
// ---------------------------------------------------------------------------

type RewardValueMode = "PERCENTAGE" | "FIXED";

function calculateRewardPayout(
  mode: RewardValueMode,
  rewardValue: number,
  basisAmountFiat: number,
  maxRewardCap: number
): number {
  let payoutFiat: number;
  if (mode === "PERCENTAGE") {
    payoutFiat = basisAmountFiat * normalizeRewardPercent(rewardValue);
  } else {
    payoutFiat = rewardValue;
  }
  return Math.min(payoutFiat, maxRewardCap);
}

// ---------------------------------------------------------------------------
// Referral Chain Cycle Detection (from resolveSponsorChain L34-L49)
// ---------------------------------------------------------------------------

function resolveSponsorChain(
  referralMap: Record<string, string | null>,
  startUserId: string,
  maxLevels = 4
): string[] {
  const chain: string[] = [];
  let current = startUserId;

  for (let i = 0; i < maxLevels; i++) {
    const next = referralMap[current] ?? null;
    if (!next) break;
    if (chain.includes(next)) break; // cycle detection
    chain.push(next);
    current = next;
  }

  return chain;
}

// ---------------------------------------------------------------------------
// Tests: normalizePercent
// ---------------------------------------------------------------------------

describe("Store: normalizePercent", () => {
  it("returns value as-is when <= 1", () => {
    assert.strictEqual(normalizePercent(0.5, 0.1), 0.5);
  });

  it("returns 0 for zero input", () => {
    assert.strictEqual(normalizePercent(0, 0.1), 0);
  });

  it("divides by 100 when > 1", () => {
    assert.strictEqual(normalizePercent(50, 0.1), 0.5);
  });

  it("divides 100 by 100 correctly", () => {
    assert.strictEqual(normalizePercent(100, 0.1), 1);
  });

  it("returns fallback for NaN", () => {
    assert.strictEqual(normalizePercent(NaN, 0.1), 0.1);
  });

  it("returns fallback for negative values", () => {
    assert.strictEqual(normalizePercent(-5, 0.1), 0.1);
  });

  it("returns fallback for Infinity", () => {
    assert.strictEqual(normalizePercent(Infinity, 0.1), 0.1);
  });

  it("returns fallback for -Infinity", () => {
    assert.strictEqual(normalizePercent(-Infinity, 0.1), 0.1);
  });
});

// ---------------------------------------------------------------------------
// Tests: clampNumber
// ---------------------------------------------------------------------------

describe("Store: clampNumber", () => {
  it("clamps value within range", () => {
    assert.strictEqual(clampNumber(5, 0, 10), 5);
  });

  it("returns min for value below range", () => {
    assert.strictEqual(clampNumber(-5, 0, 10), 0);
  });

  it("returns max for value above range", () => {
    assert.strictEqual(clampNumber(15, 0, 10), 10);
  });

  it("returns min for NaN", () => {
    assert.strictEqual(clampNumber(NaN, 0, 10), 0);
  });

  it("handles equal min and max", () => {
    assert.strictEqual(clampNumber(5, 5, 5), 5);
  });

  it("clamps to boundary values", () => {
    assert.strictEqual(clampNumber(0, 0, 10), 0);
    assert.strictEqual(clampNumber(10, 0, 10), 10);
  });
});

// ---------------------------------------------------------------------------
// Tests: normalizeRewardPercent
// ---------------------------------------------------------------------------

describe("Store: normalizeRewardPercent", () => {
  it("returns 0 for NaN", () => {
    assert.strictEqual(normalizeRewardPercent(NaN), 0);
  });

  it("normalizes 75 to 0.75", () => {
    assert.strictEqual(normalizeRewardPercent(75), 0.75);
  });

  it("passes through 0.75 unchanged", () => {
    assert.strictEqual(normalizeRewardPercent(0.75), 0.75);
  });

  it("clamps to 1 maximum", () => {
    assert.strictEqual(normalizeRewardPercent(200), 1);
  });

  it("clamps to 0 minimum", () => {
    assert.strictEqual(normalizeRewardPercent(-10), 0);
  });

  it("handles exactly 1", () => {
    assert.strictEqual(normalizeRewardPercent(1), 1);
  });

  it("handles exactly 100", () => {
    assert.strictEqual(normalizeRewardPercent(100), 1);
  });
});

// ---------------------------------------------------------------------------
// Tests: Profit calculation
// ---------------------------------------------------------------------------

describe("Store: Profit calculation", () => {
  it("PERCENT mode: calculates profit as percentage of total", () => {
    // 10% of ₦10000 = ₦1000
    assert.strictEqual(calculateProfit("PERCENT", 10000, 0.1, 0, 1), 1000);
  });

  it("FIXED mode: calculates profit as fixed amount per unit", () => {
    // ₦200 per unit × 5 units = ₦1000
    assert.strictEqual(calculateProfit("FIXED", 10000, 0, 200, 5), 1000);
  });

  it("HYBRID mode: combines percentage and fixed", () => {
    // 10% of ₦10000 + ₦100 × 2 = ₦1000 + ₦200 = ₦1200
    assert.strictEqual(calculateProfit("HYBRID", 10000, 0.1, 100, 2), 1200);
  });

  it("clamps profit to not exceed total", () => {
    // 100% of ₦1000 + ₦500 × 3 = ₦1000 + ₦1500 = ₦2500 → clamped to ₦1000
    assert.strictEqual(calculateProfit("HYBRID", 1000, 1.0, 500, 3), 1000);
  });

  it("returns 0 for zero values", () => {
    assert.strictEqual(calculateProfit("PERCENT", 0, 0.1, 0, 1), 0);
  });

  it("FIXED mode: handles zero quantity", () => {
    assert.strictEqual(calculateProfit("FIXED", 10000, 0, 200, 0), 0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Token payment math
// ---------------------------------------------------------------------------

describe("Store: Token payment math", () => {
  it("calculates token portion at 50% limit", () => {
    const result = calculateTokenPayment(10000, 0.5, 50);
    assert.strictEqual(result.tokenPortionFiat, 5000);
    assert.strictEqual(result.tokenAmount, 100); // 5000 / 50
    assert.strictEqual(result.fiatPortion, 5000);
  });

  it("handles 100% token payment", () => {
    const result = calculateTokenPayment(10000, 1.0, 100);
    assert.strictEqual(result.tokenPortionFiat, 10000);
    assert.strictEqual(result.tokenAmount, 100);
    assert.strictEqual(result.fiatPortion, 0);
  });

  it("handles 0% token limit (full fiat)", () => {
    const result = calculateTokenPayment(10000, 0, 100);
    assert.strictEqual(result.tokenPortionFiat, 0);
    assert.strictEqual(result.tokenAmount, 0);
    assert.strictEqual(result.fiatPortion, 10000);
  });

  it("handles zero token rate safely", () => {
    const result = calculateTokenPayment(10000, 0.5, 0);
    assert.strictEqual(result.tokenAmount, 0); // No division by zero
  });

  it("token limit does not exceed total", () => {
    // Limit > 1.0 still capped at total via Math.min
    const result = calculateTokenPayment(10000, 1.5, 100);
    assert.strictEqual(result.tokenPortionFiat, 10000);
  });
});

// ---------------------------------------------------------------------------
// Tests: Hybrid min-token enforcement
// ---------------------------------------------------------------------------

describe("Store: Hybrid min-token enforcement", () => {
  it("accepts when token portion meets minimum", () => {
    // 20% of ₦10000 = ₦2000; token portion is ₦2000 — exactly meets threshold
    assert.strictEqual(isHybridTokenSufficient(2000, 10000, 0.2), true);
  });

  it("rejects when token portion is below minimum", () => {
    assert.strictEqual(isHybridTokenSufficient(1000, 10000, 0.2), false);
  });

  it("accepts when token portion exceeds minimum", () => {
    assert.strictEqual(isHybridTokenSufficient(5000, 10000, 0.2), true);
  });

  it("handles zero minimum threshold", () => {
    assert.strictEqual(isHybridTokenSufficient(0, 10000, 0), true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Claim code validation
// ---------------------------------------------------------------------------

describe("Store: Claim code validation", () => {
  it("accepts valid claim code", () => {
    assert.strictEqual(isValidClaimCode("BPI-123456-PC"), true);
  });

  it("accepts lowercase", () => {
    assert.strictEqual(isValidClaimCode("bpi-123456-pc"), true);
  });

  it("rejects wrong prefix", () => {
    assert.strictEqual(isValidClaimCode("XYZ-123456-PC"), false);
  });

  it("rejects wrong suffix", () => {
    assert.strictEqual(isValidClaimCode("BPI-123456-XX"), false);
  });

  it("rejects too few digits", () => {
    assert.strictEqual(isValidClaimCode("BPI-12345-PC"), false);
  });

  it("rejects too many digits", () => {
    assert.strictEqual(isValidClaimCode("BPI-1234567-PC"), false);
  });

  it("rejects letters in digit section", () => {
    assert.strictEqual(isValidClaimCode("BPI-12AB56-PC"), false);
  });

  it("rejects empty string", () => {
    assert.strictEqual(isValidClaimCode(""), false);
  });
});

// ---------------------------------------------------------------------------
// Tests: Reward payout calculation
// ---------------------------------------------------------------------------

describe("Store: Reward payout calculation", () => {
  it("PERCENTAGE mode: calculates based on basis amount", () => {
    // 10% of ₦10000 = ₦1000, cap at ₦5000
    assert.strictEqual(calculateRewardPayout("PERCENTAGE", 10, 10000, 5000), 1000);
  });

  it("FIXED mode: uses reward value directly", () => {
    assert.strictEqual(calculateRewardPayout("FIXED", 500, 10000, 5000), 500);
  });

  it("applies max reward cap", () => {
    // 50% of ₦10000 = ₦5000, cap at ₦2000 → ₦2000
    assert.strictEqual(calculateRewardPayout("PERCENTAGE", 50, 10000, 2000), 2000);
  });

  it("FIXED payout respects cap", () => {
    assert.strictEqual(calculateRewardPayout("FIXED", 3000, 10000, 1000), 1000);
  });

  it("handles zero reward value", () => {
    assert.strictEqual(calculateRewardPayout("PERCENTAGE", 0, 10000, 5000), 0);
  });

  it("handles NaN reward value", () => {
    assert.strictEqual(calculateRewardPayout("PERCENTAGE", NaN, 10000, 5000), 0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Referral chain resolution
// ---------------------------------------------------------------------------

describe("Store: Referral chain resolution", () => {
  it("resolves a linear chain", () => {
    const referralMap: Record<string, string | null> = {
      userA: "userB",
      userB: "userC",
      userC: "userD",
      userD: "userE",
    };
    const chain = resolveSponsorChain(referralMap, "userA", 4);
    assert.deepStrictEqual(chain, ["userB", "userC", "userD", "userE"]);
  });

  it("stops at max levels", () => {
    const referralMap: Record<string, string | null> = {
      a: "b",
      b: "c",
      c: "d",
      d: "e",
      e: "f",
    };
    // maxLevels=3 should only return 3 ancestors
    const chain = resolveSponsorChain(referralMap, "a", 3);
    assert.strictEqual(chain.length, 3);
    assert.deepStrictEqual(chain, ["b", "c", "d"]);
  });

  it("handles no referrer", () => {
    const chain = resolveSponsorChain({}, "userA", 4);
    assert.deepStrictEqual(chain, []);
  });

  it("detects circular reference", () => {
    const referralMap: Record<string, string | null> = {
      a: "b",
      b: "c",
      c: "a", // cycle back to a
    };
    const chain = resolveSponsorChain(referralMap, "a", 10);
    // 'a' is added to chain (it's not in chain[] when checked), then
    // next iteration: current='a' → next='b', but 'b' IS in chain → stops
    assert.deepStrictEqual(chain, ["b", "c", "a"]);
  });

  it("handles chain shorter than max levels", () => {
    const referralMap: Record<string, string | null> = {
      a: "b",
      b: null,
    };
    const chain = resolveSponsorChain(referralMap, "a", 4);
    assert.deepStrictEqual(chain, ["b"]);
  });
});

// ---------------------------------------------------------------------------
// Regression: resolveSponsorChain must not filter by referral status
// (store.ts previously filtered `where: { referredId, status: "active" }`,
// which broke payouts for admin-reassigned sponsors whose Referral rows
// are created with status "completed" — see adminReferrals.ts)
// ---------------------------------------------------------------------------

type MockReferralRow = { referrerId: string; referredId: string; status: string };

async function resolveSponsorChainAsync(
  findFirst: (where: { referredId: string }) => Promise<{ referrerId: string } | null>,
  buyerUserId: string,
  maxLevels = 4
): Promise<string[]> {
  const chain: string[] = [];
  let current = buyerUserId;

  for (let i = 0; i < maxLevels; i++) {
    const referral = await findFirst({ referredId: current });
    const next = referral?.referrerId;
    if (!next) break;
    if (chain.includes(next)) break;
    chain.push(next);
    current = next;
  }

  return chain;
}

describe("Store: resolveSponsorChain status-agnostic regression", () => {
  const rows: MockReferralRow[] = [
    { referrerId: "sponsorActive", referredId: "buyer", status: "active" },
    { referrerId: "sponsorCompleted", referredId: "sponsorActive", status: "completed" },
    { referrerId: "sponsorPending", referredId: "sponsorCompleted", status: "pending" },
  ];

  const findFirst = async (where: { referredId: string }) =>
    rows.find((r) => r.referredId === where.referredId) ?? null;

  it("includes sponsors regardless of referral status (active/completed/pending)", async () => {
    const chain = await resolveSponsorChainAsync(findFirst, "buyer", 4);
    assert.deepStrictEqual(chain, ["sponsorActive", "sponsorCompleted", "sponsorPending"]);
  });

  it("would have broken the chain if status filter were reintroduced", async () => {
    const statusFilteredFindFirst = async (where: { referredId: string }) =>
      rows.find((r) => r.referredId === where.referredId && r.status === "active") ?? null;
    const chain = await resolveSponsorChainAsync(statusFilteredFindFirst, "buyer", 4);
    // Only the first hop has status "active"; the chain stops there — this is the bug being guarded against.
    assert.deepStrictEqual(chain, ["sponsorActive"]);
  });
});
