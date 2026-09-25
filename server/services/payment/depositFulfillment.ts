/**
 * Shared wallet-deposit fulfillment.
 *
 * Every automated path that confirms a gateway deposit (Paystack/Flutterwave
 * webhooks, the /payment/verify page, the stuck-payment recovery cron and the
 * legacy wallet.verifyPayment endpoint) credits the wallet through this one
 * function so behaviour is identical and idempotent:
 *
 *  - The DEPOSIT transaction is flipped pending/failed → completed with a
 *    conditional update; the wallet is only credited when that flip succeeds,
 *    so concurrent webhook / verify / cron runs can never double-credit.
 *  - The PendingPayment row is closed as "approved" in the same transaction,
 *    so it no longer shows in the admin approval queue.
 *  - After commit: deposit notification + auto-debit/CSP auto-contribute.
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { runPostCreditAutomation } from "@/server/services/walletAutoDebit.service";

export type DepositFulfillmentResult =
  | { status: "credited"; transactionId: string; amount: number }
  | { status: "already_processed" }
  | { status: "no_transaction" };

const CREDITABLE_DEPOSIT_STATUSES = ["pending", "failed"];

/** Amount tolerance (₦) when comparing gateway-paid vs expected totals. */
export const DEPOSIT_AMOUNT_TOLERANCE_NGN = 1;

/** Returns true when the gateway-confirmed amount covers the expected total. */
export function isGatewayAmountAcceptable(paidNgn: number | null | undefined, expectedNgn: number | null | undefined): boolean {
  if (expectedNgn == null || !Number.isFinite(expectedNgn) || expectedNgn <= 0) return true;
  if (paidNgn == null || !Number.isFinite(paidNgn)) return false;
  return paidNgn + DEPOSIT_AMOUNT_TOLERANCE_NGN >= expectedNgn;
}

export async function fulfillDepositPayment(
  prisma: PrismaClient,
  input: {
    pendingPaymentId: string;
    userId: string;
    reference: string;
    note: string;
  },
): Promise<DepositFulfillmentResult> {
  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: {
        reference: input.reference,
        userId: input.userId,
        transactionType: "DEPOSIT",
        // "failed" is included because the recovery cron / verify endpoint may
        // have failed a deposit before a late gateway success arrived.
        status: { in: CREDITABLE_DEPOSIT_STATUSES },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!transaction) {
      const completed = await tx.transaction.findFirst({
        where: {
          reference: input.reference,
          userId: input.userId,
          transactionType: "DEPOSIT",
          status: "completed",
        },
        select: { id: true },
      });
      if (completed) {
        await tx.pendingPayment.updateMany({
          where: { id: input.pendingPaymentId, status: { notIn: ["approved", "completed"] } },
          data: { status: "approved", reviewedAt: new Date(), reviewNotes: `${input.note} (deposit was already credited)`, updatedAt: new Date() },
        });
        return { status: "already_processed" as const };
      }
      return { status: "no_transaction" as const };
    }

    // Idempotency guard: only the caller that flips pending → completed credits.
    const flipped = await tx.transaction.updateMany({
      where: { id: transaction.id, status: { in: CREDITABLE_DEPOSIT_STATUSES } },
      data: { status: "completed" },
    });
    if (flipped.count === 0) {
      return { status: "already_processed" as const };
    }

    await tx.user.update({
      where: { id: input.userId },
      data: { wallet: { increment: transaction.amount } },
    });

    const pending = await tx.pendingPayment.findUnique({
      where: { id: input.pendingPaymentId },
      select: { metadata: true },
    });
    const vatAmount = Number((pending?.metadata as Record<string, any> | null)?.vatAmount ?? 0);
    if (vatAmount > 0) {
      await tx.transaction.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          transactionType: "VAT",
          amount: vatAmount,
          description: "VAT on wallet deposit (7.5%)",
          status: "completed",
          reference: `VAT-${input.reference}`,
          walletType: "main",
        },
      });
    }

    await tx.pendingPayment.updateMany({
      where: { id: input.pendingPaymentId, status: { notIn: ["approved", "completed"] } },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewNotes: input.note,
        updatedAt: new Date(),
      },
    });

    return { status: "credited" as const, transactionId: transaction.id, amount: transaction.amount };
  });

  if (result.status === "credited") {
    try {
      await notifyDepositStatus(
        input.userId,
        "completed",
        result.amount,
        input.reference,
        generateReceiptLink(result.transactionId, "deposit"),
      );
    } catch (err) {
      console.error("[DEPOSIT-FULFILLMENT] Notification failed (deposit credited):", err);
    }

    await runPostCreditAutomation({
      prisma,
      userId: input.userId,
      creditAmount: result.amount,
      trigger: "deposit",
      context: `deposit ${input.reference}`,
    });
  }

  return result;
}
