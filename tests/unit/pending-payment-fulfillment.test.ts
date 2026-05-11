/**
 * Pending payment fulfillment guard tests
 *
 * Covers the shared claim/review helpers used by both admin payment approval
 * and webhook fulfillment paths. These tests exist to prevent duplicate value
 * delivery when admin review and webhook callbacks race or retry.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  claimPendingPayment,
  markPendingPaymentReviewed,
} from "@/server/services/payment/pendingPaymentFulfillment";

type PendingPaymentRecord = {
  id: string;
  userId: string;
  status: string;
  gatewayReference: string;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
};

type TransactionRecord = {
  id: string;
  userId: string;
  reference: string;
  status: string;
};

function createFakeClient(seed?: {
  pendingPayments?: PendingPaymentRecord[];
  transactions?: TransactionRecord[];
}) {
  const pendingPayments = [...(seed?.pendingPayments ?? [])];
  const transactions = [...(seed?.transactions ?? [])];

  return {
    pendingPayment: {
      async findUnique(args: { where: { id: string } }) {
        return pendingPayments.find((payment) => payment.id === args.where.id) ?? null;
      },
      async findFirst(args: {
        where: { gatewayReference: string; userId?: string };
        orderBy?: { createdAt: "desc" | "asc" };
      }) {
        const matches = pendingPayments.filter((payment) => {
          if (payment.gatewayReference !== args.where.gatewayReference) return false;
          if (args.where.userId && payment.userId !== args.where.userId) return false;
          return true;
        });

        matches.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
        return matches[0] ?? null;
      },
      async updateMany(args: {
        where: { id?: string; status?: string | { in: string[] } };
        data: Partial<PendingPaymentRecord>;
      }) {
        let count = 0;

        for (const payment of pendingPayments) {
          if (args.where.id && payment.id !== args.where.id) continue;

          if (typeof args.where.status === "string" && payment.status !== args.where.status) {
            continue;
          }

          if (
            args.where.status &&
            typeof args.where.status !== "string" &&
            !args.where.status.in.includes(payment.status)
          ) {
            continue;
          }

          Object.assign(payment, args.data);
          count += 1;
        }

        return { count };
      },
    },
    transaction: {
      async findFirst(args: {
        where: { reference: string; userId?: string; status?: { in: string[] } };
      }) {
        return (
          transactions.find((transaction) => {
            if (transaction.reference !== args.where.reference) return false;
            if (args.where.userId && transaction.userId !== args.where.userId) return false;
            if (args.where.status && !args.where.status.in.includes(transaction.status)) return false;
            return true;
          }) ?? null
        );
      },
    },
    state: {
      pendingPayments,
      transactions,
    },
  };
}

function makePendingPayment(overrides?: Partial<PendingPaymentRecord>): PendingPaymentRecord {
  return {
    id: overrides?.id ?? "pp-1",
    userId: overrides?.userId ?? "user-1",
    status: overrides?.status ?? "pending",
    gatewayReference: overrides?.gatewayReference ?? "REF-1001",
    reviewNotes: overrides?.reviewNotes ?? null,
    reviewedBy: overrides?.reviewedBy ?? null,
    reviewedAt: overrides?.reviewedAt ?? null,
    updatedAt: overrides?.updatedAt ?? new Date("2026-05-11T00:00:00.000Z"),
    createdAt: overrides?.createdAt ?? new Date("2026-05-10T00:00:00.000Z"),
  };
}

describe("Pending payment approval idempotency", () => {
  it("allows only one successful claim before final review", async () => {
    const client = createFakeClient({
      pendingPayments: [makePendingPayment()],
    });

    const firstClaim = await claimPendingPayment(client as any, {
      pendingPaymentId: "pp-1",
      expectedUserId: "user-1",
      purpose: "DEPOSIT",
      actor: "Admin review",
      claimableStatuses: ["pending"],
    });

    assert.strictEqual(firstClaim.status, "claimed");
    assert.strictEqual(client.state.pendingPayments[0]?.status, "processing");

    const duplicateClaim = await claimPendingPayment(client as any, {
      pendingPaymentId: "pp-1",
      expectedUserId: "user-1",
      purpose: "DEPOSIT",
      actor: "Admin review retry",
      claimableStatuses: ["pending"],
    });

    assert.deepStrictEqual(duplicateClaim, { status: "in_progress" });
  });

  it("finalizes review only once and rejects duplicate approval completion", async () => {
    const client = createFakeClient({
      pendingPayments: [makePendingPayment({ status: "processing" })],
    });

    const firstReview = await markPendingPaymentReviewed(client as any, {
      paymentId: "pp-1",
      status: "approved",
      note: "Approved by admin",
      reviewedBy: "admin-1",
      reviewedAt: new Date("2026-05-11T12:00:00.000Z"),
    });

    assert.strictEqual(firstReview, true);
    assert.strictEqual(client.state.pendingPayments[0]?.status, "approved");

    const duplicateReview = await markPendingPaymentReviewed(client as any, {
      paymentId: "pp-1",
      status: "approved",
      note: "Duplicate approval",
      reviewedBy: "admin-1",
    });

    assert.strictEqual(duplicateReview, false);
  });

  it("returns already_processed after a payment reaches terminal status", async () => {
    const client = createFakeClient({
      pendingPayments: [makePendingPayment({ status: "approved" })],
    });

    const claim = await claimPendingPayment(client as any, {
      pendingPaymentId: "pp-1",
      expectedUserId: "user-1",
      purpose: "MEMBERSHIP",
      actor: "Webhook retry",
    });

    assert.deepStrictEqual(claim, { status: "already_processed" });
  });
});

describe("Pending payment webhook and admin overlap", () => {
  it("blocks a second actor while another path holds the processing claim", async () => {
    const client = createFakeClient({
      pendingPayments: [makePendingPayment()],
    });

    const adminClaim = await claimPendingPayment(client as any, {
      pendingPaymentId: "pp-1",
      expectedUserId: "user-1",
      purpose: "TOPUP",
      actor: "Admin review",
      claimableStatuses: ["pending"],
    });

    assert.strictEqual(adminClaim.status, "claimed");

    const webhookClaim = await claimPendingPayment(client as any, {
      reference: "REF-1001",
      expectedUserId: "user-1",
      purpose: "TOPUP",
      actor: "Paystack webhook",
      claimableStatuses: ["pending"],
    });

    assert.deepStrictEqual(webhookClaim, { status: "in_progress" });
  });

  it("returns already_processed when a later path sees a completed transaction but no pending record", async () => {
    const client = createFakeClient({
      transactions: [
        {
          id: "txn-1",
          userId: "user-1",
          reference: "REF-2002",
          status: "completed",
        },
      ],
    });

    const claim = await claimPendingPayment(client as any, {
      reference: "REF-2002",
      expectedUserId: "user-1",
      purpose: "MEMBERSHIP",
      actor: "Flutterwave webhook retry",
    });

    assert.deepStrictEqual(claim, { status: "already_processed" });
  });

  it("treats a user mismatch as missing so another user's payment cannot be claimed", async () => {
    const client = createFakeClient({
      pendingPayments: [makePendingPayment({ userId: "user-2" })],
    });

    const claim = await claimPendingPayment(client as any, {
      pendingPaymentId: "pp-1",
      expectedUserId: "user-1",
      purpose: "DEPOSIT",
      actor: "Admin review",
    });

    assert.deepStrictEqual(claim, { status: "missing" });
  });
});