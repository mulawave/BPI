import assert from "node:assert";
import { describe, it } from "node:test";
import { createPluginArchiveBuffer } from "@/lib/plugins/archive";
import { validatePluginArchiveContents } from "@/lib/plugins/archive-validation";

function buildValidArchiveBuffer() {
  const manifest = {
    $schemaVersion: "1.0",
    pluginId: "com.bpi.archive-test",
    slug: "archive-test",
    name: "Archive Test",
    version: "1.0.0",
    description: "Archive validation test plugin.",
    category: "analytics",
    author: { name: "BPI Test" },
    compatibility: {
      minAppVersion: "1.0.0",
      maxAppVersion: "1.9.99",
      pluginSdkVersion: "1.0.0"
    },
    capabilities: ["register-admin-page"],
    ui: {
      adminPage: {
        title: "Archive Test",
        schemaPath: "schemas/page.schema.json"
      }
    },
    settings: {
      schemaPath: "schemas/settings.schema.json",
      requiredSecrets: ["ARCHIVE_TEST_SECRET"]
    },
    checksums: {
      manifestSha256: "1111111111111111111111111111111111111111111111111111111111111111",
      archiveSha256: "2222222222222222222222222222222222222222222222222222222222222222"
    },
    signature: {
      algorithm: "ed25519",
      keyId: "archive-test-key",
      signaturePath: "metadata/signature.json"
    }
  };

  return createPluginArchiveBuffer([
    {
      path: "bpi-plugin.json",
      data: `${JSON.stringify(manifest, null, 2)}\n`
    },
    {
      path: "schemas/page.schema.json",
      data: JSON.stringify({ title: "Archive Test", blocks: [{ type: "hero", title: "Archive Test" }] }, null, 2)
    },
    {
      path: "schemas/settings.schema.json",
      data: JSON.stringify({ type: "object", properties: { apiTokenRef: { type: "string", "x-secret": true } } }, null, 2)
    },
    {
      path: "metadata/signature.json",
      data: JSON.stringify({ keyId: "archive-test-key", algorithm: "ed25519" }, null, 2)
    },
    {
      path: "README.md",
      data: "# Archive Test\n"
    }
  ]);
}

describe("plugin archive validation", () => {
  it("accepts an archive with root manifest and referenced schemas", () => {
    const result = validatePluginArchiveContents({
      archiveBuffer: buildValidArchiveBuffer(),
      appVersion: "1.0.0",
      hostPluginSdkVersion: "1.0.0"
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.manifest?.slug, "archive-test");
    assert.ok(result.pageSchema?.blocks.length);
    assert.strictEqual(result.settingsSchema?.type, "object");
  });

  it("rejects a manifest that references a missing schema file", () => {
    const manifest = {
      $schemaVersion: "1.0",
      pluginId: "com.bpi.archive-bad",
      slug: "archive-bad",
      name: "Archive Bad",
      version: "1.0.0",
      description: "Archive validation test plugin.",
      category: "analytics",
      author: { name: "BPI Test" },
      compatibility: {
        minAppVersion: "1.0.0",
        maxAppVersion: "1.9.99",
        pluginSdkVersion: "1.0.0"
      },
      capabilities: ["register-admin-page"],
      ui: {
        adminPage: {
          title: "Archive Bad",
          schemaPath: "schemas/missing-page.schema.json"
        }
      },
      checksums: {
        manifestSha256: "1111111111111111111111111111111111111111111111111111111111111111",
        archiveSha256: "2222222222222222222222222222222222222222222222222222222222222222"
      }
    };

    const archiveBuffer = createPluginArchiveBuffer([
      {
        path: "bpi-plugin.json",
        data: `${JSON.stringify(manifest, null, 2)}\n`
      }
    ]);

    const result = validatePluginArchiveContents({
      archiveBuffer,
      appVersion: "1.0.0",
      hostPluginSdkVersion: "1.0.0"
    });

    assert.strictEqual(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "PAGE_SCHEMA_MISSING"));
  });
});