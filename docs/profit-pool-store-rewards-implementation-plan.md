# Profit Pool Distribution + Store Reward System — Implementation Plan (Actionable)

Date: 2026-02-19

This document translates the CTO spec (“BPI Profit Pool Distribution & BPI Store Reward System”) into an actionable implementation plan grounded in the current codebase.

Update note (2026-02-19): incorporates latest CTO clarifications:
- BPI Store fiat spending uses **Cashback Wallet** (Main Wallet is funding only)
- Distinguishes **Open Palliative** vs **Shelter (Locked) Palliative**
- Strategic Pool governance: beneficiary management, schedules, approvals

Scope: planning + gap analysis only (no implementation in this doc).

---

## 1) Current System (What Exists Today)

### 1.1 Revenue Pools (“Profit Pool engine” equivalent)

**Core behavior (implemented):**
- Central service `recordRevenue()` persists a `RevenueTransaction` and immediately allocates via a hardcoded 50/30/20 split.
- 50% -> `CompanyReserve` (balance increments)
- 30% -> `EXECUTIVE_POOL` allocation (pending distribution)
- 20% -> split into 5 strategy pools at 4% each (pending)

**Key files:**
- `server/services/revenue.service.ts`
- `server/trpc/router/revenue.ts`
- `prisma/schema.prisma` (`RevenueTransaction`, `RevenueAllocation`, `StrategyPool`, `CompanyReserve`, etc.)

**Important constraint:**
- `RevenueTransaction.sourceId` is **unique** (`sourceId String? @unique`). This prevents duplicates but can cause collisions if any integration reuses the same id across multiple payments.

### 1.2 Store (new store)

**Core behavior (implemented):**
- Products: `Product` model with fiat-pegged `basePriceFiat`, `acceptedTokens`, `tokenPaymentLimits`.
- Orders: `Order` created as a checkout intent and later confirmed.
- Checkout supports FIAT / HYBRID / TOKEN modes.
- Confirmation deducts fiat from **`User.wallet` or `User.cashback`** (based on `paymentSource`) and token from **`User.bpiToken`**.
- Revenue recording: store calls `recordRevenue({ source: "STORE_PURCHASE", amount: fiatAmount, sourceId: order.id })` using the **fiat portion**, not a profit margin.

**Policy mismatch vs latest CTO update (important):**
- Store checkout currently supports paying fiat from **Main Wallet** (`paymentSource: "wallet"`) and defaults to it.
- Updated CTO policy: in the BPI Store, payments are made using **BPT and/or Cashback Wallet**; Main Wallet is a funding wallet, not a checkout wallet.

**Key files:**
- `server/trpc/router/store.ts`
- `components/store/CheckoutClient.tsx`
- `prisma/schema.prisma` (`Product`, `Order`, `RewardConfig`)

### 1.3 Wallet model situation (mixed)

**Observed:**
- Store checkout uses numeric fields on `User` (`wallet`, `cashback`, `bpiToken`).
- Schema also defines `WalletBalance` which supports `(walletType, symbol)` balances.

This mismatch matters for “multi-token support”, enforcing “cashback-only for store fiat”, and token-unit listings.

**Additional mismatch vs latest CTO update:**
- Current wallet transfers permit `cashback -> wallet` (and other directions). CTO policy requires that users **cannot** move cashback back to main wallet or withdraw cashback externally.

### 1.4 Referrals / sponsor graph

**Implemented foundation:**
- There is a `Referral` model (with `referrerId`, `referredId`, status/reward flags) and a `server/trpc/router/referral.ts` that already computes multi-level referral trees (L1–L4 counts and lists).

This is reusable for store rewards (1–4 levels) but **store checkout does not currently pay referral rewards**.

### 1.5 Strategic Pool sub-allocation (20% → 5×4%)

The current Revenue Pools system already matches the CTO’s strategic sub-pool shape:
- Strategic Pool (20%) is split across 5 pools: `LEADERSHIP`, `STATE`, `DIRECTORS`, `TECHNOLOGY`, `INVESTORS` (4% each of total inflow).
- Admin router includes pool membership management and a manual distribution endpoint that can split equally or via custom member percentages.

The CTO update adds governance and scheduling requirements that are not enforced today (caps, qualification linkage, monthly/annual schedules, approvals).

---

## 2) Spec → Codebase Mapping (What Matches / What Doesn’t)

Legend:
- ✅ Implemented
- 🟡 Partial / present but not spec-complete
- ❌ Missing

| Spec requirement | Status | Current reality (where) | Gap / required work |
|---|---:|---|---|
| Unified Profit Pool engine with 50/30/20 | 🟡 | Hardcoded 50/30/20 allocations in `revenue.service.ts` | Make configurable + versioned; reconcile “profit vs revenue” semantics |
| Configurable split ratios in admin | ❌ | No config model; admin router mostly governance/actions | Add `ProfitPoolConfig` model + admin CRUD + activate/version |
| Tagging/reporting by revenue source | ✅ | `RevenueSource` enum + indexes | Extend metadata dims to match spec (token symbol, margin type, etc.) |
| CSP profit handling per spec | 🟡 | CSP records revenue based on system split totals (router integration) | Update to record **CSP admin fee** as the profit class routed into the pool (per CTO example) |
| Membership/renewals/license add-ons routing | 🟡 | Membership calls `recordRevenue`; package prices/renewal fees exist in DB | Add admin CMS controls for updating package profit/pricing; fix sourceId strategy; ensure reporting by member/package/geography |
| Palliative overflow → management → profit pool | ❌ (as reviewed) | Palliative router focuses on activation/maturity + network stats | Add overflow computation, thresholds, and profit pool routing |
| Store profit config (margin/fixed/hybrid) routed to profit pool | ❌ | Store records fiat amount as revenue | Add product profit config + compute profit per order + record profit not gross |
| Store referral rewards (1–4 levels) | ❌ | Referral tree exists; store doesn’t settle rewards | Add store reward config + settlement engine + ledger + payouts |
| Rewards payable in cash/BPT/cashback | ❌ | No store reward payout types in new store | Add payout type support and wallet credits |
| Minimum BPT% rule (mixed checkout) | ❌ | `tokenPaymentLimits` is a cap; no minimum enforced | Introduce “min BPT percent” (system/product) and enforce when Mixed is selected |
| Cashback Wallet rule (no Main Wallet checkout) | ❌ | Store confirm defaults to `paymentSource: wallet`; wallet transfers allow cashback↔wallet | Remove Main Wallet option at store checkout; enforce cashback-only fiat in store; enforce cashback movement restrictions |
| Multi-token support (BPT/PACT/etc) | 🟡 | Product has `acceptedTokens`; confirm deducts from single `User.bpiToken` | Switch to `WalletBalance` (or add per-token fields) and debit by symbol |
| Token-unit listings (products priced in token units) | ❌ | Fiat peg is primary | Add pricing mode + rate snapshotting + display rules |
| Strategic Pool governance + scheduled distributions | 🟡 | Pool membership + manual distribution exist | Add schedules (monthly/bi-annual/annual), beneficiary caps, qualification linkage, snapshotting, and multi-signature approvals |
| RBAC/governance/audit trail for changes | 🟡 | Revenue admin actions exist; store lacks reward governance | Extend audit patterns to profit config + store reward config + pool beneficiary/distribution approvals |

---

## 3) Design Principles (to keep implementation safe)

1) **Do not replace the Revenue Pools system** — extend it.
- It is already integrated across multiple routers; changing its public API should be minimal.

2) Separate concepts explicitly:
- **Gross** (what user paid)
- **Net profit** (what goes to profit pool)
- **Allocations** (how profit is split into buckets)

3) Enforce idempotency and avoid double payouts.
- For store confirm, store reward settlement, and profit recording.

---

## 4) Proposed Architecture Changes

### 4.1 Add configurable allocation (“ProfitPoolConfig”)

**Goal:** Make 50/30/20 and the 20% sub-splits configurable (and versioned).

**Proposed models (high level):**
- `ProfitPoolConfig`
  - `id`, `name`, `version`, `isActive`
  - `companyReservePct`, `executivePoolPct`, `strategyPoolsPct`
  - strategy pools: either fixed 5 pools or a child table (recommended)
  - `createdBy`, `createdAt`, `updatedAt`
- `ProfitPoolConfigPool`
  - `configId`, `poolType`, `pct`

**Implementation notes:**
- Keep existing allocation tables (`RevenueAllocation`) but store `configId` or `configVersionUsed` per transaction/allocation.
- Add runtime validation: percentages sum to 100; strategy pool breakdown sums to strategyPoolsPct.

### 4.2 Fix source identity and uniqueness strategy

**Problem:** `RevenueTransaction.sourceId` is unique and used for dedupe, but some sources may pass non-unique ids (risk: production failures).

**Options:**
- Option A (recommended): change unique constraint to a **composite unique** `(source, sourceId)` and keep `sourceId` indexed.
- Option B: keep `sourceId @unique` but require every integration to pass a truly unique id (e.g., payment transaction id).

Action: audit all `recordRevenue()` call sites and standardize.

### 4.3 Introduce “profit recording” without breaking current integrations

**Options:**
- Option A: Extend `recordRevenue()` to accept `grossAmount` and `netAmount` (profit). Allocate `netAmount`.
- Option B: Add a new service `recordProfit()` and a new model `ProfitTransaction`.

Recommended path: Option A (less disruption) if naming is acceptable; otherwise Option B (clean semantics) but requires migration + integration updates.

### 4.4 Palliative profit logic (Open vs Shelter)

Latest CTO update clarifies there are two palliative behaviors:
- **Open Palliative:** instant benefit delivery at activation/renewal for eligible packages. This is not “profit inflow”.
- **Shelter (Locked) Palliative:** accumulates into a shelter wallet until a threshold; upon claim, shelter wallet resets to 0; **excess beyond threshold** flows into a Palliative Management Pool.

Implementation target:
- Treat **Palliative Management Pool inflows** (the overflow amount) as a profit source to be routed into the unified Profit Pool engine (50/30/20).

Codebase note:
- Schema already includes shelter-related flags and palliative activation/threshold tables, but the “overflow → management pool → profit pool” routing is not represented in the Revenue Pools ledger today.

---

## 5) Store: Profit Margin Routing (Spec-critical)

### 5.1 Product-level profit config

Add to `Product` (or a linked config table):
- `profitMode`: `PERCENT | FIXED | HYBRID`
- `profitPercent`: decimal
- `profitFixedAmountFiat`: decimal
- `minTokenPercent` (e.g., 0.20) — applied when user selects **Mixed** payment
- `allowedFiatWalletForStore`: cashback per CTO policy

Clarification from latest CTO update:
- “100% Cash” in store checkout should be interpreted as “100% Cashback Wallet” (fiat spending wallet for store), not Main Wallet.

### 5.2 Checkout intent computation (deterministic snapshot)

At `createCheckoutIntent`:
- Compute `grossFiat` (fiat peg) and store in `pricingSnapshot`.
- Compute payment split:
  - token portion (must satisfy min token percent and also respect caps if you keep them)
  - fiat portion (must be paid from cashback)
- Compute **profitFiat** from profit config and snapshot it.

### 5.3 Confirm checkout (policy enforcement)

At `confirmCheckoutIntent`:
- Enforce: fiat store spending must be from `cashback` (no Main Wallet checkout).
- Enforce: if payment mode is **MIXED**, token portion >= minTokenPercent * gross.
- Debit token wallet by **token symbol** (requires wallet model decision).
- Record profit to Profit Pool engine using `profitFiat` (not gross).

### 5.4 Wallet model decision (blocking for multi-token)

**If the spec truly needs multi-token:**
- Move store debits/credits to `WalletBalance`:
  - `WalletType.CASHBACK` for fiat cashback
  - token wallets either `WalletType.BPT`/`UTILITY` with `symbol`

This can be phased:
- Phase 1: enforce cashback-only + min token percent with existing `User` fields.
- Phase 2: migrate tokens to `WalletBalance` and deprecate `User.bpiToken` usage.

### 5.5 External token payments + token-unit listings (CTO requirement)

The CTO update requires product listings priced directly in token units (e.g., “20 BPT” or “50 PACT”), with explicit payment instructions and payment confirmation before delivery.

Proposed minimal implementation shape:
- Add a product pricing mode:
  - `FIAT_PEGGED` (existing)
  - `TOKEN_UNIT` (new)
- For `TOKEN_UNIT` products, the checkout intent should snapshot:
  - `tokenSymbol`, `tokenUnits`, and a receiving wallet identifier/address (system wallet or vendor wallet)
- Confirm step should support:
  - Internal ledger-based transfers (if tokens are held in-platform), OR
  - Admin confirmation / webhook confirmation for externally-sent tokens (v1 can be manual, with audit)

Reporting requirement:
- Store analytics must be able to segment by token type and region.

---

## 6) Store Referral Rewards (1–4 levels)

### 6.1 Reward config model

Add a store-specific reward config (global + optional per product override):
- `StoreRewardConfig`
  - active flag, effective dates
- `StoreRewardLevel`
  - `level` (1–4)
  - `rewardBasis`: `GROSS | PROFIT` (needs CTO decision)
  - `rewardValueType`: `PERCENT | FIXED`
  - `payoutType`: `CASH | BPT | CASHBACK`
  - optional caps

If `payoutType = BPT` (or other utility token):
- Compute the token units at the time of purchase using the effective rate, and store the computed units in the reward ledger for audit (avoid recomputing later with different rates).

### 6.2 Settlement engine (idempotent)

Trigger point: when the order is considered “final” (recommend: after `completeClaim`, not at payment confirm, to reduce fraud).

Steps:
1) Resolve sponsor chain up to 4 levels using existing `Referral` model.
2) Compute payouts per level.
3) Write a reward ledger row per recipient (unique key: `(orderId, recipientUserId, level)` to guarantee idempotency).
4) Credit wallet balances and create `Transaction` rows for audit.
5) Mark `Order.rewardSettlementState` = `ISSUED`.

### 6.3 Reporting

- Per-order payout breakdown (stored in ledger, not only computed).
- Aggregate totals by day/week, payoutType, level, and product.

---

## 7) Reporting, Governance, Audit

### 7.1 Profit config governance

- Admin-only endpoints:
  - create/update config
  - activate config
  - preview allocation output for an amount
- Audit log for every config change (reuse existing `RevenueAdminAction` pattern).

### 7.2 Dashboards

Extend `/admin/revenue-pools` views to show:
- Gross vs net profit totals by source
- Allocations by config version
- Store profit contributed, store rewards paid, net retained

### 7.3 Strategic Pool governance (latest CTO update)

The mechanical distribution exists today; the CTO update adds policy requirements:
- Beneficiary management per sub-pool with RBAC
- Beneficiary caps (e.g., Leadership Pool max 1,000) and qualification status checks at distribution time
- Distribution schedules: State monthly, Directors annual, Investors bi-annual, Leadership periodic, Technology on-demand (budgeted)
- Snapshot beneficiary lists at period close
- Multi-signature approvals for beneficiary changes and disbursements

Implementation approach (recommended):
- Add proposal/approval tables for pool actions (beneficiary add/remove, schedule changes, distribution execution).
- Add a scheduler job that executes due distributions using a snapped beneficiary set.

Technology Pool policy note:
- CTO spec defines Technology Pool primarily as an R&D/budget spend fund, not a beneficiary payout pool. The current system can distribute to “TECHNOLOGY” members; implementation should either (a) prohibit members for Technology Pool or (b) route Technology Pool into a budget/spend workflow instead of member distribution.

---

## 8) Migration & Rollout Plan

1) Add DB models/migrations (config + ledger + any new fields).
2) Update revenue service to read active config, but default to current hardcoded values if no config exists (safe deploy).
3) Update store to compute profit snapshots but keep existing revenue recording temporarily behind a feature flag.
4) Enable profit recording for store in staging.
5) Add reward settlement engine (initially disabled), then enable per environment.

---

## 9) Risks / Known Issues

- **`sourceId @unique` collision risk:** any source passing a non-unique id will hard-fail with Prisma `P2002`.
- **Mixed wallet models:** store currently debits numeric `User` fields; multi-token spec implies `WalletBalance` should be canonical.
- **Cashback policy not enforced:** store allows Main Wallet checkout; wallet transfers allow cashback→main; withdrawals may allow unintended sources.
- **Profit vs revenue semantics:** this is a business decision that affects every source; must be explicit.
- **Idempotency:** confirm checkout and reward settlement must be safe to retry without double charging/paying.

---

## 10) Open Questions (need CTO/you to answer before build)

1) Store rewards basis: should referral rewards calculate from **gross sale** or **profit portion**?
2) CSP admin fee profit formula: confirm the exact admin-fee calculation inputs and whether it is always 5% of the system share (as in the example) or configurable.
3) Mixed checkout rules: confirm min BPT% applies only to Mixed mode (recommended), and that “100% Cash” means **100% Cashback Wallet**.
4) Cashback wallet movement rules to enforce for users:
  - allow `wallet -> cashback`
  - disallow `cashback -> wallet`
  - allow `cashback -> another member cashback`
  - disallow `cashback -> external withdrawal`
5) Tokens + listings: which tokens must be supported at launch (BPT only vs BPT+PACT+others), and is token-unit pricing required in v1?

---

## 11) Implementation Checklist (engineering)

- [ ] Add profit pool config models + admin endpoints + audit
- [ ] Standardize revenue source identifiers and uniqueness
- [ ] Add store product profit config + checkout profit snapshot
- [ ] Enforce cashback-only fiat store payments + min token percent (Mixed mode)
- [ ] Enforce cashback wallet movement restrictions (transfers + withdrawals)
- [ ] Record store profit into profit pool (not gross)
- [ ] Implement store referral rewards (L1–L4) + ledger + payouts
- [ ] Extend reporting/dashboards for gross vs net, store profit, reward payouts
