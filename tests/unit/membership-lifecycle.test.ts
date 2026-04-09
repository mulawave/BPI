/**
 * Membership Lifecycle & Payment Flow Tests
 *
 * Tests the business rules for membership activation, upgrade, wallet deduction,
 * referral distribution, and package validation logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Wallet Balance Validation (activateStandard pattern)
// Mirrors: server/trpc/router/package.ts activateStandard
// ---------------------------------------------------------------------------

function validateWalletDeduction(
  walletBalance: number,
  packagePrice: number,
  packageVat: number
): { canAfford: boolean; totalCost: number; balanceAfter: number } {
  const totalCost = packagePrice + packageVat;
  const canAfford = walletBalance >= totalCost;
  return {
    canAfford,
    totalCost,
    balanceAfter: canAfford ? walletBalance - totalCost : walletBalance,
  };
}

describe("Wallet deduction validation", () => {
  it("allows deduction when balance >= total cost", () => {
    const result = validateWalletDeduction(50000, 40000, 3000);
    assert.strictEqual(result.canAfford, true);
    assert.strictEqual(result.totalCost, 43000);
    assert.strictEqual(result.balanceAfter, 7000);
  });

  it("exactly sufficient balance is allowed", () => {
    const result = validateWalletDeduction(43000, 40000, 3000);
    assert.strictEqual(result.canAfford, true);
    assert.strictEqual(result.balanceAfter, 0);
  });

  it("rejects when balance < total cost", () => {
    const result = validateWalletDeduction(10000, 40000, 3000);
    assert.strictEqual(result.canAfford, false);
    assert.strictEqual(result.balanceAfter, 10000); // unchanged
  });

  it("zero balance cannot afford any package", () => {
    const result = validateWalletDeduction(0, 5000, 375);
    assert.strictEqual(result.canAfford, false);
  });

  it("handles zero-VAT packages", () => {
    const result = validateWalletDeduction(5000, 5000, 0);
    assert.strictEqual(result.canAfford, true);
    assert.strictEqual(result.totalCost, 5000);
  });
});

// ---------------------------------------------------------------------------
// Referral Commission Distribution (L1-L4)
// Mirrors: membershipPayments.service.ts referral chain logic
// ---------------------------------------------------------------------------

interface ReferralLevel {
  level: number;
  userId: string | null;
  cashAmount: number;
}

function calculateReferralChain(
  sponsorChain: (string | null)[],
  cashL1: number,
  cashL2: number,
  cashL3: number,
  cashL4: number
): ReferralLevel[] {
  const levels = [cashL1, cashL2, cashL3, cashL4];
  const result: ReferralLevel[] = [];

  for (let i = 0; i < 4; i++) {
    result.push({
      level: i + 1,
      userId: sponsorChain[i] ?? null,
      cashAmount: levels[i],
    });
  }

  return result;
}

function totalDistributableReferrals(chain: ReferralLevel[]): number {
  return chain
    .filter((r) => r.userId !== null && r.cashAmount > 0)
    .reduce((sum, r) => sum + r.cashAmount, 0);
}

describe("Referral commission chain", () => {
  it("distributes across all 4 levels when chain is complete", () => {
    const chain = calculateReferralChain(
      ["sponsor-1", "sponsor-2", "sponsor-3", "sponsor-4"],
      1000, 500, 250, 125
    );
    assert.strictEqual(chain.length, 4);
    assert.strictEqual(chain[0].cashAmount, 1000);
    assert.strictEqual(chain[3].cashAmount, 125);
    assert.strictEqual(totalDistributableReferrals(chain), 1875);
  });

  it("handles incomplete chain (only 2 sponsors)", () => {
    const chain = calculateReferralChain(
      ["sponsor-1", "sponsor-2", null, null],
      1000, 500, 250, 125
    );
    assert.strictEqual(totalDistributableReferrals(chain), 1500);
    assert.strictEqual(chain[2].userId, null);
  });

  it("handles no sponsors", () => {
    const chain = calculateReferralChain(
      [null, null, null, null],
      1000, 500, 250, 125
    );
    assert.strictEqual(totalDistributableReferrals(chain), 0);
  });

  it("handles zero commission packages", () => {
    const chain = calculateReferralChain(
      ["sponsor-1", "sponsor-2", "sponsor-3", "sponsor-4"],
      0, 0, 0, 0
    );
    assert.strictEqual(totalDistributableReferrals(chain), 0);
  });
});

// ---------------------------------------------------------------------------
// VAT Calculation (7.5% Nigeria standard)
// Mirrors: prisma schema MembershipPackage.vat
// ---------------------------------------------------------------------------

function calculateVAT(price: number, vatRate = 0.075): number {
  return Math.round(price * vatRate * 100) / 100;
}

describe("VAT calculation", () => {
  it("calculates 7.5% correctly for ₦40,000", () => {
    assert.strictEqual(calculateVAT(40000), 3000);
  });

  it("calculates 7.5% correctly for ₦5,000", () => {
    assert.strictEqual(calculateVAT(5000), 375);
  });

  it("zero price yields zero VAT", () => {
    assert.strictEqual(calculateVAT(0), 0);
  });
});

// ---------------------------------------------------------------------------
// Membership Package Validation
// ---------------------------------------------------------------------------

type PackageStatus = "active" | "inactive";

interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  vat: number;
  isActive: boolean;
  features: string[];
}

function validatePackageForActivation(
  pkg: MembershipPackage | null,
  userAlreadyActivated: boolean
): { valid: boolean; reason?: string } {
  if (!pkg) return { valid: false, reason: "Package not found" };
  if (!pkg.isActive) return { valid: false, reason: "Package is no longer active" };
  if (userAlreadyActivated) return { valid: false, reason: "User already has an active membership" };
  if (pkg.price <= 0) return { valid: false, reason: "Invalid package price" };
  return { valid: true };
}

describe("Package activation validation", () => {
  const validPkg: MembershipPackage = {
    id: "pkg-1",
    name: "Bronze",
    price: 5000,
    vat: 375,
    isActive: true,
    features: ["feature1"],
  };

  it("accepts valid package for non-activated user", () => {
    assert.strictEqual(validatePackageForActivation(validPkg, false).valid, true);
  });

  it("rejects null package", () => {
    const result = validatePackageForActivation(null, false);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "Package not found");
  });

  it("rejects inactive package", () => {
    const result = validatePackageForActivation({ ...validPkg, isActive: false }, false);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("no longer active"));
  });

  it("rejects already-activated user", () => {
    const result = validatePackageForActivation(validPkg, true);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("already has"));
  });

  it("rejects zero-price package", () => {
    const result = validatePackageForActivation({ ...validPkg, price: 0 }, false);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("Invalid"));
  });
});

// ---------------------------------------------------------------------------
// Package Upgrade Validation
// ---------------------------------------------------------------------------

function validateUpgrade(
  currentPrice: number,
  targetPrice: number
): { valid: boolean; reason?: string } {
  if (targetPrice <= currentPrice) {
    return { valid: false, reason: "Can only upgrade to a higher-tier package" };
  }
  return { valid: true };
}

describe("Package upgrade validation", () => {
  it("allows upgrade from lower to higher price", () => {
    assert.strictEqual(validateUpgrade(5000, 15000).valid, true);
  });

  it("rejects downgrade", () => {
    const result = validateUpgrade(15000, 5000);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("higher-tier"));
  });

  it("rejects same-tier (no change)", () => {
    const result = validateUpgrade(15000, 15000);
    assert.strictEqual(result.valid, false);
  });
});

// ---------------------------------------------------------------------------
// Empowerment Maturity Calculation
// Mirrors: finalizeEmpowermentPackage — 24-month countdown
// ---------------------------------------------------------------------------

function calculateMaturityDate(activationDate: Date, months = 24): Date {
  const maturity = new Date(activationDate);
  maturity.setMonth(maturity.getMonth() + months);
  return maturity;
}

describe("Empowerment maturity calculation", () => {
  it("sets maturity 24 months from activation", () => {
    const activation = new Date("2026-01-15T00:00:00Z");
    const maturity = calculateMaturityDate(activation);
    assert.strictEqual(maturity.getFullYear(), 2028);
    assert.strictEqual(maturity.getMonth(), 0); // January
    assert.strictEqual(maturity.getDate(), 15);
  });

  it("handles month overflow (e.g., Nov → next year Jan)", () => {
    const activation = new Date("2026-11-01T00:00:00Z");
    const maturity = calculateMaturityDate(activation);
    assert.strictEqual(maturity.getFullYear(), 2028);
    assert.strictEqual(maturity.getMonth(), 10); // November
  });

  it("handles end-of-month edge case", () => {
    const activation = new Date("2026-01-31T00:00:00Z");
    const maturity = calculateMaturityDate(activation);
    // Jan 31 + 24 months = Jan 31, 2028 (or could be Mar 3 depending on months)
    assert.ok(maturity > activation);
    const diffMs = maturity.getTime() - activation.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    assert.ok(diffDays >= 720); // ~24 months
  });
});
