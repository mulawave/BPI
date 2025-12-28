# BPI Membership Packages — Implementation Plan

> Purpose: step-by-step, trackable milestones to implement membership packages, wallet distributions, and governance-driven allocations across environments and Copilot sessions.

## Phase 0 — Alignment & Inputs (Exit: decisions captured)
- Confirm scope: packages (Regular, Regular Plus, Gold Plus, Platinum Plus, Travel & Tour Agent, Basic Early Retirement, Child Educational/Vocational), 7.5% VAT, 4-level referral tree, 365-day renewal, welfare wallets, governance 50/30/20 split.
- Decide wallet schema: unified `wallet` table with type enum vs. multiple tables (recommended: unified table + `wallet_transaction`).
- Confirm referral storage: adjacency list (`referrals` table) or stored ancestry path for quick L1–L4 lookups (recommended: store ancestry path).
- Decide smart contract readiness: token minting stub vs. live integration.
- Decide scheduler: Cron-like job (Next.js/Edge scheduler) vs. background worker.
- Identify feature flagging approach for phased rollout.

## Phase 1 — Data Model & Migrations (Exit: migrations merged, seed ready)
- Add enums: `WalletType` (CASH, BPI_TOKEN, PALLIATIVE, CASHBACK, SHELTER, HEALTH, MEAL, SECURITY), `MembershipStatus` (ACTIVE, EXPIRED, PENDING, CANCELLED), `PackageCode`.
- Tables:
  - `membership_package`: id, code, name, base_fee, vat_rate, total_fee, renewal_fee, benefits JSON, active.
  - `membership_subscription`: id, user_id, package_id, status, activated_at, expires_at, referrer_id, ancestry_path (L1–L4 IDs), renewal_due_at.
  - `wallet`: id, user_id, type, balance, currency, updated_at.
  - `wallet_transaction`: id, wallet_id, amount, currency, type (CREDIT/DEBIT), memo, source (PURCHASE/RENEWAL/ADMIN_OVERRIDE), correlation_id, created_at.
  - `referral_edge` (if needed): parent_id, child_id, depth.
  - `allocation_log`: id, subscription_id, event (PURCHASE/RENEWAL), breakdown JSON (per wallet per user), created_at.
  - Governance wallets (if implemented now): `pool_wallet` + `pool_wallet_transaction` with WalletType enum for CompanyReserve, CEO, CTO, HeadTravel, CMO, Oliver, Morrison, Annie, LeadershipPool, StatePool, DirectorsPool, TechnologyPool, InvestorsPool.
- Seed `membership_package` with all packages, fees (base + VAT), renewal fees, benefits description.

## Future-Proofing New Packages (Exit: data-driven add without code changes)
- Package catalog as source of truth: `membership_package` + a config JSON/YAML per code capturing price, VAT, benefits, L1–L4 distributions per wallet type, renewal rules, welfare wallets, feature flags, and optional governance split.
- Pluggable distribution engine: load package configs into a registry; avoid switch/case. Pure function consumes config and referrer chain, emits wallet deltas and logs.
- Validation: Zod schema for package configs (required fields, wallet arrays per level, renewal variant, welfare/shelter tables). Reject invalid configs at admin save time and CI.
- Versioning and lifecycle: `package_version`, `active_from`, `active_to`, and soft-deprecation to preserve historical allocations while adding successors.
- Admin tooling: UI to create/update packages, preview VAT totals and per-level payouts, and run a dry-run simulator showing wallet deltas for sample referrals before activation.
- Feature flags: gate each new package per environment; enable/disable without deploy.
- Testing: snapshot tests for each package config; property tests to ensure no missing or negative allocations; e2e purchase/renewal tests driven by the config registry.
- Observability: metrics and logs keyed by `package_code` and `package_version`; alert when a package lacks complete distributions or when allocations fail validation.

## Phase 2 — Core Services & Logic (Exit: unit-tested pure functions)
- VAT helper: compute total = base + 7.5%; store base and total to avoid drift.
- Referral resolution: given purchaser, resolve L1–L4 user IDs; if missing levels, fill with nulls.
- Distribution engine: pure functions per package and for renewal that return wallet deltas per user per wallet type (including welfare wallets and shelter tables).
- Governance split helper (50/30/20 with internal executive/pool splits) if enabled in this phase.
- Idempotency: correlation_id per purchase/renewal to avoid double credits.

## Phase 3 — tRPC/API Endpoints (Exit: e2e passing against test DB)
- `membership.purchase`: validates package, VAT, payment success hook, resolves referrals, calls distribution engine, persists subscription, wallet transactions, allocation log.
- `membership.renew`: verifies status/expiry, charges renewal, runs renewal distribution, updates expiry, logs.
- `membership.getBalances`: returns wallet balances per user grouped by wallet type.
- `membership.getTransactions`: paginated wallet_transaction history.
- `membership.getSubscription`: current package, expiry, countdown.
- Admin: `membership.admin.overrideDistribution`, `membership.admin.recompute`, `membership.admin.packages` (list/update active), governance allocation triggers if in-scope.

## Phase 4 — Schedulers & Notifications (Exit: jobs running in staging)
- Nightly/cron job: check `expires_at` within 30/7/3/1 days → enqueue notifications; enforce restriction after expiry.
- Optional weekly disbursement cadence if required by ops.
- Webhooks/notifications surface: email/SMS/push (stub if not ready) + in-app notifications.

## Phase 5 — Frontend (Exit: flows usable end-to-end in staging)
- Package catalog page: show base + VAT, benefits, CTA; enforce feature flags per package.
- Checkout/activation flow: select package, apply referral if present, show totals, confirm; success routes to dashboard.
- Dashboard: wallet balances (tabbed by wallet type), transaction list, referral tree (L1–L4), countdown to renewal, package info.
- Renewal flow: reminder banner + action; post-renewal success state.
- Admin dashboard: revenue totals, pie 50/30/20, executive splits, pool balances, allocation timeline, audit log, override actions.

## Phase 6 — Observability, Security, Compliance (Exit: monitors in place)
- Logging: structured logs for purchase/renewal and allocation results (correlation_id, user_id, amounts).
- Metrics: counts and sums per package, failure rates, time-to-allocate.
- Alerts: failed allocations, negative balances, idempotency conflicts.
- Security: role checks on admin endpoints; ceiling checks on amounts; input validation on amounts and IDs.
- Fraud controls: block duplicate purchases in short window unless allowed; verify referrer eligibility.

## Phase 7 — Testing (Exit: green test suite)
- Unit: VAT helper, referral resolver, distribution per package/renewal, governance split math.
- Integration: purchase flow writes subscription + wallet + allocation_log; renewal flow updates expiry and wallets.
- Migration tests: apply/rollback in CI.
- Frontend: component tests for pricing, wallet views, referral display; e2e happy path for purchase and renewal with mocked payments.

## Phase 8 — Rollout (Exit: production live, monitored)
- Enable behind feature flag; seed packages.
- Soft launch: Regular + Regular Plus first; monitor allocations and balances.
- Gradually enable Gold/Platinum (with shelter/bonus wallets), then Travel Agent, Retirement, Child packages.
- Governance pools: enable 50/30/20 split once dashboards and approvals are ready.
- Post-launch review: reconcile sample transactions, verify wallet balances, review logs.

## Milestones & Checkpoints
- M0: Alignment decisions recorded (schema choices, scheduler, flags).
- M1: Migrations merged; packages seeded.
- M2: Distribution engine complete + unit tests.
- M3: tRPC endpoints implemented + integration tests green.
- M4: Scheduler + notifications deployed to staging.
- M5: Frontend flows (purchase, dashboard, renewal) ready in staging.
- M6: Admin dashboard + overrides live in staging.
- M7: Observability/alerts configured; security review passed.
- M8: Production rollout (phased) completed; post-launch audit.

## Open Questions to Resolve
- Confirm unified wallet table vs. multiple tables.
- Confirm live BPI token mint or stub credit.
- Confirm governance 50/30/20 rollout timing relative to membership launch.
- Confirm payment processor and webhook contract for "payment success" trigger.
- Decide on referral ancestry storage format and limits.
- Decide notification channels (email/SMS/push) and provider.

## Working Notes
- All math must include VAT at 7.5% on base fees; store both base and total.
- Maintain idempotency keys for purchase/renewal to prevent double credits.
- Feature-flag packages to roll out incrementally and limit blast radius.
