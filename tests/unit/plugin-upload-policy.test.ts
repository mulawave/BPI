import { describe, it } from "node:test";
import assert from "node:assert";
import {
  MAX_PLUGIN_ARCHIVE_BYTES,
  hasZipMagicBytes,
  isPluginArchiveExtension,
  isPluginArtifactMimeType,
  validatePluginUploadPolicy,
} from "@/lib/plugins/upload-policy";

describe("plugin upload policy", () => {
  it("accepts a valid zip archive", () => {
    const buffer = Buffer.from("504B0304AABBCCDD", "hex");
    const result = validatePluginUploadPolicy({
      file: {
        name: "crm-sync.zip",
        type: "application/zip",
        size: buffer.length,
      },
      buffer,
    });

    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it("rejects non-zip extension", () => {
    const buffer = Buffer.from("504B0304AABBCCDD", "hex");
    const result = validatePluginUploadPolicy({
      file: {
        name: "crm-sync.tar.gz",
        type: "application/gzip",
        size: buffer.length,
      },
      buffer,
    });

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes(".zip")));
  });

  it("rejects non-zip signature", () => {
    const buffer = Buffer.from("89504E470D0A1A0A", "hex");
    const result = validatePluginUploadPolicy({
      file: {
        name: "not-a-plugin.zip",
        type: "application/zip",
        size: buffer.length,
      },
      buffer,
    });

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes("signature")));
  });

  it("rejects oversized archive", () => {
    const buffer = Buffer.from("504B0304AABBCCDD", "hex");
    const result = validatePluginUploadPolicy({
      file: {
        name: "huge-plugin.zip",
        type: "application/zip",
        size: MAX_PLUGIN_ARCHIVE_BYTES + 1,
      },
      buffer,
    });

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes("exceeds")));
  });
});

describe("plugin upload policy helpers", () => {
  it("detects zip extension", () => {
    assert.strictEqual(isPluginArchiveExtension("my-plugin.zip"), true);
    assert.strictEqual(isPluginArchiveExtension("my-plugin.tar"), false);
  });

  it("detects plugin archive mime types", () => {
    assert.strictEqual(isPluginArtifactMimeType("application/zip"), true);
    assert.strictEqual(isPluginArtifactMimeType("application/x-zip-compressed"), true);
    assert.strictEqual(isPluginArtifactMimeType("image/png"), false);
  });

  it("detects zip magic bytes", () => {
    assert.strictEqual(hasZipMagicBytes(Buffer.from("504B0304AABBCCDD", "hex")), true);
    assert.strictEqual(hasZipMagicBytes(Buffer.from("89504E470D0A1A0A", "hex")), false);
  });
});
