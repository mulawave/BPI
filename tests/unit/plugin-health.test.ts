import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPluginHealthSummary } from "@/lib/plugins/health";

describe("buildPluginHealthSummary", () => {
  it("returns READY state from latest health status", () => {
    const result = buildPluginHealthSummary({
      healthStatuses: [
        {
          healthState: "READY",
          statusSummary: "All checks passing",
          updatedAt: "2025-06-01T00:00:00Z",
        },
      ],
    });
    assert.equal(result.state, "READY");
    assert.equal(result.summary, "All checks passing");
    assert.ok(result.checkedAt);
  });

  it("uses default summary when statusSummary is null", () => {
    const result = buildPluginHealthSummary({
      healthStatuses: [
        {
          healthState: "DEGRADED",
          statusSummary: null,
        },
      ],
    });
    assert.equal(result.state, "DEGRADED");
    assert.ok(result.summary.includes("degraded"));
  });

  it("returns FAILED for ERROR plugin status with no health records", () => {
    const result = buildPluginHealthSummary({ pluginStatus: "ERROR" });
    assert.equal(result.state, "FAILED");
    assert.ok(result.summary.includes("error state"));
  });

  it("returns CONFIG_MISSING for CONFIG_REQUIRED plugin status", () => {
    const result = buildPluginHealthSummary({
      pluginStatus: "CONFIG_REQUIRED",
    });
    assert.equal(result.state, "CONFIG_MISSING");
    assert.ok(result.summary.includes("configuration"));
  });

  it("returns UNKNOWN when no data is available", () => {
    const result = buildPluginHealthSummary({});
    assert.equal(result.state, "UNKNOWN");
    assert.equal(result.checkedAt, null);
  });

  it("prefers lastCheckedAt over updatedAt for checkedAt", () => {
    const result = buildPluginHealthSummary({
      healthStatuses: [
        {
          healthState: "READY",
          statusSummary: "ok",
          updatedAt: "2025-01-01T00:00:00Z",
          lastCheckedAt: "2025-06-15T12:00:00Z",
        },
      ],
    });
    assert.ok(result.checkedAt?.includes("2025-06-15"));
  });

  it("handles empty healthStatuses array", () => {
    const result = buildPluginHealthSummary({ healthStatuses: [] });
    assert.equal(result.state, "UNKNOWN");
  });

  it("sets details from detailsJson", () => {
    const details = { cpu: 0.85, memory: 0.6 };
    const result = buildPluginHealthSummary({
      healthStatuses: [
        {
          healthState: "READY",
          statusSummary: "ok",
          detailsJson: details,
        },
      ],
    });
    assert.deepStrictEqual(result.details, details);
  });

  it("returns null details when detailsJson is undefined", () => {
    const result = buildPluginHealthSummary({
      healthStatuses: [
        {
          healthState: "READY",
          statusSummary: "ok",
        },
      ],
    });
    assert.equal(result.details, null);
  });
});
