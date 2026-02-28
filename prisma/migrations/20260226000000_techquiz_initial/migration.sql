-- CreateEnum
CREATE TYPE "TechQuizEventStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TechQuizSchoolStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TechQuizParticipationStatus" AS ENUM ('APPROVED', 'ELIGIBLE', 'NOT_ELIGIBLE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TechQuizChildStatus" AS ENUM ('INACTIVE', 'TECH_QUIZ_ENABLED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "TechQuizApplicationStatus" AS ENUM ('APPLIED', 'SLOT_RESERVED', 'VERIFIED', 'REJECTED', 'ROUND1_ELIGIBLE', 'QUALIFIER', 'ROUND2_ELIGIBLE');

-- CreateEnum
CREATE TYPE "TechQuizPaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TechQuizCBTRound" AS ENUM ('ROUND1', 'ROUND2');

-- CreateEnum
CREATE TYPE "TechQuizCBTSessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'SCORED');

-- CreateEnum
CREATE TYPE "TechQuizSponsorType" AS ENUM ('CHILD_PARENT', 'SCHOOL_COHORT', 'PRIZE_POOL');

-- CreateEnum
CREATE TYPE "TechQuizAllocationPool" AS ENUM ('SCHOOL_POOL', 'EVENT_PRIZE_POOL');

-- CreateTable
CREATE TABLE "TechQuizEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" "TechQuizEventStatus" NOT NULL DEFAULT 'DRAFT',
    "frequencyType" TEXT,
    "applicationWindowStart" TIMESTAMP(3),
    "applicationWindowEnd" TIMESTAMP(3),
    "sponsorshipPackagePrice" DECIMAL(12,2) NOT NULL DEFAULT 18000,
    "topQualifiersPerSchool" INTEGER NOT NULL DEFAULT 4,
    "cbtWeightPct" INTEGER NOT NULL DEFAULT 55,
    "onsiteWeightPct" INTEGER NOT NULL DEFAULT 45,
    "isZonalOrNational" BOOLEAN NOT NULL DEFAULT false,
    "zonalEventType" TEXT,
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TechQuizEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizRound1Schedule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venueDescription" TEXT,
    "cbtWindowStart" TIMESTAMP(3),
    "cbtWindowEnd" TIMESTAMP(3),
    "materialReleaseAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechQuizRound1Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizRound2Schedule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venueDescription" TEXT,
    "cbtWindowStart" TIMESTAMP(3),
    "cbtWindowEnd" TIMESTAMP(3),
    "onsiteDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechQuizRound2Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizAwardBracket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "minRank" INTEGER NOT NULL,
    "maxRank" INTEGER NOT NULL,
    "bracketLabel" TEXT NOT NULL,
    "awardDescription" TEXT,
    "bpiActivationGranted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechQuizAwardBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizScoringRubric" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "maxPresentation" INTEGER NOT NULL DEFAULT 40,
    "maxLogicalReasoning" INTEGER NOT NULL DEFAULT 30,
    "maxUseCase" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizScoringRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizSchool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "mouSigned" BOOLEAN NOT NULL DEFAULT false,
    "mouSignedAt" TIMESTAMP(3),
    "status" "TechQuizSchoolStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizEventSchool" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "minStudents" INTEGER NOT NULL DEFAULT 10,
    "maxStudents" INTEGER NOT NULL DEFAULT 12,
    "participationStatus" "TechQuizParticipationStatus" NOT NULL DEFAULT 'APPROVED',
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizEventSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolAdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizChildBeneficiary" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT,
    "schoolId" TEXT,
    "state" TEXT,
    "parentalConsentGiven" BOOLEAN NOT NULL DEFAULT false,
    "parentalConsentAt" TIMESTAMP(3),
    "status" "TechQuizChildStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizChildBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizChildProfile" (
    "id" TEXT NOT NULL,
    "childBeneficiaryId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechQuizChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizApplication" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "childBeneficiaryId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "paymentReference" TEXT,
    "paymentStatus" "TechQuizPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "TechQuizApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizCBTSession" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "round" "TechQuizCBTRound" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" DECIMAL(8,2),
    "totalQuestions" INTEGER,
    "status" "TechQuizCBTSessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizCBTSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizOnsiteScore" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "assessorUserId" TEXT NOT NULL,
    "presentationScore" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "logicalReasoningScore" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "useCaseScore" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "totalOnsiteScore" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TechQuizOnsiteScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizResult" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "childBeneficiaryId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "round1Score" DECIMAL(8,2),
    "intraSchoolRank" INTEGER,
    "round2CbtScore" DECIMAL(8,2),
    "onsiteScore" DECIMAL(8,2),
    "finalScore" DECIMAL(8,2),
    "finalRank" INTEGER,
    "awardBracket" TEXT,
    "round1Published" BOOLEAN NOT NULL DEFAULT false,
    "finalPublished" BOOLEAN NOT NULL DEFAULT false,
    "bpiActivationGranted" BOOLEAN NOT NULL DEFAULT false,
    "bpiActivationGrantedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizQualifier" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "round1Rank" INTEGER NOT NULL,
    "qualifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechQuizQualifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizSponsor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizSponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizSponsorshipPackage" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sponsorType" "TechQuizSponsorType" NOT NULL,
    "childrenCount" INTEGER NOT NULL DEFAULT 1,
    "schoolId" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paymentReference" TEXT,
    "paymentStatus" "TechQuizPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "allocationPool" "TechQuizAllocationPool" NOT NULL DEFAULT 'EVENT_PRIZE_POOL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechQuizSponsorshipPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizConsentLog" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "childBeneficiaryId" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',
    "consentText" TEXT,
    "consentGivenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "TechQuizConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "eventId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechQuizAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechQuizLegalEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "raisedBy" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,

    CONSTRAINT "TechQuizLegalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechQuizEvent_state_idx" ON "TechQuizEvent"("state");

-- CreateIndex
CREATE INDEX "TechQuizEvent_status_idx" ON "TechQuizEvent"("status");

-- CreateIndex
CREATE INDEX "TechQuizRound1Schedule_eventId_idx" ON "TechQuizRound1Schedule"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizRound2Schedule_eventId_idx" ON "TechQuizRound2Schedule"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizAwardBracket_eventId_idx" ON "TechQuizAwardBracket"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizScoringRubric_eventId_key" ON "TechQuizScoringRubric"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizSchool_state_idx" ON "TechQuizSchool"("state");

-- CreateIndex
CREATE INDEX "TechQuizSchool_status_idx" ON "TechQuizSchool"("status");

-- CreateIndex
CREATE INDEX "TechQuizEventSchool_eventId_idx" ON "TechQuizEventSchool"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizEventSchool_schoolId_idx" ON "TechQuizEventSchool"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizEventSchool_eventId_schoolId_key" ON "TechQuizEventSchool"("eventId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolAdminProfile_userId_key" ON "SchoolAdminProfile"("userId");

-- CreateIndex
CREATE INDEX "SchoolAdminProfile_schoolId_idx" ON "SchoolAdminProfile"("schoolId");

-- CreateIndex
CREATE INDEX "TechQuizChildBeneficiary_parentUserId_idx" ON "TechQuizChildBeneficiary"("parentUserId");

-- CreateIndex
CREATE INDEX "TechQuizChildBeneficiary_schoolId_idx" ON "TechQuizChildBeneficiary"("schoolId");

-- CreateIndex
CREATE INDEX "TechQuizChildBeneficiary_status_idx" ON "TechQuizChildBeneficiary"("status");

-- CreateIndex
CREATE INDEX "TechQuizChildProfile_childBeneficiaryId_idx" ON "TechQuizChildProfile"("childBeneficiaryId");

-- CreateIndex
CREATE INDEX "TechQuizChildProfile_schoolId_idx" ON "TechQuizChildProfile"("schoolId");

-- CreateIndex
CREATE INDEX "TechQuizApplication_parentUserId_idx" ON "TechQuizApplication"("parentUserId");

-- CreateIndex
CREATE INDEX "TechQuizApplication_eventId_idx" ON "TechQuizApplication"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizApplication_schoolId_idx" ON "TechQuizApplication"("schoolId");

-- CreateIndex
CREATE INDEX "TechQuizApplication_status_idx" ON "TechQuizApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizApplication_childBeneficiaryId_eventId_key" ON "TechQuizApplication"("childBeneficiaryId", "eventId");

-- CreateIndex
CREATE INDEX "TechQuizCBTSession_applicationId_idx" ON "TechQuizCBTSession"("applicationId");

-- CreateIndex
CREATE INDEX "TechQuizCBTSession_eventId_idx" ON "TechQuizCBTSession"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizCBTSession_round_idx" ON "TechQuizCBTSession"("round");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizCBTSession_applicationId_round_key" ON "TechQuizCBTSession"("applicationId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizOnsiteScore_applicationId_key" ON "TechQuizOnsiteScore"("applicationId");

-- CreateIndex
CREATE INDEX "TechQuizOnsiteScore_eventId_idx" ON "TechQuizOnsiteScore"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizOnsiteScore_assessorUserId_idx" ON "TechQuizOnsiteScore"("assessorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizResult_applicationId_key" ON "TechQuizResult"("applicationId");

-- CreateIndex
CREATE INDEX "TechQuizResult_eventId_idx" ON "TechQuizResult"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizResult_finalRank_idx" ON "TechQuizResult"("finalRank");

-- CreateIndex
CREATE INDEX "TechQuizResult_childBeneficiaryId_idx" ON "TechQuizResult"("childBeneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "TechQuizQualifier_applicationId_key" ON "TechQuizQualifier"("applicationId");

-- CreateIndex
CREATE INDEX "TechQuizQualifier_eventId_idx" ON "TechQuizQualifier"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizQualifier_schoolId_idx" ON "TechQuizQualifier"("schoolId");

-- CreateIndex
CREATE INDEX "TechQuizSponsor_userId_idx" ON "TechQuizSponsor"("userId");

-- CreateIndex
CREATE INDEX "TechQuizSponsorshipPackage_sponsorId_idx" ON "TechQuizSponsorshipPackage"("sponsorId");

-- CreateIndex
CREATE INDEX "TechQuizSponsorshipPackage_eventId_idx" ON "TechQuizSponsorshipPackage"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizSponsorshipPackage_schoolId_idx" ON "TechQuizSponsorshipPackage"("schoolId");

-- CreateIndex
CREATE INDEX "TechQuizConsentLog_parentUserId_idx" ON "TechQuizConsentLog"("parentUserId");

-- CreateIndex
CREATE INDEX "TechQuizConsentLog_childBeneficiaryId_idx" ON "TechQuizConsentLog"("childBeneficiaryId");

-- CreateIndex
CREATE INDEX "TechQuizAuditLog_actorId_idx" ON "TechQuizAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "TechQuizAuditLog_eventId_idx" ON "TechQuizAuditLog"("eventId");

-- CreateIndex
CREATE INDEX "TechQuizAuditLog_entityType_idx" ON "TechQuizAuditLog"("entityType");

-- CreateIndex
CREATE INDEX "TechQuizAuditLog_action_idx" ON "TechQuizAuditLog"("action");

-- CreateIndex
CREATE INDEX "TechQuizLegalEvent_eventId_idx" ON "TechQuizLegalEvent"("eventId");

-- AddForeignKey
ALTER TABLE "TechQuizRound1Schedule" ADD CONSTRAINT "TechQuizRound1Schedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizRound2Schedule" ADD CONSTRAINT "TechQuizRound2Schedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizAwardBracket" ADD CONSTRAINT "TechQuizAwardBracket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizScoringRubric" ADD CONSTRAINT "TechQuizScoringRubric_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizEventSchool" ADD CONSTRAINT "TechQuizEventSchool_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizEventSchool" ADD CONSTRAINT "TechQuizEventSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "TechQuizSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdminProfile" ADD CONSTRAINT "SchoolAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdminProfile" ADD CONSTRAINT "SchoolAdminProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "TechQuizSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizChildBeneficiary" ADD CONSTRAINT "TechQuizChildBeneficiary_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizChildBeneficiary" ADD CONSTRAINT "TechQuizChildBeneficiary_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "TechQuizSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizChildProfile" ADD CONSTRAINT "TechQuizChildProfile_childBeneficiaryId_fkey" FOREIGN KEY ("childBeneficiaryId") REFERENCES "TechQuizChildBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizChildProfile" ADD CONSTRAINT "TechQuizChildProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "TechQuizSchool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizApplication" ADD CONSTRAINT "TechQuizApplication_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizApplication" ADD CONSTRAINT "TechQuizApplication_childBeneficiaryId_fkey" FOREIGN KEY ("childBeneficiaryId") REFERENCES "TechQuizChildBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizApplication" ADD CONSTRAINT "TechQuizApplication_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizApplication" ADD CONSTRAINT "TechQuizApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "TechQuizSchool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizCBTSession" ADD CONSTRAINT "TechQuizCBTSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TechQuizApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizCBTSession" ADD CONSTRAINT "TechQuizCBTSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizOnsiteScore" ADD CONSTRAINT "TechQuizOnsiteScore_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TechQuizApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizOnsiteScore" ADD CONSTRAINT "TechQuizOnsiteScore_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizOnsiteScore" ADD CONSTRAINT "TechQuizOnsiteScore_assessorUserId_fkey" FOREIGN KEY ("assessorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizResult" ADD CONSTRAINT "TechQuizResult_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TechQuizApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizResult" ADD CONSTRAINT "TechQuizResult_childBeneficiaryId_fkey" FOREIGN KEY ("childBeneficiaryId") REFERENCES "TechQuizChildBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizResult" ADD CONSTRAINT "TechQuizResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizQualifier" ADD CONSTRAINT "TechQuizQualifier_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TechQuizApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizQualifier" ADD CONSTRAINT "TechQuizQualifier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizSponsor" ADD CONSTRAINT "TechQuizSponsor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizSponsorshipPackage" ADD CONSTRAINT "TechQuizSponsorshipPackage_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "TechQuizSponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizSponsorshipPackage" ADD CONSTRAINT "TechQuizSponsorshipPackage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizSponsorshipPackage" ADD CONSTRAINT "TechQuizSponsorshipPackage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "TechQuizSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizConsentLog" ADD CONSTRAINT "TechQuizConsentLog_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizConsentLog" ADD CONSTRAINT "TechQuizConsentLog_childBeneficiaryId_fkey" FOREIGN KEY ("childBeneficiaryId") REFERENCES "TechQuizChildBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizAuditLog" ADD CONSTRAINT "TechQuizAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizAuditLog" ADD CONSTRAINT "TechQuizAuditLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechQuizLegalEvent" ADD CONSTRAINT "TechQuizLegalEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TechQuizEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
