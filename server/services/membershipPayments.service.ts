import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

import { getReferralChain } from "@/server/services/referral.service";
import { distributeBptReward } from "@/server/services/rewards.service";
import { getPalliativeTier, getWalletFieldName, isHighTierPackage } from "@/lib/palliative";
import {
  notifyMembershipActivation,
  notifyReferralReward,
} from "@/server/services/notification.service";
import { processWalletAutoDebit } from "@/server/services/walletAutoDebit.service";

const MYNGUL_PACKAGES = [
  "Gold Plus",
  "Platinum Plus",
  "Travel & Tour Agent",
  "Basic Early Retirement",
  "Child Educational / Vocational Support",
] as const;

const MEMBERSHIP_TX_MAX_WAIT_MS = 30_000;
const MEMBERSHIP_TX_TIMEOUT_MS = 90_000;

type TxClient = PrismaClient | Prisma.TransactionClient;
type TxOptions = Parameters<PrismaClient["$transaction"]>[1];

/** Run a callback inside an interactive transaction if the client supports it, otherwise run directly. */
async function runAtomically<T>(
  client: TxClient,
  fn: (tx: TxClient) => Promise<T>,
  options?: TxOptions,
): Promise<T> {
  if ('$transaction' in client && typeof (client as any).$transaction === 'function') {
    return (client as PrismaClient).$transaction(fn, options);
  }
  return fn(client);
}

export async function activateMembershipAfterExternalPayment(params: {
  prisma: TxClient;
  userId: string;
  packageId: string;
  selectedPalliative?: "car" | "house" | "land" | "business" | "solar" | "education";
  paymentReference: string;
  paymentMethodLabel: string;
  activatorName?: string;
  skipRewards?: boolean;
}) {
  const {
    prisma,
    userId,
    packageId,
    selectedPalliative,
    paymentReference,
    paymentMethodLabel,
    activatorName,
    skipRewards = false,
  } = params;

  const existingActivation = await prisma.transaction.findFirst({
    where: {
      userId,
      reference: paymentReference,
      transactionType: "MEMBERSHIP_ACTIVATION",
    },
  });

  if (existingActivation) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        membershipExpiresAt: true,
        myngulActivationPin: true,
      },
    });

    return {
      success: true,
      expiresAt: existingUser?.membershipExpiresAt ?? existingActivation.createdAt,
      distributions: [],
      myngulActivated: false,
      myngulPin: existingUser?.myngulActivationPin ?? null,
      alreadyProcessed: true,
    };
  }

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

  const safeActivatorName = activatorName || "New Member";
  const timestamp = Date.now();
  const includesMyngul = MYNGUL_PACKAGES.includes(membershipPackage.name as any);
  const MYNGUL_CREDIT = 11000;

  // ── Pre-fetch referrer data (read-only, outside transaction) ──
  const referrerDataMap = new Map<string, {
    palliativeActivated: boolean | null;
    selectedPalliative: string | null;
    palliativeTier: string | null;
    isShelter: number | null;
    shelter: number | null;
  }>();
  for (const referrer of referralChain) {
    const data = await prisma.user.findUnique({
      where: { id: referrer.id },
      select: {
        palliativeActivated: true,
        selectedPalliative: true,
        palliativeTier: true,
        isShelter: true,
        shelter: true,
      },
    });
    if (data) referrerDataMap.set(referrer.id, data as any);
  }

  // ── Atomic transaction: all financial writes ──
  const txResult = await runAtomically(prisma, async (tx) => {
    const distributions: Array<{
      referrerId: string;
      level: number;
      cash: number;
      palliative: number;
      bpt: number;
      cashback: number;
    }> = [];

    // ── Referral chain wallet credits (skipped for free promo activations) ──
    for (let i = 0; i < (skipRewards ? 0 : referralChain.length); i++) {
      const referrer = referralChain[i];
      const level = (i + 1) as 1 | 2 | 3 | 4;

      const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
      const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
      const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
      const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;

      const referrerData = referrerDataMap.get(referrer.id);

      const updateData: any = {};
      if (cashReward > 0) updateData.wallet = { increment: cashReward };

      const hasShelter = (referrerData?.isShelter === 1) || ((referrerData?.shelter ?? 0) > 0);

      if (palliativeReward > 0) {
        if (hasShelter) {
          updateData.palliative = { increment: palliativeReward };
        } else if (referrerData?.palliativeActivated && referrerData.selectedPalliative) {
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
        await tx.user.update({ where: { id: referrer.id }, data: updateData });
      }

      // Auto-debit referral cash reward to community wallet if configured
      if (cashReward > 0) {
        await processWalletAutoDebit({ prisma: tx, userId: referrer.id, creditAmount: cashReward, trigger: "reward" });
      }

      if (cashReward > 0) {
        await tx.transaction.create({
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
        await tx.transaction.create({
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
        await tx.transaction.create({
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

      distributions.push({
        referrerId: referrer.id,
        level,
        cash: cashReward,
        palliative: palliativeReward,
        bpt: bptReward,
        cashback: cashbackReward,
      });
    }

    // ── Myngul credit (skipped for free promo activations) ──
    let activationPin: string | null = null;
    if (includesMyngul && !skipRewards) {
      activationPin = `BPI-${Date.now().toString().slice(-8)}`;

      await tx.user.update({
        where: { id: userId },
        data: {
          socialMedia: { increment: MYNGUL_CREDIT },
          myngulActivationPin: activationPin,
        },
      });

      await tx.transaction.create({
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

    // ── Palliative activation ──
    const palliativeData: any = { palliativeTier };

    if (isHighTier && selectedPalliative) {
      palliativeData.palliativeActivated = true;
      palliativeData.selectedPalliative = selectedPalliative;
      palliativeData.palliativeActivatedAt = activatedAt;

      await tx.palliativeWalletActivation.create({
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

    // ── User activation ──
    await tx.user.update({
      where: { id: userId },
      data: {
        activeMembershipPackageId: packageId,
        membershipActivatedAt: activatedAt,
        membershipExpiresAt: expiresAt,
        activated: true,
        ...palliativeData,
      },
    });

    // ── Activation transaction record ──
    await tx.transaction.create({
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

    // ── VAT transaction ──
    if (membershipPackage.vat > 0) {
      await tx.transaction.create({
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

    return { distributions, activationPin };
  }, { maxWait: MEMBERSHIP_TX_MAX_WAIT_MS, timeout: MEMBERSHIP_TX_TIMEOUT_MS });

  // ── Post-commit: BPT distribution (best-effort, uses its own transaction) ──
  for (let i = 0; i < (skipRewards ? 0 : referralChain.length); i++) {
    const referrer = referralChain[i];
    const level = (i + 1) as 1 | 2 | 3 | 4;
    const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;

    if (bptReward > 0) {
      try {
        const bptResult = await distributeBptReward(
          referrer.id,
          bptReward,
          `REFERRAL_L${level}`,
          `Referral reward L${level} from ${membershipPackage.name} activation`,
        );
        if (bptResult.userBptUnits > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referrer.id,
              transactionType: `REFERRAL_BPT_L${level}`,
              amount: bptResult.userBptUnits,
              description: `L${level} BPT referral reward (50% user share) from ${membershipPackage.name} activation by ${safeActivatorName} (Referral ID: ${userId})`,
              status: "completed",
              reference: `REF-BPT-${packageId}-L${level}-${timestamp}`,
              walletType: "bpiToken",
            },
          });
        }
      } catch (err) {
        console.error(`[MEMBERSHIP] BPT distribution failed for referrer ${referrer.id} L${level} (core activation succeeded):`, err);
      }
    }
  }

  // ── Post-commit: Notifications (best-effort, skipped for free promo) ──
  for (let i = 0; i < (skipRewards ? 0 : referralChain.length); i++) {
    const referrer = referralChain[i];
    const level = (i + 1) as 1 | 2 | 3 | 4;
    const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
    const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
    const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
    const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;
    try {
      await notifyReferralReward(
        referrer.id,
        safeActivatorName,
        `${membershipPackage.name} (L${level}) referral reward`,
        cashReward + palliativeReward + bptReward + cashbackReward,
      );
    } catch {
      // Notification failure is non-critical
    }
  }

  try {
    await notifyMembershipActivation(userId, membershipPackage.name, expiresAt);
  } catch {
    // Notification failure is non-critical
  }

  return {
    success: true,
    expiresAt,
    distributions: txResult.distributions,
    myngulActivated: includesMyngul,
    myngulPin: txResult.activationPin,
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

  const existingUpgrade = await prisma.transaction.findFirst({
    where: {
      userId,
      reference: paymentReference,
      transactionType: "membership_upgrade",
    },
  });

  if (existingUpgrade) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { membershipExpiresAt: true },
    });

    return {
      success: true,
      upgradeCost,
      newExpiry: existingUser?.membershipExpiresAt ?? existingUpgrade.createdAt,
      packageName: newPackage.name,
      myngulActivated: false,
      myngulPin: null,
      alreadyProcessed: true,
    };
  }

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

  // ── Pre-fetch referrer data (read-only, outside transaction) ──
  const referrerDataMap = new Map<string, {
    palliativeActivated: boolean | null;
    selectedPalliative: string | null;
    palliativeTier: string | null;
  }>();
  for (let level = 1; level <= 4; level++) {
    const referrer = referralChain[level - 1];
    if (!referrer) continue;
    const referrerId = (referrer as any).id ?? referrer;
    const data = await prisma.user.findUnique({
      where: { id: referrerId },
      select: { palliativeActivated: true, selectedPalliative: true, palliativeTier: true },
    });
    if (data) referrerDataMap.set(referrerId, data);
  }

  const newPackageIncludesMyngul = MYNGUL_PACKAGES.includes(newPackage.name as any);
  const currentPackageIncludesMyngul = MYNGUL_PACKAGES.includes(currentPackage.name as any);
  const MYNGUL_CREDIT = 11000;

  // ── Deferred side-effects collectors ──
  const deferredBpt: Array<{ referrerId: string; amount: number }> = [];
  const deferredNotifications: Array<{ referrerId: string; total: number; level: number }> = [];

  // ── Atomic transaction: all financial writes ──
  const txResult = await runAtomically(prisma, async (tx) => {
    // ── Referral chain differential bonuses ──
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
        const referrerData = referrerDataMap.get(referrerId);

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

        await tx.user.update({ where: { id: referrerId }, data: updateData });

        await tx.transaction.create({
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

        if (bonuses.bpt > 0) {
          deferredBpt.push({ referrerId, amount: bonuses.bpt });
        }
        deferredNotifications.push({
          referrerId,
          total: bonuses.cash + bonuses.palliative + bonuses.cashback + bonuses.bpt,
          level,
        });
      }
    }

    // ── Myngul credit ──
    let upgradePin: string | null = null;
    if (newPackageIncludesMyngul && !currentPackageIncludesMyngul) {
      upgradePin = `BPI-UPG-${Date.now().toString().slice(-8)}`;

      await tx.user.update({
        where: { id: userId },
        data: {
          socialMedia: { increment: MYNGUL_CREDIT },
          myngulActivationPin: upgradePin,
        },
      });

      await tx.transaction.create({
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

    // ── Palliative handling ──
    const palliativeUpdateData: any = {};
    palliativeUpdateData.palliativeTier = newPalliativeTier;

    if (isNewHighTier && !currentUser?.palliativeActivated && selectedPalliative) {
      palliativeUpdateData.palliativeActivated = true;
      palliativeUpdateData.selectedPalliative = selectedPalliative;
      palliativeUpdateData.palliativeActivatedAt = new Date();

      await tx.palliativeWalletActivation.create({
        data: {
          id: randomUUID(),
          userId,
          palliativeType: selectedPalliative,
          membershipTier: newPackage.name,
          activationType: "instant",
        },
      });

      const userWithPooled = await tx.user.findUnique({
        where: { id: userId },
        select: { palliative: true },
      });

      if (userWithPooled && userWithPooled.palliative > 0) {
        const walletField = getWalletFieldName(selectedPalliative);
        palliativeUpdateData[walletField] = { increment: userWithPooled.palliative };
        palliativeUpdateData.palliative = 0;

        await tx.transaction.create({
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

    // ── User activation update ──
    await tx.user.update({
      where: { id: userId },
      data: {
        activeMembershipPackageId: packageId,
        membershipActivatedAt: activatedAt,
        membershipExpiresAt: expiresAt,
        ...palliativeUpdateData,
      },
    });

    // ── Upgrade transaction record ──
    await tx.transaction.create({
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

    // ── VAT differential ──
    const vatDifferential = newPackage.vat - currentPackage.vat;
    if (vatDifferential > 0) {
      await tx.transaction.create({
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

    return { upgradePin };
  }, { maxWait: MEMBERSHIP_TX_MAX_WAIT_MS, timeout: MEMBERSHIP_TX_TIMEOUT_MS });

  // ── Post-commit: BPT distribution (best-effort) ──
  for (const item of deferredBpt) {
    try {
      await distributeBptReward(item.referrerId, item.amount);
    } catch (err) {
      console.error(`[UPGRADE] BPT distribution failed for referrer ${item.referrerId} (core upgrade succeeded):`, err);
    }
  }

  // ── Post-commit: Notifications (best-effort) ──
  for (const item of deferredNotifications) {
    try {
      await notifyReferralReward(
        item.referrerId,
        userId,
        `Membership Upgrade Bonus (${newPackage.name}) - L${item.level}`,
        item.total,
      );
    } catch {
      // Notification failure is non-critical
    }
  }

  try {
    await notifyMembershipActivation(userId, newPackage.name, expiresAt);
  } catch {
    // Notification failure is non-critical
  }

  return {
    success: true,
    upgradeCost,
    newExpiry: expiresAt,
    packageName: newPackage.name,
    myngulActivated: newPackageIncludesMyngul && !currentPackageIncludesMyngul,
    myngulPin: txResult.upgradePin,
  };
}
