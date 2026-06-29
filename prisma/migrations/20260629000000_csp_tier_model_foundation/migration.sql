-- Migration: Add CSP tier model foundation tables and request fields

-- Extend existing CSP support request state
ALTER TABLE "CspSupportRequest"
  ADD COLUMN IF NOT EXISTS "tierNumber" INTEGER,
  ADD COLUMN IF NOT EXISTS "tierContributionRight" INTEGER,
  ADD COLUMN IF NOT EXISTS "minFulfilmentPct" INTEGER,
  ADD COLUMN IF NOT EXISTS "autoExtendCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "fulfilledAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "CspSupportRequest_tierNumber_idx" ON "CspSupportRequest"("tierNumber");

-- CreateTable: CspTier
CREATE TABLE IF NOT EXISTS "CspTier" (
    "id" TEXT NOT NULL,
    "tierNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contributionRight" INTEGER NOT NULL,
    "maxSupportCap" INTEGER NOT NULL,
    "minFulfilmentPct" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspTier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CspTier_tierNumber_key" ON "CspTier"("tierNumber");
CREATE INDEX IF NOT EXISTS "CspTier_isActive_sortOrder_idx" ON "CspTier"("isActive", "sortOrder");

-- CreateTable: CspMemberStanding
CREATE TABLE IF NOT EXISTS "CspMemberStanding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contributionRight" INTEGER NOT NULL DEFAULT 0,
    "currentTierNumber" INTEGER,
    "directSponsorCount" INTEGER NOT NULL DEFAULT 0,
    "lastSupportReleasedAt" TIMESTAMP(3),
    "coolingEndsAt" TIMESTAMP(3),
    "coolingMonthsBase" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspMemberStanding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CspMemberStanding_userId_key" ON "CspMemberStanding"("userId");

-- CreateTable: CspDonationBadgeCategory
CREATE TABLE IF NOT EXISTS "CspDonationBadgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER,
    "badgeType" TEXT NOT NULL,
    "coolingReductionMonths" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspDonationBadgeCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CspDonationBadgeCategory_name_key" ON "CspDonationBadgeCategory"("name");
CREATE INDEX IF NOT EXISTS "CspDonationBadgeCategory_isActive_sortOrder_idx" ON "CspDonationBadgeCategory"("isActive", "sortOrder");

-- CreateTable: CspDonation
CREATE TABLE IF NOT EXISTS "CspDonation" (
    "id" TEXT NOT NULL,
    "donorUserId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "organization" TEXT,
    "amount" INTEGER NOT NULL,
    "category" TEXT,
    "badgeAwardedId" TEXT,
    "recognitionPref" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspDonation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CspDonation_donorUserId_status_idx" ON "CspDonation"("donorUserId", "status");

-- CreateTable: CspTimeReductionBadge
CREATE TABLE IF NOT EXISTS "CspTimeReductionBadge" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "sourceDonationId" TEXT,
    "reductionMonths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER NOT NULL DEFAULT 1,
    "redeemedOnRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspTimeReductionBadge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CspTimeReductionBadge_ownerUserId_status_categoryId_idx" ON "CspTimeReductionBadge"("ownerUserId", "status", "categoryId");

-- CreateTable: CspBadgeTransfer
CREATE TABLE IF NOT EXISTS "CspBadgeTransfer" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "type" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspBadgeTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CspBadgeTransfer_badgeId_idx" ON "CspBadgeTransfer"("badgeId");

-- CreateTable: CspRuleChangeLog
CREATE TABLE IF NOT EXISTS "CspRuleChangeLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspRuleChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CspRuleChangeLog_ruleKey_createdAt_idx" ON "CspRuleChangeLog"("ruleKey", "createdAt");

-- AddForeignKey: CspMemberStanding -> User
ALTER TABLE "CspMemberStanding"
  DROP CONSTRAINT IF EXISTS "CspMemberStanding_userId_fkey";
ALTER TABLE "CspMemberStanding"
  ADD CONSTRAINT "CspMemberStanding_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CspDonation -> User
ALTER TABLE "CspDonation"
  DROP CONSTRAINT IF EXISTS "CspDonation_donorUserId_fkey";
ALTER TABLE "CspDonation"
  ADD CONSTRAINT "CspDonation_donorUserId_fkey"
    FOREIGN KEY ("donorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: CspTimeReductionBadge -> CspDonationBadgeCategory
ALTER TABLE "CspTimeReductionBadge"
  DROP CONSTRAINT IF EXISTS "CspTimeReductionBadge_categoryId_fkey";
ALTER TABLE "CspTimeReductionBadge"
  ADD CONSTRAINT "CspTimeReductionBadge_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "CspDonationBadgeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CspTimeReductionBadge -> User
ALTER TABLE "CspTimeReductionBadge"
  DROP CONSTRAINT IF EXISTS "CspTimeReductionBadge_ownerUserId_fkey";
ALTER TABLE "CspTimeReductionBadge"
  ADD CONSTRAINT "CspTimeReductionBadge_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: CspBadgeTransfer -> CspTimeReductionBadge
ALTER TABLE "CspBadgeTransfer"
  DROP CONSTRAINT IF EXISTS "CspBadgeTransfer_badgeId_fkey";
ALTER TABLE "CspBadgeTransfer"
  ADD CONSTRAINT "CspBadgeTransfer_badgeId_fkey"
    FOREIGN KEY ("badgeId") REFERENCES "CspTimeReductionBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CspBadgeTransfer -> User (from)
ALTER TABLE "CspBadgeTransfer"
  DROP CONSTRAINT IF EXISTS "CspBadgeTransfer_fromUserId_fkey";
ALTER TABLE "CspBadgeTransfer"
  ADD CONSTRAINT "CspBadgeTransfer_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: CspBadgeTransfer -> User (to)
ALTER TABLE "CspBadgeTransfer"
  DROP CONSTRAINT IF EXISTS "CspBadgeTransfer_toUserId_fkey";
ALTER TABLE "CspBadgeTransfer"
  ADD CONSTRAINT "CspBadgeTransfer_toUserId_fkey"
    FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: CspRuleChangeLog -> User
ALTER TABLE "CspRuleChangeLog"
  DROP CONSTRAINT IF EXISTS "CspRuleChangeLog_adminUserId_fkey";
ALTER TABLE "CspRuleChangeLog"
  ADD CONSTRAINT "CspRuleChangeLog_adminUserId_fkey"
    FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
