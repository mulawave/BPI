import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSignatureContractDigest,
  verifyPluginSignatureContract,
} from "@/lib/plugins/signature";

const VALID_SHA = "a".repeat(64);

describe("buildSignatureContractDigest", () => {
  it("returns a 64-char hex SHA-256 digest", () => {
    const digest = buildSignatureContractDigest({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
      keyId: "key-1",
      algorithm: "ed25519",
    });
    assert.match(digest, /^[a-f0-9]{64}$/);
  });

  it("produces different digests for different inputs", () => {
    const a = buildSignatureContractDigest({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
      keyId: "key-1",
    });
    const b = buildSignatureContractDigest({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
      keyId: "key-2",
    });
    assert.notEqual(a, b);
  });

  it("uses fallback values for missing keyId/algorithm", () => {
    const digest = buildSignatureContractDigest({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
    });
    assert.match(digest, /^[a-f0-9]{64}$/);
  });
});

describe("verifyPluginSignatureContract", () => {
  it("fails if archiveSha256 is not valid hex", () => {
    const result = verifyPluginSignatureContract({
      archiveSha256: "not-valid",
      manifestSha256: VALID_SHA,
    });
    assert.equal(result.valid, false);
    assert.equal(result.mode, "failed");
    assert.ok(result.reason?.includes("SHA-256"));
  });

  it("fails if manifestSha256 is not valid hex", () => {
    const result = verifyPluginSignatureContract({
      archiveSha256: VALID_SHA,
      manifestSha256: "short",
    });
    assert.equal(result.valid, false);
    assert.equal(result.mode, "failed");
  });

  it("fails when keyId or algorithm is missing", () => {
    const result = verifyPluginSignatureContract({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
    });
    assert.equal(result.valid, false);
    assert.equal(result.mode, "failed");
    assert.ok(result.reason?.includes("keyId"));
  });

  it("returns stub mode when no publicKey/signatureContent", () => {
    const result = verifyPluginSignatureContract({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
      keyId: "key-1",
      algorithm: "ed25519",
    });
    assert.equal(result.valid, true);
    assert.equal(result.mode, "stub");
    assert.ok(result.digest);
  });

  it("returns stub mode even with publicKey and signature (phase one)", () => {
    const result = verifyPluginSignatureContract({
      archiveSha256: VALID_SHA,
      manifestSha256: VALID_SHA,
      keyId: "key-1",
      algorithm: "ed25519",
      publisherPublicKey: "pk-data",
      signatureContent: "sig-data",
    });
    assert.equal(result.valid, true);
    assert.equal(result.mode, "stub");
  });
});
