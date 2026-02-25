-- CreateEnum
CREATE TYPE "StoreProfitMode" AS ENUM ('PERCENT', 'FIXED', 'HYBRID');

-- CreateEnum
CREATE TYPE "StoreRewardBasis" AS ENUM ('GROSS', 'PROFIT');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "minTokenPercent" DECIMAL(5,4),
ADD COLUMN     "profitFixedAmountFiat" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "profitMode" "StoreProfitMode" NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "profitPercent" DECIMAL(5,4) NOT NULL DEFAULT 1.0000;

-- CreateTable
CREATE TABLE "StoreRewardConfig" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreRewardLevel" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "rewardBasis" "StoreRewardBasis" NOT NULL,
    "rewardValueType" "RewardValueType" NOT NULL,
    "rewardValue" DECIMAL(18,4) NOT NULL,
    "payoutType" "RewardType" NOT NULL,
    "maxRewardCap" DECIMAL(18,4),
    "utilityTokenSymbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRewardLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreReferralRewardLedger" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "basis" "StoreRewardBasis" NOT NULL,
    "basisAmountFiat" DECIMAL(18,2) NOT NULL,
    "payoutType" "RewardType" NOT NULL,
    "payoutAmountFiat" DECIMAL(18,2),
    "tokenSymbol" TEXT,
    "tokenAmount" DECIMAL(28,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreReferralRewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreRewardConfig_isActive_idx" ON "StoreRewardConfig"("isActive");

-- CreateIndex
CREATE INDEX "StoreRewardLevel_configId_idx" ON "StoreRewardLevel"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreRewardLevel_configId_level_key" ON "StoreRewardLevel"("configId", "level");

-- CreateIndex
CREATE INDEX "StoreReferralRewardLedger_recipientUserId_createdAt_idx" ON "StoreReferralRewardLedger"("recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReferralRewardLedger_orderId_idx" ON "StoreReferralRewardLedger"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreReferralRewardLedger_orderId_recipientUserId_level_key" ON "StoreReferralRewardLedger"("orderId", "recipientUserId", "level");

-- AddForeignKey
ALTER TABLE "StoreRewardLevel" ADD CONSTRAINT "StoreRewardLevel_configId_fkey" FOREIGN KEY ("configId") REFERENCES "StoreRewardConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReferralRewardLedger" ADD CONSTRAINT "StoreReferralRewardLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReferralRewardLedger" ADD CONSTRAINT "StoreReferralRewardLedger_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReferralRewardLedger" ADD CONSTRAINT "StoreReferralRewardLedger_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
