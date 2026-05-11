import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  PAYMENT_FULFILLMENT_TYPES,
  resolvePaymentFulfillmentType,
} from "@/server/services/payment/paymentMetadata";

const packageRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/package.ts"),
  "utf8",
);
const walletRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/wallet.ts"),
  "utf8",
);
const storeRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/store.ts"),
  "utf8",
);
const paystackWebhookSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/api/webhooks/paystack/route.ts"),
  "utf8",
);
const flutterwaveWebhookSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/api/webhooks/flutterwave/route.ts"),
  "utf8",
);

describe("Payment lifecycle metadata contracts", () => {
  it("normalizes canonical and legacy payment purposes to the expected fulfillment types", () => {
    assert.strictEqual(
      resolvePaymentFulfillmentType("MEMBERSHIP", undefined),
      PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("MEMBERSHIP_PAYMENT", undefined),
      PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("UPGRADE", undefined),
      PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP_UPGRADE,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("MEMBERSHIP_UPGRADE", undefined),
      PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP_UPGRADE,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("DEPOSIT", undefined),
      PAYMENT_FULFILLMENT_TYPES.DEPOSIT,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("TOPUP", undefined),
      PAYMENT_FULFILLMENT_TYPES.DEPOSIT,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("STORE_PURCHASE", undefined),
      PAYMENT_FULFILLMENT_TYPES.STORE_PURCHASE,
    );
  });

  it("writes canonical metadata for membership initiation and the webhooks resolve that contract", () => {
    assert.match(packageRouterSource, /purpose: PaymentPurpose\.MEMBERSHIP/);
    assert.match(
      packageRouterSource,
      /fulfillmentType: PAYMENT_FULFILLMENT_TYPES\.MEMBERSHIP/,
    );

    assert.match(
      paystackWebhookSource,
      /const fulfillmentType = resolvePaymentFulfillmentType\(metadata\?\.fulfillmentType \?\? purpose\);/,
    );
    assert.match(
      paystackWebhookSource,
      /if \(fulfillmentType === 'MEMBERSHIP' && packageId && userId\)/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /const fulfillmentType = resolvePaymentFulfillmentType\(payload\.data\.meta\?\.fulfillmentType \?\? purpose\);/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /if \(fulfillmentType === "MEMBERSHIP" && packageId && userId\)/,
    );
  });

  it("writes canonical metadata for membership upgrades and the webhooks resolve that contract", () => {
    assert.match(packageRouterSource, /purpose: PaymentPurpose\.UPGRADE/);
    assert.match(
      packageRouterSource,
      /fulfillmentType: PAYMENT_FULFILLMENT_TYPES\.MEMBERSHIP_UPGRADE/,
    );
    assert.match(
      packageRouterSource,
      /transactionType: "MEMBERSHIP_UPGRADE"/,
    );

    assert.match(
      paystackWebhookSource,
      /else if \(fulfillmentType === 'MEMBERSHIP_UPGRADE' && packageId && currentPackageId && userId\)/,
    );
    assert.match(
      paystackWebhookSource,
      /else if \(recoveredPurpose === 'MEMBERSHIP_UPGRADE' && recoveredPackageId && recoveredCurrentPackageId && recoveredUserId\)/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /else if \(fulfillmentType === "MEMBERSHIP_UPGRADE" && packageId && currentPackageId && userId\)/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /else if \(recoveredPurpose === "MEMBERSHIP_UPGRADE" && recoveredPackageId && recoveredCurrentPackageId && recoveredUserId\)/,
    );
  });

  it("writes canonical metadata for deposits and the webhooks resolve that contract", () => {
    assert.match(walletRouterSource, /purpose: 'DEPOSIT'/);
    assert.match(
      walletRouterSource,
      /fulfillmentType: PAYMENT_FULFILLMENT_TYPES\.DEPOSIT/,
    );
    assert.match(walletRouterSource, /transactionType: "DEPOSIT"/);

    assert.match(
      paystackWebhookSource,
      /else if \(fulfillmentType === 'DEPOSIT' \|\| purpose === 'WALLET_DEPOSIT'\)/,
    );
    assert.match(
      paystackWebhookSource,
      /else if \(recoveredPurpose === 'DEPOSIT' && recoveredUserId\)/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /else if \(fulfillmentType === "DEPOSIT" \|\| purpose === "WALLET_DEPOSIT"\)/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /else if \(recoveredPurpose === "DEPOSIT" && recoveredUserId\)/,
    );
  });

  it("writes canonical metadata for store purchases and the webhooks recover that contract from PendingPayment metadata", () => {
    assert.match(
      storeRouterSource,
      /transactionType: "STORE_PURCHASE"/,
    );
    assert.match(
      storeRouterSource,
      /fulfillmentType: PAYMENT_FULFILLMENT_TYPES\.STORE_PURCHASE/,
    );
    assert.match(
      storeRouterSource,
      /purpose: PAYMENT_FULFILLMENT_TYPES\.STORE_PURCHASE/,
    );

    assert.match(
      paystackWebhookSource,
      /const recoveredPurpose = resolvePaymentFulfillmentType\(recoveredMeta\.fulfillmentType, fallbackPending\.transactionType\);/,
    );
    assert.match(
      paystackWebhookSource,
      /else if \(recoveredPurpose === 'STORE_PURCHASE' && recoveredUserId && recoveredMeta\.orderId\)/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /const recoveredPurpose = resolvePaymentFulfillmentType\(recoveredMeta\.fulfillmentType, fallbackPending\.transactionType\);/,
    );
    assert.match(
      flutterwaveWebhookSource,
      /else if \(recoveredPurpose === "STORE_PURCHASE" && recoveredUserId && recoveredMeta\.orderId\)/,
    );
  });
});