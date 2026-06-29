import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeSponsorCoolingReduction,
  selectEffectiveCoolingState,
} from "@/server/services/csp-cooling.service";

describe("selectEffectiveCoolingState", () => {
  it("uses standing-based cooling when tier mode is enabled", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const result = selectEffectiveCoolingState({
      tierModelEnabled: true,
      releasedCooldownEndsAt: new Date("2026-06-10T00:00:00.000Z"),
      standingCoolingEndsAt: new Date("2026-06-05T00:00:00.000Z"),
      standingCoolingMonthsBase: 12,
      standingLastSupportReleasedAt: new Date("2026-05-01T00:00:00.000Z"),
      now,
    });

    assert.equal(result.source, "standing");
    assert.equal(result.isActive, true);
    assert.equal(result.cooldownEndsAt?.toISOString(), "2026-06-05T00:00:00.000Z");
  });

  it("uses request-based cooling when tier mode is disabled", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const result = selectEffectiveCoolingState({
      tierModelEnabled: false,
      releasedCooldownEndsAt: new Date("2026-06-10T00:00:00.000Z"),
      releasedCooldownMonths: 24,
      standingCoolingEndsAt: null,
      standingLastSupportReleasedAt: null,
      now,
    });

    assert.equal(result.source, "request");
    assert.equal(result.isActive, true);
    assert.equal(result.cooldownEndsAt?.toISOString(), "2026-06-10T00:00:00.000Z");
  });
});

describe("computeSponsorCoolingReduction", () => {
  it("qualifies and shortens cooling only when the reduced period is shorter", () => {
    const result = computeSponsorCoolingReduction({
      directSponsorCount: 100,
      requiredCount: 100,
      reducedCoolingMonths: 6,
      lastSupportReleasedAt: new Date("2026-01-01T00:00:00.000Z"),
      currentCoolingEndsAt: new Date("2026-12-01T00:00:00.000Z"),
    });

    assert.equal(result.qualifies, true);
    assert.equal(result.shouldShorten, true);
    assert.equal(result.reducedCoolingEndsAt?.toISOString(), "2026-07-01T00:00:00.000Z");
  });

  it("does not extend cooling when the reduced target is later than the current end", () => {
    const result = computeSponsorCoolingReduction({
      directSponsorCount: 100,
      requiredCount: 100,
      reducedCoolingMonths: 6,
      lastSupportReleasedAt: new Date("2026-01-01T00:00:00.000Z"),
      currentCoolingEndsAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    assert.equal(result.qualifies, true);
    assert.equal(result.shouldShorten, false);
    assert.equal(result.reducedCoolingEndsAt?.toISOString(), "2026-07-01T00:00:00.000Z");
  });

  it("does not qualify below the sponsor threshold", () => {
    const result = computeSponsorCoolingReduction({
      directSponsorCount: 99,
      requiredCount: 100,
      reducedCoolingMonths: 6,
      lastSupportReleasedAt: new Date("2026-01-01T00:00:00.000Z"),
      currentCoolingEndsAt: new Date("2026-12-01T00:00:00.000Z"),
    });

    assert.equal(result.qualifies, false);
    assert.equal(result.shouldShorten, false);
  });
});
