# Batch A Implementation Checklist

Generated: 2026-05-04

Purpose: Convert Batch A from RELEASE_STABILIZATION_TRACKER.md into a concrete implementation checklist for the first stabilization pass.

Source documents:

- FULL_CODEBASE_AUDIT_REPORT.md
- RELEASE_STABILIZATION_TRACKER.md
- BATCH_A_COMMIT_PLAN.md

## Batch Scope

Batch A includes only these items:

- `P0-1` Remove fallback encryption key
- `P0-2` Restrict destructive admin procedures to super admin
- `P0-3` Disable mock payment outside explicitly safe environments
- `P0-4` Fix hardcoded app URL/domain fallbacks
- `P0-5` Restore truthful admin dashboard payment stats

Do not mix Batch A with payment lifecycle refactors, newsletter persistence changes, or dashboard cleanup.

## Delivery Goal

Eliminate the fastest paths to:

- silent security degradation
- destructive admin misuse
- false operator visibility
- wrong-environment links and redirects
- mock payment leakage into live-like deployments

## Recommended Execution Order

1. `P0-1` Remove fallback encryption key
2. `P0-2` Restrict destructive admin procedures to super admin
3. `P0-3` Disable mock payment outside explicitly safe environments
4. `P0-4` Fix hardcoded app URL/domain fallbacks
5. `P0-5` Restore truthful admin dashboard payment stats

## Item-by-Item Checklist

### P0-1 Remove fallback encryption key

Target files:

- `server/utils/encryption.ts`
- any startup/config validation surface that should fail fast if missing

Implementation checklist:

- [x] Remove the hardcoded fallback encryption key
- [x] Make missing `ENCRYPTION_KEY` fail explicitly
- [x] Ensure failure mode is deterministic and early
- [ ] Confirm no other encryption utility duplicates the same fallback pattern

Validation:

- [ ] App fails fast when `ENCRYPTION_KEY` is absent
- [ ] App starts normally when `ENCRYPTION_KEY` is present
- [ ] Existing encrypted values still decrypt under correct key

Notes:

- Prefer startup-time failure over runtime partial behavior.

### P0-2 Restrict destructive admin procedures to super admin

Target files:

- `server/trpc/router/admin.ts`
- any associated admin UI entry points if they must be hidden or disabled for regular admins

Implementation checklist:

- [x] Rebind destructive procedures from `adminProcedure` to `superAdminProcedure`
- [x] Review all backup, restore, truncate, wipe, import, and export table procedures
- [x] Ensure regular admin can no longer invoke them through API
- [x] Ensure super admin retains access
- [ ] Review whether UI should hide these actions from regular admins

Validation:

- [ ] Regular admin receives authorization failure for destructive actions
- [ ] Super admin can still execute allowed actions
- [ ] Non-destructive admin workflows remain unaffected

Notes:

- API restriction is mandatory even if UI hiding is added.

### P0-3 Disable mock payment outside explicitly safe environments

Target files:

- `server/services/payment/PaymentGatewayFactory.ts`
- `server/services/payment/PaymentProcessor.ts`
- `app/membership/activate/[packageId]/page.tsx`
- `components/wallet/DepositModal.tsx`
- any other visible mock-gateway selection surface

Implementation checklist:

- [x] Define a single authoritative rule for when mock payment is allowed
- [x] Ensure mock gateway cannot appear in production-like runtime configuration
- [x] Remove inconsistent environment gating patterns
- [x] Ensure UI and backend use the same rule
- [x] Confirm no hidden route or API can still initialize mock payment when disallowed

Validation:

- [ ] Mock gateway is absent from payment UI in production-like config
- [ ] Mock gateway cannot be initialized via backend in production-like config
- [ ] Dev/test environments still allow it if intentionally configured

Notes:

- The backend restriction is more important than UI removal.

### P0-4 Fix hardcoded app URL/domain fallbacks

Target files:

- `lib/appUrl.ts`
- `lib/clientAppUrl.ts`
- `lib/email.ts`
- any other hardcoded `beepagro.com` references used for redirects or transactional links

Implementation checklist:

- [x] Remove hardcoded primary-domain fallback from runtime URL resolution
- [x] Make email links use resolved base URL consistently
- [x] Ensure client and server URL helpers behave consistently
- [ ] Verify behavior for local, preview, staging, and production configuration

Validation:

- [ ] Redirect URLs resolve correctly in each configured environment
- [ ] Email links point to the intended environment domain
- [ ] No critical user flow depends on a hardcoded domain fallback

Notes:

- Safe explicit configuration is better than guessing the environment URL.

### P0-5 Restore truthful admin dashboard payment stats

Target files:

- `server/trpc/router/adminAuth.ts`
- `app/admin/layout.tsx`
- any related dashboard stats consumer

Implementation checklist:

- [x] Replace hardcoded `0` pending payment count with real data
- [x] Confirm query semantics match what the UI label claims
- [x] Ensure the admin layout badge updates correctly
- [x] Verify no stale migration comment remains if the issue is fixed

Validation:

- [ ] Pending payment badge matches actual DB state
- [ ] Empty state shows `0` only when truly empty
- [ ] Admin layout loads without regression

Notes:

- Prefer correctness over optimistic caching for this operator-facing metric.

## Batch-Level Validation

Before closing Batch A:

- [ ] Type-check passes
- [ ] Any relevant unit tests pass
- [ ] New tests added for authorization and environment gating where practical
- [ ] Manual validation completed for admin auth boundaries and payment UI visibility
- [ ] Manual validation completed for redirect/email link correctness

## Out of Scope for Batch A

Do not pull these into the same change set unless absolutely required:

- payment approval refactor
- webhook/admin idempotency unification
- newsletter durable queue redesign
- dashboard demo-data cleanup
- TechQuiz completion work

## Suggested Commit Strategy

Recommended split if implemented as multiple commits or PRs:

1. Security/config safety
   - `P0-1`
   - `P0-2`

2. Payment environment gating
   - `P0-3`

3. URL and operator correctness
   - `P0-4`
   - `P0-5`

## Completion Definition

Batch A is complete only when:

- all 5 items are implemented
- validation is recorded
- no fallback behavior remains that silently degrades security or environment correctness
- mock payment is impossible in production-like environments
- destructive admin procedures are unavailable to regular admins