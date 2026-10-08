# Admin Settings Guide

**For:** BPI admins  
**Covers:** the rules decided by corporate in *BPI Platform: Decisions Required* (27–29 September 2026) and *BPI Platform: Follow-up Questions* (6–7 October 2026)

Corporate asked for these rules to be adjustable by an admin, with a clear guide. This page lists every setting, where to find it, its default and what it does. Defaults apply until an admin saves a different value. **A value an admin saved earlier is kept**, so after release check each screen below and update it to match corporate's decisions.

---

## 1. Auto-Debit — Admin → Auto-Debit Alerts

| Setting | Default | What it does |
|---|---|---|
| Compulsory minimum (%) | 10 | Every member's activation, upgrade and renewal referral rewards and CSP sponsor share are auto-debited by at least this percentage into their Community Wallet. Members can choose a higher percentage but cannot go lower or switch it off. Set to 0 to make Auto-Debit optional again. |
| Allow Auto-Debit on deposits | On | Members may choose to apply Auto-Debit to their deposits (off for each member until they opt in). Switch off to stop deposit Auto-Debit for everyone. |
| Apply to released CSP support | On | Auto-debits the funds a beneficiary receives when their CSP campaign is released. |

Moving money between a member's own wallets never triggers Auto-Debit.

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
- **Renewal:** members renew at their current package; Regular members are no longer moved to Regular Plus automatically.
- **Reminders:** members are reminded 7 days, 3 days and 24 hours before renewal, in-app and by email, with the amount due and whether their Main Wallet covers it. The reminders run daily at 6:00 AM (WAT) from the `bpi-cron` process, before auto-renewal at 6:10 AM.

---

## Waiting for corporate

These items are not built yet because corporate's answers are still open (see *BPI Platform: Confirmation and Final Questions*):

- Renewal Reserve (percentage, 70/30 split, ₦500,000 threshold)
- Commissions after day 7 of expiry going to the admin
- The 2× minimum before the 48-hour countdown, and the time-extension (top-up) feature
- Sponsor share to the default beneficiaries when there is no sponsor
- The 3× contribution rule for reducing the waiting period
- Payment expiry times and late-confirmed payments
- Healthcare card and Special Community Support
- The "How CSP works" page (text from the CEO)
