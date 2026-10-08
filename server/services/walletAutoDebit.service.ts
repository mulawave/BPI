/**
 * Wallet Auto-Debit Service
 *
 * Automatically transfers a user-configured percentage from the cash/main wallet
 * to their community wallet whenever a qualifying credit event occurs.
 *
 * Corporate decisions (29/09 and 06/10/2026):
 * - Auto-Debit is compulsory for every member and cannot be switched off. The
 *   minimum percentage is an admin setting (`auto_debit_min_percentage`,
 *   default 10); members may choose a higher percentage.
 * - It applies to activation, upgrade and renewal referral rewards and the CSP
 *   sponsor share ("reward"), to the funds a beneficiary receives when their
 *   CSP campaign is released ("csp_payout", admin setting
 *   `auto_debit_csp_payout_enabled`), and to deposits when the member opted in
 *   ("deposit", admin setting `auto_debit_deposits_enabled`).
 * - Moving money between a member's own wallets never triggers it.
 * - Failures are recorded in the audit log for the admin alerts page.
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
import { loadRenewalReservePolicy, splitAutoDebitForReserve, DEFAULT_RENEWAL_RESERVE_POLICY } from "@/server/services/renewalReserve.service";

type TxClient = PrismaClient | Prisma.TransactionClient;

export type AutoDebitTrigger = "reward" | "deposit" | "csp_payout";

export type AutoDebitSettingLike = { isEnabled: boolean; percentage: number; applyToDeposits: boolean; applyToRewards: boolean };

export type AutoDebitPolicy = {
  /** Compulsory minimum percentage. 0 makes Auto-Debit optional again. */
  minPercentage: number;
  /**
   * Percentage a member starts at before they have saved their own choice
   * (corporate decision, follow-up Q5). Must be >= minPercentage.
   */
  startingPercentage: number;
  /** Whether members may apply Auto-Debit to deposits at all. */
  depositsEnabled: boolean;
  /** Whether Auto-Debit applies to released CSP funds. */
  cspPayoutEnabled: boolean;
};

export const AUTO_DEBIT_POLICY_KEYS = {
  minPercentage: "auto_debit_min_percentage",
  startingPercentage: "auto_debit_starting_percentage",
  depositsEnabled: "auto_debit_deposits_enabled",
  cspPayoutEnabled: "auto_debit_csp_payout_enabled",
} as const;

export const DEFAULT_AUTO_DEBIT_POLICY: AutoDebitPolicy = {
  minPercentage: 10,
  startingPercentage: 15,
  depositsEnabled: true,
  cspPayoutEnabled: true,
};

export async function loadAutoDebitPolicy(db: TxClient): Promise<AutoDebitPolicy> {
  const rows = await db.adminSettings.findMany({
    where: { settingKey: { in: Object.values(AUTO_DEBIT_POLICY_KEYS) } },
    select: { settingKey: true, settingValue: true },
  });
  const map = new Map(rows.map((r) => [r.settingKey, r.settingValue]));
  const min = Number(map.get(AUTO_DEBIT_POLICY_KEYS.minPercentage));
  const starting = Number(map.get(AUTO_DEBIT_POLICY_KEYS.startingPercentage));
  const bool = (key: string, def: boolean) => {
    const v = map.get(key);
    return v == null ? def : v === "true";
  };
  const minPercentage = Number.isFinite(min) && min >= 0 && min <= 100 ? min : DEFAULT_AUTO_DEBIT_POLICY.minPercentage;
  const startingPercentage = Number.isFinite(starting) && starting >= 0 && starting <= 100
    ? Math.max(starting, minPercentage)
    : Math.max(DEFAULT_AUTO_DEBIT_POLICY.startingPercentage, minPercentage);
  return {
    minPercentage,
    startingPercentage,
    depositsEnabled: bool(AUTO_DEBIT_POLICY_KEYS.depositsEnabled, DEFAULT_AUTO_DEBIT_POLICY.depositsEnabled),
    cspPayoutEnabled: bool(AUTO_DEBIT_POLICY_KEYS.cspPayoutEnabled, DEFAULT_AUTO_DEBIT_POLICY.cspPayoutEnabled),
  };
}

/**
 * The percentage actually applied: the member's choice, raised to the
 * compulsory minimum. A member with no saved setting yet starts at the
 * admin's starting percentage (corporate decision, follow-up Q5), not just
 * the bare minimum. When the admin minimum is 0, Auto-Debit is optional and
 * only applies to members who switched it on.
 */
export function effectiveAutoDebitPercentage(
  setting: AutoDebitSettingLike | null | undefined,
  policy: AutoDebitPolicy = DEFAULT_AUTO_DEBIT_POLICY,
): number {
  const min = Math.min(Math.max(policy.minPercentage, 0), 100);
  if (!setting) return min > 0 ? Math.min(Math.max(policy.startingPercentage, min), 100) : 0;
  const chosen = setting.isEnabled || min > 0 ? setting.percentage : 0;
  return Math.min(Math.max(chosen, min), 100);
}

/** Pure helper: how much should be moved for a credit, given the user's setting and the admin policy. */
export function computeAutoDebitAmount(
  setting: AutoDebitSettingLike | null | undefined,
  creditAmount: number,
  trigger: AutoDebitTrigger,
  policy: AutoDebitPolicy = DEFAULT_AUTO_DEBIT_POLICY,
): number {
  if (!Number.isFinite(creditAmount) || creditAmount <= 0) return 0;
  // Deposits stay opt-in: the member must have chosen it, and admins may switch it off for everyone.
  if (trigger === "deposit" && (!policy.depositsEnabled || !setting?.isEnabled || !setting.applyToDeposits)) return 0;
  if (trigger === "csp_payout" && !policy.cspPayoutEnabled) return 0;
  const percentage = effectiveAutoDebitPercentage(setting, policy);
  if (percentage <= 0) return 0;
  return Math.floor(creditAmount * (percentage / 100));
}

const TRIGGER_LABEL: Record<AutoDebitTrigger, string> = {
  reward: "reward",
  deposit: "deposit",
  csp_payout: "CSP support received",
};

/**
 * Records an Auto-Debit or Auto-Contribute failure for the admin alerts page.
 * Best-effort: never throws.
 */
export async function recordAutomationFailure(
  db: TxClient,
  input: { userId: string; kind: "AUTO_DEBIT_FAILED" | "AUTO_CONTRIBUTE_FAILED"; reason: string; context: string; amount?: number },
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        action: input.kind,
        entity: "User",
        entityId: input.userId,
        metadata: { reason: input.reason, context: input.context, amount: input.amount ?? null },
        status: "failed",
        errorMessage: input.reason,
        createdAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`[AUTO-DEBIT] Could not record ${input.kind} for ${input.userId}:`, err);
  }
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
}): Promise<{ transferred: number; shouldTriggerCspAutoContribute: boolean; insufficientBalance?: boolean }> {
  const { prisma, userId, creditAmount, trigger } = params;

  const [setting, policy] = await Promise.all([
    prisma.walletAutoDebitSetting.findUnique({ where: { userId } }),
    loadAutoDebitPolicy(prisma),
  ]);

  const debitAmount = computeAutoDebitAmount(setting, creditAmount, trigger, policy);
  if (debitAmount <= 0) return { transferred: 0, shouldTriggerCspAutoContribute: false };
  const percentage = effectiveAutoDebitPercentage(setting, policy);

  // Corporate decision (follow-up Q6): only "reward" credits (referral
  // commissions, CSP sponsor share) feed the Renewal Reserve. Deposits and
  // released CSP funds go to the Community Wallet in full.
  const reservePolicy = trigger === "reward" ? await loadRenewalReservePolicy(prisma) : DEFAULT_RENEWAL_RESERVE_POLICY;
  const { toCommunity, toReserve } = trigger === "reward"
    ? splitAutoDebitForReserve(debitAmount, reservePolicy)
    : { toCommunity: debitAmount, toReserve: 0 };

  // Atomic conditional move: only succeeds if the cash wallet still holds the
  // amount at write time, so concurrent withdrawals can never drive it negative.
  const moved = await prisma.user.updateMany({
    where: { id: userId, wallet: { gte: debitAmount } },
    data: {
      wallet: { decrement: debitAmount },
      community: { increment: toCommunity },
      ...(toReserve > 0 ? { reserve: { increment: toReserve } } : {}),
    },
  });

  if (moved.count === 0) return { transferred: 0, shouldTriggerCspAutoContribute: false, insufficientBalance: true };

  // Record the transfer transaction
  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "AUTO_DEBIT_TO_COMMUNITY",
      amount: -debitAmount,
      description: `Auto-transfer ${percentage}% of ₦${creditAmount.toLocaleString()} to Community Wallet${toReserve > 0 ? " and Renewal Reserve" : ""} (${TRIGGER_LABEL[trigger]})`,
      status: "completed",
      walletType: "main",
    },
  });

  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "AUTO_DEBIT_TO_COMMUNITY",
      amount: toCommunity,
      description: `Auto-transfer received from Cash Wallet (${percentage}% of ₦${creditAmount.toLocaleString()})`,
      status: "completed",
      walletType: "community",
    },
  });

  if (toReserve > 0) {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "AUTO_DEBIT_TO_RESERVE",
        amount: toReserve,
        description: `Auto-transfer to Renewal Reserve (${reservePolicy.reservePercentOfAutoDebit}% of this Auto-Debit)`,
        status: "completed",
        walletType: "reserve",
      },
    });
  }

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
    if (result.insufficientBalance) {
      await recordAutomationFailure(prisma, {
        userId,
        kind: "AUTO_DEBIT_FAILED",
        reason: "Cash Wallet balance was too low when the Auto-Debit ran",
        context,
        amount: creditAmount,
      });
    }
    if (result.shouldTriggerCspAutoContribute) {
      try {
        await runCspAutoContribute({ prisma, userId });
      } catch (err) {
        console.error(`[AUTO-DEBIT] CSP auto-contribute failed for ${userId} (${context}):`, err);
        await recordAutomationFailure(prisma, {
          userId,
          kind: "AUTO_CONTRIBUTE_FAILED",
          reason: err instanceof Error ? err.message : String(err),
          context,
        });
      }
    }
  } catch (err) {
    console.error(`[AUTO-DEBIT] Auto-debit failed for ${userId} (${context}); credit already committed:`, err);
    await recordAutomationFailure(prisma, {
      userId,
      kind: "AUTO_DEBIT_FAILED",
      reason: err instanceof Error ? err.message : String(err),
      context,
      amount: creditAmount,
    });
  }
  return { transferred };
}
