--
-- Renewal Reserve wallet (corporate decision, follow-up Q5-Q7, 06/10/2026):
-- a second balance on User, fed by a share of Auto-Debit on referral
-- commissions and the CSP sponsor share, used to pay membership renewals
-- before the Main Wallet. Members may only move the amount above the
-- admin-set floor (default ₦500,000) back to the Main Wallet.
--

-- AlterTable
ALTER TABLE "User" ADD COLUMN "reserve" DOUBLE PRECISION NOT NULL DEFAULT 0;
