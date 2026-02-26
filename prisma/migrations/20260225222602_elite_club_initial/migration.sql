-- CreateEnum
CREATE TYPE "EliteClubTier" AS ENUM ('SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "EliteClubFormationStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EliteClubStatus" AS ENUM ('FORMING', 'ACTIVE', 'SUSPENDED', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "EliteClubMemberStatus" AS ENUM ('ACTIVE', 'DEFAULTED', 'SUSPENDED', 'OPTED_OUT', 'REPLACED');

-- CreateEnum
CREATE TYPE "EliteClubAppStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EliteClubDocType" AS ENUM ('BANK_STATEMENT', 'BUSINESS_PROOF', 'TRAVEL_PROOF', 'PROPERTY_PROOF', 'CONTRIBUTION_DECLARATION');

-- CreateEnum
CREATE TYPE "EliteClubContribStatus" AS ENUM ('PAID', 'PENDING', 'MISSED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "EliteClubPayoutStatus" AS ENUM ('PENDING', 'PAID', 'BLOCKED');

-- CreateEnum
CREATE TYPE "EliteClubSwapStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EliteClubInvestmentCategory" AS ENUM ('DIGITAL_WEB3', 'OFFLINE');

-- CreateEnum
CREATE TYPE "EliteClubInvestmentStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'VOTED', 'APPROVED', 'FUNDED', 'ACTIVE', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EliteClubVoteChoice" AS ENUM ('ACCEPT', 'REJECT', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "EliteClubCredEventType" AS ENUM ('CONTRIBUTION_PAID', 'CONTRIBUTION_MISSED', 'DEFAULT', 'SUSPENSION', 'GUARANTEE_DEFAULT', 'POSITIVE_VOTE', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "EliteClubTokenVerifMethod" AS ENUM ('WALLET_CONNECT', 'PROOF_UPLOAD');

-- AlterEnum
-- Runs outside transaction to satisfy PostgreSQL restriction on
-- ALTER TYPE ... ADD VALUE inside a transaction block (error 25001).
COMMIT;
ALTER TYPE "RevenueSource" ADD VALUE IF NOT EXISTS 'ELITE_CLUB_OPS';
ALTER TYPE "RevenueSource" ADD VALUE IF NOT EXISTS 'ELITE_CLUB_INVESTMENT_PROFIT';
BEGIN;

-- CreateTable
CREATE TABLE "EliteClub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "EliteClubTier" NOT NULL,
    "status" "EliteClubStatus" NOT NULL DEFAULT 'FORMING',
    "membersCount" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3),
    "dissolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubId" TEXT,
    "tier" "EliteClubTier" NOT NULL,
    "status" "EliteClubAppStatus" NOT NULL DEFAULT 'PENDING',
    "bptVerified" BOOLEAN NOT NULL DEFAULT false,
    "pacTokenVerified" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClubApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "docType" "EliteClubDocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectReason" TEXT,

    CONSTRAINT "EliteClubDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubTokenHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "tier" "EliteClubTier" NOT NULL,
    "bptAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "pacTokenAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" "EliteClubTokenVerifMethod" NOT NULL DEFAULT 'PROOF_UPLOAD',
    "proofUrl" TEXT,
    "walletAddress" TEXT,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteClubTokenHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "rotationNumber" INTEGER NOT NULL,
    "status" "EliteClubMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "credibilityScore" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "totalContributed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "empowermentReceived" BOOLEAN NOT NULL DEFAULT false,
    "empowermentPending" BOOLEAN NOT NULL DEFAULT false,
    "defaultCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspendedAt" TIMESTAMP(3),
    "replacedAt" TIMESTAMP(3),
    "legalFlaggedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubContribution" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "empowermentShare" DECIMAL(65,30) NOT NULL,
    "investmentShare" DECIMAL(65,30) NOT NULL,
    "status" "EliteClubContribStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClubContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubEmpowermentPayout" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rotationNumber" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "scheduledMonth" INTEGER NOT NULL,
    "scheduledYear" INTEGER NOT NULL,
    "status" "EliteClubPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClubEmpowermentPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubSwapRequest" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "fromRotation" INTEGER NOT NULL,
    "toRotation" INTEGER NOT NULL,
    "status" "EliteClubSwapStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "EliteClubSwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubInvestmentPool" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "opsFeeBpi" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "opsFeeElite" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "digitalBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "offlineBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "available" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClubInvestmentPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubInvestment" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "recommendedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EliteClubInvestmentCategory" NOT NULL,
    "amountRequested" DECIMAL(65,30) NOT NULL,
    "expectedReturn" DECIMAL(65,30),
    "durationMonths" INTEGER,
    "riskNotes" TEXT,
    "bpiProfitShareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bpiProfitSharePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "EliteClubInvestmentStatus" NOT NULL DEFAULT 'DRAFT',
    "legalReviewUrl" TEXT,
    "legalReviewedAt" TIMESTAMP(3),
    "legalReviewedBy" TEXT,
    "proofOfDepositUrl" TEXT,
    "proofUploadedAt" TIMESTAMP(3),
    "proofUploadedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualReturn" DECIMAL(65,30),
    "bpiProfitShareAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EliteClubInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubVote" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" "EliteClubVoteChoice" NOT NULL,
    "comment" TEXT,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteClubVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubCredibilityEvent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "event" "EliteClubCredEventType" NOT NULL,
    "delta" DECIMAL(5,2) NOT NULL,
    "scoreBefore" DECIMAL(5,2) NOT NULL,
    "scoreAfter" DECIMAL(5,2) NOT NULL,
    "reason" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteClubCredibilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubGuarantor" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "qualifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EliteClubGuarantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClubLegalEvent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "notes" TEXT,
    "moustRef" TEXT,
    "raisedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteClubLegalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EliteClub_tier_status_idx" ON "EliteClub"("tier", "status");

-- CreateIndex
CREATE INDEX "EliteClubApplication_userId_status_idx" ON "EliteClubApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "EliteClubApplication_clubId_idx" ON "EliteClubApplication"("clubId");

-- CreateIndex
CREATE INDEX "EliteClubApplication_tier_status_idx" ON "EliteClubApplication"("tier", "status");

-- CreateIndex
CREATE INDEX "EliteClubDocument_applicationId_idx" ON "EliteClubDocument"("applicationId");

-- CreateIndex
CREATE INDEX "EliteClubTokenHolding_userId_idx" ON "EliteClubTokenHolding"("userId");

-- CreateIndex
CREATE INDEX "EliteClubTokenHolding_applicationId_idx" ON "EliteClubTokenHolding"("applicationId");

-- CreateIndex
CREATE INDEX "EliteClubMember_clubId_status_idx" ON "EliteClubMember"("clubId", "status");

-- CreateIndex
CREATE INDEX "EliteClubMember_userId_idx" ON "EliteClubMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubMember_clubId_rotationNumber_key" ON "EliteClubMember"("clubId", "rotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubMember_userId_clubId_key" ON "EliteClubMember"("userId", "clubId");

-- CreateIndex
CREATE INDEX "EliteClubContribution_clubId_month_year_idx" ON "EliteClubContribution"("clubId", "month", "year");

-- CreateIndex
CREATE INDEX "EliteClubContribution_status_idx" ON "EliteClubContribution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubContribution_memberId_month_year_key" ON "EliteClubContribution"("memberId", "month", "year");

-- CreateIndex
CREATE INDEX "EliteClubEmpowermentPayout_clubId_idx" ON "EliteClubEmpowermentPayout"("clubId");

-- CreateIndex
CREATE INDEX "EliteClubEmpowermentPayout_memberId_idx" ON "EliteClubEmpowermentPayout"("memberId");

-- CreateIndex
CREATE INDEX "EliteClubEmpowermentPayout_status_idx" ON "EliteClubEmpowermentPayout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubEmpowermentPayout_clubId_scheduledMonth_scheduledY_key" ON "EliteClubEmpowermentPayout"("clubId", "scheduledMonth", "scheduledYear");

-- CreateIndex
CREATE INDEX "EliteClubSwapRequest_clubId_idx" ON "EliteClubSwapRequest"("clubId");

-- CreateIndex
CREATE INDEX "EliteClubSwapRequest_requesterId_idx" ON "EliteClubSwapRequest"("requesterId");

-- CreateIndex
CREATE INDEX "EliteClubSwapRequest_targetId_idx" ON "EliteClubSwapRequest"("targetId");

-- CreateIndex
CREATE INDEX "EliteClubSwapRequest_status_idx" ON "EliteClubSwapRequest"("status");

-- CreateIndex
CREATE INDEX "EliteClubInvestmentPool_clubId_idx" ON "EliteClubInvestmentPool"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubInvestmentPool_clubId_month_year_key" ON "EliteClubInvestmentPool"("clubId", "month", "year");

-- CreateIndex
CREATE INDEX "EliteClubInvestment_clubId_status_idx" ON "EliteClubInvestment"("clubId", "status");

-- CreateIndex
CREATE INDEX "EliteClubInvestment_poolId_idx" ON "EliteClubInvestment"("poolId");

-- CreateIndex
CREATE INDEX "EliteClubVote_investmentId_idx" ON "EliteClubVote"("investmentId");

-- CreateIndex
CREATE INDEX "EliteClubVote_memberId_idx" ON "EliteClubVote"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubVote_investmentId_memberId_key" ON "EliteClubVote"("investmentId", "memberId");

-- CreateIndex
CREATE INDEX "EliteClubCredibilityEvent_memberId_idx" ON "EliteClubCredibilityEvent"("memberId");

-- CreateIndex
CREATE INDEX "EliteClubCredibilityEvent_event_idx" ON "EliteClubCredibilityEvent"("event");

-- CreateIndex
CREATE INDEX "EliteClubGuarantor_memberId_idx" ON "EliteClubGuarantor"("memberId");

-- CreateIndex
CREATE INDEX "EliteClubGuarantor_investmentId_idx" ON "EliteClubGuarantor"("investmentId");

-- CreateIndex
CREATE INDEX "EliteClubLegalEvent_memberId_idx" ON "EliteClubLegalEvent"("memberId");

-- AddForeignKey
ALTER TABLE "EliteClubApplication" ADD CONSTRAINT "EliteClubApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubApplication" ADD CONSTRAINT "EliteClubApplication_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubDocument" ADD CONSTRAINT "EliteClubDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "EliteClubApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubTokenHolding" ADD CONSTRAINT "EliteClubTokenHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubTokenHolding" ADD CONSTRAINT "EliteClubTokenHolding_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "EliteClubApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubMember" ADD CONSTRAINT "EliteClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubMember" ADD CONSTRAINT "EliteClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubContribution" ADD CONSTRAINT "EliteClubContribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubContribution" ADD CONSTRAINT "EliteClubContribution_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubContribution" ADD CONSTRAINT "EliteClubContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubEmpowermentPayout" ADD CONSTRAINT "EliteClubEmpowermentPayout_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubEmpowermentPayout" ADD CONSTRAINT "EliteClubEmpowermentPayout_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubSwapRequest" ADD CONSTRAINT "EliteClubSwapRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubSwapRequest" ADD CONSTRAINT "EliteClubSwapRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubSwapRequest" ADD CONSTRAINT "EliteClubSwapRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubInvestmentPool" ADD CONSTRAINT "EliteClubInvestmentPool_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubInvestment" ADD CONSTRAINT "EliteClubInvestment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubInvestment" ADD CONSTRAINT "EliteClubInvestment_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "EliteClubInvestmentPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubVote" ADD CONSTRAINT "EliteClubVote_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "EliteClubInvestment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubVote" ADD CONSTRAINT "EliteClubVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubVote" ADD CONSTRAINT "EliteClubVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubCredibilityEvent" ADD CONSTRAINT "EliteClubCredibilityEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubGuarantor" ADD CONSTRAINT "EliteClubGuarantor_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubGuarantor" ADD CONSTRAINT "EliteClubGuarantor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubGuarantor" ADD CONSTRAINT "EliteClubGuarantor_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "EliteClubInvestment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubLegalEvent" ADD CONSTRAINT "EliteClubLegalEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
