-- Add logoUrl to pickup centers
ALTER TABLE "PickupCenter" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
