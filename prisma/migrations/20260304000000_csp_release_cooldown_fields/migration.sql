-- Migration: Add releasedAt, cooldown, and rejection fields to CspSupportRequest
-- Also creates CspWaitReductionLog and CspCountry tables

-- AlterTable: add missing columns to CspSupportRequest
ALTER TABLE "CspSupportRequest"
  ADD COLUMN IF NOT EXISTS "releasedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "cooldownMonths"  INTEGER,
  ADD COLUMN IF NOT EXISTS "cooldownEndsAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "countryCode"     TEXT;

-- CreateIndex for countryCode + status
CREATE INDEX IF NOT EXISTS "CspSupportRequest_countryCode_status_idx" ON "CspSupportRequest"("countryCode", "status");

-- CreateTable: CspWaitReductionLog
CREATE TABLE IF NOT EXISTS "CspWaitReductionLog" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "requestId"     TEXT NOT NULL,
    "monthKey"      TEXT NOT NULL,
    "amountContrib" INTEGER NOT NULL DEFAULT 0,
    "monthReduced"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspWaitReductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for CspWaitReductionLog
CREATE UNIQUE INDEX IF NOT EXISTS "CspWaitReductionLog_userId_requestId_monthKey_key" ON "CspWaitReductionLog"("userId", "requestId", "monthKey");
CREATE INDEX IF NOT EXISTS "CspWaitReductionLog_userId_requestId_idx" ON "CspWaitReductionLog"("userId", "requestId");

-- CreateTable: CspCountry
CREATE TABLE IF NOT EXISTS "CspCountry" (
    "id"                     TEXT NOT NULL,
    "countryCode"            TEXT NOT NULL,
    "countryName"            TEXT NOT NULL,
    "isNationalActive"       BOOLEAN NOT NULL DEFAULT false,
    "isGlobalActive"         BOOLEAN NOT NULL DEFAULT false,
    "regularActivationCount" INTEGER NOT NULL DEFAULT 0,
    "activationThreshold"    INTEGER NOT NULL DEFAULT 10000,
    "activatedAt"            TIMESTAMP(3),
    "notes"                  TEXT,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspCountry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for CspCountry
CREATE UNIQUE INDEX IF NOT EXISTS "CspCountry_countryCode_key" ON "CspCountry"("countryCode");
CREATE INDEX IF NOT EXISTS "CspCountry_isNationalActive_idx" ON "CspCountry"("isNationalActive");

-- AddForeignKey: CspWaitReductionLog -> CspSupportRequest
ALTER TABLE "CspWaitReductionLog"
  DROP CONSTRAINT IF EXISTS "CspWaitReductionLog_requestId_fkey";
ALTER TABLE "CspWaitReductionLog"
  ADD CONSTRAINT "CspWaitReductionLog_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CspWaitReductionLog -> User
ALTER TABLE "CspWaitReductionLog"
  DROP CONSTRAINT IF EXISTS "CspWaitReductionLog_userId_fkey";
ALTER TABLE "CspWaitReductionLog"
  ADD CONSTRAINT "CspWaitReductionLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
