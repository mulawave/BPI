-- CreateTable
CREATE TABLE "CspSupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "thresholdAmount" INTEGER NOT NULL,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "contributorsCount" INTEGER NOT NULL DEFAULT 0,
    "broadcastExpiresAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspContribution" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "walletType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CspContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspBroadcastExtension" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER,
    "hoursGranted" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CspBroadcastExtension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CspSupportRequest_userId_status_idx" ON "CspSupportRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "CspSupportRequest_status_broadcastExpiresAt_idx" ON "CspSupportRequest"("status", "broadcastExpiresAt");

-- CreateIndex
CREATE INDEX "CspContribution_requestId_idx" ON "CspContribution"("requestId");

-- CreateIndex
CREATE INDEX "CspContribution_contributorId_idx" ON "CspContribution"("contributorId");

-- CreateIndex
CREATE INDEX "CspBroadcastExtension_requestId_idx" ON "CspBroadcastExtension"("requestId");

-- AddForeignKey
ALTER TABLE "CspSupportRequest" ADD CONSTRAINT "CspSupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspContribution" ADD CONSTRAINT "CspContribution_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspContribution" ADD CONSTRAINT "CspContribution_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspBroadcastExtension" ADD CONSTRAINT "CspBroadcastExtension_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

