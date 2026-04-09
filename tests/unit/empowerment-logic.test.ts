/**
 * Empowerment Business Logic Tests
 *
 * Validates: tax calculations, maturity date logic, net value computation,
 * idempotency window dedup, and empowerment type enumeration.
 *
 * Pure-function replications from server/services/empowermentPayments.service.ts.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Replicated Business Constants & Logic
// (from server/services/empowermentPayments.service.ts L45-L55)
// ---------------------------------------------------------------------------

const GROSS_EMPOWERMENT_VALUE = 7_250_000;
const GROSS_SPONSOR_REWARD = 1_000_000;
const TAX_RATE = 0.075;

function calculateNetEmpowermentValue(): number {
  return GROSS_EMPOWERMENT_VALUE * (1 - TAX_RATE);
}

function calculateNetSponsorReward(): number {
  return GROSS_SPONSOR_REWARD * (1 - TAX_RATE);
}

/** Maturity date: activation + 24 months (empowermentPayments.service.ts L53-L55) */
function calculateMaturityDate(activatedAt: Date): Date {
  const maturityDate = new Date(activatedAt);
  maturityDate.setMonth(maturityDate.getMonth() + 24);
  return maturityDate;
}

/** Idempotency window: 5 minutes (empowermentPayments.service.ts L35-L36) */
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;

function isWithinIdempotencyWindow(
  existingActivatedAt: Date,
  now: Date
): boolean {
  return now.getTime() - existingActivatedAt.getTime() < IDEMPOTENCY_WINDOW_MS;
}

/** Valid empowerment types */
const VALID_EMPOWERMENT_TYPES = ["CHILD_EDUCATION", "VOCATIONAL_SKILL"] as const;

// ---------------------------------------------------------------------------
// Tests: Tax calculations
// ---------------------------------------------------------------------------

describe("Empowerment: Tax calculations", () => {
  it("net empowerment value = ₦6,706,250", () => {
    assert.strictEqual(calculateNetEmpowermentValue(), 6_706_250);
  });

  it("net sponsor reward = ₦925,000", () => {
    assert.strictEqual(calculateNetSponsorReward(), 925_000);
  });

  it("tax on empowerment value = ₦543,750", () => {
    const tax = GROSS_EMPOWERMENT_VALUE * TAX_RATE;
    assert.strictEqual(tax, 543_750);
  });

  it("tax on sponsor reward = ₦75,000", () => {
    const tax = GROSS_SPONSOR_REWARD * TAX_RATE;
    assert.strictEqual(tax, 75_000);
  });

  it("tax rate is 7.5%", () => {
    assert.strictEqual(TAX_RATE, 0.075);
  });

  it("gross values are self-consistent", () => {
    // net + tax = gross
    const netEmp = calculateNetEmpowermentValue();
    const taxEmp = GROSS_EMPOWERMENT_VALUE * TAX_RATE;
    assert.strictEqual(netEmp + taxEmp, GROSS_EMPOWERMENT_VALUE);
  });
});

// ---------------------------------------------------------------------------
// Tests: Maturity date
// ---------------------------------------------------------------------------

describe("Empowerment: Maturity date calculation", () => {
  it("adds exactly 24 months", () => {
    const activated = new Date("2025-01-15T10:00:00Z");
    const maturity = calculateMaturityDate(activated);
    assert.strictEqual(maturity.getFullYear(), 2027);
    assert.strictEqual(maturity.getMonth(), 0); // January
    assert.strictEqual(maturity.getDate(), 15);
  });

  it("handles year boundary (Nov → Nov +2 years)", () => {
    const activated = new Date("2024-11-01T00:00:00Z");
    const maturity = calculateMaturityDate(activated);
    assert.strictEqual(maturity.getFullYear(), 2026);
    assert.strictEqual(maturity.getMonth(), 10); // November
  });

  it("handles month overflow (Jan 31 → future date)", () => {
    const activated = new Date("2025-01-31T00:00:00Z");
    const maturity = calculateMaturityDate(activated);
    // JavaScript setMonth(month+24) on Jan 31 → Jan 31, 2027
    assert.strictEqual(maturity.getFullYear(), 2027);
    assert.strictEqual(maturity.getMonth(), 0); // January
    assert.strictEqual(maturity.getDate(), 31);
  });

  it("handles leap year activation", () => {
    const activated = new Date("2024-02-29T00:00:00Z");
    const maturity = calculateMaturityDate(activated);
    // Feb 2026 has 28 days → setMonth overflow → Mar 1, 2026
    assert.strictEqual(maturity.getFullYear(), 2026);
    // Note: JavaScript Date behavior for Feb 29 + 24 months
    // 2026 is not a leap year, so Feb 29 → Mar 1
    assert.ok(maturity.getMonth() === 1 || maturity.getMonth() === 2);
  });

  it("preserves time component", () => {
    const activated = new Date("2025-06-15T14:30:00Z");
    const maturity = calculateMaturityDate(activated);
    assert.strictEqual(maturity.getUTCHours(), 14);
    assert.strictEqual(maturity.getUTCMinutes(), 30);
  });
});

// ---------------------------------------------------------------------------
// Tests: Idempotency window
// ---------------------------------------------------------------------------

describe("Empowerment: Idempotency window", () => {
  it("detects duplicate within 5-minute window", () => {
    const activatedAt = new Date("2025-07-01T10:00:00Z");
    const now = new Date("2025-07-01T10:03:00Z"); // 3 minutes later
    assert.strictEqual(isWithinIdempotencyWindow(activatedAt, now), true);
  });

  it("allows re-creation after 5-minute window", () => {
    const activatedAt = new Date("2025-07-01T10:00:00Z");
    const now = new Date("2025-07-01T10:06:00Z"); // 6 minutes later
    assert.strictEqual(isWithinIdempotencyWindow(activatedAt, now), false);
  });

  it("boundary: exactly 5 minutes is outside window", () => {
    const activatedAt = new Date("2025-07-01T10:00:00Z");
    const now = new Date("2025-07-01T10:05:00Z"); // exactly 5 minutes
    assert.strictEqual(isWithinIdempotencyWindow(activatedAt, now), false);
  });

  it("handles same-second activation", () => {
    const now = new Date("2025-07-01T10:00:00Z");
    assert.strictEqual(isWithinIdempotencyWindow(now, now), true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Empowerment types
// ---------------------------------------------------------------------------

describe("Empowerment: Type enumeration", () => {
  it("includes CHILD_EDUCATION", () => {
    assert.ok(VALID_EMPOWERMENT_TYPES.includes("CHILD_EDUCATION"));
  });

  it("includes VOCATIONAL_SKILL", () => {
    assert.ok(VALID_EMPOWERMENT_TYPES.includes("VOCATIONAL_SKILL"));
  });

  it("has exactly 2 types", () => {
    assert.strictEqual(VALID_EMPOWERMENT_TYPES.length, 2);
  });
});

// ---------------------------------------------------------------------------
// Tests: Geo-based gateway selection logic
// (from server/services/payment/PaymentProcessor.ts getRecommendedGateway)
// ---------------------------------------------------------------------------

function detectNigerianUser(
  country: string | null | undefined,
  countryId: number | null | undefined
): boolean {
  const userCountry = country?.toLowerCase().trim() ?? "";
  return (
    userCountry === "nigeria" ||
    userCountry === "ng" ||
    countryId === 161
  );
}

describe("Geo-based gateway selection", () => {
  it("detects Nigerian user by country name", () => {
    assert.strictEqual(detectNigerianUser("Nigeria", null), true);
  });

  it("detects Nigerian user by lowercase", () => {
    assert.strictEqual(detectNigerianUser("nigeria", null), true);
  });

  it("detects Nigerian user by country code ng", () => {
    assert.strictEqual(detectNigerianUser("ng", null), true);
  });

  it("detects Nigerian user by countryId 161", () => {
    assert.strictEqual(detectNigerianUser(null, 161), true);
  });

  it("handles trimming whitespace", () => {
    assert.strictEqual(detectNigerianUser("  Nigeria  ", null), true);
  });

  it("rejects non-Nigerian country", () => {
    assert.strictEqual(detectNigerianUser("Ghana", null), false);
  });

  it("rejects null country and non-matching ID", () => {
    assert.strictEqual(detectNigerianUser(null, 50), false);
  });

  it("rejects null country and null ID", () => {
    assert.strictEqual(detectNigerianUser(null, null), false);
  });
});

// ---------------------------------------------------------------------------
// Tests: Rate limiter logic
// (from lib/rateLimit.ts — pure sliding-window logic)
// ---------------------------------------------------------------------------

describe("Rate limiter: sliding window logic", () => {
  // Replicate the core rate-limit check as a pure function
  function checkRateLimit(
    timestamps: number[],
    now: number,
    windowMs: number,
    max: number
  ): { allowed: boolean; remaining: number } {
    const cutoff = now - windowMs;
    const active = timestamps.filter((t) => t > cutoff);
    if (active.length >= max) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: max - active.length };
  }

  it("allows requests under the limit", () => {
    const now = 1000000;
    const timestamps = [now - 10000, now - 5000]; // 2 requests in window
    const result = checkRateLimit(timestamps, now, 60000, 10);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, 8);
  });

  it("blocks requests at the limit", () => {
    const now = 1000000;
    const timestamps = Array.from({ length: 10 }, (_, i) => now - i * 1000);
    const result = checkRateLimit(timestamps, now, 60000, 10);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.remaining, 0);
  });

  it("allows requests after window expires", () => {
    const now = 1000000;
    const timestamps = Array.from({ length: 10 }, (_, i) => now - 70000 - i * 1000);
    const result = checkRateLimit(timestamps, now, 60000, 10);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, 10);
  });

  it("handles empty timestamp list", () => {
    const result = checkRateLimit([], 1000000, 60000, 10);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, 10);
  });
});
