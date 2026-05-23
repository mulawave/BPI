ALTER TABLE "ThirdPartyMatrixSettings"
  ADD COLUMN IF NOT EXISTS "registrationUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "adminDefaultLink" TEXT;