--
-- CSP top-up (follow-up Q13), Special Community Support flag (follow-up
-- Q17) and the Healthcare Card product (follow-up Q16), all decided
-- 07/10/2026.
--

-- AlterTable: Special Community Support flag on CspSupportRequest
ALTER TABLE "CspSupportRequest" ADD COLUMN "isSpecialSupport" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: CspTopUpPurchase
CREATE TABLE "CspTopUpPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "hours" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "paidFrom" TEXT NOT NULL,
    "contributedAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspTopUpPurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CspTopUpPurchase_userId_status_idx" ON "CspTopUpPurchase"("userId", "status");
CREATE INDEX "CspTopUpPurchase_requestId_idx" ON "CspTopUpPurchase"("requestId");

ALTER TABLE "CspTopUpPurchase" ADD CONSTRAINT "CspTopUpPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CspTopUpPurchase" ADD CONSTRAINT "CspTopUpPurchase_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: HealthcareCard
CREATE TABLE "HealthcareCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sscCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "coverAmount" INTEGER NOT NULL,
    "coverUsed" INTEGER NOT NULL DEFAULT 0,
    "monthKey" TEXT NOT NULL,
    "monthUsed" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthcareCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthcareCard_userId_key" ON "HealthcareCard"("userId");
CREATE UNIQUE INDEX "HealthcareCard_sscCode_key" ON "HealthcareCard"("sscCode");
CREATE INDEX "HealthcareCard_status_idx" ON "HealthcareCard"("status");

ALTER TABLE "HealthcareCard" ADD CONSTRAINT "HealthcareCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: HealthcareCentre
CREATE TABLE "HealthcareCentre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthcareCentre_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HealthcareService
CREATE TABLE "HealthcareService" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discountOnly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthcareService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthcareService_centreId_idx" ON "HealthcareService"("centreId");

ALTER TABLE "HealthcareService" ADD CONSTRAINT "HealthcareService_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "HealthcareCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: HealthcareCardRedemption
CREATE TABLE "HealthcareCardRedemption" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "serviceId" TEXT,
    "servicePrice" INTEGER NOT NULL,
    "discountPct" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "coveredAmount" INTEGER NOT NULL DEFAULT 0,
    "memberPays" INTEGER NOT NULL,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthcareCardRedemption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthcareCardRedemption_cardId_idx" ON "HealthcareCardRedemption"("cardId");
CREATE INDEX "HealthcareCardRedemption_centreId_idx" ON "HealthcareCardRedemption"("centreId");

ALTER TABLE "HealthcareCardRedemption" ADD CONSTRAINT "HealthcareCardRedemption_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HealthcareCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthcareCardRedemption" ADD CONSTRAINT "HealthcareCardRedemption_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "HealthcareCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthcareCardRedemption" ADD CONSTRAINT "HealthcareCardRedemption_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HealthcareService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
