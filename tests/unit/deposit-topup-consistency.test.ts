import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PAYMENT_FULFILLMENT_TYPES,
  resolvePaymentFulfillmentType,
} from "@/server/services/payment/paymentMetadata";

const walletRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/wallet.ts"),
  "utf8",
);
const packageRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/package.ts"),
  "utf8",
);
const adminPaymentReviewSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/services/payment/adminPaymentReview.ts"),
  "utf8",
);
const recoverStuckPaymentsSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/api/cron/recover-stuck-payments/route.ts"),
  "utf8",
);

describe("Deposit and TOPUP path consistency", () => {
  it("normalizes both DEPOSIT and TOPUP to the DEPOSIT fulfillment type", () => {
    assert.strictEqual(
      resolvePaymentFulfillmentType("DEPOSIT", undefined),
      PAYMENT_FULFILLMENT_TYPES.DEPOSIT,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType("TOPUP", undefined),
      PAYMENT_FULFILLMENT_TYPES.DEPOSIT,
    );
    assert.strictEqual(
      resolvePaymentFulfillmentType(undefined, "TOPUP"),
      PAYMENT_FULFILLMENT_TYPES.DEPOSIT,
    );
  });

  it("creates new wallet funding requests as DEPOSIT rather than TOPUP", () => {
    assert.match(walletRouterSource, /purpose: 'DEPOSIT'/);
    assert.match(walletRouterSource, /transactionType: "DEPOSIT"/);
    assert.doesNotMatch(walletRouterSource, /purpose:\s*'TOPUP'|transactionType:\s*"TOPUP"/);
  });

  it("uses a single admin approval branch for both TOPUP and DEPOSIT aliases", () => {
    assert.match(
      adminPaymentReviewSource,
      /else if \(purpose === "TOPUP" \|\| purpose === "DEPOSIT"\)/,
    );
    assert.doesNotMatch(
      adminPaymentReviewSource,
      /else if \(purpose === "TOPUP"\)(?! \|\| purpose === "DEPOSIT")/,
    );
  });

  it("verifies user-triggered payment completion through one DEPOSIT transaction lookup", () => {
    assert.match(
      packageRouterSource,
      /if \(transactionType === "DEPOSIT" \|\| transactionType === "TOPUP"\)/,
    );
    assert.match(
      packageRouterSource,
      /where: \{ reference: input\.reference, userId, status: "pending", transactionType: "DEPOSIT" \}/,
    );
  });

  it("recovers stuck wallet funding through one DEPOSIT transaction lookup", () => {
    assert.match(
      recoverStuckPaymentsSource,
      /payment\.transactionType === "DEPOSIT" \|\| payment\.transactionType === "TOPUP"/,
    );
    assert.match(
      recoverStuckPaymentsSource,
      /where: \{ reference: ref, userId, status: "pending", transactionType: "DEPOSIT" \}/,
    );
  });
});
