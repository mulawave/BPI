import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decideCspBroadcastSweepAction } from "@/server/jobs/cspBroadcastSweep";

describe("decideCspBroadcastSweepAction", () => {
  it("extends when raised amount is below the fulfilment requirement and extensions remain", () => {
    const result = decideCspBroadcastSweepAction({
      raisedAmount: 40,
      thresholdAmount: 100,
      minFulfilmentPct: 50,
      autoExtendCount: 0,
      maxAutoExtensions: 3,
    });

    assert.equal(result.action, "extend");
    assert.equal(result.requiredFulfilment, 50);
    assert.equal(result.canAutoExtend, true);
  });

  it("closes when raised amount exactly meets the fulfilment requirement", () => {
    const result = decideCspBroadcastSweepAction({
      raisedAmount: 50,
      thresholdAmount: 100,
      minFulfilmentPct: 50,
      autoExtendCount: 0,
      maxAutoExtensions: 3,
    });

    assert.equal(result.action, "close");
    assert.equal(result.requiredFulfilment, 50);
  });

  it("closes when extensions are exhausted even if fulfilment is not met", () => {
    const result = decideCspBroadcastSweepAction({
      raisedAmount: 40,
      thresholdAmount: 100,
      minFulfilmentPct: 50,
      autoExtendCount: 3,
      maxAutoExtensions: 3,
    });

    assert.equal(result.action, "close");
    assert.equal(result.canAutoExtend, false);
  });

  it("closes legacy broadcasts with null fulfilment percentage", () => {
    const result = decideCspBroadcastSweepAction({
      raisedAmount: 0,
      thresholdAmount: 100,
      minFulfilmentPct: null,
      autoExtendCount: 0,
      maxAutoExtensions: 3,
    });

    assert.equal(result.action, "close");
    assert.equal(result.requiredFulfilment, 0);
  });
});
