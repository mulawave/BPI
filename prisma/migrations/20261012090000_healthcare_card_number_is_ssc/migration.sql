-- Corporate decision (12/10/2026): the Healthcare Card number is the
-- member's SSC (User.ssc). There is only one number, so drop the card's
-- separate code.
DROP INDEX IF EXISTS "HealthcareCard_sscCode_key";
ALTER TABLE "HealthcareCard" DROP COLUMN IF EXISTS "sscCode";
