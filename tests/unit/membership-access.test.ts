import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveMembershipExpiry,
  evaluateMembershipAccess,
} from "@/lib/membershipAccess";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("deriveMembershipExpiry", () => {
  it("returns explicit expiry when membershipExpiresAt is set", () => {
    const expiresAt = new Date("2025-12-31T00:00:00Z");
    const result = deriveMembershipExpiry({ membershipExpiresAt: expiresAt });
    assert.deepStrictEqual(result.expiresAt, expiresAt);
    assert.equal(result.derivedFromActivation, false);
  });

  it("accepts string dates for membershipExpiresAt", () => {
    const result = deriveMembershipExpiry({
      membershipExpiresAt: "2025-06-15T12:00:00Z",
    });
    assert.ok(result.expiresAt instanceof Date);
    assert.equal(result.derivedFromActivation, false);
  });

  it("derives expiry from activatedAt + renewalCycleDays", () => {
    const activated = new Date("2025-01-01T00:00:00Z");
    const result = deriveMembershipExpiry({
      membershipActivatedAt: activated,
      renewalCycleDays: 30,
    });
    const expected = new Date(activated.getTime() + 30 * DAY_MS);
    assert.deepStrictEqual(result.expiresAt, expected);
    assert.equal(result.derivedFromActivation, true);
  });

  it("returns null expiry when no data provided", () => {
    const result = deriveMembershipExpiry({});
    assert.equal(result.expiresAt, null);
    assert.equal(result.derivedFromActivation, false);
  });

  it("returns null when activatedAt is set but renewalCycleDays is 0", () => {
    const result = deriveMembershipExpiry({
      membershipActivatedAt: new Date(),
      renewalCycleDays: 0,
    });
    assert.equal(result.expiresAt, null);
  });

  it("returns null for invalid date strings", () => {
    const result = deriveMembershipExpiry({
      membershipExpiresAt: "not-a-date",
    });
    assert.equal(result.expiresAt, null);
  });

  it("prefers explicit expiry over derived", () => {
    const explicit = new Date("2026-01-01T00:00:00Z");
    const result = deriveMembershipExpiry({
      membershipExpiresAt: explicit,
      membershipActivatedAt: new Date("2025-01-01T00:00:00Z"),
      renewalCycleDays: 30,
    });
    assert.deepStrictEqual(result.expiresAt, explicit);
    assert.equal(result.derivedFromActivation, false);
  });
});

describe("evaluateMembershipAccess", () => {
  const futureDate = new Date(Date.now() + 30 * DAY_MS);
  const pastDate = new Date(Date.now() - 1 * DAY_MS);

  it("reports valid membership with future expiry", () => {
    const result = evaluateMembershipAccess({
      activeMembershipPackageId: "pkg-1",
      membershipExpiresAt: futureDate,
    });
    assert.equal(result.hasMembershipPackage, true);
    assert.equal(result.membershipValid, true);
    assert.equal(result.isExpired, false);
    assert.ok(typeof result.daysUntilExpiry === "number" && result.daysUntilExpiry > 0);
  });

  it("reports expired membership with past expiry", () => {
    const result = evaluateMembershipAccess({
      activeMembershipPackageId: "pkg-1",
      membershipExpiresAt: pastDate,
    });
    assert.equal(result.membershipValid, false);
    assert.equal(result.isExpired, true);
    assert.ok(typeof result.daysUntilExpiry === "number" && result.daysUntilExpiry <= 0);
  });

  it("reports no membership when packageId is null", () => {
    const result = evaluateMembershipAccess({
      activeMembershipPackageId: null,
      membershipExpiresAt: futureDate,
    });
    assert.equal(result.hasMembershipPackage, false);
    assert.equal(result.membershipValid, false);
  });

  it("uses custom now parameter", () => {
    const now = new Date("2025-06-01T00:00:00Z");
    const expiry = new Date("2025-07-01T00:00:00Z");
    const result = evaluateMembershipAccess({
      activeMembershipPackageId: "pkg-1",
      membershipExpiresAt: expiry,
      now,
    });
    assert.equal(result.membershipValid, true);
    assert.equal(result.daysUntilExpiry, 30);
  });

  it("derives expiry from activatedAt + renewalCycleDays", () => {
    const now = new Date("2025-06-01T00:00:00Z");
    const activated = new Date("2025-05-01T00:00:00Z");
    const result = evaluateMembershipAccess({
      activeMembershipPackageId: "pkg-1",
      membershipActivatedAt: activated,
      renewalCycleDays: 60,
      now,
    });
    assert.equal(result.derivedFromActivation, true);
    assert.equal(result.membershipValid, true);
  });
});
