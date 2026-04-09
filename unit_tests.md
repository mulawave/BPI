# Unit Test Checklist — Pre-Push Verification

**Commit:** `ba34261e` — *feat: admin access fixes, backup/restore rewrite, payment & UI improvements*
**Date:** April 9, 2026
**Tester:** _______________
**Environment:** ☐ Local Dev ☐ Staging ☐ Production

> Mark each Suit item: ✅ Pass | ❌ Fail | ⏭️ Skipped | 🔶 Canceled

---


▶ Rank hierarchy

▶ Minimum rank check

▶ Material access filtering

▶ Leadership pool qualification

▶ isAdmin

▶ isSuperAdmin

▶ requireAdmin

▶ requireSuperAdmin

▶ getUserRole

▶ Empowerment: Tax calculations

▶ Empowerment: Maturity date calculation

▶ Empowerment: Idempotency window

▶ Empowerment: Type enumeration

▶ Geo-based gateway selection

▶ Rate limiter: sliding window logic

▶ Cron endpoint authorization
  ▶ success cases
 
  ▶ fail-closed: missing CRON_SECRET
  
  ▶ invalid tokens
   
▶ Upload route validation
  ▶ role enforcement
   
  ▶ folder allowlist
   
  ▶ file type validation
 
  ▶ file size limit
 
▶ KYC status values
 
▶ KYC document types

▶ BVN validation

▶ NIN validation

▶ age verification

▶ document expiry detection

▶ KYC status transitions

▶ KYC file upload validation

▶ KYC file size validation

▶ KYC gender values

▶ proof of address types
 
▶ Wallet deduction validation

▶ Referral commission chain

▶ VAT calculation

▶ Package activation validation

▶ Package upgrade validation

▶ Empowerment maturity calculation

▶ PaymentGateway enum

▶ PaymentStatus enum

▶ PaymentPurpose enum

▶ PaymentGatewayFactory logic

▶ Store: normalizePercent

▶ Store: clampNumber

▶ Store: normalizeRewardPercent

▶ Store: Profit calculation

▶ Store: Token payment math

▶ Store: Hybrid min-token enforcement

▶ Store: Claim code validation

▶ Store: Reward payout calculation

▶ Store: Referral chain resolution

▶ Paystack webhook signature verification

▶ Flutterwave webhook signature verification

▶ Payment amount verification

▶ Pending payment state machine

  ▶ idempotency: duplicate webhook handling

▶ YouTube: Plan cost calculation

▶ YouTube: Available funds check
 
▶ YouTube: Subscription earnings

▶ YouTube: Plan upgrade cost

▶ YouTube: Upgrade eligibility

▶ YouTube: Additional slots from upgrade

▶ YouTube: Provider slot stats

▶ YouTube: Earnings aggregation

▶ YouTube: Admin role guard

▶ YouTube: Display name formatting


Expected Results:

ℹ Total tests
ℹ Total suites 
ℹ Total pass 
ℹ Total fail 
ℹ Total cancelled (Reason for cancelling if any)
ℹ Total skipped (Reason for skipping if any)
ℹ Total todo 
ℹ Total duration_ms