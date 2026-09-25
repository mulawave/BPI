# BPI Payments & CSP Audit

**Date:** 25 September 2026  
**Fixes:** [mulawave/BPI#31](https://github.com/mulawave/BPI/pull/31), branch `claude/relaxed-noether-0s1a4q`

This report explains why Paystack payments needed admin approval, why CSP releases paid the wrong amounts, and why auto-debit and auto-renewal were inconsistent. It also lists what else stands between the platform and a safe production run.

## Summary

| | |
|---|---|
| Critical issues fixed | 9 |
| High/medium issues fixed | 8 |
| Open items to decide or schedule | 9 |
| Unit tests passing | 657 / 659 (the 2 failures also fail on `main`) |

Each of the three reported problems had concrete root causes in the code, not just flaky gateways. Every fix is in the PR above. The fixes have not been run against a live database or the Paystack sandbox, so test them on staging before release.

---

## 1. Paystack payments needing manual approval

### Critical: the recovery job rejected payments that were still being paid

- **Cause:** two minutes after a payment was created, the job asked Paystack for its status and marked anything other than `success` as *rejected*. An unfinished checkout reports `abandoned`, and a bank transfer in flight reports `ongoing`. When the member finished paying, the webhook only accepted `pending` rows, so it acknowledged Paystack and did nothing.
- **Effect:** members paid and got no value, so an admin had to approve by hand.
- **Fix:** only definitive failures (`failed`, `reversed`, `cancelled`) are rejected, and unpaid payments expire after 24 hours. Webhooks and the verify page now accept a late, verified success on an expired payment.

### Critical: the recovery and auto-renewal jobs were never scheduled

- **Cause:** the PM2 `bpi-cron` worker only ran executive payouts and two CSP sweeps. Stuck-payment recovery and membership renewal existed only as HTTP routes that nothing called.
- **Fix:** recovery now runs every 5 minutes and renewal runs daily at 06:10 WAT. Guards stop runs from overlapping.

### Critical: deposits were never verified when members returned from Paystack

- **Cause:** wallet deposits redirected straight to `/dashboard`, so crediting depended entirely on the webhook. A separate `wallet.verifyPayment` endpoint could double-credit a deposit and left it in the admin queue.
- **Fix:** deposits now return through the callback to `/payment/verify`, which shows a "confirming" state and retries. The webhooks, the verify page, the recovery job and the old endpoint all share one fulfilment step that can only credit once. Automated bank-transfer deposits are now covered by recovery, and paid amounts are checked.

---

## 2. CSP admin: wrong release amounts and referral capture

### Critical: auto-contributions were never released

- **Cause:** auto-contribute debited the contributor and raised the request's total, but never funded the request's holding wallet. Release paid `min(holding balance, raised)`, so auto-contributed money was left behind. Admin-verified crypto contributions had the same gap.
- **Fix:** all contributions (manual, auto and crypto) go through one ledger (`server/services/csp-ledger.service.ts`) that always funds the holding wallet. Releases pay out the sum of recorded contributions.

### Critical: releases could run twice, and money went missing

- **Cause:** status was checked outside the database transaction, so two clicks could release twice. When the beneficiary had no sponsor, the sponsor share was taken out of the holding wallet and credited to nobody. "Mark complete" on admin default requests used a separate copy of the logic, with no sponsor record, no revenue record and a different final status.
- **Fix:** one release path claims the request atomically. The shares always add up to the total, and the sponsor share goes to the reserve when there is no sponsor. Admin default completion uses the same path.

### High: sponsor rewards didn't appear in referral earnings

- **Cause:** the sponsor share was recorded as `CSP_SPONSOR_REWARD`, but referral earnings and admin reports only count `REFERRAL_*` types.
- **Fix:** it is now recorded as `REFERRAL_CSP_SPONSOR`, and it triggers the sponsor's auto-debit like other referral rewards.

### High: admin page errors and discrepancies

- The admin never saw what a release would pay. The request detail now shows an exact breakdown and asks for confirmation.
- Revenue recording threw an error on a zero amount after the release had already committed, so the admin saw an error for a release that had actually gone through.
- Fully funded requests (`ready_for_release`) disappeared from the overview.
- Completed default requests could be reactivated and collect money again.
- Auto-contribute worked from stale totals, which could flip a funded request back to broadcasting and grant repeat extensions.
- Holding "inflow" transactions stayed *pending* forever after release.

---

## 3. Auto-debit and auto-renewal

### Critical: renewals were free, and upline rewards were paid from nothing

- **Cause:** both the "Renew Now" button and the manual renewal endpoint extended membership and paid upline rewards without charging the member. The code carried a `TODO: Implement actual payment processing`.
- **Fix:** the fee plus VAT is debited from the Main Wallet in the same transaction that extends the membership and pays the rewards. If the balance is short, the member is notified and the daily job retries. Renewal referral rewards are now recorded as `REFERRAL_RENEWAL_*`.

### Critical: anyone could trigger the renewal job

- **Cause:** the cron route accepted any request whose user-agent contained `vercel-cron`, and accepted every request when no secret was set.
- **Fix:** it now requires `CRON_SECRET`, like the other cron routes.

### High: auto-debit only ran on some credit paths

- **Cause:** deposit auto-debit ran only for mock deposits and the unused verify endpoint. It did not run for Paystack/Flutterwave webhooks, recovery or admin approval. The balance check and the debit were separate writes, and CSP auto-contribute ran twice after each activation.
- **Fix:** auto-debit is atomic and runs after every deposit path, admin approval, CSP sponsor rewards and renewal rewards.

### High: wallets could be overdrawn

Withdrawals, inter-wallet transfers, user-to-user transfers and CSP reserve transfers checked the balance and then debited in a separate write, so concurrent requests could double-spend. All four now debit only if the balance still covers the amount.

---

## Open items

These are not changed in the PR. Each one needs a decision or its own piece of work.

| Severity | Item | Recommendation |
|---|---|---|
| Decide | Auto-renewal now charges Main Wallets automatically, and members cannot opt out. | Confirm this is intended, or add an opt-out setting before deploying. |
| High | `package-lock.json` is out of sync with `package.json`, so `npm ci` fails. A plain install pulls newer versions that cause 8 type errors (missing lucide icons, recharts types). | Regenerate the lockfile on a clean checkout and pin the affected packages. |
| High | `next.config.mjs` sets `ignoreBuildErrors` and ignores lint during builds, so type errors ship to production. | Re-enable both once the 8 dependency-drift errors are fixed. |
| High | Automatic withdrawals run inside an in-process `setTimeout`. A restart in that window leaves them stuck in "processing". | Move them to a persisted job that the cron worker picks up. |
| High | Payment gateway secret keys are stored in plaintext in `PaymentGatewayConfig`. | Encrypt them at rest with the existing `ENCRYPTION_KEY` utilities. |
| Decide | The CSP system share is credited to the CSP system wallets and is also recorded as revenue that flows into the profit pools, so the same money may be allocated twice. | Choose one destination for each share. |
| Decide | Partial releases pay the beneficiary 80% of the total, but full funding pays the requested amount (about 83%). Admin default requests have no 20% markup. | Confirm both rules. The new release preview shows the exact effect. |
| Medium | Two unit tests fail on `main` (`dashboard-live-data`, `csp-broadcast-visibility-guard`), and the repo has no CI workflow. | Fix the tests and add CI that runs type-check, tests and lint on every PR. |
| Medium | The rate limiter is in memory, which is fine for today's single PM2 process. | Move it to a shared store before running in cluster mode. |

---

## Deploy checklist

1. Deploy the PR to staging. Make a test Paystack deposit, a membership payment and a bank-transfer payment, and confirm each is credited without admin action.
2. In the Paystack dashboard, set the webhook URL to `https://<your-domain>/api/webhooks/paystack`. The key saved in Admin → Payment Gateways must be in the same mode (test or live) as that dashboard, or every webhook fails the signature check.
3. Make sure `CRON_SECRET` is set. The renewal route no longer accepts `AUTH_CRON_SECRET`.
4. Restart both PM2 processes with `pm2 restart beepagro-v3 bpi-cron`. The cron log should list the recovery and renewal schedules.
5. Run `npm run reconcile:payments-csp -- --days=60` to list members who paid but were never credited, and CSP releases that under-paid. Add `--apply` to credit the confirmed deposits, and approve the other listed payments from Admin → Payments.
6. Watch the first few recovery runs in `logs/cron-out.log`.

---

## What is working

- Paystack webhook signature verification, and the shared claim guard that stops two processes from fulfilling the same payment.
- Membership activation and upgrade are idempotent, so they are safe to retry by payment reference.
- Admin payment approval is atomic and covered by tests.
- Referral sync is transactional. Admin role checks protect the CSP, admin and utility routes, and all other cron routes check `CRON_SECRET`.
- Security headers are set, and API responses use no-store caching.
