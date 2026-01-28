-- Ensure pickup centers table exists before adding logoUrl
CREATE TABLE IF NOT EXISTS "PickupCenter" (
	"id" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"addressLine1" TEXT NOT NULL,
	"addressLine2" TEXT,
	"city" TEXT NOT NULL,
	"state" TEXT NOT NULL,
	"country" TEXT NOT NULL,
	"contactName" TEXT,
	"contactPhone" TEXT,
	"isActive" BOOLEAN NOT NULL DEFAULT true,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "PickupCenter_pkey" PRIMARY KEY ("id")
);

-- Add logoUrl to pickup centers
ALTER TABLE "PickupCenter" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
