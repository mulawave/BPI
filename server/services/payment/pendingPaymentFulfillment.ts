import type { PendingPayment, Prisma, PrismaClient } from "@prisma/client";

type PendingPaymentClient = PrismaClient | Prisma.TransactionClient;

export type PendingPaymentClaim =
  | { status: "claimed"; paymentId: string; userId: string; pendingPayment: PendingPayment }
  | { status: "already_processed" | "in_progress" | "missing" };

const TERMINAL_PENDING_PAYMENT_STATUSES = new Set(["approved", "completed"]);

function normalizeStatus(status: string | null | undefined): string {
  return (status || "").trim().toLowerCase();
}

export async function claimPendingPayment(
  client: PendingPaymentClient,
  input: {
    pendingPaymentId?: string;
    reference?: string;
    expectedUserId?: string;
    purpose: string;
    actor: string;
    claimableStatuses?: string[];
    claimedNote?: string;
    reviewedBy?: string;
  }
): Promise<PendingPaymentClaim> {
  const claimableStatuses = input.claimableStatuses ?? ["pending"];

  const pendingPayment = input.pendingPaymentId
    ? await client.pendingPayment.findUnique({ where: { id: input.pendingPaymentId } })
    : input.reference
      ? await client.pendingPayment.findFirst({
          where: {
            gatewayReference: input.reference,
            ...(input.expectedUserId ? { userId: input.expectedUserId } : {}),
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

  if (!pendingPayment) {
    if (!input.reference) {
      return { status: "missing" };
    }

    const completedTransaction = await client.transaction.findFirst({
      where: {
        reference: input.reference,
        ...(input.expectedUserId ? { userId: input.expectedUserId } : {}),
        status: { in: ["approved", "completed"] },
      },
    });

    return completedTransaction ? { status: "already_processed" } : { status: "missing" };
  }

  if (input.expectedUserId && pendingPayment.userId !== input.expectedUserId) {
    return { status: "missing" };
  }

  const normalizedStatus = normalizeStatus(pendingPayment.status);
  if (TERMINAL_PENDING_PAYMENT_STATUSES.has(normalizedStatus)) {
    return { status: "already_processed" };
  }

  const normalizedClaimableStatuses = new Set(claimableStatuses.map((status) => normalizeStatus(status)));
  if (!normalizedClaimableStatuses.has(normalizedStatus)) {
    return { status: "in_progress" };
  }

  const claimedAt = new Date();
  const claimed = await client.pendingPayment.updateMany({
    where: {
      id: pendingPayment.id,
      status: { in: claimableStatuses },
    },
    data: {
      status: "processing",
      reviewNotes:
        input.claimedNote ??
        `${input.actor} claimed payment for ${input.purpose} processing at ${claimedAt.toISOString()}`,
      ...(input.reviewedBy ? { reviewedBy: input.reviewedBy } : {}),
      updatedAt: claimedAt,
    },
  });

  if (claimed.count === 0) {
    const refreshed = await client.pendingPayment.findUnique({ where: { id: pendingPayment.id } });
    if (refreshed && TERMINAL_PENDING_PAYMENT_STATUSES.has(normalizeStatus(refreshed.status))) {
      return { status: "already_processed" };
    }
    return { status: "in_progress" };
  }

  return {
    status: "claimed",
    paymentId: pendingPayment.id,
    userId: pendingPayment.userId,
    pendingPayment,
  };
}

export async function markPendingPaymentNeedsReview(
  client: PendingPaymentClient,
  input: {
    paymentId: string;
    note: string;
  }
): Promise<boolean> {
  const updated = await client.pendingPayment.updateMany({
    where: { id: input.paymentId, status: "processing" },
    data: {
      reviewNotes: input.note,
      updatedAt: new Date(),
    },
  });

  return updated.count === 1;
}

export async function markPendingPaymentReviewed(
  client: PendingPaymentClient,
  input: {
    paymentId: string;
    status: "approved" | "completed" | "rejected";
    note?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
  }
): Promise<boolean> {
  const reviewedAt = input.reviewedAt ?? new Date();
  const updated = await client.pendingPayment.updateMany({
    where: { id: input.paymentId, status: "processing" },
    data: {
      status: input.status,
      ...(input.note !== undefined ? { reviewNotes: input.note } : {}),
      ...(input.reviewedBy ? { reviewedBy: input.reviewedBy } : {}),
      reviewedAt,
      updatedAt: reviewedAt,
    },
  });

  return updated.count === 1;
}