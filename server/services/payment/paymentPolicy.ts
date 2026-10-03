/**
 * Payment rules decided by BPI corporate (Decisions Required, 27/09/2026).
 *
 *  - Unpaid payments expire after 1 hour (admin setting
 *    `payment_unpaid_expiry_minutes`).
 *  - A payment the gateway confirms after it expired is NOT applied
 *    automatically: it is held with status "needs_approval" for an admin.
 *  - Overpayment: the amount due is fulfilled and the difference is credited
 *    to the member's Main Wallet. Underpayment: held for admin review.
 */

import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_UNPAID_EXPIRY_MINUTES = 60;
export const NEEDS_APPROVAL_STATUS = "needs_approval";
/** Statuses a payment can be in when a late gateway confirmation arrives. */
export const LATE_PAYMENT_STATUSES = ["expired", "rejected"];
/** Amount tolerance (₦) before a payment counts as over- or under-paid. */
export const AMOUNT_TOLERANCE_NGN = 1;

export async function loadUnpaidExpiryMs(db: Db): Promise<number> {
  try {
    const row = await db.adminSettings.findUnique({ where: { settingKey: "payment_unpaid_expiry_minutes" } });
    const minutes = Number(row?.settingValue);
    if (Number.isFinite(minutes) && minutes > 0) return minutes * 60 * 1000;
  } catch {
    // fall through to default
  }
  return DEFAULT_UNPAID_EXPIRY_MINUTES * 60 * 1000;
}

export type AmountAssessment =
  | { kind: "exact"; excess: 0; shortfall: 0 }
  | { kind: "over"; excess: number; shortfall: 0 }
  | { kind: "under"; excess: 0; shortfall: number }
  | { kind: "unknown"; excess: 0; shortfall: 0 };

/** Compare what the gateway says was paid with the amount due. */
export function assessPaidAmount(paidNgn: number | null | undefined, dueNgn: number | null | undefined): AmountAssessment {
  if (dueNgn == null || !Number.isFinite(dueNgn) || dueNgn <= 0) return { kind: "exact", excess: 0, shortfall: 0 };
  if (paidNgn == null || !Number.isFinite(paidNgn)) return { kind: "unknown", excess: 0, shortfall: 0 };
  const diff = Math.round((paidNgn - dueNgn) * 100) / 100;
  if (diff > AMOUNT_TOLERANCE_NGN) return { kind: "over", excess: diff, shortfall: 0 };
  if (diff < -AMOUNT_TOLERANCE_NGN) return { kind: "under", excess: 0, shortfall: -diff };
  return { kind: "exact", excess: 0, shortfall: 0 };
}

/**
 * Credits an overpayment to the member's Main Wallet. Idempotent per payment
 * reference, so webhook, verify page and recovery job can all call it.
 */
export async function creditOverpayment(
  prisma: PrismaClient,
  input: { userId: string; reference: string; excess: number; source: string },
): Promise<boolean> {
  if (!(input.excess > 0)) return false;
  const txReference = `OVERPAY-${input.reference}`;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { userId: input.userId, reference: txReference, transactionType: "OVERPAYMENT_CREDIT" },
      select: { id: true },
    });
    if (existing) return false;
    await tx.user.update({ where: { id: input.userId }, data: { wallet: { increment: input.excess } } });
    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        transactionType: "OVERPAYMENT_CREDIT",
        amount: input.excess,
        description: `Overpayment on payment ${input.reference} credited to Main Wallet (${input.source})`,
        status: "completed",
        reference: txReference,
        walletType: "main",
      },
    });
    return true;
  });
}

/**
 * A gateway confirmed a payment that had already expired (or been rejected).
 * Per corporate decision it is held for admin approval instead of being
 * applied: status → "needs_approval", and its pending transactions are
 * reopened so an approval completes them normally.
 */
export async function holdLatePaymentForApproval(
  prisma: PrismaClient,
  input: { reference: string; paidAmount?: number | null; source: string; userId?: string },
): Promise<{ held: boolean; paymentId?: string; userId?: string }> {
  const payment = await prisma.pendingPayment.findFirst({
    where: {
      gatewayReference: input.reference,
      status: { in: LATE_PAYMENT_STATUSES },
      ...(input.userId ? { userId: input.userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, status: true, amount: true },
  });
  if (!payment) return { held: false };

  const now = new Date();
  const updated = await prisma.pendingPayment.updateMany({
    where: { id: payment.id, status: { in: LATE_PAYMENT_STATUSES } },
    data: {
      status: NEEDS_APPROVAL_STATUS,
      reviewNotes: `${input.source}: gateway confirmed payment${input.paidAmount != null ? ` of ₦${input.paidAmount}` : ""} after it had ${payment.status === "expired" ? "expired" : "been rejected"}. Awaiting admin approval.`,
      updatedAt: now,
    },
  });
  if (updated.count === 0) return { held: false };

  await prisma.transaction.updateMany({
    where: { reference: input.reference, userId: payment.userId, status: "failed" },
    data: { status: "pending" },
  });

  try {
    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        userId: payment.userId,
        action: "PAYMENT_LATE_NEEDS_APPROVAL",
        entity: "PendingPayment",
        entityId: payment.id,
        changes: JSON.stringify({ reference: input.reference, previousStatus: payment.status, paidAmount: input.paidAmount ?? null, due: payment.amount, source: input.source }),
        status: "warning",
        createdAt: now,
      },
    });
  } catch {
    // audit is best-effort
  }

  return { held: true, paymentId: payment.id, userId: payment.userId };
}
