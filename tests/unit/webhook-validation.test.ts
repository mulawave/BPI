/**
 * Webhook Signature & Payment Amount Validation Tests
 *
 * Tests the cryptographic signature verification for Paystack and Flutterwave webhooks,
 * amount mismatch detection, and the fail-closed behavior when secrets are missing.
 * These validate the same algorithms used in the webhook route handlers.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Paystack Signature Verification (HMAC-SHA512)
// Mirrors: app/api/webhooks/paystack/route.ts
// ---------------------------------------------------------------------------

function verifyPaystackSignature(
  body: string,
  signature: string | null,
  secret: string | undefined
): { valid: boolean; reason?: string } {
  if (!secret) return { valid: false, reason: "secret_not_configured" };
  if (!signature) return { valid: false, reason: "missing_signature" };
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature
    ? { valid: true }
    : { valid: false, reason: "signature_mismatch" };
}

describe("Paystack webhook signature verification", () => {
  const secret = "sk_test_abc123secret";

  it("accepts valid signature", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "REF-001" } });
    const validSig = crypto.createHmac("sha512", secret).update(body).digest("hex");
    const result = verifyPaystackSignature(body, validSig, secret);
    assert.strictEqual(result.valid, true);
  });

  it("rejects tampered body", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "REF-001" } });
    const validSig = crypto.createHmac("sha512", secret).update(body).digest("hex");
    const tampered = body.replace("REF-001", "REF-999");
    const result = verifyPaystackSignature(tampered, validSig, secret);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "signature_mismatch");
  });

  it("rejects wrong secret", () => {
    const body = JSON.stringify({ event: "charge.success" });
    const sigWithWrongKey = crypto.createHmac("sha512", "wrong-secret").update(body).digest("hex");
    const result = verifyPaystackSignature(body, sigWithWrongKey, secret);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "signature_mismatch");
  });

  it("fails closed when secret is not configured", () => {
    const body = JSON.stringify({ event: "charge.success" });
    const result = verifyPaystackSignature(body, "any-sig", undefined);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "secret_not_configured");
  });

  it("rejects missing signature header", () => {
    const body = JSON.stringify({ event: "charge.success" });
    const result = verifyPaystackSignature(body, null, secret);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "missing_signature");
  });
});

// ---------------------------------------------------------------------------
// Flutterwave Signature Verification (verif-hash comparison)
// Mirrors: server/services/payment/FlutterwaveGateway.ts validateWebhook
// ---------------------------------------------------------------------------

function verifyFlutterwaveSignature(
  signature: string | undefined,
  webhookSecret: string | undefined
): { valid: boolean; reason?: string } {
  if (!webhookSecret) return { valid: false, reason: "secret_not_configured" };
  if (!signature) return { valid: false, reason: "missing_signature" };
  return signature === webhookSecret
    ? { valid: true }
    : { valid: false, reason: "signature_mismatch" };
}

describe("Flutterwave webhook signature verification", () => {
  const secret = "FLWSECK_TEST-hash123";

  it("accepts valid verif-hash", () => {
    const result = verifyFlutterwaveSignature(secret, secret);
    assert.strictEqual(result.valid, true);
  });

  it("rejects wrong verif-hash", () => {
    const result = verifyFlutterwaveSignature("wrong-hash", secret);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "signature_mismatch");
  });

  it("fails closed when webhook secret is not configured", () => {
    const result = verifyFlutterwaveSignature("any-hash", undefined);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "secret_not_configured");
  });

  it("rejects missing signature header", () => {
    const result = verifyFlutterwaveSignature(undefined, secret);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, "missing_signature");
  });
});

// ---------------------------------------------------------------------------
// Payment Amount Validation
// Mirrors: verifyPaymentAmount() in both webhook handlers
// ---------------------------------------------------------------------------

function verifyPaymentAmount(
  receivedAmountNgn: number,
  storedAmount: number | null | undefined
): { match: boolean; reason?: string } {
  // No stored amount to compare → pass (graceful)
  if (!storedAmount || storedAmount <= 0) return { match: true };
  // ₦1 tolerance for rounding
  if (Math.abs(receivedAmountNgn - storedAmount) <= 1) return { match: true };
  return {
    match: false,
    reason: `Amount mismatch: received ₦${receivedAmountNgn}, expected ₦${storedAmount}`,
  };
}

describe("Payment amount verification", () => {
  it("passes when amounts match exactly", () => {
    assert.strictEqual(verifyPaymentAmount(15000, 15000).match, true);
  });

  it("passes within ₦1 rounding tolerance", () => {
    assert.strictEqual(verifyPaymentAmount(14999.50, 15000).match, true);
    assert.strictEqual(verifyPaymentAmount(15000.99, 15000).match, true);
  });

  it("fails when amounts differ by more than ₦1", () => {
    const result = verifyPaymentAmount(20000, 15000);
    assert.strictEqual(result.match, false);
    assert.ok(result.reason?.includes("mismatch"));
  });

  it("passes when stored amount is null (no record to compare)", () => {
    assert.strictEqual(verifyPaymentAmount(15000, null).match, true);
  });

  it("passes when stored amount is zero", () => {
    assert.strictEqual(verifyPaymentAmount(15000, 0).match, true);
  });

  it("passes when stored amount is undefined", () => {
    assert.strictEqual(verifyPaymentAmount(15000, undefined).match, true);
  });

  it("detects underpayment", () => {
    const result = verifyPaymentAmount(5000, 15000);
    assert.strictEqual(result.match, false);
  });

  it("detects overpayment", () => {
    const result = verifyPaymentAmount(30000, 15000);
    assert.strictEqual(result.match, false);
  });
});

// ---------------------------------------------------------------------------
// Pending Payment State Machine
// Mirrors: claimPendingPayment() in both webhook handlers
// ---------------------------------------------------------------------------

type PendingPaymentStatus = "pending" | "processing" | "approved" | "completed";

/** Determine if a payment can be claimed from a given status. */
function canClaimPayment(currentStatus: PendingPaymentStatus): boolean {
  return currentStatus === "pending";
}

/** Determine if a payment has already been fully processed. */
function isAlreadyProcessed(currentStatus: PendingPaymentStatus): boolean {
  return currentStatus === "approved" || currentStatus === "completed";
}

/** Determine if a payment is currently being processed by another handler. */
function isInProgress(currentStatus: PendingPaymentStatus): boolean {
  return currentStatus === "processing";
}

describe("Pending payment state machine", () => {
  it("allows claiming from pending status", () => {
    assert.strictEqual(canClaimPayment("pending"), true);
  });

  it("does not allow claiming from processing status", () => {
    assert.strictEqual(canClaimPayment("processing"), false);
  });

  it("does not allow claiming from approved status", () => {
    assert.strictEqual(canClaimPayment("approved"), false);
  });

  it("does not allow claiming from completed status", () => {
    assert.strictEqual(canClaimPayment("completed"), false);
  });

  it("recognizes approved as already processed", () => {
    assert.strictEqual(isAlreadyProcessed("approved"), true);
  });

  it("recognizes completed as already processed", () => {
    assert.strictEqual(isAlreadyProcessed("completed"), true);
  });

  it("does not consider pending as already processed", () => {
    assert.strictEqual(isAlreadyProcessed("pending"), false);
  });

  it("recognizes processing as in-progress", () => {
    assert.strictEqual(isInProgress("processing"), true);
  });

  it("does not consider pending as in-progress", () => {
    assert.strictEqual(isInProgress("pending"), false);
  });

  describe("idempotency: duplicate webhook handling", () => {
    it("second claim on approved payment returns already_processed", () => {
      // Simulate: first claim succeeds (pending → processing), approval happens,
      // then second webhook arrives
      assert.strictEqual(isAlreadyProcessed("approved"), true);
      assert.strictEqual(canClaimPayment("approved"), false);
    });

    it("concurrent claim on processing payment returns in_progress", () => {
      assert.strictEqual(isInProgress("processing"), true);
      assert.strictEqual(canClaimPayment("processing"), false);
    });
  });
});
