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

    CONSTRAINT "CurrencyManagement_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "EmpowermentPackage_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "DealClaim_dealId_idx" ON "DealClaim"("dealId");

-- CreateIndex
CREATE INDEX "DealClaim_userId_idx" ON "DealClaim"("userId");

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
CREATE UNIQUE INDEX "SystemWallet_name_key" ON "SystemWallet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyPlatform_name_key" ON "ThirdPartyPlatform"("name");

-- CreateIndex
CREATE INDEX "ThirdPartyPlatform_isActive_displayOrder_idx" ON "ThirdPartyPlatform"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_platformId_idx" ON "ThirdPartyRegistration"("platformId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_referredByUserId_idx" ON "ThirdPartyRegistration"("referredByUserId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_userId_idx" ON "ThirdPartyRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyRegistration_userId_platformId_key" ON "ThirdPartyRegistration"("userId", "platformId");

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
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "ThirdPartyPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

