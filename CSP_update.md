# BPI Community Support Program (CSP)
## Updated Logic, Rules & System Flow
*Document for CTO & Technical Engineering Team*

---

## 1. Concept Overview

**What CSP Is:**
- Enable verified BPI members to request community support in times of need
- Encourage a culture of giving before receiving
- Build a self-sustaining support economy within the BPI ecosystem
- Reward community builders and contributors

Access to CSP is tied to active BPI membership, referrals, and consistent community contribution.

---

## 2. Participation & Eligibility Rules (Access Layer)

### 2.1 Membership Requirement

Only active BPI members can participate.

**Eligible Memberships:**
- Regular
- Regular Plus
- Any higher BPI membership tier

**Important Unlock Rule:**
- Only Regular Plus and above can unlock the Community Support Lifeline to make a request
- Regular members must upgrade to Regular Plus to activate request rights
- Regular Plus (₦53,750) and above automatically meet the membership eligibility requirements

### 2.2 Sponsorship & Contribution Prerequisites

To unlock the Community Support Lifeline (request access), a member must meet all of the following:

**A. Direct Sponsorship:**
- Personally sponsor a minimum of 2 direct members
- Each direct invite must be at least Regular (₦10,750 minimum stated activation)

**B. Community Contribution:**
- Must have supported at least 10 different recipients in CSP
- Minimum total contribution: ₦10,000 (National category)
- Minimum total contribution: ₦20,000 (Global category)

**C. Minimum Contribution Per Support:**
- Minimum per support action: ₦500

---

## 3. Community Support Categories (Scope of Broadcast)

### 3.1 National Community Support Category

**Scope:** Country-level support pool

**Activation Rule (Country Enablement):**
- A country becomes CSP-active when it reaches 10,000 Regular activations
- Once activated, all states/provinces within that country become CSP-enabled

**Eligibility to Broadcast National Request:**
- Minimum 2 direct sponsored Regular members
- The request is broadcast only within the approved country

### 3.2 Global Community Support Category

**Scope:** Global BPI community (not restricted to country)

**Eligibility — Path A (Early Global Access):**
- Regular Plus member
- Minimum 10 direct Regular Plus sponsored
- Minimum ₦20,000 total contribution to 10 recipients
- At least one approved active country must exist in the system
- Enables global access even if the user's own country has not yet been activated

**Eligibility — Path B (Full Global Rule):**
- Country is fully activated (10,000 Regular Plus reached)
- Minimum 20 direct sponsored members (Regular or Regular Plus)
- Minimum ₦20,000 contribution to 10 recipients
- Once eligible, requests are broadcast to the entire BPI global community

---

## 4. Admin CMS Controls

Admin must be able to configure in real-time:

**Thresholds & Rules:**
- Membership tier required for CSP activation (e.g., Regular Plus)
- Minimum direct invites for National CSP
- Minimum direct invites for Global CSP
- Minimum single contribution amount
- Minimum cumulative contribution amount
- Minimum number of unique beneficiaries
- Country activation thresholds (e.g., number of active members to activate CSP in a country)

**Country & Category Controls:**
- Enable/disable National or Global CSP per country
- Effective date for rule changes (with versioning)

**Audit & Versioning:**
- All changes must be logged (who changed what, when)
- All changes must be versioned (to preserve historical eligibility logic for audits)

---

## 5. Request Approval & Broadcast Flow

### 5.1 Management Approval Workflow

When a member submits a support request:
1. Request goes into CSP Approval Queue (Admin CMS)
2. Management approves with:
   - Duration: 6, 12, 24, or 36 months wait cycle for next request eligibility
   - Category: National or Global

### 5.2 Notification & Broadcast System

Once approved, the following system actions are triggered:

**Notifications:**
- Email notification sent to the beneficiary (request approved)
- Push notifications sent via in-app, WhatsApp, and Telegram

**On Login:**
- Freeze alert/popup notification
- Banner: *"Active Community Support Request – Show Love to the Community"*

---

## 6. Broadcast Duration & Extension Logic

### 6.1 Default Broadcast Time
- Default CSP request broadcast duration: **48 hours**

### 6.2 Extension by Contribution Threshold

Automatic time extension based on funds contributed:

| Amount Contributed | Time Extension |
|--------------------|----------------|
| ₦40,000            | +24 hours      |
| ₦60,000            | +48 hours      |
| ₦80,000            | +72 hours      |
| ₦100,000           | +168 hours     |

### 6.3 Extension by Direct Sponsorship Milestones

| Direct Sponsors | Time Extension |
|-----------------|----------------|
| 30 directs      | +24 hours      |
| 40 directs      | +48 hours      |
| 50 directs      | +72 hours      |
| 100 directs     | +168 hours     |

---

## 7. Post-Collection Rules (Giving Back Logic)

After receiving community support:
for every contribution the user makes, they gain time that is debited from their wait period
for example, if the wait period before a user can request another support is 24 months, each time they contribute to the 
other participants, they get rewarded by removing days from the wait period, a maximum of 10000 contribution in a month, reduces 
1 month from the wait period. giving that 10000 total contribution by user made after receiving contributions guarantees 1 month deduction from wait period, a day's contribution should be N500
 -=---

## 8. Broadcast Page Behavior (UX Logic)

The support broadcast page must be:
- **Anonymous** — no personal details exposed
- **Auto-refreshing**
- **Randomized display** of approved recipients
- **Manipulation-resistant** — prevents favoritism

---

## 9. Request Cooldown (Future Eligibility)

Each approved request must include a cooldown period before the user can request again.

**Cooldown Options:**
- 6 months
- 12 months
- 24 months
- 36 months

**Eligibility for next request remains valid only if:**
- User stays active monthly
- Continues supporting the community
- Keeps growing their virtual community
- Direct sponsors have active membership / active renewals

---

## 10. Revenue Share Logic (80/20 Distribution Model)

At the end of each CSP broadcast cycle:

**Primary Split:**
- **80%** → Beneficiary
- **20%** → System Allocation Pool

**Breakdown of the 20%:**
- 5% → BPI Profit Pool (System Pool)
- 2% → Direct Sponsor of the beneficiary
- 2% → State Wallet (State CSP Pool)
- 4% → Management Wallet
- 7% → Reserve Pool (for unmet requests & emergency support)

> The Reserve Pool can be used by management to support beneficiaries whose campaigns did not reach the target.

### 80/20 Administrative & Incentive Rule

A 20% administrative markup is applied to every funding request.

**How it works:**
- When a client makes a request, the system adds a 20% markup to the requested amount
- Example: Client request of ₦1,000,000 → System target becomes ₦1,200,000

**Disbursement Rules:**

1. **If the full target is achieved (100% of ₦1.2m raised):**
   - Client receives 100% of their original request (₦1,000,000)
   - The 20% (₦200,000) is allocated to administrative costs, platform operations, and approved community incentives

2. **If the full target is NOT achieved:**
   - 80% of the amount raised is disbursed to the client
   - 20% is allocated to administrative costs and incentive obligations

**Purpose of the Rule:**
- Sustainability of the platform
- Fair coverage of administrative and operational expenses
- Continued funding of community incentives
- Predictable and transparent disbursement outcomes for all participants

---

## 11. Wallet Architecture (Multi-Segmented Pools)

### 11.1 State Wallet (2%)
- Automatically created when a country is approved
- Each state/province has a CSP wallet
- **Used for:**
  - State board operations
  - Local activations
- **Admin CMS must allow:**
  - Add/remove beneficiaries
  - Assign state coordinators

### 11.2 Management Wallet (4%)
- Centralized management pool
- **CMS controlled:**
  - Add/remove wallet beneficiaries
  - Governance-controlled access

### 11.3 Reserve Pool (7%)
- Emergency support fund
- **Used to:**
  - Support members whose requests expire without sufficient support
  - Stabilize CSP in early-stage countries
  - Transfer from the reserve CSP pool to the recipient community wallet

---

## 12. Management Transfer & Cheque Rule

Only Management can:
- Transfer CSP funds into the Management accounts
- Convert CSP funds to a cheque or off-platform disbursement

No direct member access to management transfer features.

---

## 13. Technical Implementation Summary (For CTO)

**Core Modules Required:**
- CSP Eligibility Engine
- Country & State Activation Logic
- Contribution Tracker
- Broadcast Engine (National / Global)
- Countdown & Extension Engine
- Multi-Wallet Distribution System
- Restriction Engine (post-collection enforcement)

**CMS Modules Required:**
- Country approval
- State board setup
- Wallet role management
- Threshold & rule configuration

---

## 14. Strategic Outcome

This updated CSP logic transforms BPI Community Support from:

> *"a donation feature"*

into:

> *"a structured, self-sustaining Pan-African community welfare protocol powered by contribution, growth, and governance."*
