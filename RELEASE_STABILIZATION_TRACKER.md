# Release Stabilization Tracker

Generated: 2026-05-04

Purpose: Convert the findings in FULL_CODEBASE_AUDIT_REPORT.md into an execution control sheet for release hardening.

Source report:

- FULL_CODEBASE_AUDIT_REPORT.md

Implementation companion for first execution batch:

- BATCH_A_IMPLEMENTATION_CHECKLIST.md

## Status Legend

- `not started`: no implementation work has begun
- `in progress`: actively being fixed or validated
- `blocked`: cannot proceed until another item or decision is resolved
- `ready for verification`: implementation is done and awaiting validation
- `done`: implemented and validated
- `accepted risk`: not fixed, but explicitly accepted with compensating controls

## Release Gate Summary

This version should not be called locked down until:

- all Critical findings are `done` or formally `accepted risk`
- all release-blocking High findings are `done` or formally `accepted risk`
- mock/demo behavior is removed or hidden for any feature considered live
- payment lifecycle validation is complete across admin approval, webhooks, membership, deposits, and store flows
- environment validation blocks unsafe startup defaults

## Execution Order

Use this exact order unless a change review explicitly decides otherwise.

1. `P0-1` Remove fallback encryption key
2. `P0-2` Restrict destructive admin procedures to super admin
3. `P0-3` Disable mock payment outside explicitly safe environments
4. `P0-4` Fix hardcoded app URL/domain fallbacks
5. `P0-5` Restore truthful admin dashboard payment stats
6. `P1-4` Make referral sync transactional or stage-and-swap
7. `P1-1` Make admin payment approval atomic
8. `P1-2` Remove unreachable/conflicting `TOPUP` handling
9. `P1-3` Introduce shared idempotent fulfillment guards
10. `P1-5` Normalize payment lifecycle metadata contracts
11. `P2-1` Replace in-memory newsletter execution state with durable persistence
12. `P2-2` Remove duplicate newsletter job tracking model
13. `P2-3` Harden impersonation route with throttling and audit assurances
14. `P2-4` Add startup environment validation for critical keys and URLs
15. `P3-1` Remove demo/mock logic from dashboard
16. `P3-2` Complete or explicitly gate admin global search
17. `P3-3` Replace mock package analytics growth data
18. `P3-4` Decide TechQuiz live status and complete or gate CBT flow
19. `P4-1` through `P4-6` Add regression protection for all stabilized areas

## Dependency Rules

- Do not start `P1-1` before `P0-2` and `P0-5` are complete.
- Do not start `P1-3` before `P1-1` and `P1-2` are complete.
- Do not start `P1-5` before `P1-1`, `P1-2`, and `P1-3` are in progress or complete.
- Do not start `P2-2` before `P2-1` has a concrete persistence direction selected.
- Do not treat `P3-*` items as release polish; `P3-1` and `P3-4` affect live-product correctness.
- `P4-*` tests should be added immediately after each corresponding fix, not deferred to the very end when possible.

## First Implementation Batch

This is the recommended first stabilization batch to execute next.

### Batch A: Immediate Release Safeguards

Objective: eliminate the fastest paths to security failure, destructive misuse, and environment misrouting.

Included items:

- `P0-1` Remove fallback encryption key
- `P0-2` Restrict destructive admin procedures to super admin
- `P0-3` Disable mock payment outside explicitly safe environments
- `P0-4` Fix hardcoded app URL/domain fallbacks
- `P0-5` Restore truthful admin dashboard payment stats

Why this batch goes first:

- It has the highest release-blocking value for the lowest coordination cost.
- It reduces the chance of ongoing operator error while deeper payment refactors are still pending.
- It removes several “silent misconfiguration” risks before further rollout work.

Recommended validation for Batch A:

1. App startup fails for missing auth/canonical URL configuration and warns immediately when `ENCRYPTION_KEY` is missing.
2. A regular admin cannot access destructive procedures.
3. Mock gateway never renders in production-like configuration.
4. Links in emails and redirects resolve from configured environment URLs only.
5. Admin dashboard badges reflect real pending payment data.

### Batch B: Financial Integrity Core

Begin only after Batch A is complete.

Included items:

- `P1-4` Make referral sync transactional or stage-and-swap
- `P1-1` Make admin payment approval atomic
- `P1-2` Remove unreachable/conflicting `TOPUP` handling

### Batch C: Settlement Hardening

Begin only after Batch B is stable.

Included items:

- `P1-3` Introduce shared idempotent fulfillment guards
- `P1-5` Normalize payment lifecycle metadata contracts

## Parallelization Guidance

Safe to run in parallel:

- `P0-1` and `P0-4`
- `P0-2` and `P0-5`
- `P3-2` and `P3-3`
- test additions in `P4-*` immediately after their parent fixes land

Avoid parallelizing:

- `P1-1`, `P1-2`, `P1-3`, and `P1-5` in separate uncoordinated changes
- `P2-1` and `P2-2` without a single newsletter persistence design
- `P3-1` while payment or auth stabilization is still changing shared dashboard data contracts

## Phase 0: Stop-the-Bleed

| ID | Title | Severity | Blocker | Status | Owner | Primary Files | Validation |
|---|---|---|---|---|---|---|---|
| P0-1 | Remove fallback encryption key | Critical | Yes | completed | Unassigned | `server/utils/encryption.ts` | App fails fast without `ENCRYPTION_KEY`; existing encrypted values still decrypt with valid key |
| P0-2 | Restrict destructive admin procedures to super admin | Critical | Yes | completed | Unassigned | `server/trpc/router/admin.ts` | Regular admin cannot access destructive procedures; super admin still can |
| P0-3 | Disable mock payment outside explicitly safe environments | High | Yes | completed | Unassigned | `lib/mockPayments.ts`, `server/services/payment/PaymentGatewayFactory.ts`, `server/services/payment/PaymentProcessor.ts`, `server/trpc/router/payment.ts`, `server/trpc/router/package.ts`, `server/trpc/router/wallet.ts`, `app/membership/activate/[packageId]/page.tsx`, `components/wallet/DepositModal.tsx` | Mock gateway never appears in production-like environments |
| P0-4 | Fix hardcoded app URL/domain fallbacks | High | Yes | completed | Unassigned | `lib/appUrl.ts`, `lib/clientAppUrl.ts`, `lib/email.ts`, `server/trpc/router/auth.ts`, `server/trpc/router/user.ts`, `server/trpc/router/referral.ts`, `server/trpc/router/wallet.ts` | All redirects and email links resolve to configured environment URLs |
| P0-5 | Restore truthful admin dashboard payment stats | High | Yes | completed | Unassigned | `server/trpc/router/adminAuth.ts`, `app/admin/layout.tsx` | Admin dashboard badges reflect real pending payment counts |

## Phase 1: Financial and Fulfillment Integrity

| ID | Title | Severity | Blocker | Status | Owner | Primary Files | Validation |
|---|---|---|---|---|---|---|---|
| P1-1 | Make admin payment approval atomic | Critical | Yes | done | Unassigned | `server/trpc/router/admin.ts`, `server/services/revenue.service.ts`, `server/services/payment/adminPaymentReview.ts` | No partial wallet/order/membership updates on induced failure |
| P1-2 | Remove unreachable/conflicting `TOPUP` handling | Critical | Yes | done | Unassigned | `server/trpc/router/admin.ts`, `server/services/payment/adminPaymentReview.ts`, `server/trpc/router/wallet.ts`, `server/trpc/router/package.ts`, `app/api/cron/recover-stuck-payments/route.ts`, `server/services/payment/paymentMetadata.ts` | Single deterministic path for deposit/top-up approval |
| P1-3 | Introduce shared idempotent fulfillment guards | High | Yes | done | Unassigned | `server/services/payment/pendingPaymentFulfillment.ts`, `server/trpc/router/admin.ts`, `server/trpc/router/package.ts`, `app/api/webhooks/crypto/route.ts`, `app/api/webhooks/paystack/route.ts`, `app/api/webhooks/flutterwave/route.ts`, `app/api/cron/recover-stuck-payments/route.ts` | Duplicate admin/webhook/callback processing does not duplicate value delivery |
| P1-4 | Make referral sync transactional or stage-and-swap | Critical | Yes | ready for verification | Unassigned | `server/trpc/router/admin.ts` | Failed referral rebuild cannot leave partial live state |
| P1-5 | Normalize payment lifecycle metadata contracts | High | Yes | ready for verification | Unassigned | `server/services/payment/paymentMetadata.ts`, `server/trpc/router/package.ts`, `server/trpc/router/wallet.ts`, `server/trpc/router/store.ts`, `app/api/webhooks/paystack/route.ts`, `app/api/webhooks/flutterwave/route.ts` | Membership, upgrade, deposit, and store payment metadata resolve consistently across initiation and fulfillment |

## Phase 2: Operational Durability

| ID | Title | Severity | Blocker | Status | Owner | Primary Files | Validation |
|---|---|---|---|---|---|---|---|
| P2-1 | Replace in-memory newsletter execution state with durable persistence | High | Yes | ready for verification | Unassigned | `prisma/schema.prisma`, `prisma/migrations/20260504000000_newsletter_campaign_scheduler_fields/migration.sql`, `server/trpc/router/admin.ts` | Newsletter jobs survive restart/redeploy and do not duplicate unexpectedly |
| P2-2 | Remove duplicate newsletter job tracking model | High | Yes | ready for verification | Unassigned | `server/trpc/router/admin.ts` | Single source of truth for campaign state |
| P2-3 | Harden impersonation route with throttling and audit assurances | High | Yes | ready for verification | Unassigned | `app/api/auth/impersonate/route.ts`, `app/api/auth/impersonate/end/route.ts`, `server/trpc/router/admin.ts`, `server/auth.ts`, `lib/rateLimit.ts`, `lib/impersonationSession.ts`, `components/admin/ImpersonationBanner.tsx`, `components/admin/UserDetailsModal.tsx` | Repeated abuse attempts are throttled and session transitions remain valid |
| P2-4 | Add startup environment validation for critical keys and URLs | High | Yes | done | Unassigned | `instrumentation.ts`, `lib/startupValidation.ts`, `lib/authSecret.ts`, `lib/appUrl.ts`, payment/webhook config surfaces | Missing auth/canonical URL fails fast; missing `ENCRYPTION_KEY` warns at startup and still fails on encryption use |

## Phase 3: Remove Incomplete Live Surfaces

| ID | Title | Severity | Blocker | Status | Owner | Primary Files | Validation |
|---|---|---|---|---|---|---|---|
| P3-1 | Remove demo/mock logic from dashboard | High | Yes | ready for verification | Unassigned | `components/DashboardContent.tsx`, `server/trpc/router/communityUpdates.ts` | Dashboard shows live-backed states only |
| P3-2 | Complete or explicitly gate admin global search | Medium | No | ready for verification | Unassigned | `components/admin/GlobalSearch.tsx`, `app/admin/users/page.tsx`, `app/admin/payments/page.tsx`, `app/admin/packages/page.tsx` | Search behavior matches operator expectation |
| P3-3 | Replace mock package analytics growth data | Medium | No | ready for verification | Unassigned | `components/admin/PackageAnalytics.tsx`, `server/trpc/router/admin.ts` | Analytics show real or intentionally hidden metrics |
| P3-4 | Decide TechQuiz live status and complete or gate CBT flow | Medium | Yes if live | completed | Unassigned | `components/techquiz/CBTPortalContent.tsx`, `server/trpc/router/techquiz.ts`, `app/admin/techquiz/settings/page.tsx`, `components/techquiz/TechQuizContent.tsx` | CBT workflow is either fully integrated or unavailable in live |

## Phase 4: Regression Prevention

| ID | Title | Severity | Blocker | Status | Owner | Primary Files | Validation |
|---|---|---|---|---|---|---|---|
| P4-1 | Add tests for destructive admin permission boundaries | High | Yes | ready for verification | Unassigned | `tests/unit/**`, admin routers | Admin cannot invoke super-admin-only actions |
| P4-2 | Add tests for payment approval idempotency | High | Yes | ready for verification | Unassigned | `tests/unit/**`, admin payment flows | Duplicate approvals do not duplicate fulfillment |
| P4-3 | Add tests for webhook/admin overlap | High | Yes | ready for verification | Unassigned | `tests/unit/**`, webhook handlers | Concurrent confirmation paths remain safe |
| P4-4 | Add newsletter durability and restart tests | High | Yes | ready for verification | Unassigned | `tests/unit/**`, newsletter services | Newsletter jobs persist and resume correctly |
| P4-5 | Add app URL/environment resolution tests | High | Yes | ready for verification | Unassigned | `tests/unit/**`, `lib/appUrl.ts`, `lib/clientAppUrl.ts`, `lib/email.ts` | Environment-specific links are always correct |
| P4-6 | Add dashboard live-data and non-demo-state tests | Medium | No | ready for verification | Unassigned | `tests/unit/**`, dashboard-related modules | Dashboard does not regress to demo placeholders |

## Verification Checklist

For each item marked `ready for verification`, record:

- implementation PR or commit
- exact files changed
- manual validation steps executed
- automated tests added or updated
- result: `done` or `reopened`

### P1-1 Verification - 2026-05-11

- implementation PR or commit: current working tree changes after `85d39cf1` (not yet committed)
- exact files changed: `server/trpc/router/admin.ts`, `server/services/payment/adminPaymentReview.ts`, `tests/unit/admin-payment-atomicity.test.ts`
- manual validation steps executed: verified both `reviewPayment` and `bulkReviewPayments` now route through the same transactional admin payment review executor so the bulk path no longer bypasses claim/finalize protections
- automated tests added or updated: added `tests/unit/admin-payment-atomicity.test.ts`; ran `npx tsx --test tests/unit/admin-payment-atomicity.test.ts tests/unit/pending-payment-fulfillment.test.ts`
- result: `done`

### P1-2 Verification - 2026-05-11

- implementation PR or commit: current working tree changes after `85d39cf1` (not yet committed)
- exact files changed: `tests/unit/deposit-topup-consistency.test.ts`, `tests/unit/admin-payment-atomicity.test.ts`, `RELEASE_STABILIZATION_TRACKER.md`
- manual validation steps executed: confirmed wallet initiation writes new funding requests as `DEPOSIT`, while admin review, payment verification, and stuck-payment recovery all treat `TOPUP` only as a legacy alias that resolves into the same `DEPOSIT` transaction lookup path
- automated tests added or updated: added `tests/unit/deposit-topup-consistency.test.ts`; updated `tests/unit/admin-payment-atomicity.test.ts`; ran `npx tsx --test tests/unit/deposit-topup-consistency.test.ts tests/unit/admin-payment-atomicity.test.ts tests/unit/pending-payment-fulfillment.test.ts`
- result: `done`

### P1-3 Verification - 2026-05-11

- implementation PR or commit: existing shared-guard implementation verified in current `main` after `8d4e45ee`
- exact files changed: `RELEASE_STABILIZATION_TRACKER.md`
- manual validation steps executed: inspected `claimPendingPayment()` and `markPendingPaymentReviewed()` in `server/services/payment/pendingPaymentFulfillment.ts` and confirmed those guards are invoked from admin review, package verification, crypto webhook, Paystack webhook, Flutterwave webhook, and recover-stuck-payments flow
- automated tests added or updated: ran `npx tsx --test tests/unit/pending-payment-fulfillment.test.ts`
- result: `done`

### P2-4 Verification - 2026-05-11

- implementation PR or commit: current working tree changes after `85d39cf1` (not yet committed)
- exact files changed: `lib/startupValidation.ts`, `tests/unit/startup-validation.test.ts`, `RELEASE_STABILIZATION_TRACKER.md`
- manual validation steps executed: reviewed `instrumentation.ts` startup hook wiring and verified production validation behavior remains fail-fast for auth/canonical URL while surfacing missing `ENCRYPTION_KEY` at boot
- automated tests added or updated: added `tests/unit/startup-validation.test.ts`; ran `npx tsx --test tests/unit/startup-validation.test.ts`; ran `npx tsx --test tests/unit/app-url-resolution.test.ts`
- result: `done`

## Decision Log

Use this section to record non-code decisions that affect release readiness.

| Date | Decision | Reason | Owner |
|---|---|---|---|
| 2026-05-04 | Tracker created from full codebase audit | Needed to convert findings into actionable stabilization work | Copilot |
| 2026-05-11 | Temporarily removed `ENCRYPTION_KEY` startup hard-fail from production boot validation | Live production recovery required availability before a safer runtime enforcement strategy could be restored | Copilot |
| 2026-05-11 | Finalized startup validation policy to warn once for missing `ENCRYPTION_KEY` while keeping auth secret and canonical URL as hard startup blockers | Preserves production availability, makes missing encryption capability visible at boot, and keeps encryption operations fail-closed at runtime | Copilot |

## Recommended Working Order

1. Finish all Phase 0 items.
2. Do not begin broad refactors until Phase 1 blockers are underway.
3. Treat Phase 2 as required before any production confidence claim.
4. Use Phase 3 to remove false-confidence surfaces.
5. Close Phase 4 before final release signoff.

## Immediate Recommendation

If proceeding from this tracker without further planning, start with Batch A exactly as defined above and keep the batch narrow. Do not mix Batch A with payment lifecycle refactors in the same implementation pass.