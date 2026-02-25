# BPI Profit Pool Distribution & BPI Store — Implementation Tracker

> **Instructions:**  
> Each section is checked **✅** if fully implemented  
> Individual items in sections completed are marked **- [x]**  
> Individual items in sections that are pending/empty/skipped/missing are marked **- [ ]**  
> This file was updated in real-time as each item is completed.  
> No item was marked completed until it is audited, staged, tested, and confirmed.

Last updated: **2026-02-22** | Session 3 completed — all items except granular RBAC implemented  
Maintained by **BPI Engineering Team**  
Reviewed and approved for staging by **Richard Obroh, CTO, BPI**

---

### 🟦 SECTION 1 — Unified Profit Pool Architecture (50 / 30 / 20 Model)

- [x] Profit Pool Engine schema: `RevenueTransaction`, `ProfitPoolConfigVersion`, `RevenueAllocation`
- [x] Company Reserve Pool (50%) — `CompanyReserve`, `CompanyReserveTransaction`
- [x] Executive Directors Pool (30%) — `ExecutiveShareholder`, `ExecutiveDistribution`, `ExecutiveWalletTransaction`
- [x] Strategic Profit Pool (20%) — `StrategyPool` (5 sub-pools)
- [x] Default 50/30/20 hard-coded as fallback policy
- [x] Split ratios admin-configurable via CMS (`getProfitSplitSettings` / `updateProfitSplitSettings`)
- [x] Real-time distribution on every revenue record (`revenue.service.ts` → `recordRevenue`)
- [x] Versioned config (`ProfitPoolConfigVersion`) — each change creates a new version

**✅ IMPLEMENTED**

---

### 🟦 SECTION 2 — Profit Inflow Sources (All Revenue Channels)

#### 2a — Source Tagging & Ledger
- [x] Transaction-level source tagging (`source`, `sourceKey`, `programType`, `productId`, `orderId`, `packageId`, `country`, `state`, `region`, `tokenSymbol`)
- [x] Ledger entry with: Source, Amount, Currency, Timestamp, UserID/OrderID, ProgramType
- [x] Exportable audit reports for Finance / Compliance / Board

#### 2b — Individual Revenue Sources
- [x] `COMMUNITY_SUPPORT` — CSP administrative fees
- [x] `MEMBERSHIP_REGISTRATION` — Regular, Regular Plus, Gold Plus, Platinum activations
- [x] `MEMBERSHIP_REGISTRATION` — Travel & Tours activation (programType=TRAVEL_TOURS)
- [x] `MEMBERSHIP_REGISTRATION` — Early Retirement activation (programType=EARLY_RETIREMENT)
- [x] `MEMBERSHIP_RENEWAL` — Regular renewal, Gold Plus renewal
- [x] `STORE_PURCHASE` — BPI Store / marketplace profits
- [x] `WITHDRAWAL_FEE` — Withdrawal and transaction fees
- [x] `YOUTUBE_SUBSCRIPTION` — YouTube subscription & digital content monetization
- [x] `THIRD_PARTY_SERVICES` — Third-party services and licenses on BPI Store
- [x] `PALLIATIVE_PROGRAM` — Palliative program surplus / management pool inflows
- [x] `LEADERSHIP_POOL_FEE` — Leadership programs on BPI Store
- [x] `TRAINING_CENTER` — Certification programs on BPI Store
- [x] `OTHER` — Configurable future profit sources

#### 2c — Admin-Configurable Pricing (No Code Changes Required)
- [x] **Admin CMS page to update profit amount per membership package** — `PackageEditModal.tsx` has `profitMode`/`profitPercent`/`profitFixedAmountFiat` fields; `admin.ts` `updatePackage` handles all three. Editable without code changes from `/admin/packages`.

**✅ IMPLEMENTED** (verified in `PackageEditModal.tsx` and `admin.ts`)

---

### 🟦 SECTION 3 — Community Support Program (CSP) Profit Integration

- [x] CSP admin fees classified as distinct revenue class (`COMMUNITY_SUPPORT` source)
- [x] CSP profits attributed to Profit Pool in real time
- [x] Reporting on CSP contribution to total platform revenue
- [x] **Admin-configurable CSP admin fee percentage** — `loadCspFeePercentages()` helper reads from `AdminSettings` keys (`csp_fee_recipient_pct`, `csp_fee_admin_pct`, etc.); `getCspFeeSettings` + `updateCspFeeSettings` procedures in `csp.ts`

**✅ IMPLEMENTED** (previously hardcoded at 0.8/0.05/0.01/0.02/0.05/0.07 — now dynamically loaded with fallback defaults)

---

### 🟦 SECTION 6 — BPI Store Profit Distribution

- [x] Per-product profit configuration — `profitMode`: `PERCENT` / `FIXED` / `HYBRID`
- [x] `profitPercent` — percentage-based margin per product
- [x] `profitFixedAmountFiat` — fixed-value profit per sale
- [x] Hybrid mode — percentage + fixed component
- [x] Profit routed to Profit Pool Engine on each completed purchase
- [x] Remaining portion treated as cost / vendor settlement
- [x] Store analytics: profit by product
- [x] Analytics by product category — `Product.category` field added…
- [x] Analytics by vendor — `Product.vendor` field added…
- [x] Analytics by token type (`tokenSymbol` in `RevenueTransaction`)
- [x] Analytics by region (`country`, `state` in `RevenueTransaction`)

**✅ IMPLEMENTED**

---

### 🟦 SECTION 12 — Strategic Pool (20%) Sub-Allocation Framework

#### 12a — Sub-Pool Architecture
- [x] `StrategyPool` model with `PoolType` enum: `LEADERSHIP`, `STATE`, `DIRECTORS`, `TECHNOLOGY`, `INVESTORS`
- [x] Each sub-pool receives equal share (default 4% of total profit each)
- [x] `PoolMember` model — beneficiary per pool with `isActive`, `totalEarned`, `currentBalance`
- [x] `PoolDistribution` model — distribution records per pool

**✅ IMPLEMENTED**

#### 12b — Beneficiary Management
- [x] Add beneficiaries to any sub-pool (`addPoolMember`)
- [x] Remove / deactivate beneficiaries (`removePoolMember`)
- [x] `PoolAdminAction` audit log for all beneficiary changes
- [x] **Eligibility criteria fields on `PoolMember`**
- [x] **Distribution frequency configurable per pool**
- [x] **Scheduled auto-distribution**

**✅ IMPLEMENTED**

#### Sub-pool Specific Status Summary

| Sub-Pool       | Frequency     | Max Members | Special Logic Implemented                          | Status     |
|----------------|---------------|-------------|-----------------------------------------------------|------------|
| LEADERSHIP     | configurable  | 1,000       | qualification auto-sync, cap enforcement            | ✅         |
| STATE          | MONTHLY       | —           | monthly snapshot before distribution                | ✅         |
| DIRECTORS      | ANNUAL        | —           | status validation before distribution               | ✅         |
| INVESTORS      | BI_ANNUAL     | —           | eligibility filtering                               | ✅         |
| TECHNOLOGY     | configurable  | —           | project + budget + spend + ROI/milestone tracking   | ✅         |

---

### 🟥 IMPLEMENTATION PRIORITY ORDER

**🔴 Critical (Core Policy Not Enforced)**  
1. [x] Admin CMS for package profit amounts  
2. [x] Checkout UI: rename "fiat" → "Cashback Wallet"  
3. [x] Insufficient cashback balance error with transfer prompt  
4. [x] Distribution frequency field on `StrategyPool` + admin UI  
5. [x] Leadership Pool 1,000-member cap enforcement  
6. [x] Open Palliative vs Shelter distinction verified/fixed  

**🟡 Important (Governance & Completeness)**  
7–13. [x] (all completed)

**🟢 Enhancement (Analytics & Automation)**  
14–18. [x] (all completed)  
19. [ ] Granular RBAC per pool *(skipped — too early, down-voted)*

---

### 🟩 QUICK REFERENCE — What Is Already Working

| Feature                                | Status | Location                              |
|----------------------------------------|--------|---------------------------------------|
| 50/30/20 Profit Pool                   | ✅     | `revenue.service.ts`, `revenue.ts`    |
| Admin-configurable split               | ✅     | `/admin/revenue-pools`                |
| All 13 revenue sources tagged          | ✅     | `RevenueSource` enum                  |
| CSP → Profit Pool                      | ✅     | `csp.ts` → `recordRevenue`            |
| Membership activation → Pool           | ✅     | `membershipPayments.service.ts`       |
| Store product profit config            | ✅     | `Product` model, `store.ts`           |
| Product vendor + category              | ✅     | `Product.vendor`, `Product.category`  |
| Multi-level rewards 1–4                | ✅     | `StoreRewardConfig`, `store.ts`       |
| CASH / CASHBACK / BPT rewards          | ✅     | `settleStoreReferralRewards`          |
| Token-unit product listings            | ✅     | `ProductPricingMode.TOKEN_UNIT`       |
| External token checkout                | ✅     | `ExternalTokenCheckoutClient.tsx`     |
| 5 Strategic sub-pools                  | ✅     | `StrategyPool`, `PoolMember`          |
| Tech Pool projects                     | ✅     | `TechPoolProject`, admin UI           |
| Palliative overflow → Pool             | ✅     | `palliative.ts` overflow logic        |
| Cashback wallet rules                  | ✅     | `wallet.ts` enforced                  |
| Revenue analytics dashboard            | ✅     | `/admin/revenue-pools`                |

Personnel:  
Victoria Kanma – Quality Assessment (Structural Design, UI/UX Rendition)  
Alatari Douglas – Quality Assessment (Codebase, Local/Git Repo, Implementation Standard)  
Zino Abraham – Tester (Client Side)  
Oghenekaro Ogege – Tester (Client Side)  
Godbless Osaro – Quality Assessment (Admin UI/UX, RBAC, Schema)