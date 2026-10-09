--
-- Membership grace anchor (corporate decision, follow-up Q8c, 06/10/2026):
-- on this release, every member already expired gets a fresh 15-day access
-- grace and 7-day commission grace counted from the release date rather than
-- their original expiry date. This column, when set, overrides
-- membershipExpiresAt as the base for grace-period counting only; renewal
-- logic keeps using membershipExpiresAt as before. Backfilled once by
-- scripts/resetGraceForExpiredMembers.ts.
--

-- AlterTable
ALTER TABLE "User" ADD COLUMN "membershipGraceAnchorAt" TIMESTAMP(3);
