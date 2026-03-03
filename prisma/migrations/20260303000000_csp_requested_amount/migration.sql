-- AlterTable: add requestedAmount column to CspSupportRequest
ALTER TABLE "CspSupportRequest" ADD COLUMN IF NOT EXISTS "requestedAmount" INTEGER;
