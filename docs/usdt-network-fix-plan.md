## Plan: Fix USDT Network Normalization

Fix the provider-network mismatch at the source by normalizing Basqet pay-response network data before it is stored in payment metadata, then add a read-time fallback for already-created pending payments so wallet deposits and membership activation pages stop showing TRON/TRC20 for BEP20 sessions. The recommended approach is to introduce one shared network-resolution path that prefers explicit provider fields such as `payment_currency`, uses address-format inference only as a secondary hint, and removes the unsafe `TRC20` default for provider-generated sessions.

**Steps**
1. Done — Phase 1: Confirmed and centralized the root cause.
   Review the Basqet pay-in response contract in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/BasqetClient.ts` and the provider-address classifier in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/cryptoAddress.ts`. Define a single normalization rule set: explicit provider network from `payment_currency` wins, address-format inference is fallback-only, and no provider-address session should silently default to `TRC20` when the network is unknown.
2. Done — Phase 2: Extended provider result metadata. Depends on 1.
   Update the Basqet client result shape so the pay response exposes a normalized network field in addition to raw `payment_currency`. Preserve the raw pay response in `auditLog`, but also surface a directly consumable network value for downstream code in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/BasqetClient.ts` and `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/CryptoGateway.ts`.
3. Done — Phase 3: Replaced the unsafe gateway fallback. Depends on 2.
   In `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/CryptoGateway.ts`, resolve `cryptoNetwork`, `providerNetworkExact`, and `networkInstruction` from the new normalization path instead of `describeProviderAddress(...).displayNetwork || request.cryptoNetwork || "TRC20"`. For Basqet provider-address flows, prefer the provider-reported network; use address inference only when the provider did not supply one; keep manual/admin TRC20 defaults limited to manual transfer flows, not provider sessions.
4. Done — Phase 4: Made address classification hint-aware. Depends on 1 and can be implemented in parallel with 2.
   Refactor `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/cryptoAddress.ts` so EVM/0x addresses can accept an optional provider-network hint and return concrete labels such as `BEP20` when the provider already identified the chain. Keep TRON detection exact, and retain defensive guidance text for unknown provider-supplied addresses.
5. Done — Phase 5: Covered both visible payment flows from the shared metadata. Depends on 3.
   Verify that the membership creation paths in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/package.ts` and the wallet deposit creation path in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/wallet.ts` continue to persist the normalized network fields from `payment.metadata` without local overrides. The goal is one source of truth for both membership activation and wallet deposit UX.
6. Done — Phase 6: Added read-time fallback for existing pending sessions. Depends on 2 and 4.
   Update the membership read model in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/package.ts` to derive displayable network guidance from existing stored metadata plus `basqetAudit.payResponse.data.payment_currency` when `meta.cryptoNetwork` is stale, missing, or still reflects the old generic/default value. If wallet deposit retrieval endpoints also expose the same metadata later in the flow, apply the same fallback there. This step ensures already-created BEP20 sessions stop rendering as TRON without waiting for all users to restart payment.
7. Done — Phase 7: Added a repair option for persisted pending-payment metadata. Depends on 6.
   Add a targeted repair option for recent Basqet-created `PendingPayment` rows whose metadata contains `cryptoNetwork: TRC20` while `basqetAudit.payResponse.data.payment_currency` or provider address format indicates BEP20/EVM. Recommended scope: pending or processing crypto payments only. This can be an admin script or one-off repair task in `/Users/user/Documents/brands/BPI v3/active/bpi_main/scripts/` if operationally needed, but it is not required for the first code fix if read-time fallback fully covers active UX.
8. Done — Phase 8: Updated visible guidance behavior where the normalized metadata changes behavior. Depends on 3 and 6.
   Review the membership payment screen in `/Users/user/Documents/brands/BPI v3/active/bpi_main/app/membership/payment/crypto/page.tsx` and the wallet deposit success state in `/Users/user/Documents/brands/BPI v3/active/bpi_main/components/wallet/DepositModal.tsx`. No structural UI redesign is needed; only ensure the pages display the normalized `cryptoNetwork` label and matching instruction text, especially for provider-generated 0x addresses.
9. Done — Phase 9: Added regression tests. Depends on 2, 3, and 4.
   Update `/Users/user/Documents/brands/BPI v3/active/bpi_main/tests/unit/crypto-address.test.ts` so the existing 0x-address expectation no longer encodes the current broken behavior. Add coverage for at least: TRON address => `TRC20`; 0x address with Basqet `USDT_BEP20` hint => `BEP20`; 0x address without hint => non-TRC20 generic provider guidance; pay response network extraction from `payment_currency`; and membership read-model fallback when metadata is stale but `basqetAudit.payResponse.data.payment_currency` is present.
10. Done — Phase 10: Completed code-level verification and validation. Depends on 5, 6, and 9.
   Validate both entry points: wallet deposit initialization and membership activation/upgrade via crypto. Confirm that a Basqet pay response returning `payment_currency` indicating BEP20 and a 0x address produces `cryptoNetwork: BEP20` in the immediate response, in persisted `PendingPayment.metadata`, and in the membership payment page polling response. Also confirm that manual crypto transfer flows in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/payment.ts` still use admin-configured network guidance and are unaffected.

**Relevant files**
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/BasqetClient.ts` — extract normalized provider network from Basqet `payment_currency`, extend `BasqetPayinInitResult`, keep raw pay response for audits.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/CryptoGateway.ts` — replace the `TRC20` fallback for provider sessions and write normalized network metadata once.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/services/payment/cryptoAddress.ts` — make address-description logic provider-hint aware and stop treating all 0x addresses as effectively TRC20-adjacent guidance.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/package.ts` — membership initialization persistence plus `getMembershipCryptoPayment` read-time fallback for stale metadata.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/wallet.ts` — wallet deposit initialization should consume normalized metadata without overriding it.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/app/membership/payment/crypto/page.tsx` — verify displayed network/instruction text matches the normalized metadata.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/components/wallet/DepositModal.tsx` — verify deposit success guidance reflects `BEP20` for provider-generated BEP20 sessions.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/tests/unit/crypto-address.test.ts` — update current assertions and add regression coverage for provider-network hints.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/payment.ts` — confirm manual crypto deposit info remains separate and intentionally uses admin-configured network values.
- `/Users/user/Documents/brands/BPI v3/active/bpi_main/scripts/` — optional location for a one-off metadata repair script if persisted pending rows need backfill.

**Verification**
1. Run targeted unit tests for the address/network resolver and any new Basqet mapping helper, including BEP20 and TRC20 cases.
2. Exercise a wallet deposit initiation against the Basqet path and inspect the returned `cryptoDetails` payload for `cryptoNetwork`, `providerNetworkExact`, and `networkInstruction`.
3. Exercise membership activation and membership upgrade via crypto and verify the created `PendingPayment.metadata` stores the normalized network instead of `TRC20` for BEP20 sessions.
4. Call the membership polling procedure backed by `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/package.ts` using a record with stale metadata plus `basqetAudit.payResponse.data.payment_currency = USDT_BEP20` and verify the UI payload resolves to `BEP20`.
5. Regression-check manual crypto transfer endpoints in `/Users/user/Documents/brands/BPI v3/active/bpi_main/server/trpc/router/payment.ts` to ensure admin-configured manual TRC20 guidance is unchanged.
6. If a repair script is added, run it only against scoped pending/processing Basqet crypto records and confirm before/after metadata changes on a sample set.

**Decisions**
- Included scope: Basqet provider-address USDT flows for wallet deposits, membership activation, and membership upgrades.
- Included scope: immediate-response fix for new sessions and read-time fallback for already-created sessions.
- Optional scope: one-off metadata backfill for active pending records if operations wants data repaired at rest.
- Excluded scope: manual crypto proof submission flow and admin manual transfer settings, except for confirming they remain unaffected.
- Excluded scope: payout/withdrawal network defaults in `initiateBasqetUsdtPayout`, unless a separate bug report confirms user-facing impact there.

**Further Considerations**
1. Recommended normalization source order: explicit provider field (`payment_currency`) -> provider-specific metadata hint -> address-format inference -> generic provider guidance. Avoid defaulting provider sessions to `TRC20`.
2. Recommended label convention: use `BEP20` for user-facing network text when Basqet returns a BEP20/BSC USDT session, and keep `TRC20` only for actual TRON-address sessions.
3. Recommended rollout: ship the code-path fix and read fallback together first; only add the backfill script if operations needs old pending records corrected at rest for reporting or admin tooling.
