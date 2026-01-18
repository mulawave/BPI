import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

/**
 * Composite package configurations
 * These packages include Regular Plus membership + specialized wallet allocation
 */
const COMPOSITE_PACKAGES = {
  "Travel & Tour Agent": {
    totalPrice: 330000,
    regularPlusAmount: 50000,
    specializedWalletAmount: 269000,
    specializedWalletField: "travelTour" as const,
    myngulAmount: 11000,
  },
  "Basic Early Retirement": {
    totalPrice: 267000,
    regularPlusAmount: 50000,
    specializedWalletAmount: 206000,
    specializedWalletField: "retirement" as const,
    myngulAmount: 11000,
  },
} as const;

type CompositePackageName = keyof typeof COMPOSITE_PACKAGES;

export function isCompositePackage(packageName: string): packageName is CompositePackageName {
  return packageName in COMPOSITE_PACKAGES;
}

export function getCompositeConfig(packageName: string) {
  if (!isCompositePackage(packageName)) {
    return null;
  }
  return COMPOSITE_PACKAGES[packageName];
}

/**
 * Process a composite package purchase
 * This allocates funds to:
 * 1. Regular Plus membership activation (₦50,000)
 * 2. Specialized wallet (Travel & Tour or Retirement)
 * 3. Myngul wallet (₦11,000)
 */
export async function processCompositePackagePurchase(params: {
  prisma: TxClient;
  userId: string;
  packageName: string;
  packageId: string;
  totalPaid: number;
  referralDistributions: Array<{
    level: number;
    cash: number;
    palliative: number;
    bpt: number;
    cashback: number;
  }>;
  paymentReference: string;
}) {
  const { prisma, userId, packageName, packageId, totalPaid, referralDistributions, paymentReference } = params;

  const config = getCompositeConfig(packageName);
  if (!config) {
    throw new Error(`${packageName} is not a composite package`);
  }

  // Get Regular Plus package
  const regularPlusPackage = await prisma.membershipPackage.findFirst({
    where: { name: "Regular Plus" },
  });

  if (!regularPlusPackage) {
    throw new Error("Regular Plus package not found in database");
  }

  // Calculate total referral distribution amount
  const totalReferralAmount = referralDistributions.reduce(
    (sum, dist) => sum + dist.cash + dist.palliative + dist.cashback,
    0
  );

  // Calculate net specialized wallet amount (after referral distributions)
  const netSpecializedAmount = config.specializedWalletAmount - totalReferralAmount;

  // 1. Activate Regular Plus membership
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.user.update({
    where: { id: userId },
    data: {
      activeMembershipPackageId: regularPlusPackage.id,
      membershipActivatedAt: now,
      membershipExpiresAt: expiresAt,
      activated: true,
    },
  });

  // 2. Credit specialized wallet (net amount after referral distributions)
  const walletUpdate: any = {
    [config.specializedWalletField]: { increment: netSpecializedAmount },
  };
  
  await prisma.user.update({
    where: { id: userId },
    data: walletUpdate,
  });

  // 3. Credit Myngul wallet and generate PIN
  const myngulPin = `BPI-${Date.now().toString().slice(-8)}`;
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      socialMedia: { increment: config.myngulAmount },
      myngulActivationPin: myngulPin,
    },
  });

  // 4. Create transactions for tracking
  const transactions = [];

  // Regular Plus membership transaction
  transactions.push(
    prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "MEMBERSHIP_ACTIVATION",
        amount: -config.regularPlusAmount,
        description: `Regular Plus membership activated via ${packageName} composite package`,
        status: "completed",
        reference: `${paymentReference}-REGPLUS`,
      },
    })
  );

  // Specialized wallet credit transaction
  transactions.push(
    prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "COMPOSITE_PACKAGE_ALLOCATION",
        amount: netSpecializedAmount,
        description: `${config.specializedWalletField} wallet credit from ${packageName} package (₦${config.specializedWalletAmount.toLocaleString()} - ₦${totalReferralAmount.toLocaleString()} referral distributions)`,
        status: "completed",
        reference: `${paymentReference}-SPECIAL`,
        walletType: config.specializedWalletField,
      },
    })
  );

  // Myngul wallet credit transaction
  transactions.push(
    prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "MYNGUL_ACTIVATION",
        amount: config.myngulAmount,
        description: `MYNGUL Social Media Wallet Credit - ${packageName} Activation`,
        status: "completed",
        reference: `${paymentReference}-MYNGUL`,
      },
    })
  );

  await Promise.all(transactions);

  return {
    membershipPackageActivated: "Regular Plus",
    specializedWalletCredited: {
      field: config.specializedWalletField,
      grossAmount: config.specializedWalletAmount,
      referralDistributions: totalReferralAmount,
      netAmount: netSpecializedAmount,
    },
    myngulCredited: config.myngulAmount,
    myngulPin,
    expiresAt,
  };
}
