/**
 * CSP top-up (time extension).
 *
 * Corporate decision (follow-up Q13, 07/10/2026): a member can buy extra
 * broadcast time — 24 or 48 hours, prices set by admin — either from their
 * own Main Wallet or by depositing first and then paying from the wallet
 * (covers "either" payment source without a bespoke checkout integration).
 * The fee goes to the member's own Community Wallet and the extension only
 * takes effect once that same amount has been contributed (manually or by
 * Auto-Contribute) to a live campaign before its countdown ends; those
 * contributions do not count towards the member's own tier. A maximum of
 * 48 extra hours may be applied per request. A "pre-extension" bought
 * before the member has a request is attached to their next request and
 * forfeited if not used then.
 */

import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

export const CSP_TOPUP_SETTINGS_KEYS = {
  enabled: "csp_topup_enabled",
  price24h: "csp_topup_price_24h",
  price48h: "csp_topup_price_48h",
  maxExtraHours: "csp_topup_max_extra_hours",
} as const;

export type CspTopUpSettings = {
  enabled: boolean;
  price24h: number;
  price48h: number;
  maxExtraHours: number;
};

export const DEFAULT_CSP_TOPUP_SETTINGS: CspTopUpSettings = {
  enabled: false,
  price24h: 10000,
  price48h: 20000,
  maxExtraHours: 48,
};

export async function loadCspTopUpSettings(db: TxClient): Promise<CspTopUpSettings> {
  const rows = await db.adminSettings.findMany({ where: { settingKey: { in: Object.values(CSP_TOPUP_SETTINGS_KEYS) } } });
  const map = new Map(rows.map((r) => [r.settingKey, r.settingValue]));
  const num = (key: string, def: number) => {
    const v = Number(map.get(key));
    return Number.isFinite(v) && v >= 0 ? v : def;
  };
  return {
    enabled: map.get(CSP_TOPUP_SETTINGS_KEYS.enabled) === "true",
    price24h: num(CSP_TOPUP_SETTINGS_KEYS.price24h, DEFAULT_CSP_TOPUP_SETTINGS.price24h),
    price48h: num(CSP_TOPUP_SETTINGS_KEYS.price48h, DEFAULT_CSP_TOPUP_SETTINGS.price48h),
    maxExtraHours: num(CSP_TOPUP_SETTINGS_KEYS.maxExtraHours, DEFAULT_CSP_TOPUP_SETTINGS.maxExtraHours),
  };
}

export function priceForHours(settings: CspTopUpSettings, hours: 24 | 48): number {
  return hours === 24 ? settings.price24h : settings.price48h;
}

/**
 * Buys a top-up, paid from the Main Wallet. Attaches it to `requestId`
 * (the member's own live request) or leaves it unattached as a
 * pre-extension when `requestId` is omitted.
 */
export async function purchaseTopUp(
  prisma: PrismaClient,
  input: { userId: string; hours: 24 | 48; requestId?: string },
): Promise<{ purchaseId: string; amountPaid: number }> {
  const settings = await loadCspTopUpSettings(prisma);
  if (!settings.enabled) throw new Error("Time extensions are not available right now.");
  const amountPaid = priceForHours(settings, input.hours);

  if (input.requestId) {
    const request = await prisma.cspSupportRequest.findUnique({
      where: { id: input.requestId },
      select: { userId: true, status: true, isSpecialSupport: true },
    });
    if (!request || request.userId !== input.userId) throw new Error("Request not found.");
    if (request.isSpecialSupport) throw new Error("Time extensions do not apply to Special Community Support campaigns.");
    if (request.status !== "broadcasting") throw new Error("This request is not currently broadcasting.");

    const appliedHours = await sumAppliedHours(prisma, input.requestId);
    if (appliedHours + input.hours > settings.maxExtraHours) {
      throw new Error(`This request already has ${appliedHours}h of extra time; the maximum is ${settings.maxExtraHours}h.`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const debited = await tx.user.updateMany({
      where: { id: input.userId, wallet: { gte: amountPaid } },
      data: { wallet: { decrement: amountPaid } },
    });
    if (debited.count === 0) throw new Error("Insufficient Main Wallet balance for this time extension.");

    const purchase = await tx.cspTopUpPurchase.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        requestId: input.requestId ?? null,
        hours: input.hours,
        amountPaid,
        paidFrom: "wallet",
        status: "pending",
      },
    });

    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        transactionType: "CSP_TOPUP_PURCHASE",
        amount: -amountPaid,
        description: `Bought a ${input.hours}h CSP time extension`,
        status: "completed",
        walletType: "main",
        reference: `CSP-TOPUP-${purchase.id}`,
      },
    });

    return { purchaseId: purchase.id, amountPaid };
  });
}

async function sumAppliedHours(db: TxClient, requestId: string): Promise<number> {
  const rows = await db.cspTopUpPurchase.findMany({
    where: { requestId, status: "applied" },
    select: { hours: true },
  });
  return rows.reduce((sum, r) => sum + r.hours, 0);
}

/**
 * Attaches the member's oldest unattached pre-extension to a newly created
 * request, per corporate decision: valid only for the member's next request.
 * Any other unattached pre-extensions the member may still have are left
 * alone (and forfeited when that request's countdown ends, never carried
 * further).
 */
export async function attachPreExtension(tx: TxClient, input: { userId: string; requestId: string }): Promise<void> {
  const pre = await tx.cspTopUpPurchase.findFirst({
    where: { userId: input.userId, requestId: null, status: "pending" },
    orderBy: { purchasedAt: "asc" },
  });
  if (!pre) return;
  await tx.cspTopUpPurchase.update({ where: { id: pre.id }, data: { requestId: input.requestId } });
}

/**
 * Called after a contribution is recorded. If the contributor has a pending
 * top-up purchase on this request and their contributions to it (since
 * buying the extension) now cover the fee, apply the extra hours to the
 * broadcast countdown (capped at the admin maximum) and mark it applied.
 */
export async function tryApplyTopUp(
  tx: TxClient,
  input: { requestId: string; contributorId: string; contributionAmount: number },
): Promise<void> {
  const purchase = await tx.cspTopUpPurchase.findFirst({
    where: { requestId: input.requestId, userId: input.contributorId, status: "pending" },
    orderBy: { purchasedAt: "asc" },
  });
  if (!purchase) return;

  const contributedAmount = purchase.contributedAmount + input.contributionAmount;
  if (contributedAmount < purchase.amountPaid) {
    await tx.cspTopUpPurchase.update({ where: { id: purchase.id }, data: { contributedAmount } });
    return;
  }

  const request = await tx.cspSupportRequest.findUnique({ where: { id: input.requestId }, select: { broadcastExpiresAt: true } });
  if (!request) return;
  const settings = await loadCspTopUpSettings(tx);
  const appliedHours = await sumAppliedHours(tx, input.requestId);
  const hoursToApply = Math.min(purchase.hours, Math.max(0, settings.maxExtraHours - appliedHours));
  if (hoursToApply <= 0) {
    await tx.cspTopUpPurchase.update({ where: { id: purchase.id }, data: { contributedAmount, status: "forfeited" } });
    return;
  }

  const now = new Date();
  const base = request.broadcastExpiresAt && request.broadcastExpiresAt > now ? request.broadcastExpiresAt : now;
  await tx.cspSupportRequest.update({
    where: { id: input.requestId },
    data: { broadcastExpiresAt: new Date(base.getTime() + hoursToApply * 60 * 60 * 1000) },
  });
  await tx.cspTopUpPurchase.update({
    where: { id: purchase.id },
    data: { contributedAmount, status: "applied", appliedAt: now },
  });
}
