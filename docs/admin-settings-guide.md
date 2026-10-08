# Admin Settings Guide

**For:** BPI admins  
**Covers:** the rules decided by corporate in *BPI Platform: Decisions Required* (27–29 September 2026) and *BPI Platform: Follow-up Questions* (6–7 October 2026)

Corporate asked for these rules to be adjustable by an admin, with a clear guide. This page lists every setting, where to find it, its default and what it does. Defaults apply until an admin saves a different value. **A value an admin saved earlier is kept**, so after release check each screen below and update it to match corporate's decisions.

---

## 1. Auto-Debit — Admin → Auto-Debit Alerts

| Setting | Default | What it does |
|---|---|---|
| Compulsory minimum (%) | 10 | Every member's activation, upgrade and renewal referral rewards and CSP sponsor share are auto-debited by at least this percentage into their Community Wallet. Members can choose a higher percentage but cannot go lower or switch it off. Set to 0 to make Auto-Debit optional again. |
| Starting percentage (%) | 15 | What a member starts at before they save their own choice (follow-up Q5). Always at least the compulsory minimum. |
| Allow Auto-Debit on deposits | On | Members may choose to apply Auto-Debit to their deposits (off for each member until they opt in). Switch off to stop deposit Auto-Debit for everyone. |
| Apply to released CSP support | On | Auto-debits the funds a beneficiary receives when their CSP campaign is released. |
| Renewal Reserve share of Auto-Debit (%) | 30 | Of each **reward** Auto-Debit (referral commissions, CSP sponsor share) this share goes to the Renewal Reserve instead of the Community Wallet (follow-up Q5/Q6). Deposits and released CSP funds always go to the Community Wallet in full. |
| Renewal Reserve withdrawal floor (₦) | 500,000 | Members can only move the amount above this balance from the Renewal Reserve to their Main Wallet (follow-up Q7). |

Moving money between a member's own wallets never triggers Auto-Debit.

**Renewal Reserve.** A second balance on each member (visible to them under Wallet → Settings), fed by the share above. Renewals are paid from the Reserve first, then the Main Wallet for any shortfall. Members can move the amount above the withdrawal floor to their Main Wallet at any time.

**Default beneficiaries.** Same page, below the Auto-Debit rules. Richard and Gilead receive, split equally: the CSP sponsor share when a beneficiary has no sponsor, and a member's referral commissions once they have been expired more than 7 days (see "Expired members" below). Only a super admin can change this list.

**Alerts.** The same page lists every failed Auto-Debit and Auto-Contribute, with search (member name, email, username or reason), a type filter and a date range. A banner shows how many failures happened in the last 24 hours. Each row shows the member's current Cash and Community Wallet balances.

---

## 2. CSP — Admin → CSP → CSP Tier Rules

| Setting | Default | What it does |
|---|---|---|
| Default cooling min / max (months) | 24 / 24 | Waiting period applied when a request is approved. When approving, an admin can choose 24, 12 or 6 months. |
| Sponsor count for reduction | 10 | Number of qualifying direct sponsored members that reduces the waiting period. |
| Reduced cooling months | 6 | Waiting period once the sponsor count is met. |
| Sponsor reduction requires KYC | On | Sponsored members must have approved KYC. |
| Sponsor reduction requires Regular Plus | On | Sponsored members must be on Regular Plus or a higher package. |
| Sponsored members must be active | On | Sponsored members' memberships must not have expired. |
| Sponsored member min. contribution (₦) | 10,000 | Each sponsored member must have contributed at least this much to CSP (Tier 1). |
| Auto-apply sponsor reduction | On | Applies the reduction automatically once the member qualifies. |
| Block CSP for expired members | On | A member whose membership has expired cannot raise a request, contribute, or be picked by Auto-Contribute until they renew. |
| Hold release while beneficiary is expired | On | A campaign cannot be released while its beneficiary's membership is expired. Release it once they renew. |
| Release automatically when countdown ends | Off | When off, campaigns that end their countdown wait for an admin to release them. When on, they are released automatically (80% to the member, 20% split 5 / 2 / 2 / 4 / 7). A campaign on hold because the beneficiary has expired still waits for an admin. |

Every change to these settings is recorded in the CSP rule log with the admin's name and the reason entered.

**Reduce a member's waiting period** (Admin → CSP, below the tier rules). Find a member by email, username or ID. You can set their waiting period to 12, 6, 3 or 1 months from the date their support was released, or end it now. A reason is required; it is recorded and the member is notified. The tool can only shorten a waiting period.

---

## 3. How CSP payouts are accounted for

| Share of a released campaign | Where it goes |
|---|---|
| Beneficiary (80%) | Member's Cash Wallet |
| Sponsor (2%) | Sponsor's Cash Wallet (Reserve wallet if there is no sponsor) |
| BPI Profit Pool (5%) | Recorded as company revenue only |
| State (2%), Management (4%), Reserve (7%) | Their CSP wallets only |

Each naira is counted once (corporate decision Q29, option C). Previously all four system shares went to CSP wallets *and* were recorded as revenue.

**Admin-created campaigns** now follow the same 80/20 rule: 80% of what was raised goes to the beneficiary, and 20% is split 5 / 2 / 2 / 4 / 7.

---

## 4. Payments

- **Overpayment:** when a member pays more than the amount due through Paystack or Flutterwave, the payment is fulfilled and the difference is credited to their Main Wallet as "Overpayment credit". If the member opted in to deposit Auto-Debit, it applies to the difference. Paystack fees passed to the member are not counted as an overpayment.
- **Underpayment:** the payment is held for admin review under Admin → Payments.

---

## 5. Membership

- **Grace period:** a member keeps access to the platform for 15 days after their membership expires (setting `membership_grace_days`).
- **Renewal:** members renew at their current package; Regular members are no longer moved to Regular Plus automatically. Paid from the Renewal Reserve first, then the Main Wallet for any shortfall.
- **Reminders:** members are reminded 7 days, 3 days and 24 hours before renewal, in-app and by email, with the amount due and whether their Main Wallet (and Reserve) covers it. The reminders run daily at 6:00 AM (WAT) from the `bpi-cron` process, before auto-renewal at 6:10 AM.
- **Expired members (follow-up Q8):** platform access continues for 15 days after expiry (above). Team commissions (every level, plus the CSP sponsor share) stop after 7 days of expiry and redirect to the default beneficiaries until the member renews; nothing is paid back retroactively. **At this release**, every member already expired gets a fresh 15-day access and 7-day commission grace counted from the release date — run `npx tsx scripts/resetGraceForExpiredMembers.ts --apply` once, right after deploying (dry run first, without `--apply`, to see who it will affect).

## 6. CSP waiting-period reduction by contribution (follow-up Q15)

A member's waiting period drops to 6 months once their contributions to other campaigns during the wait reach a multiplier (setting `csp_wait_reduction_multiplier`, default 3) of everything they themselves contributed before they received support. Replaces the old flat ₦10,000/month rule. Only ever shortens the wait, never extends it.

---

## 7. CSP time extensions (top-up) — Admin → CSP, "CSP time extensions" card

| Setting | Default | What it does |
|---|---|---|
| Enabled | Off | Members can only buy time extensions once an admin turns this on. |
| 24h price (₦) | 10,000 | Fee for a 24-hour extension. |
| 48h price (₦) | 20,000 | Fee for a 48-hour extension. |
| Max extra hours per request | 48 | Total extra broadcast time a single request can gain from extensions. |

Paid from the member's Main Wallet. The fee goes to the member's own Community Wallet and the extension only takes effect once that amount has been contributed (manually or by Auto-Contribute) to a live campaign before its countdown ends — otherwise it is forfeited when the countdown ends or the request releases. A "pre-extension" (bought with no request yet) attaches to the member's very next request and is forfeited if not used then. Member-facing: `components/csp/CspTopUpButton.tsx` (not yet wired into the main CSP dashboard card — usable standalone).

## 8. Healthcare Card — Admin → Healthcare Card

| Setting | Default | What it does |
|---|---|---|
| Subscription price (₦/year) | 30,000 | Yearly fee. |
| Yearly cover (₦) | 300,000 | Resets (does not carry over) on each renewal. |
| Share to Community Wallet (₦) | 10,000 | The rest of the price goes to the BPI Health & Project Account. |
| Monthly usage min/max (%) | 10 / 20 | Bounds on how much of the cover can be used per month. |
| Require Regular Plus from tier # | 2 | Regular is only eligible at Tier 1; Regular Plus+ required from this tier up. |
| Discount, tiers 1-3 / 4-6 / 7+ (%) | 10 / 20 / 40 | Discount on covered services, by the member's CSP tier. |

Member page: `/healthcare` — subscribe/renew, see the card's SSC code and QR, cover remaining and current discount. Admin page: `/admin/healthcare` — settings, manage centres and their services (mark a service "discount only" for products excluded from the cover — the member pays the provider directly at the discounted price), and record a redemption by scanning or typing a member's SSC code. Covered services deduct from the member's cover (capped monthly and yearly) and BPI settles the centre separately (reconciled by an admin, not an automatic bank transfer); discount-only services never touch the cover.

## 9. Special Community Support — Admin → Special Community Support

Admin-only campaigns with no profit motive (e.g. a borehole for a state or LGA). 100% of what is raised goes to the BPI Health & Project Account when released — no 20% fee, no sponsor share. Contributions don't count toward a contributor's own CSP eligibility and aren't picked up by Auto-Contribute (members must give manually). Supporters' names and amounts are shown publicly on the campaign.

## 10. The BPI Health & Project Account

A single system wallet (`server/services/bpiProjectAccount.service.ts`) holds the ₦20,000 health-project share of each Healthcare Card subscription and all Special Community Support payouts. An admin manually disburses from it to the contractor, provider or programme — there is no automatic transfer to an external account.

## Still open

- The "How CSP works" page (text from the CEO).
- The CSP "2x" minimum-funding rule (follow-up Q11/Q22/Q25) is recorded as a decision (`CSP_TWO_X_RULE_BASE` in `server/services/csp-config.service.ts`) but not wired into the broadcast countdown — it changes *when a campaign's countdown starts*, which needs its own careful pass against the live broadcast-sweep logic.
- A known simplification: a contribution a member makes specifically to cover their own time-extension fee still counts toward their CSP tier contribution-right (corporate said it should not); carving that out needs tracking which ledger rows are "topping up an extension" versus ordinary contributions.
