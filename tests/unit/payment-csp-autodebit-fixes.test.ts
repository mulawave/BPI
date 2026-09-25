/**
 * Regression tests for the Paystack auto-fulfilment, CSP release/ledger,
 * wallet auto-debit and paid-renewal fixes.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PaymentStatus } from "@/server/services/payment/types";
import {
  classifyGatewayVerification,
  recoveryActionForUnpaid,
  UNPAID_EXPIRY_MS,
} from "@/server/services/payment/gatewayOutcome";
import { fulfillDepositPayment, isGatewayAmountAcceptable } from "@/server/services/payment/depositFulfillment";
import {
  computeAutoExtendHours,
  computeCspReleaseShares,
  sumShares,
  type CspFeePercentages,
} from "@/server/services/csp-ledger.service";
import { computeAutoDebitAmount } from "@/server/services/walletAutoDebit.service";
import { processAutoRenewal } from "@/server/services/membershipAutoRenewal.service";

const DEFAULT_PCT: CspFeePercentages = {
  recipient: 0.8,
  admin: 0.05,
  sponsor: 0.02,
  state: 0.02,
  management: 0.04,
  reserve: 0.07,
};

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("Gateway outcome classification", () => {
  it("treats an unpaid Paystack checkout as pending, not failed", () => {
    for (const raw of ["abandoned", "ongoing", "pending", "processing", "queued", ""]) {
      assert.equal(
        classifyGatewayVerification({ success: false, status: PaymentStatus.FAILED, metadata: { status: raw } }),
        "pending",
        `raw status "${raw}" must not be treated as a failure`,
      );
    }
  });

  it("treats definitive gateway failures as failed", () => {
    for (const raw of ["failed", "reversed", "cancelled"]) {
      assert.equal(
        classifyGatewayVerification({ success: false, status: PaymentStatus.FAILED, metadata: { status: raw } }),
        "failed",
      );
    }
    assert.equal(
      classifyGatewayVerification({
        success: false,
        status: PaymentStatus.FAILED,
        metadata: { flutterwaveData: { status: "failed" } },
      }),
      "failed",
    );
  });

  it("never fails a payment because verification itself errored", () => {
    assert.equal(
      classifyGatewayVerification({ success: false, status: PaymentStatus.FAILED, error: "ETIMEDOUT", metadata: { status: "failed" } }),
      "pending",
    );
  });

  it("recognises success", () => {
    assert.equal(classifyGatewayVerification({ success: true, status: PaymentStatus.SUCCESS }), "success");
    assert.equal(classifyGatewayVerification({ success: true }), "success");
  });

  it("only expires unpaid payments after the expiry window", () => {
    assert.equal(recoveryActionForUnpaid("pending", 3 * 60 * 1000), "wait");
    assert.equal(recoveryActionForUnpaid("pending", UNPAID_EXPIRY_MS), "expire");
    assert.equal(recoveryActionForUnpaid("failed", 60 * 1000), "reject");
  });

  it("checks the paid amount covers the expected total", () => {
    assert.equal(isGatewayAmountAcceptable(10750, 10750), true);
    assert.equal(isGatewayAmountAcceptable(10749.5, 10750), true);
    assert.equal(isGatewayAmountAcceptable(5000, 10750), false);
    assert.equal(isGatewayAmountAcceptable(undefined, 10750), false);
    assert.equal(isGatewayAmountAcceptable(0, 0), true);
  });
});

describe("Deposit fulfilment is idempotent", () => {
  function createFakePrisma() {
    const state = {
      wallet: 0,
      transactions: [
        { id: "tx-1", userId: "u1", reference: "DEP-1", transactionType: "DEPOSIT", status: "pending", amount: 10000, createdAt: new Date() },
      ] as any[],
      pending: { id: "pp-1", status: "processing", metadata: { vatAmount: 750 } } as any,
      created: [] as any[],
    };
    const matchStatus = (status: string, cond: any) =>
      typeof cond === "string" ? status === cond : Array.isArray(cond?.in) ? cond.in.includes(status) : true;
    const client: any = {
      transaction: {
        async findFirst({ where }: any) {
          return (
            state.transactions.find(
              (t) =>
                t.reference === where.reference &&
                t.userId === where.userId &&
                t.transactionType === where.transactionType &&
                matchStatus(t.status, where.status),
            ) ?? null
          );
        },
        async updateMany({ where, data }: any) {
          const rows = state.transactions.filter((t) => t.id === where.id && matchStatus(t.status, where.status));
          rows.forEach((t) => Object.assign(t, data));
          return { count: rows.length };
        },
        async create({ data }: any) {
          state.created.push(data);
          return data;
        },
      },
      user: {
        async update({ data }: any) {
          state.wallet += data.wallet.increment;
          return {};
        },
      },
      pendingPayment: {
        async findUnique() {
          return state.pending;
        },
        async updateMany({ data }: any) {
          if (["approved", "completed"].includes(state.pending.status)) return { count: 0 };
          Object.assign(state.pending, data);
          return { count: 1 };
        },
      },
      walletAutoDebitSetting: { async findUnique() { return null; } },
      async $transaction(fn: any) {
        return fn(client);
      },
    };
    return { client, state };
  }

  it("credits the wallet exactly once across webhook / verify / cron retries", async () => {
    const { client, state } = createFakePrisma();
    const input = { pendingPaymentId: "pp-1", userId: "u1", reference: "DEP-1", note: "test" };

    const first = await fulfillDepositPayment(client, input);
    const second = await fulfillDepositPayment(client, input);

    assert.equal(first.status, "credited");
    assert.equal(second.status, "already_processed");
    assert.equal(state.wallet, 10000);
    assert.equal(state.pending.status, "approved");
    assert.equal(state.created.filter((t) => t.transactionType === "VAT").length, 1);
  });

  it("credits a deposit that an earlier check had marked failed", async () => {
    const { client, state } = createFakePrisma();
    state.transactions[0].status = "failed";
    const result = await fulfillDepositPayment(client, { pendingPaymentId: "pp-1", userId: "u1", reference: "DEP-1", note: "late success" });
    assert.equal(result.status, "credited");
    assert.equal(state.wallet, 10000);
  });
});

describe("CSP release split", () => {
  it("fully funded: beneficiary receives exactly the requested amount and shares balance", () => {
    const { shares, fullyFunded } = computeCspReleaseShares({
      total: 12000,
      raisedAmount: 12000,
      thresholdAmount: 12000,
      requestedAmount: 10000,
      pct: DEFAULT_PCT,
      hasSponsor: true,
    });
    assert.equal(fullyFunded, true);
    assert.equal(shares.recipient, 10000);
    assert.equal(sumShares(shares), 12000);
  });

  it("partially funded: configured percentages apply and shares balance", () => {
    const { shares, fullyFunded } = computeCspReleaseShares({
      total: 7777,
      raisedAmount: 7777,
      thresholdAmount: 12000,
      requestedAmount: 10000,
      pct: DEFAULT_PCT,
      hasSponsor: true,
    });
    assert.equal(fullyFunded, false);
    assert.equal(shares.sponsor, Math.floor(7777 * 0.02));
    assert.equal(sumShares(shares), 7777);
  });

  it("no sponsor: sponsor share goes to the reserve instead of disappearing", () => {
    const withSponsor = computeCspReleaseShares({
      total: 50000, raisedAmount: 50000, thresholdAmount: 60000, requestedAmount: 50000, pct: DEFAULT_PCT, hasSponsor: true,
    });
    const without = computeCspReleaseShares({
      total: 50000, raisedAmount: 50000, thresholdAmount: 60000, requestedAmount: 50000, pct: DEFAULT_PCT, hasSponsor: false,
    });
    assert.equal(without.shares.sponsor, 0);
    assert.equal(without.sponsorRedirectedToReserve, withSponsor.shares.sponsor);
    assert.equal(without.shares.reserve, withSponsor.shares.reserve + withSponsor.shares.sponsor);
    assert.equal(sumShares(without.shares), 50000);
  });

  it("over-funded requests still balance", () => {
    const { shares } = computeCspReleaseShares({
      total: 13500, raisedAmount: 13500, thresholdAmount: 12000, requestedAmount: 10000, pct: DEFAULT_PCT, hasSponsor: true,
    });
    assert.equal(shares.recipient, 10000);
    assert.equal(sumShares(shares), 13500);
  });

  it("paid auto-extension only fires when a milestone is crossed", () => {
    assert.equal(computeAutoExtendHours(39000, 40500), 24);
    assert.equal(computeAutoExtendHours(40500, 41000), 0);
    assert.equal(computeAutoExtendHours(95000, 101000), 168);
  });
});

describe("CSP contributions all use the shared ledger", () => {
  it("manual, auto and admin-verified crypto contributions fund the holding wallet via applyCspContribution", () => {
    assert.match(read("server/trpc/router/csp.ts"), /applyCspContribution\(tx, \{/);
    assert.match(read("server/services/cspAutoContribute.service.ts"), /applyCspContribution\(tx, \{/);
    assert.match(read("server/services/payment/adminPaymentReview.ts"), /applyCspContribution\(tx, \{/);
    assert.doesNotMatch(read("server/services/cspAutoContribute.service.ts"), /raisedAmount: \{ increment/);
  });

  it("release and admin-default completion share executeCspRelease", () => {
    const src = read("server/trpc/router/csp.ts");
    assert.equal((src.match(/executeCspRelease\(prisma, \{/g) ?? []).length, 2);
  });
});

describe("Wallet auto-debit", () => {
  const setting = { isEnabled: true, percentage: 10, applyToDeposits: true, applyToRewards: false };

  it("computes the configured percentage for enabled triggers only", () => {
    assert.equal(computeAutoDebitAmount(setting, 10000, "deposit"), 1000);
    assert.equal(computeAutoDebitAmount(setting, 10000, "reward"), 0);
    assert.equal(computeAutoDebitAmount({ ...setting, isEnabled: false }, 10000, "deposit"), 0);
    assert.equal(computeAutoDebitAmount(null, 10000, "deposit"), 0);
  });

  it("runs on every deposit fulfilment path", () => {
    assert.match(read("server/services/payment/depositFulfillment.ts"), /runPostCreditAutomation\(/);
    assert.match(read("server/services/payment/adminPaymentReview.ts"), /runPostCreditAutomation\(/);
    assert.match(read("app/api/webhooks/paystack/route.ts"), /fulfillDepositPayment\(prisma/);
    assert.match(read("app/api/webhooks/flutterwave/route.ts"), /fulfillDepositPayment\(prisma/);
  });
});

describe("Scheduling", () => {
  it("the PM2 cron worker schedules payment recovery and membership auto-renewal", () => {
    const src = read("server/cron-server.ts");
    assert.match(src, /runRecoverStuckPayments\(\)/);
    assert.match(src, /membershipAutoRenewalCronHandler\(\)/);
  });

  it("the auto-renewal cron route has no user-agent auth bypass", () => {
    const src = read("app/api/cron/membership-auto-renewal/route.ts");
    assert.doesNotMatch(src, /vercel-cron/);
    assert.match(src, /verifyCronAuth\(request\)/);
  });
});

describe("Paid membership renewal", () => {
  it("refuses to renew (and pays no rewards) when the member cannot pay", async () => {
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    let writes = 0;
    const fake: any = {
      user: {
        async findUnique() {
          return {
            id: "u1",
            wallet: 100,
            renewalCount: 0,
            activeMembershipPackageId: "pkg",
            membershipActivatedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000),
            membershipExpiresAt: expiresAt,
          };
        },
        async update() { writes++; },
        async updateMany() { writes++; return { count: 0 }; },
      },
      membershipPackage: {
        async findUnique() {
          return { id: "pkg", name: "Regular Plus", price: 50000, renewalFee: 20000, renewalCycle: 365 };
        },
        async findFirst() { return null; },
      },
      transaction: { async create() { writes++; } },
      renewalHistory: { async create() { writes++; } },
    };

    const result = await processAutoRenewal(fake, "u1");
    assert.equal(result.success, false);
    assert.equal(result.insufficientFunds, true);
    assert.equal(writes, 0);
  });
});
