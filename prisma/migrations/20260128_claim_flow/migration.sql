-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('NOT_READY', 'CODE_ISSUED', 'VERIFIED', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "claimCode" TEXT,
ADD COLUMN     "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'NOT_READY',
ADD COLUMN     "feedbackInvitationSentAt" TIMESTAMP(3),
ADD COLUMN     "feedbackSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "pickupCompletionConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pickupCompletionConfirmedBy" TEXT,
ADD COLUMN     "pickupVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "pickupVerifiedBy" TEXT;

-- AlterTable
ALTER TABLE "PickupCenter" ADD COLUMN     "contactEmail" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

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

-- CreateIndex
CREATE UNIQUE INDEX "PickupExperienceRating_orderId_key" ON "PickupExperienceRating"("orderId");

-- CreateIndex
CREATE INDEX "PickupExperienceRating_pickupCenterId_idx" ON "PickupExperienceRating"("pickupCenterId");

-- CreateIndex
CREATE INDEX "PickupExperienceRating_userId_idx" ON "PickupExperienceRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_claimCode_key" ON "Order"("claimCode");

-- AddForeignKey
ALTER TABLE "PickupExperienceRating" ADD CONSTRAINT "PickupExperienceRating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupExperienceRating" ADD CONSTRAINT "PickupExperienceRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupExperienceRating" ADD CONSTRAINT "PickupExperienceRating_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "PickupCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
