// @ts-nocheck
/**
 * Wallet Auto-Debit Service
 *
 * Automatically transfers a user-configured percentage from the cash/main wallet
 * to their community wallet whenever a qualifying credit event occurs.
 *
 * Qualifying events:
 * - Referral rewards credited to cash wallet (always, if enabled)
 * - Deposits/top-ups (only if user opted in via applyToDeposits)
 */

import { randomUUID } from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

export type AutoDebitTrigger = "reward" | "deposit";

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

  if (creditAmount <= 0) return { transferred: 0, shouldTriggerCspAutoContribute: false };

  const setting = await prisma.walletAutoDebitSetting.findUnique({
    where: { userId },
  });

  if (!setting || !setting.isEnabled) return { transferred: 0, shouldTriggerCspAutoContribute: false };

  // Check if the trigger type is applicable
  if (trigger === "deposit" && !setting.applyToDeposits) return { transferred: 0, shouldTriggerCspAutoContribute: false };
  if (trigger === "reward" && !setting.applyToRewards) return { transferred: 0, shouldTriggerCspAutoContribute: false };

  const percentage = Math.min(Math.max(setting.percentage, 1), 100);
  const debitAmount = Math.floor(creditAmount * (percentage / 100));

  if (debitAmount <= 0) return { transferred: 0, shouldTriggerCspAutoContribute: false };

  // Check if user has sufficient balance in main wallet
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wallet: true },
  });

  if (!user || user.wallet < debitAmount) return { transferred: 0, shouldTriggerCspAutoContribute: false };

  // Debit main wallet, credit community wallet
  await prisma.user.update({
    where: { id: userId },
    data: {
      wallet: { decrement: debitAmount },
      community: { increment: debitAmount },
    },
  });

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
    // Fetch updated community wallet balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { community: true },
    });

    if (updatedUser) {
      const communityBalance = updatedUser.community;

      // Case 1: Already enabled and balance meets minimum
      if (cspSetting.isEnabled && communityBalance >= (cspSetting.minAmountPerRequest ?? 500)) {
        shouldTriggerCspAutoContribute = true;
      }
      // Case 2: Disabled but minAmountPerRequest is set (previously configured, disabled due to no funds)
      else if (!cspSetting.isEnabled && (cspSetting.minAmountPerRequest ?? 0) > 0 && communityBalance >= (cspSetting.minAmountPerRequest ?? 500)) {
        // Re-enable the setting
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
