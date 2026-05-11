ALTER TABLE "NewsletterCampaign"
  ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "embeddedImages" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "NewsletterCampaign_status_scheduledFor_idx"
  ON "NewsletterCampaign"("status", "scheduledFor");