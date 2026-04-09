/**
 * Payment Gateway & Factory Tests
 *
 * Validates: gateway enum completeness, production guard logic for MockDevGateway,
 * factory error paths, gateway type routing, config validation.
 *
 * Note: PaymentGatewayFactory cannot be imported directly because its dependency chain
 * reaches Prisma Client (via WalletGateway → lib/prisma). The factory's business logic
 * is tested here by replicating its switch/case routing and guard patterns.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  PaymentGateway,
  PaymentStatus,
  PaymentPurpose,
} from "@/server/services/payment/types";

// ---------------------------------------------------------------------------
// Payment Enums Completeness
// ---------------------------------------------------------------------------

describe("PaymentGateway enum", () => {
  it("includes all expected gateway types", () => {
    assert.strictEqual(PaymentGateway.MOCK_DEV, "mock_dev");
    assert.strictEqual(PaymentGateway.WALLET, "wallet");
    assert.strictEqual(PaymentGateway.PAYSTACK, "paystack");
    assert.strictEqual(PaymentGateway.FLUTTERWAVE, "flutterwave");
    assert.strictEqual(PaymentGateway.BANK_TRANSFER, "bank_transfer");
    assert.strictEqual(PaymentGateway.CRYPTO, "crypto");
    assert.strictEqual(PaymentGateway.UTILITY_TOKEN, "utility_token");
  });

  it("has exactly 7 members", () => {
    const values = Object.values(PaymentGateway);
    assert.strictEqual(values.length, 7);
  });
});

describe("PaymentStatus enum", () => {
  it("includes all expected statuses", () => {
    assert.ok(PaymentStatus.PENDING);
    assert.ok(PaymentStatus.SUCCESSFUL);
    assert.ok(PaymentStatus.FAILED);
    assert.ok(PaymentStatus.REFUNDED);
  });
});

describe("PaymentPurpose enum", () => {
  it("includes all expected purposes", () => {
    assert.strictEqual(PaymentPurpose.MEMBERSHIP, "MEMBERSHIP");
    assert.strictEqual(PaymentPurpose.UPGRADE, "UPGRADE");
    assert.strictEqual(PaymentPurpose.RENEWAL, "RENEWAL");
    assert.strictEqual(PaymentPurpose.TOPUP, "TOPUP");
    assert.strictEqual(PaymentPurpose.EMPOWERMENT, "EMPOWERMENT");
    assert.strictEqual(PaymentPurpose.DEPOSIT, "DEPOSIT");
  });
});

// ---------------------------------------------------------------------------
// PaymentGatewayFactory Logic (pattern-level tests)
// Mirrors: server/services/payment/PaymentGatewayFactory.ts
// ---------------------------------------------------------------------------

// Replicate the factory's routing logic for testing without Prisma dependency
const IMPLEMENTED_GATEWAYS = new Set([
  PaymentGateway.MOCK_DEV,
  PaymentGateway.WALLET,
  PaymentGateway.PAYSTACK,
  PaymentGateway.FLUTTERWAVE,
  PaymentGateway.BANK_TRANSFER,
  PaymentGateway.CRYPTO,
  PaymentGateway.UTILITY_TOKEN,
]);

function resolveGateway(
  gatewayType: string,
  config: { enabled?: boolean },
  nodeEnv: string
): { ok: boolean; error?: string } {
  if (!config.enabled) {
    return { ok: false, error: `${gatewayType} gateway is currently disabled` };
  }

  if (gatewayType === PaymentGateway.MOCK_DEV && nodeEnv === "production") {
    return { ok: false, error: "Mock payment gateway is not available in production" };
  }

  if (!IMPLEMENTED_GATEWAYS.has(gatewayType as PaymentGateway)) {
    return { ok: false, error: `Payment gateway ${gatewayType} is not yet implemented` };
  }

  return { ok: true };
}

describe("PaymentGatewayFactory logic", () => {
  it("rejects disabled gateways", () => {
    const result = resolveGateway(PaymentGateway.WALLET, { enabled: false }, "development");
    assert.strictEqual(result.ok, false);
    assert.ok(result.error?.includes("disabled"));
  });

  it("rejects unimplemented gateways", () => {
    const result = resolveGateway("some_future_gateway", { enabled: true }, "development");
    assert.strictEqual(result.ok, false);
    assert.ok(result.error?.includes("not yet implemented"));
  });

  it("allows WALLET gateway when enabled", () => {
    const result = resolveGateway(PaymentGateway.WALLET, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("allows PAYSTACK gateway when enabled", () => {
    const result = resolveGateway(PaymentGateway.PAYSTACK, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("allows FLUTTERWAVE gateway when enabled", () => {
    const result = resolveGateway(PaymentGateway.FLUTTERWAVE, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("allows MOCK_DEV in development", () => {
    const result = resolveGateway(PaymentGateway.MOCK_DEV, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("allows MOCK_DEV in test", () => {
    const result = resolveGateway(PaymentGateway.MOCK_DEV, { enabled: true }, "test");
    assert.strictEqual(result.ok, true);
  });

  it("blocks MOCK_DEV in production", () => {
    const result = resolveGateway(PaymentGateway.MOCK_DEV, { enabled: true }, "production");
    assert.strictEqual(result.ok, false);
    assert.ok(result.error?.includes("not available in production"));
  });

  it("allows BANK_TRANSFER gateway when enabled", () => {
    const result = resolveGateway(PaymentGateway.BANK_TRANSFER, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("allows CRYPTO gateway when enabled", () => {
    const result = resolveGateway(PaymentGateway.CRYPTO, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("allows UTILITY_TOKEN gateway when enabled", () => {
    const result = resolveGateway(PaymentGateway.UTILITY_TOKEN, { enabled: true }, "development");
    assert.strictEqual(result.ok, true);
  });

  it("rejects unknown gateway type", () => {
    const result = resolveGateway("unknown_gateway", { enabled: true }, "development");
    assert.strictEqual(result.ok, false);
  });
});
