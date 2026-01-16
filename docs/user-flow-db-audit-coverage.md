# User-Facing DB Audit Coverage Map

Date: 2026-01-16

This document maps audited user-facing flows to the Playwright spec(s) that exercise them and the concrete database assertions they make (via Prisma).

> Notes
> - “DB assertions” below means the spec explicitly queries the database and asserts rows/fields, not just UI rendering.
> - Some specs also perform DB *preconditioning* (e.g., ensuring a QA user is “dashboard-ready”); those prep steps are not counted as DB assertions unless the spec explicitly checks the DB afterward.

---

## Auth & navigation

### Unauthenticated redirect + basic authenticated page render
- Spec: `tests/user-auth-navigation.spec.ts`
- DB assertions: none (UI/navigation-only)

### End-to-end UI happy path surface check
- Spec: `tests/smoke-user-flows.spec.ts`
- DB assertions: none (UI-only; best-effort interactions)

---

## Admin UI DB audit coverage

This section covers admin-panel UI flows that are audited end-to-end via Playwright and validated with direct Prisma DB assertions.

> How to run
> - `npm run smoke:admin-ui`
> - Uses deterministic QA admin: `qa.admin@example.com` / `Passw0rd!` (seeded in `scripts/seedTestUsers.ts` and ensured in test helpers)

### Admin login → dashboard stats reflect DB
- Spec: `tests/admin-ui-db-audit.spec.ts`
- DB assertions:
  - `User`
    - total users shown in UI equals `prisma.user.count()`
  - `PendingPayment`
    - pending count shown in UI equals `prisma.pendingPayment.count({ where: { status: "pending" } })` (with deterministic seed row)

### Admin users page search is DB-backed
- Spec: `tests/admin-ui-db-audit.spec.ts`
- DB assertions:
  - `User`
    - a known seeded user exists in DB and is returned/rendered by the admin UI table after search

### Admin payments pending review → approve updates DB correctly
- Spec: `tests/admin-ui-db-audit.spec.ts`
- DB assertions:
  - `PendingPayment`
    - status transitions `pending → approved`
    - `reviewedBy` is set to the logged-in admin user
    - `reviewedAt` is set
  - `User`
    - wallet increments by approved `PendingPayment.amount`
  - `Transaction`
    - `DEPOSIT` transaction row exists with `reference = gatewayReference` and `status = completed`

### Admin reports show totals matching Prisma aggregates
- Spec: `tests/admin-reports-db-audit.spec.ts`
- DB assertions:
  - `Transaction`
    - report “Total Revenue” matches sum of completed positive transactions in the allowed types over the last 30 days
    - report “Transactions” matches the same row count
  - `User`
    - report “Total Registrations” matches user count created in last 30 days
    - report “Total Activations” matches users with `membershipActivatedAt` in last 30 days

### Admin settings update persists to AdminSettings
- Spec: `tests/admin-settings-db-audit.spec.ts`
- DB assertions:
  - `AdminSettings`
    - updating `support_email` via UI persists `adminSettings.settingValue`
    - test restores the original value to avoid leaving config drift in dev DB

### Admin help: DB audit coverage page renders
- Spec: `tests/admin-ui-db-audit.spec.ts`
- DB assertions: none (renders markdown view; build/runtime wiring check)

---

## Registration

### Register via UI creates a real user
- Spec: `tests/user-registration-db-audit.spec.ts`
- DB assertions:
  - `User`
    - row exists for generated email
    - `email` matches
    - `name` matches screenname
    - `passwordHash` is set (non-null)

---

## Password reset

### Forgot password creates token; reset consumes it and changes password hash
- Spec: `tests/user-password-reset-db-audit.spec.ts`
- DB assertions:
  - `PasswordReset`
    - a row is created for the user after requesting reset
    - the specific `token` is later marked `used = true`
  - `User`
    - `passwordHash` changes after setting a new password

---

## Wallet: deposit / withdrawal

### Mock deposit + cash withdrawal write correct wallet deltas and transaction rows
- Spec: `tests/user-wallet-db-audit.spec.ts`
- DB assertions:
  - `User`
    - `wallet` increments by deposit amount
    - `wallet` decrements by withdrawal amount + fee
  - `Transaction`
    - DEPOSIT transaction row exists (amount = +depositAmount, status `completed`)
    - VAT transaction row exists for the deposit (status `completed`)
    - WITHDRAWAL_CASH transaction row exists (amount = -withdrawalAmount, status `processing|completed|pending`)
    - WITHDRAWAL_FEE transaction row exists (amount = -fee, status `completed`)

---

## Membership

### Wallet-based activation writes membership fields and tx rows
- Spec: `tests/user-membership-activation-db-audit.spec.ts`
- DB assertions:
  - `User`
    - `activeMembershipPackageId` set to selected package
    - `activated = true`
    - `membershipActivatedAt` set
    - `membershipExpiresAt` set and later than `membershipActivatedAt`
    - `wallet` decremented by total cost (price + VAT)
  - `Transaction`
    - MEMBERSHIP_PAYMENT exists (amount = -totalCost, status `completed`)
    - MEMBERSHIP_ACTIVATION exists (amount = -totalCost, status `completed`)
    - VAT exists when applicable (amount = VAT, status `completed`)

### Mock upgrade writes new package + upgrade tx rows (wallet should not change)
- Spec: `tests/user-membership-upgrade-db-audit.spec.ts`
- DB assertions:
  - `User`
    - `activeMembershipPackageId` updated to target package
    - membership timestamps exist
    - `wallet` unchanged (mock payment path)
  - `Transaction`
    - `membership_upgrade` exists (amount = -upgradeCost, status `completed`)
    - VAT differential transaction exists when applicable
    - confirms wallet-only `MEMBERSHIP_UPGRADE` tx is NOT present for this flow

### Wallet-based upgrade decrements wallet and writes wallet-upgrade tx rows
- Spec: `tests/user-membership-upgrade-wallet-db-audit.spec.ts`
- DB assertions:
  - `User`
    - `wallet` decremented by upgradeCost
    - `activeMembershipPackageId` updated
    - `membershipActivatedAt`/`membershipExpiresAt` exist and are ordered correctly
  - `Transaction`
    - MEMBERSHIP_UPGRADE exists (amount = -upgradeCost, status `completed`)
    - `membership_upgrade` exists (amount = -upgradeCost, status `completed`)
    - VAT differential exists when applicable

---

## Receipts

### Receipt endpoints return HTML for owned transactions
- Spec: `tests/user-receipts-db-audit.spec.ts`
- DB assertions:
  - `Transaction`
    - a completed DEPOSIT transaction exists (used to fetch receipt)
    - a WITHDRAWAL_CASH transaction may exist and, if completed, is used to fetch withdrawal receipt
  - API assertions (auth + ownership enforced server-side):
    - `GET /api/receipt/deposit/:transactionId` returns HTTP 200 and HTML
    - `GET /api/receipt/withdrawal/:transactionId` returns HTTP 200 and HTML (only if a completed withdrawal exists)

### Receipt button opens the correct receipt URL in a new tab
- Spec: `tests/user-receipts-ui-download.spec.ts`
- DB assertions:
  - `Transaction`
    - completed DEPOSIT transaction exists and is used to locate the matching receipt card
  - UI/API assertion:
    - popup URL contains `/api/receipt/deposit/<dbTransactionId>`

---

## Transactions export

### Export CSV contains DB-backed transaction reference
- Spec: `tests/user-transactions-export-db-audit.spec.ts`
- DB assertions:
  - `Transaction`
    - completed DEPOSIT exists with a non-null `reference`
  - File assertion:
    - downloaded CSV includes the deposit `reference` and `DEPOSIT` row

---

## YouTube community flows

### Purchase YouTube plan debits wallet and creates provider + draft channel
- Spec: `tests/user-youtube-plan-purchase-db-audit.spec.ts`
- DB assertions:
  - `YoutubeProvider`
    - exists for user
    - `youtubePlanId` matches selected plan
    - `balance` equals plan `totalSub`
  - `YoutubeChannel`
    - a DRAFT exists for user
    - `status = DRAFT`
    - `isVerified = false`
    - `verificationCode` is present
  - `User`
    - wallet delta equals plan total cost (amount + VAT)
  - `Transaction`
    - debit rows exist with descriptions containing “YouTube Growth” and “VAT - YouTube” (status `completed`)

### Browse/subscribe creates a pending subscription row
- Spec: `tests/user-youtube-browse-subscribe-db-audit.spec.ts`
- DB assertions:
  - `ChannelSubscription`
    - row exists for `(subscriberId, channelId)`
    - `status = pending`

### Submit channel transitions draft → submitted and persists fields
- Spec: `tests/user-youtube-channel-submit-db-audit.spec.ts`
- DB assertions:
  - `YoutubeChannel`
    - for the captured draft id:
      - `status = SUBMITTED`
      - `isVerified = false`
      - `verificationCode` remains present
      - `channelName`, `channelUrl`, `channelLink` match submitted values

### Claim earnings credits wallet, marks subscription paid, and records earning + tx
- Spec: `tests/user-youtube-claim-earnings-db-audit.spec.ts`
- DB assertions:
  - `ChannelSubscription`
    - `status = paid`
    - `paidAt` is set
  - `User`
    - subscriber wallet increases by +40
  - `UserEarning`
    - subscription earning exists with `amount = 40`, `isPaid = true`, `type = subscription`
  - `Transaction`
    - credit tx exists with description containing “Youtube Subscription Earnings”, `amount = 40`, `status = completed`

### Claim earnings is idempotent (double-claim credits once)
- Spec: `tests/user-youtube-claim-idempotent-db-audit.spec.ts`
- DB assertions:
  - `User`
    - wallet increases by +40 exactly once
  - `UserEarning`
    - count of paid subscription earnings for `(userId, channelId)` is exactly 1
  - API assertion (protected tRPC):
    - first call returns `amount = 40`
    - second call returns `amount = 0`

### Claim fails when provider balance is exhausted (no credit)
- Spec: `tests/user-youtube-claim-no-balance-db-audit.spec.ts`
- DB assertions:
  - `User`
    - subscriber wallet unchanged
  - `ChannelSubscription`
    - remains `status = pending`

### Claim credits referrer (+10) when referral exists
- Spec: `tests/user-youtube-claim-referral-db-audit.spec.ts`
- DB assertions:
  - `User`
    - subscriber wallet +40
    - referrer wallet +10
  - `UserEarning`
    - referrer earning exists with `type = referral`, `isPaid = true`, `amount = 10`
