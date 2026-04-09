/**
 * YouTube Router Business Logic Tests
 *
 * Validates: plan cost calculations, subscription earnings distribution,
 * plan upgrade differential pricing, slot utilisation math, earnings
 * aggregation, admin role guard patterns, and input edge cases.
 *
 * Note: The YouTube router depends on Prisma, so the logic is replicated
 * here as pure functions matching the router's behaviour.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Replicated Business Logic (from server/trpc/router/youtube.ts)
// ---------------------------------------------------------------------------

/** Plan purchase total cost (youtube.ts L92-L93) */
function calculatePlanCost(planAmount: number, planVat: number) {
  return Number(planAmount) + Number(planVat);
}

/** Available funds check (youtube.ts L95-L96) */
function calculateAvailableFunds(wallet: number, spendable: number) {
  return wallet + spendable;
}

/** Subscription payment earnings (youtube.ts L654-L655, L937-L938) */
function calculateSubscriptionEarnings(hasReferrer: boolean) {
  const subscriberEarning = 40; // ₦40
  const referrerEarning = hasReferrer ? 10 : 0; // ₦10 if referrer exists
  return { subscriberEarning, referrerEarning };
}

/** Plan upgrade cost calculation (youtube.ts L1120-L1131) */
function calculateUpgradeCost(
  newPlanAmount: number,
  newPlanVat: number,
  currentPlanAmount: number,
  currentPlanVat: number
) {
  const newPlanTotal = Number(newPlanAmount) + Number(newPlanVat);
  const currentPlanTotal = Number(currentPlanAmount) + Number(currentPlanVat);
  return newPlanTotal - currentPlanTotal;
}

/** Upgrade eligibility — new plan must be higher tier (youtube.ts L1113) */
function canUpgrade(newPlanTotalSub: number, currentPlanTotalSub: number) {
  return newPlanTotalSub > currentPlanTotalSub;
}

/** Additional slots from upgrade (youtube.ts L1125) */
function calculateAdditionalSlots(newPlanTotalSub: number, currentPlanTotalSub: number) {
  return newPlanTotalSub - currentPlanTotalSub;
}

/** Provider stats slot calculations (youtube.ts L1258-L1261) */
function calculateSlotStats(planTotalSub: number, providerBalance: number) {
  const slotsUsed = planTotalSub - providerBalance;
  const slotsRemaining = providerBalance;
  const percentUsed = planTotalSub > 0 ? (slotsUsed / planTotalSub) * 100 : 0;
  return { slotsUsed, slotsRemaining, percentUsed };
}

/** Earnings aggregation (youtube.ts L556-L560) */
function aggregateEarnings(
  earnings: Array<{ amount: number; isPaid: boolean }>
) {
  const total = earnings.reduce((sum, e) => sum + e.amount, 0);
  const paid = earnings.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
  const unpaid = total - paid;
  return { total, paid, unpaid };
}

/** Admin role check guard (youtube.ts L11-L18) */
function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/** Leaderboard name display (shared pattern from epcEpp.ts L42) */
function formatDisplayName(
  firstname: string | null | undefined,
  lastname: string | null | undefined
): string {
  return `${firstname || ""} ${lastname || ""}`.trim() || "Anonymous";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("YouTube: Plan cost calculation", () => {
  it("sums plan amount and VAT", () => {
    assert.strictEqual(calculatePlanCost(5000, 375), 5375);
  });

  it("handles string-like numbers", () => {
    assert.strictEqual(calculatePlanCost(Number("5000"), Number("375")), 5375);
  });

  it("returns 0 when both are 0", () => {
    assert.strictEqual(calculatePlanCost(0, 0), 0);
  });
});

describe("YouTube: Available funds check", () => {
  it("sums wallet and spendable", () => {
    assert.strictEqual(calculateAvailableFunds(3000, 2000), 5000);
  });

  it("handles zero spendable", () => {
    assert.strictEqual(calculateAvailableFunds(5000, 0), 5000);
  });

  it("handles both zero", () => {
    assert.strictEqual(calculateAvailableFunds(0, 0), 0);
  });
});

describe("YouTube: Subscription earnings", () => {
  it("awards ₦40 to subscriber with referrer present", () => {
    const { subscriberEarning, referrerEarning } = calculateSubscriptionEarnings(true);
    assert.strictEqual(subscriberEarning, 40);
    assert.strictEqual(referrerEarning, 10);
  });

  it("awards ₦40 to subscriber with no referrer", () => {
    const { subscriberEarning, referrerEarning } = calculateSubscriptionEarnings(false);
    assert.strictEqual(subscriberEarning, 40);
    assert.strictEqual(referrerEarning, 0);
  });

  it("total distribution with referrer equals ₦50", () => {
    const { subscriberEarning, referrerEarning } = calculateSubscriptionEarnings(true);
    assert.strictEqual(subscriberEarning + referrerEarning, 50);
  });
});

describe("YouTube: Plan upgrade cost", () => {
  it("calculates differential cost for upgrade", () => {
    // Bronze (5000+375) → Silver (10000+750)
    const cost = calculateUpgradeCost(10000, 750, 5000, 375);
    assert.strictEqual(cost, 5375);
  });

  it("returns 0 when upgrading to same tier price", () => {
    const cost = calculateUpgradeCost(5000, 375, 5000, 375);
    assert.strictEqual(cost, 0);
  });

  it("returns negative for downgrade (guard should block)", () => {
    const cost = calculateUpgradeCost(2000, 150, 5000, 375);
    assert.ok(cost < 0);
  });
});

describe("YouTube: Upgrade eligibility", () => {
  it("allows upgrade to higher tier", () => {
    assert.strictEqual(canUpgrade(100, 50), true);
  });

  it("blocks upgrade to same tier", () => {
    assert.strictEqual(canUpgrade(50, 50), false);
  });

  it("blocks downgrade", () => {
    assert.strictEqual(canUpgrade(30, 50), false);
  });
});

describe("YouTube: Additional slots from upgrade", () => {
  it("returns difference in subscription slots", () => {
    assert.strictEqual(calculateAdditionalSlots(100, 50), 50);
  });

  it("returns 0 for same tier", () => {
    assert.strictEqual(calculateAdditionalSlots(50, 50), 0);
  });
});

describe("YouTube: Provider slot stats", () => {
  it("calculates used, remaining, and percent", () => {
    const stats = calculateSlotStats(100, 25);
    assert.strictEqual(stats.slotsUsed, 75);
    assert.strictEqual(stats.slotsRemaining, 25);
    assert.strictEqual(stats.percentUsed, 75);
  });

  it("handles fully utilised plan", () => {
    const stats = calculateSlotStats(100, 0);
    assert.strictEqual(stats.slotsUsed, 100);
    assert.strictEqual(stats.slotsRemaining, 0);
    assert.strictEqual(stats.percentUsed, 100);
  });

  it("handles fresh plan (no subscribers yet)", () => {
    const stats = calculateSlotStats(100, 100);
    assert.strictEqual(stats.slotsUsed, 0);
    assert.strictEqual(stats.slotsRemaining, 100);
    assert.strictEqual(stats.percentUsed, 0);
  });

  it("handles zero-slot plan without division error", () => {
    const stats = calculateSlotStats(0, 0);
    assert.strictEqual(stats.percentUsed, 0);
  });
});

describe("YouTube: Earnings aggregation", () => {
  it("aggregates paid and unpaid earnings", () => {
    const earnings = [
      { amount: 40, isPaid: true },
      { amount: 40, isPaid: false },
      { amount: 40, isPaid: true },
    ];
    const result = aggregateEarnings(earnings);
    assert.strictEqual(result.total, 120);
    assert.strictEqual(result.paid, 80);
    assert.strictEqual(result.unpaid, 40);
  });

  it("handles empty earnings list", () => {
    const result = aggregateEarnings([]);
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.paid, 0);
    assert.strictEqual(result.unpaid, 0);
  });

  it("handles all unpaid", () => {
    const result = aggregateEarnings([
      { amount: 100, isPaid: false },
      { amount: 200, isPaid: false },
    ]);
    assert.strictEqual(result.paid, 0);
    assert.strictEqual(result.unpaid, 300);
  });
});

describe("YouTube: Admin role guard", () => {
  it("accepts admin role", () => {
    assert.strictEqual(isAdminRole("admin"), true);
  });

  it("accepts super_admin role", () => {
    assert.strictEqual(isAdminRole("super_admin"), true);
  });

  it("rejects user role", () => {
    assert.strictEqual(isAdminRole("user"), false);
  });

  it("rejects null", () => {
    assert.strictEqual(isAdminRole(null), false);
  });

  it("rejects undefined", () => {
    assert.strictEqual(isAdminRole(undefined), false);
  });

  it("rejects empty string", () => {
    assert.strictEqual(isAdminRole(""), false);
  });
});

describe("YouTube: Display name formatting", () => {
  it("combines first and last name", () => {
    assert.strictEqual(formatDisplayName("John", "Doe"), "John Doe");
  });

  it("uses Anonymous for null names", () => {
    assert.strictEqual(formatDisplayName(null, null), "Anonymous");
  });

  it("uses Anonymous for empty strings", () => {
    assert.strictEqual(formatDisplayName("", ""), "Anonymous");
  });

  it("handles first name only", () => {
    assert.strictEqual(formatDisplayName("John", null), "John");
  });

  it("handles last name only", () => {
    assert.strictEqual(formatDisplayName(null, "Doe"), "Doe");
  });
});
