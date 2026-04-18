## Plan: Basqet USDT Gateway Integration

Integrate Basqet as an additional crypto provider for both pay-ins and USDT withdrawals, while preserving Nigerian/non-Nigerian policy enforcement and enabling dual-run fallback to existing providers. The recommended approach is to extend the current provider-based crypto architecture (apiProvider switch) for deposits and add a new withdrawal provider layer that supports automated payout execution with resilient fallback and idempotent status handling.

**Steps**
1. Phase 1: Basqet API contract lock and provider strategy
1. Confirm Basqet endpoint contracts and SDK capabilities for: initialize transaction, initiate transaction, verify transaction, webhook signature validation, payout initiation, payout status query, retry semantics, test/live environment behavior, and TRC-20 support discovery. *blocks all implementation steps*
1. Define a normalized provider contract for outbound USDT withdrawals (initiate payout, check payout status, map provider errors, map provider references, idempotency key strategy). Reuse existing transaction metadata patterns to store provider state.
1. Finalize provider selection precedence for dual-run fallback: primary from settings (Basqet), fallback provider order (e.g., current manual/legacy crypto process), and no-fallback cases for irreversible states.

1. Phase 2: Basqet pay-in (crypto deposit/payment) provider wiring
1. Extend crypto provider implementation in payment service so crypto pay-in supports basqet alongside coinbase/nowpayments/binance via existing apiProvider-driven selection. *depends on Phase 1*
1. Add basqet payment initialization flow: create transaction, return hosted payment URL/payment context, persist provider reference and expected amounts in metadata.
1. Add basqet payment verification flow: verify transaction status, normalize to internal PaymentVerification status and amountReceived semantics.
1. Extend unified crypto webhook route to detect and validate basqet webhook signatures and normalize payloads into existing confirmation pipeline.
1. Ensure all existing surfaces keep working with no UI regression because they already route through crypto gateway abstraction: wallet deposits, membership flows, store checkout, empowerment/CSP crypto flows.

1. Phase 3: Automated USDT withdrawal provider layer (Basqet payouts)
1. Introduce provider-aware withdrawal execution path for withdrawalType=usdt with Basqet as automated payout backend. *depends on Phase 1*
1. Preserve existing hard server guards: non-Nigerian enforcement, country-required check, rate limits, PIN, wallet freeze/ban checks, min withdrawal threshold, fee/tax deductions, and status lifecycle safety.
1. Split withdrawal into two stages for reliability: (a) request accepted and ledger deduction/record creation, (b) async provider payout dispatch and reconciliation updates.
1. Implement Basqet payout initiation on accepted USDT withdrawal and store provider metadata: payout id, provider reference, network, payout address, requested amount, provider status snapshots.
1. Replace manual tx-hash-only completion model for Basqet withdrawals with provider-driven completion/rejection transitions while preserving audit history.
1. Add webhook or polling reconciliation for Basqet payout statuses to move transactions through processing/completed/failed/rejected with idempotent guards.
1. Keep fallback logic: if Basqet initiation fails before irreversible send, route to configured fallback flow; if failure occurs after provider acceptance, mark processing with review notes and prevent duplicate sends.

1. Phase 4: Admin operations and controls
1. Extend admin settings to support explicit crypto provider choices including basqet and withdrawal-specific operational fields if needed (e.g., payout mode, fallback policy toggles).
1. Update admin withdrawal management views/actions for provider-backed USDT withdrawals: show provider refs, status timeline, retry/reconcile actions, and clear distinction from legacy manual USDT records.
1. Add admin-safe recovery paths for stuck provider payouts (manual reconcile endpoint/cron path) with strict admin-only access and immutable audit logging.

1. Phase 5: Nigerian/non-Nigerian gating and UX consistency
1. Keep country and currency gating behavior unchanged for user eligibility unless explicitly changed later: Nigerian users remain blocked from USDT withdrawal; non-NGN currency behavior for crypto payment visibility remains intact.
1. If dynamic network list is enabled from Basqet, constrain effective selectable network to TRC-20 in phase 1 while storing provider-supported networks for future rollout.
1. Ensure all user-facing copy and toasts remain policy-consistent for Nigerian and non-Nigerian scenarios, including provider error messages and fallback outcomes.

1. Phase 6: Hardening, observability, and rollout
1. Add idempotency protections for webhook and payout callbacks keyed by provider reference + internal transaction reference.
1. Add structured logging and metrics for Basqet initiation, verification, payout dispatch, webhook processing, reconciliation, and fallback activation.
1. Implement dual-run rollout controls: feature flags/settings to enable Basqet per flow, canary cohorts, and fast rollback to existing providers without schema rollback.
1. Prepare production runbook: credentials rotation, webhook secret rotation, monitoring dashboards, alert thresholds, and incident playbooks.

**Relevant files**
- /Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/CryptoGateway.ts — Add basqet provider init/verify branches and normalized mapping.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/PaymentProcessor.ts — Ensure provider config resolution and fallback-aware orchestration for crypto flows.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/types.ts — Extend provider metadata typing and normalized payout/verification contracts.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/app/api/webhooks/crypto/route.ts — Add basqet webhook detection/verification/normalization.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/wallet.ts — Add provider-aware automated USDT withdrawal dispatch and reconciliation entry points while preserving gates.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/admin.ts — Extend admin USDT operations for provider-backed statuses and recovery actions.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/components/wallet/WithdrawalModal.tsx — Surface provider-backed USDT status messaging where needed (no policy relaxation).
- /Users/user/Documents/brands/BPI v3/active/bpi_main/app/admin/withdrawals/page.tsx — Show provider metadata/status and operational actions.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/app/admin/settings/page.tsx — Add/clarify provider selection and fallback controls.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/payment.ts — Validate compatibility with crypto deposit info/proof flow where Basqet-hosted path is used.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/lib/cryptoRates.ts — Confirm rate usage alignment for Basqet expected fiat/crypto amount calculations.
- /Users/user/Documents/brands/BPI v3/active/bpi_main/tests/** and /Users/user/Documents/brands/BPI v3/active/bpi_main/scripts/** — Add/extend unit/integration/smoke coverage for basqet pay-in/payout and gating.

**Verification**
1. Contract tests against Basqet sandbox for pay-in initialize/initiate/verify and payout initiate/status lifecycle.
1. Webhook signature validation tests with valid/invalid signatures and replay attempts.
1. End-to-end flow tests for each requested surface: wallet deposit, membership, store, empowerment/CSP using basqet provider.
1. USDT withdrawal tests: non-Nigerian success path, Nigerian rejection path, missing-country rejection path, and fallback activation path.
1. Idempotency tests ensuring duplicate webhooks/callbacks do not duplicate fulfillment or payout.
1. Admin workflow tests: view provider metadata, retry/reconcile stuck payouts, and audit log integrity.
1. Regression tests for existing providers to confirm dual-run fallback does not break current coinbase/nowpayments/binance/manual behavior.
1. Manual staging checklist with controlled canary rollout and rollback drill.

**Decisions**
- Included scope: wallet deposits, membership crypto payments, store crypto checkout, empowerment/CSP crypto flows.
- Withdrawal mode: fully automated Basqet payout path (no manual tx-hash requirement for Basqet-native withdrawals).
- Network policy: TRC-20 enforced at launch, while reading provider-supported networks for future expansion.
- Rollout: dual-run with fallback to existing provider flow.
- Explicitly out of scope for phase 1: expanding Nigerian eligibility policy, enabling non-TRC20 execution, and broad UX redesign.

**Further Considerations**
1. Fallback cutoff rule: define exact state boundary where fallback is allowed (before provider accepts payout) vs disallowed (after provider accepts).
1. Reconciliation cadence: choose webhook-only, poll-only, or hybrid reconciliation for payout finalization resilience.
1. Legacy coexistence: determine whether historical manual USDT records should remain editable under existing admin flow or be read-only once Basqet mode is enabled.
