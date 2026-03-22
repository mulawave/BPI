# BPI Staging QA — Test Checkoff Sheet

**Project:** BPI Platform v3  
**Date:** March 22, 2026  
**Environment:** Staging Server  
**Purpose:** Validate all recent changes before production deployment  
**Testers:** ______________________  

---

## Instructions

- Test each item on the staging server.
- Mark **✅ PASS**, **❌ FAIL**, or **⏭️ SKIP** (with reason).
- Record any issues in the **Notes** column.
- All **FAIL** items must be resolved before production push.
- Use **two browser profiles** (one admin, one regular user) for multi-role tests.

---

## Pre-Test Setup

| # | Setup Task | Done? | Notes |
|---|-----------|-------|-------|
| S1 | Confirm staging URL is accessible and loads without error | ☐ | |
| S2 | Confirm you have a **super_admin** account on staging | ☐ | |
| S3 | Confirm you have a **regular user** (non-activated) test account | ☐ | |
| S4 | Confirm you have a **second user** test account (to act as referrer) | ☐ | |
| S5 | Go to `/admin/currency` → confirm a BPT price is set and active (e.g. ₦5/BPT) | ☐ | Record current price: ₦____ |
| S6 | Confirm at least one membership package exists in `/admin/packages` | ☐ | |
| S7 | Run the BPT migration endpoint (see Section 9) if existing data needs conversion | ☐ | |

---

## 1. Registration & Referral Link (Phase 3)

### 1A — Registration Without Referral

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 1A.1 | Navigate to `/register` (no `?ref=` param) | Registration page loads. "Invited by" shows "Administrator" or default | ☐ | |
| 1A.2 | Fill all required fields: firstname, lastname, screenname, gender, email, password, confirm password | All fields accept input. No validation errors on valid data | ☐ | |
| 1A.3 | Solve the math captcha (e.g. "What is 3 + 7?" → enter 10) | Captcha accepts correct answer | ☐ | |
| 1A.4 | Enter wrong captcha answer | Error message shown, form does not submit | ☐ | |
| 1A.5 | Check Terms checkbox and submit the form | Registration succeeds, toast notification shown, redirect to login | ☐ | |
| 1A.6 | Login as admin → `/admin/users` → find the new user | User exists. `sponsorId` and `referredBy` should be null or default admin | ☐ | |

### 1B — Registration With Referral Link

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 1B.1 | Get referral link from existing user (their invite code) | URL format: `/register?ref={INVITE_CODE}` | ☐ | |
| 1B.2 | Open the referral link in an incognito/private browser window | Registration page loads. "Invited by" shows the **referrer's name** | ☐ | |
| 1B.3 | Complete registration using the referral link | Registration succeeds with toast | ☐ | |
| 1B.4 | Login as admin → `/admin/users` → find the new user | `sponsorId` and `referredBy` point to the referrer's ID | ☐ | |
| 1B.5 | Check the `Referral` table (admin DB or admin referrals page) | A Referral record exists: `referrerId` = referrer, `referredId` = new user, `status` = active, `rewardPaid` = false | ☐ | |
| 1B.6 | Test with an **invalid** referral code: `/register?ref=FAKE123` | Registration page loads. "Invited by" shows fallback (Administrator). Registration still works, user created without sponsor | ☐ | |

---

## 2. Membership Activation & Payment (Phases 4 & 8)

### 2A — Online Payment Auto-Approval (Flutterwave/Paystack)

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 2A.1 | Login as a non-activated user | Dashboard shows "Activate Membership" prompt or similar | ☐ | |
| 2A.2 | Select a membership package (e.g. Regular — ₦10,000) | Package details and price displayed correctly with VAT | ☐ | |
| 2A.3 | Choose **Paystack** as payment gateway and complete payment | Payment processes through Paystack checkout | ☐ | |
| 2A.4 | After successful payment, check membership status immediately | Membership is **activated immediately** — no "pending approval" state | ☐ | |
| 2A.5 | Check `/admin/payments` for this payment | Status = **"approved"**, review notes = "Auto-approved via Paystack webhook (payment verified)" | ☐ | |
| 2A.6 | Check audit log (`/admin/audit` or DB) | Entry with action = `PAYMENT_AUTO_APPROVE`, gateway = "paystack" | ☐ | |
| 2A.7 | Repeat 2A.2–2A.6 with **Flutterwave** gateway (different user) | Same auto-approval behaviour: immediate activation, auto-approved status, audit log with "flutterwave" | ☐ | |

### 2B — Bank Transfer (Manual Approval Required)

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 2B.1 | Select membership package → choose **Bank Transfer** | Bank account details displayed (bank name, account number, account name) | ☐ | |
| 2B.2 | Upload proof of payment and submit | Payment recorded with `status: "pending"`, toast confirms submission | ☐ | |
| 2B.3 | Check user's membership status | Still **NOT activated** — waiting for admin approval | ☐ | |
| 2B.4 | Login as admin → `/admin/payments` → find pending payment | Payment shows as pending with uploaded proof | ☐ | |
| 2B.5 | Admin approves the bank transfer payment | Membership activates, user notified | ☐ | |
| 2B.6 | Admin denies a different bank transfer payment | Membership stays inactive, reason recorded | ☐ | |

### 2C — Referral BPT Reward on Membership Activation

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 2C.1 | Register a new user via referral link (`?ref=INVITE_CODE` of User A) | User B created with User A as referrer | ☐ | |
| 2C.2 | Activate membership for User B (any payment method) | Activation succeeds | ☐ | |
| 2C.3 | Check User A's BPT wallet on their dashboard | BPT balance **increased** by the correct reward amount in **BPT units** (not naira) | ☐ | Record: _____ BPT added |
| 2C.4 | Verify BPT calculation: reward formula = `nairaReward / bptPrice / 2` | Example: If BPT reward = ₦50 and price = ₦5/BPT → 50/5=10 total → 5 BPT to user | ☐ | |
| 2C.5 | Check User A's transactions page (`/transactions`) | BPT referral reward transaction shows amount in **BPT units**, not naira | ☐ | |
| 2C.6 | Check buy-back wallet (admin financials) | Buy-back received the other 50% of BPT reward | ☐ | |

---

## 3. BPT Dynamic Pricing (Phases 5 & 7)

### 3A — Admin Price Management

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 3A.1 | Login as admin → navigate to `/admin/currency` | Currency Manager page loads with current BPT price displayed | ☐ | |
| 3A.2 | Note the current BPT price | Record: ₦____ per BPT | ☐ | |
| 3A.3 | Change BPT price to a new value (e.g. ₦10/BPT) | Price updated, success toast shown | ☐ | |
| 3A.4 | Refresh the page → verify new price persists | New price displayed correctly | ☐ | |
| 3A.5 | Check BPT price history section | Previous price and new price both listed with timestamps | ☐ | |

### 3B — Price Reflects Across Platform

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 3B.1 | After changing price (3A.3), login as regular user → `/dashboard` | BPT wallet shows **same BPT unit count** but **updated naira value**. Example: 5 BPT → was ₦25 at ₦5, now shows ₦50 at ₦10 | ☐ | |
| 3B.2 | Check `/transactions` page | BPT rate display shows new rate: `₦10/BPT` | ☐ | |
| 3B.3 | Check admin `/admin/financials` | BPT holdings valued at new rate | ☐ | |
| 3B.4 | Check admin `/admin/users` → open a user with BPT balance | User detail modal shows BPT units with naira conversion at new rate | ☐ | |
| 3B.5 | **Revert price** back to original (e.g. ₦5/BPT) | All displays revert to original naira valuations; BPT unit counts unchanged | ☐ | |

### 3C — No Hardcoded Prices

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 3C.1 | Set BPT price to an unusual value (e.g. ₦7.50/BPT) | All BPT ↔ naira conversions use ₦7.50, not ₦5 or ₦2.50 | ☐ | |
| 3C.2 | Check dashboard wallet display | Shows correct naira value = BPT units × ₦7.50 | ☐ | |
| 3C.3 | Trigger a new referral reward (activate another user) | BPT reward uses ₦7.50 rate: e.g. ₦50 reward → 50/7.50 = 6.67 total BPT → 3.33 to user | ☐ | |
| 3C.4 | **Restore price** to standard value after testing | ☐ | |

---

## 4. BPT Wallet Unit Display (Phase 8)

### 4A — User Dashboard BPT Display

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 4A.1 | Login as user with BPT balance → `/dashboard` | BPT wallet shows format: `X.XX BPT (₦Y,YYY)` | ☐ | |
| 4A.2 | Verify the naira value = BPT units × current BPT price | Math checks out: e.g. 5.00 BPT × ₦5 = ₦25.00 | ☐ | |
| 4A.3 | Check that BPT unit count does **NOT** change when BPT price changes | Change price in admin → refresh dashboard → unit count same, naira value changes | ☐ | |

### 4B — Admin Views

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 4B.1 | `/admin/users` → click on user → view details modal | BPT wallet shows: `X.XX BPT (₦Y,YYY)` — units with naira conversion | ☐ | |
| 4B.2 | `/admin/financials` → financial overview | Total BPT holdings shown in BPT units with naira equivalent at current rate | ☐ | |
| 4B.3 | Verify format consistency | All BPT displays use "X.XX BPT" format, never raw naira for BPT wallet | ☐ | |

### 4C — Transactions Page BPT Display

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 4C.1 | `/transactions` → find a BPT transaction | Transaction amount displayed in BPT units | ☐ | |
| 4C.2 | Check the BPT rate indicator | Shows current rate: `₦X/BPT` | ☐ | |
| 4C.3 | Export transactions to CSV | CSV contains BPT amounts in units (not naira) | ☐ | |

---

## 5. Empowerment Package Operations (Phase 9 Fixes)

### 5A — Empowerment Transaction Logs

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 5A.1 | Login as admin → `/admin/empowerment` | Empowerment page loads without errors | ☐ | |
| 5A.2 | View an existing empowerment package detail | Beneficiary name and email displayed correctly (not "undefined" or blank) | ☐ | |
| 5A.3 | View empowerment transaction log | Each transaction shows beneficiary name/email and sponsor name correctly | ☐ | |

### 5B — Outcome Setting

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 5B.1 | Select a pending/mature empowerment package | Package details visible with all fields | ☐ | |
| 5B.2 | Set an outcome (e.g. Full Approval) | Outcome saved, package status updated, `beneficiaryUpgraded` flag set correctly on the package record | ☐ | |
| 5B.3 | Verify no console errors or TypeScript runtime errors | Browser console clean (no `Cannot read property of undefined` etc.) | ☐ | |

### 5C — Tranche Release

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 5C.1 | Release a tranche for an empowerment package with outcome set | Tranche released, beneficiary's education wallet credited, tranche record created | ☐ | |
| 5C.2 | Verify first-tranche upgrade tracking | `beneficiaryUpgraded` flag on package = true after first tranche (tracked on package, not user) | ☐ | |
| 5C.3 | Check maturity reminder | Click "Send Maturity Reminder" on an overdue package → reminder sent, beneficiary name resolved correctly | ☐ | |

---

## 6. BPT Balance Migration (Phase 8 — One-Time)

> **⚠️ CRITICAL:** This section only applies if existing staging data has BPT wallet balances stored in naira format. If staging was freshly seeded, skip this section.

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 6.1 | Login as **super_admin** | Session active | ☐ | |
| 6.2 | Note a user's current BPT wallet value (if in naira, e.g. ₦25) | Record: User ___, wallet = ____ | ☐ | |
| 6.3 | Send POST request to `/api/admin/migrate-bpt-balances` (e.g. via Postman or `curl`) | Response: `{ success: true, results: { usersUpdated: N, ... } }` | ☐ | |
| 6.4 | Verify user's BPT wallet after migration | If was ₦25 and price = ₦5 → now shows 5.00 BPT | ☐ | |
| 6.5 | Run migration **again** (idempotency check) | Response: `{ success: false, message: "Migration already executed..." }` | ☐ | |
| 6.6 | Attempt POST as **non-super-admin** user | Response: 403 Forbidden | ☐ | |
| 6.7 | Attempt POST with **no session** (logged out) | Response: 401 Unauthorized | ☐ | |

---

## 7. Cross-Platform Build Verification (Phase 10)

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 7.1 | Confirm staging server started without Prisma binary errors | No "could not locate Query Engine" errors in server logs | ☐ | |
| 7.2 | Confirm all pages load (spot-check 5+ pages across different sections) | No 500 errors, no Prisma initialization errors | ☐ | |
| 7.3 | Confirm the following pages render: `/`, `/login`, `/register`, `/dashboard`, `/admin` | All load correctly | ☐ | |

---

## 8. Negative / Edge Case Tests

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 8.1 | Register with duplicate email | Error: "Email already exists" or similar. No crash | ☐ | |
| 8.2 | Register with mismatched passwords | Client-side validation error before submit | ☐ | |
| 8.3 | Activate membership with insufficient wallet balance (wallet gateway) | Error: "Insufficient balance". No partial activation | ☐ | |
| 8.4 | Access `/admin/currency` as non-admin user | Redirected or 403 Forbidden. Price cannot be changed | ☐ | |
| 8.5 | Access `/api/admin/migrate-bpt-balances` via GET request | Method not allowed or error (only POST accepted) | ☐ | |
| 8.6 | Dashboard loads when BPT price is ₦0 or not set | Dashboard still loads. BPT naira value shows ₦0 or loading state. No crash | ☐ | |
| 8.7 | Transactions page with no transactions | Empty state displayed. No errors | ☐ | |
| 8.8 | Empowerment page with no packages | Empty state displayed. No errors | ☐ | |

---

## 9. Regression Checks

> Verify that existing features still work correctly after our changes.

| # | Test Step | Expected Result | Pass? | Notes |
|---|-----------|----------------|-------|-------|
| 9.1 | User login / logout flow | Works normally | ☐ | |
| 9.2 | Password reset flow (`/forgot-password`) | Email sent, reset works | ☐ | |
| 9.3 | Admin dashboard loads (`/admin`) | All widgets / stats display | ☐ | |
| 9.4 | User can view and update profile settings (`/settings`) | Settings save correctly | ☐ | |
| 9.5 | Admin can view and manage referrals (`/admin/referrals`) | Referral list loads, data correct | ☐ | |
| 9.6 | Admin can view withdrawals (`/admin/withdrawals`) | Withdrawal list loads | ☐ | |
| 9.7 | Main wallet (naira) deposits and withdrawals still work | No impact from BPT changes | ☐ | |
| 9.8 | Store / checkout flow still works (`/store`) | Products load, checkout functional | ☐ | |
| 9.9 | Blog pages load (`/blog`) | Content renders | ☐ | |
| 9.10 | CSP page loads (`/csp`) | No errors | ☐ | |
| 9.11 | Elite Club page loads (`/elite-club`) | No errors | ☐ | |
| 9.12 | Help pages load (`/help`) | No errors | ☐ | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester 1 | | | |
| QA Tester 2 | | | |
| Dev Lead | | | |
| Project Manager | | | |

### Summary

| Section | Total Tests | Passed | Failed | Skipped |
|---------|------------|--------|--------|---------|
| 1. Registration & Referral | 12 | | | |
| 2. Membership & Payment | 13 | | | |
| 3. BPT Dynamic Pricing | 9 | | | |
| 4. BPT Wallet Display | 9 | | | |
| 5. Empowerment Operations | 8 | | | |
| 6. BPT Migration | 7 | | | |
| 7. Build Verification | 3 | | | |
| 8. Negative / Edge Cases | 8 | | | |
| 9. Regression Checks | 12 | | | |
| **TOTAL** | **81** | | | |

### Decision

- ☐ **APPROVED** for production deployment — all critical tests pass
- ☐ **BLOCKED** — critical failures must be resolved first (list below)

**Blocking Issues:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

*Generated March 22, 2026 — BPI Platform v3 QA Test Checkoff*
