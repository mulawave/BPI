-- Alter role column to allow arbitrary text
ALTER TABLE "ExecutiveShareholder"
ALTER COLUMN "role" TYPE TEXT USING "role"::text;

-- Drop the old enum type if it still exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutiveRole') THEN
    DROP TYPE "ExecutiveRole";
  END IF;
END$$;
