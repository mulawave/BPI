/**
 * Payment amount rules decided by BPI corporate (Q5, 27/09/2026; follow-up 7,
 * 06/10/2026): an overpayment fulfils the amount due and the difference is
 * credited to the member's Main Wallet; an underpayment is held for admin
 * review.
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

/** Amount tolerance (₦) before a payment counts as over- or under-paid. */
export const AMOUNT_TOLERANCE_NGN = 1;

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
    // Serialise concurrent callers (webhook, verify page, cron) for this reference.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${txReference}))`;
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
 * Overpayment rule (corporate decision Q5 / follow-up 7): the amount due is
 * fulfilled and the difference is credited to the Main Wallet. The difference
 * is treated as a deposit, so deposit Auto-Debit applies when the member has
 * opted in. Idempotent per payment reference; never throws.
 */
export async function settleOverpayment(
  prisma: PrismaClient,
  input: { userId: string; reference: string; paidNgn: number | null | undefined; dueNgn: number | null | undefined; source: string },
): Promise<number> {
  const assessment = assessPaidAmount(input.paidNgn, input.dueNgn);
  if (assessment.kind !== "over") return 0;
  try {
    const credited = await creditOverpayment(prisma, {
      userId: input.userId,
      reference: input.reference,
      excess: assessment.excess,
      source: input.source,
    });
    if (!credited) return 0;
    const { runPostCreditAutomation } = await import("@/server/services/walletAutoDebit.service");
    await runPostCreditAutomation({
      prisma,
      userId: input.userId,
      creditAmount: assessment.excess,
      trigger: "deposit",
      context: `overpayment on ${input.reference}`,
    });
    return assessment.excess;
  } catch (err) {
    console.error(`[PAYMENT-POLICY] Overpayment credit failed for ${input.reference} (${input.source}):`, err);
    return 0;
  }
}
