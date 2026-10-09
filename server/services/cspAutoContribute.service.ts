/**
 * CSP Auto-Contribute Service
 *
 * Automatically contributes from a user's community wallet to eligible CSP requests.
 * Runs when triggered (e.g. after an auto-debit tops up the community wallet,
 * or on a scheduled basis).
 *
 * Behaviour:
 * - Finds up to 10 broadcasting requests the user has NOT fully contributed maxAmount to
 * - Contributes minAmountPerRequest per request in round-robin until:
 *   • Each request receives up to maxAmountPerRequest from this user, OR
 *   • The user's community wallet runs out
 * - Skips the user's own requests
 * - Records CspContribution + CspAutoContributeLog + transaction records
 * - Reconciles member standing contribution right (tier progression)
 * - Uses the shared CSP ledger (csp-ledger.service) so every contribution funds
 *   the request's holding wallet and is released in full
 * - Applies paid auto-extension thresholds when contribution crosses milestones
 * - Sends notifications to both contributor and request owner
 * - Tracks wait-reduction progress for contributors in cooldown
 * - If balance reaches 0, notifies user (keeps auto-contribute enabled)
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { notifyCspContributionReceived, notifyCspBroadcastExtended } from "@/server/services/notification.service";
import { applyCspContribution, CspContributionError, isCspMembershipCurrent } from "@/server/services/csp-ledger.service";
import { loadTierConfig } from "@/server/services/csp-config.service";

export interface AutoContributeResult {
  totalContributed: number;
  requestsContributed: number;
  disabledDueToBalance: boolean;
}

export async function runCspAutoContribute(params: {
  prisma: PrismaClient;
  userId: string;
}): Promise<AutoContributeResult> {
  const { prisma, userId } = params;

  // Check if auto-contribute is globally disabled
  const globalDisable = await prisma.adminSettings.findUnique({
    where: { settingKey: "csp_auto_contribute_disabled" },
  });
  if (globalDisable?.settingValue === "true") {
    return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: false };
  }

  // Check user's per-account disable flag
  const userDisable = await prisma.adminSettings.findUnique({
    where: { settingKey: `csp_auto_contribute_disabled_${userId}` },
  });
  if (userDisable?.settingValue === "true") {
    return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: false };
  }

  const setting = await prisma.cspAutoContributeSetting.findUnique({
    where: { userId },
  });

  if (!setting || !setting.isEnabled) {
    return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: false };
  }

  const { minAmountPerRequest, maxAmountPerRequest } = setting;

  // Get user's community wallet balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { community: true, activeMembershipPackageId: true, membershipExpiresAt: true },
  });

  // Corporate decision 06/10/2026: expired members cannot use CSP until they renew.
  if (user?.activeMembershipPackageId && !isCspMembershipCurrent(user)) {
    const tierConfig = await loadTierConfig(prisma);
    if (tierConfig.blockExpiredMembers) {
      return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: false };
    }
  }

  if (!user || user.community < minAmountPerRequest) {
    // Not enough funds this run. Leave auto-contribute ENABLED so the recurring
    // sweep resumes automatically once the community wallet is funded again —
    // do not disable it (that was the "runs once and stops" bug).
    return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: false };
  }

  // Find broadcasting requests this user hasn't maxed out
  // Get existing contributions from this user grouped by request
  const existingContributions = await prisma.cspContribution.groupBy({
    by: ["requestId"],
    where: { contributorId: userId },
    _sum: { amount: true },
  });

  const contribByRequest = new Map(
    existingContributions.map((r) => [r.requestId, r._sum.amount ?? 0])
  );

  // Get eligible broadcasting requests (not the user's own, currently broadcasting)
  const eligibleRequests = await prisma.cspSupportRequest.findMany({
    where: {
      status: "broadcasting",
      userId: { not: userId },
      // Corporate decision (follow-up Q17, 07/10/2026): Auto-Contribute does
      // not apply to Special Community Support campaigns.
      isSpecialSupport: false,
      OR: [
        { isAdminDefault: true },
        { broadcastExpiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 50, // fetch more than needed to filter
  });

  // Filter to requests where user hasn't reached maxAmountPerRequest
  const targetRequests = eligibleRequests
    .filter((r) => {
      const alreadyContributed = contribByRequest.get(r.id) ?? 0;
      return alreadyContributed < maxAmountPerRequest;
    })
    .slice(0, 10); // cap at 10 requests

  if (targetRequests.length === 0) {
    return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: false };
  }

  let totalContributed = 0;
  let requestsContributed = 0;
  let currentBalance = user.community;
  let disabledDueToBalance = false;

  // Round-robin: contribute minAmountPerRequest to each request, repeat until done.
  // Each contribution goes through the shared CSP ledger, which re-checks the
  // balance and request state atomically, funds the request's holding wallet
  // and derives status/extension from the fresh totals.
  const closedRequestIds = new Set<string>();
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;

    for (const request of targetRequests) {
      if (closedRequestIds.has(request.id)) continue;
      if (currentBalance < minAmountPerRequest) {
        disabledDueToBalance = true;
        break;
      }

      const alreadyContributed = contribByRequest.get(request.id) ?? 0;
      const remaining = maxAmountPerRequest - alreadyContributed;
      if (remaining <= 0) continue;

      const contributeAmount = Math.min(minAmountPerRequest, remaining, Math.floor(currentBalance));
      if (contributeAmount < 1) continue;

      const balanceBefore = currentBalance;
      let applied: Awaited<ReturnType<typeof applyCspContribution>>;
      try {
        applied = await prisma.$transaction(async (tx) => {
          const result = await applyCspContribution(tx, {
            requestId: request.id,
            contributorId: userId,
            amount: contributeAmount,
            debitWallet: "community",
            contributionWalletType: "community",
            transactionType: "CSP_AUTO_CONTRIBUTION",
            transactionDescription: `Auto-contribute to CSP request ${request.id}`,
          });

          await tx.cspAutoContributeLog.create({
            data: {
              userId,
              requestId: request.id,
              amount: contributeAmount,
              balanceBefore,
              balanceAfter: balanceBefore - contributeAmount,
            },
          });

          return result;
        });
      } catch (err) {
        if (err instanceof CspContributionError) {
          if (err.message.startsWith("Insufficient")) {
            disabledDueToBalance = true;
            break;
          }
          // Request closed, released or fully funded since we listed it.
          closedRequestIds.add(request.id);
          continue;
        }
        throw err;
      }

      currentBalance -= contributeAmount;
      totalContributed += contributeAmount;
      contribByRequest.set(request.id, alreadyContributed + contributeAmount);
      requestsContributed++;
      madeProgress = true;
      if (applied.reachedThreshold) closedRequestIds.add(request.id);

      // Notify user of successful contribution
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId,
          title: "Auto-Contribute Successful",
          message: `₦${contributeAmount.toLocaleString()} auto-contributed to a CSP request. Community wallet balance: ₦${currentBalance.toLocaleString()}.`,
          link: "/csp",
          isRead: false,
        },
      });

      // A5: Notify the request owner that they received a contribution
      await notifyCspContributionReceived(applied.requestOwnerId, contributeAmount);

      // A4: Notify request owner if broadcast was auto-extended
      if (applied.autoExtendHours > 0) {
        await notifyCspBroadcastExtended(applied.requestOwnerId, applied.autoExtendHours);
      }

      // A6: Wait-reduction tracking for contributors in cooldown
      await trackWaitReduction(prisma, userId, contributeAmount);
    }

    if (disabledDueToBalance) break;
  }

  // Balance exhausted this run: notify once, but keep auto-contribute ENABLED so
  // the recurring sweep resumes automatically once the wallet is funded again.
  if (disabledDueToBalance) {
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId,
        title: "Auto-Contribute Paused — No Balance",
        message: "Your CSP auto-contribute is paused until your community wallet is funded. It will resume automatically once funds are available.",
        link: "/csp",
        isRead: false,
      },
    });
  }

  return { totalContributed, requestsContributed, disabledDueToBalance };
}

/**
 * Corporate decision (follow-up Q15, 07/10/2026): the old rule (₦10,000
 * contributed in a month takes one month off) is replaced. A member in a
 * CSP waiting period has it reduced to 6 months once their total
 * contribution during the waiting period reaches a multiplier (default 3x,
 * admin setting) of everything they themselves contributed before they
 * received support. This reuses the CspWaitReductionLog table with a fixed
 * sentinel monthKey (no schema change): amountContrib holds the running
 * cumulative total during this cooldown, monthReduced marks whether the
 * reduction has already been applied (so it only fires once).
 */
const WAIT_REDUCTION_3X_KEY = "3X-TOTAL";
const WAIT_REDUCTION_TARGET_MONTHS = 6;

async function trackWaitReduction(
  prisma: PrismaClient,
  contributorId: string,
  contributionAmount: number,
): Promise<void> {
  try {
    // Check if tier model is enabled
    const tierModelRow = await prisma.adminSettings.findUnique({
      where: { settingKey: "csp_tier_model_enabled" },
    });
    const tierModelEnabled = tierModelRow?.settingValue === "true";

    // Load the multiplier (default 3x)
    const multiplierRow = await prisma.adminSettings.findUnique({
      where: { settingKey: "csp_wait_reduction_multiplier" },
    });
    const multiplier = multiplierRow ? parseFloat(multiplierRow.settingValue) : 3;
    if (!Number.isFinite(multiplier) || multiplier <= 0) return;

    const now = new Date();

    // Find the contributor's active cooldown
    let cooldownRequestId: string | null = null;
    let activeCooldownEndsAt: Date | null = null;
    let cooldownStartedAt: Date | null = null;

    if (tierModelEnabled) {
      const standing = await prisma.cspMemberStanding.findUnique({
        where: { userId: contributorId },
        select: { coolingEndsAt: true, lastSupportReleasedAt: true },
      });
      if (!standing?.coolingEndsAt || standing.coolingEndsAt <= now) return;

      const activeCooldownRequest = await prisma.cspSupportRequest.findFirst({
        where: {
          userId: contributorId,
          status: { in: ["closed", "released"] },
          fulfilledAt: { not: null },
        },
        orderBy: { fulfilledAt: "desc" },
        select: { id: true, fulfilledAt: true },
      });
      cooldownRequestId = activeCooldownRequest?.id ?? null;
      activeCooldownEndsAt = standing.coolingEndsAt;
      cooldownStartedAt = standing.lastSupportReleasedAt ?? activeCooldownRequest?.fulfilledAt ?? null;
    } else {
      const activeCooldown = await prisma.cspSupportRequest.findFirst({
        where: {
          userId: contributorId,
          status: "released",
          cooldownEndsAt: { gt: now },
        },
        orderBy: { releasedAt: "desc" },
        select: { id: true, cooldownEndsAt: true, releasedAt: true },
      });
      if (!activeCooldown?.cooldownEndsAt) return;
      cooldownRequestId = activeCooldown.id;
      activeCooldownEndsAt = activeCooldown.cooldownEndsAt;
      cooldownStartedAt = activeCooldown.releasedAt ?? null;
    }

    if (!cooldownRequestId || !activeCooldownEndsAt || !cooldownStartedAt) return;

    const existing = await prisma.cspWaitReductionLog.findUnique({
      where: {
        userId_requestId_monthKey: {
          userId: contributorId,
          requestId: cooldownRequestId,
          monthKey: WAIT_REDUCTION_3X_KEY,
        },
      },
    });
    const alreadyApplied = existing?.monthReduced ?? false;
    if (alreadyApplied) return;

    const cumulativeDuringCooldown = Math.round((existing?.amountContrib ?? 0) + contributionAmount);

    // Everything this member contributed to other campaigns before they
    // themselves received support (corporate decision, follow-up Q15).
    const preSupportAgg = await prisma.cspContribution.aggregate({
      where: { contributorId, createdAt: { lt: cooldownStartedAt } },
      _sum: { amount: true },
    });
    const preSupportTotal = preSupportAgg._sum.amount ?? 0;
    const target = preSupportTotal * multiplier;
    const hitTarget = target > 0 && cumulativeDuringCooldown >= target;

    await prisma.cspWaitReductionLog.upsert({
      where: {
        userId_requestId_monthKey: {
          userId: contributorId,
          requestId: cooldownRequestId,
          monthKey: WAIT_REDUCTION_3X_KEY,
        },
      },
      update: { amountContrib: cumulativeDuringCooldown, monthReduced: hitTarget, updatedAt: now },
      create: {
        userId: contributorId,
        requestId: cooldownRequestId,
        monthKey: WAIT_REDUCTION_3X_KEY,
        amountContrib: cumulativeDuringCooldown,
        monthReduced: hitTarget,
      },
    });

    if (hitTarget) {
      const newCooldownEnd = new Date(cooldownStartedAt);
      newCooldownEnd.setMonth(newCooldownEnd.getMonth() + WAIT_REDUCTION_TARGET_MONTHS);
      // Never lengthen the cooldown — only apply if it's actually sooner.
      if (newCooldownEnd < activeCooldownEndsAt) {
        if (tierModelEnabled) {
          await prisma.cspMemberStanding.update({
            where: { userId: contributorId },
            data: { coolingEndsAt: newCooldownEnd, coolingMonthsBase: WAIT_REDUCTION_TARGET_MONTHS },
          });
        } else {
          await prisma.cspSupportRequest.update({
            where: { id: cooldownRequestId },
            data: { cooldownEndsAt: newCooldownEnd, cooldownMonths: WAIT_REDUCTION_TARGET_MONTHS },
          });
        }
      }
    }
  } catch (err) {
    console.error(`[CSP_AUTO_CONTRIBUTE] Wait-reduction tracking failed for user ${contributorId}:`, err);
  }
}
