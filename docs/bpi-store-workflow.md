# BPI Store – Actionable Workflow & Implementation Steps

## 0) Objectives
- Deliver a hybrid commerce engine (fiat + token) with configurable rewards and strict token-usage rules.
- Ensure compliance, auditability, and token-utility reinforcement (BPT + utility tokens such as PACT).

## 1) Data Models (MVP)
- Product
  - Fields: product_id (PK), name, description, product_type (physical | digital | license | service | utility), base_price_fiat, accepted_tokens[], token_payment_limits (per token %), reward_config_id (FK), inventory_type (unlimited | limited | time-bound), status (active | paused | retired).
- RewardConfig
  - Fields: reward_id (PK), reward_type (CASH | CASHBACK | BPT | UTILITY_TOKEN), reward_value, reward_value_type (FIXED | PERCENTAGE), vesting_rule (instant | delayed | milestone), max_reward_cap (optional), utility_token_symbol (optional).
- Order
  - Fields: order_id (PK), user_id (FK), product_id (FK), quantity, pricing_snapshot (fiat price, token limits, token rates), payment_breakdown (fiat_amount, token_amounts by symbol), status (pending | paid | completed | failed | refunded), reward_settlement_state, created_at, updated_at.
- Ledger / Wallets
  - Fiat wallet (store/fiat balance), cashback wallet (store credit), token wallets/pools (BPT + utility), reward pools per token.
- TokenRate
  - Fields: symbol, rate_to_fiat, source (fixed | admin_daily | oracle_future), effective_at.

## 2) Admin Surfaces
- Product CRUD: define product_type, base_price_fiat, accepted_tokens, per-token % limits, inventory type, status.
- Reward Config CRUD: reward type(s), value, value type, vesting rule, max cap, token symbol.
- Token Rates: manage fixed/internal rates (phase 1), optional daily override.
- Switches: pause product, pause rewards, emergency disable checkout, adjust token % limits.
- Reporting: token usage per product, rewards issued per period, fiat vs token revenue split, cashback liabilities, token pool balances.

## 3) Checkout Engine (Core Flow)
1) Load product and pricing snapshot (base_price_fiat, token limits, accepted_tokens, reward_config_id).
2) Resolve token rates (fixed/internal for MVP).
3) Enforce token usage rules: cap each token contribution to its % limit; reject invalid tokens.
4) Compute payment split per product:
   - token_portion = base_price_fiat × allowed_token_% (per token symbol)
   - fiat_portion = base_price_fiat − Σ token_portions
5) Validate utility token rules (discounts, coverage %, access gating, fee reduction).
6) Build payment intent:
   - Fiat gateway payload (amount = fiat_portion)
   - Token gateway payload (amounts per symbol = token_portions converted to token units)
7) Execute payments (fiat + token). Require both confirmations before completion.
8) On success: create order record (completed), trigger reward engine; on failure: mark failed and rollback reservations.

## 4) Reward Engine
- Input: order completion event + reward_config snapshot.
- Logic per reward_type:
  - CASH: credit fiat_wallet.
  - CASHBACK: credit store_wallet (cashback ledger).
  - BPT: transfer/mint from BPT reward pool.
  - UTILITY_TOKEN: transfer/record entitlement for the utility token.
- Apply reward_value_type (FIXED or PERCENTAGE of order total), enforce max_reward_cap, honor vesting_rule (instant/delayed/milestone).
- Record reward issuance in audit log; update outstanding liabilities (cashback, token pool).

## 5) Utility / Custodian Token Handling
- Eligibility check per product (token must be in accepted_tokens).
- Enforcement: per-token % cap; optional discount or access validation only.
- Examples: PACT provides 10% discount OR covers up to 30% OR validates access without deduction.

## 6) Anti-Abuse & Compliance
- Per-user reward caps; time-based reward throttles; duplicate order detection; cooldowns.
- Admin kill switches: pause product, pause rewards, disable checkout, adjust token limits.
- Segregated reward pools and ledgers for auditability.

## 7) Reporting & Audit
- Dashboards/exports for: token usage per product; rewards by period; fiat vs token revenue; cashback liabilities; token pool balances.
- Store audit log: payment intents, conversions, rewards, admin changes to rates/limits.

## 8) Implementation Steps (Phased)
- Phase 1 (MVP)
  - Build schemas: Product, RewardConfig, Order, TokenRate, Wallets/pools.
  - Admin UI: Product CRUD with token limits; RewardConfig CRUD; TokenRate (fixed/internal) management.
  - Checkout: hybrid split with fixed internal token rates; enforce per-token % limits; fiat gateway stub/integration; token gateway stub (mock transfer) with idempotency.
  - Reward Engine: support CASH, CASHBACK, BPT, UTILITY_TOKEN; fixed/percentage; instant vesting; cap enforcement; write reward ledger.
  - Anti-abuse: per-user reward cap (config), basic duplicate order guard, cooldown window.
  - Reporting: basic queries for token usage, rewards, revenue split.

- Phase 2
  - Add utility token discount/access rules; fee reduction logic; partial fulfillment; inventory reservations.
  - Add daily admin-set token rate override; start wiring oracle feed (read-only) for future.
  - Expand reward vesting (delayed/milestone scheduler); add cashback liability tracking UI.
  - Add pause/resume controls per product and per reward config.

- Phase 3
  - Integrate production fiat gateway; token bridge/contract calls; formalize custody of reward pools.
  - Advanced compliance: velocity rules, enhanced duplicate detection, device fingerprinting.
  - Full audit trails with diff history for admin changes; scheduled reports.

## 9) Tech Notes / Defaults
- Token rates: start with fixed internal rates; persist snapshots on order.
- Conversion: compute token units = fiat_portion_for_token / rate_to_fiat.
- Idempotency: payment + reward operations must be idempotent per order_id.
- Ledgers: separate balances for fiat, cashback, BPT pool, utility token pools.

## 10) One-Liner (for framing)
“The BPI Store lets each product define how much fiat, BPT, or utility tokens can be used at checkout and issues configurable, auditable rewards that reinforce token utility over speculation.”

## 11) Pickup Location / Reward-to-Centers Config
- Store product-level fulfillment metadata: pickup_location_id, delivery_required (bool), reward_to_center_id (optional) for routing rewards/fulfillment.
- Admin UI to configure pickup centers and reward centers; link products to centers; expose in order record and receipts.
