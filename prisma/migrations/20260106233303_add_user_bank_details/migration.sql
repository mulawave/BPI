/*
  Warnings:

  - You are about to drop the column `autoApprovalThreshold` on the `AdminSettings` table. All the data in the column will be lost.
  - You are about to drop the column `bptWithdrawalFee` on the `AdminSettings` table. All the data in the column will be lost.
  - You are about to drop the column `cashWithdrawalFee` on the `AdminSettings` table. All the data in the column will be lost.
  - You are about to drop the column `maxSingleTransferAmount` on the `AdminSettings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `AdminSettings` table. All the data in the column will be lost.
  - You are about to drop the column `vatRate` on the `AdminSettings` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `YoutubeChannel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[settingKey]` on the table `AdminSettings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationCode]` on the table `YoutubeChannel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `settingKey` to the `AdminSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settingValue` to the `AdminSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `YoutubeChannel` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_member_fkey";

-- DropForeignKey
ALTER TABLE "YoutubeChannel" DROP CONSTRAINT "YoutubeChannel_member_fkey";

-- CreateTable (AdminSettings doesn't exist, creating fresh)
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "walletType" TEXT NOT NULL DEFAULT 'main';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bnbWalletAddress" TEXT,
ADD COLUMN     "myngulActivationPin" TEXT,
ADD COLUMN     "palliativeActivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "palliativeActivatedAt" TIMESTAMP(3),
ADD COLUMN     "palliativeTier" TEXT,
ADD COLUMN     "selectedPalliative" TEXT,
ADD COLUMN     "socialMedia" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "YoutubeChannel" DROP COLUMN "verified",
ADD COLUMN     "channelLink" TEXT,
ADD COLUMN     "channelLogo" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verificationCode" TEXT,
ALTER COLUMN "channelName" DROP NOT NULL,
ALTER COLUMN "channelUrl" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

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
CREATE INDEX "ChannelSubscription_subscriberId_idx" ON "ChannelSubscription"("subscriberId");

-- CreateIndex
CREATE INDEX "ChannelSubscription_channelId_idx" ON "ChannelSubscription"("channelId");

-- CreateIndex
CREATE INDEX "ChannelSubscription_status_idx" ON "ChannelSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelSubscription_subscriberId_channelId_key" ON "ChannelSubscription"("subscriberId", "channelId");

-- CreateIndex
CREATE INDEX "UserEarning_userId_idx" ON "UserEarning"("userId");

-- CreateIndex
CREATE INDEX "UserEarning_channelId_idx" ON "UserEarning"("channelId");

-- CreateIndex
CREATE INDEX "UserEarning_isPaid_idx" ON "UserEarning"("isPaid");

-- CreateIndex
CREATE INDEX "UserEarning_type_idx" ON "UserEarning"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PalliativeOption_name_key" ON "PalliativeOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PalliativeOption_slug_key" ON "PalliativeOption"("slug");

-- CreateIndex
CREATE INDEX "PalliativeOption_active_displayOrder_idx" ON "PalliativeOption"("active", "displayOrder");

-- CreateIndex
CREATE INDEX "PalliativeWalletActivation_userId_idx" ON "PalliativeWalletActivation"("userId");

-- CreateIndex
CREATE INDEX "PalliativeWalletActivation_activatedAt_idx" ON "PalliativeWalletActivation"("activatedAt");

-- CreateIndex
CREATE INDEX "PalliativeMaturity_userId_idx" ON "PalliativeMaturity"("userId");

-- CreateIndex
CREATE INDEX "PalliativeMaturity_status_idx" ON "PalliativeMaturity"("status");

-- CreateIndex
CREATE INDEX "PalliativeMaturity_dateCompleted_idx" ON "PalliativeMaturity"("dateCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyPlatform_name_key" ON "ThirdPartyPlatform"("name");

-- CreateIndex
CREATE INDEX "ThirdPartyPlatform_isActive_displayOrder_idx" ON "ThirdPartyPlatform"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_userId_idx" ON "ThirdPartyRegistration"("userId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_platformId_idx" ON "ThirdPartyRegistration"("platformId");

-- CreateIndex
CREATE INDEX "ThirdPartyRegistration_referredByUserId_idx" ON "ThirdPartyRegistration"("referredByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyRegistration_userId_platformId_key" ON "ThirdPartyRegistration"("userId", "platformId");

-- CreateIndex
CREATE INDEX "UserThirdPartyLink_userId_idx" ON "UserThirdPartyLink"("userId");

-- CreateIndex
CREATE INDEX "UserThirdPartyLink_platformId_idx" ON "UserThirdPartyLink"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "UserThirdPartyLink_userId_platformId_key" ON "UserThirdPartyLink"("userId", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSettings_settingKey_key" ON "AdminSettings"("settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeChannel_verificationCode_key" ON "YoutubeChannel"("verificationCode");

-- CreateIndex
CREATE INDEX "YoutubeChannel_userId_idx" ON "YoutubeChannel"("userId");

-- CreateIndex
CREATE INDEX "YoutubeChannel_status_idx" ON "YoutubeChannel"("status");

-- CreateIndex
CREATE INDEX "YoutubeChannel_isVerified_idx" ON "YoutubeChannel"("isVerified");

-- AddForeignKey
ALTER TABLE "YoutubeProvider" ADD CONSTRAINT "YoutubeProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeProvider" ADD CONSTRAINT "YoutubeProvider_youtubePlanId_fkey" FOREIGN KEY ("youtubePlanId") REFERENCES "YoutubePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEarning" ADD CONSTRAINT "UserEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEarning" ADD CONSTRAINT "UserEarning_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeWalletActivation" ADD CONSTRAINT "PalliativeWalletActivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalliativeMaturity" ADD CONSTRAINT "PalliativeMaturity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "ThirdPartyPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyRegistration" ADD CONSTRAINT "ThirdPartyRegistration_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserThirdPartyLink" ADD CONSTRAINT "UserThirdPartyLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserThirdPartyLink" ADD CONSTRAINT "UserThirdPartyLink_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "ThirdPartyPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
