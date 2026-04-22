# Plan: USDT Deposit Fee + Basqet Confirmation Flow + Audit Trail (FINAL)

## TL;DR
- Add admin-configurable processing fee (`USD_DEPOSIT_FEE`) to USDT deposits. Fee is immediate revenue (Basqet set to "Customer Pays" so their settlement fee is absorbed by the user on top, not by BPI). No fee reconciliation needed.
- Enforce correct Basqet blockchain-confirmation flow: NO wallet credit until `payment.received` webhook. Handle all 3 webhook events.
- Capture full Basqet API request/response payloads in PendingPayment.metadata for audit trail.
- Add poll-fallback status endpoint for frontend to check payment status when webhook is delayed.
- Fix verify endpoint bug (reads `amount_paid` from verify response, but docs confirm only `data.status` is returned).

Fee math (all amounts admin-configurable, NOT hardcoded):
$2.00 deposit → $0.15 VAT (7.5%) → $2.00 processing fee (from USD_DEPOSIT_FEE setting) → Basqet invoice = $4.15 USDT
- $0.15 → VAT transaction (tax record only, NOT revenue)
- $2.00 → USDT_DEPOSIT_FEE transaction (immediate revenue)
- $2.00 → DEPOSIT transaction (credited to user wallet)

Same applies to USDT withdrawals: USD_WITHDRAWAL_FEE (already exists) → USDT_WITHDRAWAL_FEE transaction as revenue.

---

## Phase 1 — Revenue service: add DEPOSIT_FEE source (no dependencies) ✅ COMPLETE
**`server/services/revenue.service.ts`**
- Added `"DEPOSIT_FEE"` to the `RevenueSource` union type (inserted after `"WITHDRAWAL_FEE"`)

---

## Phase 2 — BasqetClient: audit payloads + fix verify bug (no dependencies) ✅ COMPLETE
**`server/services/payment/BasqetClient.ts`**
- Added `auditLog: { initBody, initResponse, payBody, payResponse }` to `BasqetPayinInitResult` interface
- `initializeBasqetPayin`: extracted `initBody` and `payBody` variables before fetch calls so they can be captured in `auditLog` on return
- Fixed `verifyBasqetPayin`: removed `amount_paid`/`payment_amount` reads from the type and return value (those fields don't exist in the verify endpoint response per docs). `amountReceived` now returns `0` from verify (amount only comes from webhooks).
- Added `auditLog?: { requestBody: object; response: object }` to `BasqetPayoutResult` interface
- `initiateBasqetUsdtPayout`: extracted `requestBody` before fetch and added `auditLog` to return value

---

## Phase 3 — CryptoGateway: propagate audit log (depends on Phase 2) ✅ COMPLETE
**`server/services/payment/CryptoGateway.ts`** (Basqet case in `initializePayment`)
- Added optional `auditLog?: object` field to `CryptoProviderResult` interface
- `initBasqetPayin` now passes `auditLog: result.auditLog` in its return value
- `initializePayment` metadata return now includes `...(result.auditLog ? { basqetAudit: result.auditLog } : {})` so the audit data flows into `PendingPayment.metadata`

---

## Phase 4 — wallet.ts: apply deposit processing fee (depends on Phase 1) ✅ COMPLETE
**`server/trpc/router/wallet.ts`** (crypto deposit section ~line 390)
- Added `DEFAULT_USD_DEPOSIT_FEE = 2` constant (fallback only — real value from DB)
- Inside `if (paymentGateway === 'crypto')` block: loads `processingFeeUsd = await getAdminSetting('USD_DEPOSIT_FEE', DEFAULT_USD_DEPOSIT_FEE)`
- Updated `originalAmount` in metadata to include processing fee: `originalAmount + (originalAmount * vatRate) + processingFeeUsd` — this is the total USDT Basqet invoices
- Added `processingFeeAmount: processingFeeUsd` and `basqetAudit: result.metadata?.basqetAudit` to `PendingPayment.metadata`
- `Transaction.amount` stays as base `amount` (user's wallet credit, unchanged)

---

## Phase 5 — Webhook: all 3 Basqet events + fee revenue (depends on Phases 1, 2) ✅ COMPLETE
**`app/api/webhooks/crypto/route.ts`**
- Added `import { recordRevenue }` from revenue service
- `handleBasqetWebhook`: now maps all 3 events to internal statuses: `blockchain_awaiting` (payment.pending), `successful` (payment.received + SUCCESSFUL), `abandoned`/`overpaid`/`underpaid` (payment.abandoned)
- POST handler `basqet` case: routes non-payment events to dedicated handlers with early return before generic `processConfirmedCryptoPayment`
- Added `processBasqetPending`: updates PendingPayment status to `blockchain_awaiting`, notifies user "Payment detected, awaiting confirmation"
- Added `processBasqetAbandoned`: sets PendingPayment to `abandoned`, Transaction to `failed`, notifies user
- Added `processBasqetMismatch`: sets PendingPayment to `overpaid`/`underpaid` status for admin review, does NOT credit wallet
- `processConfirmedCryptoPayment`: reads `processingFeeAmount` from metadata; after VAT tx creates `USDT_DEPOSIT_FEE` transaction + calls `recordRevenue(source: "DEPOSIT_FEE", currency: "USD")`

---

## Phase 6 — Admin manual approval: mirror fee recording (depends on Phase 1) ✅ COMPLETE
**`server/trpc/router/admin.ts`** (DEPOSIT/TOPUP approval branch ~line 1645)
- Added `processingFeeAmount = Number(metadata.processingFeeAmount || 0)` alongside `depositAmount`/`vatAmount`
- After VAT tx: same `USDT_DEPOSIT_FEE` transaction + `recordRevenue(source: "DEPOSIT_FEE", currency: "USD")` call as Phase 5 (guarded by `processingFeeAmount > 0` so non-crypto deposits are unaffected)

---

## Phase 7 — Financial summary: include deposit fees (depends on Phase 1) ✅ COMPLETE
**`server/trpc/router/admin.ts`** (`getFinancialSummary` ~line 7121)
- Added `depositFeesRaw` aggregate: `transactionType: "USDT_DEPOSIT_FEE"`, `status: "completed"`
- Added `depositFees` constant and returned it as `inflows.depositFees`
- Updated `inflows.total` to include `depositFees`

---

## Phase 8 — Poll-fallback status endpoint (no dependencies) ✅ COMPLETE
**New: `app/api/payments/crypto-status/[reference]/route.ts`**
- GET: requires session auth (userId from session); returns 401 if unauthenticated
- Security: verifies the reference belongs to the authenticated user (queries by `userId` + `gatewayReference`); returns 404 if not found (no information leak)
- Terminal state fast-path: if DB status is already `completed/approved/abandoned/failed`, returns immediately without calling Basqet
- Calls `verifyBasqetPayin` only when `cryptoGw.apiProvider === "basqet"` and keys are configured; falls through to DB status on Basqet API error
- Rate-limited via `applyRateLimit` + `webhookLimiter` (60/min)
- Maps DB status values to canonical Basqet status strings for consistent frontend consumption

---

## Phase 9 — Admin settings UI: deposit fee card (no dependencies) ✅ COMPLETE
**`app/admin/settings/page.tsx`**
- Added `UsdDepositSettingsCard` component: mirrors `UsdWithdrawalSettingsCard` structure with blue/indigo gradient accent
- Single field: `USD_DEPOSIT_FEE` with `$` prefix, step=0.01, default display $2.00
- Live preview panel: "Example ($100.00 deposit): $100.00 base + 7.5% VAT ($7.50) + $X processing fee = $Y USDT invoiced. User wallet credited: $100.00"
- "Save Deposit Settings" button → calls `onSave('USD_DEPOSIT_FEE', feeValue, description)` via `updateSystemSetting`
- Rendered in the payments tab directly below `UsdWithdrawalSettingsCard`

---

## Relevant Files
- `server/services/revenue.service.ts`
- `server/services/payment/BasqetClient.ts`
- `server/services/payment/CryptoGateway.ts`
- `server/trpc/router/wallet.ts`
- `app/api/webhooks/crypto/route.ts`
- `app/api/payments/crypto-status/[reference]/route.ts` (new)
- `server/trpc/router/admin.ts`
- `app/admin/settings/page.tsx`

---

## Final Decisions
- Processing fee = immediate revenue. Basqet set to "Customer Pays" → Basqet's own fee added on top by Basqet, not deducted from BPI's $2.00. Zero reconciliation step needed.
- Fee amount is NOT hardcoded. Always loaded from `getAdminSetting('USD_DEPOSIT_FEE', DEFAULT_USD_DEPOSIT_FEE)`. Admin controls it from the settings panel.
- No wallet credit on `payment.pending` — only on `payment.received` (SUCCESSFUL) via webhook.
- `basqetAudit` stored in PendingPayment.metadata JSON (no Prisma schema migration needed).
- Verify endpoint bug fix included.
- `USDT_DEPOSIT_FEE` transaction type (deposit) / `USDT_WITHDRAWAL_FEE` (withdrawal, already tracked as WITHDRAWAL_FEE — align naming).
