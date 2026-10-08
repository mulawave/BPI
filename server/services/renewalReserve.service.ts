/**
 * Renewal Reserve
 *
 * Corporate decisions (Q13/Q18, 29/09/2026; follow-up Q5-Q7, 06-07/10/2026):
 * - A second balance on User (`reserve`), fed by a share of Auto-Debit on
 *   activation, renewal and upgrade referral commissions and the CSP sponsor
 *   share ("reward" credits only — deposits and released CSP funds go in
 *   full to the Community Wallet, never to the Reserve).
 * - The Auto-Debit amount on those credits is split 70% Community Wallet /
 *   30% Renewal Reserve by default (admin setting, members may choose a
 *   higher overall Auto-Debit percentage).
 * - Membership renewal is paid from the Reserve first, then the Main Wallet
 *   for any shortfall.
 * - A member may only move the amount ABOVE the admin-set floor (default
 *   ₦500,000) from the Reserve to the Main Wallet; the floor itself always
 *   stays locked in the Reserve.
 */

import { randomUUID } from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

export type RenewalReservePolicy = {
  /** Share of an eligible Auto-Debit amount that goes to the Reserve instead of the Community Wallet. */
  reservePercentOfAutoDebit: number;
  /** Balance that always stays locked in the Reserve; only the amount above this can be withdrawn. */
  withdrawalFloor: number;
};

export const RENEWAL_RESERVE_POLICY_KEYS = {
  reservePercentOfAutoDebit: "renewal_reserve_percent_of_autodebit",
  withdrawalFloor: "renewal_reserve_withdrawal_floor",
} as const;

export const DEFAULT_RENEWAL_RESERVE_POLICY: RenewalReservePolicy = {
  reservePercentOfAutoDebit: 30,
  withdrawalFloor: 500000,
};

export async function loadRenewalReservePolicy(db: TxClient): Promise<RenewalReservePolicy> {
  const rows = await db.adminSettings.findMany({
    where: { settingKey: { in: Object.values(RENEWAL_RESERVE_POLICY_KEYS) } },
    select: { settingKey: true, settingValue: true },
  });
  const map = new Map(rows.map((r) => [r.settingKey, r.settingValue]));
  const pct = Number(map.get(RENEWAL_RESERVE_POLICY_KEYS.reservePercentOfAutoDebit));
  const floor = Number(map.get(RENEWAL_RESERVE_POLICY_KEYS.withdrawalFloor));
  return {
    reservePercentOfAutoDebit: Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : DEFAULT_RENEWAL_RESERVE_POLICY.reservePercentOfAutoDebit,
    withdrawalFloor: Number.isFinite(floor) && floor >= 0 ? floor : DEFAULT_RENEWAL_RESERVE_POLICY.withdrawalFloor,
  };
}

/** Given a reward Auto-Debit amount, how much goes to the Reserve vs stays in the Community Wallet split. */
export function splitAutoDebitForReserve(
  autoDebitAmount: number,
  policy: RenewalReservePolicy = DEFAULT_RENEWAL_RESERVE_POLICY,
): { toCommunity: number; toReserve: number } {
  if (!Number.isFinite(autoDebitAmount) || autoDebitAmount <= 0) return { toCommunity: 0, toReserve: 0 };
  const toReserve = Math.floor(autoDebitAmount * (Math.min(Math.max(policy.reservePercentOfAutoDebit, 0), 100) / 100));
  const toCommunity = autoDebitAmount - toReserve;
  return { toCommunity, toReserve };
}

/** How much of a Reserve balance a member may move to the Main Wallet (only the amount above the floor). */
export function withdrawableReserveAmount(reserveBalance: number, policy: RenewalReservePolicy = DEFAULT_RENEWAL_RESERVE_POLICY): number {
  return Math.max(0, Math.floor(reserveBalance - policy.withdrawalFloor));
}

/**
 * Moves the withdrawable excess (above the floor) from a member's Reserve to
 * their Main Wallet. Returns the amount moved (0 if nothing was movable).
 */
export async function withdrawReserveExcess(
  prisma: PrismaClient,
  input: { userId: string; amount?: number },
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { reserve: true } });
    if (!user) return 0;
    const policy = await loadRenewalReservePolicy(tx);
    const maxWithdrawable = withdrawableReserveAmount(user.reserve, policy);
    const amount = input.amount != null ? Math.min(Math.max(0, Math.floor(input.amount)), maxWithdrawable) : maxWithdrawable;
    if (amount <= 0) return 0;

    await tx.user.update({ where: { id: input.userId }, data: { reserve: { decrement: amount }, wallet: { increment: amount } } });
    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        transactionType: "RESERVE_TO_MAIN_WALLET",
        amount: -amount,
        description: `Moved ₦${amount.toLocaleString()} from Renewal Reserve to Main Wallet (above the ₦${policy.withdrawalFloor.toLocaleString()} floor)`,
        status: "completed",
        walletType: "reserve",
      },
    });
    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        transactionType: "RESERVE_TO_MAIN_WALLET",
        amount,
        description: `Received ₦${amount.toLocaleString()} from Renewal Reserve`,
        status: "completed",
        walletType: "main",
      },
    });
    return amount;
  });
}

/**
 * Debits the Renewal Reserve first, then the Main Wallet for any shortfall,
 * for a renewal payment of `totalCost`. Never goes below zero on either
 * balance. Returns how much was taken from each. Must run inside the
 * caller's renewal transaction.
 */
export async function debitForRenewal(
  tx: TxClient,
  input: { userId: string; totalCost: number },
): Promise<{ fromReserve: number; fromWallet: number }> {
  const user = await tx.user.findUnique({ where: { id: input.userId }, select: { reserve: true, wallet: true } });
  if (!user) throw new Error("User not found");
  const fromReserve = Math.min(Math.max(0, user.reserve), input.totalCost);
  const fromWallet = input.totalCost - fromReserve;
  if (fromWallet > user.wallet) {
    throw new Error("Insufficient balance across Renewal Reserve and Main Wallet for this renewal");
  }
  await tx.user.update({
    where: { id: input.userId },
    data: {
      ...(fromReserve > 0 ? { reserve: { decrement: fromReserve } } : {}),
      ...(fromWallet > 0 ? { wallet: { decrement: fromWallet } } : {}),
    },
  });
  if (fromReserve > 0) {
    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        transactionType: "RENEWAL_FROM_RESERVE",
        amount: -fromReserve,
        description: `₦${fromReserve.toLocaleString()} of this renewal paid from the Renewal Reserve`,
        status: "completed",
        walletType: "reserve",
      },
    });
  }
  return { fromReserve, fromWallet };
}
