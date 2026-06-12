import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRequestedCapabilities,
  buildPermissionGrantDrafts,
} from "@/lib/plugins/permissions";

describe("normalizeRequestedCapabilities", () => {
  it("filters out unknown capabilities", () => {
    const result = normalizeRequestedCapabilities([
      "register-admin-nav-item",
      "totally-fake-cap",
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0], "register-admin-nav-item");
  });

  it("deduplicates capabilities", () => {
    const result = normalizeRequestedCapabilities([
      "read-users-summary",
      "read-users-summary",
    ]);
    assert.equal(result.length, 1);
  });

  it("returns empty array for all-unknown input", () => {
    const result = normalizeRequestedCapabilities(["nope", "also-nope"]);
    assert.equal(result.length, 0);
  });

  it("preserves valid capabilities in order", () => {
    const result = normalizeRequestedCapabilities([
      "read-plugin-settings",
      "write-plugin-settings",
    ]);
    assert.deepStrictEqual(result, [
      "read-plugin-settings",
      "write-plugin-settings",
    ]);
  });
});

describe("buildPermissionGrantDrafts", () => {
  it("marks approved capabilities as approved", () => {
    const drafts = buildPermissionGrantDrafts({
      requestedCapabilities: ["register-admin-nav-item"],
      approvedCapabilities: ["register-admin-nav-item"],
    });
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].approved, true);
    assert.equal(drafts[0].capability, "register-admin-nav-item");
  });

  it("marks unapproved capabilities as not approved", () => {
    const drafts = buildPermissionGrantDrafts({
      requestedCapabilities: ["read-payments-summary"],
      approvedCapabilities: [],
    });
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].approved, false);
  });

  it("assigns correct risk levels", () => {
    const drafts = buildPermissionGrantDrafts({
      requestedCapabilities: [
        "register-admin-nav-item",
        "read-payments-summary",
      ],
      approvedCapabilities: [],
    });
    const navDraft = drafts.find(
      (d) => d.capability === "register-admin-nav-item",
    );
    const payDraft = drafts.find(
      (d) => d.capability === "read-payments-summary",
    );
    assert.equal(navDraft?.riskLevel, "LOW");
    assert.equal(payDraft?.riskLevel, "HIGH");
  });

  it("filters out unknown capabilities from request", () => {
    const drafts = buildPermissionGrantDrafts({
      requestedCapabilities: ["unknown-cap", "read-plugin-settings"],
      approvedCapabilities: ["read-plugin-settings"],
    });
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].capability, "read-plugin-settings");
  });
});
