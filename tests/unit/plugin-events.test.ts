import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLUGIN_EVENT_SUMMARIES,
  defaultPluginEventSummary,
} from "@/lib/plugins/events";
import type { PluginEventType } from "@/lib/plugins/events";

describe("PLUGIN_EVENT_SUMMARIES", () => {
  it("has entries for all expected event types", () => {
    const expectedTypes: PluginEventType[] = [
      "UPLOADED",
      "VALIDATED",
      "VALIDATION_FAILED",
      "INSTALLED",
      "CONFIG_UPDATED",
      "DISABLED",
      "REMOVED",
      "ERROR_RECORDED",
    ];
    for (const type of expectedTypes) {
      assert.ok(type in PLUGIN_EVENT_SUMMARIES, `Missing event type: ${type}`);
    }
  });
});

describe("defaultPluginEventSummary", () => {
  it("returns the summary for UPLOADED", () => {
    assert.equal(
      defaultPluginEventSummary("UPLOADED"),
      "Plugin artifact uploaded",
    );
  });

  it("returns the summary for INSTALLED", () => {
    assert.equal(defaultPluginEventSummary("INSTALLED"), "Plugin installed");
  });

  it("returns the summary for each known event type", () => {
    for (const [type, summary] of Object.entries(PLUGIN_EVENT_SUMMARIES)) {
      assert.equal(
        defaultPluginEventSummary(type as PluginEventType),
        summary,
      );
    }
  });
});
