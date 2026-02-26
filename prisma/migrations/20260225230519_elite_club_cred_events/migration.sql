-- AlterEnum
-- Uses direct pg_enum insert to avoid error 25001
-- (ALTER TYPE ADD VALUE cannot run inside a transaction block)
INSERT INTO pg_enum (enumtypid, enumlabel, enumsortorder)
SELECT 'EliteClubCredEventType'::regtype::oid, 'OPT_OUT',
  (SELECT MAX(enumsortorder) + 1 FROM pg_enum WHERE enumtypid = 'EliteClubCredEventType'::regtype::oid)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_enum WHERE enumtypid = 'EliteClubCredEventType'::regtype::oid AND enumlabel = 'OPT_OUT'
);
INSERT INTO pg_enum (enumtypid, enumlabel, enumsortorder)
SELECT 'EliteClubCredEventType'::regtype::oid, 'PAYOUT_RECEIVED',
  (SELECT MAX(enumsortorder) + 1 FROM pg_enum WHERE enumtypid = 'EliteClubCredEventType'::regtype::oid)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_enum WHERE enumtypid = 'EliteClubCredEventType'::regtype::oid AND enumlabel = 'PAYOUT_RECEIVED'
);

-- AlterTable
ALTER TABLE "EliteClub" ADD COLUMN     "formationStatus" "EliteClubFormationStatus" NOT NULL DEFAULT 'OPEN';
