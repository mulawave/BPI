import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

import { getReferralChain } from "@/server/services/referral.service";
import { distributeBptReward } from "@/server/services/rewards.service";
import { getPalliativeTier, getWalletFieldName, isHighTierPackage } from "@/lib/palliative";
import {
  notifyMembershipActivation,
  notifyReferralReward,
} from "@/server/services/notification.service";

const MYNGUL_PACKAGES = [
  "Gold Plus",
  "Platinum Plus",
  "Travel & Tour Agent",
  "Basic Early Retirement",
  "Child Educational / Vocational Support",
] as const;

type TxClient = PrismaClient | Prisma.TransactionClient;

export async function activateMembershipAfterExternalPayment(params: {
  prisma: TxClient;
  userId: string;
  packageId: string;
  selectedPalliative?: "car" | "house" | "land" | "business" | "solar" | "education";
  paymentReference: string;
  paymentMethodLabel: string;
  activatorName?: string;
}) {
  const {
    prisma,
    userId,
    packageId,
    selectedPalliative,
    paymentReference,
    paymentMethodLabel,
    activatorName,
  } = params;

  const membershipPackage = await prisma.membershipPackage.findUnique({
    where: { id: packageId },
  });

  if (!membershipPackage) {
    throw new Error("Membership package not found.");
  }

  const palliativeTier = getPalliativeTier(membershipPackage.price);
  const isHighTier = isHighTierPackage(membershipPackage.name);

  if (isHighTier && !selectedPalliative) {
    throw new Error("Please select a palliative option for your membership tier.");
  }

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt);
  expiresAt.setDate(expiresAt.getDate() + 365);

  const referralChain = await getReferralChain(userId, 4);

  const distributions: Array<{
    referrerId: string;
    level: number;
    cash: number;
    palliative: number;
    bpt: number;
    cashback: number;
  }> = [];

  const safeActivatorName = activatorName || "New Member";
  const timestamp = Date.now();

  for (let i = 0; i < referralChain.length; i++) {
    const referrer = referralChain[i];
    const level = (i + 1) as 1 | 2 | 3 | 4;

    const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
    const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
    const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
    const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;

    const referrerData = await prisma.user.findUnique({
      where: { id: referrer.id },
      select: {
        palliativeActivated: true,
        selectedPalliative: true,
        palliativeTier: true,
      },
    });

    const updateData: any = {};
    if (cashReward > 0) updateData.wallet = { increment: cashReward };

    if (palliativeReward > 0) {
      if (referrerData?.palliativeActivated && referrerData.selectedPalliative) {
        const walletField = getWalletFieldName(referrerData.selectedPalliative as any);
        updateData[walletField] = { increment: palliativeReward };
      } else if (referrerData?.palliativeTier === "lower") {
        updateData.palliative = { increment: palliativeReward };
      } else {
        updateData.palliative = { increment: palliativeReward };
      }
    }

    if (cashbackReward > 0) updateData.cashback = { increment: cashbackReward };

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id: referrer.id }, data: updateData });
    }

    if (bptReward > 0) {
      await distributeBptReward(
        referrer.id,
        bptReward,
        `REFERRAL_L${level}`,
        `Referral reward L${level} from ${membershipPackage.name} activation`,
      );
    }

    const userBptShare = bptReward / 2;

    if (cashReward > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: referrer.id,
          transactionType: `REFERRAL_CASH_L${level}`,
          amount: cashReward,
          description: `L${level} Cash Wallet referral reward from ${membershipPackage.name} activation by ${safeActivatorName} (Referral ID: ${userId})`,
          status: "completed",
          reference: `REF-CASH-${packageId}-L${level}-${timestamp}`,
        },
      });
    }

    if (palliativeReward > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: referrer.id,
          transactionType: `REFERRAL_PALLIATIVE_L${level}`,
          amount: palliativeReward,
          description: `L${level} Palliative Wallet referral reward from ${membershipPackage.name} activation by ${safeActivatorName} (Referral ID: ${userId})`,
          status: "completed",
          reference: `REF-PAL-${packageId}-L${level}-${timestamp}`,
        },
      });
    }

    if (cashbackReward > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: referrer.id,
          transactionType: `REFERRAL_CASHBACK_L${level}`,
          amount: cashbackReward,
          description: `L${level} Cashback Wallet referral reward from ${membershipPackage.name} activation by ${safeActivatorName} (Referral ID: ${userId})`,
          status: "completed",
          reference: `REF-CB-${packageId}-L${level}-${timestamp}`,
        },
      });
    }

    if (userBptShare > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: referrer.id,
          transactionType: `REFERRAL_BPT_L${level}`,
          amount: userBptShare,
          description: `L${level} BPT referral reward (50% user share) from ${membershipPackage.name} activation by ${safeActivatorName} (Referral ID: ${userId})`,
          status: "completed",
          reference: `REF-BPT-${packageId}-L${level}-${timestamp}`,
          walletType: "bpiToken",
        },
      });
    }

    distributions.push({
      referrerId: referrer.id,
      level,
      cash: cashReward,
      palliative: palliativeReward,
      bpt: bptReward,
      cashback: cashbackReward,
    });

    await notifyReferralReward(
      referrer.id,
      safeActivatorName,
      `${membershipPackage.name} (L${level}) referral reward`,
      cashReward + palliativeReward + bptReward + cashbackReward,
    );
  }

  const includesMyngul = MYNGUL_PACKAGES.includes(membershipPackage.name as any);
  const MYNGUL_CREDIT = 11000;
  let activationPin: string | null = null;

  if (includesMyngul) {
    activationPin = `BPI-${Date.now().toString().slice(-8)}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        socialMedia: { increment: MYNGUL_CREDIT },
        myngulActivationPin: activationPin,
      },
    });

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "MYNGUL_ACTIVATION",
        amount: MYNGUL_CREDIT,
        description: `MYNGUL Social Media Wallet Credit - ${membershipPackage.name} Activation`,
        status: "completed",
        reference: `MYNGUL-ACT-${packageId}-${Date.now()}`,
      },
    });
  }

  const palliativeData: any = { palliativeTier };

  if (isHighTier && selectedPalliative) {
    const palliativeActivatedAt = activatedAt;
    palliativeData.palliativeActivated = true;
    palliativeData.selectedPalliative = selectedPalliative;
    palliativeData.palliativeActivatedAt = palliativeActivatedAt;

    await prisma.palliativeWalletActivation.create({
      data: {
        id: randomUUID(),
        userId,
        palliativeType: selectedPalliative,
        membershipTier: membershipPackage.name,
        activationType: "instant",
      },
    });
  } else if (palliativeTier === "lower") {
    palliativeData.palliativeActivated = false;
    palliativeData.palliative = 0;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      activeMembershipPackageId: packageId,
      membershipActivatedAt: activatedAt,
      membershipExpiresAt: expiresAt,
      activated: true,
      ...palliativeData,
    },
  });

  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "MEMBERSHIP_ACTIVATION",
      amount: -(membershipPackage.price + membershipPackage.vat),
      description: `${membershipPackage.name} membership activation (${paymentMethodLabel})`,
      status: "completed",
      reference: paymentReference,
    },
  });

  if (membershipPackage.vat > 0) {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "VAT",
        amount: membershipPackage.vat,
        description: `VAT on ${membershipPackage.name} membership activation`,
        status: "completed",
        reference: `VAT-${paymentReference}`,
      },
    });
  }

  await notifyMembershipActivation(userId, membershipPackage.name, expiresAt);

  return {
    success: true,
    expiresAt,
    distributions,
    myngulActivated: includesMyngul,
    myngulPin: activationPin,
  };
}

export async function upgradeMembershipAfterExternalPayment(params: {
  prisma: TxClient;
  userId: string;
  packageId: string;
  currentPackageId: string;
  selectedPalliative?: "car" | "house" | "land" | "business" | "solar" | "education";
  paymentReference: string;
  paymentMethodLabel: string;
}) {
  const {
    prisma,
    userId,
    packageId,
    currentPackageId,
    selectedPalliative,
    paymentReference,
    paymentMethodLabel,
  } = params;

  const [newPackage, currentPackage] = await Promise.all([
    prisma.membershipPackage.findUnique({ where: { id: packageId } }),
    prisma.membershipPackage.findUnique({ where: { id: currentPackageId } }),
  ]);

  if (!newPackage || !currentPackage) {
    throw new Error("Package not found.");
  }

  const currentTotal = currentPackage.price + currentPackage.vat;
  const newTotal = newPackage.price + newPackage.vat;
  const upgradeCost = newTotal - currentTotal;

  const newPalliativeTier = getPalliativeTier(newPackage.price);
  const isNewHighTier = isHighTierPackage(newPackage.name);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { palliativeActivated: true, selectedPalliative: true },
  });

  if (upgradeCost <= 0) {
    throw new Error("Cannot upgrade to a lower or same tier package.");
  }

  if (isNewHighTier && !currentUser?.palliativeActivated && !selectedPalliative) {
    throw new Error("Please select a palliative option for your new membership tier.");
  }

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt);
  expiresAt.setDate(expiresAt.getDate() + 365);

  const referralChain = await getReferralChain(userId, 4);

  const bonusDifferences = {
    l1: {
      cash: newPackage.cash_l1 - currentPackage.cash_l1,
      palliative: newPackage.palliative_l1 - currentPackage.palliative_l1,
      bpt: newPackage.bpt_l1 - currentPackage.bpt_l1,
      cashback: (newPackage.cashback_l1 || 0) - (currentPackage.cashback_l1 || 0),
    },
    l2: {
      cash: newPackage.cash_l2 - currentPackage.cash_l2,
      palliative: newPackage.palliative_l2 - currentPackage.palliative_l2,
      bpt: newPackage.bpt_l2 - currentPackage.bpt_l2,
      cashback: (newPackage.cashback_l2 || 0) - (currentPackage.cashback_l2 || 0),
    },
    l3: {
      cash: newPackage.cash_l3 - currentPackage.cash_l3,
      palliative: newPackage.palliative_l3 - currentPackage.palliative_l3,
      bpt: newPackage.bpt_l3 - currentPackage.bpt_l3,
      cashback: (newPackage.cashback_l3 || 0) - (currentPackage.cashback_l3 || 0),
    },
    l4: {
      cash: newPackage.cash_l4 - currentPackage.cash_l4,
      palliative: newPackage.palliative_l4 - currentPackage.palliative_l4,
      bpt: newPackage.bpt_l4 - currentPackage.bpt_l4,
      cashback: (newPackage.cashback_l4 || 0) - (currentPackage.cashback_l4 || 0),
    },
  };

  for (let level = 1; level <= 4; level++) {
    const referrer = referralChain[level - 1];
    if (!referrer) continue;

    const referrerId = (referrer as any).id ?? referrer;
    const levelKey = `l${level}` as "l1" | "l2" | "l3" | "l4";
    const bonuses = (bonusDifferences as any)[levelKey];

    if (
      bonuses.cash > 0 ||
      bonuses.palliative > 0 ||
      bonuses.bpt > 0 ||
      bonuses.cashback > 0
    ) {
      const referrerData = await prisma.user.findUnique({
        where: { id: referrerId },
        select: {
          palliativeActivated: true,
          selectedPalliative: true,
          palliativeTier: true,
        },
      });

      const updateData: any = {};
      if (bonuses.cash > 0) updateData.wallet = { increment: bonuses.cash };

      if (bonuses.palliative > 0) {
        if (referrerData?.palliativeActivated && referrerData.selectedPalliative) {
          const walletField = getWalletFieldName(referrerData.selectedPalliative as any);
          updateData[walletField] = { increment: bonuses.palliative };
        } else if (referrerData?.palliativeTier === "lower") {
          updateData.palliative = { increment: bonuses.palliative };
        } else {
          updateData.palliative = { increment: bonuses.palliative };
        }
      }

      if (bonuses.cashback > 0) updateData.cashback = { increment: bonuses.cashback };

      await prisma.user.update({ where: { id: referrerId }, data: updateData });

      if (bonuses.bpt > 0) {
        await distributeBptReward(referrerId, bonuses.bpt);
      }

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: referrerId,
          transactionType: `membership_upgrade_bonus_l${level}`,
          amount: bonuses.cash + bonuses.palliative + bonuses.cashback + bonuses.bpt,
          description: `Referral bonus (differential) for ${newPackage.name} upgrade - Level ${level}`,
          status: "completed",
          reference: `UPGRADE-${Date.now()}-L${level}`,
        },
      });

      await notifyReferralReward(
        referrerId,
        userId,
        `Membership Upgrade Bonus (${newPackage.name}) - L${level}`,
        bonuses.cash + bonuses.palliative + bonuses.cashback + bonuses.bpt,
      );
    }
  }

  const newPackageIncludesMyngul = MYNGUL_PACKAGES.includes(newPackage.name as any);
  const currentPackageIncludesMyngul = MYNGUL_PACKAGES.includes(currentPackage.name as any);
  const MYNGUL_CREDIT = 11000;
  let upgradePin: string | null = null;

  if (newPackageIncludesMyngul && !currentPackageIncludesMyngul) {
    upgradePin = `BPI-UPG-${Date.now().toString().slice(-8)}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        socialMedia: { increment: MYNGUL_CREDIT },
        myngulActivationPin: upgradePin,
      },
    });

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "MYNGUL_UPGRADE",
        amount: MYNGUL_CREDIT,
        description: `MYNGUL Social Media Wallet Credit - Upgrade to ${newPackage.name}`,
        status: "completed",
        reference: `MYNGUL-UPG-${packageId}-${Date.now()}`,
      },
    });
  }

  const palliativeUpdateData: any = {};
  palliativeUpdateData.palliativeTier = newPalliativeTier;

  if (isNewHighTier && !currentUser?.palliativeActivated && selectedPalliative) {
    const palliativeActivatedAt = new Date();
    palliativeUpdateData.palliativeActivated = true;
    palliativeUpdateData.selectedPalliative = selectedPalliative;
    palliativeUpdateData.palliativeActivatedAt = palliativeActivatedAt;

    await prisma.palliativeWalletActivation.create({
      data: {
        id: randomUUID(),
        userId,
        palliativeType: selectedPalliative,
        membershipTier: newPackage.name,
        activationType: "instant",
      },
    });

    const userWithPooled = await prisma.user.findUnique({
      where: { id: userId },
      select: { palliative: true },
    });

    if (userWithPooled && userWithPooled.palliative > 0) {
      const walletField = getWalletFieldName(selectedPalliative);
      palliativeUpdateData[walletField] = { increment: userWithPooled.palliative };
      palliativeUpdateData.palliative = 0;

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "PALLIATIVE_TRANSFER",
          amount: userWithPooled.palliative,
          description: `Transferred pooled palliative balance to ${selectedPalliative} wallet on upgrade to ${newPackage.name}`,
          status: "completed",
          reference: `PAL-TRANSFER-${Date.now()}`,
        },
      });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      activeMembershipPackageId: packageId,
      membershipActivatedAt: activatedAt,
      membershipExpiresAt: expiresAt,
      ...palliativeUpdateData,
    },
  });

  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "membership_upgrade",
      amount: -upgradeCost,
      description: `Upgraded from ${currentPackage.name} to ${newPackage.name} (${paymentMethodLabel})`,
      status: "completed",
      reference: paymentReference,
    },
  });

  const vatDifferential = newPackage.vat - currentPackage.vat;
  if (vatDifferential > 0) {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "VAT",
        amount: vatDifferential,
        description: `VAT on ${currentPackage.name} to ${newPackage.name} upgrade`,
        status: "completed",
        reference: `VAT-${paymentReference}`,
      },
    });
  }

  await notifyMembershipActivation(userId, newPackage.name, expiresAt);

  return {
    success: true,
    upgradeCost,
    newExpiry: expiresAt,
    packageName: newPackage.name,
    myngulActivated: newPackageIncludesMyngul && !currentPackageIncludesMyngul,
    myngulPin: upgradePin,
  };
}
