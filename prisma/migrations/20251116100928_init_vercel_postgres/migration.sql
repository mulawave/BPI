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
    "legacyId" INTEGER,
    "referredBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
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
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeChannel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subscribers" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YoutubeChannel_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CommunityCategory" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryIcon" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "reply" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BpiMember_userId_key" ON "BpiMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PalliativeTicket_code_key" ON "PalliativeTicket"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipPool_source_key" ON "LeadershipPool"("source");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralTree_userId_key" ON "ReferralTree"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorsPool_source_key" ON "InvestorsPool"("source");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityCategory_slug_key" ON "CommunityCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BpiMember" ADD CONSTRAINT "BpiMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageActivation" ADD CONSTRAINT "PackageActivation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PalliativePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageActivation" ADD CONSTRAINT "PackageActivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_member_fkey" FOREIGN KEY ("userId") REFERENCES "BpiMember"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "PartnerOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeTicket" ADD CONSTRAINT "PalliativeTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOffer" ADD CONSTRAINT "PartnerOffer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeChannel" ADD CONSTRAINT "YoutubeChannel_member_fkey" FOREIGN KEY ("userId") REFERENCES "BpiMember"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeChannel" ADD CONSTRAINT "YoutubeChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_member_fkey" FOREIGN KEY ("userId") REFERENCES "BpiMember"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralTree" ADD CONSTRAINT "ReferralTree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveShelter" ADD CONSTRAINT "ActiveShelter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalHistory" ADD CONSTRAINT "WithdrawalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingHistory" ADD CONSTRAINT "FundingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommunityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostReply" ADD CONSTRAINT "CommunityPostReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
