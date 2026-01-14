-- Manual Migration: Remove duplicate palliativeWallet column
-- This migration consolidates all palliative wallet data into the original 'palliative' column
-- and removes the duplicate 'palliativeWallet' column

-- Step 1: Merge any data from palliativeWallet into palliative (in case there's any)
UPDATE "User"
SET "palliative" = "palliative" + "palliativeWallet"
WHERE "palliativeWallet" > 0;

-- Step 2: Drop the duplicate column
ALTER TABLE "User" DROP COLUMN IF EXISTS "palliativeWallet";

-- Step 3: Add comment to palliative column for clarity
COMMENT ON COLUMN "User"."palliative" IS 'Palliative wallet balance - pooling wallet for lower-tier members, serves as the single source of truth for palliative system';
