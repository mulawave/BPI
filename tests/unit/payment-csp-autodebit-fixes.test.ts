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
  closeExpiredCspRequest,
  CSP_RELEASABLE_STATUSES,
  computeAutoExtendHours,
  computeCspReleaseShares,
  sumShares,
  type CspFeePercentages,
} from "@/server/services/csp-ledger.service";
import { computeAutoDebitAmount, effectiveAutoDebitPercentage, DEFAULT_AUTO_DEBIT_POLICY } from "@/server/services/walletAutoDebit.service";
import { assessPaidAmount, paystackPaidNgn } from "@/server/services/payment/paymentPolicy";
import { dueReminderStage } from "@/server/jobs/membershipRenewalReminders";
import { isCspMembershipCurrent } from "@/server/services/csp-ledger.service";
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

  it("admin-created campaigns always pay 80/20 of what was raised", () => {
    const { shares, fullyFunded } = computeCspReleaseShares({
      total: 50000, raisedAmount: 50000, thresholdAmount: 50000, requestedAmount: 50000, pct: DEFAULT_PCT, hasSponsor: true, flatSplit: true,
    });
    assert.equal(fullyFunded, false);
    assert.equal(shares.recipient, 40000);
    assert.equal(shares.admin, 2500);
    assert.equal(sumShares(shares), 50000);
  });

  it("Profit Pool share is revenue only; other system shares go to CSP wallets only", () => {
    const ledger = read("server/services/csp-ledger.service.ts");
    assert.ok(!ledger.includes('"CSP Admin Wallet"'));
    assert.ok(/recordRevenue\(tx, \{[\s\S]*?amount: shares\.admin,/.test(ledger));
    assert.ok(!read("server/trpc/router/csp.ts").includes("recordRevenue("));
  });

  it("paid auto-extension only fires when a milestone is crossed", () => {
    assert.equal(computeAutoExtendHours(39000, 40500), 24);
    assert.equal(computeAutoExtendHours(40500, 41000), 0);
    assert.equal(computeAutoExtendHours(95000, 101000), 168);
  });
});

describe("Expired CSP campaigns never strand funds", () => {
  function fakeDb(request: { status: string; raisedAmount: number }) {
    return {
      cspSupportRequest: {
        async findUnique() { return { raisedAmount: request.raisedAmount }; },
        async updateMany({ where, data }: any) {
          if (request.status !== where.status) return { count: 0 };
          request.status = data.status;
          return { count: 1 };
        },
      },
    } as any;
  }

  it("moves a campaign with contributions to awaiting release", async () => {
    const request = { status: "broadcasting", raisedAmount: 7500 };
    assert.equal(await closeExpiredCspRequest(fakeDb(request), "r1"), "ready_for_release");
    assert.equal(request.status, "ready_for_release");
  });

  it("closes a campaign that raised nothing", async () => {
    const request = { status: "broadcasting", raisedAmount: 0 };
    assert.equal(await closeExpiredCspRequest(fakeDb(request), "r1"), "closed");
  });

  it("leaves campaigns that are no longer broadcasting alone", async () => {
    const request = { status: "released", raisedAmount: 7500 };
    assert.equal(await closeExpiredCspRequest(fakeDb(request), "r1"), null);
    assert.equal(request.status, "released");
  });

  it("closed campaigns that were never paid out can be released, but never twice", () => {
    assert.ok(CSP_RELEASABLE_STATUSES.includes("closed"));
    const ledger = read("server/services/csp-ledger.service.ts");
    assert.match(ledger, /if \(plan\.alreadyReleased\) throw/);
  });

  it("the sweep and the broadcast list no longer strand funded campaigns", () => {
    assert.match(read("server/jobs/cspBroadcastSweep.ts"), /closeExpiredCspRequest\(tx, current\.id\)/);
    assert.doesNotMatch(read("server/jobs/cspBroadcastSweep.ts"), /coolingEndsAt/);
    assert.match(read("server/trpc/router/csp.ts"), /raisedAmount: \{ gt: 0 \} \},\s*data: \{ status: "ready_for_release" \}/);
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

  it("is compulsory on rewards at the admin minimum, even without a saved setting", () => {
    assert.equal(computeAutoDebitAmount(null, 10000, "reward"), 1000);
    assert.equal(computeAutoDebitAmount({ ...setting, isEnabled: false, applyToRewards: false }, 10000, "reward"), 1000);
    assert.equal(computeAutoDebitAmount({ ...setting, percentage: 5 }, 10000, "reward"), 1000);
    assert.equal(computeAutoDebitAmount({ ...setting, percentage: 25 }, 10000, "reward"), 2500);
    assert.equal(effectiveAutoDebitPercentage({ ...setting, percentage: 3 }), 10);
  });

  it("applies to deposits only when the member opted in and admins allow it", () => {
    assert.equal(computeAutoDebitAmount(setting, 10000, "deposit"), 1000);
    assert.equal(computeAutoDebitAmount({ ...setting, applyToDeposits: false }, 10000, "deposit"), 0);
    assert.equal(computeAutoDebitAmount({ ...setting, isEnabled: false }, 10000, "deposit"), 0);
    assert.equal(computeAutoDebitAmount(null, 10000, "deposit"), 0);
    assert.equal(computeAutoDebitAmount(setting, 10000, "deposit", { ...DEFAULT_AUTO_DEBIT_POLICY, depositsEnabled: false }), 0);
  });

  it("applies to released CSP funds unless switched off by admin", () => {
    assert.equal(computeAutoDebitAmount(null, 50000, "csp_payout"), 5000);
    assert.equal(computeAutoDebitAmount(null, 50000, "csp_payout", { ...DEFAULT_AUTO_DEBIT_POLICY, cspPayoutEnabled: false }), 0);
  });

  it("a 0% admin minimum makes Auto-Debit optional again", () => {
    const optional = { ...DEFAULT_AUTO_DEBIT_POLICY, minPercentage: 0 };
    assert.equal(computeAutoDebitAmount(null, 10000, "reward", optional), 0);
    assert.equal(computeAutoDebitAmount({ ...setting, isEnabled: false }, 10000, "reward", optional), 0);
    assert.equal(computeAutoDebitAmount(setting, 10000, "reward", optional), 1000);
  });

  it("covers activation, upgrade, crypto deposit and CSP release credits", () => {
    assert.ok((read("server/trpc/router/package.ts").match(/runPostCreditAutomation\(\{/g) ?? []).length >= 3);
    assert.match(read("server/services/membershipPayments.service.ts"), /upgrade referral bonus/);
    assert.match(read("app/api/webhooks/crypto/route.ts"), /trigger: "deposit"/);
    assert.match(read("server/services/csp-release-effects.service.ts"), /trigger: "csp_payout"/);
  });

  it("the save procedure enforces the compulsory minimum", () => {
    const src = read("server/trpc/router/wallet.ts");
    assert.match(src, /Auto-Debit cannot be lower than/);
    assert.match(src, /isEnabled: compulsory \? true : input\.isEnabled/);
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

describe("Payment amounts", () => {
  it("classifies exact, over- and under-payments with a ₦1 tolerance", () => {
    assert.equal(assessPaidAmount(10000.5, 10000).kind, "exact");
    assert.deepEqual(assessPaidAmount(10500, 10000), { kind: "over", excess: 500, shortfall: 0 });
    assert.deepEqual(assessPaidAmount(9000, 10000), { kind: "under", excess: 0, shortfall: 1000 });
    assert.equal(assessPaidAmount(null, 10000).kind, "unknown");
  });

  it("Paystack fees passed to the customer are not an overpayment", () => {
    assert.equal(paystackPaidNgn({ amount: 1015000, requested_amount: 1000000 }), 10000);
    assert.equal(paystackPaidNgn({ amount: 1050000 }), 10500);
  });

  it("webhooks credit overpayments and hold underpayments", () => {
    for (const file of ["app/api/webhooks/paystack/route.ts", "app/api/webhooks/flutterwave/route.ts"]) {
      const src = read(file);
      assert.match(src, /settleOverpayment\(prisma/);
      assert.match(src, /markPaymentNeedsReview\(/);
    }
    assert.match(read("app/api/webhooks/paystack/route.ts"), /verifyPaymentAmount\(claim\.paymentId, paidNgn,/);
  });
});

describe("Membership renewal reminders and expired members", () => {
  const day = 24 * 60 * 60 * 1000;
  it("sends reminders 7 days, 3 days and 24 hours before renewal", () => {
    const now = new Date("2026-10-08T06:00:00Z");
    assert.equal(dueReminderStage(new Date(now.getTime() + 7 * day - 3600_000), now), 7);
    assert.equal(dueReminderStage(new Date(now.getTime() + 3 * day - 3600_000), now), 3);
    assert.equal(dueReminderStage(new Date(now.getTime() + 20 * 3600_000), now), 1);
    assert.equal(dueReminderStage(new Date(now.getTime() + 5 * day - 3600_000), now), null);
  });

  it("an expired membership is not current for CSP", () => {
    const now = new Date();
    assert.equal(isCspMembershipCurrent({ activeMembershipPackageId: "p", membershipExpiresAt: new Date(now.getTime() + day) }, now), true);
    assert.equal(isCspMembershipCurrent({ activeMembershipPackageId: "p", membershipExpiresAt: new Date(now.getTime() - day) }, now), false);
    assert.equal(isCspMembershipCurrent({ activeMembershipPackageId: null, membershipExpiresAt: null }, now), false);
  });

  it("requests, contributions and release respect the expired-member rules", () => {
    const csp = read("server/trpc/router/csp.ts");
    assert.equal((csp.match(/throw new Error\(CSP_EXPIRED_MEMBER_MESSAGE\)/g) ?? []).length, 2);
    assert.match(csp, /holdIfBeneficiaryExpired: tierConfig\.holdReleaseForExpiredMembers/);
    assert.match(read("server/jobs/cspBroadcastSweep.ts"), /config\.autoReleaseOnCountdownEnd/);
  });
});
