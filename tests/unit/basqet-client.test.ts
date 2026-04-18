import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  initiateBasqetUsdtPayout,
  validateBasqetWebhookSignature,
  verifyBasqetUsdtPayout,
} from "@/server/services/payment/BasqetClient";

type FetchType = typeof globalThis.fetch;

describe("Basqet webhook signature validation", () => {
  const secret = "basqet-test-secret";
  const body = JSON.stringify({ event: "transaction.success" });

  it("accepts valid x-basqet-signature", () => {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const valid = validateBasqetWebhookSignature(body, { "x-basqet-signature": signature }, secret);
    assert.strictEqual(valid, true);
  });

  it("accepts valid x-quidax-signature", () => {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const valid = validateBasqetWebhookSignature(body, { "x-quidax-signature": signature }, secret);
    assert.strictEqual(valid, true);
  });

  it("rejects invalid signature", () => {
    const valid = validateBasqetWebhookSignature(body, { "x-basqet-signature": "invalid" }, secret);
    assert.strictEqual(valid, false);
  });

  it("fails closed when secret exists but no signature header", () => {
    const valid = validateBasqetWebhookSignature(body, {}, secret);
    assert.strictEqual(valid, false);
  });
});

describe("Basqet payout API response normalization", () => {
  const originalFetch: FetchType = globalThis.fetch;

  beforeEach(() => {
    // @ts-ignore test override
    globalThis.fetch = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("marks accepted statuses as accepted on initiate payout", async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        json: async () => ({
          data: {
            id: "payout-123",
            reference: "WD-USDT-123",
            status: "processing",
            tx_hash: null,
          },
        }),
      } as any;
    }) as FetchType;

    const result = await initiateBasqetUsdtPayout({
      secretKey: "sk_test",
      publicKey: "pk_test",
      reference: "WD-USDT-123",
      amount: 25,
      currency: "USDT",
      recipientAddress: "TQ6QzrV3o5Eo7r7NYqYwS1FX2fMcKJn1Kv",
      network: "TRC-20",
    });

    assert.strictEqual(result.accepted, true);
    assert.strictEqual(result.providerRef, "WD-USDT-123");
    assert.strictEqual(result.status, "processing");
  });

  it("marks failed status as not accepted on verify payout", async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        json: async () => ({
          data: {
            id: "payout-999",
            reference: "WD-USDT-999",
            status: "failed",
            tx_hash: null,
          },
        }),
      } as any;
    }) as FetchType;

    const result = await verifyBasqetUsdtPayout("sk_test", "pk_test", "WD-USDT-999");

    assert.strictEqual(result.accepted, false);
    assert.strictEqual(result.providerRef, "WD-USDT-999");
    assert.strictEqual(result.status, "failed");
  });
});
