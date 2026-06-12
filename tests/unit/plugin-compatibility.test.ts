import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAppVersionCompatible,
  isPluginSdkCompatible,
} from "@/lib/plugins/compatibility";

describe("isAppVersionCompatible", () => {
  it("returns true when appVersion is within range", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "1.5.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      true,
    );
  });

  it("returns true when appVersion equals minAppVersion", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "1.0.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      true,
    );
  });

  it("returns true when appVersion equals maxAppVersion", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "2.0.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      true,
    );
  });

  it("returns false when appVersion is below minAppVersion", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "0.9.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      false,
    );
  });

  it("returns false when appVersion is above maxAppVersion", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "3.0.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      false,
    );
  });

  it("supports wildcard maxAppVersion like '1.x'", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "1.9.5",
        minAppVersion: "1.0.0",
        maxAppVersion: "1.x",
      }),
      true,
    );
  });

  it("rejects different major version with wildcard", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "2.0.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "1.x",
      }),
      false,
    );
  });

  it("handles v-prefix in version strings", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "v1.5.0",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      true,
    );
  });

  it("handles pre-release suffix", () => {
    assert.equal(
      isAppVersionCompatible({
        appVersion: "1.5.0-beta.1",
        minAppVersion: "1.0.0",
        maxAppVersion: "2.0.0",
      }),
      true,
    );
  });
});

describe("isPluginSdkCompatible", () => {
  it("returns true when plugin SDK <= host SDK", () => {
    assert.equal(
      isPluginSdkCompatible({
        hostPluginSdkVersion: "1.0.0",
        pluginSdkVersion: "1.0.0",
      }),
      true,
    );
  });

  it("returns true when plugin SDK is older", () => {
    assert.equal(
      isPluginSdkCompatible({
        hostPluginSdkVersion: "2.0.0",
        pluginSdkVersion: "1.0.0",
      }),
      true,
    );
  });

  it("returns false when plugin SDK is newer than host", () => {
    assert.equal(
      isPluginSdkCompatible({
        hostPluginSdkVersion: "1.0.0",
        pluginSdkVersion: "1.1.0",
      }),
      false,
    );
  });
});
