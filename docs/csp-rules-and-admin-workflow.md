# CSP Rules and Admin Workflow

**Prepared for:** BPI corporate, in response to *BPI-CSP User Feedback, System Observations and Items Requiring Confirmation*  
**Date:** 25 September 2026  
**Describes the system as of:** [mulawave/BPI#31](https://github.com/mulawave/BPI/pull/31)

This document explains how the Community Support Program (CSP) works today, using the rules and default values in the code. It answers items 1, 5, 6, 7 and 8 of the feedback document. Items 2, 3 and 4 are fixed in the PR above. Items 9, 10 and 11 are new features, and the questions they raise are listed at the end.

Every value marked *(configurable)* can be changed by an admin under **Admin → CSP**. The number shown is the default.

---

## 1. Auto-Debit and Auto-Contribute (feedback item 1)

These are two separate settings that work in a chain.

**Auto-Debit** moves a percentage of new money from the member's **Cash Wallet** to their **Community Wallet**.

**Auto-Contribute** spends Community Wallet money on live CSP campaigns.

### Conditions for Auto-Debit to run

All of these must be true:

1. The member has switched Auto-Debit on. It is **off by default**.
2. The money is one of the following:
   - A **referral reward** paid into the Cash Wallet: membership activation, renewal, or the CSP sponsor share. This is on by default ("apply to rewards").
   - A **deposit**, but only if the member ticked "apply to deposits". This is **off by default**.
3. The Cash Wallet still holds the amount to be moved when the transfer runs.

The amount moved is the member's chosen percentage of the credit, from 1% to 100% *(member's choice, default 10%)*, rounded down to the nearest naira.

### Conditions for Auto-Contribute to run

1. The member has switched Auto-Contribute on. It is **off by default**.
2. Auto-Contribute is not disabled for everyone, or for this member, by an admin.
3. The Community Wallet holds at least the member's **minimum per contribution** *(member's choice, default ₦500)*.
4. There is at least one live campaign that is not the member's own, and the member has not yet reached their **maximum per campaign** on it *(member's choice, default ₦1,000)*.

Auto-Contribute gives the minimum amount to up to 10 campaigns in turn, oldest first. It keeps going round until each campaign reaches the member's maximum or the Community Wallet runs out.

### Why a credit might not be allocated

- Auto-Debit is off, or the credit type isn't switched on. A deposit is only allocated when "apply to deposits" is ticked.
- **Moving money between the member's own wallets does not trigger Auto-Debit.** This includes moving a bonus from the Rewards Wallet to the Cash Wallet. Only new money coming in counts. *Corporate: tell us if these transfers should count.*
- The Cash Wallet was emptied (for example by a withdrawal) before the transfer ran.
- Auto-Contribute is off, or the Community Wallet is below the member's minimum.
- There are no live campaigns the member can still give to.
- *Before PR #31:* Auto-Debit never ran on real Paystack or Flutterwave deposits, bank transfers or admin-approved deposits. That is the main reason members saw deposits that were not allocated.

### Timing

- **Auto-Debit** runs **immediately** after the credit is recorded.
- **Auto-Contribute** runs immediately after each Auto-Debit. It also runs on a **schedule every 15 minutes** for every member who has it switched on.

### Reporting

- **Members** get a notification for every automatic contribution. They also get one when their Community Wallet runs out; Auto-Contribute stays on and resumes when money arrives. Every transfer appears in the member's transaction history.
- **Admins** can see every automatic contribution under **Admin → CSP Auto-Contribute**, and can switch the feature off for everyone or for one member.
- **Gap:** when an Auto-Debit fails, it is only written to the server logs. Admins are not told. We recommend adding an admin alert for this.

---

## 2. The full CSP workflow (feedback item 5)

| Step | What happens | Who |
|---|---|---|
| 1. Request submitted | The member opens CSP and submits a **National** or **Global** request. The system checks eligibility first (section 3). The campaign target is set to **120% of the amount requested**, with a minimum of ₦10,000 for National and ₦20,000 for Global *(configurable)*. | Member |
| 2. Eligibility checked | Done automatically at submission. The request is saved as **Pending**. | System |
| 3. Admin review | The request appears under **Admin → CSP** with the *Pending* filter. The admin approves it (choosing the countdown and the waiting period: 6, 12, 24 or 36 months) or rejects it with a reason. | Admin |
| 4. Broadcast created | Approval starts the countdown *(configurable, default 48 hours)*. The campaign is shown to eligible members, and National campaigns only to members in the same country. | System |
| 5. Contributions received | Members contribute from their Cash Wallet or Community Wallet, at least ₦500 each *(configurable)*. Auto-Contribute adds to this. All money is held on the campaign until it is released. | Members |
| 6. Campaign ends | Either the target is reached, and the campaign becomes **Ready for Release** straight away, or the countdown ends (section 4). | System |
| 7. Funds released | The admin opens the request and checks the **Release breakdown**, which shows exactly what each party will receive. They then click **Release funds**. A release can only happen once. | Admin |
| 8. Rewards distributed | Released in the same step: the beneficiary's share goes to their Cash Wallet, the sponsor's share to the sponsor's Cash Wallet, and the rest to the system wallets (section 4). | System |
| 9. Records updated | The request is marked **Released**. The member's waiting period starts. Every transaction, the audit record and the member's notification and email are created. | System |

**Test data needed to demonstrate the full flow:**
- One member who meets the eligibility rules in section 3. An admin can instead create an admin campaign (section 5), which skips eligibility.
- Two or three other members with Cash or Community Wallet balances to contribute.
- A sponsor linked to the beneficiary, so the sponsor share can be seen.

---

## 3. Who can request support

These rules are *configurable*.

| Rule | National | Global |
|---|---|---|
| Minimum membership | Regular Plus | Regular Plus |
| Direct referrals holding at least Regular membership | 2 | 10 |
| Total contributed to other members' campaigns | ₦10,000 | ₦20,000 |
| Different campaigns contributed to | 10 | 10 |

**Global** has a second route. A member can also qualify if their own country is activated for Global CSP, they meet the direct-referral and contribution rules, and they have contributed to 10 different campaigns.

When the **tier model** is switched on *(configurable, off by default)*, the most a member can request depends on their **tier**. The tier comes from the total the member has contributed, called their *contribution right*. For example, Tier 1 needs ₦10,000 contributed and allows up to ₦200,000; Tier 12 needs ₦250,000 and allows up to ₦5,000,000.

---

## 4. How money is distributed (feedback item 6)

The split is *configurable* and must add up to 100%. The default is:

| Share | % |
|---|---|
| Beneficiary | 80% |
| BPI Profit Pool (admin) | 5% |
| Direct sponsor | 2% |
| State wallet | 2% |
| Management wallet | 4% |
| Reserve wallet | 7% |

### When the target is reached

The beneficiary receives **exactly the amount they requested**. The target is 120% of that amount, so the extra 20% is shared between the other five destinations, in proportion to their percentages.

*Example:* a member requests ₦100,000, so the target is ₦120,000. When ₦120,000 is raised, the beneficiary receives ₦100,000 and the remaining ₦20,000 is split across the five system shares. If the last contribution takes the total above the target, the beneficiary still receives ₦100,000 and the extra goes to the system shares.

### When the target is not reached or the campaign is partly funded

The percentages in the table apply to the **total raised**. With the defaults, the beneficiary receives 80%.

*Example:* ₦50,000 raised, so the beneficiary receives ₦40,000.

### When the countdown ends before the target

*(Changed in PR #31.)*

- **Tier model on:** if the campaign is below its tier's minimum funding percentage, it is **extended automatically** by 48 hours, up to 3 times *(configurable)*.
- Otherwise, when the countdown ends:
  - If money was raised, the campaign becomes **Ready for Release** and waits for an admin to release it using the partly funded rules above. The member is notified.
  - If nothing was raised, the campaign is **closed**.
- The waiting period only starts when money is actually released.

Before this change, campaigns that ended short of target were closed. The money raised could then never be released, and the member's waiting period started anyway. `npm run reconcile:payments-csp` lists any campaigns this affected; release them from Admin → CSP.

### Reversals, refunds and carrying money forward

**Not supported today.** A contribution cannot be reversed or refunded once made, and unreleased money cannot be moved to another campaign. Every contribution is paid out when the campaign is released. *Corporate: tell us if refunds or carry-forward are needed and under what rules.*

### Sponsor rewards

The **direct sponsor** of the beneficiary receives the sponsor share (2% by default) in their Cash Wallet. It is recorded as a referral reward, so it appears in their referral earnings, and it triggers their Auto-Debit if they have it on. If the beneficiary has no sponsor, the sponsor share goes to the **Reserve wallet**.

### Automatic extensions based on money raised

When a campaign's total crosses one of these amounts, its countdown is extended: ₦40,000 adds 24 hours, ₦60,000 adds 48 hours, ₦80,000 adds 72 hours and ₦100,000 adds 7 days. Admins can also extend a campaign by hand, up to **7 days in total**.

---

## 5. Admin-created campaigns (feedback item 7)

Admins can create a campaign under **Admin → CSP → Create Default Request**, for a chosen member or for the "CSP System" account.

- It **skips all eligibility rules** and goes live immediately, with no approval step.
- It has **no countdown**. It stays live until an admin switches it off or completes it.
- Its target is the requested amount itself (at least ₦10,000 National or ₦20,000 Global). There is **no 20% markup**, so when fully funded the beneficiary receives the whole amount and the system shares receive nothing.
- Contributions to it count toward the contributor's own eligibility (section 3). This is the intended way to help members qualify.
- An admin pays it out with **Mark Complete**, which uses the same release as normal campaigns. A completed admin campaign cannot be switched back on.

*Corporate: confirm that admin campaigns should have no 20% markup.*

---

## 6. Other settings (feedback item 8)

| Setting | How it works today | Default |
|---|---|---|
| **Campaign countdown** | Set when the admin approves a request. | 48 hours *(configurable)* |
| **Automatic extensions** | Tier model only: added when a campaign ends below its tier's minimum funding %. | 48 hours, up to 3 times *(configurable)* |
| **Waiting period after support** | Chosen by the admin at approval. Starts when funds are released. | 6, 12, 24 or 36 months, default 12 *(configurable)* |
| **Reducing the wait to six months** | Available once a member has sponsored enough people. It can be set to require KYC and/or Regular Plus, and to apply automatically or on request. | 100 sponsored members *(configurable)* |
| **Contributing after receiving support** | During the waiting period, every month in which the member contributes ₦10,000 to other campaigns takes **one month** off their wait. | ₦10,000 per month *(configurable)* |
| **Minimum contribution** | The smallest amount per contribution. | ₦500 *(configurable)* |
| **"The 25% rule"** | We could not find a rule by this name. The closest is each tier's **minimum funding percentage** (see automatic extensions above). *Corporate: please define it.* | — |
| **"Top-up"** | There is no top-up feature for CSP today. *Corporate: please describe what it should do.* | — |

**How these affect later requests:** a member cannot request again until their waiting period has ended. They must still meet the eligibility rules in section 3. With the tier model on, their tier limits how much they can request.

**Showing these rules to members:** the CSP page shows each member their own eligibility checklist and waiting-period progress. It does not yet show the full rulebook. We recommend adding a "How CSP works" page based on this document.

---

## Questions for corporate

1. **Transfers between wallets:** should moving money from the Rewards Wallet (or any other wallet) to the Cash Wallet trigger Auto-Debit?
2. **The 25% rule:** what is it, and where should it apply?
3. **Top-up:** what should it do?
4. **Refunds and carry-forward:** are they needed? If so, when may a contribution be refunded or moved?
5. **Admin campaigns:** confirm there should be no 20% markup.
6. **Compulsory Auto-Debit (item 9):** should the 10% minimum on referral commissions be forced on for every member, with no way to switch it off? Should it cover renewal and CSP sponsor rewards as well as activation commissions?
7. **Renewal Reserve (item 9):** we recommend it replace the current behaviour in PR #31, where auto-renewal charges the Main Wallet. Please confirm, along with the admin limits (minimum and maximum percentage, grace period, and what happens when the reserve is short).
8. **Contributor benefits (item 10):** the tiers and contribution records already exist. Please confirm the discount tiers and who provides the healthcare card or SSC benefits.
9. **Special Community Support (item 11):** contributors receiving a share of profits (for example from a land sale) may count as a collective investment scheme, which in Nigeria can require SEC registration. Please get legal advice before we design it.
