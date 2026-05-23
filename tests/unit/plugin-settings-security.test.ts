import { describe, it } from "node:test";
import assert from "node:assert";
import {
  hasForbiddenExecutableExtension,
  hasForbiddenPathSegment,
  maskSecretReference,
  sanitizeExternalUrl,
  sanitizeSecretReference,
} from "@/lib/plugins/sanitization";
import { validatePluginArchiveSecurity } from "@/lib/plugins/security";

describe("plugin settings sanitization", () => {
  it("accepts well-formed secret references", () => {
    assert.strictEqual(sanitizeSecretReference("secret://PAYMENT_API_KEY"), "secret://PAYMENT_API_KEY");
  });

  it("rejects malformed secret references", () => {
    assert.strictEqual(sanitizeSecretReference("secret://payment-api-key"), null);
    assert.strictEqual(sanitizeSecretReference("PAYMENT_API_KEY"), null);
  });

  it("masks secret references in responses", () => {
    assert.strictEqual(maskSecretReference("secret://CRM_API_KEY"), "[MASKED_SECRET_REF]");
    assert.strictEqual(maskSecretReference("plain-value"), "plain-value");
  });

  it("accepts only http/https URLs", () => {
    assert.strictEqual(sanitizeExternalUrl("https://api.example.com/webhook"), "https://api.example.com/webhook");
    assert.strictEqual(sanitizeExternalUrl("javascript:alert(1)"), null);
  });
});

describe("plugin archive security guards", () => {
  it("detects forbidden executable extension and path segments", () => {
    assert.strictEqual(hasForbiddenExecutableExtension("bundles/main.js"), true);
    assert.strictEqual(hasForbiddenPathSegment("node_modules/react/index.js"), true);
  });

  it("rejects archives with unsafe buffer patterns", () => {
    const unsafeBuffer = Buffer.from("504B03046E6F64655F6D6F64756C65732F696E6465782E6A73", "hex");
    const result = validatePluginArchiveSecurity({ archiveBuffer: unsafeBuffer });

    assert.strictEqual(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "PATTERN_NODE_MODULES"));
    assert.ok(result.issues.some((issue) => issue.code === "PATTERN_EXEC_JS"));
  });

  it("does not treat .json paths as executable JavaScript bundles", () => {
    const jsonOnlyBuffer = Buffer.from("504B0304736368656D61732F706167652E736368656D612E6A736F6E", "hex");
    const result = validatePluginArchiveSecurity({ archiveBuffer: jsonOnlyBuffer });

    assert.strictEqual(result.issues.some((issue) => issue.code === "PATTERN_EXEC_JS"), false);
  });
});
