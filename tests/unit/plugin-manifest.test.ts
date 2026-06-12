import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePluginManifest } from "@/lib/plugins/manifest";

function validManifestInput() {
  return {
    $schemaVersion: "1.0",
    pluginId: "com.example.test-plugin",
    slug: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    description: "A test plugin for unit testing",
    category: "integration",
    author: { name: "Test Author" },
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

describe("parsePluginManifest", () => {
  it("parses a valid manifest", () => {
    const result = parsePluginManifest(validManifestInput());
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.manifest.pluginId, "com.example.test-plugin");
      assert.equal(result.manifest.slug, "test-plugin");
    }
  });

  it("rejects manifest with wrong schemaVersion", () => {
    const input = { ...validManifestInput(), $schemaVersion: "2.0" };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.errors.length > 0);
    }
  });

  it("rejects manifest with invalid pluginId format", () => {
    const input = { ...validManifestInput(), pluginId: "INVALID" };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects manifest with invalid slug format", () => {
    const input = { ...validManifestInput(), slug: "INVALID SLUG" };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects manifest with invalid version format", () => {
    const input = { ...validManifestInput(), version: "not-semver" };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects manifest with unsupported category", () => {
    const input = { ...validManifestInput(), category: "unknown-cat" };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects manifest with empty capabilities", () => {
    const input = { ...validManifestInput(), capabilities: [] };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects manifest with unsupported capabilities", () => {
    const input = { ...validManifestInput(), capabilities: ["totally-fake"] };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects manifest with invalid checksum format", () => {
    const input = {
      ...validManifestInput(),
      checksums: { manifestSha256: "short", archiveSha256: "short" },
    };
    const result = parsePluginManifest(input);
    assert.equal(result.success, false);
  });

  it("rejects non-object input", () => {
    const result = parsePluginManifest("not an object");
    assert.equal(result.success, false);
  });

  it("rejects null input", () => {
    const result = parsePluginManifest(null);
    assert.equal(result.success, false);
  });

  it("accepts manifest with optional UI section", () => {
    const input = {
      ...validManifestInput(),
      capabilities: ["register-admin-nav-item", "register-admin-page"],
      ui: {
        adminNav: {
          label: "My Plugin",
          icon: "plug",
          placement: "plugins",
        },
        adminPage: {
          title: "Plugin Dashboard",
          schemaPath: "pages/dashboard.json",
        },
      },
    };
    const result = parsePluginManifest(input);
    assert.equal(result.success, true);
  });

  it("accepts manifest with optional settings section", () => {
    const input = {
      ...validManifestInput(),
      settings: {
        schemaPath: "config/settings.json",
        requiredSecrets: ["API_KEY"],
      },
    };
    const result = parsePluginManifest(input);
    assert.equal(result.success, true);
  });

  it("accepts manifest with pre-release version", () => {
    const input = { ...validManifestInput(), version: "1.0.0-beta.1" };
    const result = parsePluginManifest(input);
    assert.equal(result.success, true);
  });
});
