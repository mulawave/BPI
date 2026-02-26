-- AlterEnum
-- Runs outside transaction to satisfy PostgreSQL restriction on
-- ALTER TYPE ... ADD VALUE inside a transaction block (error 25001).
COMMIT;
ALTER TYPE "EliteClubCredEventType" ADD VALUE IF NOT EXISTS 'OPT_OUT';
ALTER TYPE "EliteClubCredEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_RECEIVED';
BEGIN;

-- AlterTable
ALTER TABLE "EliteClub" ADD COLUMN     "formationStatus" "EliteClubFormationStatus" NOT NULL DEFAULT 'OPEN';
