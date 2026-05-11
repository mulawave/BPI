import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  executeAdminPaymentReview,
  type AdminReviewPaymentRecord,
} from "@/server/services/payment/adminPaymentReview";
import type { PendingPaymentClaim } from "@/server/services/payment/pendingPaymentFulfillment";

const adminRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/admin.ts"),
  "utf8",
);

type UserRecord = {
  id: string;
  wallet: number;
};

type TransactionRecord = {
  id: string;
  userId: string;
  reference: string;
  status: string;
  transactionType: string;
  amount: number;
  description: string;
  walletType: string;
};

type AuditLogRecord = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  status: string;
  changes: string;
  createdAt: Date;
};

function createFakePrisma(seed?: {
  users?: UserRecord[];
  transactions?: TransactionRecord[];
  failOnTransactionUpdateMany?: boolean;
}) {
  const state = {
    users: structuredClone(seed?.users ?? []),
    transactions: structuredClone(seed?.transactions ?? []),
    auditLogs: [] as AuditLogRecord[],
  };

  return {
    state,
    async $transaction<T>(callback: (tx: any) => Promise<T>) {
      const snapshot = structuredClone(state);

      const tx = {
        user: {
          async update(args: { where: { id: string }; data: { wallet: { increment: number } } }) {
            const user = state.users.find((entry) => entry.id === args.where.id);
            if (!user) {
              throw new Error(`User not found: ${args.where.id}`);
            }

            user.wallet += args.data.wallet.increment;
            return structuredClone(user);
          },
        },
        transaction: {
          async findFirst(args: {
            where: {
              reference: string;
              userId: string;
              status: string;
              transactionType: string;
            };
          }) {
            return (
              state.transactions.find((entry) => {
                return (
                  entry.reference === args.where.reference &&
                  entry.userId === args.where.userId &&
                  entry.status === args.where.status &&
                  entry.transactionType === args.where.transactionType
                );
              }) ?? null
            );
          },
          async updateMany(args: {
            where: { reference: string; userId: string; status: string };
            data: { status: string; description: string };
          }) {
            if (seed?.failOnTransactionUpdateMany) {
              throw new Error("induced failure after wallet increment");
            }

            let count = 0;
            for (const entry of state.transactions) {
              if (
                entry.reference === args.where.reference &&
                entry.userId === args.where.userId &&
                entry.status === args.where.status
              ) {
                entry.status = args.data.status;
                entry.description = args.data.description;
                count += 1;
              }
            }

            return { count };
          },
          async create(args: { data: TransactionRecord }) {
            state.transactions.push(structuredClone(args.data));
            return structuredClone(args.data);
          },
        },
        auditLog: {
          async create(args: { data: AuditLogRecord }) {
            state.auditLogs.push(structuredClone(args.data));
            return structuredClone(args.data);
          },
        },
      };

      try {
        return await callback(tx);
      } catch (error) {
        state.users = snapshot.users;
        state.transactions = snapshot.transactions;
        state.auditLogs = snapshot.auditLogs;
        throw error;
      }
    },
  };
}

function makePendingDepositPayment(
  overrides?: Partial<AdminReviewPaymentRecord>,
): AdminReviewPaymentRecord {
  return {
    id: "payment-1",
    userId: "user-1",
    status: "pending",
    transactionType: "DEPOSIT",
    amount: 1000,
    paymentMethod: "Bank Transfer",
    gatewayReference: "REF-DEP-1",
    metadata: {
      depositAmount: 1000,
      vatAmount: 75,
      processingFeeAmount: 10,
    },
    User: {
      email: "user@example.com",
      name: "Test User",
      country: "Nigeria",
      state: "Lagos",
    },
    ...overrides,
  };
}

function makeClaimedPaymentResult(): PendingPaymentClaim {
  return {
    status: "claimed",
    paymentId: "payment-1",
    userId: "user-1",
    pendingPayment: {
      id: "payment-1",
      userId: "user-1",
      status: "pending",
      transactionType: "DEPOSIT",
      amount: 1000,
      currency: "NGN",
      paymentMethod: "Bank Transfer",
      gatewayReference: "REF-DEP-1",
      proofOfPayment: null,
      metadata: {
        depositAmount: 1000,
        vatAmount: 75,
        processingFeeAmount: 10,
      },
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
      updatedAt: new Date("2026-05-11T00:00:00.000Z"),
    } as any,
  };
}

describe("Admin payment approval atomicity", () => {
  it("routes both single and bulk admin review through the shared executor", () => {
    assert.match(adminRouterSource, /reviewPayment:[\s\S]*return executeAdminPaymentReview\(/);
    assert.match(adminRouterSource, /bulkReviewPayments:[\s\S]*await executeAdminPaymentReview\(/);
  });

  it("rolls back credited wallet state when deposit approval fails mid-transaction", async () => {
    const prisma = createFakePrisma({
      users: [{ id: "user-1", wallet: 500 }],
      transactions: [
        {
          id: "txn-pending-1",
          userId: "user-1",
          reference: "REF-DEP-1",
          status: "pending",
          transactionType: "DEPOSIT",
          amount: 1000,
          description: "Pending deposit",
          walletType: "main",
        },
      ],
      failOnTransactionUpdateMany: true,
    });

    const notifications: unknown[][] = [];
    const revenueCalls: Array<{ amount: number; source: string }> = [];

    await assert.rejects(
      () =>
        executeAdminPaymentReview({
          prisma: prisma as any,
          payment: makePendingDepositPayment(),
          action: "approve",
          reviewerId: "admin-1",
          deps: {
            async claimPendingPayment() {
              return makeClaimedPaymentResult();
            },
            async markPendingPaymentReviewed() {
              return true;
            },
            async recordRevenue(_tx, params) {
              revenueCalls.push({ amount: params.amount, source: params.source });
            },
            generateReceiptLink(reference) {
              return `/receipts/${reference}`;
            },
            async notifyDepositStatus(...args) {
              notifications.push(args);
            },
            async sendEmail() {
              return undefined;
            },
          },
        }),
      /induced failure after wallet increment/,
    );

    assert.strictEqual(prisma.state.users[0]?.wallet, 500);
    assert.strictEqual(prisma.state.transactions.length, 1);
    assert.strictEqual(prisma.state.transactions[0]?.status, "pending");
    assert.strictEqual(prisma.state.auditLogs.length, 0);
    assert.strictEqual(revenueCalls.length, 0);
    assert.strictEqual(notifications.length, 0);
  });

  it("commits deposit approval state only after the transaction succeeds", async () => {
    const prisma = createFakePrisma({
      users: [{ id: "user-1", wallet: 500 }],
      transactions: [
        {
          id: "txn-pending-1",
          userId: "user-1",
          reference: "REF-DEP-1",
          status: "pending",
          transactionType: "DEPOSIT",
          amount: 1000,
          description: "Pending deposit",
          walletType: "main",
        },
      ],
    });

    const notifications: unknown[][] = [];
    const revenueCalls: Array<{ amount: number; source: string }> = [];

    const updated = await executeAdminPaymentReview({
      prisma: prisma as any,
      payment: makePendingDepositPayment(),
      action: "approve",
      reviewerId: "admin-1",
      deps: {
        async claimPendingPayment() {
          return makeClaimedPaymentResult();
        },
        async markPendingPaymentReviewed() {
          return true;
        },
        async recordRevenue(_tx, params) {
          revenueCalls.push({ amount: params.amount, source: params.source });
        },
        generateReceiptLink(reference) {
          return `/receipts/${reference}`;
        },
        async notifyDepositStatus(...args) {
          notifications.push(args);
        },
        async sendEmail() {
          return undefined;
        },
      },
    });

    assert.strictEqual(updated, true);
    assert.strictEqual(prisma.state.users[0]?.wallet, 1500);
    assert.strictEqual(prisma.state.transactions[0]?.status, "completed");
    assert.strictEqual(prisma.state.transactions.length, 3);
    assert.strictEqual(prisma.state.auditLogs.length, 1);
    assert.deepStrictEqual(revenueCalls, [{ amount: 10, source: "DEPOSIT_FEE" }]);
    assert.strictEqual(notifications.length, 1);
    assert.deepStrictEqual(notifications[0], [
      "user-1",
      "completed",
      1000,
      "REF-DEP-1",
      "/receipts/REF-DEP-1",
    ]);
  });

  it("treats legacy TOPUP approvals the same as DEPOSIT approvals", async () => {
    const prisma = createFakePrisma({
      users: [{ id: "user-1", wallet: 500 }],
      transactions: [
        {
          id: "txn-pending-1",
          userId: "user-1",
          reference: "REF-DEP-1",
          status: "pending",
          transactionType: "DEPOSIT",
          amount: 1000,
          description: "Pending deposit",
          walletType: "main",
        },
      ],
    });

    const revenueCalls: Array<{ amount: number; source: string }> = [];

    const updated = await executeAdminPaymentReview({
      prisma: prisma as any,
      payment: makePendingDepositPayment({ transactionType: "TOPUP" }),
      action: "approve",
      reviewerId: "admin-1",
      deps: {
        async claimPendingPayment() {
          return makeClaimedPaymentResult();
        },
        async markPendingPaymentReviewed() {
          return true;
        },
        async recordRevenue(_tx, params) {
          revenueCalls.push({ amount: params.amount, source: params.source });
        },
        generateReceiptLink(reference) {
          return `/receipts/${reference}`;
        },
        async notifyDepositStatus() {
          return undefined;
        },
        async sendEmail() {
          return undefined;
        },
      },
    });

    assert.strictEqual(updated, true);
    assert.strictEqual(prisma.state.users[0]?.wallet, 1500);
    assert.strictEqual(prisma.state.transactions[0]?.status, "completed");
    assert.deepStrictEqual(revenueCalls, [{ amount: 10, source: "DEPOSIT_FEE" }]);
  });
});
