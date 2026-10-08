/**
 * Post-commit side effects of a CSP release: Auto-Debit on the sponsor share
 * and on the beneficiary's funds, plus notifications. Best-effort — the
 * release is already committed. Shared by admin release, admin-default
 * completion and automatic release when the countdown ends.
 */

import { prisma } from "@/lib/prisma";
import { notifyCspRequestProcessed, sendCspLifecycleEmail } from "@/server/services/notification.service";
import { runPostCreditAutomation } from "@/server/services/walletAutoDebit.service";
import type { CspReleaseResult } from "@/server/services/csp-ledger.service";

export async function afterCspRelease(release: CspReleaseResult) {
  const request = await prisma.cspSupportRequest.findUnique({
    where: { id: release.requestId },
    select: { id: true, userId: true, category: true, requestedAmount: true, User: { select: { email: true, state: true } } },
  });
  if (!request) return;

  // Sponsor share is a referral reward credited to the cash wallet → auto-debit applies.
  if (release.sponsorId && release.shares.sponsor > 0) {
    await runPostCreditAutomation({
      prisma,
      userId: release.sponsorId,
      creditAmount: release.shares.sponsor,
      trigger: "reward",
      context: `CSP sponsor reward ${request.id}`,
    });
  }

  // Corporate decision (06/10/2026): Auto-Debit also applies to the funds the
  // beneficiary receives (admin setting auto_debit_csp_payout_enabled).
  if (release.shares.recipient > 0) {
    await runPostCreditAutomation({
      prisma,
      userId: request.userId,
      creditAmount: release.shares.recipient,
      trigger: "csp_payout",
      context: `CSP support released ${request.id}`,
    });
  }

  try {
    await notifyCspRequestProcessed(request.userId, request.category, release.shares.recipient, "released");
  } catch (e) {
    console.error("[CSP] Release notification failed:", e);
  }
  if (request.User?.email) {
    try {
      await sendCspLifecycleEmail(request.User.email, "processed", {
        category: request.category,
        amount: release.shares.recipient,
        status: "released",
        requestedAmount: request.requestedAmount ?? undefined,
        totalRaised: release.total,
        fullyFunded: release.fullyFunded,
        shares: release.shares,
      });
    } catch (e) {
      console.error("[CSP] Lifecycle email failed:", e);
    }
  }
}
