import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { getReferralChain } from "./referral.service";
import { distributeBptReward } from "./rewards.service";
import { recordRevenue } from "./revenue.service";
import { notifyMembershipRenewal } from "./notification.service";
import { deriveMembershipExpiry } from "../../lib/membershipAccess";

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function normalizePercent(maybePercent: number, fallback: number): number {
  if (!Number.isFinite(maybePercent)) return fallback;
  if (maybePercent < 0) return fallback;
  return maybePercent > 1 ? maybePercent / 100 : maybePercent;
}

function computeProfitFiat(params: {
  profitMode: "PERCENT" | "FIXED" | "HYBRID";
  profitPercent: number;
  profitFixedAmountFiat: number;
  baseFiat: number;
}): number {
  const profitPercent = normalizePercent(params.profitPercent, 0);
  const fixed = Number(params.profitFixedAmountFiat ?? 0);
  const baseFiat = Number(params.baseFiat ?? 0);

  let profitFiat = 0;
  if (params.profitMode === "PERCENT") {
    profitFiat = baseFiat * profitPercent;
  } else if (params.profitMode === "FIXED") {
    profitFiat = fixed;
  } else {
    profitFiat = baseFiat * profitPercent + fixed;
  }

  return Math.min(Math.max(profitFiat, 0), baseFiat);
}

/**
 * Membership Package Hierarchy Levels
 * Used to prevent downgrades during renewal
 * Higher tier members can only maintain or upgrade their tier
 */
export const MEMBERSHIP_HIERARCHY: Record<string, number> = {
  "Regular": 1,
  "Regular Plus": 2,
  "Gold Plus": 3,
  "Platinum Plus": 4,
};

/**
 * Get the hierarchy level of a membership package
 */
export function getMembershipHierarchyLevel(packageName: string): number {
  return MEMBERSHIP_HIERARCHY[packageName] || 0;
}

/**
 * Validate that renewal package is not a downgrade
 * Members can maintain their tier or upgrade, but never downgrade
 */
export async function validateNoDowngrade(
  prismaLike: PrismaClient | any,
  userId: string,
  newPackageId: string
): Promise<{ isValid: boolean; reason?: string }> {
  const user = await prismaLike.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      activeMembershipPackageId: true,
    },
  });

  if (!user || !user.activeMembershipPackageId) {
    return { isValid: true }; // No active membership, can renew to any
  }

  const currentPackage = await prismaLike.membershipPackage.findUnique({
    where: { id: user.activeMembershipPackageId },
    select: { id: true, name: true },
  });

  const newPackage = await prismaLike.membershipPackage.findUnique({
    where: { id: newPackageId },
    select: { id: true, name: true },
  });

  if (!currentPackage || !newPackage) {
    return {
      isValid: false,
      reason: "Package not found",
    };
  }

  const currentLevel = getMembershipHierarchyLevel(currentPackage.name);
  const newLevel = getMembershipHierarchyLevel(newPackage.name);

  if (newLevel < currentLevel) {
    return {
      isValid: false,
      reason: `Cannot downgrade from ${currentPackage.name} (level ${currentLevel}) to ${newPackage.name} (level ${newLevel}). You can only maintain or upgrade your membership tier.`,
    };
  }

  return { isValid: true };
}

/**
 * Validate if a user is eligible for auto-renewal
 */
export async function validateAutoRenewalEligibility(
  prismaLike: PrismaClient | any,
  userId: string
): Promise<{
  eligible: boolean;
  reason?: string;
  membershipExpiresAt?: Date;
  daysUntilExpiry?: number;
}> {
  const user = await prismaLike.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      activeMembershipPackageId: true,
      membershipActivatedAt: true,
      membershipExpiresAt: true,
    },
  });

  if (!user) {
    return { eligible: false, reason: "User not found" };
  }

  if (!user.activeMembershipPackageId) {
    return { eligible: false, reason: "User does not have an active membership" };
  }

  const membershipPackage = await prismaLike.membershipPackage.findUnique({
    where: { id: user.activeMembershipPackageId },
    select: { renewalCycle: true },
  });

  const { expiresAt: effectiveMembershipExpiresAt } = deriveMembershipExpiry({
    membershipExpiresAt: user.membershipExpiresAt,
    membershipActivatedAt: user.membershipActivatedAt,
    renewalCycleDays: membershipPackage?.renewalCycle,
  });

  if (!effectiveMembershipExpiresAt) {
    return {
      eligible: false,
      reason: "User membership has no expiration date and cannot be derived from activation history",
    };
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (effectiveMembershipExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Auto-renewal is available within 30 days of expiry
  if (daysUntilExpiry > 30) {
    return {
      eligible: false,
      reason: `Auto-renewal is available within 30 days of expiration. Your membership expires in ${daysUntilExpiry} days.`,
      membershipExpiresAt: effectiveMembershipExpiresAt,
      daysUntilExpiry,
    };
  }

  // Check if membership has already expired or expires within auto-renewal window
  if (daysUntilExpiry < -365) {
    // More than 1 year expired - maybe skip auto-renewal to reset
    return {
      eligible: false,
      reason: "Membership has been expired for too long. Please contact support for manual renewal.",
      membershipExpiresAt: effectiveMembershipExpiresAt,
      daysUntilExpiry,
    };
  }

  return {
    eligible: true,
    membershipExpiresAt: effectiveMembershipExpiresAt,
    daysUntilExpiry,
  };
}

/**
 * Get the renewal package for a user based on their current membership
 * Rules:
 * - Regular → Regular Plus (upgrade)
 * - Regular Plus → Regular Plus (same)
 * - Gold Plus → Gold Plus (same)
 * - Platinum Plus → Platinum Plus (same)
 */
export async function getRenewalPackage(
  prismaLike: PrismaClient | any,
  userId: string,
  optionalUpgradePackageId?: string
): Promise<{
  packageId: string;
  packageName: string;
  renewalFee: number;
  vat: number;
  totalCost: number;
  isUpgrade: boolean;
}> {
  const user = await prismaLike.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      activeMembershipPackageId: true,
    },
  });

  if (!user || !user.activeMembershipPackageId) {
    throw new Error("User does not have an active membership");
  }

  const currentPackage = await prismaLike.membershipPackage.findUnique({
    where: { id: user.activeMembershipPackageId },
  });

  if (!currentPackage) {
    throw new Error("Current membership package not found");
  }

  // If upgrade package specified and valid, use it
  if (optionalUpgradePackageId) {
    const upgradeValidation = await validateNoDowngrade(
      prismaLike,
      userId,
      optionalUpgradePackageId
    );
    if (!upgradeValidation.isValid) {
      throw new Error(upgradeValidation.reason || "Invalid upgrade package");
    }

    const upgradePackage = await prismaLike.membershipPackage.findUnique({
      where: { id: optionalUpgradePackageId },
    });

    if (!upgradePackage) {
      throw new Error("Upgrade package not found");
    }

    const renewalFee = upgradePackage.renewalFee || upgradePackage.price;
    const vat = renewalFee * 0.075;
    const totalCost = renewalFee + vat;

    return {
      packageId: upgradePackage.id,
      packageName: upgradePackage.name,
      renewalFee,
      vat,
      totalCost,
      isUpgrade: upgradePackage.id !== currentPackage.id,
    };
  }

  // No upgrade specified - use same package (or auto-upgrade from Regular to Regular Plus)
  let renewalPackage = currentPackage;

  // Auto-upgrade from Regular to Regular Plus
  if (currentPackage.name === "Regular") {
    const regularPlus = await prismaLike.membershipPackage.findFirst({
      where: { name: "Regular Plus", isActive: true },
    });

    if (regularPlus) {
      renewalPackage = regularPlus;
    }
  }

  const renewalFee = renewalPackage.renewalFee || renewalPackage.price;
  const vat = renewalFee * 0.075;
  const totalCost = renewalFee + vat;

  return {
    packageId: renewalPackage.id,
    packageName: renewalPackage.name,
    renewalFee,
    vat,
    totalCost,
    isUpgrade: renewalPackage.id !== currentPackage.id,
  };
}

/** Transaction types for renewal referral rewards (REFERRAL_* so they appear in referral earnings/reports). */
export const RENEWAL_REWARD_TX_TYPES = {
  cash: (level: number) => `REFERRAL_RENEWAL_CASH_L${level}`,
  palliative: (level: number) => `REFERRAL_RENEWAL_PALLIATIVE_L${level}`,
  cashback: (level: number) => `REFERRAL_RENEWAL_CASHBACK_L${level}`,
};

const RENEWAL_TX_MAX_WAIT_MS = 30_000;
const RENEWAL_TX_TIMEOUT_MS = 90_000;

export class RenewalInsufficientFundsError extends Error {
  constructor(public required: number, public available: number) {
    super(
      `Insufficient Main Wallet balance for renewal. Required ₦${required.toLocaleString()}, available ₦${available.toLocaleString()}. Please fund your wallet.`
    );
  }
}

/**
 * Process a paid membership renewal for a user.
 *
 * The renewal cost (fee + VAT) is debited from the member's Main (cash)
 * wallet in the same database transaction that extends the membership and
 * credits the upline renewal rewards — so a renewal is never granted, and no
 * rewards are paid, unless the member actually paid. The debit is conditional
 * on the balance and on the membership expiry not having changed, which makes
 * concurrent calls (cron + button + admin) safe: only one can succeed.
 */
export async function processAutoRenewal(
  prismaLike: PrismaClient | any,
  userId: string,
  optionalUpgradePackageId?: string
): Promise<{
  success: boolean;
  renewalHistoryId?: string;
  newExpiresAt?: Date;
  amountCharged?: number;
  insufficientFunds?: boolean;
  totalRewardsDistributed?: {
    cash: number;
    bpt: number;
    palliative: number;
    cashback: number;
    health: number;
    meal: number;
    security: number;
    shelter: number;
  };
  error?: string;
}> {
  try {
    // 1. Validate eligibility
    const eligibility = await validateAutoRenewalEligibility(prismaLike, userId);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason };
    }

    // 2. Get renewal package
    const renewalPackageInfo = await getRenewalPackage(
      prismaLike,
      userId,
      optionalUpgradePackageId
    );

    // 3. Get current user and package info
    const user = await prismaLike.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        wallet: true,
        country: true,
        state: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        renewalCount: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const membershipPackage = await prismaLike.membershipPackage.findUnique({
      where: { id: renewalPackageInfo.packageId },
    });

    if (!membershipPackage) {
      return { success: false, error: "Membership package not found" };
    }

    const totalCost = Math.round(renewalPackageInfo.totalCost * 100) / 100;
    if ((user.wallet ?? 0) < totalCost) {
      throw new RenewalInsufficientFundsError(totalCost, user.wallet ?? 0);
    }

    // 4. Calculate new expiry date
    const now = new Date();
    const expiresAt = eligibility.membershipExpiresAt || user.membershipExpiresAt || now;
    const cycleMs = membershipPackage.renewalCycle * 24 * 60 * 60 * 1000;
    const newExpiresAt = new Date((expiresAt > now ? expiresAt.getTime() : now.getTime()) + cycleMs);

    // 5. Get referral chain for reward distribution
    const referralChain = await getReferralChain(userId, 4);
    const renewalReference = `RENEWAL-${userId.slice(0, 8)}-${now.getTime()}`;
    const renewalNumber = (user.renewalCount ?? 0) + 1;

    const totals = { cash: 0, palliative: 0, bpt: 0, cashback: 0, health: 0, meal: 0, security: 0, shelter: 0 };
    const cashRewardsByReferrer: Array<{ referrerId: string; amount: number }> = [];
    const bptRewards: Array<{ referrerId: string; level: number; amount: number }> = [];

    const runInTx = async (tx: any) => {
      // 6. Charge the member — conditional on balance and on the expiry being
      //    unchanged since we read it (prevents double renewal/double charge).
      const charged = await tx.user.updateMany({
        where: {
          id: userId,
          wallet: { gte: totalCost },
          membershipExpiresAt: user.membershipExpiresAt,
        },
        data: {
          wallet: { decrement: totalCost },
          membershipExpiresAt: newExpiresAt,
          renewalCount: { increment: 1 },
          ...(renewalPackageInfo.packageId !== user.activeMembershipPackageId
            ? { activeMembershipPackageId: renewalPackageInfo.packageId }
            : {}),
        },
      });

      if (charged.count === 0) {
        const fresh = await tx.user.findUnique({ where: { id: userId }, select: { wallet: true } });
        if ((fresh?.wallet ?? 0) < totalCost) {
          throw new RenewalInsufficientFundsError(totalCost, fresh?.wallet ?? 0);
        }
        throw new Error("Membership was renewed or changed by another request. Please refresh.");
      }

      await tx.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "MEMBERSHIP_RENEWAL",
          amount: -totalCost,
          description: `${renewalPackageInfo.packageName} membership renewal #${renewalNumber} (paid from Main Wallet)`,
          status: "completed",
          reference: renewalReference,
          walletType: "main",
        },
      });

      if (renewalPackageInfo.vat > 0) {
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "VAT",
            amount: renewalPackageInfo.vat,
            description: `VAT on ${renewalPackageInfo.packageName} membership renewal`,
            status: "completed",
            reference: `VAT-${renewalReference}`,
            walletType: "main",
          },
        });
      }

      // 7. Distribute renewal rewards to referrers (levels 1-4)
      for (let i = 0; i < referralChain.length; i++) {
        const referrer = referralChain[i];
        const level = (i + 1) as 1 | 2 | 3 | 4;
        const pkg = membershipPackage as any;

        const cashReward = pkg[`renewal_cash_l${level}`] || 0;
        const palliativeReward = pkg[`renewal_palliative_l${level}`] || 0;
        const bptReward = pkg[`renewal_bpt_l${level}`] || 0;
        const cashbackReward = pkg[`renewal_cashback_l${level}`] || 0;
        const healthReward = pkg[`renewal_health_l${level}`] || 0;
        const mealReward = pkg[`renewal_meal_l${level}`] || 0;
        const securityReward = pkg[`renewal_security_l${level}`] || 0;
        const shelterReward = pkg[`shelter_l${level}`] || 0;

        const updateData: any = {};
        if (cashReward > 0) { updateData.wallet = { increment: cashReward }; totals.cash += cashReward; }
        if (palliativeReward > 0) { updateData.palliative = { increment: palliativeReward }; totals.palliative += palliativeReward; }
        if (cashbackReward > 0) { updateData.cashback = { increment: cashbackReward }; totals.cashback += cashbackReward; }
        if (healthReward > 0) { updateData.health = { increment: healthReward }; totals.health += healthReward; }
        if (mealReward > 0) { updateData.meal = { increment: mealReward }; totals.meal += mealReward; }
        if (securityReward > 0) { updateData.security = { increment: securityReward }; totals.security += securityReward; }
        if (shelterReward > 0) { updateData.shelter = { increment: shelterReward }; totals.shelter += shelterReward; }

        if (Object.keys(updateData).length > 0) {
          await tx.user.update({ where: { id: referrer.id }, data: updateData });
        }

        const rewardTx: Array<[string, number, string]> = [
          [RENEWAL_REWARD_TX_TYPES.cash(level), cashReward, "Cash Wallet"],
          [RENEWAL_REWARD_TX_TYPES.palliative(level), palliativeReward, "Palliative Wallet"],
          [RENEWAL_REWARD_TX_TYPES.cashback(level), cashbackReward, "Cashback Wallet"],
        ];
        for (const [transactionType, amount, label] of rewardTx) {
          if (amount <= 0) continue;
          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrer.id,
              transactionType,
              amount,
              description: `L${level} ${label} renewal reward from ${membershipPackage.name} renewal (Referral ID: ${userId})`,
              status: "completed",
              reference: `${renewalReference}-L${level}-${transactionType}`,
            },
          });
        }

        if (cashReward > 0) cashRewardsByReferrer.push({ referrerId: referrer.id, amount: cashReward });
        if (bptReward > 0) bptRewards.push({ referrerId: referrer.id, level, amount: bptReward });
      }

      // 8. Create renewal history record
      return tx.renewalHistory.create({
        data: {
          id: randomUUID(),
          userId,
          packageId: renewalPackageInfo.packageId,
          packageName: renewalPackageInfo.packageName,
          renewalNumber,
          renewalFee: renewalPackageInfo.renewalFee,
          vat: renewalPackageInfo.vat,
          totalPaid: totalCost,
          expiresAt: newExpiresAt,
          cashDistributed: totals.cash,
          bptDistributed: bptRewards.reduce((sum, r) => sum + r.amount, 0),
          palliativeDistributed: totals.palliative,
          cashbackDistributed: totals.cashback,
          healthDistributed: totals.health,
          mealDistributed: totals.meal,
          securityDistributed: totals.security,
        },
      });
    };

    const renewalHistory =
      typeof prismaLike.$transaction === "function"
        ? await prismaLike.$transaction(runInTx, { maxWait: RENEWAL_TX_MAX_WAIT_MS, timeout: RENEWAL_TX_TIMEOUT_MS })
        : await runInTx(prismaLike);

    // ── Post-commit (best-effort) ──

    // BPT rewards use their own transaction (price lookup + buyback split).
    for (const reward of bptRewards) {
      try {
        await distributeBptReward(
          reward.referrerId,
          reward.amount,
          `AUTO_RENEWAL_L${reward.level}`,
          `Renewal reward L${reward.level} from ${membershipPackage.name} renewal`
        );
        totals.bpt += reward.amount;
      } catch (err) {
        console.error(`[AUTO-RENEWAL] BPT reward distribution failed for referrer ${reward.referrerId}:`, err);
      }
    }

    // Referral cash rewards trigger the referrer's auto-debit (→ CSP) like activation rewards do.
    if (typeof prismaLike.$transaction === "function") {
      const { runPostCreditAutomation } = await import("./walletAutoDebit.service");
      for (const reward of cashRewardsByReferrer) {
        await runPostCreditAutomation({
          prisma: prismaLike,
          userId: reward.referrerId,
          creditAmount: reward.amount,
          trigger: "reward",
          context: `renewal reward ${renewalHistory.id}`,
        });
      }
    }

    // 9. Record revenue from membership renewal
    const renewalProfitFiat = computeProfitFiat({
      profitMode: (membershipPackage.profitMode ?? "PERCENT") as any,
      profitPercent: Number(membershipPackage.profitPercent ?? 1),
      profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
      baseFiat: Number(renewalPackageInfo.renewalFee ?? 0),
    });

    if (renewalProfitFiat > 0) {
      try {
        await recordRevenue(prismaLike, {
          source: "MEMBERSHIP_RENEWAL",
          amount: renewalProfitFiat,
          currency: "NGN",
          sourceId: `AUTO_RENEWAL:${renewalHistory.id}`,
          description: `Membership renewal: ${renewalPackageInfo.packageName}`,
          userId,
          packageId: membershipPackage.id,
          programType: "MEMBERSHIP_RENEWAL",
          country: user.country ?? undefined,
          state: user.state ?? undefined,
          metadata: {
            totalPaid: totalCost,
            renewalFee: renewalPackageInfo.renewalFee,
            vat: renewalPackageInfo.vat,
            renewalNumber,
            renewalHistoryId: renewalHistory.id,
            paymentReference: renewalReference,
            isUpgrade: renewalPackageInfo.isUpgrade,
          },
        });
      } catch (err) {
        console.error(`[AUTO-RENEWAL] Revenue recording failed for user ${userId}:`, err);
      }
    }

    // 10. Send renewal notification
    try {
      await notifyMembershipRenewal(userId, renewalPackageInfo.packageName, renewalNumber, newExpiresAt);
    } catch (err) {
      console.error(`[AUTO-RENEWAL] Notification failed for user ${userId}:`, err);
    }

    return {
      success: true,
      renewalHistoryId: renewalHistory.id,
      newExpiresAt,
      amountCharged: totalCost,
      totalRewardsDistributed: totals,
    };
  } catch (err) {
    if (err instanceof RenewalInsufficientFundsError) {
      return { success: false, insufficientFunds: true, error: err.message };
    }
    console.error(`[AUTO-RENEWAL] Process failed for user ${userId}:`, err);
    return {
      success: false,
      error: `Auto-renewal processing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/** Days after expiry during which the background job keeps attempting renewal. */
export const AUTO_RENEWAL_GRACE_DAYS = 30;
/** Days before expiry at which the background job renews, so access never lapses. */
export const AUTO_RENEWAL_LEAD_DAYS = 1;

/**
 * Get users due for auto-renewal (expiring within AUTO_RENEWAL_LEAD_DAYS or
 * expired within the last AUTO_RENEWAL_GRACE_DAYS)
 */
export async function getAutoRenewalCandidates(
  prismaLike: PrismaClient | any,
  limit: number = 100
): Promise<
  Array<{
    id: string;
    name: string | null;
    email: string | null;
    activeMembershipPackageId: string | null;
    membershipExpiresAt: Date | null;
    daysExpired: number;
  }>
> {
  const now = new Date();
  // Renew members whose membership ends within the next day (so access does not
  // lapse) up to 30 days after expiry — the documented auto-renewal window.
  const windowStart = new Date(now.getTime() - AUTO_RENEWAL_GRACE_DAYS * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + AUTO_RENEWAL_LEAD_DAYS * 24 * 60 * 60 * 1000);

  const rawUsers = await prismaLike.user.findMany({
    where: {
      activeMembershipPackageId: { not: null },
      OR: [
        {
          membershipExpiresAt: {
            lte: windowEnd,
            gte: windowStart,
          },
        },
        {
          membershipExpiresAt: null,
          membershipActivatedAt: { not: null },
        },
      ],
    },
    orderBy: [{ membershipExpiresAt: "asc" }, { membershipActivatedAt: "asc" }],
    take: Math.min(limit * 5, 1000),
    select: {
      id: true,
      name: true,
      email: true,
      activeMembershipPackageId: true,
      membershipActivatedAt: true,
      membershipExpiresAt: true,
    },
  });

  const packageIds = Array.from(
    new Set(
      rawUsers
        .map((user: any) => user.activeMembershipPackageId)
        .filter((packageId: string | null): packageId is string => Boolean(packageId))
    )
  );

  const membershipPackages = packageIds.length
    ? await prismaLike.membershipPackage.findMany({
        where: { id: { in: packageIds } },
        select: { id: true, renewalCycle: true },
      })
    : [];

  const renewalCycleByPackageId = new Map<string, number>(
    membershipPackages.map((membershipPackage: any) => [membershipPackage.id, Number(membershipPackage.renewalCycle || 0)])
  );

  return rawUsers
    .map((user: any) => {
      const { expiresAt } = deriveMembershipExpiry({
        membershipExpiresAt: user.membershipExpiresAt,
        membershipActivatedAt: user.membershipActivatedAt,
        renewalCycleDays: renewalCycleByPackageId.get(user.activeMembershipPackageId),
      });

      if (!expiresAt || expiresAt > windowEnd || expiresAt < windowStart) {
        return null;
      }

      const daysExpired = Math.floor(
        (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...user,
        membershipExpiresAt: expiresAt,
        daysExpired,
      };
    })
    .filter((user: any): user is {
      id: string;
      name: string | null;
      email: string | null;
      activeMembershipPackageId: string | null;
      membershipExpiresAt: Date;
      daysExpired: number;
    } => Boolean(user))
    .slice(0, limit);
}
