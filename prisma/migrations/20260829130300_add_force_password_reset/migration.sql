--
-- Add forcePasswordReset flag to User for admin-forced password reset flow
--

-- AlterTable
ALTER TABLE "User" ADD COLUMN "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false;
