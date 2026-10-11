/**
 * Regression tests for the CSP time-extension, Option 1 / Option 2 bundle,
 * and CSP baseline-requirement fixes.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { tryApplyTopUp } from "@/server/services/cspTopUp.service";
import { subscribeHealthcareCardPromoBundle } from "@/server/services/healthcareCard.service";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

function topUpDb(purchase: any, ownRequest: { id: string; broadcastExpiresAt: Date }) {
  const calls: { findFirstWhere?: any; requestUpdates: any[]; purchaseUpdates: any[] } = {
    requestUpdates: [],
    purchaseUpdates: [],
  };
  const db = {
    cspTopUpPurchase: {
      async findFirst({ where }: any) {
        calls.findFirstWhere = where;
        return purchase;
      },
      async findMany() { return []; },
      async update({ data }: any) { calls.purchaseUpdates.push(data); Object.assign(purchase, data); return purchase; },
    },
    cspSupportRequest: {
      async findUnique({ where }: any) { return where.id === ownRequest.id ? ownRequest : null; },
      async update(args: any) { calls.requestUpdates.push(args); return {}; },
    },
    adminSettings: { async findMany() { return []; } },
  } as any;
  return { db, calls };
}

describe("CSP time extension: covered by contributions to other campaigns", () => {
  it("only looks for the contributor's pending extension on a different, live request", async () => {
    const { db, calls } = topUpDb(null, { id: "own", broadcastExpiresAt: new Date() });
    await tryApplyTopUp(db, { requestId: "other", contributorId: "u1", contributionAmount: 5000 });
    assert.equal(calls.findFirstWhere.userId, "u1");
    assert.deepEqual(calls.findFirstWhere.NOT, { requestId: "other" });
    assert.deepEqual(calls.findFirstWhere.Request, { status: "broadcasting" });
  });

  it("extends the purchaser's own request, not the campaign they contributed to", async () => {
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const purchase = { id: "p1", requestId: "own", hours: 24, amountPaid: 10000, contributedAmount: 6000, status: "pending" };
    const { db, calls } = topUpDb(purchase, { id: "own", broadcastExpiresAt: expires });
    await tryApplyTopUp(db, { requestId: "other", contributorId: "u1", contributionAmount: 5000 });
    assert.equal(calls.requestUpdates.length, 1);
    assert.equal(calls.requestUpdates[0].where.id, "own");
    assert.equal(calls.requestUpdates[0].data.broadcastExpiresAt.getTime(), expires.getTime() + 24 * 60 * 60 * 1000);
    assert.equal(purchase.status, "applied");
    assert.equal(purchase.contributedAmount, 10000, "counted amount is capped at the fee");
  });

  it("accumulates a partial contribution without applying", async () => {
    const purchase = { id: "p1", requestId: "own", hours: 24, amountPaid: 10000, contributedAmount: 2000, status: "pending" };
    const { db, calls } = topUpDb(purchase, { id: "own", broadcastExpiresAt: new Date() });
    await tryApplyTopUp(db, { requestId: "other", contributorId: "u1", contributionAmount: 3000 });
    assert.equal(calls.requestUpdates.length, 0);
    assert.equal(purchase.contributedAmount, 5000);
    assert.equal(purchase.status, "pending");
  });

  it("moves the fee to the member's Community Wallet instead of losing it", () => {
    const src = read("server/services/cspTopUp.service.ts");
    assert.match(src, /wallet: \{ decrement: amountPaid \}, community: \{ increment: amountPaid \}/);
  });
});

describe("Option 2 promo bundle: no free membership without paying", () => {
  it("does not grant a membership when the card payment fails", async () => {
    let membershipActivationAttempted = false;
    const db = {
      adminSettings: {
        async findUnique() { return { settingValue: "true" }; },
        async findMany() { return []; },
      },
      membershipPackage: { async findFirst() { return { id: "regular" }; } },
      transaction: { async findFirst() { membershipActivationAttempted = true; return null; } },
      user: { async findUnique() { return { activeMembershipPackageId: null, membershipExpiresAt: null }; } },
      async $transaction(fn: any) {
        return fn({ user: { async updateMany() { return { count: 0 }; } } });
      },
    } as any;

    await assert.rejects(
      subscribeHealthcareCardPromoBundle(db, { userId: "u1" }),
      /Insufficient Main Wallet balance/,
    );
    assert.equal(membershipActivationAttempted, false);
  });
});

describe("Option 1 bundle", () => {
  const src = read("server/trpc/router/package.ts");
  const start = src.indexOf("purchaseCspActivationBundleViaWallet:");
  const body = src.slice(start, src.indexOf("initiateMembershipPayment:", start));

  it("refuses members who already have a current membership", () => {
    assert.match(body, /if \(isCspMembershipCurrent\(user\)\)/);
    assert.ok(body.indexOf("isCspMembershipCurrent(user)") < body.indexOf("prisma.$transaction"));
  });

  it("debits atomically and credits the ₦10,000 in the same transaction", () => {
    assert.match(body, /wallet: \{ gte: totalCost \}/);
    assert.match(body, /wallet: \{ decrement: totalCost \}, community: \{ increment: CSP_ACTIVATION_BUNDLE_COMMUNITY_CREDIT \}/);
  });

  it("refunds the membership portion if activation fails", () => {
    assert.match(body, /catch \(err\)[\s\S]*wallet: \{ increment: membershipPortion \}/);
  });
});

describe("CSP baseline requirements", () => {
  it("a migration switches stored KYC/Auto-Debit/Auto-Contribute settings on", () => {
    const sql = read("prisma/migrations/20261011090000_csp_baseline_requirements_on/migration.sql");
    assert.match(sql, /UPDATE "AdminSettings"\s+SET "settingValue" = 'true'/);
    for (const key of ["csp_require_kyc", "csp_require_auto_debit", "csp_require_auto_contribute"]) {
      assert.ok(sql.includes(`'${key}'`), key);
    }
  });

  it("the CSP dashboard checklist shows the KYC and Auto-Debit/Auto-Contribute requirements", () => {
    const src = read("components/csp/CspDashboard.tsx");
    assert.match(src, /eligibility\.hasKyc/);
    assert.match(src, /eligibility\.hasAutoDebit/);
    assert.match(src, /eligibility\.hasAutoContribute/);
  });
});
