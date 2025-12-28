-- CreateTable
CREATE TABLE "CommunityFeature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresQualification" BOOLEAN NOT NULL DEFAULT false,
    "qualificationCriteria" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "cardColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeatureProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "currentProgress" JSONB,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "milestones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeatureProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipPoolQualification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualificationOption" INTEGER,
    "hasRegularPlusPackage" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredRegularPlus" INTEGER NOT NULL DEFAULT 0,
    "firstGenRegularPlus" INTEGER NOT NULL DEFAULT 0,
    "secondGenRegularPlus" INTEGER NOT NULL DEFAULT 0,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedAt" TIMESTAMP(3),
    "currentTier" TEXT,
    "poolSharePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipPoolQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityUpdate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'announcement',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "targetPackages" TEXT,
    "targetRanks" TEXT,
    "targetRegions" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateRead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileSize" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minPackageLevel" TEXT,
    "minRank" TEXT,
    "targetAudience" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDownload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BPICalculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "inputParameters" JSONB NOT NULL,
    "currentPackage" TEXT,
    "investmentAmount" DOUBLE PRECISION,
    "referralCount" INTEGER,
    "teamSize" INTEGER,
    "timePeriodMonths" INTEGER,
    "calculatedEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectedEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakEvenMonths" INTEGER,
    "roi" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BPICalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "location" TEXT,
    "propertyType" TEXT,
    "currentEnergyBill" DOUBLE PRECISION,
    "averageMonthlyUsage" DOUBLE PRECISION,
    "roofType" TEXT,
    "roofArea" DOUBLE PRECISION,
    "budgetRange" TEXT,
    "estimatedSystemSize" DOUBLE PRECISION,
    "estimatedSavings" DOUBLE PRECISION,
    "recommendedSystem" TEXT,
    "quotedAmount" DOUBLE PRECISION,
    "consultationScheduled" TIMESTAMP(3),
    "consultantId" TEXT,
    "consultantNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SolarAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalFarm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmLevel" INTEGER NOT NULL DEFAULT 1,
    "farmSize" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "farmName" TEXT,
    "cropTypes" JSONB,
    "totalInvested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHarvested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "harvestCount" INTEGER NOT NULL DEFAULT 0,
    "nextHarvestAt" TIMESTAMP(3),
    "lastHarvestAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalFarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCrop" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "plantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturityDays" INTEGER NOT NULL,
    "harvestAt" TIMESTAMP(3) NOT NULL,
    "investmentAmount" DOUBLE PRECISION NOT NULL,
    "expectedYield" DOUBLE PRECISION NOT NULL,
    "actualYield" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'growing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalCrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmHarvest" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "yieldAmount" DOUBLE PRECISION NOT NULL,
    "earningsAmount" DOUBLE PRECISION NOT NULL,
    "harvestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmHarvest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCourse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "estimatedHours" DOUBLE PRECISION,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "minPackageLevel" TEXT,
    "minRank" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "documentUrl" TEXT,
    "lessonOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "quizQuestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedLessons" JSONB,
    "quizScores" JSONB,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateUrl" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EPCandEPP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRank" TEXT NOT NULL DEFAULT 'Starter',
    "rankLevel" INTEGER NOT NULL DEFAULT 1,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "lastMonthPoints" INTEGER NOT NULL DEFAULT 0,
    "nextRankPoints" INTEGER NOT NULL DEFAULT 100,
    "achievementsUnlocked" JSONB,
    "regionalRank" INTEGER,
    "globalRank" INTEGER,
    "region" TEXT,
    "lastPromotionAt" TIMESTAMP(3),
    "lastPointsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EPCandEPP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EPCPointHistory" (
    "id" TEXT NOT NULL,
    "epcId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EPCPointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BestDeal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dealType" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "discountedPrice" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usagePerUser" INTEGER NOT NULL DEFAULT 1,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "eligiblePackages" TEXT,
    "eligibleRanks" TEXT,
    "minPurchaseAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BestDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "discountAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DealClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFeature_slug_key" ON "CommunityFeature"("slug");

-- CreateIndex
CREATE INDEX "CommunityFeature_isActive_displayOrder_idx" ON "CommunityFeature"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "UserFeatureProgress_userId_idx" ON "UserFeatureProgress"("userId");

-- CreateIndex
CREATE INDEX "UserFeatureProgress_featureId_idx" ON "UserFeatureProgress"("featureId");

-- CreateIndex
CREATE INDEX "UserFeatureProgress_isQualified_idx" ON "UserFeatureProgress"("isQualified");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureProgress_userId_featureId_key" ON "UserFeatureProgress"("userId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipPoolQualification_userId_key" ON "LeadershipPoolQualification"("userId");

-- CreateIndex
CREATE INDEX "LeadershipPoolQualification_isQualified_idx" ON "LeadershipPoolQualification"("isQualified");

-- CreateIndex
CREATE INDEX "LeadershipPoolQualification_userId_idx" ON "LeadershipPoolQualification"("userId");

-- CreateIndex
CREATE INDEX "CommunityUpdate_isActive_publishedAt_idx" ON "CommunityUpdate"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "CommunityUpdate_category_idx" ON "CommunityUpdate"("category");

-- CreateIndex
CREATE INDEX "CommunityUpdate_priority_idx" ON "CommunityUpdate"("priority");

-- CreateIndex
CREATE INDEX "UpdateRead_userId_idx" ON "UpdateRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateRead_userId_updateId_key" ON "UpdateRead"("userId", "updateId");

-- CreateIndex
CREATE INDEX "PromotionalMaterial_isActive_category_idx" ON "PromotionalMaterial"("isActive", "category");

-- CreateIndex
CREATE INDEX "PromotionalMaterial_type_idx" ON "PromotionalMaterial"("type");

-- CreateIndex
CREATE INDEX "MaterialDownload_userId_idx" ON "MaterialDownload"("userId");

-- CreateIndex
CREATE INDEX "MaterialDownload_materialId_idx" ON "MaterialDownload"("materialId");

-- CreateIndex
CREATE INDEX "BPICalculation_userId_idx" ON "BPICalculation"("userId");

-- CreateIndex
CREATE INDEX "BPICalculation_createdAt_idx" ON "BPICalculation"("createdAt");

-- CreateIndex
CREATE INDEX "SolarAssessment_userId_idx" ON "SolarAssessment"("userId");

-- CreateIndex
CREATE INDEX "SolarAssessment_assessmentStatus_idx" ON "SolarAssessment"("assessmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalFarm_userId_key" ON "DigitalFarm"("userId");

-- CreateIndex
CREATE INDEX "DigitalFarm_userId_idx" ON "DigitalFarm"("userId");

-- CreateIndex
CREATE INDEX "DigitalCrop_farmId_idx" ON "DigitalCrop"("farmId");

-- CreateIndex
CREATE INDEX "DigitalCrop_status_idx" ON "DigitalCrop"("status");

-- CreateIndex
CREATE INDEX "DigitalCrop_harvestAt_idx" ON "DigitalCrop"("harvestAt");

-- CreateIndex
CREATE INDEX "FarmHarvest_farmId_idx" ON "FarmHarvest"("farmId");

-- CreateIndex
CREATE INDEX "FarmHarvest_userId_idx" ON "FarmHarvest"("userId");

-- CreateIndex
CREATE INDEX "TrainingCourse_isActive_displayOrder_idx" ON "TrainingCourse"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "TrainingCourse_category_idx" ON "TrainingCourse"("category");

-- CreateIndex
CREATE INDEX "TrainingLesson_courseId_lessonOrder_idx" ON "TrainingLesson"("courseId", "lessonOrder");

-- CreateIndex
CREATE INDEX "TrainingProgress_userId_idx" ON "TrainingProgress"("userId");

-- CreateIndex
CREATE INDEX "TrainingProgress_courseId_idx" ON "TrainingProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgress_userId_courseId_key" ON "TrainingProgress"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "EPCandEPP_userId_key" ON "EPCandEPP"("userId");

-- CreateIndex
CREATE INDEX "EPCandEPP_userId_idx" ON "EPCandEPP"("userId");

-- CreateIndex
CREATE INDEX "EPCandEPP_currentRank_idx" ON "EPCandEPP"("currentRank");

-- CreateIndex
CREATE INDEX "EPCandEPP_globalRank_idx" ON "EPCandEPP"("globalRank");

-- CreateIndex
CREATE INDEX "EPCPointHistory_epcId_idx" ON "EPCPointHistory"("epcId");

-- CreateIndex
CREATE INDEX "EPCPointHistory_userId_idx" ON "EPCPointHistory"("userId");

-- CreateIndex
CREATE INDEX "EPCPointHistory_createdAt_idx" ON "EPCPointHistory"("createdAt");

-- CreateIndex
CREATE INDEX "BestDeal_isActive_endDate_idx" ON "BestDeal"("isActive", "endDate");

-- CreateIndex
CREATE INDEX "BestDeal_dealType_idx" ON "BestDeal"("dealType");

-- CreateIndex
CREATE INDEX "DealClaim_userId_idx" ON "DealClaim"("userId");

-- CreateIndex
CREATE INDEX "DealClaim_dealId_idx" ON "DealClaim"("dealId");

-- AddForeignKey
ALTER TABLE "UserFeatureProgress" ADD CONSTRAINT "UserFeatureProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureProgress" ADD CONSTRAINT "UserFeatureProgress_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "CommunityFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipPoolQualification" ADD CONSTRAINT "LeadershipPoolQualification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityUpdate" ADD CONSTRAINT "CommunityUpdate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRead" ADD CONSTRAINT "UpdateRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRead" ADD CONSTRAINT "UpdateRead_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "CommunityUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalMaterial" ADD CONSTRAINT "PromotionalMaterial_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "PromotionalMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BPICalculation" ADD CONSTRAINT "BPICalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarAssessment" ADD CONSTRAINT "SolarAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalFarm" ADD CONSTRAINT "DigitalFarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalCrop" ADD CONSTRAINT "DigitalCrop_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "DigitalFarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmHarvest" ADD CONSTRAINT "FarmHarvest_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "DigitalFarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmHarvest" ADD CONSTRAINT "FarmHarvest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCourse" ADD CONSTRAINT "TrainingCourse_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLesson" ADD CONSTRAINT "TrainingLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EPCandEPP" ADD CONSTRAINT "EPCandEPP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EPCPointHistory" ADD CONSTRAINT "EPCPointHistory_epcId_fkey" FOREIGN KEY ("epcId") REFERENCES "EPCandEPP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EPCPointHistory" ADD CONSTRAINT "EPCPointHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BestDeal" ADD CONSTRAINT "BestDeal_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealClaim" ADD CONSTRAINT "DealClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealClaim" ADD CONSTRAINT "DealClaim_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "BestDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
