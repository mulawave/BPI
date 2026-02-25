-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EliteClubCredEventType" ADD VALUE 'OPT_OUT';
ALTER TYPE "EliteClubCredEventType" ADD VALUE 'PAYOUT_RECEIVED';

-- AlterTable
ALTER TABLE "EliteClub" ADD COLUMN     "formationStatus" "EliteClubFormationStatus" NOT NULL DEFAULT 'OPEN';
