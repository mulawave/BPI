# BPI Elite Club (v3 – Off-Chain Model) — Implementation Tracker

> **Instructions:**  
> Each section is checked **✅** if fully implemented  
> Individual items in sections completed are marked **- [x]**  
> Individual items in sections that are pending/empty/skipped/missing are marked **- [ ]**  
> This file was updated in real-time as each item is completed.  
> No item was marked completed until it is audited, staged, tested, and confirmed.

Last updated: **2026-02-25** | Session not yet started — tracker created from v1.4 specification  
Maintained by **BPI Engineering Team**  
Reviewed and approved for staging by **Richard Obroh, CTO, BPI**

Reference specs: **BPI v3 Elite Club v1.4** (with BPT/PACToken) and **v1.3** (without token conditions)

---

### 🟦 SECTION 1 — Database Schema (Elite Club Models)

#### 1a — Club Structure
- [ ] `EliteClub` model — core club entity (`id`, `name`, `tier`, `status`, `formationStatus`, `membersCount`, `createdAt`, `activatedAt`)
- [ ] `tier` enum: `SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`
- [ ] `formationStatus` enum: `OPEN`, `PAUSED`, `CLOSED` (admin-controlled per tier)
- [ ] `status` enum: `FORMING`, `ACTIVE`, `SUSPENDED`, `DISSOLVED`
- [ ] Hard cap: exactly 11 members per club (enforced at DB + application level)
- [ ] Multiple clubs allowed per tier (no unique constraint on tier)

#### 1b — Membership & Application
- [ ] `EliteClubApplication` model — candidate application (`id`, `userId`, `clubId`, `tier`, `status`, `submittedAt`, `reviewedAt`, `reviewedBy`, `rejectionReason`)
- [ ] `EliteClubMember` model — active member record (`id`, `userId`, `clubId`, `rotationNumber`, `joinedAt`, `status`, `credibilityScore`, `totalContributed`, `empowermentReceived`, `empowermentPending`)
- [ ] `status` on member: `ACTIVE`, `DEFAULTED`, `SUSPENDED`, `OPTED_OUT`, `REPLACED`
- [ ] `EliteClubDocument` model — application documents (`id`, `applicationId`, `docType`, `fileUrl`, `uploadedAt`, `verifiedAt`, `verifiedBy`)
- [ ] `docType` enum: `BANK_STATEMENT`, `BUSINESS_PROOF`, `TRAVEL_PROOF`, `PROPERTY_PROOF`, `CONTRIBUTION_DECLARATION`

#### 1c — Token Holding (v1.4)
- [ ] `EliteClubTokenHolding` model — token verification record (`id`, `userId`, `bptAmount`, `pacTokenAmount`, `verifiedAt`, `verificationMethod`, `proofUrl`)
- [ ] `verificationMethod` enum: `WALLET_CONNECT`, `PROOF_UPLOAD`

#### 1d — Contributions
- [ ] `EliteClubContribution` model — monthly contribution ledger (`id`, `memberId`, `clubId`, `month`, `year`, `totalAmount`, `empowermentShare`, `investmentShare`, `status`, `paidAt`)
- [ ] `status` enum: `PAID`, `PENDING`, `MISSED`, `PARTIAL`
- [ ] `EliteClubOperationsFee` model — deducted operations/revenue split record per contribution cycle

#### 1e — Empowerment Rotation
- [ ] `EliteClubEmpowermentPayout` model — rotation payout record (`id`, `clubId`, `rotationNumber`, `recipientMemberId`, `amount`, `scheduledMonth`, `scheduledYear`, `status`, `paidAt`)
- [ ] `status` enum: `PENDING`, `PAID`, `BLOCKED`
- [ ] `EliteClubSwapRequest` model — payout position swap request (`id`, `requesterId`, `targetId`, `clubId`, `fromRotation`, `toRotation`, `status`, `requestedAt`, `resolvedAt`)
- [ ] `status` on swap: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`

#### 1f — Investment Pool
- [ ] `EliteClubInvestmentPool` model — pool balance per club per cycle (`id`, `clubId`, `month`, `year`, `grossAmount`, `netAmount`, `digitalAllocated`, `offlineAllocated`, `available`)
- [ ] `EliteClubInvestment` model — individual investment record (`id`, `clubId`, `poolId`, `recommendedBy`, `title`, `description`, `category`, `amount`, `expectedReturn`, `duration`, `riskNotes`, `bpiProfitShareEnabled`, `bpiProfitSharePct`, `status`, `proofOfDepositUrl`, `createdAt`, `approvedAt`)
- [ ] `category` enum: `DIGITAL_WEB3`, `OFFLINE`
- [ ] `status` enum: `DRAFT`, `UNDER_REVIEW`, `VOTED`, `APPROVED`, `FUNDED`, `ACTIVE`, `COMPLETED`, `REJECTED`

#### 1g — Governance / Voting
- [ ] `EliteClubVote` model — per-member vote on investment (`id`, `investmentId`, `memberId`, `vote`, `votedAt`, `comment`)
- [ ] `vote` enum: `ACCEPT`, `REJECT`, `ABSTAIN`

#### 1h — Credibility
- [ ] `credibilityScore` field on `EliteClubMember` (decimal, 0–10, updated on each event)
- [ ] `EliteClubCredibilityEvent` model — audit log of score changes (`id`, `memberId`, `event`, `delta`, `reason`, `createdAt`)
- [ ] `event` enum: `CONTRIBUTION_PAID`, `CONTRIBUTION_MISSED`, `DEFAULT`, `SUSPENSION`, `GUARANTEE_DEFAULT`

#### 1i — Guarantors (v1.4)
- [ ] `EliteClubGuarantor` model — guarantor record (`id`, `memberId`, `investmentId`, `level`, `qualifiedAt`, `isActive`)
- [ ] `level` field: 1, 2, 3, 4 (Level 4 = Senior Guarantor)

#### 1j — Admin Settings
- [ ] `AdminSettings` keys for all configurable thresholds (see Section 8)

**🟥 NOT STARTED**

---

### 🟦 SECTION 2 — Club Formation Engine

#### 2a — Formation Status Control
- [ ] `getClubFormationStatus` procedure — returns formation status per tier (OPEN / PAUSED / CLOSED)
- [ ] `setClubFormationStatus` procedure — admin-only; update formation status per tier
- [ ] Submission of new applications blocked when tier formation is PAUSED or CLOSED
- [ ] Admin notification when a tier reaches 11 approved members (club ready to activate)

#### 2b — Club Activation
- [ ] Auto-transition club status from `FORMING` → `ACTIVE` when 11 approved members join
- [ ] Rotation numbers (1–11) auto-assigned randomly (or admin-assigned) on activation
- [ ] New club automatically created in `FORMING` status when an existing club activates (if formation is OPEN)
- [ ] `activateClub` procedure — admin-only; manual activation override if needed

**🟥 NOT STARTED**

---

### 🟦 SECTION 3 — Onboarding Gate & Application Flow

#### 3a — Eligibility Checks (v1.4 — with token gating)
- [ ] Must be active BPI **Gold Plus** member
- [ ] Must have invited minimum 2 **Gold Plus** members (direct referrals, active membership)
- [ ] Must hold minimum qualifying **BPT** amount (admin-configurable per tier)
- [ ] Must hold minimum qualifying **PACToken** amount (admin-configurable per tier)
- [ ] All four checks computed before application submission is allowed
- [ ] `checkEliteClubEligibility` procedure — returns pass/fail per gate with reasons

#### 3b — Eligibility Checks (v1.3 fallback — without token gating)
- [ ] Admin toggle to enable/disable BPT + PACToken requirements per tier
- [ ] When disabled: only Gold Plus membership + 2 Gold Plus invites required

#### 3c — Application Submission
- [ ] `submitEliteClubApplication` procedure — validates eligibility, creates `EliteClubApplication` with `pending` status
- [ ] Tier selection (SILVER / GOLD / PLATINUM / DIAMOND) at submission
- [ ] Club assignment: auto-assign to earliest `FORMING` club of the selected tier with < 11 members
- [ ] Duplicate application guard (one active application per user at a time)

#### 3d — Document Submission
- [ ] `uploadEliteClubDocument` procedure — links uploaded file to application
- [ ] Required documents validated before application moves to admin review:
  - [ ] 12-month bank statement
  - [ ] Proof of business ownership or executive role
  - [ ] Proof of international travel
  - [ ] Proof of personal property ownership
  - [ ] Declaration of monthly contribution capacity
- [ ] Admin can mark each document as verified/rejected individually

#### 3e — Token Holding Verification (v1.4)
- [ ] Wallet connect flow — user connects Web3 wallet; system reads BPT + PACToken balances on-chain
- [ ] Proof upload fallback — user uploads screenshot/document as alternative verification
- [ ] `verifyTokenHolding` procedure — admin reviews and approves/rejects proof-upload submissions
- [ ] Token holding re-checked at each monthly contribution cycle (threshold must be maintained)

#### 3f — Admin Review & Approval
- [ ] `adminListApplications` — paginated list of applications with filters (tier, status, date)
- [ ] `approveApplication` procedure — admin-only; moves member into club, creates `EliteClubMember` record
- [ ] `rejectApplication` procedure — admin-only; sets status → `rejected` with reason
- [ ] Notification to applicant on approval
- [ ] Notification to applicant on rejection with reason

**🟥 NOT STARTED**

---

### 🟦 SECTION 4 — Monthly Contribution System

#### 4a — Contribution Amounts (Admin-Configurable per Tier)
- [ ] `AdminSettings` key per tier for total monthly contribution amount (default Silver: ₦1,500,000)
- [ ] `AdminSettings` key per tier for empowerment share of contribution (default: ₦1,000,000)
- [ ] `AdminSettings` key per tier for investment share of contribution (default: ₦500,000)
- [ ] Gold / Platinum / Diamond amounts independently configurable without code change

#### 4b — Contribution Tracking
- [ ] `recordContribution` procedure — member records monthly contribution payment
- [ ] Contribution automatically split on record:
  - [ ] Empowerment share → added to club empowerment pool for current month
  - [ ] Investment share (gross) → added to `EliteClubInvestmentPool` gross balance
- [ ] `EliteClubContribution` ledger entry created per payment
- [ ] `listMyContributions` procedure — member views own contribution history
- [ ] `adminListContributions` — admin views all contributions with filters (club, member, month, status)

#### 4c — Contribution Status & Enforcement
- [ ] Monthly contribution deadline configurable (day of month, admin-set)
- [ ] Status auto-transitions to `MISSED` after deadline if not paid
- [ ] Missed contribution → credibility score decrement (configurable delta, admin-set)
- [ ] Any default → empowerment payout for that member marked `BLOCKED`
- [ ] Repeated default → member status set to `SUSPENDED`; legal action flag raised
- [ ] Defaulting member status visible to all 11 club members in the dashboard

**🟥 NOT STARTED**

---

### 🟦 SECTION 5 — Empowerment Rotation Engine

#### 5a — Rotation Setup
- [ ] Rotation numbers 1–11 assigned to each member on club activation
- [ ] Rotation order determines monthly payout schedule (member #1 gets month 1 payout, etc.)
- [ ] `getRotationQueue` procedure — returns current rotation state for a club

#### 5b — Monthly Payout
- [ ] `scheduleEmpowermentPayout` procedure — monthly scheduler creates `EliteClubEmpowermentPayout` record for current rotation slot
- [ ] Payout amount = sum of all 11 members' empowerment shares for that month (default Silver: ₦11,000,000)
- [ ] `releasePayout` procedure — admin-only; marks payout `PAID`, credits recipient's wallet
- [ ] Payout blocked if recipient member status = `DEFAULTED` or `SUSPENDED`
- [ ] `listEmpowermentPayouts` — view full payout history per club with status

#### 5c — Swap of Rotation Number
- [ ] `requestSwap` procedure — member requests to swap rotation position with another member
- [ ] `respondToSwap` procedure — target member accepts or rejects swap request
- [ ] If accepted: rotation numbers exchanged; next payout goes to swapped member
- [ ] Swap history logged for audit
- [ ] Notification to target member on swap request
- [ ] Notification to requester on swap acceptance/rejection
- [ ] Guard: member who has already received payout cannot swap

#### 5d — Opt-Out & Replacement (Pre-Payout)
- [ ] `optOut` procedure — member who has not yet received payout may opt out (per MOU)
- [ ] Opt-out triggers replacement: admin assigns a replacement member to inherit rotation slot
- [ ] `replaceOptedOutMember` procedure — admin-only
- [ ] Opted-out member status set to `OPTED_OUT`; replacement joins club as active member

**🟥 NOT STARTED**

---

### 🟦 SECTION 6 — Investment Pool & Operations Fee Split

#### 6a — Gross-to-Net Deduction (10% Operations)
- [ ] On each monthly investment contribution receipt, automatic 10% deduction applied:
  - [ ] 5% → Elite Club Operations Wallet (`ELITE_OPS`) per club — ₦25,000/member/month (Silver default)
  - [ ] 5% → BPI Revenue Pool (via `recordRevenue`, source: `ELITE_CLUB_OPS`) — ₦25,000/member/month
- [ ] `EliteClubOperationsFee` record created per deduction cycle
- [ ] Net investment pool per member: ₦450,000 (Silver default)
- [ ] Net investment pool per club per month: ₦4,950,000 (Silver default, 11 members)
- [ ] Operations deduction is **constant and predictable** — not dependent on investment profits

#### 6b — Investment Pool Balance Tracking
- [ ] `EliteClubInvestmentPool` balance updated each month after ops deduction
- [ ] `getInvestmentPoolBalance` procedure — returns gross, net, digital allocation, offline allocation, available funds
- [ ] `allocateToCategory` — admin or system allocates available funds to DIGITAL_WEB3 or OFFLINE bucket (50/50 default)
- [ ] Platform displays: pool balance, allocation by category, active investments, available funds

#### 6c — Revenue Routing
- [ ] `recordRevenue` called with `source: "ELITE_CLUB_OPS"` for the BPI Revenue Pool share
- [ ] Revenue tagged with `programType: "ELITE_CLUB"`, `clubId`, `tier`, `month`/`year`
- [ ] Operations wallet per club funded separately from BPI Revenue Pool

**🟥 NOT STARTED**

---

### 🟦 SECTION 7 — Investment Policy & Portfolio Allocation

#### 7a — 50/50 Allocation Rule
- [ ] Investment pool split enforced: 50% DIGITAL_WEB3, 50% OFFLINE
- [ ] New investment proposal validated against available balance in its category bucket
- [ ] Admin can override allocation percentages per club or per tier via `AdminSettings`

#### 7b — Pool Visibility Dashboard
- [ ] Current total pool balance
- [ ] Balance by category (digital vs offline)
- [ ] List of active investments with amounts, returns, status
- [ ] Available (uninvested) funds per category
- [ ] Monthly inflow history

**🟥 NOT STARTED**

---

### 🟦 SECTION 8 — Investment Governance (Recommendation → Vote → Fund Release)

#### 8a — Investment Recommender Eligibility
- [ ] Only members with `credibilityScore = 10/10` can submit investment recommendations
- [ ] Minimum Gold Plus members in their Virtual Cooperative (admin-configurable threshold)
- [ ] Active BPT + PACToken holdings above minimum threshold (v1.4, admin-configurable)
- [ ] `checkInvestmentRecommenderEligibility` procedure — returns pass/fail with reasons

#### 8b — Recommendation Submission
- [ ] `submitInvestmentRecommendation` procedure — validates eligibility, creates `EliteClubInvestment` in `DRAFT` status
- [ ] Required fields: title, description, category (DIGITAL_WEB3 / OFFLINE), amount requested, expected returns, duration, risk notes
- [ ] BPI profit share option at submission: `bpiProfitShareEnabled` (Yes / No) + `bpiProfitSharePct` (max 5%)
- [ ] Investment-specific profit share — not a blanket rule
- [ ] Sufficient pool balance in the selected category validated before submission

#### 8c — Legal & Compliance Review
- [ ] `submitLegalReview` procedure — admin/compliance officer links due diligence report and risk assessment document
- [ ] Investment status → `UNDER_REVIEW` after submission
- [ ] Investment status → `VOTED` when legal review is complete and vote is opened

#### 8d — 11-Member Vote
- [ ] `castVote` procedure — each of the 11 members casts ACCEPT / REJECT / ABSTAIN
- [ ] Voting deadline configurable (admin-set hours from vote open)
- [ ] Majority rule configurable by admin (default: simple majority of 11)
- [ ] `getVoteResults` procedure — returns vote tally, individual votes (admin), and outcome
- [ ] Investment status → `APPROVED` if majority vote accept; `REJECTED` otherwise
- [ ] Notification to all 11 members when vote is opened
- [ ] Notification to all members when vote result is finalized

#### 8e — Fund Release
- [ ] `releaseInvestmentFunds` procedure — admin-only; deducts from investment pool, creates disbursement record
- [ ] Investment status → `FUNDED` on release
- [ ] `uploadProofOfDeposit` procedure — Elite Club Accountant uploads proof of deposit to club bank account
- [ ] Proof of deposit linked to investment record and visible to all 11 members

#### 8f — BPI Profit Share on Investment Returns
- [ ] If `bpiProfitShareEnabled = true`: BPI takes up to configured `bpiProfitSharePct` (max 5%) of net profits when investment completes
- [ ] `recordInvestmentReturn` procedure — records profit, deducts BPI share if applicable, distributes remainder to club pool
- [ ] If `bpiProfitShareEnabled = false`: BPI takes 0% of that investment's profit
- [ ] `recordRevenue` called with `source: "ELITE_CLUB_INVESTMENT_PROFIT"` for BPI profit share amount

**🟥 NOT STARTED**

---

### 🟦 SECTION 9 — Guarantor System (v1.4)

#### 9a — Guarantor Qualification Levels
- [ ] Level 1 Guarantor: credibility ≥ 8/10 + baseline Gold Plus co-op count (admin-set)
- [ ] Level 2 Guarantor: credibility ≥ 9/10 + higher Gold Plus count + active BPT holding
- [ ] Level 3 Guarantor: credibility = 10/10 + higher Gold Plus count + active BPT + PACToken
- [ ] Level 4 Senior Guarantor: credibility = 10/10 + highest Gold Plus count (admin-set) + strategic BPI ecosystem contributor + can guarantee Gold/Platinum/Diamond clubs
- [ ] All thresholds (Gold Plus counts, token amounts per level) admin-configurable via `AdminSettings`

#### 9b — Guarantor Assignment
- [ ] `assignGuarantor` procedure — link a qualified member as guarantor to an investment
- [ ] `checkGuarantorEligibility` procedure — returns pass/fail for each level
- [ ] Guarantor level determines which tier of investment they may guarantee (level 4 → any tier)

#### 9c — Guarantor Accountability
- [ ] Guarantor credibility score reviewed on each default by a member they guaranteed
- [ ] Repeated defaults by guaranteed members → credibility deduction on guarantor
- [ ] `EliteClubCredibilityEvent` logged for guarantor on each guarantee-related default
- [ ] Admin can revoke guarantor status on sufficient credibility deterioration

**🟥 NOT STARTED**

---

### 🟦 SECTION 10 — Credibility Scoring System

- [ ] `credibilityScore` initialized at 5.0 on club join (configurable starting value)
- [ ] Increment events (configurable delta per event type):
  - [ ] Monthly contribution paid on time (`CONTRIBUTION_PAID`)
  - [ ] Positive vote outcomes on recommended investments
- [ ] Decrement events (configurable delta per event type):
  - [ ] Monthly contribution missed (`CONTRIBUTION_MISSED`)
  - [ ] Default (`DEFAULT`)
  - [ ] Suspension (`SUSPENSION`)
  - [ ] Guaranteed member default (`GUARANTEE_DEFAULT`)
- [ ] Score clamped between 0.0 and 10.0
- [ ] `EliteClubCredibilityEvent` audit log written on every score change
- [ ] `getCredibilityHistory` procedure — member and admin view of full score history
- [ ] Score used as eligibility gate for: investment recommendation, guarantor levels, continued active status

**🟥 NOT STARTED**

---

### 🟦 SECTION 11 — Default, Suspension & Legal Enforcement

- [ ] Missed contribution → credibility score decrement (immediate, configurable)
- [ ] Any default → flag `EliteClubMember.status = DEFAULTED`; empowerment payout blocked
- [ ] Defaulting member's status visible to all 11 club members in the club dashboard
- [ ] Repeated default (configurable threshold) → `status = SUSPENDED`; legal flag raised
- [ ] Suspended member blocks empowerment cycle (payout marked `BLOCKED` until resolved)
- [ ] `adminResolveDefault` procedure — admin clears default after resolution, restores status
- [ ] Legal action flag triggers admin notification and generates MOU reference record
- [ ] `EliteClubLegalEvent` model (or flag on `EliteClubMember`) for audit trail
- [ ] Guarantor accountability reviewed on each default (see Section 9c)

**🟥 NOT STARTED**

---

### 🟦 SECTION 12 — Admin CMS Controls

#### 12a — Club Formation Controls
- [ ] Set formation status per tier (OPEN / PAUSED / CLOSED) — `setClubFormationStatus`
- [ ] View all clubs per tier with member count and status
- [ ] Manually activate a club — `activateClub`
- [ ] Manually dissolve or suspend a club — `updateClubStatus`

#### 12b — Token Threshold Configuration (v1.4)
- [ ] `elite_bpt_min_{tier}` — minimum BPT per tier (SILVER/GOLD/PLATINUM/DIAMOND)
- [ ] `elite_pactoken_min_{tier}` — minimum PACToken per tier
- [ ] `elite_token_gate_enabled_{tier}` — toggle to enable/disable token gating per tier
- [ ] Configured via `AdminSettings` without code changes

#### 12c — Contribution Threshold Configuration
- [ ] `elite_monthly_contribution_{tier}` — total monthly contribution per tier
- [ ] `elite_empowerment_share_{tier}` — empowerment pool share per tier
- [ ] `elite_investment_share_{tier}` — investment pool share per tier
- [ ] `elite_ops_fee_pct` — operations fee percentage (default 10%)
- [ ] `elite_ops_bpi_split_pct` — BPI revenue share of ops fee (default 5%)
- [ ] `elite_contribution_deadline_day` — day of month contributions are due

#### 12d — Eligibility Threshold Configuration
- [ ] `elite_min_gold_plus_invites` — minimum Gold Plus direct invites for application
- [ ] `elite_recommender_min_coop_size` — min Gold Plus members in co-op to recommend investments
- [ ] `elite_guarantor_L{1-4}_min_coop_size` — min Gold Plus co-op size per guarantor level
- [ ] `elite_guarantor_L{1-4}_min_credibility` — min credibility score per guarantor level
- [ ] `elite_guarantor_L{1-4}_bpt_min` — min BPT per guarantor level (v1.4)
- [ ] `elite_guarantor_L{1-4}_pactoken_min` — min PACToken per guarantor level (v1.4)

#### 12e — Voting Configuration
- [ ] `elite_vote_majority_threshold` — number of ACCEPT votes required to pass (default: 6 of 11)
- [ ] `elite_vote_deadline_hours` — hours before vote closes

#### 12f — Credibility Configuration
- [ ] `elite_credibility_init` — starting score on join
- [ ] `elite_credibility_delta_paid` — score increment for paid contribution
- [ ] `elite_credibility_delta_missed` — score decrement for missed contribution
- [ ] `elite_credibility_delta_default` — score decrement for default
- [ ] `elite_credibility_delta_guarantee_default` — score decrement for guarantor on guaranteed default
- [ ] `elite_credibility_repeated_default_threshold` — number of defaults before suspension

#### 12g — Reporting & Audit
- [ ] Admin view: all clubs, tier, status, member list, contribution compliance
- [ ] Admin view: all applications with document status and approval state
- [ ] Admin view: investment pool balances per club
- [ ] Admin view: empowerment rotation queue per club
- [ ] Admin view: all votes with individual member ballots
- [ ] Admin view: credibility score history per member
- [ ] Exportable audit reports for Finance / Compliance / Board

**🟥 NOT STARTED**

---

### 🟦 SECTION 13 — Client-Side Dashboard (Member UI)

- [ ] Eligibility check panel — shows pass/fail per gate before application submission
- [ ] Application form with document upload (all 5 required docs)
- [ ] Token holding verification widget (wallet connect or proof upload, v1.4)
- [ ] Application status tracker (Submitted → Under Review → Approved / Rejected)
- [ ] Club dashboard — rotation queue, my position, next recipient, countdown to my payout
- [ ] Monthly contribution card — amount due, deadline, status, payment button
- [ ] Swap request interface — request swap, view pending swap requests, accept/reject
- [ ] Investment pool panel — pool balance, category breakdown, active investments
- [ ] Investment recommendation form (gated by credibility = 10)
- [ ] Voting interface — view open votes, cast ballot, see tally after close
- [ ] Credibility score card — current score, history of events
- [ ] Club member list — names (or anonymised IDs), rotation numbers, contribution status, default flag
- [ ] Toast notifications for all actions (no `alert()` / `confirm()`)

**🟥 NOT STARTED**

---

### 🟦 SECTION 14 — Notifications

- [ ] Application submitted — confirmation to applicant
- [ ] Application approved — notification to applicant
- [ ] Application rejected + reason — notification to applicant
- [ ] Club activated (11 members formed) — notification to all 11 members
- [ ] Contribution due reminder — notification X days before deadline (admin-configurable)
- [ ] Contribution missed — notification to member + club visibility update
- [ ] Member defaulted — notification to admin + all club members
- [ ] Member suspended — notification to admin + member
- [ ] Empowerment payout scheduled — notification to next-in-rotation member
- [ ] Empowerment payout released — notification to recipient
- [ ] Payout blocked (default) — notification to blocked member and admin
- [ ] Swap request received — notification to target member
- [ ] Swap accepted / rejected — notification to requester
- [ ] Investment recommendation submitted — notification to admin/compliance
- [ ] Vote opened — notification to all 11 members
- [ ] Vote result finalized — notification to all 11 members + recommender
- [ ] Investment funded — notification to all 11 members + accountant
- [ ] Proof of deposit uploaded — notification to all 11 members

**🟥 NOT STARTED**

---

### 🟦 SECTION 15 — Revenue Integration (Profit Pool)

- [ ] Monthly ops fee BPI share → `recordRevenue(source: "ELITE_CLUB_OPS", programType: "ELITE_CLUB")` on each contribution cycle
- [ ] Optional investment profit share → `recordRevenue(source: "ELITE_CLUB_INVESTMENT_PROFIT")` on investment completion if `bpiProfitShareEnabled = true`
- [ ] `country`, `state`, `region` tagged on each revenue record (from member/club location)
- [ ] Both revenue sources appear in `/admin/revenue-pools` analytics dashboard
- [ ] Revenue pool split (50/30/20) applied in real time via existing `allocateRevenue()` logic

**🟥 NOT STARTED**

---

### 🟥 IMPLEMENTATION PRIORITY ORDER

**🔴 Critical (Core Engine)**
1. [ ] Database schema — all models, enums, relations (Section 1)
2. [ ] Club formation controls + tier-based formation status (Section 2)
3. [ ] Onboarding gate eligibility engine — Gold Plus + invites + token (Section 3)
4. [ ] Application submission + document upload (Section 3)
5. [ ] Monthly contribution tracking + empowerment/investment split (Section 4)
6. [ ] Empowerment rotation queue + monthly payout scheduler (Section 5)
7. [ ] Operations fee automatic deduction (10%, 5%+5%) per contribution (Section 6)

**🟡 Important (Governance & Investment)**
8. [ ] Investment pool balance tracking + 50/50 category allocation (Sections 7–8)
9. [ ] Investment recommendation eligibility + submission (Section 8)
10. [ ] Legal/compliance review workflow (Section 8)
11. [ ] 11-member voting system (Section 8)
12. [ ] Fund release + proof of deposit upload (Section 8)
13. [ ] BPI optional profit share per investment (Section 8)

**🟠 Core Controls**
14. [ ] Credibility scoring engine — all events, clamping, audit log (Section 10)
15. [ ] Default / suspension / legal enforcement logic (Section 11)
16. [ ] Guarantor qualification levels 1–4 (Section 9)
17. [ ] Swap of rotation number request/approval (Section 5)

**🟢 Enhancement & Completeness**
18. [ ] Full admin CMS — all configurable thresholds (Section 12)
19. [ ] Client-side member dashboard (Section 13)
20. [ ] Notification system — full lifecycle (Section 14)
21. [ ] Revenue Pool integration for ops + profit share (Section 15)
22. [ ] Token holding re-verification at each monthly cycle (Section 3e)
23. [ ] Opt-out + replacement workflow (Section 5d)

---

### 🟩 QUICK REFERENCE — Feature Checklist

| Feature                                              | Status | Location (planned)                          |
|------------------------------------------------------|--------|---------------------------------------------|
| Club tier structure (Silver/Gold/Platinum/Diamond)   | ⬜     | `EliteClub` model                           |
| Multiple clubs per tier, 11-member cap               | ⬜     | DB constraint + application guard           |
| Formation status (Open/Paused/Closed) per tier       | ⬜     | `AdminSettings` + `setClubFormationStatus`  |
| Gold Plus + 2 Gold Plus invites gate                 | ⬜     | `checkEliteClubEligibility`                 |
| BPT + PACToken holding verification (v1.4)           | ⬜     | `verifyTokenHolding`, wallet connect        |
| 5-document application + admin review                | ⬜     | `EliteClubDocument`, `approveApplication`   |
| Monthly contribution split (empowerment + investment)| ⬜     | `recordContribution`                        |
| 10% ops fee deduction (5% ops + 5% BPI revenue)     | ⬜     | `EliteClubOperationsFee`, `recordRevenue`   |
| Empowerment rotation queue (1–11)                    | ⬜     | `EliteClubEmpowermentPayout`                |
| Rotation swap request/approval                       | ⬜     | `EliteClubSwapRequest`                      |
| Investment pool 50/50 digital/offline                | ⬜     | `EliteClubInvestmentPool`                   |
| Investment recommendation (credibility gate)         | ⬜     | `submitInvestmentRecommendation`            |
| Legal/compliance review workflow                     | ⬜     | `submitLegalReview`                         |
| 11-member vote (majority configurable)               | ⬜     | `EliteClubVote`, `castVote`                 |
| Fund release + proof of deposit                      | ⬜     | `releaseInvestmentFunds`, `uploadProofOfDeposit` |
| Optional BPI profit share per investment (max 5%)    | ⬜     | `bpiProfitShareEnabled`, `recordRevenue`    |
| Credibility score (0–10, event-driven)               | ⬜     | `credibilityScore`, `EliteClubCredibilityEvent` |
| Default / suspension / legal enforcement             | ⬜     | `adminResolveDefault`, `EliteClubLegalEvent`|
| Guarantor levels 1–4 + quality controls              | ⬜     | `EliteClubGuarantor`, `checkGuarantorEligibility` |
| Admin-configurable all thresholds                    | ⬜     | `AdminSettings` keys (Section 12)           |
| Member dashboard (rotation, contributions, voting)   | ⬜     | `components/elite-club/`                    |
| Full notification lifecycle (20 event types)         | ⬜     | `notification.service.ts`                   |
| Revenue Pool integration                             | ⬜     | `recordRevenue` (ELITE_CLUB_OPS + INVESTMENT_PROFIT) |

---

Personnel:  
Victoria Kanma – Quality Assessment (Structural Design, UI/UX Rendition)  
Alatari Douglas – Quality Assessment (Codebase, Local/Git Repo, Implementation Standard)  
Zino Abraham – Tester (Client Side)  
Oghenekaro Ogege – Tester (Client Side)  
Godbless Osaro – Quality Assessment (Admin UI/UX, RBAC, Schema)
