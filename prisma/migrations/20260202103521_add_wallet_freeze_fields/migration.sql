-- Add wallet freeze fields to User table
ALTER TABLE "User" ADD COLUMN "walletFrozen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "walletFrozenAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "walletFrozenBy" TEXT;
ALTER TABLE "User" ADD COLUMN "walletFrozenReason" TEXT;

-- Add index for frozen wallet queries
CREATE INDEX "User_walletFrozen_idx" ON "User"("walletFrozen");
