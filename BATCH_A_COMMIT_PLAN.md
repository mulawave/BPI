# Batch A Commit Plan

Generated: 2026-05-04

Purpose: Break Batch A into small, reviewable implementation units before code changes begin.

Related documents:

- FULL_CODEBASE_AUDIT_REPORT.md
- RELEASE_STABILIZATION_TRACKER.md
- BATCH_A_IMPLEMENTATION_CHECKLIST.md

## Commit Strategy

Batch A should be implemented in 4 commits or PR slices.

Keep each slice narrowly scoped. Do not mix unrelated fixes just because they are all in Phase 0.

## Commit 1: Enforce Security-Critical Config

Scope:

- `P0-1` Remove fallback encryption key

Target files:

- `server/utils/encryption.ts`
- any startup/config validation file introduced or updated to enforce required env presence

Goals:

- remove the hardcoded fallback encryption key
- fail fast if `ENCRYPTION_KEY` is missing
- ensure the failure is deterministic and early

Validation:

- startup fails without `ENCRYPTION_KEY`
- startup succeeds with `ENCRYPTION_KEY`
- no alternate encryption helper still carries a silent fallback

Suggested commit message:

- `Enforce required encryption key configuration`

## Commit 2: Re-lock Admin Destructive Boundaries

Scope:

- `P0-2` Restrict destructive admin procedures to super admin

Target files:

- `server/trpc/router/admin.ts`
- any related admin UI surface if visibility needs adjustment

Goals:

- bind destructive procedures to `superAdminProcedure`
- preserve non-destructive admin access
- optionally hide destructive controls from regular admins

Validation:

- admin cannot invoke destructive procedures
- super admin can invoke destructive procedures
- normal admin pages continue to work

Suggested commit message:

- `Restrict destructive admin actions to super admins`

## Commit 3: Remove Unsafe Mock Payment Exposure

Scope:

- `P0-3` Disable mock payment outside explicitly safe environments

Target files:

- `server/services/payment/PaymentGatewayFactory.ts`
- `server/services/payment/PaymentProcessor.ts`
- `app/membership/activate/[packageId]/page.tsx`
- `components/wallet/DepositModal.tsx`
- any other UI or backend surface that exposes mock payment

Goals:

- define one authoritative rule for mock payment availability
- apply that rule consistently in backend and UI
- prevent mock payment from appearing or initializing in production-like environments

Validation:

- mock gateway is not shown in production-like UI
- mock gateway cannot be initialized from backend in production-like runtime
- safe dev/test flow still works if intentionally allowed

Suggested commit message:

- `Lock mock payment gateway to safe environments`

## Commit 4: Fix Environment URL and Operator Visibility

Scope:

- `P0-4` Fix hardcoded app URL/domain fallbacks
- `P0-5` Restore truthful admin dashboard payment stats

Target files:

- `lib/appUrl.ts`
- `lib/clientAppUrl.ts`
- `lib/email.ts`
- `server/trpc/router/adminAuth.ts`
- `app/admin/layout.tsx`

Goals:

- remove hardcoded `beepagro.com` runtime fallback from critical flow resolution
- make email and redirect URLs environment-correct
- restore real pending payment counts for admin dashboard badges

Validation:

- email and redirect links resolve correctly for configured environment
- admin dashboard pending-payment badge reflects actual DB data
- no remaining critical hardcoded domain fallback in these paths

Suggested commit message:

- `Fix environment URL resolution and admin payment stats`

## Merge Order

Merge in this order:

1. Commit 1
2. Commit 2
3. Commit 3
4. Commit 4

Reason:

- security and role boundaries first
- environment gating second
- operator correctness and URL hygiene last within Batch A

## Review Guidance

Review each commit against these questions:

1. Did the change stay inside its declared Batch A scope?
2. Did it improve safety without introducing unrelated refactors?
3. Is there an explicit validation step for the changed behavior?
4. Can the commit be reverted independently if needed?

## Exit Criteria For Starting Batch B

Do not begin Batch B until:

- all 4 Batch A commits are merged
- validation is complete for each commit
- no critical regressions were introduced in auth, payment selection, or admin navigation
- tracker items `P0-1` through `P0-5` are updated from `not started`