/**
 * Wallet Auto-Debit Service
 *
 * Automatically transfers a user-configured percentage from the cash/main wallet
 * to their community wallet whenever a qualifying credit event occurs.
 *
 * Qualifying events:
 * - Referral rewards credited to cash wallet (always, if enabled)
 * - Deposits/top-ups (only if user opted in via applyToDeposits)
 *
 * Every path that credits a qualifying amount to the cash wallet must call
 * `processWalletAutoDebit` (inside its transaction) or
 * `runPostCreditAutomation` (after commit). Deposits fulfilled by the Paystack /
 * Flutterwave webhooks, the payment verification page, the stuck-payment
 * recovery cron and admin approval all go through `runPostCreditAutomation`.
 */

import { randomUUID } from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";
import { runCspAutoContribute } from "@/server/services/cspAutoContribute.service";

type TxClient = PrismaClient | Prisma.TransactionClient;

export type AutoDebitTrigger = "reward" | "deposit";

/** Pure helper: how much should be moved for a credit, given the user's setting. */
export function computeAutoDebitAmount(
  setting: { isEnabled: boolean; percentage: number; applyToDeposits: boolean; applyToRewards: boolean } | null | undefined,
  creditAmount: number,
  trigger: AutoDebitTrigger,
): number {
  if (!setting || !setting.isEnabled) return 0;
  if (!Number.isFinite(creditAmount) || creditAmount <= 0) return 0;
  if (trigger === "deposit" && !setting.applyToDeposits) return 0;
  if (trigger === "reward" && !setting.applyToRewards) return 0;
  const percentage = Math.min(Math.max(setting.percentage, 1), 100);
  return Math.floor(creditAmount * (percentage / 100));
}

/**
 * Attempts to auto-debit from cash wallet to community wallet.
 * Returns the amount transferred and whether CSP auto-contribute should be triggered.
 */
export async function processWalletAutoDebit(params: {
  prisma: TxClient;
  userId: string;
  creditAmount: number;
  trigger: AutoDebitTrigger;
}): Promise<{ transferred: number; shouldTriggerCspAutoContribute: boolean }> {
  const { prisma, userId, creditAmount, trigger } = params;

  const setting = await prisma.walletAutoDebitSetting.findUnique({
    where: { userId },
  });

  const debitAmount = computeAutoDebitAmount(setting, creditAmount, trigger);
  if (!setting || debitAmount <= 0) return { transferred: 0, shouldTriggerCspAutoContribute: false };
  const percentage = Math.min(Math.max(setting.percentage, 1), 100);

  // Atomic conditional move: only succeeds if the cash wallet still holds the
  // amount at write time, so concurrent withdrawals can never drive it negative.
  const moved = await prisma.user.updateMany({
    where: { id: userId, wallet: { gte: debitAmount } },
    data: {
      wallet: { decrement: debitAmount },
      community: { increment: debitAmount },
    },
  });

  if (moved.count === 0) return { transferred: 0, shouldTriggerCspAutoContribute: false };

  // Record the transfer transaction
  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "AUTO_DEBIT_TO_COMMUNITY",
      amount: -debitAmount,
      description: `Auto-transfer ${percentage}% of ₦${creditAmount.toLocaleString()} to Community Wallet (${trigger})`,
      status: "completed",
      walletType: "main",
    },
  });

  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "AUTO_DEBIT_TO_COMMUNITY",
      amount: debitAmount,
      description: `Auto-transfer received from Cash Wallet (${percentage}% of ₦${creditAmount.toLocaleString()})`,
      status: "completed",
      walletType: "community",
    },
  });

  // Check if CSP auto-contribute should be triggered
  let shouldTriggerCspAutoContribute = false;
  const cspSetting = await prisma.cspAutoContributeSetting.findUnique({
    where: { userId },
  });

  if (cspSetting) {
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { community: true },
    });

    if (updatedUser) {
      const communityBalance = updatedUser.community;
      const minimum = cspSetting.minAmountPerRequest ?? 500;

      // Case 1: Already enabled and balance meets minimum
      if (cspSetting.isEnabled && communityBalance >= minimum) {
        shouldTriggerCspAutoContribute = true;
      }
      // Case 2: Disabled but previously configured (disabled due to no funds)
      else if (!cspSetting.isEnabled && (cspSetting.minAmountPerRequest ?? 0) > 0 && communityBalance >= minimum) {
        await prisma.cspAutoContributeSetting.update({
          where: { userId },
          data: { isEnabled: true },
        });
        shouldTriggerCspAutoContribute = true;
      }
    }
  }

  return { transferred: debitAmount, shouldTriggerCspAutoContribute };
}

/**
 * Post-commit automation for a cash-wallet credit: runs auto-debit and, when
 * applicable, CSP auto-contribute. Best-effort — never throws, because the
 * underlying credit has already been committed.
 */
export async function runPostCreditAutomation(params: {
  prisma: PrismaClient;
  userId: string;
  creditAmount: number;
  trigger: AutoDebitTrigger;
  context: string;
}): Promise<{ transferred: number }> {
  const { prisma, userId, creditAmount, trigger, context } = params;
  let transferred = 0;
  try {
    const result = await prisma.$transaction((tx) =>
      processWalletAutoDebit({ prisma: tx, userId, creditAmount, trigger })
    );
    transferred = result.transferred;
    if (result.shouldTriggerCspAutoContribute) {
      try {
        await runCspAutoContribute({ prisma, userId });
      } catch (err) {
        console.error(`[AUTO-DEBIT] CSP auto-contribute failed for ${userId} (${context}):`, err);
      }
    }
  } catch (err) {
    console.error(`[AUTO-DEBIT] Auto-debit failed for ${userId} (${context}); credit already committed:`, err);
  }
  return { transferred };
}
