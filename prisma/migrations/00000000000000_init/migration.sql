-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'LICENSE', 'SERVICE', 'UTILITY');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('UNLIMITED', 'LIMITED', 'TIME_BOUND');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('CASH', 'CASHBACK', 'BPT', 'UTILITY_TOKEN');

-- CreateEnum
CREATE TYPE "RewardValueType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "TokenRateSource" AS ENUM ('FIXED', 'ADMIN_DAILY', 'ORACLE_FUTURE');

-- CreateEnum
CREATE TYPE "StoreProfitMode" AS ENUM ('PERCENT', 'FIXED', 'HYBRID');

-- CreateEnum
CREATE TYPE "StoreRewardBasis" AS ENUM ('GROSS', 'PROFIT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('NOT_READY', 'CODE_ISSUED', 'VERIFIED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RewardSettlementState" AS ENUM ('PENDING', 'ISSUED', 'FAILED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('FIAT', 'CASHBACK', 'BPT', 'UTILITY');

-- CreateEnum
CREATE TYPE "ProductPricingMode" AS ENUM ('FIAT', 'TOKEN_UNIT');

-- CreateEnum
CREATE TYPE "RevenueSource" AS ENUM ('COMMUNITY_SUPPORT', 'MEMBERSHIP_REGISTRATION', 'MEMBERSHIP_RENEWAL', 'STORE_PURCHASE', 'WITHDRAWAL_FEE', 'YOUTUBE_SUBSCRIPTION', 'THIRD_PARTY_SERVICES', 'PALLIATIVE_PROGRAM', 'LEADERSHIP_POOL_FEE', 'TRAINING_CENTER', 'ELITE_CLUB_OPS', 'ELITE_CLUB_INVESTMENT_PROFIT', 'OTHER');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('PENDING', 'ALLOCATED', 'DISTRIBUTED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PoolType" AS ENUM ('LEADERSHIP', 'STATE', 'DIRECTORS', 'TECHNOLOGY', 'INVESTORS');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DistributionFrequency" AS ENUM ('MANUAL', 'MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DISTRIBUTION', 'WITHDRAWAL', 'ADJUSTMENT', 'BONUS');

-- CreateEnum
CREATE TYPE "ReserveTransactionType" AS ENUM ('REVENUE_ALLOCATION', 'OPERATIONAL_SPEND', 'TRANSFER_TO_POOL', 'TRANSFER_FROM_POOL', 'ADJUSTMENT', 'BONUS');

-- CreateEnum
CREATE TYPE "TechProjectStatus" AS ENUM ('PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ON_HOLD');

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
CREATE TYPE "EliteClubCredEventType" AS ENUM ('CONTRIBUTION_PAID', 'CONTRIBUTION_MISSED', 'DEFAULT', 'SUSPENSION', 'OPT_OUT', 'PAYOUT_RECEIVED', 'GUARANTEE_DEFAULT', 'POSITIVE_VOTE', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "EliteClubTokenVerifMethod" AS ENUM ('WALLET_CONNECT', 'PROOF_UPLOAD');

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

-- CreateEnum
CREATE TYPE "PromoCampaignType" AS ENUM ('FREE_MEMBERSHIP_ACTIVATION');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveShelter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shelterPackage" INTEGER NOT NULL,
    "shelterOption" INTEGER NOT NULL,
    "starterPack" INTEGER,
    "amount" INTEGER,
    "status" TEXT,
    "activatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveShelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "installerSsc" TEXT,
    "ssc" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "region" TEXT,
    "state" TEXT,
    "totalLoad" DOUBLE PRECISION NOT NULL,
    "inverterCapacity" DOUBLE PRECISION NOT NULL,
    "batteryCapacity" INTEGER NOT NULL,
    "solarPanels" INTEGER NOT NULL,
    "isBpiMember" BOOLEAN NOT NULL,
    "installationType" TEXT NOT NULL,
    "installationAddress" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "preferredInstallationDate" TIMESTAMP(3),
    "paymentReceiptPath" TEXT,
    "status" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "blocks" JSONB,
    "heroImage" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BpiMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipType" TEXT NOT NULL DEFAULT 'regular',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "pendingActivation" BOOLEAN NOT NULL DEFAULT false,
    "isShelter" BOOLEAN NOT NULL DEFAULT false,
    "shelterWallet" BOOLEAN NOT NULL DEFAULT false,
    "shelterPending" BOOLEAN NOT NULL DEFAULT false,
    "wallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spendable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashback" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "referralLink" TEXT,
    "profilePic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BpiMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BptConversionRate" (
    "id" TEXT NOT NULL,
    "rateUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.002,
    "rateNgn" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BptConversionRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpTopic" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "steps" JSONB,
    "faq" JSONB,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRevision" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentSnapshot" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpBotIntent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "response" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpBotIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpBotTrainingExample" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "utterance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpBotTrainingExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurnEvent" (
    "id" TEXT NOT NULL,
    "amountBpt" DOUBLE PRECISION NOT NULL,
    "valueNgn" DOUBLE PRECISION NOT NULL,
    "valueUsd" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "burnType" TEXT NOT NULL,
    "description" TEXT,
    "systemWalletId" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "BurnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyBackEvent" (
    "id" TEXT NOT NULL,
    "systemWalletId" TEXT NOT NULL,
    "amountNgn" DOUBLE PRECISION NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "bptPurchased" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyBackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelSubscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subscriptionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPalliative" (
    "id" TEXT NOT NULL,
    "packageId" INTEGER NOT NULL,
    "direct" DOUBLE PRECISION NOT NULL,
    "level1" DOUBLE PRECISION NOT NULL,
    "level2" DOUBLE PRECISION NOT NULL,
    "level3" DOUBLE PRECISION NOT NULL,
    "level4" DOUBLE PRECISION NOT NULL,
    "level5" DOUBLE PRECISION NOT NULL,
    "level6" DOUBLE PRECISION NOT NULL,
    "level7" DOUBLE PRECISION NOT NULL,
    "level8" DOUBLE PRECISION NOT NULL,
    "level9" DOUBLE PRECISION NOT NULL,
    "level10" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CommissionPalliative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionShelter" (
    "id" TEXT NOT NULL,
    "packageId" INTEGER NOT NULL,
    "direct" DOUBLE PRECISION NOT NULL,
    "level1" DOUBLE PRECISION NOT NULL,
    "level2" DOUBLE PRECISION NOT NULL,
    "level3" DOUBLE PRECISION NOT NULL,
    "level4" DOUBLE PRECISION NOT NULL,
    "level5" DOUBLE PRECISION NOT NULL,
    "level6" DOUBLE PRECISION NOT NULL,
    "level7" DOUBLE PRECISION NOT NULL,
    "level8" DOUBLE PRECISION NOT NULL,
    "level9" DOUBLE PRECISION NOT NULL,
    "level10" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CommissionShelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionWallet" (
    "id" TEXT NOT NULL,
    "packageId" INTEGER NOT NULL,
    "direct" DOUBLE PRECISION NOT NULL,
    "level1" DOUBLE PRECISION NOT NULL,
    "level2" DOUBLE PRECISION NOT NULL,
    "level3" DOUBLE PRECISION NOT NULL,
    "level4" DOUBLE PRECISION NOT NULL,
    "level5" DOUBLE PRECISION NOT NULL,
    "level6" DOUBLE PRECISION NOT NULL,
    "level7" DOUBLE PRECISION NOT NULL,
    "level8" DOUBLE PRECISION NOT NULL,
    "level9" DOUBLE PRECISION NOT NULL,
    "level10" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CommissionWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityCategory" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryIcon" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "post" TEXT NOT NULL,
    "image" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPostReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPostReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityStats" (
    "id" TEXT NOT NULL,
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "palliativeMembers" INTEGER NOT NULL DEFAULT 0,
    "totalPartners" INTEGER NOT NULL DEFAULT 0,
    "totalOffers" INTEGER NOT NULL DEFAULT 0,
    "activeTickets" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityStats_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateInvited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRegistered" TIMESTAMP(3),
    "bpiMembershipStatus" TEXT NOT NULL DEFAULT 'Not Registered',
    "profileSetup" BOOLEAN NOT NULL DEFAULT false,
    "bptSpent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyManagement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "default" INTEGER,
    "sign" TEXT,
    "country" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BPTokenPrice" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BPTokenPrice_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "tags" TEXT,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER,
    "authorId" TEXT,
    "image" TEXT,
    "imageUrl" TEXT,
    "imageInternalized" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "legacyId" INTEGER,
    "legacySource" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" TEXT,
    "legacyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogView" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogView_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "EmpowermentPackage" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active - Countdown Running',
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "grossEmpowermentValue" DOUBLE PRECISION NOT NULL DEFAULT 7250000,
    "netEmpowermentValue" DOUBLE PRECISION NOT NULL DEFAULT 6706250,
    "grossSponsorReward" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "netSponsorReward" DOUBLE PRECISION NOT NULL DEFAULT 925000,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "beneficiaryCanView" BOOLEAN NOT NULL DEFAULT true,
    "beneficiaryCanWithdraw" BOOLEAN NOT NULL DEFAULT false,
    "conversionAmount" DOUBLE PRECISION,
    "convertedAt" TIMESTAMP(3),
    "empowermentType" TEXT NOT NULL,
    "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fallbackGrossAmount" DOUBLE PRECISION NOT NULL DEFAULT 396000,
    "fallbackNetAmount" DOUBLE PRECISION NOT NULL DEFAULT 366300,
    "packageFee" DOUBLE PRECISION NOT NULL DEFAULT 330000,
    "rejectionReason" TEXT,
    "releasedAt" TIMESTAMP(3),
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "totalTaxDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat" DOUBLE PRECISION NOT NULL DEFAULT 24750,
    "walletCreditAmount" DOUBLE PRECISION,
    "outcomeType" TEXT,
    "creditedPercent" DOUBLE PRECISION,
    "totalReleasedPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReleasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sponsorRewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "sponsorRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cspWaiverEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cspWaiverUsed" BOOLEAN NOT NULL DEFAULT false,
    "refundInterestRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "beneficiaryUpgraded" BOOLEAN NOT NULL DEFAULT false,
    "outcomeSetAt" TIMESTAMP(3),
    "outcomeSetBy" TEXT,

    CONSTRAINT "EmpowermentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpowermentTranche" (
    "id" TEXT NOT NULL,
    "empowermentPackageId" TEXT NOT NULL,
    "trancheNumber" INTEGER NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "EmpowermentTranche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpowermentTransaction" (
    "id" TEXT NOT NULL,
    "empowermentPackageId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmpowermentTransaction_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "FundingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorsPool" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvestorsPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipPool" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipPool_pkey" PRIMARY KEY ("id")
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
    "sponsorshipClass" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeadershipPoolQualification_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "MembershipPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "profitMode" "StoreProfitMode" NOT NULL DEFAULT 'PERCENT',
    "profitPercent" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "profitFixedAmountFiat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseMembershipPackageId" TEXT,
    "cash_l1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpt_l1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliative_l1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cash_l2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpt_l2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliative_l2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cash_l3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpt_l3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliative_l3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cash_l4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpt_l4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliative_l4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cashback_l1" DOUBLE PRECISION,
    "cashback_l2" DOUBLE PRECISION,
    "cashback_l3" DOUBLE PRECISION,
    "cashback_l4" DOUBLE PRECISION,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasRenewal" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "packageType" TEXT NOT NULL DEFAULT 'STANDARD',
    "renewalCycle" INTEGER NOT NULL DEFAULT 365,
    "renewalFee" DOUBLE PRECISION,
    "renewal_bpt_l1" DOUBLE PRECISION,
    "renewal_bpt_l2" DOUBLE PRECISION,
    "renewal_bpt_l3" DOUBLE PRECISION,
    "renewal_bpt_l4" DOUBLE PRECISION,
    "renewal_cash_l1" DOUBLE PRECISION,
    "renewal_cash_l2" DOUBLE PRECISION,
    "renewal_cash_l3" DOUBLE PRECISION,
    "renewal_cash_l4" DOUBLE PRECISION,
    "renewal_cashback_l1" DOUBLE PRECISION,
    "renewal_cashback_l2" DOUBLE PRECISION,
    "renewal_cashback_l3" DOUBLE PRECISION,
    "renewal_cashback_l4" DOUBLE PRECISION,
    "renewal_health_l1" DOUBLE PRECISION,
    "renewal_health_l2" DOUBLE PRECISION,
    "renewal_health_l3" DOUBLE PRECISION,
    "renewal_health_l4" DOUBLE PRECISION,
    "renewal_meal_l1" DOUBLE PRECISION,
    "renewal_meal_l2" DOUBLE PRECISION,
    "renewal_meal_l3" DOUBLE PRECISION,
    "renewal_meal_l4" DOUBLE PRECISION,
    "renewal_palliative_l1" DOUBLE PRECISION,
    "renewal_palliative_l2" DOUBLE PRECISION,
    "renewal_palliative_l3" DOUBLE PRECISION,
    "renewal_palliative_l4" DOUBLE PRECISION,
    "renewal_security_l1" DOUBLE PRECISION,
    "renewal_security_l2" DOUBLE PRECISION,
    "renewal_security_l3" DOUBLE PRECISION,
    "renewal_security_l4" DOUBLE PRECISION,
    "shelter_l1" DOUBLE PRECISION,
    "shelter_l10" DOUBLE PRECISION,
    "shelter_l2" DOUBLE PRECISION,
    "shelter_l3" DOUBLE PRECISION,
    "shelter_l4" DOUBLE PRECISION,
    "shelter_l5" DOUBLE PRECISION,
    "shelter_l6" DOUBLE PRECISION,
    "shelter_l7" DOUBLE PRECISION,
    "shelter_l8" DOUBLE PRECISION,
    "shelter_l9" DOUBLE PRECISION,

    CONSTRAINT "MembershipPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageActivation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PackageActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalliativeMaturity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "palliativeType" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "completedAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dateCompleted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "PalliativeMaturity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalliativeOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PalliativeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalliativePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "benefits" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PalliativePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalliativeTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dateClaimed" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "activatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PalliativeTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalliativeWalletActivation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "palliativeType" TEXT NOT NULL,
    "membershipTier" TEXT NOT NULL,
    "activationType" TEXT NOT NULL,
    "thresholdAmount" DOUBLE PRECISION,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PalliativeWalletActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOffer" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "locationId" TEXT,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralTree" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referredBy" INTEGER,
    "level1" INTEGER,
    "level2" INTEGER,
    "level3" INTEGER,
    "level4" INTEGER,
    "level5" INTEGER,
    "level6" INTEGER,
    "level7" INTEGER,
    "level8" INTEGER,
    "level9" INTEGER,
    "level10" INTEGER,
    "referralDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "renewalNumber" INTEGER NOT NULL,
    "renewalFee" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "totalPaid" DOUBLE PRECISION NOT NULL,
    "renewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cashDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bptDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliativeDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "securityDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RenewalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelterReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "packageType" TEXT NOT NULL,
    "sourceActivationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShelterReward_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "RewardConfig" (
    "id" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "rewardValue" DECIMAL(18,4) NOT NULL,
    "rewardValueType" "RewardValueType" NOT NULL,
    "vestingRule" TEXT NOT NULL,
    "maxRewardCap" DECIMAL(18,4),
    "utilityTokenSymbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "pricingMode" "ProductPricingMode" NOT NULL DEFAULT 'FIAT',
    "basePriceFiat" DECIMAL(18,2) NOT NULL,
    "tokenUnitSymbol" TEXT,
    "tokenUnitAmount" DECIMAL(28,8),
    "profitMode" "StoreProfitMode" NOT NULL DEFAULT 'PERCENT',
    "profitPercent" DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
    "profitFixedAmountFiat" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "minTokenPercent" DECIMAL(5,4),
    "acceptedTokens" TEXT[],
    "tokenPaymentLimits" JSONB NOT NULL,
    "rewardConfigId" TEXT,
    "inventoryType" "InventoryType" NOT NULL DEFAULT 'UNLIMITED',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "pickupCenterId" TEXT,
    "rewardCenterId" TEXT,
    "deliveryRequired" BOOLEAN NOT NULL DEFAULT false,
    "heroBadge" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "vendor" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRate" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rateToFiat" DECIMAL(18,6) NOT NULL,
    "source" "TokenRateSource" NOT NULL DEFAULT 'FIXED',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "paymentBreakdown" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'NOT_READY',
    "claimCode" TEXT,
    "pickupVerifiedAt" TIMESTAMP(3),
    "pickupVerifiedBy" TEXT,
    "pickupCompletionConfirmedAt" TIMESTAMP(3),
    "pickupCompletionConfirmedBy" TEXT,
    "feedbackInvitationSentAt" TIMESTAMP(3),
    "feedbackSubmittedAt" TIMESTAMP(3),
    "rewardSettlementState" "RewardSettlementState" NOT NULL DEFAULT 'PENDING',
    "rewardConfigSnapshot" JSONB,
    "tokenRateSnapshot" JSONB,
    "pickupCenterId" TEXT,
    "rewardCenterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreRewardConfig" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreRewardLevel" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "rewardBasis" "StoreRewardBasis" NOT NULL,
    "rewardValueType" "RewardValueType" NOT NULL,
    "rewardValue" DECIMAL(18,4) NOT NULL,
    "payoutType" "RewardType" NOT NULL,
    "maxRewardCap" DECIMAL(18,4),
    "utilityTokenSymbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRewardLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreReferralRewardLedger" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "basis" "StoreRewardBasis" NOT NULL,
    "basisAmountFiat" DECIMAL(18,2) NOT NULL,
    "payoutType" "RewardType" NOT NULL,
    "payoutAmountFiat" DECIMAL(18,2),
    "tokenSymbol" TEXT,
    "tokenAmount" DECIMAL(28,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreReferralRewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupExperienceRating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickupCenterId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupExperienceRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletType" "WalletType" NOT NULL,
    "symbol" TEXT,
    "balance" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrder" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "pickupCenterId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image1" TEXT NOT NULL,
    "image2" TEXT,
    "image3" TEXT,
    "image4" TEXT,
    "description" TEXT NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "pickupReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "direct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackDirect" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackLevel1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackLevel2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackLevel3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackLevel4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentPalliative" INTEGER NOT NULL DEFAULT 0,
    "lifetimeRoyalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logistics" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inStock" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemWallet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "balanceBpt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceNgn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPubliclyVisible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SystemWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "registrationUrl" TEXT,
    "adminDefaultLink" TEXT,
    "defaultAdminUserId" TEXT,
    "category" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "referredByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ThirdPartyRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyExecutiveOverpass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyExecutiveOverpass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyMatrixNode" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "leftUserId" TEXT,
    "rightUserId" TEXT,
    "leftWeight" INTEGER NOT NULL DEFAULT 0,
    "rightWeight" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyMatrixNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyMatrixPlacement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "leg" TEXT NOT NULL,
    "sourceFlow" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyMatrixPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyMatrixPlacementAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "leg" TEXT NOT NULL,
    "decisionBranch" TEXT NOT NULL,
    "sourceFlow" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThirdPartyMatrixPlacementAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyMatrixSponsorState" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "nextPreferredLeg" TEXT NOT NULL DEFAULT 'LEFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyMatrixSponsorState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyMatrixSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowAutoPlacement" BOOLEAN NOT NULL DEFAULT true,
    "allowAdminMaintenance" BOOLEAN NOT NULL DEFAULT true,
    "maxPlacementRetries" INTEGER NOT NULL DEFAULT 3,
    "alertImbalanceThreshold" INTEGER NOT NULL DEFAULT 4,
    "registrationUrl" TEXT,
    "adminDefaultLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyMatrixSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "reply" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "memberAmount" DOUBLE PRECISION NOT NULL,
    "buyBackAmount" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletType" TEXT NOT NULL DEFAULT 'main',
    "metadata" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" INTEGER,
    "transactionType" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "TransactionHistory_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "firstname" TEXT,
    "lastname" TEXT,
    "mobile" TEXT,
    "ssc" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "profilePic" TEXT,
    "secondaryEmail" TEXT,
    "username" TEXT,
    "referralLink" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'user',
    "rank" TEXT NOT NULL DEFAULT 'Newbie',
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "kyc" TEXT,
    "kycPending" INTEGER NOT NULL DEFAULT 0,
    "withdrawBan" INTEGER NOT NULL DEFAULT 0,
    "withdrawBanAt" TIMESTAMP(3),
    "withdrawBanBy" TEXT,
    "withdrawBanReason" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "pendingActivation" INTEGER,
    "isVip" INTEGER NOT NULL DEFAULT 0,
    "isShelter" INTEGER NOT NULL DEFAULT 0,
    "vipPending" INTEGER NOT NULL DEFAULT 0,
    "shelterPending" INTEGER NOT NULL DEFAULT 0,
    "shelterWallet" INTEGER NOT NULL DEFAULT 0,
    "isShareholder" INTEGER NOT NULL DEFAULT 0,
    "wallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spendable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "palliative" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashback" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentCashback" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "community" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shareholder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shelter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "education" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "car" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "business" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solar" DOUBLE PRECISION,
    "legals" DOUBLE PRECISION,
    "land" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "health" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultCurrency" INTEGER NOT NULL DEFAULT 1,
    "level1Count" INTEGER NOT NULL DEFAULT 0,
    "level2Count" INTEGER NOT NULL DEFAULT 0,
    "level3Count" INTEGER NOT NULL DEFAULT 0,
    "level4Count" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'user',
    "passwordHash" TEXT,
    "verificationCode" TEXT,
    "resetToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacyId" TEXT,
    "referredBy" TEXT,
    "activeMembershipPackageId" TEXT,
    "bpiTokenWallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sponsorId" TEXT,
    "membershipActivatedAt" TIMESTAMP(3),
    "membershipExpiresAt" TIMESTAMP(3),
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "security" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inviteCode" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "bnbWalletAddress" TEXT,
    "myngulActivationPin" TEXT,
    "palliativeActivated" BOOLEAN NOT NULL DEFAULT false,
    "palliativeActivatedAt" TIMESTAMP(3),
    "palliativeTier" TEXT,
    "selectedPalliative" TEXT,
    "socialMedia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "city_id" INTEGER,
    "country_id" INTEGER,
    "state_id" INTEGER,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "userProfilePin" TEXT,
    "empowermentSponsorReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retirement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "travelTour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usdtAddress" TEXT,
    "allowUsdFeatures" BOOLEAN NOT NULL DEFAULT false,
    "walletFrozen" BOOLEAN NOT NULL DEFAULT false,
    "walletFrozenAt" TIMESTAMP(3),
    "walletFrozenBy" TEXT,
    "walletFrozenReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEarning_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "UserThirdPartyLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT,
    "profileUrl" TEXT,
    "referralLink" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserThirdPartyLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "WithdrawalHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithdrawalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeChannel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelName" TEXT,
    "channelUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subscribers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelLink" TEXT,
    "channelLogo" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificationCode" TEXT,

    CONSTRAINT "YoutubeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "vat" DECIMAL(10,2) NOT NULL,
    "totalSub" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YoutubePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubePlanId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YoutubeProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "gatewayName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publicKey" TEXT,
    "secretKey" TEXT,
    "merchantId" TEXT,
    "webhookUrl" TEXT,
    "callbackUrl" TEXT,
    "supportedMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "fees" JSONB,
    "limits" JSONB,
    "logo" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apiProvider" TEXT,
    "bankAccount" TEXT,
    "bankAccountName" TEXT,
    "bankName" TEXT,
    "cryptoPublicKey" TEXT,
    "cryptoSecretKey" TEXT,
    "cryptoDepositAddress" TEXT,
    "cryptoNetwork" TEXT,
    "currentPriceNgn" DOUBLE PRECISION,
    "currentPriceUsd" DOUBLE PRECISION,
    "homePageUrl" TEXT,
    "merchantKey" TEXT,
    "tokenContractAddress" TEXT,
    "tokenName" TEXT,
    "tokenSymbol" TEXT,
    "tokenomicsUrl" TEXT,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentMethod" TEXT NOT NULL,
    "gatewayReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "proofOfPayment" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotificationSettings" (
    "id" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "template" TEXT,
    "thresholds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "dial_code" INTEGER,
    "code" TEXT,
    "created_datetime" TIMESTAMP(3),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "state_id" INTEGER NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nigerian_banks" (
    "id" SERIAL NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nigerian_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_records" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_id" INTEGER,
    "bank_name" TEXT,
    "account_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bvn" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bank_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspSupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "requestedAmount" INTEGER,
    "purpose" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "thresholdAmount" INTEGER NOT NULL,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "contributorsCount" INTEGER NOT NULL DEFAULT 0,
    "broadcastExpiresAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cooldownMonths" INTEGER,
    "cooldownEndsAt" TIMESTAMP(3),
    "tierNumber" INTEGER,
    "tierContributionRight" INTEGER,
    "minFulfilmentPct" INTEGER,
    "autoExtendCount" INTEGER NOT NULL DEFAULT 0,
    "fulfilledAt" TIMESTAMP(3),
    "countryCode" TEXT,
    "isAdminDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspTier" (
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

-- CreateTable
CREATE TABLE "CspMemberStanding" (
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

-- CreateTable
CREATE TABLE "CspDonationBadgeCategory" (
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

-- CreateTable
CREATE TABLE "CspDonation" (
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

-- CreateTable
CREATE TABLE "CspTimeReductionBadge" (
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

-- CreateTable
CREATE TABLE "CspBadgeTransfer" (
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

-- CreateTable
CREATE TABLE "CspRuleChangeLog" (
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

-- CreateTable
CREATE TABLE "CspWaitReductionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "amountContrib" INTEGER NOT NULL DEFAULT 0,
    "monthReduced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspWaitReductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspCountry" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "isNationalActive" BOOLEAN NOT NULL DEFAULT false,
    "isGlobalActive" BOOLEAN NOT NULL DEFAULT false,
    "regularActivationCount" INTEGER NOT NULL DEFAULT 0,
    "activationThreshold" INTEGER NOT NULL DEFAULT 10000,
    "activatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspCountry_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "FarmPlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plotName" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "plotSize" DOUBLE PRECISION NOT NULL,
    "investmentAmount" DOUBLE PRECISION NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'seeded',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "daysRemaining" INTEGER NOT NULL,
    "estimatedYield" DOUBLE PRECISION NOT NULL,
    "estimatedRevenue" DOUBLE PRECISION NOT NULL,
    "actualYield" DOUBLE PRECISION,
    "actualRevenue" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "harvestDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmPlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmActivity" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "growthDuration" INTEGER NOT NULL,
    "minInvestment" DOUBLE PRECISION NOT NULL,
    "maxInvestment" DOUBLE PRECISION NOT NULL,
    "yieldPerHectare" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueTransaction" (
    "id" TEXT NOT NULL,
    "source" "RevenueSource" NOT NULL,
    "sourceKey" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "description" TEXT,
    "sourceId" TEXT,
    "userId" TEXT,
    "programType" TEXT,
    "productId" TEXT,
    "orderId" TEXT,
    "packageId" TEXT,
    "country" TEXT,
    "state" TEXT,
    "region" TEXT,
    "tokenSymbol" TEXT,
    "metadata" JSONB,
    "profitPoolConfigVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allocatedAt" TIMESTAMP(3),
    "allocationStatus" "AllocationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "RevenueTransaction_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "RevenueAllocation" (
    "id" TEXT NOT NULL,
    "revenueTransactionId" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL,
    "destinationId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'ALLOCATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distributedAt" TIMESTAMP(3),

    CONSTRAINT "RevenueAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveShareholder" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "userId" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalEarned" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lastDistributionAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveShareholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveDistribution" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "shareholderId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveWalletTransaction" (
    "id" TEXT NOT NULL,
    "shareholderId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "distributionId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyPool" (
    "id" TEXT NOT NULL,
    "type" "PoolType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 4.00,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "distributionFrequency" "DistributionFrequency" NOT NULL DEFAULT 'MANUAL',
    "lastDistributedAt" TIMESTAMP(3),
    "nextDistributionAt" TIMESTAMP(3),
    "maxMembers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolMember" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customPercentage" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalEarned" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lastDistributionAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,
    "leftAt" TIMESTAMP(3),
    "eligibilityCriteria" TEXT,
    "qualificationNote" TEXT,
    "qualificationStatus" TEXT,

    CONSTRAINT "PoolMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolDistribution" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "amountPerMember" DECIMAL(18,2) NOT NULL,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "distributedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyReserve" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyReserve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyReserveTransaction" (
    "id" TEXT NOT NULL,
    "reserveId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "ReserveTransactionType" NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyReserveTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueAdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "revenueTransactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueAdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolAdminAction" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolAdminAction_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "RevenueSnapshot" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "companyReserveTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "executivePoolTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "strategicPoolsTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "communitySupport" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "membershipRegistration" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "membershipRenewal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "storePurchase" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "withdrawalFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "youtubeSubscription" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "thirdPartyServices" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "palliativeProgram" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "leadershipPoolFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "trainingCenter" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "other" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "executivesDistributed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "poolsDistributed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "RevenueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteClub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "EliteClubTier" NOT NULL,
    "status" "EliteClubStatus" NOT NULL DEFAULT 'FORMING',
    "formationStatus" "EliteClubFormationStatus" NOT NULL DEFAULT 'OPEN',
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
CREATE TABLE "EliteClubOperationsFee" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossOps" DOUBLE PRECISION NOT NULL,
    "bpiShare" DOUBLE PRECISION NOT NULL,
    "eliteShare" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteClubOperationsFee_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "legalFirstName" TEXT NOT NULL,
    "legalLastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "gender" TEXT,
    "residentialAddress" TEXT NOT NULL,
    "residentialCity" TEXT NOT NULL,
    "residentialState" TEXT NOT NULL,
    "residentialCountry" TEXT NOT NULL,
    "residentialZip" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentFrontUrl" TEXT NOT NULL,
    "documentBackUrl" TEXT,
    "documentExpiryDate" TIMESTAMP(3),
    "proofOfAddressUrl" TEXT,
    "proofOfAddressType" TEXT,
    "selfieUrl" TEXT,
    "livenessCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "bvn" TEXT,
    "nin" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "expiryNotifiedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycAuditLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "performedByRole" TEXT,
    "details" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "scheduledFor" TIMESTAMP(3),
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "filter" TEXT NOT NULL DEFAULT 'all',
    "membershipPackage" TEXT,
    "fromEmail" TEXT,
    "replyToEmail" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "embeddedImages" JSONB NOT NULL DEFAULT '[]',
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

-- CreateTable
CREATE TABLE "PromoCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PromoCampaignType" NOT NULL,
    "quota" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "targetPackageId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoActivationClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoActivationClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAutoDebitSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "applyToRewards" BOOLEAN NOT NULL DEFAULT true,
    "applyToDeposits" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAutoDebitSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspAutoContributeSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minAmountPerRequest" INTEGER NOT NULL DEFAULT 500,
    "maxAmountPerRequest" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspAutoContributeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspAutoContributeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CspAutoContributeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSettings_settingKey_key" ON "AdminSettings"("settingKey");

-- CreateIndex
CREATE INDEX "BPICalculation_createdAt_idx" ON "BPICalculation"("createdAt");

-- CreateIndex
CREATE INDEX "BPICalculation_userId_idx" ON "BPICalculation"("userId");

-- CreateIndex
CREATE INDEX "BestDeal_dealType_idx" ON "BestDeal"("dealType");

-- CreateIndex
CREATE INDEX "BestDeal_isActive_endDate_idx" ON "BestDeal"("isActive", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BpiMember_userId_key" ON "BpiMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpCategory_slug_key" ON "HelpCategory"("slug");

-- CreateIndex
CREATE INDEX "HelpCategory_isActive_order_idx" ON "HelpCategory"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "HelpTopic_slug_key" ON "HelpTopic"("slug");

-- CreateIndex
CREATE INDEX "HelpTopic_isPublished_updatedAt_idx" ON "HelpTopic"("isPublished", "updatedAt");

-- CreateIndex
CREATE INDEX "HelpTopic_categoryId_idx" ON "HelpTopic"("categoryId");

-- CreateIndex
CREATE INDEX "HelpRevision_topicId_createdAt_idx" ON "HelpRevision"("topicId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HelpBotIntent_name_key" ON "HelpBotIntent"("name");

-- CreateIndex
CREATE INDEX "HelpBotTrainingExample_intentId_idx" ON "HelpBotTrainingExample"("intentId");

-- CreateIndex
CREATE INDEX "BurnEvent_systemWalletId_idx" ON "BurnEvent"("systemWalletId");

-- CreateIndex
CREATE INDEX "BuyBackEvent_systemWalletId_idx" ON "BuyBackEvent"("systemWalletId");

-- CreateIndex
CREATE INDEX "ChannelSubscription_channelId_idx" ON "ChannelSubscription"("channelId");

-- CreateIndex
CREATE INDEX "ChannelSubscription_status_idx" ON "ChannelSubscription"("status");

-- CreateIndex
CREATE INDEX "ChannelSubscription_subscriberId_idx" ON "ChannelSubscription"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelSubscription_subscriberId_channelId_key" ON "ChannelSubscription"("subscriberId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityCategory_slug_key" ON "CommunityCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFeature_slug_key" ON "CommunityFeature"("slug");

-- CreateIndex
CREATE INDEX "CommunityFeature_isActive_displayOrder_idx" ON "CommunityFeature"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "CommunityUpdate_category_idx" ON "CommunityUpdate"("category");

-- CreateIndex
CREATE INDEX "CommunityUpdate_isActive_publishedAt_idx" ON "CommunityUpdate"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "CommunityUpdate_priority_idx" ON "CommunityUpdate"("priority");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_email_key" ON "Contact"("userId", "email");

-- CreateIndex
CREATE INDEX "BPTokenPrice_active_idx" ON "BPTokenPrice"("active");

-- CreateIndex
CREATE INDEX "DealClaim_dealId_idx" ON "DealClaim"("dealId");

-- CreateIndex
CREATE INDEX "DealClaim_userId_idx" ON "DealClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_legacyId_idx" ON "BlogPost"("legacyId");

-- CreateIndex
CREATE INDEX "BlogComment_postId_idx" ON "BlogComment"("postId");

-- CreateIndex
CREATE INDEX "BlogView_postId_idx" ON "BlogView"("postId");

-- CreateIndex
CREATE INDEX "DigitalCrop_farmId_idx" ON "DigitalCrop"("farmId");

-- CreateIndex
CREATE INDEX "DigitalCrop_harvestAt_idx" ON "DigitalCrop"("harvestAt");

-- CreateIndex
CREATE INDEX "DigitalCrop_status_idx" ON "DigitalCrop"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalFarm_userId_key" ON "DigitalFarm"("userId");

-- CreateIndex
CREATE INDEX "DigitalFarm_userId_idx" ON "DigitalFarm"("userId");

-- CreateIndex
CREATE INDEX "EPCPointHistory_createdAt_idx" ON "EPCPointHistory"("createdAt");

-- CreateIndex
CREATE INDEX "EPCPointHistory_epcId_idx" ON "EPCPointHistory"("epcId");

-- CreateIndex
CREATE INDEX "EPCPointHistory_userId_idx" ON "EPCPointHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EPCandEPP_userId_key" ON "EPCandEPP"("userId");

-- CreateIndex
CREATE INDEX "EPCandEPP_currentRank_idx" ON "EPCandEPP"("currentRank");

-- CreateIndex
CREATE INDEX "EPCandEPP_globalRank_idx" ON "EPCandEPP"("globalRank");

-- CreateIndex
CREATE INDEX "EPCandEPP_userId_idx" ON "EPCandEPP"("userId");

-- CreateIndex
CREATE INDEX "EmpowermentTranche_empowermentPackageId_idx" ON "EmpowermentTranche"("empowermentPackageId");

-- CreateIndex
CREATE INDEX "EmpowermentTransaction_empowermentPackageId_idx" ON "EmpowermentTransaction"("empowermentPackageId");

-- CreateIndex
CREATE INDEX "FarmHarvest_farmId_idx" ON "FarmHarvest"("farmId");

-- CreateIndex
CREATE INDEX "FarmHarvest_userId_idx" ON "FarmHarvest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorsPool_source_key" ON "InvestorsPool"("source");

-- CreateIndex
CREATE INDEX "InviteUsage_userId_date_idx" ON "InviteUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InviteUsage_userId_date_key" ON "InviteUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipPool_source_key" ON "LeadershipPool"("source");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipPoolQualification_userId_key" ON "LeadershipPoolQualification"("userId");

-- CreateIndex
CREATE INDEX "LeadershipPoolQualification_isQualified_idx" ON "LeadershipPoolQualification"("isQualified");

-- CreateIndex
CREATE INDEX "LeadershipPoolQualification_userId_idx" ON "LeadershipPoolQualification"("userId");

-- CreateIndex
CREATE INDEX "MaterialDownload_materialId_idx" ON "MaterialDownload"("materialId");

-- CreateIndex
CREATE INDEX "MaterialDownload_userId_idx" ON "MaterialDownload"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPackage_name_key" ON "MembershipPackage"("name");

-- CreateIndex
CREATE INDEX "PalliativeMaturity_dateCompleted_idx" ON "PalliativeMaturity"("dateCompleted");

-- CreateIndex
CREATE INDEX "PalliativeMaturity_status_idx" ON "PalliativeMaturity"("status");

-- CreateIndex
CREATE INDEX "PalliativeMaturity_userId_idx" ON "PalliativeMaturity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PalliativeOption_name_key" ON "PalliativeOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PalliativeOption_slug_key" ON "PalliativeOption"("slug");

-- CreateIndex
CREATE INDEX "PalliativeOption_active_displayOrder_idx" ON "PalliativeOption"("active", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PalliativeTicket_code_key" ON "PalliativeTicket"("code");

-- CreateIndex
CREATE INDEX "PalliativeWalletActivation_activatedAt_idx" ON "PalliativeWalletActivation"("activatedAt");

-- CreateIndex
CREATE INDEX "PalliativeWalletActivation_userId_idx" ON "PalliativeWalletActivation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PromotionalMaterial_isActive_category_idx" ON "PromotionalMaterial"("isActive", "category");

-- CreateIndex
CREATE INDEX "PromotionalMaterial_type_idx" ON "PromotionalMaterial"("type");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralTree_userId_key" ON "ReferralTree"("userId");

-- CreateIndex
CREATE INDEX "RenewalHistory_userId_idx" ON "RenewalHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "ShelterReward_userId_idx" ON "ShelterReward"("userId");

-- CreateIndex
CREATE INDEX "SolarAssessment_assessmentStatus_idx" ON "SolarAssessment"("assessmentStatus");

-- CreateIndex
CREATE INDEX "SolarAssessment_userId_idx" ON "SolarAssessment"("userId");

-- CreateIndex
CREATE INDEX "Product_productType_status_idx" ON "Product"("productType", "status");

-- CreateIndex
CREATE INDEX "Product_pickupCenterId_idx" ON "Product"("pickupCenterId");

-- CreateIndex
CREATE INDEX "Product_rewardCenterId_idx" ON "Product"("rewardCenterId");

-- CreateIndex
CREATE INDEX "Product_vendor_idx" ON "Product"("vendor");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "TokenRate_symbol_effectiveAt_idx" ON "TokenRate"("symbol", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_claimCode_key" ON "Order"("claimCode");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

-- CreateIndex
CREATE INDEX "Order_pickupCenterId_idx" ON "Order"("pickupCenterId");

-- CreateIndex
CREATE INDEX "StoreRewardConfig_isActive_idx" ON "StoreRewardConfig"("isActive");

-- CreateIndex
CREATE INDEX "StoreRewardConfig_productId_isActive_idx" ON "StoreRewardConfig"("productId", "isActive");

-- CreateIndex
CREATE INDEX "StoreRewardLevel_configId_idx" ON "StoreRewardLevel"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreRewardLevel_configId_level_key" ON "StoreRewardLevel"("configId", "level");

-- CreateIndex
CREATE INDEX "StoreReferralRewardLedger_recipientUserId_createdAt_idx" ON "StoreReferralRewardLedger"("recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReferralRewardLedger_orderId_idx" ON "StoreReferralRewardLedger"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreReferralRewardLedger_orderId_recipientUserId_level_key" ON "StoreReferralRewardLedger"("orderId", "recipientUserId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "PickupExperienceRating_orderId_key" ON "PickupExperienceRating"("orderId");

-- CreateIndex
CREATE INDEX "PickupExperienceRating_pickupCenterId_idx" ON "PickupExperienceRating"("pickupCenterId");

-- CreateIndex
CREATE INDEX "PickupExperienceRating_userId_idx" ON "PickupExperienceRating"("userId");

-- CreateIndex
CREATE INDEX "WalletBalance_userId_walletType_symbol_idx" ON "WalletBalance"("userId", "walletType", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "SystemWallet_name_key" ON "SystemWallet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyPlatform_name_key" ON "ThirdPartyPlatform"("name");

-- CreateIndex
CREATE INDEX "ThirdPartyPlatform_isActive_displayOrder_idx" ON "ThirdPartyPlatform"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "ThirdPartyPlatform_defaultAdminUserId_idx" ON "ThirdPartyPlatform"("defaultAdminUserId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_platformId_idx" ON "ThirdPartyRegistration"("platformId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_referredByUserId_idx" ON "ThirdPartyRegistration"("referredByUserId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_userId_idx" ON "ThirdPartyRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyRegistration_userId_platformId_key" ON "ThirdPartyRegistration"("userId", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyExecutiveOverpass_userId_key" ON "ThirdPartyExecutiveOverpass"("userId");

-- CreateIndex
CREATE INDEX "ThirdPartyExecutiveOverpass_expiresAt_idx" ON "ThirdPartyExecutiveOverpass"("expiresAt");

-- CreateIndex
CREATE INDEX "ThirdPartyExecutiveOverpass_grantedAt_idx" ON "ThirdPartyExecutiveOverpass"("grantedAt");

-- CreateIndex
CREATE INDEX "ThirdPartyExecutiveOverpass_revokedAt_idx" ON "ThirdPartyExecutiveOverpass"("revokedAt");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixNode_isActive_idx" ON "ThirdPartyMatrixNode"("isActive");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixNode_leftUserId_idx" ON "ThirdPartyMatrixNode"("leftUserId");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixNode_rightUserId_idx" ON "ThirdPartyMatrixNode"("rightUserId");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixNode_sponsorId_isActive_sequence_idx" ON "ThirdPartyMatrixNode"("sponsorId", "isActive", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyMatrixNode_sponsorId_sequence_key" ON "ThirdPartyMatrixNode"("sponsorId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyMatrixPlacement_userId_key" ON "ThirdPartyMatrixPlacement"("userId");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacement_createdAt_idx" ON "ThirdPartyMatrixPlacement"("createdAt");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacement_leg_idx" ON "ThirdPartyMatrixPlacement"("leg");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacement_nodeId_idx" ON "ThirdPartyMatrixPlacement"("nodeId");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacement_sponsorId_createdAt_idx" ON "ThirdPartyMatrixPlacement"("sponsorId", "createdAt");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacementAudit_createdAt_idx" ON "ThirdPartyMatrixPlacementAudit"("createdAt");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacementAudit_decisionBranch_idx" ON "ThirdPartyMatrixPlacementAudit"("decisionBranch");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacementAudit_sponsorId_createdAt_idx" ON "ThirdPartyMatrixPlacementAudit"("sponsorId", "createdAt");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixPlacementAudit_userId_createdAt_idx" ON "ThirdPartyMatrixPlacementAudit"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyMatrixSponsorState_sponsorId_key" ON "ThirdPartyMatrixSponsorState"("sponsorId");

-- CreateIndex
CREATE INDEX "ThirdPartyMatrixSponsorState_nextPreferredLeg_idx" ON "ThirdPartyMatrixSponsorState"("nextPreferredLeg");

-- CreateIndex
CREATE INDEX "TokenTransaction_transactionType_idx" ON "TokenTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "TokenTransaction_userId_idx" ON "TokenTransaction"("userId");

-- CreateIndex
CREATE INDEX "TrainingCourse_category_idx" ON "TrainingCourse"("category");

-- CreateIndex
CREATE INDEX "TrainingCourse_isActive_displayOrder_idx" ON "TrainingCourse"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "TrainingLesson_courseId_lessonOrder_idx" ON "TrainingLesson"("courseId", "lessonOrder");

-- CreateIndex
CREATE INDEX "TrainingProgress_courseId_idx" ON "TrainingProgress"("courseId");

-- CreateIndex
CREATE INDEX "TrainingProgress_userId_idx" ON "TrainingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgress_userId_courseId_key" ON "TrainingProgress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "UpdateRead_userId_idx" ON "UpdateRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateRead_userId_updateId_key" ON "UpdateRead"("userId", "updateId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- CreateIndex
CREATE INDEX "User_city_id_idx" ON "User"("city_id");

-- CreateIndex
CREATE INDEX "User_state_id_idx" ON "User"("state_id");

-- CreateIndex
CREATE INDEX "User_country_id_idx" ON "User"("country_id");

-- CreateIndex
CREATE INDEX "UserEarning_channelId_idx" ON "UserEarning"("channelId");

-- CreateIndex
CREATE INDEX "UserEarning_isPaid_idx" ON "UserEarning"("isPaid");

-- CreateIndex
CREATE INDEX "UserEarning_type_idx" ON "UserEarning"("type");

-- CreateIndex
CREATE INDEX "UserEarning_userId_idx" ON "UserEarning"("userId");

-- CreateIndex
CREATE INDEX "UserFeatureProgress_featureId_idx" ON "UserFeatureProgress"("featureId");

-- CreateIndex
CREATE INDEX "UserFeatureProgress_isQualified_idx" ON "UserFeatureProgress"("isQualified");

-- CreateIndex
CREATE INDEX "UserFeatureProgress_userId_idx" ON "UserFeatureProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureProgress_userId_featureId_key" ON "UserFeatureProgress"("userId", "featureId");

-- CreateIndex
CREATE INDEX "UserThirdPartyLink_platformId_idx" ON "UserThirdPartyLink"("platformId");

-- CreateIndex
CREATE INDEX "UserThirdPartyLink_userId_idx" ON "UserThirdPartyLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserThirdPartyLink_userId_platformId_key" ON "UserThirdPartyLink"("userId", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeChannel_verificationCode_key" ON "YoutubeChannel"("verificationCode");

-- CreateIndex
CREATE INDEX "YoutubeChannel_isVerified_idx" ON "YoutubeChannel"("isVerified");

-- CreateIndex
CREATE INDEX "YoutubeChannel_status_idx" ON "YoutubeChannel"("status");

-- CreateIndex
CREATE INDEX "YoutubeChannel_userId_idx" ON "YoutubeChannel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlan_name_key" ON "YoutubePlan"("name");

-- CreateIndex
CREATE INDEX "YoutubePlan_isActive_idx" ON "YoutubePlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeProvider_userId_key" ON "YoutubeProvider"("userId");

-- CreateIndex
CREATE INDEX "YoutubeProvider_userId_idx" ON "YoutubeProvider"("userId");

-- CreateIndex
CREATE INDEX "YoutubeProvider_youtubePlanId_idx" ON "YoutubeProvider"("youtubePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_gatewayName_key" ON "PaymentGatewayConfig"("gatewayName");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_isActive_displayOrder_idx" ON "PaymentGatewayConfig"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PendingPayment_userId_idx" ON "PendingPayment"("userId");

-- CreateIndex
CREATE INDEX "PendingPayment_status_idx" ON "PendingPayment"("status");

-- CreateIndex
CREATE INDEX "PendingPayment_createdAt_idx" ON "PendingPayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationSettings_notificationType_key" ON "AdminNotificationSettings"("notificationType");

-- CreateIndex
CREATE INDEX "states_country_id_idx" ON "states"("country_id");

-- CreateIndex
CREATE INDEX "cities_state_id_idx" ON "cities"("state_id");

-- CreateIndex
CREATE INDEX "bank_records_user_id_idx" ON "bank_records"("user_id");

-- CreateIndex
CREATE INDEX "bank_records_bank_id_idx" ON "bank_records"("bank_id");

-- CreateIndex
CREATE INDEX "bank_records_user_id_is_default_idx" ON "bank_records"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "CspSupportRequest_userId_status_idx" ON "CspSupportRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "CspSupportRequest_status_broadcastExpiresAt_idx" ON "CspSupportRequest"("status", "broadcastExpiresAt");

-- CreateIndex
CREATE INDEX "CspSupportRequest_isAdminDefault_isActive_idx" ON "CspSupportRequest"("isAdminDefault", "isActive");

-- CreateIndex
CREATE INDEX "CspSupportRequest_countryCode_status_idx" ON "CspSupportRequest"("countryCode", "status");

-- CreateIndex
CREATE INDEX "CspSupportRequest_tierNumber_idx" ON "CspSupportRequest"("tierNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CspTier_tierNumber_key" ON "CspTier"("tierNumber");

-- CreateIndex
CREATE INDEX "CspTier_isActive_sortOrder_idx" ON "CspTier"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CspMemberStanding_userId_key" ON "CspMemberStanding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CspDonationBadgeCategory_name_key" ON "CspDonationBadgeCategory"("name");

-- CreateIndex
CREATE INDEX "CspDonationBadgeCategory_isActive_sortOrder_idx" ON "CspDonationBadgeCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "CspDonation_donorUserId_status_idx" ON "CspDonation"("donorUserId", "status");

-- CreateIndex
CREATE INDEX "CspTimeReductionBadge_ownerUserId_status_categoryId_idx" ON "CspTimeReductionBadge"("ownerUserId", "status", "categoryId");

-- CreateIndex
CREATE INDEX "CspBadgeTransfer_badgeId_idx" ON "CspBadgeTransfer"("badgeId");

-- CreateIndex
CREATE INDEX "CspRuleChangeLog_ruleKey_createdAt_idx" ON "CspRuleChangeLog"("ruleKey", "createdAt");

-- CreateIndex
CREATE INDEX "CspWaitReductionLog_userId_requestId_idx" ON "CspWaitReductionLog"("userId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "CspWaitReductionLog_userId_requestId_monthKey_key" ON "CspWaitReductionLog"("userId", "requestId", "monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "CspCountry_countryCode_key" ON "CspCountry"("countryCode");

-- CreateIndex
CREATE INDEX "CspCountry_isNationalActive_idx" ON "CspCountry"("isNationalActive");

-- CreateIndex
CREATE INDEX "CspContribution_requestId_idx" ON "CspContribution"("requestId");

-- CreateIndex
CREATE INDEX "CspContribution_contributorId_idx" ON "CspContribution"("contributorId");

-- CreateIndex
CREATE INDEX "CspBroadcastExtension_requestId_idx" ON "CspBroadcastExtension"("requestId");

-- CreateIndex
CREATE INDEX "FarmPlot_userId_idx" ON "FarmPlot"("userId");

-- CreateIndex
CREATE INDEX "FarmPlot_status_idx" ON "FarmPlot"("status");

-- CreateIndex
CREATE INDEX "FarmActivity_plotId_idx" ON "FarmActivity"("plotId");

-- CreateIndex
CREATE UNIQUE INDEX "CropType_name_key" ON "CropType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationToken_token_key" ON "ImpersonationToken"("token");

-- CreateIndex
CREATE INDEX "ImpersonationToken_token_idx" ON "ImpersonationToken"("token");

-- CreateIndex
CREATE INDEX "ImpersonationToken_adminId_idx" ON "ImpersonationToken"("adminId");

-- CreateIndex
CREATE INDEX "ImpersonationToken_targetUserId_idx" ON "ImpersonationToken"("targetUserId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_source_idx" ON "RevenueTransaction"("source");

-- CreateIndex
CREATE INDEX "RevenueTransaction_sourceKey_idx" ON "RevenueTransaction"("sourceKey");

-- CreateIndex
CREATE INDEX "RevenueTransaction_userId_idx" ON "RevenueTransaction"("userId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_allocationStatus_idx" ON "RevenueTransaction"("allocationStatus");

-- CreateIndex
CREATE INDEX "RevenueTransaction_createdAt_idx" ON "RevenueTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_userId_source_createdAt_idx" ON "RevenueTransaction"("userId", "source", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_productId_createdAt_idx" ON "RevenueTransaction"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_orderId_idx" ON "RevenueTransaction"("orderId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_packageId_createdAt_idx" ON "RevenueTransaction"("packageId", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_country_state_createdAt_idx" ON "RevenueTransaction"("country", "state", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_allocationStatus_createdAt_idx" ON "RevenueTransaction"("allocationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueTransaction_sourceId_idx" ON "RevenueTransaction"("sourceId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_profitPoolConfigVersionId_idx" ON "RevenueTransaction"("profitPoolConfigVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueTransaction_source_sourceId_key" ON "RevenueTransaction"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitPoolConfigVersion_version_key" ON "ProfitPoolConfigVersion"("version");

-- CreateIndex
CREATE INDEX "ProfitPoolConfigVersion_isActive_version_idx" ON "ProfitPoolConfigVersion"("isActive", "version");

-- CreateIndex
CREATE INDEX "RevenueAllocation_revenueTransactionId_idx" ON "RevenueAllocation"("revenueTransactionId");

-- CreateIndex
CREATE INDEX "RevenueAllocation_destinationType_idx" ON "RevenueAllocation"("destinationType");

-- CreateIndex
CREATE INDEX "RevenueAllocation_status_idx" ON "RevenueAllocation"("status");

-- CreateIndex
CREATE INDEX "RevenueAllocation_destinationType_status_createdAt_idx" ON "RevenueAllocation"("destinationType", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveShareholder_role_key" ON "ExecutiveShareholder"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveShareholder_userId_key" ON "ExecutiveShareholder"("userId");

-- CreateIndex
CREATE INDEX "ExecutiveShareholder_userId_idx" ON "ExecutiveShareholder"("userId");

-- CreateIndex
CREATE INDEX "ExecutiveShareholder_role_idx" ON "ExecutiveShareholder"("role");

-- CreateIndex
CREATE INDEX "ExecutiveShareholder_isActive_idx" ON "ExecutiveShareholder"("isActive");

-- CreateIndex
CREATE INDEX "ExecutiveDistribution_allocationId_idx" ON "ExecutiveDistribution"("allocationId");

-- CreateIndex
CREATE INDEX "ExecutiveDistribution_shareholderId_idx" ON "ExecutiveDistribution"("shareholderId");

-- CreateIndex
CREATE INDEX "ExecutiveDistribution_status_idx" ON "ExecutiveDistribution"("status");

-- CreateIndex
CREATE INDEX "ExecutiveDistribution_distributedAt_idx" ON "ExecutiveDistribution"("distributedAt");

-- CreateIndex
CREATE INDEX "ExecutiveDistribution_shareholderId_status_distributedAt_idx" ON "ExecutiveDistribution"("shareholderId", "status", "distributedAt");

-- CreateIndex
CREATE INDEX "ExecutiveWalletTransaction_shareholderId_idx" ON "ExecutiveWalletTransaction"("shareholderId");

-- CreateIndex
CREATE INDEX "ExecutiveWalletTransaction_type_idx" ON "ExecutiveWalletTransaction"("type");

-- CreateIndex
CREATE INDEX "ExecutiveWalletTransaction_createdAt_idx" ON "ExecutiveWalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "ExecutiveWalletTransaction_shareholderId_createdAt_idx" ON "ExecutiveWalletTransaction"("shareholderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyPool_type_key" ON "StrategyPool"("type");

-- CreateIndex
CREATE INDEX "StrategyPool_type_idx" ON "StrategyPool"("type");

-- CreateIndex
CREATE INDEX "StrategyPool_isActive_idx" ON "StrategyPool"("isActive");

-- CreateIndex
CREATE INDEX "StrategyPool_distributionFrequency_idx" ON "StrategyPool"("distributionFrequency");

-- CreateIndex
CREATE INDEX "PoolMember_poolId_idx" ON "PoolMember"("poolId");

-- CreateIndex
CREATE INDEX "PoolMember_userId_idx" ON "PoolMember"("userId");

-- CreateIndex
CREATE INDEX "PoolMember_isActive_idx" ON "PoolMember"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PoolMember_poolId_userId_key" ON "PoolMember"("poolId", "userId");

-- CreateIndex
CREATE INDEX "PoolDistribution_allocationId_idx" ON "PoolDistribution"("allocationId");

-- CreateIndex
CREATE INDEX "PoolDistribution_poolId_idx" ON "PoolDistribution"("poolId");

-- CreateIndex
CREATE INDEX "PoolDistribution_status_idx" ON "PoolDistribution"("status");

-- CreateIndex
CREATE INDEX "PoolDistribution_distributedAt_idx" ON "PoolDistribution"("distributedAt");

-- CreateIndex
CREATE INDEX "CompanyReserveTransaction_reserveId_idx" ON "CompanyReserveTransaction"("reserveId");

-- CreateIndex
CREATE INDEX "CompanyReserveTransaction_type_idx" ON "CompanyReserveTransaction"("type");

-- CreateIndex
CREATE INDEX "CompanyReserveTransaction_category_idx" ON "CompanyReserveTransaction"("category");

-- CreateIndex
CREATE INDEX "CompanyReserveTransaction_createdAt_idx" ON "CompanyReserveTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyReserveTransaction_reserveId_type_createdAt_idx" ON "CompanyReserveTransaction"("reserveId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueAdminAction_adminId_idx" ON "RevenueAdminAction"("adminId");

-- CreateIndex
CREATE INDEX "RevenueAdminAction_actionType_idx" ON "RevenueAdminAction"("actionType");

-- CreateIndex
CREATE INDEX "RevenueAdminAction_createdAt_idx" ON "RevenueAdminAction"("createdAt");

-- CreateIndex
CREATE INDEX "PoolAdminAction_poolId_idx" ON "PoolAdminAction"("poolId");

-- CreateIndex
CREATE INDEX "PoolAdminAction_adminId_idx" ON "PoolAdminAction"("adminId");

-- CreateIndex
CREATE INDEX "PoolAdminAction_createdAt_idx" ON "PoolAdminAction"("createdAt");

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
CREATE INDEX "RevenueSnapshot_year_month_idx" ON "RevenueSnapshot"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSnapshot_month_year_key" ON "RevenueSnapshot"("month", "year");

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
CREATE UNIQUE INDEX "EliteClubOperationsFee_contributionId_key" ON "EliteClubOperationsFee"("contributionId");

-- CreateIndex
CREATE INDEX "EliteClubOperationsFee_clubId_idx" ON "EliteClubOperationsFee"("clubId");

-- CreateIndex
CREATE INDEX "EliteClubOperationsFee_memberId_idx" ON "EliteClubOperationsFee"("memberId");

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

-- CreateIndex
CREATE INDEX "KycSubmission_userId_idx" ON "KycSubmission"("userId");

-- CreateIndex
CREATE INDEX "KycSubmission_status_idx" ON "KycSubmission"("status");

-- CreateIndex
CREATE INDEX "KycSubmission_expiresAt_idx" ON "KycSubmission"("expiresAt");

-- CreateIndex
CREATE INDEX "KycSubmission_submittedAt_idx" ON "KycSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "KycAuditLog_submissionId_idx" ON "KycAuditLog"("submissionId");

-- CreateIndex
CREATE INDEX "KycAuditLog_action_idx" ON "KycAuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterCampaign_jobId_key" ON "NewsletterCampaign"("jobId");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_adminId_idx" ON "NewsletterCampaign"("adminId");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_idx" ON "NewsletterCampaign"("status");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_scheduledFor_idx" ON "NewsletterCampaign"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "PromoCampaign_isActive_idx" ON "PromoCampaign"("isActive");

-- CreateIndex
CREATE INDEX "PromoCampaign_createdAt_idx" ON "PromoCampaign"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromoActivationClaim_userId_key" ON "PromoActivationClaim"("userId");

-- CreateIndex
CREATE INDEX "PromoActivationClaim_campaignId_idx" ON "PromoActivationClaim"("campaignId");

-- CreateIndex
CREATE INDEX "PromoActivationClaim_claimedAt_idx" ON "PromoActivationClaim"("claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAutoDebitSetting_userId_key" ON "WalletAutoDebitSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CspAutoContributeSetting_userId_key" ON "CspAutoContributeSetting"("userId");

-- CreateIndex
CREATE INDEX "CspAutoContributeLog_userId_createdAt_idx" ON "CspAutoContributeLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CspAutoContributeLog_requestId_idx" ON "CspAutoContributeLog"("requestId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveShelter" ADD CONSTRAINT "ActiveShelter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BPICalculation" ADD CONSTRAINT "BPICalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BestDeal" ADD CONSTRAINT "BestDeal_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BpiMember" ADD CONSTRAINT "BpiMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpTopic" ADD CONSTRAINT "HelpTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HelpCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRevision" ADD CONSTRAINT "HelpRevision_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "HelpTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpBotTrainingExample" ADD CONSTRAINT "HelpBotTrainingExample_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "HelpBotIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurnEvent" ADD CONSTRAINT "BurnEvent_systemWalletId_fkey" FOREIGN KEY ("systemWalletId") REFERENCES "SystemWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyBackEvent" ADD CONSTRAINT "BuyBackEvent_systemWalletId_fkey" FOREIGN KEY ("systemWalletId") REFERENCES "SystemWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommunityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostReply" ADD CONSTRAINT "CommunityPostReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityUpdate" ADD CONSTRAINT "CommunityUpdate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealClaim" ADD CONSTRAINT "DealClaim_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "BestDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealClaim" ADD CONSTRAINT "DealClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogView" ADD CONSTRAINT "BlogView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogView" ADD CONSTRAINT "BlogView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalCrop" ADD CONSTRAINT "DigitalCrop_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "DigitalFarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalFarm" ADD CONSTRAINT "DigitalFarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EPCPointHistory" ADD CONSTRAINT "EPCPointHistory_epcId_fkey" FOREIGN KEY ("epcId") REFERENCES "EPCandEPP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EPCPointHistory" ADD CONSTRAINT "EPCPointHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EPCandEPP" ADD CONSTRAINT "EPCandEPP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpowermentPackage" ADD CONSTRAINT "EmpowermentPackage_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpowermentPackage" ADD CONSTRAINT "EmpowermentPackage_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpowermentTranche" ADD CONSTRAINT "EmpowermentTranche_empowermentPackageId_fkey" FOREIGN KEY ("empowermentPackageId") REFERENCES "EmpowermentPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpowermentTransaction" ADD CONSTRAINT "EmpowermentTransaction_empowermentPackageId_fkey" FOREIGN KEY ("empowermentPackageId") REFERENCES "EmpowermentPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmHarvest" ADD CONSTRAINT "FarmHarvest_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "DigitalFarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmHarvest" ADD CONSTRAINT "FarmHarvest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingHistory" ADD CONSTRAINT "FundingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteUsage" ADD CONSTRAINT "InviteUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipPoolQualification" ADD CONSTRAINT "LeadershipPoolQualification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "PromotionalMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageActivation" ADD CONSTRAINT "PackageActivation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PalliativePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageActivation" ADD CONSTRAINT "PackageActivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeMaturity" ADD CONSTRAINT "PalliativeMaturity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "PartnerOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeWalletActivation" ADD CONSTRAINT "PalliativeWalletActivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOffer" ADD CONSTRAINT "PartnerOffer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalMaterial" ADD CONSTRAINT "PromotionalMaterial_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralTree" ADD CONSTRAINT "ReferralTree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalHistory" ADD CONSTRAINT "RenewalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelterReward" ADD CONSTRAINT "ShelterReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarAssessment" ADD CONSTRAINT "SolarAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_rewardConfigId_fkey" FOREIGN KEY ("rewardConfigId") REFERENCES "RewardConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "PickupCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_rewardCenterId_fkey" FOREIGN KEY ("rewardCenterId") REFERENCES "RewardCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "PickupCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_rewardCenterId_fkey" FOREIGN KEY ("rewardCenterId") REFERENCES "RewardCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreRewardConfig" ADD CONSTRAINT "StoreRewardConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreRewardLevel" ADD CONSTRAINT "StoreRewardLevel_configId_fkey" FOREIGN KEY ("configId") REFERENCES "StoreRewardConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReferralRewardLedger" ADD CONSTRAINT "StoreReferralRewardLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReferralRewardLedger" ADD CONSTRAINT "StoreReferralRewardLedger_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReferralRewardLedger" ADD CONSTRAINT "StoreReferralRewardLedger_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupExperienceRating" ADD CONSTRAINT "PickupExperienceRating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupExperienceRating" ADD CONSTRAINT "PickupExperienceRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupExperienceRating" ADD CONSTRAINT "PickupExperienceRating_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "PickupCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletBalance" ADD CONSTRAINT "WalletBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyPlatform" ADD CONSTRAINT "ThirdPartyPlatform_defaultAdminUserId_fkey" FOREIGN KEY ("defaultAdminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "ThirdPartyPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyExecutiveOverpass" ADD CONSTRAINT "ThirdPartyExecutiveOverpass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyExecutiveOverpass" ADD CONSTRAINT "ThirdPartyExecutiveOverpass_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyExecutiveOverpass" ADD CONSTRAINT "ThirdPartyExecutiveOverpass_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixNode" ADD CONSTRAINT "ThirdPartyMatrixNode_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixNode" ADD CONSTRAINT "ThirdPartyMatrixNode_leftUserId_fkey" FOREIGN KEY ("leftUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixNode" ADD CONSTRAINT "ThirdPartyMatrixNode_rightUserId_fkey" FOREIGN KEY ("rightUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixPlacement" ADD CONSTRAINT "ThirdPartyMatrixPlacement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixPlacement" ADD CONSTRAINT "ThirdPartyMatrixPlacement_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixPlacement" ADD CONSTRAINT "ThirdPartyMatrixPlacement_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "ThirdPartyMatrixNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixPlacementAudit" ADD CONSTRAINT "ThirdPartyMatrixPlacementAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixPlacementAudit" ADD CONSTRAINT "ThirdPartyMatrixPlacementAudit_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixPlacementAudit" ADD CONSTRAINT "ThirdPartyMatrixPlacementAudit_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "ThirdPartyMatrixNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyMatrixSponsorState" ADD CONSTRAINT "ThirdPartyMatrixSponsorState_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCourse" ADD CONSTRAINT "TrainingCourse_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLesson" ADD CONSTRAINT "TrainingLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRead" ADD CONSTRAINT "UpdateRead_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "CommunityUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRead" ADD CONSTRAINT "UpdateRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEarning" ADD CONSTRAINT "UserEarning_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEarning" ADD CONSTRAINT "UserEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureProgress" ADD CONSTRAINT "UserFeatureProgress_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "CommunityFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureProgress" ADD CONSTRAINT "UserFeatureProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserThirdPartyLink" ADD CONSTRAINT "UserThirdPartyLink_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "ThirdPartyPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserThirdPartyLink" ADD CONSTRAINT "UserThirdPartyLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalHistory" ADD CONSTRAINT "WithdrawalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeChannel" ADD CONSTRAINT "YoutubeChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeProvider" ADD CONSTRAINT "YoutubeProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeProvider" ADD CONSTRAINT "YoutubeProvider_youtubePlanId_fkey" FOREIGN KEY ("youtubePlanId") REFERENCES "YoutubePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPayment" ADD CONSTRAINT "PendingPayment_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPayment" ADD CONSTRAINT "PendingPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_records" ADD CONSTRAINT "bank_records_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "nigerian_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_records" ADD CONSTRAINT "bank_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspSupportRequest" ADD CONSTRAINT "CspSupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspMemberStanding" ADD CONSTRAINT "CspMemberStanding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspDonation" ADD CONSTRAINT "CspDonation_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspTimeReductionBadge" ADD CONSTRAINT "CspTimeReductionBadge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CspDonationBadgeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspTimeReductionBadge" ADD CONSTRAINT "CspTimeReductionBadge_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspBadgeTransfer" ADD CONSTRAINT "CspBadgeTransfer_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "CspTimeReductionBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspBadgeTransfer" ADD CONSTRAINT "CspBadgeTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspBadgeTransfer" ADD CONSTRAINT "CspBadgeTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspRuleChangeLog" ADD CONSTRAINT "CspRuleChangeLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspWaitReductionLog" ADD CONSTRAINT "CspWaitReductionLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspWaitReductionLog" ADD CONSTRAINT "CspWaitReductionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspContribution" ADD CONSTRAINT "CspContribution_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspContribution" ADD CONSTRAINT "CspContribution_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspBroadcastExtension" ADD CONSTRAINT "CspBroadcastExtension_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmPlot" ADD CONSTRAINT "FarmPlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmActivity" ADD CONSTRAINT "FarmActivity_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "FarmPlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationToken" ADD CONSTRAINT "ImpersonationToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationToken" ADD CONSTRAINT "ImpersonationToken_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_profitPoolConfigVersionId_fkey" FOREIGN KEY ("profitPoolConfigVersionId") REFERENCES "ProfitPoolConfigVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAllocation" ADD CONSTRAINT "RevenueAllocation_revenueTransactionId_fkey" FOREIGN KEY ("revenueTransactionId") REFERENCES "RevenueTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveShareholder" ADD CONSTRAINT "ExecutiveShareholder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveShareholder" ADD CONSTRAINT "ExecutiveShareholder_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveDistribution" ADD CONSTRAINT "ExecutiveDistribution_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "RevenueAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveDistribution" ADD CONSTRAINT "ExecutiveDistribution_shareholderId_fkey" FOREIGN KEY ("shareholderId") REFERENCES "ExecutiveShareholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveWalletTransaction" ADD CONSTRAINT "ExecutiveWalletTransaction_shareholderId_fkey" FOREIGN KEY ("shareholderId") REFERENCES "ExecutiveShareholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveWalletTransaction" ADD CONSTRAINT "ExecutiveWalletTransaction_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "ExecutiveDistribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "StrategyPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolDistribution" ADD CONSTRAINT "PoolDistribution_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "RevenueAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolDistribution" ADD CONSTRAINT "PoolDistribution_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "StrategyPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolDistribution" ADD CONSTRAINT "PoolDistribution_distributedBy_fkey" FOREIGN KEY ("distributedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReserveTransaction" ADD CONSTRAINT "CompanyReserveTransaction_reserveId_fkey" FOREIGN KEY ("reserveId") REFERENCES "CompanyReserve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReserveTransaction" ADD CONSTRAINT "CompanyReserveTransaction_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAdminAction" ADD CONSTRAINT "RevenueAdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAdminAction" ADD CONSTRAINT "RevenueAdminAction_revenueTransactionId_fkey" FOREIGN KEY ("revenueTransactionId") REFERENCES "RevenueTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAdminAction" ADD CONSTRAINT "PoolAdminAction_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "StrategyPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAdminAction" ADD CONSTRAINT "PoolAdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "EliteClubOperationsFee" ADD CONSTRAINT "EliteClubOperationsFee_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubOperationsFee" ADD CONSTRAINT "EliteClubOperationsFee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubOperationsFee" ADD CONSTRAINT "EliteClubOperationsFee_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "EliteClubContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycAuditLog" ADD CONSTRAINT "KycAuditLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "KycSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoActivationClaim" ADD CONSTRAINT "PromoActivationClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoActivationClaim" ADD CONSTRAINT "PromoActivationClaim_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PromoCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAutoDebitSetting" ADD CONSTRAINT "WalletAutoDebitSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspAutoContributeSetting" ADD CONSTRAINT "CspAutoContributeSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspAutoContributeLog" ADD CONSTRAINT "CspAutoContributeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspAutoContributeLog" ADD CONSTRAINT "CspAutoContributeLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

