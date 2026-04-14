-- AlterTable: Add metadata column to Transaction for USDT withdrawal details
ALTER TABLE "Transaction" ADD COLUMN "metadata" TEXT;
