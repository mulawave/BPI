-- Pool relief: speed up referral chain lookups under burst traffic
CREATE INDEX IF NOT EXISTS "Referral_referredId_idx" ON "Referral"("referredId");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
