/*
  Warnings:

  - You are about to drop the column `balance` on the `SystemWallet` table. All the data in the column will be lost.
  - Added the required column `burnType` to the `BurnEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empowermentType` to the `EmpowermentPackage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BurnEvent" ADD COLUMN     "burnType" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "systemWalletId" TEXT,
ADD COLUMN     "triggeredBy" TEXT;

-- AlterTable
ALTER TABLE "EmpowermentPackage" ADD COLUMN     "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "adminApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "beneficiaryCanView" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "beneficiaryCanWithdraw" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "conversionAmount" DOUBLE PRECISION,
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "empowermentType" TEXT NOT NULL,
ADD COLUMN     "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fallbackGrossAmount" DOUBLE PRECISION NOT NULL DEFAULT 396000,
ADD COLUMN     "fallbackNetAmount" DOUBLE PRECISION NOT NULL DEFAULT 366300,
ADD COLUMN     "packageFee" DOUBLE PRECISION NOT NULL DEFAULT 330000,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "releasedAt" TIMESTAMP(3),
ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
ADD COLUMN     "totalTaxDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vat" DOUBLE PRECISION NOT NULL DEFAULT 24750,
ADD COLUMN     "walletCreditAmount" DOUBLE PRECISION,
ALTER COLUMN "grossEmpowermentValue" SET DEFAULT 7250000,
ALTER COLUMN "netEmpowermentValue" SET DEFAULT 6706250,
ALTER COLUMN "grossSponsorReward" SET DEFAULT 1000000,
ALTER COLUMN "netSponsorReward" SET DEFAULT 925000;

-- AlterTable
ALTER TABLE "MembershipPackage" ADD COLUMN     "cashback_l1" DOUBLE PRECISION,
ADD COLUMN     "cashback_l2" DOUBLE PRECISION,
ADD COLUMN     "cashback_l3" DOUBLE PRECISION,
ADD COLUMN     "cashback_l4" DOUBLE PRECISION,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasRenewal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "packageType" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "renewalCycle" INTEGER NOT NULL DEFAULT 365,
ADD COLUMN     "renewalFee" DOUBLE PRECISION,
ADD COLUMN     "renewal_bpt_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_bpt_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_bpt_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_bpt_l4" DOUBLE PRECISION,
ADD COLUMN     "renewal_cash_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_cash_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_cash_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_cash_l4" DOUBLE PRECISION,
ADD COLUMN     "renewal_cashback_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_cashback_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_cashback_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_cashback_l4" DOUBLE PRECISION,
ADD COLUMN     "renewal_health_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_health_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_health_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_health_l4" DOUBLE PRECISION,
ADD COLUMN     "renewal_meal_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_meal_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_meal_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_meal_l4" DOUBLE PRECISION,
ADD COLUMN     "renewal_palliative_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_palliative_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_palliative_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_palliative_l4" DOUBLE PRECISION,
ADD COLUMN     "renewal_security_l1" DOUBLE PRECISION,
ADD COLUMN     "renewal_security_l2" DOUBLE PRECISION,
ADD COLUMN     "renewal_security_l3" DOUBLE PRECISION,
ADD COLUMN     "renewal_security_l4" DOUBLE PRECISION,
ADD COLUMN     "shelter_l1" DOUBLE PRECISION,
ADD COLUMN     "shelter_l10" DOUBLE PRECISION,
ADD COLUMN     "shelter_l2" DOUBLE PRECISION,
ADD COLUMN     "shelter_l3" DOUBLE PRECISION,
ADD COLUMN     "shelter_l4" DOUBLE PRECISION,
ADD COLUMN     "shelter_l5" DOUBLE PRECISION,
ADD COLUMN     "shelter_l6" DOUBLE PRECISION,
ADD COLUMN     "shelter_l7" DOUBLE PRECISION,
ADD COLUMN     "shelter_l8" DOUBLE PRECISION,
ADD COLUMN     "shelter_l9" DOUBLE PRECISION,
ALTER COLUMN "cash_l1" SET DEFAULT 0,
ALTER COLUMN "bpt_l1" SET DEFAULT 0,
ALTER COLUMN "palliative_l1" SET DEFAULT 0,
ALTER COLUMN "cash_l2" SET DEFAULT 0,
ALTER COLUMN "bpt_l2" SET DEFAULT 0,
ALTER COLUMN "palliative_l2" SET DEFAULT 0,
ALTER COLUMN "cash_l3" SET DEFAULT 0,
ALTER COLUMN "bpt_l3" SET DEFAULT 0,
ALTER COLUMN "palliative_l3" SET DEFAULT 0,
ALTER COLUMN "cash_l4" SET DEFAULT 0,
ALTER COLUMN "bpt_l4" SET DEFAULT 0,
ALTER COLUMN "palliative_l4" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SystemWallet" DROP COLUMN "balance",
ADD COLUMN     "balanceBpt" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceNgn" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isPubliclyVisible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "membershipActivatedAt" TIMESTAMP(3),
ADD COLUMN     "membershipExpiresAt" TIMESTAMP(3),
ADD COLUMN     "renewalCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "security" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BuyBackEvent" (
    "id" TEXT NOT NULL,
    "systemWalletId" TEXT NOT NULL,
    "amountNgn" DOUBLE PRECISION NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "bptPurchased" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyBackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "renewalNumber" INTEGER NOT NULL,
    "renewalFee" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "totalPaid" DOUBLE PRECISION NOT NULL,
    "renewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cashDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bptDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliativeDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "securityDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RenewalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelterReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "packageType" TEXT NOT NULL,
    "sourceActivationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShelterReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "memberAmount" DOUBLE PRECISION NOT NULL,
    "buyBackAmount" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpowermentTransaction" (
    "id" TEXT NOT NULL,
    "empowermentPackageId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmpowermentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BptConversionRate" (
    "id" TEXT NOT NULL,
    "rateUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.002,
    "rateNgn" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BptConversionRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyBackEvent_systemWalletId_idx" ON "BuyBackEvent"("systemWalletId");

-- CreateIndex
CREATE INDEX "RenewalHistory_userId_idx" ON "RenewalHistory"("userId");

-- CreateIndex
CREATE INDEX "ShelterReward_userId_idx" ON "ShelterReward"("userId");

-- CreateIndex
CREATE INDEX "TokenTransaction_userId_idx" ON "TokenTransaction"("userId");

-- CreateIndex
CREATE INDEX "TokenTransaction_transactionType_idx" ON "TokenTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "EmpowermentTransaction_empowermentPackageId_idx" ON "EmpowermentTransaction"("empowermentPackageId");

-- CreateIndex
CREATE INDEX "BurnEvent_systemWalletId_idx" ON "BurnEvent"("systemWalletId");

-- AddForeignKey
ALTER TABLE "BuyBackEvent" ADD CONSTRAINT "BuyBackEvent_systemWalletId_fkey" FOREIGN KEY ("systemWalletId") REFERENCES "SystemWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurnEvent" ADD CONSTRAINT "BurnEvent_systemWalletId_fkey" FOREIGN KEY ("systemWalletId") REFERENCES "SystemWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalHistory" ADD CONSTRAINT "RenewalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelterReward" ADD CONSTRAINT "ShelterReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpowermentTransaction" ADD CONSTRAINT "EmpowermentTransaction_empowermentPackageId_fkey" FOREIGN KEY ("empowermentPackageId") REFERENCES "EmpowermentPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
