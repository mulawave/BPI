/**
 * CSP Ledger Service
 *
 * Single implementation of the money movements for Community Support Program
 * requests, shared by manual contributions, auto-contribute, admin-verified
 * crypto contributions, admin release and admin-default "mark complete".
 *
 * Invariants:
 *  - Every contribution debits the contributor atomically (never below zero),
 *    increments the request's raisedAmount AND funds the per-request holding
 *    wallet, and is only accepted while the request is accepting funds.
 *  - A release is claimed atomically (status → released) so it can run once.
 *  - The release amount is the sum of CspContribution rows (the ledger), so
 *    funds are released in full even for requests whose holding wallet was
 *    under-funded by the old auto-contribute path.
 *  - Every naira released is accounted for: shares always sum to the total;
 *    the sponsor share goes to the reserve when the beneficiary has no sponsor.
 */

import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { ensureMemberStanding, reconcileMemberStandingContributionRight } from "@/server/services/csp-tier.service";

type Tx = Prisma.TransactionClient;
type Db = PrismaClient | Prisma.TransactionClient;

export type CspWalletType = "community" | "wallet";

export type CspFeePercentages = {
  recipient: number;
  admin: number;
  sponsor: number;
  state: number;
  management: number;
  reserve: number;
};

export type CspReleaseShares = {
  recipient: number;
  admin: number;
  sponsor: number;
  state: number;
  management: number;
  reserve: number;
};

/** Transaction type for the CSP sponsor share. REFERRAL_* so it shows in referral earnings and reports. */
export const CSP_SPONSOR_REWARD_TX_TYPE = "REFERRAL_CSP_SPONSOR";

/** Paid auto-extension thresholds applied when cumulative raised crosses a milestone. */
export const CSP_EXTENSION_BY_AMOUNT = [
  { threshold: 100000, hours: 168 },
  { threshold: 80000, hours: 72 },
  { threshold: 60000, hours: 48 },
  { threshold: 40000, hours: 24 },
] as const;

/**
 * Statuses from which funds can be released. "closed" covers campaigns whose
 * countdown ended with contributions but that were never paid out.
 */
export const CSP_RELEASABLE_STATUSES = ["broadcasting", "ready_for_release", "closed"];

/**
 * Ends a campaign whose countdown has expired. A campaign that raised money
 * waits for admin release ("ready_for_release") so the funds are never
 * stranded; one that raised nothing is closed. Returns the new status, or
 * null when the request was no longer broadcasting.
 */
export async function closeExpiredCspRequest(db: Db, requestId: string): Promise<"ready_for_release" | "closed" | null> {
  const request = await db.cspSupportRequest.findUnique({
    where: { id: requestId },
    select: { raisedAmount: true },
  });
  if (!request) return null;
  const status = request.raisedAmount > 0 ? "ready_for_release" : "closed";
  const updated = await db.cspSupportRequest.updateMany({
    where: { id: requestId, status: "broadcasting" },
    data: { status },
  });
  return updated.count > 0 ? status : null;
}

export function cspHoldingWalletName(requestId: string) {
  return `CSP Holding - ${requestId}`;
}

export function computeAutoExtendHours(previousRaised: number, newRaised: number): number {
  for (const tier of CSP_EXTENSION_BY_AMOUNT) {
    if (previousRaised < tier.threshold && newRaised >= tier.threshold) return tier.hours;
  }
  return 0;
}

/**
 * Loads CSP fee percentages from AdminSettings, falling back to defaults.
 * Distribution: 80% recipient | 5% BPI Profit Pool | 2% sponsor | 2% state | 4% management | 7% reserve = 100%
 */
export async function loadCspFeePercentages(db: Db): Promise<CspFeePercentages> {
  const keys = [
    "csp_fee_recipient_pct",
    "csp_fee_admin_pct",
    "csp_fee_sponsor_pct",
    "csp_fee_state_pct",
    "csp_fee_management_pct",
    "csp_fee_reserve_pct",
  ];
  const rows = await db.adminSettings.findMany({ where: { settingKey: { in: keys } } });
  const map = new Map(rows.map((r) => [r.settingKey, parseFloat(r.settingValue ?? "")]));
  const g = (key: string, def: number) => {
    const v = map.get(key);
    return typeof v === "number" && isFinite(v) && v >= 0 ? v : def;
  };
  return {
    recipient: g("csp_fee_recipient_pct", 0.80),
    admin: g("csp_fee_admin_pct", 0.05), // BPI Profit Pool
    sponsor: g("csp_fee_sponsor_pct", 0.02), // direct sponsor
    state: g("csp_fee_state_pct", 0.02), // state wallet
    management: g("csp_fee_management_pct", 0.04), // management wallet
    reserve: g("csp_fee_reserve_pct", 0.07), // reserve pool
  };
}

export async function ensureSystemWallet(db: Db, name: string, walletType: string) {
  return db.systemWallet.upsert({
    where: { name },
    update: { updatedAt: new Date() },
    create: {
      id: randomUUID(),
      name,
      walletType,
      balanceNgn: 0,
      balanceUsd: 0,
      balanceBpt: 0,
      updatedAt: new Date(),
    },
  });
}

/**
 * Pure split calculation (120% disbursement rule).
 *
 * Path A — fully funded (raised ≥ threshold, requestedAmount set): the
 *   beneficiary receives exactly requestedAmount; the markup surplus is split
 *   across the system pools in proportion to their configured weights.
 * Path B — partially funded: configured percentages apply to the total and
 *   the beneficiary receives the remainder (≈ recipient %).
 *
 * The sponsor share is redirected to the reserve when there is no sponsor, so
 * the shares always sum exactly to `total`.
 */
export function computeCspReleaseShares(params: {
  total: number;
  raisedAmount: number;
  thresholdAmount: number;
  requestedAmount: number | null;
  pct: CspFeePercentages;
  hasSponsor: boolean;
}): { shares: CspReleaseShares; fullyFunded: boolean; sponsorRedirectedToReserve: number } {
  const { total, raisedAmount, thresholdAmount, requestedAmount, pct, hasSponsor } = params;
  const safeTotal = Math.max(0, Math.floor(total));

  const fullyFunded =
    thresholdAmount > 0 &&
    raisedAmount >= thresholdAmount &&
    requestedAmount != null &&
    requestedAmount > 0;

  let shares: CspReleaseShares;
  if (fullyFunded) {
    const recipient = Math.min(Math.floor(requestedAmount!), safeTotal);
    const markupPool = safeTotal - recipient;
    const weight = pct.admin + pct.sponsor + pct.state + pct.management + pct.reserve;
    const w = weight > 0 ? weight : 1;
    const admin = Math.floor(markupPool * (pct.admin / w));
    const sponsor = Math.floor(markupPool * (pct.sponsor / w));
    const state = Math.floor(markupPool * (pct.state / w));
    const management = Math.floor(markupPool * (pct.management / w));
    const reserve = weight > 0 ? markupPool - admin - sponsor - state - management : 0;
    // With no configured pool weights the surplus stays with the beneficiary.
    shares = { recipient: weight > 0 ? recipient : safeTotal, admin, sponsor, state, management, reserve };
  } else {
    const admin = Math.floor(safeTotal * pct.admin);
    const sponsor = Math.floor(safeTotal * pct.sponsor);
    const state = Math.floor(safeTotal * pct.state);
    const management = Math.floor(safeTotal * pct.management);
    const reserve = Math.floor(safeTotal * pct.reserve);
    const allocated = admin + sponsor + state + management + reserve;
    shares = { recipient: safeTotal - allocated, admin, sponsor, state, management, reserve };
  }

  let sponsorRedirectedToReserve = 0;
  if (!hasSponsor && shares.sponsor > 0) {
    sponsorRedirectedToReserve = shares.sponsor;
    shares = { ...shares, reserve: shares.reserve + shares.sponsor, sponsor: 0 };
  }

  return { shares, fullyFunded, sponsorRedirectedToReserve };
}

export function sumShares(shares: CspReleaseShares) {
  return shares.recipient + shares.admin + shares.sponsor + shares.state + shares.management + shares.reserve;
}

// ───────────────────────────── Contributions ─────────────────────────────

export class CspContributionError extends Error {}

export type ApplyCspContributionResult = {
  contributionId: string;
  requestOwnerId: string;
  previousRaised: number;
  newRaised: number;
  reachedThreshold: boolean;
  autoExtendHours: number;
};

/**
 * Applies one contribution inside the caller's transaction.
 *
 * `debitWallet` is the contributor wallet to debit; pass `null` when the money
 * arrived externally (e.g. admin-verified crypto payment).
 */
export async function applyCspContribution(
  tx: Tx,
  input: {
    requestId: string;
    contributorId: string;
    amount: number;
    debitWallet: CspWalletType | null;
    contributionWalletType: string;
    transactionType: string;
    transactionDescription: string;
    transactionReference?: string;
    acceptStatuses?: string[];
  },
): Promise<ApplyCspContributionResult> {
  const now = new Date();
  const amount = input.amount;
  if (!Number.isFinite(amount) || amount <= 0) throw new CspContributionError("Invalid contribution amount");

  // 1. Atomic, non-negative debit of the contributor.
  if (input.debitWallet) {
    const debited = await tx.user.updateMany({
      where: { id: input.contributorId, [input.debitWallet]: { gte: amount } },
      data: { [input.debitWallet]: { decrement: amount } },
    });
    if (debited.count === 0) throw new CspContributionError("Insufficient balance in selected wallet");
  }

  // 2. Accept the contribution only while the request is live. The conditional
  //    update also row-locks the request so concurrent contributions serialize.
  const acceptStatuses = input.acceptStatuses ?? ["broadcasting"];
  const accepted = await tx.cspSupportRequest.updateMany({
    where: {
      id: input.requestId,
      status: { in: acceptStatuses },
      isActive: true,
      userId: { not: input.contributorId },
      OR: [{ isAdminDefault: true }, { broadcastExpiresAt: null }, { broadcastExpiresAt: { gt: now } }],
    },
    data: {
      raisedAmount: { increment: amount },
      contributorsCount: { increment: 1 },
    },
  });
  if (accepted.count === 0) throw new CspContributionError("This request is not currently accepting contributions");

  const request = await tx.cspSupportRequest.findUniqueOrThrow({ where: { id: input.requestId } });
  const newRaised = request.raisedAmount;
  const previousRaised = newRaised - amount;
  const reachedThreshold = request.thresholdAmount > 0 && newRaised >= request.thresholdAmount;

  // 3. Status + paid auto-extension computed from the fresh totals.
  let autoExtendHours = 0;
  const update: Prisma.CspSupportRequestUpdateInput = {};
  if (reachedThreshold && request.status === "broadcasting") {
    update.status = "ready_for_release";
  } else if (!request.isAdminDefault) {
    autoExtendHours = computeAutoExtendHours(previousRaised, newRaised);
    if (autoExtendHours > 0) {
      const base = request.broadcastExpiresAt && request.broadcastExpiresAt > now ? request.broadcastExpiresAt : now;
      update.broadcastExpiresAt = new Date(base.getTime() + autoExtendHours * 60 * 60 * 1000);
      await tx.cspBroadcastExtension.create({
        data: { requestId: request.id, type: "paid", value: newRaised, hoursGranted: autoExtendHours },
      });
    }
  }
  if (Object.keys(update).length > 0) {
    await tx.cspSupportRequest.update({ where: { id: request.id }, data: update });
  }

  // 4. Park the funds in the request's holding wallet.
  const holding = await ensureSystemWallet(tx, cspHoldingWalletName(request.id), "CSP_HOLDING");
  await tx.systemWallet.update({ where: { id: holding.id }, data: { balanceNgn: { increment: amount } } });

  // 5. Ledger records.
  const contribution = await tx.cspContribution.create({
    data: {
      requestId: request.id,
      contributorId: input.contributorId,
      amount,
      walletType: input.contributionWalletType,
    },
  });

  await tx.transaction.create({
    data: {
      id: randomUUID(),
      userId: input.contributorId,
      transactionType: input.transactionType,
      amount: -amount,
      description: input.transactionDescription,
      status: "completed",
      walletType: input.debitWallet ?? "main",
      ...(input.transactionReference ? { reference: input.transactionReference } : {}),
    },
  });

  await tx.transaction.create({
    data: {
      id: randomUUID(),
      userId: request.userId,
      transactionType: "CSP_SUPPORT_INFLOW_HOLDING",
      amount,
      description: `CSP support held for request ${request.id}`,
      status: "pending",
      walletType: "holding",
      reference: `CSP-HOLD-${request.id}`,
    },
  });

  await reconcileMemberStandingContributionRight(tx, input.contributorId);

  return {
    contributionId: contribution.id,
    requestOwnerId: request.userId,
    previousRaised,
    newRaised,
    reachedThreshold,
    autoExtendHours,
  };
}

// ─────────────────────────────── Release ───────────────────────────────

export type CspReleasePreview = {
  requestId: string;
  status: string;
  total: number;
  raisedAmount: number;
  thresholdAmount: number;
  requestedAmount: number | null;
  holdingBalance: number;
  holdingShortfall: number;
  hasSponsor: boolean;
  sponsorId: string | null;
  fullyFunded: boolean;
  sponsorRedirectedToReserve: number;
  shares: CspReleaseShares;
  pct: CspFeePercentages;
  /** A payout was already recorded for this request (e.g. by the pre-ledger release code). */
  alreadyReleased: boolean;
};

async function resolveSponsor(db: Db, sponsorId: string | null | undefined) {
  if (!sponsorId) return null;
  const sponsor = await db.user.findUnique({ where: { id: sponsorId }, select: { id: true } });
  return sponsor?.id ?? null;
}

async function buildReleasePlan(db: Db, requestId: string): Promise<CspReleasePreview> {
  const request = await db.cspSupportRequest.findUnique({
    where: { id: requestId },
    include: { User: { select: { sponsorId: true } } },
  });
  if (!request) throw new Error("Support request not found");

  const [ledger, holding, pct, sponsorId, priorRelease] = await Promise.all([
    db.cspContribution.aggregate({ where: { requestId }, _sum: { amount: true } }),
    db.systemWallet.findUnique({ where: { name: cspHoldingWalletName(requestId) }, select: { balanceNgn: true } }),
    loadCspFeePercentages(db),
    resolveSponsor(db, request.User?.sponsorId),
    db.auditLog.findFirst({ where: { action: "CSP_RELEASE_FUNDS", entityId: requestId }, select: { id: true } }),
  ]);

  const total = Math.floor(ledger._sum.amount ?? 0);
  const holdingBalance = holding?.balanceNgn ?? 0;
  const { shares, fullyFunded, sponsorRedirectedToReserve } = computeCspReleaseShares({
    total,
    raisedAmount: total,
    thresholdAmount: request.thresholdAmount,
    requestedAmount: request.requestedAmount,
    pct,
    hasSponsor: sponsorId != null,
  });

  return {
    requestId,
    status: request.status,
    total,
    raisedAmount: request.raisedAmount,
    thresholdAmount: request.thresholdAmount,
    requestedAmount: request.requestedAmount,
    holdingBalance,
    holdingShortfall: Math.max(0, total - holdingBalance),
    hasSponsor: sponsorId != null,
    sponsorId,
    fullyFunded,
    sponsorRedirectedToReserve,
    shares,
    pct,
    alreadyReleased: priorRelease != null,
  };
}

/** Read-only preview of exactly what a release would pay out right now. */
export async function previewCspRelease(db: Db, requestId: string) {
  return buildReleasePlan(db, requestId);
}

export type CspReleaseResult = CspReleasePreview & { releasedAt: Date; cooldownEndsAt: Date | null };

/**
 * Releases a request's funds exactly once.
 *
 * `finalStatus` is "released" for normal releases; admin-default requests use
 * the same status so released totals and history stay consistent.
 */
export async function executeCspRelease(
  prisma: PrismaClient,
  input: {
    requestId: string;
    adminUserId?: string;
    releasableStatuses: string[];
    tierModelEnabled: boolean;
    defaultCoolingMonths: number;
    auditExtra?: Record<string, unknown>;
  },
): Promise<CspReleaseResult> {
  return prisma.$transaction(async (tx) => {
    const releasedAt = new Date();

    // Atomic claim: only one release can move the request out of a releasable
    // state; this also stops new contributions (they require "broadcasting").
    const claimed = await tx.cspSupportRequest.updateMany({
      where: { id: input.requestId, status: { in: input.releasableStatuses } },
      data: { status: "released", releasedAt, fulfilledAt: releasedAt, isActive: false, broadcastExpiresAt: null },
    });
    if (claimed.count === 0) {
      const current = await tx.cspSupportRequest.findUnique({ where: { id: input.requestId }, select: { status: true } });
      if (!current) throw new Error("Support request not found");
      if (current.status === "released") throw new Error("Funds have already been released for this request");
      throw new Error(`Cannot release funds for a request with status "${current.status}"`);
    }

    const plan = await buildReleasePlan(tx, input.requestId);
    // Requests paid out by the old release code were left "closed"; never pay twice.
    if (plan.alreadyReleased) throw new Error("Funds have already been released for this request");
    if (plan.total <= 0) throw new Error("No funds available to release yet");
    if (sumShares(plan.shares) !== plan.total) throw new Error("CSP release split does not balance; aborting");

    const request = await tx.cspSupportRequest.findUniqueOrThrow({
      where: { id: input.requestId },
      select: { id: true, userId: true, category: true, cooldownMonths: true },
    });
    const { shares } = plan;

    // Holding wallet is emptied — the ledger total is what is paid out.
    const holding = await ensureSystemWallet(tx, cspHoldingWalletName(request.id), "CSP_HOLDING");
    await tx.systemWallet.update({ where: { id: holding.id }, data: { balanceNgn: 0 } });

    await tx.user.update({ where: { id: request.userId }, data: { wallet: { increment: shares.recipient } } });
    if (plan.sponsorId && shares.sponsor > 0) {
      await tx.user.update({ where: { id: plan.sponsorId }, data: { wallet: { increment: shares.sponsor } } });
    }

    const pools: Array<[string, string, number]> = [
      ["CSP Admin Wallet", "EXECUTIVE_POOL", shares.admin],
      ["CSP State Wallet", "STATE_REVENUE_POOL", shares.state],
      ["CSP Management Wallet", "CSP_MANAGEMENT_RESERVE", shares.management],
      ["CSP Reserve Wallet", "CSP_RESERVE", shares.reserve],
    ];
    for (const [name, type, amount] of pools) {
      const wallet = await ensureSystemWallet(tx, name, type);
      if (amount > 0) {
        await tx.systemWallet.update({ where: { id: wallet.id }, data: { balanceNgn: { increment: amount } } });
      }
    }

    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: request.userId,
        transactionType: "CSP_PAYOUT",
        amount: shares.recipient,
        description: `CSP support released to your Main Cash Wallet (request ${request.id})`,
        status: "completed",
        walletType: "wallet",
        reference: `CSP-PAYOUT-${request.id}`,
      },
    });

    if (plan.sponsorId && shares.sponsor > 0) {
      await tx.transaction.create({
        data: {
          id: randomUUID(),
          userId: plan.sponsorId,
          transactionType: CSP_SPONSOR_REWARD_TX_TYPE,
          amount: shares.sponsor,
          description: `CSP sponsor (referral) reward from support request ${request.id}`,
          status: "completed",
          walletType: "wallet",
          reference: `CSP-SPONSOR-${request.id}`,
        },
      });
    }

    // Holding inflows shown to the beneficiary are now settled.
    await tx.transaction.updateMany({
      where: {
        userId: request.userId,
        transactionType: "CSP_SUPPORT_INFLOW_HOLDING",
        status: "pending",
        OR: [{ reference: `CSP-HOLD-${request.id}` }, { description: `CSP support held for request ${request.id}` }],
      },
      data: { status: "completed" },
    });

    let cooldownEndsAt: Date | null = null;
    if (request.cooldownMonths && request.cooldownMonths > 0) {
      cooldownEndsAt = new Date(releasedAt);
      cooldownEndsAt.setMonth(cooldownEndsAt.getMonth() + request.cooldownMonths);
    }
    await tx.cspSupportRequest.update({
      where: { id: request.id },
      data: { cooldownEndsAt, raisedAmount: plan.total },
    });

    if (input.tierModelEnabled) {
      await ensureMemberStanding(tx, request.userId);
      await tx.cspMemberStanding.update({
        where: { userId: request.userId },
        data: {
          lastSupportReleasedAt: releasedAt,
          coolingEndsAt: cooldownEndsAt,
          coolingMonthsBase: request.cooldownMonths ?? input.defaultCoolingMonths,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        userId: input.adminUserId ?? request.userId,
        action: "CSP_RELEASE_FUNDS",
        entity: "CSP_SUPPORT_REQUEST",
        entityId: request.id,
        metadata: {
          beneficiaryUserId: request.userId,
          category: request.category,
          totalReleased: plan.total,
          raisedAmountBefore: plan.raisedAmount,
          holdingBalanceBefore: plan.holdingBalance,
          holdingShortfall: plan.holdingShortfall,
          recipientCredited: shares.recipient,
          creditedWallet: "wallet",
          creditedWalletLabel: "Main Cash Wallet",
          fullyFunded: plan.fullyFunded,
          sponsorId: plan.sponsorId,
          sponsorRedirectedToReserve: plan.sponsorRedirectedToReserve,
          shares,
          pct: plan.pct,
          cooldownMonths: request.cooldownMonths ?? null,
          cooldownEndsAt,
          ...(input.auditExtra ?? {}),
        } as Prisma.InputJsonValue,
        ipAddress: "",
        userAgent: "",
      },
    });

    return { ...plan, status: "released", releasedAt, cooldownEndsAt };
  }, { timeout: 30_000 });
}
