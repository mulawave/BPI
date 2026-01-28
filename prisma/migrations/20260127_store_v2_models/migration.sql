-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'LICENSE', 'SERVICE', 'UTILITY');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('UNLIMITED', 'LIMITED', 'TIME_BOUND');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('CASH', 'CASHBACK', 'BPT', 'UTILITY_TOKEN');

-- CreateEnum
CREATE TYPE "RewardValueType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "TokenRateSource" AS ENUM ('FIXED', 'ADMIN_DAILY', 'ORACLE_FUTURE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RewardSettlementState" AS ENUM ('PENDING', 'ISSUED', 'FAILED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('FIAT', 'CASHBACK', 'BPT', 'UTILITY');

-- CreateTable
CREATE TABLE "RewardConfig" (
    "id" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "rewardValue" DECIMAL(18,4) NOT NULL,
    "rewardValueType" "RewardValueType" NOT NULL,
    "vestingRule" TEXT NOT NULL,
    "maxRewardCap" DECIMAL(18,4),
    "utilityTokenSymbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "basePriceFiat" DECIMAL(18,2) NOT NULL,
    "acceptedTokens" TEXT[],
    "tokenPaymentLimits" JSONB NOT NULL,
    "rewardConfigId" TEXT,
    "inventoryType" "InventoryType" NOT NULL DEFAULT 'UNLIMITED',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "pickupCenterId" TEXT,
    "rewardCenterId" TEXT,
    "deliveryRequired" BOOLEAN NOT NULL DEFAULT false,
    "heroBadge" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRate" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rateToFiat" DECIMAL(18,6) NOT NULL,
    "source" "TokenRateSource" NOT NULL DEFAULT 'FIXED',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "paymentBreakdown" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "rewardSettlementState" "RewardSettlementState" NOT NULL DEFAULT 'PENDING',
    "rewardConfigSnapshot" JSONB,
    "tokenRateSnapshot" JSONB,
    "pickupCenterId" TEXT,
    "rewardCenterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletType" "WalletType" NOT NULL,
    "symbol" TEXT,
    "balance" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_productType_status_idx" ON "Product"("productType", "status");

-- CreateIndex
CREATE INDEX "Product_pickupCenterId_idx" ON "Product"("pickupCenterId");

-- CreateIndex
CREATE INDEX "Product_rewardCenterId_idx" ON "Product"("rewardCenterId");

-- CreateIndex
CREATE INDEX "TokenRate_symbol_effectiveAt_idx" ON "TokenRate"("symbol", "effectiveAt");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

-- CreateIndex
CREATE INDEX "Order_pickupCenterId_idx" ON "Order"("pickupCenterId");

-- CreateIndex
CREATE INDEX "WalletBalance_userId_walletType_symbol_idx" ON "WalletBalance"("userId", "walletType", "symbol");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_rewardConfigId_fkey" FOREIGN KEY ("rewardConfigId") REFERENCES "RewardConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "PickupCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_rewardCenterId_fkey" FOREIGN KEY ("rewardCenterId") REFERENCES "RewardCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "PickupCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_rewardCenterId_fkey" FOREIGN KEY ("rewardCenterId") REFERENCES "RewardCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletBalance" ADD CONSTRAINT "WalletBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
