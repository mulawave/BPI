ALTER TABLE "ThirdPartyPlatform"
  ADD COLUMN IF NOT EXISTS "defaultAdminUserId" TEXT;

CREATE INDEX IF NOT EXISTS "ThirdPartyPlatform_defaultAdminUserId_idx"
  ON "ThirdPartyPlatform"("defaultAdminUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyPlatform_defaultAdminUserId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyPlatform"
      ADD CONSTRAINT "ThirdPartyPlatform_defaultAdminUserId_fkey"
      FOREIGN KEY ("defaultAdminUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
