# BPI Community Support Program (CSP) — Implementation Tracker

> **Instructions:**  
> Each section is checked **✅** if fully implemented  
> Individual items in sections completed are marked **- [x]**  
> Individual items in sections that are pending/empty/skipped/missing are marked **- [ ]**  
> This file was updated in real-time as each item is completed.  
> No item was marked completed until it is audited, staged, tested, and confirmed.

Last updated: **2026-02-25** | Session concluded — all core CSP items implemented; post-fix cleanup complete  
Maintained by **BPI Engineering Team**  
Reviewed and approved for staging by **Richard Obroh, CTO, BPI**

---

### 🟦 SECTION 1 — Database Schema (CSP Models)

- [x] `CspSupportRequest` model — core request entity (`id`, `userId`, `category`, `amount`, `status`, `raisedAmount`, `broadcastExpiresAt`, `cooldownEndsAt`, `releasedAt`, `approvedBy`, `approvedAt`)
- [x] `CspContribution` model — per-contribution ledger (`contributorId`, `requestId`, `amount`, `walletSource`, `holdingWalletId`)
- [x] `CspCountry` model — country activation registry (`country`, `activationCount`, `isActive`, `activatedAt`)
- [x] `CspAdminDefaultRequest` model — admin-seeded CSP demo requests for broadcast page population
- [x] CSP Holding System Wallet — per-request escrow wallet (`CSP Holding - {requestId}`) via `ensureSystemWallet`
- [x] State Wallet — per-country CSP state wallet created on country activation
- [x] Management Wallet — centralized management pool wallet (`CSP_MANAGEMENT`)
- [x] Reserve Pool Wallet — emergency support reserve pool (`CSP_RESERVE`)

**✅ IMPLEMENTED**

---

### 🟦 SECTION 2 — Eligibility Engine

#### 2a — Membership Check
- [x] Only active BPI members can access CSP (membership tier validated at submission)
- [x] National CSP: minimum Regular Plus membership required
- [x] Global CSP: minimum Regular Plus membership required
- [x] Membership active status enforced (not just tier)

#### 2b — Sponsorship Check
- [x] `qualifiedDirects` — count of direct referrals with active memberships ≥ Regular
- [x] National: minimum 10 qualified directs (admin-configurable: `csp_national_min_directs`)
- [x] Global Path A: minimum 10 qualified directs with Regular Plus (admin-configurable: `csp_global_min_directs`)
- [x] Global Path B: minimum 20 qualified directs (covered by global config)

#### 2c — Contribution Check
- [x] `cumulativeContributions` — sum of all CSP contributions ever made by user
- [x] `requestsContributed` — count of distinct recipients supported
- [x] National: min ₦10,000 cumulative, min 10 distinct recipients (admin-configurable)
- [x] Global: min ₦20,000 cumulative, min 10 distinct recipients (admin-configurable)
- [x] Min per contribution: ₦500 (admin-configurable: `csp_min_per_contribution`)

#### 2d — Country Activation Check
- [x] `hasAnyActivatedCountry` — at least one country is CSP-active globally
- [x] `userCountryIsActivated` — user's own country has reached activation threshold
- [x] National eligibility: user's country must be activated
- [x] Global Path A: at least one activated country exists (early access)
- [x] Global Path B: user's own country is activated

#### 2e — Cooldown Check
- [x] Cooldown enforced — user cannot re-submit if within cooldown window
- [x] `getWaitStatus` procedure — returns remaining cooldown, reduction earned, next eligibility date
- [x] Cooldown options: 6 / 12 / 24 / 36 months (set by admin on approval)

**✅ IMPLEMENTED** (all eligibility flags computed in `computeEligibilityFlags()` / `getEligibility`)

---

### 🟦 SECTION 3 — Request Lifecycle

#### 3a — Submission
- [x] `submitRequest` procedure — validates eligibility, enforces "no active request" rule, creates `CspSupportRequest` with `pending` status
- [x] Category validated (`national` / `global`)
- [x] Amount validated against category minimum threshold
- [x] Duplicate active-request guard (one active request per user at a time)
- [x] `notifyCspRequestSubmitted` notification dispatched on submission

#### 3b — Admin Approval
- [x] `approveRequest` procedure — admin-only, sets status → `broadcasting`, records `approvedBy`, `approvedAt`, `broadcastExpiresAt`, `cooldownEndsAt`
- [x] Broadcast duration derived from category config (`csp_national_broadcast_hours` / `csp_global_broadcast_hours`), default 48 hours
- [x] Cooldown duration set by admin on approval (6 / 12 / 24 / 36 months)
- [x] `notifyCspRequestApproved` notification dispatched on approval
- [x] Admin notification to all admins on new request submitted

#### 3c — Rejection
- [x] `rejectRequest` procedure — admin-only, sets status → `rejected`
- [x] `notifyCspRequestRejected` notification dispatched on rejection

#### 3d — Listing & Status
- [x] `adminListRequests` — paginated full list (admin); filters by status, keyword, cursor pagination
- [x] `getLiveStatus` — returns active request details for current user
- [x] `listHistory` — paginated request history for current user
- [x] `listBroadcasts` — public broadcast list (active `broadcasting` requests, shuffled/anonymized)

**✅ IMPLEMENTED**

---

### 🟦 SECTION 4 — Contribution System

- [x] `contribute` procedure — member contributes to an active broadcast request
- [x] Wallet source: `wallet` (main wallet) or `community` (community wallet), validated
- [x] Minimum contribution enforced (₦500, admin-configurable)
- [x] Self-contribution blocked ("You cannot contribute to your own support request")
- [x] Contribution deducted from contributor's wallet immediately
- [x] Amount credited to per-request CSP Holding wallet (escrow)
- [x] `CspContribution` ledger record created
- [x] `raisedAmount` on `CspSupportRequest` incremented
- [x] `notifyCspContributionReceived` notification sent to beneficiary
- [x] `notifyCspContributionSent` notification sent to contributor

**✅ IMPLEMENTED**

---

### 🟦 SECTION 5 — Broadcast Extension Engine

- [x] `extendBroadcast` procedure — admin-only
- [x] Extension by direct sponsorship milestones (paid tier):
  - 30 directs → +24h
  - 40 directs → +48h
  - 50 directs → +72h
  - 100 directs → +168h
- [x] Extension by contribution amount thresholds (paid tier):
  - ₦40,000 → +24h
  - ₦60,000 → +48h
  - ₦80,000 → +72h
  - ₦100,000 → +168h
- [x] Extension reason recorded (`paid` / `referrals`) with optional value
- [x] Extension stacks from existing `broadcastExpiresAt` (not from now)
- [x] `notifyCspBroadcastExtended` notification dispatched

**✅ IMPLEMENTED**

---

### 🟦 SECTION 6 — Fund Release & Revenue Distribution (80/20 Model)

- [x] `releaseFunds` procedure — admin-only; releases escrowed funds from CSP Holding wallet

#### 6a — 80/20 Distribution + 120% Markup Rule (Two-Path Disbursement)
- [x] **Path A — Fully funded** (`raisedAmount >= thresholdAmount`): Beneficiary receives 100% of original `requestedAmount`; the 20% markup surplus is split proportionally across admin pools
- [x] **Path B — Partially funded** (`raisedAmount < thresholdAmount`): `pct.recipient` (80%) of total raised → beneficiary; remaining 20% split across admin pools per configured percentages
- [x] `fullyFunded` flag returned in API response so admin UI can distinguish which path was taken
- [x] **80% (Path B) / 100% of requestedAmount (Path A)** → Beneficiary's `wallet`
- [x] **5% of admin pool** → BPI Profit Pool (via `recordRevenue`, source: `COMMUNITY_SUPPORT`)
- [x] **2% of admin pool** → Direct sponsor's wallet (`sponsorId` on User record)
- [x] **2% of admin pool** → State wallet (CSP State Pool)
- [x] **4% of admin pool** → Management wallet (CSP Management Pool)
- [x] **7% of admin pool** → Reserve pool wallet (CSP Reserve)
- [x] Rounding remainder on Path A absorbed into `reserve`; on Path B absorbed into `recipient`

#### 6b — Admin-Configurable Fee Percentages
- [x] All 6 split percentages configurable via `AdminSettings` keys:
  - `csp_fee_recipient_pct` (default 0.80)
  - `csp_fee_admin_pct` (default 0.05 → Profit Pool)
  - `csp_fee_sponsor_pct` (default 0.02)
  - `csp_fee_state_pct` (default 0.02)
  - `csp_fee_management_pct` (default 0.04)
  - `csp_fee_reserve_pct` (default 0.07)
- [x] `loadCspFeePercentages()` helper reads all keys with fallback defaults
- [x] `getCspFeeSettings` procedure — returns current settings (admin-only)
- [x] `updateCspFeeSettings` procedure — writes updated percentages to `AdminSettings` (admin-only)
- [x] Total always validated to sum to 1.0

#### 6c — Profit Pool Integration
- [x] `recordRevenue()` called with `source: "COMMUNITY_SUPPORT"` on every release
- [x] `programType: "CSP"` tagged for analytics segmentation
- [x] `state` derived from beneficiary's `User.state`
- [x] `region` derived via `getNigerianRegion(User.state)` → Nigerian geopolitical zone
- [x] `sourceId` set to request ID for deduplication
- [x] Revenue split (50/30/20) applied in real time inside `recordRevenue`

#### 6d — Post-Release State
- [x] Request status set → `released`
- [x] `releasedAt` timestamp recorded
- [x] `cooldownEndsAt` recorded for next-request eligibility tracking
- [x] Holding wallet balance depleted after disbursement

**✅ IMPLEMENTED**

---

### 🟦 SECTION 7 — Wait Time Reduction (Post-Collection Giving-Back Logic)

- [x] `getWaitStatus` procedure — returns current cooldown window, monthly contribution this cycle, wait-reduction earned
- [x] `waitReductionMonthlyTarget` — configurable monthly contribution target for 1-month reduction (default ₦10,000, key: `csp_wait_reduction_monthly_target`)
- [x] Monthly contribution tracked via `CspContribution` records (current calendar month)
- [x] Reduction calculated: `floor(monthlyContrib / monthlyTarget)` months reduced from cooldown
- [x] Minimum ₦500 per contribution day enforced (from eligibility rules)
- [x] `nextEligibilityDate` computed and returned for UI countdown display

**✅ IMPLEMENTED**

---

### 🟦 SECTION 8 — Admin CMS Controls

#### 8a — Request Management
- [x] Admin list all requests with pagination, status filter, keyword search (`adminListRequests`)
- [x] Approve request with broadcast duration + cooldown duration (`approveRequest`)
- [x] Reject request with reason (`rejectRequest`)
- [x] Release funds to beneficiary (`releaseFunds`)
- [x] Extend broadcast duration (`extendBroadcast`)

#### 8b — Admin Default / Seed Requests
- [x] `createAdminDefaultRequest` — admin can seed demo broadcast entries for broadcast page population when real requests are sparse
- [x] `toggleAdminDefaultRequest` — enable/disable visibility of demo entries
- [x] `markAdminDefaultComplete` — mark admin-seeded entry as complete/archived
- [x] `listAdminDefaultRequests` — list all admin-seeded entries with status

#### 8c — Rule Configuration (All Admin-Configurable Without Code Changes)
- [x] `csp_min_per_contribution` — minimum per contribution (₦500)
- [x] `csp_national_min_directs` — national minimum direct sponsors
- [x] `csp_national_min_cumulative_contrib` — national minimum total contribution
- [x] `csp_national_min_distinct_requests` — national minimum unique beneficiaries
- [x] `csp_national_broadcast_hours` — national broadcast window hours
- [x] `csp_national_min_threshold` — national minimum request amount
- [x] `csp_national_min_membership` — membership tier required for national
- [x] `csp_global_min_directs` — global minimum direct sponsors
- [x] `csp_global_min_cumulative_contrib` — global minimum total contribution
- [x] `csp_global_min_distinct_requests` — global minimum unique beneficiaries
- [x] `csp_global_broadcast_hours` — global broadcast window hours
- [x] `csp_global_min_threshold` — global minimum request amount
- [x] `csp_global_min_membership` — membership tier required for global
- [x] `csp_wait_reduction_monthly_target` — monthly contribution target for 1-month wait reduction

#### 8d — Country Activation Controls
- [x] `listCspCountries` — list all country activation records
- [x] `upsertCspCountry` — create or update country activation record (enable/disable, set threshold)
- [x] `updateCountryActivationCount` — increment / set activation count for a country
- [x] Country becomes CSP-active when `activationCount` ≥ configured threshold
- [x] State wallets auto-created per activated country

**✅ IMPLEMENTED**

---

### 🟦 SECTION 9 — Notifications

- [x] `notifyCspRequestSubmitted` — dispatched when member submits a request
- [x] `notifyCspRequestApproved` — dispatched to beneficiary when admin approves
- [x] `notifyCspRequestRejected` — dispatched to beneficiary when admin rejects
- [x] `notifyCspContributionReceived` — dispatched to beneficiary on each contribution
- [x] `notifyCspContributionSent` — dispatched to contributor on each contribution
- [x] `notifyCspBroadcastExtended` — dispatched when admin extends broadcast duration
- [x] Admin notification on new CSP request submission (for admin review queue)
- [x] All notifications use `toast` from `react-hot-toast` on client (no `alert()` / `confirm()`)

**✅ IMPLEMENTED**

---

### 🟦 SECTION 10 — Client-Side Dashboard (CspDashboard.tsx)

- [x] Eligibility status panel — shows all eligibility checks with pass/fail indicators for national and global categories
- [x] Submit request form — category selector, amount input, eligibility pre-check
- [x] Live broadcast page — shuffled, anonymized list of active requests; auto-refreshing
- [x] Contribution widget — amount input, wallet source selection, submit button with loading state
- [x] Live status card — shows user's own active request, raised amount, expiry countdown
- [x] Request history list — paginated past requests with status tags
- [x] Wait status card — shows cooldown remaining, monthly contribution, reduction earned
- [x] Contribution wallet selector (`wallet` / `community`)
- [x] Minimum contribution validation before submission
- [x] Toast notifications for all actions (contribute, submit, errors)
- [x] Admin-configurable category rules reflected in UI (fetched from `getEligibility`)

**✅ IMPLEMENTED**

---

### 🟦 SECTION 11 — Post-Fix Cleanup (Feb 2026 Session)

#### 11a — TypeScript Error Fixes
- [x] `csp.ts` — removed non-existent `request.state` / `request.region` field references (`CspSupportRequest` has no state field)
- [x] `csp.ts` — replaced undefined `CATEGORY_RULES[input.category]` with `DEFAULTS[input.category as "national" | "global"]`
- [x] `admin.ts` — removed 3× `user.region` references (field does not exist on `User` model)
- [x] `package.ts` — removed 2× `region: true` from Prisma selects + `user.region` from `recordRevenue` calls
- [x] `app/admin/revenue-pools/page.tsx` — IIFE pattern for 3 possibly-null form state vars; `category` cast fixed

#### 11b — Nigerian Region Derivation (Option B)
- [x] Created `lib/nigeria-regions.ts` — `getNigerianRegion(state)` utility
- [x] Maps all 36 Nigerian states + FCT → 6 geopolitical zones (North Central / North East / North West / South East / South South / South West)
- [x] Returns `undefined` for unknown / international states (safe for non-Nigerian users)
- [x] `csp.ts` — `releaseFunds`: added `state: true` to User include; wired `state` and `region` (via `getNigerianRegion`) into `recordRevenue`
- [x] `admin.ts` — wired `region: getNigerianRegion(payment.User?.state)` into 3 `recordRevenue` calls (membership bank transfer, store purchase, membership upgrade)
- [x] `package.ts` — wired `region: getNigerianRegion(user?.state)` into 2 `recordRevenue` calls (wallet payment, external gateway)

#### 11c — Build & CI
- [x] Lint: **✔ No ESLint warnings or errors**
- [x] Type-check: **✔ Zero TypeScript errors** (was 32 before fix)
- [x] Build: **✔ 81 static pages generated, exit 0**
- [x] Stale `.next` cache cleared after session to resolve `Cannot find module './1682.js'` error

**✅ IMPLEMENTED**

---

### 🟥 IMPLEMENTATION PRIORITY ORDER

**🔴 Critical (Core Policy)**
1. [x] CSP eligibility engine (membership, directs, contributions, country check)
2. [x] Request submission with active-request guard
3. [x] Admin approval with broadcast duration + cooldown
4. [x] Contribution flow with holding wallet escrow
5. [x] Fund release with 80/20 distribution
6. [x] Admin-configurable fee percentages (`getCspFeeSettings` / `updateCspFeeSettings`)

**🟡 Important (Governance & Completeness)**
7. [x] Broadcast extension engine (contributions + referral milestones)
8. [x] Wait time reduction via post-collection contributions
9. [x] Country activation management (`upsertCspCountry`, `updateCountryActivationCount`)
10. [x] Admin default/seed requests for broadcast page warmup
11. [x] CSP profits routed to Profit Pool with region tagging

**🟢 Enhancement (Analytics & Automation)**
12. [x] Nigerian geopolitical zone derivation for all `recordRevenue` calls
13. [x] Notification system for full request lifecycle
14. [x] Anonymous, shuffled broadcast page (manipulation-resistant)
15. [ ] Automated country activation on member count threshold *(manual admin trigger currently)*
16. [ ] Granular RBAC per CSP wallet (state / management / reserve) *(deferred — no admin demand yet)*
17. [ ] Contribution streak rewards / gamification *(future enhancement)*

---

### 🟩 QUICK REFERENCE — What Is Already Working

| Feature                                          | Status | Location                                          |
|--------------------------------------------------|--------|---------------------------------------------------|
| Eligibility engine (membership + directs + contrib) | ✅  | `csp.ts` → `getEligibility`, `computeEligibilityFlags` |
| Submit request with eligibility guard            | ✅     | `csp.ts` → `submitRequest`                        |
| Admin approve / reject                           | ✅     | `csp.ts` → `approveRequest`, `rejectRequest`      |
| Contribution to broadcast request                | ✅     | `csp.ts` → `contribute`                           |
| CSP Holding wallet escrow                        | ✅     | `ensureSystemWallet` (`CSP Holding - {id}`)       |
| 80/20 fund release                               | ✅     | `csp.ts` → `releaseFunds`                         |
| Admin-configurable fee splits                    | ✅     | `getCspFeeSettings` / `updateCspFeeSettings`      |
| Broadcast extension (contrib + directs)          | ✅     | `csp.ts` → `extendBroadcast`                      |
| Wait time reduction logic                        | ✅     | `csp.ts` → `getWaitStatus`                        |
| Country activation management                   | ✅     | `csp.ts` → `upsertCspCountry`, `listCspCountries` |
| Admin seed requests for broadcast page           | ✅     | `csp.ts` → `createAdminDefaultRequest`            |
| CSP → Profit Pool revenue recording              | ✅     | `recordRevenue` in `releaseFunds`, source: `COMMUNITY_SUPPORT` |
| Nigerian region tagging on revenue records       | ✅     | `lib/nigeria-regions.ts` → `getNigerianRegion`    |
| Full notification lifecycle                      | ✅     | `notification.service.ts` (6 event types)         |
| Client dashboard (eligibility, broadcast, etc.)  | ✅     | `components/csp/CspDashboard.tsx`                 |
| Admin CSP management page                        | ✅     | `app/admin/csp/page.tsx`                          |
| CI passing (lint + type-check + build)           | ✅     | `scripts/ci-test.cjs`, exit 0, 81 pages           |

---

Personnel:  
Victoria Kanma – Quality Assessment (Structural Design, UI/UX Rendition)  
Alatari Douglas – Quality Assessment (Codebase, Local/Git Repo, Implementation Standard)  
Zino Abraham – Tester (Client Side)  
Oghenekaro Ogege – Tester (Client Side)  
Godbless Osaro – Quality Assessment (Admin UI/UX, RBAC, Schema)
