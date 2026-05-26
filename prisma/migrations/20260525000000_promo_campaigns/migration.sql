-- Promo Campaign System
-- Revenue-isolated free membership activations

CREATE TYPE "PromoCampaignType" AS ENUM ('FREE_MEMBERSHIP_ACTIVATION');

CREATE TABLE IF NOT EXISTS "PromoCampaign" (
    "id"               TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "type"             "PromoCampaignType" NOT NULL DEFAULT 'FREE_MEMBERSHIP_ACTIVATION',
    "quota"            INTEGER NOT NULL,
    "usedCount"        INTEGER NOT NULL DEFAULT 0,
    "isActive"         BOOLEAN NOT NULL DEFAULT false,
    "targetPackageId"  TEXT,
    "startDate"        TIMESTAMP(3),
    "endDate"          TIMESTAMP(3),
    "notes"            TEXT,
    "createdByAdminId" TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PromoCampaign_isActive_idx" ON "PromoCampaign"("isActive");
CREATE INDEX IF NOT EXISTS "PromoCampaign_createdAt_idx" ON "PromoCampaign"("createdAt");

CREATE TABLE IF NOT EXISTS "PromoActivationClaim" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "packageId"  TEXT NOT NULL,
    "claimedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoActivationClaim_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PromoActivationClaim_userId_key" UNIQUE ("userId"),
    CONSTRAINT "PromoActivationClaim_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromoActivationClaim_campaignId_fkey"
        FOREIGN KEY ("campaignId") REFERENCES "PromoCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PromoActivationClaim_campaignId_idx" ON "PromoActivationClaim"("campaignId");
CREATE INDEX IF NOT EXISTS "PromoActivationClaim_claimedAt_idx" ON "PromoActivationClaim"("claimedAt");
