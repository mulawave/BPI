import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PALLIATIVE_THRESHOLD,
  PALLIATIVE_OPTIONS,
  getPalliativeTier,
  isHighTierPackage,
  getWalletFieldName,
  calculateThresholdProgress,
  getOptionTargetAmount,
  isShelterActivated,
  calculateOptionProgress,
  canActivatePalliative,
  getMilestones,
  getCompletedMilestones,
  getNextMilestone,
} from "@/lib/palliative";

describe("getPalliativeTier", () => {
  it("returns 'higher' for packages >= ₦210k", () => {
    assert.equal(getPalliativeTier(210000), "higher");
    assert.equal(getPalliativeTier(500000), "higher");
  });

  it("returns 'lower' for packages < ₦210k", () => {
    assert.equal(getPalliativeTier(209999), "lower");
    assert.equal(getPalliativeTier(100000), "lower");
    assert.equal(getPalliativeTier(0), "lower");
  });
});

describe("isHighTierPackage", () => {
  it("returns true for Gold Plus", () => {
    assert.equal(isHighTierPackage("Gold Plus"), true);
  });

  it("returns true for Platinum", () => {
    assert.equal(isHighTierPackage("Platinum Package"), true);
  });

  it("returns true for Diamond", () => {
    assert.equal(isHighTierPackage("Diamond"), true);
  });

  it("returns true for Travel", () => {
    assert.equal(isHighTierPackage("Travel Plan"), true);
  });

  it("is case-insensitive", () => {
    assert.equal(isHighTierPackage("gold plus"), true);
    assert.equal(isHighTierPackage("DIAMOND"), true);
  });

  it("returns false for Regular", () => {
    assert.equal(isHighTierPackage("Regular"), false);
  });

  it("returns false for Bronze", () => {
    assert.equal(isHighTierPackage("Bronze"), false);
  });
});

describe("getWalletFieldName", () => {
  it("maps 'car' to 'car'", () => {
    assert.equal(getWalletFieldName("car"), "car");
  });

  it("maps 'house' to 'shelter'", () => {
    assert.equal(getWalletFieldName("house"), "shelter");
  });

  it("maps 'land' to 'land'", () => {
    assert.equal(getWalletFieldName("land"), "land");
  });

  it("maps all known types", () => {
    assert.equal(getWalletFieldName("business"), "business");
    assert.equal(getWalletFieldName("solar"), "solar");
    assert.equal(getWalletFieldName("education"), "education");
  });
});

describe("calculateThresholdProgress", () => {
  it("returns 50% for half the threshold", () => {
    assert.equal(calculateThresholdProgress(PALLIATIVE_THRESHOLD / 2), 50);
  });

  it("returns 100% when amount equals threshold", () => {
    assert.equal(calculateThresholdProgress(PALLIATIVE_THRESHOLD), 100);
  });

  it("caps at 100% when exceeding threshold", () => {
    assert.equal(calculateThresholdProgress(PALLIATIVE_THRESHOLD * 2), 100);
  });

  it("returns 0% for 0 amount", () => {
    assert.equal(calculateThresholdProgress(0), 0);
  });
});

describe("getOptionTargetAmount", () => {
  it("returns the target amount for 'car'", () => {
    assert.equal(getOptionTargetAmount("car"), 10000000);
  });

  it("returns 0 for unknown slug", () => {
    assert.equal(getOptionTargetAmount("unknown"), 0);
  });

  it("returns correct values for all known slugs", () => {
    for (const opt of PALLIATIVE_OPTIONS) {
      assert.equal(getOptionTargetAmount(opt.slug), opt.targetAmount);
    }
  });
});

describe("isShelterActivated", () => {
  it("returns true when already activated", () => {
    assert.equal(isShelterActivated(0, true), true);
  });

  it("returns true when balance >= threshold", () => {
    assert.equal(isShelterActivated(PALLIATIVE_THRESHOLD, false), true);
  });

  it("returns false when balance < threshold and not activated", () => {
    assert.equal(isShelterActivated(100000, false), false);
  });
});

describe("calculateOptionProgress", () => {
  it("returns 50% for half the target", () => {
    assert.equal(calculateOptionProgress(500, 1000), 50);
  });

  it("caps at 100%", () => {
    assert.equal(calculateOptionProgress(2000, 1000), 100);
  });

  it("returns 0 when target is 0", () => {
    assert.equal(calculateOptionProgress(500, 0), 0);
  });
});

describe("canActivatePalliative", () => {
  it("returns true when wallet >= threshold and not activated", () => {
    assert.equal(canActivatePalliative(PALLIATIVE_THRESHOLD, false), true);
  });

  it("returns false when already activated", () => {
    assert.equal(canActivatePalliative(PALLIATIVE_THRESHOLD, true), false);
  });

  it("returns false when wallet < threshold", () => {
    assert.equal(canActivatePalliative(100000, false), false);
  });

  it("uses optionTargetAmount when provided", () => {
    assert.equal(canActivatePalliative(5000000, false, 5000000), true);
    assert.equal(canActivatePalliative(4999999, false, 5000000), false);
  });
});

describe("getMilestones", () => {
  it("returns 4 milestones ending with PALLIATIVE_THRESHOLD", () => {
    const milestones = getMilestones();
    assert.equal(milestones.length, 4);
    assert.equal(milestones[milestones.length - 1], PALLIATIVE_THRESHOLD);
  });
});

describe("getCompletedMilestones", () => {
  it("returns no milestones for 0", () => {
    assert.deepStrictEqual(getCompletedMilestones(0), []);
  });

  it("returns first milestone when amount exceeds it", () => {
    const completed = getCompletedMilestones(50000);
    assert.ok(completed.length >= 1);
    assert.equal(completed[0], 50000);
  });

  it("returns all milestones when amount exceeds threshold", () => {
    const completed = getCompletedMilestones(PALLIATIVE_THRESHOLD + 1);
    assert.equal(completed.length, getMilestones().length);
  });
});

describe("getNextMilestone", () => {
  it("returns first milestone for 0", () => {
    assert.equal(getNextMilestone(0), 50000);
  });

  it("returns null when all milestones completed", () => {
    assert.equal(getNextMilestone(PALLIATIVE_THRESHOLD + 1), null);
  });

  it("returns next unachieved milestone", () => {
    assert.equal(getNextMilestone(50001), 100000);
  });
});
