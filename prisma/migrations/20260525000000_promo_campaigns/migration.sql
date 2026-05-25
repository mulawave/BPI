-- Promo Campaign System
-- Revenue-isolated free membership activations

CREATE TABLE IF NOT EXISTS `PromoCampaign` (
    `id`               VARCHAR(191) NOT NULL,
    `name`             VARCHAR(191) NOT NULL,
    `type`             ENUM('FREE_MEMBERSHIP_ACTIVATION') NOT NULL DEFAULT 'FREE_MEMBERSHIP_ACTIVATION',
    `quota`            INT NOT NULL,
    `usedCount`        INT NOT NULL DEFAULT 0,
    `isActive`         BOOLEAN NOT NULL DEFAULT false,
    `targetPackageId`  VARCHAR(191) NULL,
    `startDate`        DATETIME(3) NULL,
    `endDate`          DATETIME(3) NULL,
    `notes`            VARCHAR(191) NULL,
    `createdByAdminId` VARCHAR(191) NULL,
    `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`        DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `PromoCampaign_isActive_idx` (`isActive`),
    INDEX `PromoCampaign_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PromoActivationClaim` (
    `id`         VARCHAR(191) NOT NULL,
    `userId`     VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `packageId`  VARCHAR(191) NOT NULL,
    `claimedAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `PromoActivationClaim_userId_key` (`userId`),
    INDEX `PromoActivationClaim_campaignId_idx` (`campaignId`),
    INDEX `PromoActivationClaim_claimedAt_idx` (`claimedAt`),
    CONSTRAINT `PromoActivationClaim_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `PromoActivationClaim_campaignId_fkey`
        FOREIGN KEY (`campaignId`) REFERENCES `PromoCampaign` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
