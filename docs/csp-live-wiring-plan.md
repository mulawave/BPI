# CSP Live Data Wiring Plan
Guidance to replace mock CSP UI data with production logic and enforce wallet rules.

## Scope
- Power CSP (Community Support Program) with real eligibility, requests, broadcasts, wallet splits, and history.
- Enforce wallet restrictions: **only Community Wallet and Cash Wallet** participate in CSP contributions/payouts.
- Ensure membership activation (Regular Plus and above) credits ₦10,000 into Community Wallet (CSP-restricted).

## Current State Check
- UI: `/csp` uses mocked eligibility/history in `components/csp/CspDashboard.tsx`.
- Navigation: Support menu points to `/csp` (desktop/mobile).
- Backend: `server/trpc/router/package.ts` conversion flow sets `COMMUNITY_CREDIT = 0`; no community credit on activation for Regular Plus+ packages.

## Required Backend Additions
1) **Prisma Schema** (new tables)
- `CspSupportRequest`: id, userId, category (national/global), amount, purpose, notes, status (pending/approved/rejected/broadcasting/closed), broadcastExpiresAt, thresholdAmount, raisedAmount, contributorsCount, createdAt/updatedAt, approvalBy/at.
- `CspContribution`: id, requestId (FK), contributorId, amount, walletType ("community" | "cash"), createdAt.
- `CspBroadcastExtension`: id, requestId, type ("paid" | "referrals"), value (amount or directs), hoursGranted, createdAt.
- Indexes: request status + expiry for timely closing; contributorId + createdAt for history.

2) **CSP Router (tRPC)**
- `getEligibility`: derives membership level, direct referrals, cumulative contributions to other members, and returns flags for national/global.
- `submitRequest`: validates eligibility, writes `CspSupportRequest` (status pending), sends confirmation email.
- `approveRequest`: admin-only; sets status to `approved` and starts broadcast window (sets `broadcastExpiresAt`).
- `getLiveStatus`: returns raisedAmount, remainingThreshold, contributors, countdown.
- `listHistory`: paginated requests for user.
- `contribute`: accepts amount + walletType (community/cash), enforces wallet restriction, creates `CspContribution`, performs split (80% to recipient community support wallet, 20% allocations per CSP split), records transactions.
- `extendBroadcast`: admin or qualifying rule (paid or referrals); adjusts `broadcastExpiresAt` per tables above.

3) **Wallet + Split Logic**
- Only debit from `community` or `wallet` (cash) fields; reject other wallet types.
- Split 80/20: 80% → recipient support wallet (community); 20% → allocations (admin 5%, sponsor 1%, state 2%, management 5%, reserve 7%). Represent these as transactions and wallet increments.
- Ensure ledger entries (transactions table) include requestId context and walletType.

4) **Membership Activation Credit**
- Rule: Every membership **Regular Plus and above** credits ₦10,000 to Community Wallet (CSP-only) on activation/upgrade.
- Current implementation: `COMMUNITY_CREDIT = 0` in `packageRouter` conversion; no credit on normal activation.
- **Proposed code change (for review)** in `server/trpc/router/package.ts` activation paths:
  - Set `const COMMUNITY_CREDIT = 10000;` for Regular Plus+ packages.
  - When activating/upgrading such packages: `community: { increment: COMMUNITY_CREDIT }` and create a transaction note "CSP community credit".
  - Guard: only apply to packages where `membershipPackage.name` in ["Regular Plus", "Gold", "Platinum", ...] or by price threshold.
  - Keep credit restricted to CSP spend (handled by CSP contribution endpoint).

5) **Admin Panel Hooks**
- Add CSP approvals list with actions Approve/Reject/Extend, showing countdown and threshold.
- Export history (CSV/PDF) using `CspSupportRequest` + `CspContribution` data.

## Required Frontend Wiring
- Replace mocks in `CspDashboard` with TRPC hooks:
  - `useQuery(getEligibility)` → show flags, direct count, contributions, thresholds.
  - `useQuery(getLiveStatus)` → raised, remaining, contributors, countdown.
  - `useQuery(listHistory)` → recent requests.
  - `useMutation(submitRequest)` → request form.
  - `useMutation(contribute)` → contribution action (future UI button).
- Show wallet balances from real dashboard data, but gate CSP interactions to community/cash only.
- After approve, display broadcast status and timers; refresh on focus or interval.

## Data Rules to Enforce
- Eligibility (from CSP doc):
  - Active membership.
  - Regular Plus/basic note: support button active only after upgrade to Regular Plus.
  - Gold/Platinum required for Global.
  - Contribution minimum: ≥ ₦500 per contribution AND ≥ ₦10,000 cumulative given to others.
  - Direct referrals: National ≥ 10; Global ≥ 20.
- Next cycle eligibility: blocked for 2–3 years unless renewed and meets Global condition.
- Time extensions per tables; cap at 7 days.

## Notifications
- Triggers: qualification, submission, approval, broadcast start, contribution received, countdown warnings (6h/3h/1h), expiry.
- Channels: email, in-app, Telegram/WhatsApp bots (existing notification service hooks to extend).

## Wallet Restriction Checklist
- CSP contribute endpoint: allow `wallet` (cash) or `community` only; reject others.
- UI: limit wallet selector to these two (and reflect balances).
- Transfers to CSP wallets from other wallets should be blocked unless explicitly allowed by business rules (current requirement says only these two interact with CSP).

## Next Steps
1) Approve membership credit change (Regular Plus+ → ₦10k to Community Wallet). If approved, implement in `packageRouter` activation/upgrade and add transaction log entry.
2) Add Prisma models/migrations for CSP tables.
3) Build CSP tRPC router with eligibility, request lifecycle, contributions, live status, extensions, history.
4) Wire `CspDashboard` to tRPC data and enforce wallet restrictions in UI flows.
5) Add admin CSP queue for approvals and extensions.
6) Add notification hooks for lifecycle events.

## Approval Needed
- Confirm membership credit rule implementation; pending proposed code change in `packageRouter` as described above.
- Confirm 2–3 year re-eligibility window and any grace rules for renewal.

---
This plan replaces mocks with live data, enforces the two-wallet rule, and introduces the necessary backend surfaces for CSP.
