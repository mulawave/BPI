-- CreateEnum
CREATE TYPE "ProductPricingMode" AS ENUM ('FIAT', 'TOKEN_UNIT');

-- CreateEnum
CREATE TYPE "DistributionFrequency" AS ENUM ('MANUAL', 'MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "TechProjectStatus" AS ENUM ('PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ON_HOLD');

-- DropIndex
DROP INDEX "RevenueTransaction_sourceId_key";

-- AlterTable
ALTER TABLE "MembershipPackage" ADD COLUMN     "profitFixedAmountFiat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "profitMode" "StoreProfitMode" NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "profitPercent" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "PoolMember" ADD COLUMN     "eligibilityCriteria" TEXT,
ADD COLUMN     "qualificationNote" TEXT,
ADD COLUMN     "qualificationStatus" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "pricingMode" "ProductPricingMode" NOT NULL DEFAULT 'FIAT',
ADD COLUMN     "tokenUnitAmount" DECIMAL(28,8),
ADD COLUMN     "tokenUnitSymbol" TEXT,
ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "RevenueTransaction" ADD COLUMN     "country" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "profitPoolConfigVersionId" TEXT,
ADD COLUMN     "programType" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "sourceKey" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tokenSymbol" TEXT;

-- AlterTable
ALTER TABLE "StoreRewardConfig" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "StrategyPool" ADD COLUMN     "distributionFrequency" "DistributionFrequency" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "lastDistributedAt" TIMESTAMP(3),
ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "nextDistributionAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProfitPoolConfigVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "companyPercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "executivePercent" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "strategicPercent" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitPoolConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechPoolProject" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "approvedBudget" DECIMAL(18,2) NOT NULL,
    "totalSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "TechProjectStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "milestones" TEXT,
    "roiNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechPoolProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechPoolSpend" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "spentBy" TEXT NOT NULL,
    "receipt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechPoolSpend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfitPoolConfigVersion_version_key" ON "ProfitPoolConfigVersion"("version");

-- CreateIndex
CREATE INDEX "ProfitPoolConfigVersion_isActive_version_idx" ON "ProfitPoolConfigVersion"("isActive", "version");

-- CreateIndex
CREATE INDEX "TechPoolProject_poolId_idx" ON "TechPoolProject"("poolId");

-- CreateIndex
CREATE INDEX "TechPoolProject_status_idx" ON "TechPoolProject"("status");

-- CreateIndex
CREATE INDEX "TechPoolProject_proposedBy_idx" ON "TechPoolProject"("proposedBy");

-- CreateIndex
CREATE INDEX "TechPoolSpend_projectId_idx" ON "TechPoolSpend"("projectId");

-- CreateIndex
CREATE INDEX "TechPoolSpend_createdAt_idx" ON "TechPoolSpend"("createdAt");

-- CreateIndex
CREATE INDEX "Product_vendor_idx" ON "Product"("vendor");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "RevenueTransaction_sourceKey_idx" ON "RevenueTransaction"("sourceKey");

-- CreateIndex
CREATE INDEX "RevenueTransaction_productId_createdAt_idx" ON "RevenueTransaction"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_orderId_idx" ON "RevenueTransaction"("orderId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_packageId_createdAt_idx" ON "RevenueTransaction"("packageId", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_country_state_createdAt_idx" ON "RevenueTransaction"("country", "state", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_profitPoolConfigVersionId_idx" ON "RevenueTransaction"("profitPoolConfigVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueTransaction_source_sourceId_key" ON "RevenueTransaction"("source", "sourceId");

-- CreateIndex
CREATE INDEX "StoreRewardConfig_productId_isActive_idx" ON "StoreRewardConfig"("productId", "isActive");

-- CreateIndex
CREATE INDEX "StrategyPool_distributionFrequency_idx" ON "StrategyPool"("distributionFrequency");

-- AddForeignKey
ALTER TABLE "StoreRewardConfig" ADD CONSTRAINT "StoreRewardConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_profitPoolConfigVersionId_fkey" FOREIGN KEY ("profitPoolConfigVersionId") REFERENCES "ProfitPoolConfigVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechPoolProject" ADD CONSTRAINT "TechPoolProject_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "StrategyPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechPoolProject" ADD CONSTRAINT "TechPoolProject_proposedBy_fkey" FOREIGN KEY ("proposedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechPoolProject" ADD CONSTRAINT "TechPoolProject_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechPoolSpend" ADD CONSTRAINT "TechPoolSpend_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TechPoolProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechPoolSpend" ADD CONSTRAINT "TechPoolSpend_spentBy_fkey" FOREIGN KEY ("spentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
