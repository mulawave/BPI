// @ts-nocheck
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
 * - Sends notification after each successful contribution
 * - If balance reaches 0, disables auto-contribute and notifies user
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

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
    select: { community: true },
  });

  if (!user || user.community < minAmountPerRequest) {
    // Disable auto-contribute and notify
    await prisma.cspAutoContributeSetting.update({
      where: { userId },
      data: { isEnabled: false },
    });

    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId,
        title: "Auto-Contribute Paused",
        message: "Your CSP auto-contribute has been paused due to insufficient community wallet balance. Please fund your community wallet and re-activate auto-contribute.",
        type: "csp",
        isRead: false,
      },
    });

    return { totalContributed: 0, requestsContributed: 0, disabledDueToBalance: true };
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

  // Round-robin: contribute minAmountPerRequest to each request, repeat until done
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;

    for (const request of targetRequests) {
      if (currentBalance < minAmountPerRequest) {
        // Out of funds — disable
        disabledDueToBalance = true;
        break;
      }

      const alreadyContributed = contribByRequest.get(request.id) ?? 0;
      const remaining = maxAmountPerRequest - alreadyContributed;
      if (remaining <= 0) continue;

      const contributeAmount = Math.min(minAmountPerRequest, remaining, Math.floor(currentBalance));
      if (contributeAmount < 1) continue;

      // Execute the contribution in a transaction
      const balanceBefore = currentBalance;
      await prisma.$transaction(async (tx) => {
        // Debit community wallet
        await tx.user.update({
          where: { id: userId },
          data: { community: { decrement: contributeAmount } },
        });

        // Create CSP contribution record (same as manual)
        await tx.cspContribution.create({
          data: {
            requestId: request.id,
            contributorId: userId,
            amount: contributeAmount,
            walletType: "community",
          },
        });

        // Update request raised amount
        const newRaised = request.raisedAmount + (totalContributed > 0 ? contributeAmount : contributeAmount);
        await tx.cspSupportRequest.update({
          where: { id: request.id },
          data: {
            raisedAmount: { increment: contributeAmount },
            contributorsCount: { increment: 1 },
            status: (request.raisedAmount + contributeAmount) >= request.thresholdAmount
              ? "ready_for_release"
              : request.status,
          },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "CSP_AUTO_CONTRIBUTION",
            amount: -contributeAmount,
            description: `Auto-contribute to CSP request ${request.id}`,
            status: "completed",
            walletType: "community",
          },
        });

        // Log
        await tx.cspAutoContributeLog.create({
          data: {
            userId,
            requestId: request.id,
            amount: contributeAmount,
            balanceBefore,
            balanceAfter: balanceBefore - contributeAmount,
          },
        });
      });

      currentBalance -= contributeAmount;
      totalContributed += contributeAmount;
      contribByRequest.set(request.id, alreadyContributed + contributeAmount);
      requestsContributed++;
      madeProgress = true;

      // Notify user of successful contribution
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId,
          title: "Auto-Contribute Successful",
          message: `₦${contributeAmount.toLocaleString()} auto-contributed to a CSP request. Community wallet balance: ₦${currentBalance.toLocaleString()}.`,
          type: "csp",
          isRead: false,
        },
      });
    }

    if (disabledDueToBalance) break;
  }

  // If balance exhausted, disable and notify
  if (disabledDueToBalance) {
    await prisma.cspAutoContributeSetting.update({
      where: { userId },
      data: { isEnabled: false },
    });

    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId,
        title: "Auto-Contribute Paused — No Balance",
        message: "Your CSP auto-contribute has been paused because your community wallet has insufficient funds. Please top up and re-activate when ready.",
        type: "csp",
        isRead: false,
      },
    });
  }

  return { totalContributed, requestsContributed, disabledDueToBalance };
}
