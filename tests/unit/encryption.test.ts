import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

describe("encryption utilities", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests";
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  it("encrypt returns iv:authTag:encrypted format", async () => {
    const mod = await import("@/server/utils/encryption");
    const encrypted = mod.encrypt("hello world");
    const parts = encrypted.split(":");
    assert.equal(parts.length, 3);
    assert.match(parts[0], /^[a-f0-9]{32}$/);
    assert.match(parts[1], /^[a-f0-9]{32}$/);
    assert.ok(parts[2].length > 0);
  });

  it("decrypt recovers the original text", async () => {
    const mod = await import("@/server/utils/encryption");
    const plaintext = "sensitive data 12345";
    const encrypted = mod.encrypt(plaintext);
    const decrypted = mod.decrypt(encrypted);
    assert.equal(decrypted, plaintext);
  });

  it("encrypt produces different ciphertext each time (random IV)", async () => {
    const mod = await import("@/server/utils/encryption");
    const a = mod.encrypt("same text");
    const b = mod.encrypt("same text");
    assert.notEqual(a, b);
  });

  it("decrypt throws on invalid format", async () => {
    const mod = await import("@/server/utils/encryption");
    assert.throws(() => mod.decrypt("invalid"), {
      message: /Invalid encrypted text format/,
    });
  });

  it("decrypt throws on tampered ciphertext", async () => {
    const mod = await import("@/server/utils/encryption");
    const encrypted = mod.encrypt("test");
    const parts = encrypted.split(":");
    parts[2] = "0000" + parts[2].slice(4);
    assert.throws(() => mod.decrypt(parts.join(":")));
  });

  it("hash produces consistent SHA-256 hex", async () => {
    const mod = await import("@/server/utils/encryption");
    const h1 = mod.hash("hello");
    const h2 = mod.hash("hello");
    assert.equal(h1, h2);
    assert.match(h1, /^[a-f0-9]{64}$/);
  });

  it("hash produces different output for different input", async () => {
    const mod = await import("@/server/utils/encryption");
    assert.notEqual(mod.hash("a"), mod.hash("b"));
  });
});
