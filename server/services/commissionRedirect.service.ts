/**
 * Day-7 commission redirect for expired members.
 *
 * Corporate decision (follow-up Q8a/Q8b, 06-07/10/2026): a member keeps
 * platform access for 15 days after their membership expires, but their
 * team commissions stop after 7 days. From day 8 of expiry (until they
 * renew), every referral commission that would have gone to them — every
 * team level and the CSP sponsor share — is redirected to the default
 * beneficiaries instead. Once they renew, commissions resume; nothing paid
 * out during the redirect window is paid back retroactively.
 */

import type { PrismaClient, Prisma } from "@prisma/client";
import { creditDefaultBeneficiaries } from "@/server/services/defaultBeneficiaries.service";

type TxClient = PrismaClient | Prisma.TransactionClient;

export const COMMISSION_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a referrer's commissions should redirect to the default
 * beneficiaries right now: they have a membership package, it expired more
 * than COMMISSION_GRACE_DAYS ago (counted from the grace anchor if the
 * release reset one for them), and they have not renewed since.
 */
export function commissionsAreRedirected(
  user: { activeMembershipPackageId: string | null; membershipExpiresAt: Date | null; membershipGraceAnchorAt?: Date | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user?.activeMembershipPackageId || !user.membershipExpiresAt) return false;
  const base = user.membershipGraceAnchorAt && user.membershipGraceAnchorAt.getTime() > user.membershipExpiresAt.getTime()
    ? user.membershipGraceAnchorAt
    : user.membershipExpiresAt;
  return now.getTime() - base.getTime() > COMMISSION_GRACE_DAYS * DAY_MS;
}

/**
 * Credits a referral/CSP-sponsor commission to its normal recipient, unless
 * that recipient's commissions are currently redirected (day 7+ of
 * expiry), in which case it goes to the default beneficiaries instead.
 * Must run inside the caller's transaction. Returns where it went.
 */
export async function creditCommissionOrRedirect(
  tx: TxClient,
  input: { recipientId: string; amount: number; description: string; transactionType: string; reference: string; now?: Date },
): Promise<{ redirected: boolean; creditedUserId: string | null }> {
  if (!(input.amount > 0)) return { redirected: false, creditedUserId: null };

  const recipient = await tx.user.findUnique({
    where: { id: input.recipientId },
    select: { activeMembershipPackageId: true, membershipExpiresAt: true, membershipGraceAnchorAt: true },
  });

  if (commissionsAreRedirected(recipient, input.now)) {
    await creditDefaultBeneficiaries(tx, {
      amount: input.amount,
      description: `${input.description} (redirected — recipient's membership has been expired more than ${COMMISSION_GRACE_DAYS} days)`,
      transactionType: "COMMISSION_REDIRECT",
      reference: input.reference,
    });
    return { redirected: true, creditedUserId: null };
  }

  await tx.user.update({ where: { id: input.recipientId }, data: { wallet: { increment: input.amount } } });
  const { randomUUID } = await import("crypto");
  await tx.transaction.create({
    data: {
      id: randomUUID(),
      userId: input.recipientId,
      transactionType: input.transactionType,
      amount: input.amount,
      description: input.description,
      status: "completed",
      reference: input.reference,
      walletType: "main",
    },
  });
  return { redirected: false, creditedUserId: input.recipientId };
}
