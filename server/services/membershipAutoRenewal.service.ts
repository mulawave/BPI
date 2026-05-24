import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { getReferralChain } from "../utils/referralUtils";
import { distributeBptReward } from "../utils/bptRewardUtils";
import { recordRevenue, computeProfitFiat } from "../utils/revenueUtils";
import { notifyMembershipRenewal } from "./notification.service";

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
      membershipExpiresAt: true,
    },
  });

  if (!user) {
    return { eligible: false, reason: "User not found" };
  }

  if (!user.activeMembershipPackageId) {
    return { eligible: false, reason: "User does not have an active membership" };
  }

  if (!user.membershipExpiresAt) {
    return {
      eligible: false,
      reason: "User membership has no expiration date",
    };
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (user.membershipExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Auto-renewal is available within 30 days of expiry
  if (daysUntilExpiry > 30) {
    return {
      eligible: false,
      reason: `Auto-renewal is available within 30 days of expiration. Your membership expires in ${daysUntilExpiry} days.`,
      membershipExpiresAt: user.membershipExpiresAt,
      daysUntilExpiry,
    };
  }

  // Check if membership has already expired or expires within auto-renewal window
  if (daysUntilExpiry < -365) {
    // More than 1 year expired - maybe skip auto-renewal to reset
    return {
      eligible: false,
      reason: "Membership has been expired for too long. Please contact support for manual renewal.",
      membershipExpiresAt: user.membershipExpiresAt,
      daysUntilExpiry,
    };
  }

  return {
    eligible: true,
    membershipExpiresAt: user.membershipExpiresAt,
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

/**
 * Process auto-renewal for a user
 * Handles reward distribution, state updates, and persistence
 */
export async function processAutoRenewal(
  prismaLike: PrismaClient | any,
  userId: string,
  optionalUpgradePackageId?: string
): Promise<{
  success: boolean;
  renewalHistoryId?: string;
  newExpiresAt?: Date;
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
        activeMembershipPackageId: true,
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

    // 4. Calculate new expiry date
    const now = new Date();
    const expiresAt = user.membershipExpiresAt || now;
    const newExpiresAt =
      expiresAt > now
        ? new Date(
            expiresAt.getTime() +
              membershipPackage.renewalCycle * 24 * 60 * 60 * 1000
          )
        : new Date(
            now.getTime() +
              membershipPackage.renewalCycle * 24 * 60 * 60 * 1000
          );

    // 5. Get referral chain for reward distribution
    const referralChain = await getReferralChain(userId, 4);

    // Track rewards
    let totalCash = 0,
      totalPalliative = 0,
      totalBpt = 0,
      totalCashback = 0;
    let totalHealth = 0,
      totalMeal = 0,
      totalSecurity = 0,
      totalShelter = 0;

    // 6. Distribute renewal rewards to referrers (levels 1-4)
    for (let i = 0; i < referralChain.length; i++) {
      const referrer = referralChain[i];
      const level = (i + 1) as 1 | 2 | 3 | 4;

      const cashReward =
        (membershipPackage as any)[`renewal_cash_l${level}`] || 0;
      const palliativeReward =
        (membershipPackage as any)[`renewal_palliative_l${level}`] || 0;
      const bptReward =
        (membershipPackage as any)[`renewal_bpt_l${level}`] || 0;
      const cashbackReward =
        (membershipPackage as any)[`renewal_cashback_l${level}`] || 0;
      const healthReward =
        (membershipPackage as any)[`renewal_health_l${level}`] || 0;
      const mealReward = (membershipPackage as any)[`renewal_meal_l${level}`] || 0;
      const securityReward =
        (membershipPackage as any)[`renewal_security_l${level}`] || 0;
      const shelterReward =
        (membershipPackage as any)[`shelter_l${level}`] || 0;

      // Build update data
      const updateData: any = {};
      if (cashReward > 0) {
        updateData.wallet = { increment: cashReward };
        totalCash += cashReward;
      }
      if (palliativeReward > 0) {
        updateData.palliative = { increment: palliativeReward };
        totalPalliative += palliativeReward;
      }
      if (cashbackReward > 0) {
        updateData.cashback = { increment: cashbackReward };
        totalCashback += cashbackReward;
      }
      if (healthReward > 0) {
        updateData.health = { increment: healthReward };
        totalHealth += healthReward;
      }
      if (mealReward > 0) {
        updateData.meal = { increment: mealReward };
        totalMeal += mealReward;
      }
      if (securityReward > 0) {
        updateData.security = { increment: securityReward };
        totalSecurity += securityReward;
      }
      if (shelterReward > 0) {
        updateData.shelter = { increment: shelterReward };
        totalShelter += shelterReward;
      }

      if (Object.keys(updateData).length > 0) {
        await prismaLike.user.update({
          where: { id: referrer.id },
          data: updateData,
        });
      }

      // Distribute BPT rewards
      if (bptReward > 0) {
        try {
          await distributeBptReward(
            referrer.id,
            bptReward,
            `AUTO_RENEWAL_L${level}`,
            `Auto-renewal reward L${level} from ${membershipPackage.name} renewal`
          );
          totalBpt += bptReward;
        } catch (err) {
          console.error(`[AUTO-RENEWAL] BPT reward distribution failed for referrer ${referrer.id}:`, err);
        }
      }
    }

    // 7. Update user's membership expiry, renewal count, and package (if upgrading)
    await prismaLike.user.update({
      where: { id: userId },
      data: {
        membershipExpiresAt: newExpiresAt,
        renewalCount: { increment: 1 },
        activeMembershipPackageId:
          renewalPackageInfo.packageId !== user.activeMembershipPackageId
            ? renewalPackageInfo.packageId
            : undefined,
      },
    });

    // 8. Create renewal history record
    const renewalHistory = await prismaLike.renewalHistory.create({
      data: {
        id: randomUUID(),
        userId,
        packageId: renewalPackageInfo.packageId,
        packageName: renewalPackageInfo.packageName,
        renewalNumber: user.renewalCount + 1,
        renewalFee: renewalPackageInfo.renewalFee,
        vat: renewalPackageInfo.vat,
        totalPaid: renewalPackageInfo.totalCost,
        expiresAt: newExpiresAt,
        cashDistributed: totalCash,
        bptDistributed: totalBpt,
        palliativeDistributed: totalPalliative,
        cashbackDistributed: totalCashback,
        healthDistributed: totalHealth,
        mealDistributed: totalMeal,
        securityDistributed: totalSecurity,
      },
    });

    // 9. Record revenue from membership renewal
    const renewalProfitFiat = computeProfitFiat({
      profitMode: (membershipPackage.profitMode ?? "PERCENT") as any,
      profitPercent: Number(membershipPackage.profitPercent ?? 1),
      profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
      baseFiat: Number(renewalPackageInfo.renewalFee ?? 0),
    });

    try {
      await recordRevenue(prismaLike, {
        source: "AUTO_MEMBERSHIP_RENEWAL",
        amount: renewalProfitFiat,
        currency: "NGN",
        sourceId: `AUTO_RENEWAL:${renewalHistory.id}`,
        description: `Auto-renewal: ${renewalPackageInfo.packageName}`,
        userId,
        packageId: membershipPackage.id,
        programType: "MEMBERSHIP_RENEWAL",
        metadata: {
          totalPaid: renewalPackageInfo.totalCost,
          renewalFee: renewalPackageInfo.renewalFee,
          vat: renewalPackageInfo.vat,
          renewalNumber: user.renewalCount + 1,
          renewalHistoryId: renewalHistory.id,
          isAutoRenewal: true,
          isUpgrade: renewalPackageInfo.isUpgrade,
        },
      });
    } catch (err) {
      console.error(`[AUTO-RENEWAL] Revenue recording failed for user ${userId}:`, err);
    }

    // 10. Send renewal notification
    try {
      await notifyMembershipRenewal(
        userId,
        renewalPackageInfo.packageName,
        user.renewalCount + 1,
        newExpiresAt,
        true // isAutoRenewal
      );
    } catch (err) {
      console.error(`[AUTO-RENEWAL] Notification failed for user ${userId}:`, err);
    }

    return {
      success: true,
      renewalHistoryId: renewalHistory.id,
      newExpiresAt,
      totalRewardsDistributed: {
        cash: totalCash,
        bpt: totalBpt,
        palliative: totalPalliative,
        cashback: totalCashback,
        health: totalHealth,
        meal: totalMeal,
        security: totalSecurity,
        shelter: totalShelter,
      },
    };
  } catch (err) {
    console.error(`[AUTO-RENEWAL] Process failed for user ${userId}:`, err);
    return {
      success: false,
      error: `Auto-renewal processing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Get users eligible for auto-renewal (expired memberships within last year)
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
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  return prismaLike.user.findMany({
    where: {
      activeMembershipPackageId: { not: null },
      membershipExpiresAt: {
        lte: now,
        gte: oneYearAgo,
      },
    },
    orderBy: [{ membershipExpiresAt: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      activeMembershipPackageId: true,
      membershipExpiresAt: true,
    },
  }).then((users) =>
    users.map((user) => {
      const daysExpired = user.membershipExpiresAt
        ? Math.floor(
            (now.getTime() - user.membershipExpiresAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;
      return { ...user, daysExpired };
    })
  );
}
