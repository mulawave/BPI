import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ensureMemberStanding,
  resolveTier,
  validateTierSupportRequest,
} from "@/server/services/csp-tier.service";

const tiers = [
  { tierNumber: 1, name: "Tier 1", contributionRight: 50, maxSupportCap: 60, minFulfilmentPct: 30, isActive: true, isSpecial: false, sortOrder: 0 },
  { tierNumber: 2, name: "Tier 2", contributionRight: 100, maxSupportCap: 120, minFulfilmentPct: 30, isActive: true, isSpecial: false, sortOrder: 0 },
  { tierNumber: 3, name: "Tier 3", contributionRight: 150, maxSupportCap: 180, minFulfilmentPct: 30, isActive: true, isSpecial: false, sortOrder: 0 },
];

describe("resolveTier", () => {
  it("returns null tier below the lowest threshold and the next tier delta", () => {
    const result = resolveTier(tiers, 25);

    assert.equal(result.tier, null);
    assert.equal(result.amountToNextTier, 25);
  });

  it("returns the greatest active tier at or below contribution right", () => {
    const result = resolveTier(tiers, 120);

    assert.equal(result.tier?.tierNumber, 2);
    assert.equal(result.tier?.maxSupportCap, 120);
    assert.equal(result.amountToNextTier, 30);
  });
});

describe("validateTierSupportRequest", () => {
  it("rejects requests that exceed the tier cap", () => {
    const result = validateTierSupportRequest(tiers, 120, 130);

    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /support cap/i);
  });

  it("allows requests within the tier cap", () => {
    const result = validateTierSupportRequest(tiers, 120, 120);

    assert.equal(result.ok, true);
    assert.equal(result.maxSupportCap, 120);
    assert.equal(result.currentTier?.tierNumber, 2);
  });
});

describe("ensureMemberStanding", () => {
  it("reconciles contributionRight exactly from contribution sums without double counting", async () => {
    const contributions = [
      { amount: 30 },
    ];
    let standing: { userId: string; contributionRight: number; currentTierNumber: number | null } | null = null;
    const userId = "user-1";

    const db = {
      cspTier: {
        findMany: async () => tiers,
      },
      cspContribution: {
        aggregate: async () => ({
          _sum: {
            amount: contributions.reduce((sum, row) => sum + row.amount, 0),
          },
        }),
      },
      cspMemberStanding: {
        findUnique: async () => standing,
        create: async ({ data }: any) => {
          standing = { ...data };
          return standing;
        },
        update: async ({ data }: any) => {
          standing = { ...(standing ?? { userId }), ...data };
          return standing;
        },
      },
    } as any;

    const first = await ensureMemberStanding(db, userId);
    assert.equal(first.contributionRight, 30);
    assert.equal(first.currentTierNumber, null);

    contributions.push({ amount: 25 });

    const second = await ensureMemberStanding(db, userId);
    assert.equal(second.contributionRight, 55);
    assert.equal(second.currentTierNumber, 1);

    const third = await ensureMemberStanding(db, userId);
    assert.equal(third.contributionRight, 55);
    assert.equal(third.currentTierNumber, 1);
  });
});
