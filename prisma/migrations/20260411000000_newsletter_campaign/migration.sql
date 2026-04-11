-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "filter" TEXT NOT NULL DEFAULT 'all',
    "membershipPackage" TEXT,
    "fromEmail" TEXT,
    "replyToEmail" TEXT,
    "batchSize" INTEGER NOT NULL DEFAULT 10,
    "delayBetweenMs" INTEGER NOT NULL DEFAULT 4000,
    "batchCooldownMs" INTEGER NOT NULL DEFAULT 45000,
    "warmUp" BOOLEAN NOT NULL DEFAULT true,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "elapsedMs" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentEmails" JSONB NOT NULL DEFAULT '[]',
    "failedEmails" JSONB NOT NULL DEFAULT '[]',
    "errorLog" JSONB NOT NULL DEFAULT '[]',
    "sentRecipientIds" JSONB NOT NULL DEFAULT '[]',
    "allRecipientIds" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterCampaign_jobId_key" ON "NewsletterCampaign"("jobId");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_adminId_idx" ON "NewsletterCampaign"("adminId");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_idx" ON "NewsletterCampaign"("status");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
