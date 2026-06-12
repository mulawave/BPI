import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validatePluginManifest } from "@/lib/plugins/validation";

function validManifestInput() {
  return {
    $schemaVersion: "1.0",
    pluginId: "com.example.valid-plugin",
    slug: "valid-plugin",
    name: "Valid Plugin",
    version: "1.0.0",
    description: "A valid test plugin",
    category: "integration",
    author: { name: "Author" },
    compatibility: {
      minAppVersion: "1.0.0",
      maxAppVersion: "2.0.0",
      pluginSdkVersion: "1.0.0",
    },
    capabilities: ["register-admin-nav-item"],
    checksums: {
      manifestSha256: "a".repeat(64),
      archiveSha256: "b".repeat(64),
    },
  };
}

describe("validatePluginManifest", () => {
  it("reports valid for a correct manifest with compatible versions", () => {
    const result = validatePluginManifest({
      manifestInput: validManifestInput(),
      appVersion: "1.5.0",
      hostPluginSdkVersion: "1.0.0",
    });
    assert.equal(result.valid, true);
    assert.equal(result.issueCount.error, 0);
    assert.equal(result.pluginId, "com.example.valid-plugin");
    assert.equal(result.slug, "valid-plugin");
    assert.equal(result.version, "1.0.0");
  });

  it("reports schema errors for invalid manifest input", () => {
    const result = validatePluginManifest({
      manifestInput: { invalid: true },
      appVersion: "1.0.0",
      hostPluginSdkVersion: "1.0.0",
    });
    assert.equal(result.valid, false);
    assert.ok(result.issueCount.error > 0);
    assert.ok(
      result.issues.some((i) => i.code === "MANIFEST_SCHEMA_INVALID"),
    );
  });

  it("reports PLUGIN_SDK_INCOMPATIBLE when plugin SDK is newer", () => {
    const input = validManifestInput();
    input.compatibility.pluginSdkVersion = "2.0.0";
    const result = validatePluginManifest({
      manifestInput: input,
      appVersion: "1.5.0",
      hostPluginSdkVersion: "1.0.0",
    });
    assert.equal(result.valid, false);
    assert.ok(
      result.issues.some((i) => i.code === "PLUGIN_SDK_INCOMPATIBLE"),
    );
  });

  it("reports APP_VERSION_INCOMPATIBLE when app version is out of range", () => {
    const result = validatePluginManifest({
      manifestInput: validManifestInput(),
      appVersion: "3.0.0",
      hostPluginSdkVersion: "1.0.0",
    });
    assert.equal(result.valid, false);
    assert.ok(
      result.issues.some((i) => i.code === "APP_VERSION_INCOMPATIBLE"),
    );
  });

  it("includes generatedAt timestamp", () => {
    const result = validatePluginManifest({
      manifestInput: validManifestInput(),
      appVersion: "1.5.0",
      hostPluginSdkVersion: "1.0.0",
    });
    assert.ok(result.generatedAt);
    assert.ok(!Number.isNaN(Date.parse(result.generatedAt)));
  });

  it("issues are sorted by path and code", () => {
    const result = validatePluginManifest({
      manifestInput: {},
      appVersion: "1.0.0",
      hostPluginSdkVersion: "1.0.0",
    });
    const paths = result.issues.map((i) => i.path);
    const sortedPaths = [...paths].sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(paths, sortedPaths);
  });

  it("reports zero warnings and info for schema-only errors", () => {
    const result = validatePluginManifest({
      manifestInput: null,
      appVersion: "1.0.0",
      hostPluginSdkVersion: "1.0.0",
    });
    assert.equal(result.issueCount.warning, 0);
    assert.equal(result.issueCount.info, 0);
  });
});
