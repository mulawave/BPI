-- AlterTable: Add USDT wallet address and withdrawal ban metadata to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usdtAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "withdrawBanAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "withdrawBanBy" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "withdrawBanReason" TEXT;
