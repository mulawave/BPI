# BPI Elite Club (v3 – Off-Chain Model) — Implementation Tracker

> **Instructions:**  
> Each section is checked **✅** if fully implemented  
> Individual items in sections completed are marked **- [x]**  
> Individual items in sections that are pending/empty/skipped/missing are marked **- [ ]**  
> This file was updated in real-time as each item is completed.  
> No item was marked completed until it is audited, staged, tested, and confirmed.

Last updated: **2026-02-26** | Gap-fix pass — 16 gaps closed; schema migrated; ManageTab added; CI ✅  
Maintained by **BPI Engineering Team**  
Reviewed and approved for staging by **Richard Obroh, CTO, BPI**

Reference specs: **BPI v3 Elite Club v1.4** (with BPT/PACToken) and **v1.3** (without token conditions)

> **Audit Note (2026-02-26):** Implementation represents a substantial first pass — core DB schema, all tRPC procedures, admin CMS, and member dashboard are live. Gaps are primarily in automation (schedulers, auto-transitions), enforcement depth (Gold Plus gate, guarantor accountability, per-tier formation status), and some missing DB models (`EliteClubOperationsFee`). All gaps documented below.

---

### 🔶 SECTION 1 — Database Schema (Elite Club Models)

#### 1a — Club Structure
- [x] `EliteClub` model — core club entity (`id`, `name`, `tier`, `status`, `formationStatus`, `membersCount`, `createdAt`, `activatedAt`)
- [x] `tier` enum: `SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`
- [x] `formationStatus` enum: `OPEN`, `PAUSED`, `CLOSED` (admin-controlled per tier)
- [x] `status` enum: `FORMING`, `ACTIVE`, `SUSPENDED`, `DISSOLVED`
- [x] Hard cap: exactly 11 members per club (enforced at `activateClub` procedure level)
- [x] Multiple clubs allowed per tier (no unique constraint on tier)

#### 1b — Membership & Application
- [x] `EliteClubApplication` model — candidate application (`id`, `userId`, `clubId`, `tier`, `status`, `submittedAt`, `reviewedAt`, `reviewedBy`, `rejectionReason`)
- [x] `EliteClubMember` model — active member record (`id`, `userId`, `clubId`, `rotationNumber`, `joinedAt`, `status`, `credibilityScore`, `totalContributed`, `empowermentReceived`, `empowermentPending`)
- [x] `status` on member: `ACTIVE`, `DEFAULTED`, `SUSPENDED`, `OPTED_OUT`, `REPLACED`
- [x] `EliteClubDocument` model — application documents (`id`, `applicationId`, `docType`, `fileUrl`, `uploadedAt`, `verifiedAt`, `verifiedBy`)
- [x] `docType` enum: `BANK_STATEMENT`, `BUSINESS_PROOF`, `TRAVEL_PROOF`, `PROPERTY_PROOF`, `CONTRIBUTION_DECLARATION`

#### 1c — Token Holding (v1.4)
- [x] `EliteClubTokenHolding` model — token verification record (`id`, `userId`, `bptAmount`, `pacTokenAmount`, `verifiedAt`, `verificationMethod`, `proofUrl`)
- [x] `verificationMethod` enum: `WALLET_CONNECT`, `PROOF_UPLOAD`

#### 1d — Contributions
- [x] `EliteClubContribution` model — monthly contribution ledger (`id`, `memberId`, `clubId`, `month`, `year`, `totalAmount`, `empowermentShare`, `investmentShare`, `status`, `paidAt`)
- [x] `status` enum: `PAID`, `PENDING`, `MISSED`, `PARTIAL`
- [x] `EliteClubOperationsFee` model — deducted operations/revenue split record per contribution cycle (model added to schema, migrated, and inserted in `recordContribution`)

#### 1e — Empowerment Rotation
- [x] `EliteClubEmpowermentPayout` model — rotation payout record (`id`, `clubId`, `rotationNumber`, `recipientMemberId`, `amount`, `scheduledMonth`, `scheduledYear`, `status`, `paidAt`)
- [x] `status` enum: `PENDING`, `PAID`, `BLOCKED`
- [x] `EliteClubSwapRequest` model — payout position swap request (`id`, `requesterId`, `targetId`, `clubId`, `fromRotation`, `toRotation`, `status`, `requestedAt`, `resolvedAt`)
- [x] `status` on swap: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`

#### 1f — Investment Pool
- [x] `EliteClubInvestmentPool` model — pool balance per club per cycle (`id`, `clubId`, `month`, `year`, `grossAmount`, `netAmount`, `digitalAllocated`, `offlineAllocated`, `available`)
- [x] `EliteClubInvestment` model — individual investment record (`id`, `clubId`, `poolId`, `recommendedBy`, `title`, `description`, `category`, `amount`, `expectedReturn`, `duration`, `riskNotes`, `bpiProfitShareEnabled`, `bpiProfitSharePct`, `status`, `proofOfDepositUrl`, `createdAt`, `approvedAt`)
- [x] `category` enum: `DIGITAL_WEB3`, `OFFLINE`
- [x] `status` enum: `DRAFT`, `UNDER_REVIEW`, `VOTED`, `APPROVED`, `FUNDED`, `ACTIVE`, `COMPLETED`, `REJECTED`

#### 1g — Governance / Voting
- [x] `EliteClubVote` model — per-member vote on investment (`id`, `investmentId`, `memberId`, `vote`, `votedAt`, `comment`)
- [x] `vote` enum: `ACCEPT`, `REJECT`, `ABSTAIN`

#### 1h — Credibility
- [x] `credibilityScore` field on `EliteClubMember` (decimal, 0–10, updated on each event)
- [x] `EliteClubCredibilityEvent` model — audit log of score changes (`id`, `memberId`, `event`, `delta`, `reason`, `createdAt`)
- [x] `event` enum: `CONTRIBUTION_PAID`, `CONTRIBUTION_MISSED`, `DEFAULT`, `SUSPENSION`, `GUARANTEE_DEFAULT` (schema has these + `OPT_OUT`, `PAYOUT_RECEIVED`, `POSITIVE_VOTE`, `ADMIN_ADJUSTMENT`)

#### 1i — Guarantors (v1.4)
- [x] `EliteClubGuarantor` model — guarantor record (`id`, `memberId`, `investmentId`, `level`, `qualifiedAt`, `isActive`)
- [x] `level` field: 1, 2, 3, 4 (Level 4 = Senior Guarantor)

#### 1j — Admin Settings
- [x] `AdminSettings` keys for all configurable thresholds (18 keys in `getCmsSettings`: BPT/PAC/monthly per tier, investment quorum, credibility thresholds, ops fee %)

**✅ COMPLETE** — 14/14 models implemented

---

### 🔶 SECTION 2 — Club Formation Engine

#### 2a — Formation Status Control
- [x] `getClubFormationStatus` procedure (implemented as `getFormationStatus`) — returns global formation status + per-tier breakdown via groupBy
- [x] `setClubFormationStatus` procedure (implemented as `setFormationStatus`) — admin-only; upserts single `elite_club_formation_status` AdminSettings key
- [x] Submission of new applications blocked when tier formation is PAUSED or CLOSED (reads `elite_club_formation_status` AdminSettings key in `submitApplication`)
- [ ] Admin notification when a tier reaches 11 approved members (club ready to activate) (**MISSING**)

#### 2b — Club Activation
- [ ] Auto-transition club status from `FORMING` → `ACTIVE` when 11 approved members join (**MISSING** — manual activation only)
- [ ] Rotation numbers (1–11) auto-assigned randomly (or admin-assigned) on activation (**PARTIAL** — rotation is manually assigned per-member at `approveApplication` time, not auto-assigned on activation)
- [ ] New club automatically created in `FORMING` status when an existing club activates (**MISSING**)
- [x] `activateClub` procedure — admin-only; manual activation, enforces 11-member count, notifies all members

**🔶 PARTIAL** — manual activation path + formation gate implemented; auto-triggers and admin notification at 11-member capacity not implemented

---

### 🔶 SECTION 3 — Onboarding Gate & Application Flow

#### 3a — Eligibility Checks (v1.4 — with token gating)
- [ ] Must be active BPI **Gold Plus** member (**MISSING** — not checked in `checkEligibility`)
- [ ] Must have invited minimum 2 **Gold Plus** members (**MISSING** — not checked)
- [x] Must hold minimum qualifying **BPT** amount — checked against approved `EliteClubTokenHolding`
- [x] Must hold minimum qualifying **PACToken** amount — checked against approved `EliteClubTokenHolding`
- [ ] All four checks computed before application submission (**PARTIAL** — only BPT/PAC + duplicate/membership checks; Gold Plus gate absent)
- [x] `checkEliteClubEligibility` procedure (as `checkEligibility`) — returns pass/fail with hasBpt, hasPac, alreadyMember, hasPendingApp

#### 3b — Eligibility Checks (v1.3 fallback — without token gating)
- [ ] Admin toggle to enable/disable BPT + PACToken requirements per tier (**MISSING**)
- [ ] When disabled: only Gold Plus membership + 2 Gold Plus invites required (**MISSING**)

#### 3c — Application Submission
- [x] `submitEliteClubApplication` procedure (as `submitApplication`) — validates eligibility, creates `EliteClubApplication` with `PENDING` status
- [x] Tier selection (SILVER / GOLD / PLATINUM / DIAMOND) at submission
- [ ] Club assignment: auto-assign to earliest `FORMING` club of the selected tier with < 11 members (**MISSING** — club assigned manually by admin at `approveApplication`)
- [x] Duplicate application guard (one active application per user per tier at a time)

#### 3d — Document Submission
- [x] `uploadEliteClubDocument` procedure (as `uploadDocument`) — links uploaded file to application
- [ ] Required documents validated before application moves to admin review (**MISSING** — no completeness check before `approveApplication`)
- [ ] Admin can mark each document as verified/rejected individually (**MISSING** — no `adminVerifyDocument` procedure; only `adminApproveTokenHolding` exists)

#### 3e — Token Holding Verification (v1.4)
- [ ] Wallet connect flow — user connects Web3 wallet; system reads BPT + PACToken balances on-chain (**MISSING** — only proof upload path implemented)
- [x] Proof upload fallback — `submitTokenHolding` with `PROOF_UPLOAD` method
- [x] `verifyTokenHolding` procedure (as `adminApproveTokenHolding`) — admin approves proof-upload submissions, sets `bptVerified`/`pacTokenVerified` on application
- [ ] Token holding re-checked at each monthly contribution cycle (**MISSING**)

#### 3f — Admin Review & Approval
- [x] `adminListApplications` — paginated list with filters (tier, status); includes user, documents, tokenHoldings
- [x] `approveApplication` procedure — admin assigns clubId + rotationNumber, creates `EliteClubMember`, increments `membersCount`
- [x] `rejectApplication` procedure — sets status → `REJECTED` with reason
- [x] Notification to applicant on approval (`ELITE_CLUB_APP_APPROVED`)
- [x] Notification to applicant on rejection with reason (`ELITE_CLUB_APP_REJECTED`)

**🔶 PARTIAL** — core application flow works; Gold Plus gate, auto-club-assign, doc completeness check, wallet connect, and per-doc verification missing

---

### 🔶 SECTION 4 — Monthly Contribution System

#### 4a — Contribution Amounts (Admin-Configurable per Tier)
- [x] `AdminSettings` key per tier for total monthly contribution amount (`elite_club_{tier}_monthly`)
- [ ] `AdminSettings` key per tier for empowerment share (**MISSING** from `getCmsSettings` key list — split is hardcoded 80/20 in router)
- [ ] `AdminSettings` key per tier for investment share (**MISSING** — hardcoded 20%)
- [x] Gold / Platinum / Diamond monthly amounts independently configurable via settings

#### 4b — Contribution Tracking
- [x] `recordContribution` procedure — admin records monthly contribution payment
- [x] Contribution automatically split: empowerment 80% + investment 20% (hardcoded, not CMS-driven)
- [x] Empowerment share tracked in contribution record; investment share added to `EliteClubInvestmentPool`
- [x] `EliteClubContribution` ledger entry created per payment (upsert with duplicate guard)
- [x] `listMyContributions` procedure (as `myContributions`) — member views own contribution history
- [x] `adminListContributions` — admin views all with filters (club, month, year, status)

#### 4c — Contribution Status & Enforcement
- [ ] Monthly contribution deadline configurable (day of month, admin-set) (**MISSING** — no scheduler/cron)
- [ ] Status auto-transitions to `MISSED` after deadline if not paid (**MISSING** — no automated job)
- [ ] Missed contribution → credibility score decrement (**MISSING** — no automated trigger; only manual `flagDefault` decrements credibility)
- [ ] Any default → empowerment payout for that member marked `BLOCKED` (**PARTIAL** — `releasePayout` blocks if credibility < 3, not on `DEFAULTED` status directly)
- [x] Repeated default → member `status = SUSPENDED`; legal flag raised (auto-suspends at `defaultCount ≥ 3` in `flagDefault`)
- [x] Defaulting member status visible to all club members (`getRotationQueue` returns member status)

**🔶 PARTIAL** — manual recording and tracking implemented; automated deadline/MISSED enforcement absent; empowerment/investment split percentages not CMS-configurable

---

### 🔶 SECTION 5 — Empowerment Rotation Engine

#### 5a — Rotation Setup
- [ ] Rotation numbers 1–11 assigned to each member **on club activation** (**PARTIAL** — assigned per-member by admin at `approveApplication` time; no batch auto-assignment on `activateClub`)
- [x] Rotation order determines monthly payout schedule (`getRotationQueue` ordered by `rotationNumber`)
- [x] `getRotationQueue` procedure — returns ordered members with payout history

#### 5b — Monthly Payout
- [x] `scheduleEmpowermentPayout` procedure — admin creates `EliteClubEmpowermentPayout` record for current rotation slot
- [ ] Payout amount auto-calculated as sum of all 11 empowerment shares (**PARTIAL** — admin passes amount manually; calculation is not automated)
- [x] `releasePayout` procedure — admin-only; marks payout `PAID`; auto-blocks if credibility < 3
- [x] Credibility gate on payout release (score < 3 → `BLOCKED` with reason)
- [x] `listEmpowermentPayouts` — full payout history per club with status and member info

#### 5c — Swap of Rotation Number
- [x] `requestSwap` procedure — member requests rotation swap with another member
- [x] `respondToSwap` procedure — target accepts or rejects; atomic rotation number exchange on accept
- [x] Rotation numbers exchanged on accept; next payout follows new assignment
- [x] Swap history logged (`EliteClubSwapRequest` record with status + resolvedAt)
- [x] Notification to target member on swap request (`ELITE_CLUB_SWAP_REQUEST`)
- [x] Notification to requester on acceptance (`ELITE_CLUB_SWAP_ACCEPTED`) and rejection (`ELITE_CLUB_SWAP_REJECTED`)
- [x] Guard: member who has already received payout cannot swap (`empowermentReceived` flag checked in `requestSwap`; throws error if true)

#### 5d — Opt-Out & Replacement (Pre-Payout)
- [x] `optOut` procedure — sets member status `OPTED_OUT`, triggers `OPT_OUT` credibility decrement (−1)
- [x] `replaceOptedOutMember` procedure — admin assigns new user to inherited rotation slot, old member set to `REPLACED`
- [x] Opted-out member status set to `OPTED_OUT`; replacement created as `ACTIVE` member
- [x] Opt-out notification sent / replacement confirmation to new member (`sendNotification` added to `optOut` and `replaceOptedOutMember`)

**🔶 PARTIAL** — full swap/opt-out mechanics + post-payout guard + notifications working; automated payout scheduling and amount calculation still missing

---

### 🔶 SECTION 6 — Investment Pool & Operations Fee Split

#### 6a — Gross-to-Net Deduction (10% Operations)
- [x] 10% of investment share auto-deducted: 5% `eliteOps` + 5% `bpiOps` computed in `recordContribution`
- [x] 5% → BPI Revenue Pool via `recordRevenue(source: "ELITE_CLUB_OPS")`
- [ ] 5% → Elite Club Ops Wallet (`ELITE_OPS`) — computed but not disbursed to a tracked wallet/model (**PARTIAL**)
- [x] `EliteClubOperationsFee` record created per deduction cycle (`prisma.eliteClubOperationsFee.create` inside `recordContribution`)
- [x] Net investment pool per member correct: `investmentShare × 0.9` → `netInvestment` added to pool
- [x] Operations deduction constant and predictable per contribution

#### 6b — Investment Pool Balance Tracking
- [x] `EliteClubInvestmentPool` upserted each month with gross, net, opsFee amounts
- [x] `getInvestmentPool` procedure — returns pool with associated investments
- [x] `updatePoolSplit` — admin sets `digitalBalance` / `offlineBalance` split
- [x] Admin investments tab displays pool balance and investments list

#### 6c — Revenue Routing
- [x] `recordRevenue(source: "ELITE_CLUB_OPS")` called per contribution cycle
- [x] Revenue tagged with `programType: "ELITE_CLUB"`, `clubId`, `tier`, `month`/`year` (passed in both `ELITE_CLUB_OPS` and `ELITE_CLUB_INVESTMENT_PROFIT` `recordRevenue` calls)
- [ ] Operations wallet per club funded separately (**MISSING** — no wallet disbursement; only BPI revenue pool is updated)

**🔶 PARTIAL** — BPI revenue recording + ops fee model + revenue metadata tagging implemented; Elite ops wallet disbursement still missing

---

### 🔶 SECTION 7 — Investment Policy & Portfolio Allocation

#### 7a — 50/50 Allocation Rule
- [ ] Investment pool split enforced: 50% DIGITAL_WEB3, 50% OFFLINE (**MISSING** — `submitInvestmentRecommendation` validates only total `pool.available`, not per-category balance)
- [ ] New investment proposal validated against available balance in its category bucket (**MISSING**)
- [x] Admin can override allocation percentages per club via `updatePoolSplit`

#### 7b — Pool Visibility Dashboard
- [x] Total pool balance displayed in admin investments tab
- [x] Active investments listed with amounts, status, vote count
- [ ] Balance by category (digital vs offline) breakdown display (**PARTIAL** — fields exist on `InvestmentPool` model but not shown in current UI)
- [ ] Available funds per category (**PARTIAL** — same as above)
- [ ] Monthly inflow history (**MISSING**)

**🔶 PARTIAL** — basic pool visibility works; category enforcement and category breakdown display incomplete

---

### 🔶 SECTION 8 — Investment Governance (Recommendation → Vote → Fund Release)

#### 8a — Investment Recommender Eligibility
- [ ] Only members with `credibilityScore = 10/10` (**PARTIAL** — gate is ≥ 7, not = 10; threshold stored in `elite_club_recommender_min_credibility` AdminSettings key but hardcoded in router as 7)
- [ ] Minimum Gold Plus members in Virtual Cooperative (**MISSING**)
- [ ] Active BPT + PACToken holdings above minimum threshold (**MISSING**)
- [x] `checkRecommenderEligibility` procedure — returns pass/fail with reason (checks credibility ≥ 7 + active guarantor)

#### 8b — Recommendation Submission
- [x] `submitInvestmentRecommendation` procedure — validates credibility ≥ 7 + pool balance, creates `EliteClubInvestment` in `DRAFT`
- [x] All required fields: title, description, category, amountRequested, expectedReturn, durationMonths, riskNotes
- [x] BPI profit share option: `bpiProfitShareEnabled` + `bpiProfitSharePct` (capped at 5%)
- [x] Investment-specific profit share — not a blanket rule
- [x] Pool balance validation before submission (`pool.available >= amountRequested`)

#### 8c — Legal & Compliance Review
- [x] `submitLegalReview` procedure — admin links due diligence URL, sets status → `UNDER_REVIEW`, notifies all club members
- [ ] Investment status → `VOTED` when legal review complete and vote opens (**MISSING** — status goes directly to `UNDER_REVIEW`; `VOTED` status not used)

#### 8d — 11-Member Vote
- [x] `castVote` procedure — members cast `ACCEPT` / `REJECT` / `ABSTAIN`; duplicate vote guard
- [ ] Voting deadline configurable and enforced (**MISSING** — no deadline logic)
- [x] Majority rule configurable via AdminSettings — `elite_club_investment_quorum` key now read dynamically via `loadNumericSetting` in `getVoteResults` and `approveInvestment`
- [x] `getVoteResults` procedure — returns accept/reject/abstain tally, quorum check, pass/fail
- [x] Investment status → `APPROVED` by `approveInvestment` (enforces quorum = 8, majority check)
- [x] Notification to all 11 members when vote opened (in `submitLegalReview`)
- [x] Notification to all members when vote result finalized (`ELITE_CLUB_INVESTMENT_APPROVED` / `ELITE_CLUB_INVESTMENT_REJECTED` to all ACTIVE club members)

#### 8e — Fund Release
- [x] `approveInvestment` procedure — admin-only; validates quorum + majority, reserves funds from pool
- [x] `fundInvestment` procedure — admin uploads proof URL, sets status → `FUNDED`
- [x] Proof of deposit URL stored on investment record
- [x] Notification to all 11 members on fund release (`ELITE_CLUB_INVESTMENT_FUNDED` to all ACTIVE club members in `fundInvestment`)

#### 8f — BPI Profit Share on Investment Returns
- [x] `bpiProfitShareEnabled` logic — BPI share calculated only if enabled
- [x] `recordInvestmentReturn` procedure — records `actualReturn`, deducts BPI share, returns remainder to pool available
- [x] If `bpiProfitShareEnabled = false`: BPI share = 0
- [x] `recordRevenue(source: "ELITE_CLUB_INVESTMENT_PROFIT")` called when BPI share > 0

**🔶 PARTIAL** — full recommendation-to-fund lifecycle implemented; credibility gate uses ≥ 7 not = 10 (but now CMS-driven), vote deadline enforcement missing, VOTED status unused, post-result and fund-release notifications now added

---

### 🔶 SECTION 9 — Guarantor System (v1.4)

#### 9a — Guarantor Qualification Levels
- [x] Level thresholds defined in `checkGuarantorEligibility`: L1 ≥ 7.0, L2 ≥ 7.5, L3 ≥ 8.0, L4 ≥ 9.0 (hardcoded array)
- [ ] Gold Plus co-op count check per level (**MISSING**)
- [ ] BPT/PACToken holding check per level (**MISSING**)
- [ ] All thresholds admin-configurable via `AdminSettings` (**MISSING** — hardcoded in router)

#### 9b — Guarantor Assignment
- [x] `assignGuarantor` procedure — links qualified member to investment as guarantor with level
- [x] `checkGuarantorEligibility` procedure — returns pass/fail per level with score comparison
- [ ] Guarantor level determines which tier of investment they may guarantee (**MISSING** — no enforcement)

#### 9c — Guarantor Accountability
- [x] Guarantor credibility reviewed on each default by a guaranteed member (`flagDefault` queries active guarantors, issues `GUARANTEE_DEFAULT` credibility event −1 per guarantor)
- [x] `GUARANTEE_DEFAULT` credibility event on guarantor (dispatched in `flagDefault` via `$transaction` per guarantor)
- [ ] Admin revoke guarantor status (`isActive = false`) (**MISSING** — no procedure)

**🔶 PARTIAL** — assignment and eligibility check exist; full accountability chain (guarantor credibility on default, revocation) not implemented

---

### 🔶 SECTION 10 — Credibility Scoring System

- [x] `credibilityScore` initialized at 5.0 on `approveApplication` and `replaceOptedOutMember`
- [x] `CONTRIBUTION_PAID` increment: +0.2 (in `recordContribution`)
- [x] `POSITIVE_VOTE` increment: +0.1 (in `castVote`)
- [x] `PAYOUT_RECEIVED` increment: +0.5 (in `releasePayout`)
- [ ] `CONTRIBUTION_MISSED` decrement — enum value exists; **no automated trigger** (no cron/scheduler)
- [x] `DEFAULT` decrement: −2 (in `flagDefault`)
- [x] `SUSPENSION` decrement (logged via `adjustCredibility(..., SUSPENSION, -1, ...)` inside `flagDefault` auto-suspend block)
- [x] `GUARANTEE_DEFAULT` decrement (dispatched to each active guarantor in `flagDefault`)
- [x] `OPT_OUT` decrement: −1 (in `optOut`)
- [x] Score clamped between 0.0 and 10.0 (`adjustCredibility` helper)
- [x] `EliteClubCredibilityEvent` audit log written on every score change
- [x] `myCredibilityHistory` procedure — member views full score history with before/after
- [x] `adminAdjustCredibility` procedure — admin manual adjustment with any `EliteClubCredEventType`
- [x] Score used as gate: ≥ 7 for investment recommendation, threshold array for guarantor levels, < 3 blocks payout

**🔶 PARTIAL** — core scoring engine + `SUSPENSION` event + `GUARANTEE_DEFAULT` chain implemented; `CONTRIBUTION_MISSED` auto-trigger still absent (no cron)

---

### 🔶 SECTION 11 — Default, Suspension & Legal Enforcement

- [ ] Missed contribution → credibility decrement (immediate, automated) (**MISSING** — no scheduler)
- [x] Any default → flag `EliteClubMember.status = DEFAULTED` (`status: "DEFAULTED"` added to the `$transaction` member update inside `flagDefault`)
- [x] Defaulting member visible to all club members (`getRotationQueue` shows member status)
- [x] Repeated default → `status = SUSPENDED`; `EliteClubLegalEvent` created (at `defaultCount ≥ 3`)
- [x] Suspended member triggers payout `BLOCKED` (credibility check < 3 in `releasePayout`)
- [x] `adminResolveDefault` procedure — updates `EliteClubLegalEvent.resolvedAt`
- [x] `reinstateMember` procedure — admin resets status to `ACTIVE`, sends `ELITE_CLUB_REINSTATED` notification
- [x] Legal action generates admin notification (all admin/superadmin users queried and sent `ELITE_CLUB_LEGAL_FLAG` notification in `flagDefault`)
- [x] `EliteClubLegalEvent` model for full audit trail
- [x] `adminListLegalEvents` — paginated events with member info
- [ ] Guarantor accountability reviewed on each default (**MISSING**)

**🔶 PARTIAL** — manual default flagging, legal event trail, `DEFAULTED` status, `SUSPENSION` event, admin notification, guarantor cascade, suspension, and reinstatement implemented; automated MISSED trigger (cron) still absent

---

### 🔶 SECTION 12 — Admin CMS Controls

#### 12a — Club Formation Controls
- [x] Set formation status (`setFormationStatus`) — global key; per-tier override not implemented
- [x] View all clubs per tier with member count and status (`adminListClubs` + Clubs tab)
- [x] Manually activate a club (`activateClub` — enforces 11 members)
- [x] Manually dissolve or suspend a club (`updateClubStatus`)

#### 12b — Token Threshold Configuration (v1.4)
- [x] `elite_club_{tier}_bpt_min` — minimum BPT per tier (all 4 tiers in `getCmsSettings`)
- [x] `elite_club_{tier}_pac_min` — minimum PACToken per tier (all 4 tiers)
- [ ] `elite_token_gate_enabled_{tier}` — on/off toggle per tier (**MISSING** — not in AdminSettings key list)

#### 12c — Contribution Threshold Configuration
- [x] `elite_club_{tier}_monthly` — total monthly contribution per tier
- [ ] `elite_empowerment_share_{tier}` — empowerment pool share per tier (**MISSING** — hardcoded 80%)
- [ ] `elite_investment_share_{tier}` — investment pool share per tier (**MISSING** — hardcoded 20%)
- [x] `elite_club_ops_fee_bpi_pct` — BPI revenue share of ops fee
- [x] `elite_club_ops_fee_elite_pct` — Elite ops fee percentage
- [ ] `elite_contribution_deadline_day` — day of month contributions are due (**MISSING**)

#### 12d — Eligibility Threshold Configuration
- [ ] `elite_min_gold_plus_invites` (**MISSING**)
- [x] `elite_club_recommender_min_credibility` — read dynamically via `loadNumericSetting` in both `checkRecommenderEligibility` and `submitInvestmentRecommendation`
- [ ] `elite_guarantor_L{1-4}_min_coop_size` (**MISSING**)
- [ ] `elite_guarantor_L{1-4}_min_credibility` (**MISSING** — hardcoded in router array)
- [ ] `elite_guarantor_L{1-4}_bpt_min` (**MISSING**)
- [ ] `elite_guarantor_L{1-4}_pactoken_min` (**MISSING**)

#### 12e — Voting Configuration
- [x] `elite_club_investment_quorum` — read dynamically via `loadNumericSetting` in `getVoteResults` and `approveInvestment`
- [ ] `elite_vote_deadline_hours` — hours before vote closes (**MISSING**)

#### 12f — Credibility Configuration
- [x] `elite_club_payout_min_credibility` — key exists in AdminSettings (not read dynamically in router)
- [ ] `elite_credibility_init` (**MISSING**)
- [ ] `elite_credibility_delta_paid` (**MISSING** — hardcoded +0.2)
- [ ] `elite_credibility_delta_missed` (**MISSING**)
- [ ] `elite_credibility_delta_default` (**MISSING** — hardcoded −2)
- [ ] `elite_credibility_delta_guarantee_default` (**MISSING**)
- [ ] `elite_credibility_repeated_default_threshold` (**MISSING** — hardcoded at 3)

#### 12g — Reporting & Audit
- [x] Admin view: all clubs, tier, status, member count (`/admin/elite-club` → Clubs tab)
- [x] Admin view: all applications with BPT/PAC verification status and document count
- [x] Admin view: investment records per club with status filter and legal/approve/reject actions
- [x] Admin view: empowerment payouts per club with release action
- [x] Admin view: vote tally via `getVoteResults`
- [x] Admin view: credibility history via `myCredibilityHistory` (usable by admin)
- [ ] Admin contributions tab — implemented as route stub ("use Clubs and Payouts tabs") (**PARTIAL**)
- [ ] Admin legal tab — implemented as route stub (**PARTIAL** — legal events accessible via `adminListLegalEvents` but no dedicated UI tab)
- [ ] Exportable audit reports for Finance / Compliance / Board (**MISSING**)

**🔶 PARTIAL** — core admin UI and most settings keys present; many thresholds not dynamically read from CMS, contributions/legal tabs are stubs, no export feature

---

### 🔶 SECTION 13 — Client-Side Dashboard (Member UI)

- [x] Eligibility check panel — shows BPT/PAC/duplicate/pending checks in Apply tab
- [x] Application form (tier selector + optional notes + submit) in Apply tab
- [x] Document upload widget in Manage tab (application ID + doc type selector + file URL input; calls `uploadDocument`)
- [x] Token holding verification widget — `submitTokenHolding` with `PROOF_UPLOAD` method (wallet connect UI not present)
- [x] Application status in Apply tab (eligibility card + form)
- [x] Club dashboard — My Clubs tab shows rotation number, member count, contribution progress, credibility ring, empowerment status
- [x] Monthly contribution card — Contributions tab shows all periods, split, totals, status badges
- [x] Swap request interface (Manage tab — member dropdown + request button; incoming swap notice with respond link)
- [x] Investment pool panel — Investments tab: list investments per club, status, vote tally
- [x] Investment recommendation form (Manage tab — full form: title, description, category, amount, expected return, duration, risk notes, BPI profit share toggle)
- [x] Voting interface — ACCEPT / ABSTAIN / REJECT buttons with comment field in Investments tab (gated: shows only for `UNDER_REVIEW` with no existing vote)
- [x] Credibility score card — Credibility tab with animated `CredibilityRing` SVG + full event history
- [x] Club member list — rotation numbers, credibility score, status badges, empowerment status for all members (Manage tab rotation queue table)
- [x] Toast notifications for all actions (uses `react-hot-toast` throughout; no `alert()`/`confirm()`)

**✅ COMPLETE** — 6-tab dashboard: overview, contributions, investments, credibility, apply, and manage (swap UI, recommendation form, document upload, member list all implemented)

---

### 🔶 SECTION 14 — Notifications

- [x] Application submitted — `ELITE_CLUB_APP_SUBMITTED` to applicant
- [x] Application approved — `ELITE_CLUB_APP_APPROVED` to applicant
- [x] Application rejected + reason — `ELITE_CLUB_APP_REJECTED` to applicant
- [x] Club activated (11 members formed) — `ELITE_CLUB_ACTIVATED` to all 11 members
- [ ] Contribution due reminder (**MISSING** — no scheduler)
- [ ] Contribution missed notification (**MISSING** — no automated trigger)
- [ ] Member defaulted — notification to admin + all club members (**PARTIAL** — `flagDefault` only notifies if auto-suspended; no club-wide notification on first default)
- [x] Member suspended — `ELITE_CLUB_SUSPENDED` to member (on auto-suspend at default #3)
- [x] Empowerment payout scheduled — `ELITE_CLUB_PAYOUT_SCHEDULED` to next-in-rotation
- [x] Empowerment payout released — `ELITE_CLUB_PAYOUT_RELEASED` to recipient
- [x] Payout blocked (default) — `ELITE_CLUB_PAYOUT_BLOCKED` to member (in `releasePayout` when credibility < 3)
- [x] Swap request received — `ELITE_CLUB_SWAP_REQUEST` to target member
- [x] Swap accepted — `ELITE_CLUB_SWAP_ACCEPTED` to requester
- [x] Swap rejected — `ELITE_CLUB_SWAP_REJECTED` to requester
- [ ] Investment recommendation submitted — notification to admin/compliance (**MISSING**)
- [x] Vote opened — `ELITE_CLUB_VOTE_OPEN` to all club members (in `submitLegalReview`)
- [x] Vote result finalized — `ELITE_CLUB_INVESTMENT_APPROVED` / `ELITE_CLUB_INVESTMENT_REJECTED` to all ACTIVE club members
- [x] Investment funded — `ELITE_CLUB_INVESTMENT_FUNDED` to all ACTIVE club members (in `fundInvestment`)
- [ ] Proof of deposit uploaded — notification to all 11 members (**MISSING** — `fundInvestment` sends funded notification but not a separate proof-uploaded event)
- [x] Member reinstated — `ELITE_CLUB_REINSTATED` to member
- [x] Token holdings verified — `ELITE_CLUB_TOKEN_VERIFIED` to member
- [x] Investment recommendation rejected — `ELITE_CLUB_INVESTMENT_REJECTED` to recommender

**🔶 PARTIAL** — 17/21 notification events implemented; missing: contribution reminder, contribution missed, default club-broadcast, investment recommendation-to-admin

---

### 🔶 SECTION 15 — Revenue Integration (Profit Pool)

- [x] Monthly ops fee BPI share → `recordRevenue(source: "ELITE_CLUB_OPS")` on each `recordContribution`
- [x] Optional investment profit share → `recordRevenue(source: "ELITE_CLUB_INVESTMENT_PROFIT")` on `recordInvestmentReturn` if `bpiProfitShareEnabled`
- [x] Revenue tagged with `programType: "ELITE_CLUB"`, `clubId`, `tier`, `month`/`year` (passed in both `recordRevenue` calls)
- [x] Both `ELITE_CLUB_OPS` and `ELITE_CLUB_INVESTMENT_PROFIT` in `RevenueSource` union → appear in `/admin/revenue-pools`
- [x] Revenue pool split (50/30/20) applied via existing `allocateRevenue()` logic (unchanged)

**✅ COMPLETE** — both revenue sources recording correctly with program-level metadata tagging

---

### 🔶 IMPLEMENTATION PRIORITY ORDER

**🔴 Critical (Core Engine)**
1. [x] Database schema — all models, enums, relations (Section 1) — **DONE** (14/15 items; `EliteClubOperationsFee` missing)
2. [x] Club formation controls + tier-based formation status (Section 2) — **PARTIAL**
3. [x] Onboarding gate eligibility engine — Gold Plus + invites + token (Section 3) — **PARTIAL** (BPT/PAC gates only)
4. [x] Application submission + document upload (Section 3) — **PARTIAL** (no auto-club-assign, no doc completeness check)
5. [x] Monthly contribution tracking + empowerment/investment split (Section 4) — **PARTIAL** (manual only, no deadline enforcement)
6. [x] Empowerment rotation queue + monthly payout scheduler (Section 5) — **PARTIAL** (manual scheduling only)
7. [x] Operations fee automatic deduction (10%, 5%+5%) per contribution (Section 6) — **PARTIAL** (fee computed, no ops wallet model)

**🟡 Important (Governance & Investment)**
8. [x] Investment pool balance tracking + 50/50 category allocation (Sections 7–8) — **PARTIAL** (balance tracked; 50/50 not enforced)
9. [x] Investment recommendation eligibility + submission (Section 8) — **PARTIAL** (≥7 gate, not = 10)
10. [x] Legal/compliance review workflow (Section 8) — **DONE**
11. [x] 11-member voting system (Section 8) — **PARTIAL** (hardcoded quorum, no deadline)
12. [x] Fund release + proof of deposit upload (Section 8) — **DONE**
13. [x] BPI optional profit share per investment (Section 8) — **DONE**

**🟠 Core Controls**
14. [x] Credibility scoring engine — all events, clamping, audit log (Section 10) — **PARTIAL** (CONTRIBUTION_MISSED and GUARANTEE_DEFAULT events not triggered)
15. [x] Default / suspension / legal enforcement logic (Section 11) — **PARTIAL** (DEFAULTED status not set on first default; no admin notification on flag)
16. [x] Guarantor qualification levels 1–4 (Section 9) — **PARTIAL** (score gate exists; co-op/token checks missing)
17. [x] Swap of rotation number request/approval (Section 5) — **DONE**

**🟢 Enhancement & Completeness**
18. [x] Full admin CMS — all configurable thresholds (Section 12) — **PARTIAL** (many keys exist but not read dynamically)
19. [x] Client-side member dashboard (Section 13) — **PARTIAL** (5 tabs; missing swap UI, rec form, doc upload, member list)
20. [x] Notification system — full lifecycle (Section 14) — **PARTIAL** (14/21 events)
21. [x] Revenue Pool integration for ops + profit share (Section 15) — **PARTIAL** (no metadata tagging)
22. [ ] Token holding re-verification at each monthly cycle (Section 3e) — **MISSING**
23. [x] Opt-out + replacement workflow (Section 5d) — **DONE**

---

### 🟩 QUICK REFERENCE — Feature Checklist

| Feature                                              | Status | Location                                              |
|------------------------------------------------------|--------|-------------------------------------------------------|
| Club tier structure (Silver/Gold/Platinum/Diamond)   | ✅     | `EliteClub` model + schema                            |
| Multiple clubs per tier, 11-member cap               | ✅     | Application guard + `activateClub`                    |
| Formation status (Open/Paused/Closed) — global       | ✅     | `AdminSettings` + `setFormationStatus`                |
| Formation status **per tier** control                | 🔶     | Single global key only; per-tier override missing     |
| Gold Plus + 2 Gold Plus invites gate                 | 🟥     | NOT IMPLEMENTED in `checkEligibility`                 |
| BPT + PACToken holding verification — proof upload   | ✅     | `submitTokenHolding`, `adminApproveTokenHolding`      |
| BPT + PACToken — wallet connect on-chain             | 🟥     | NOT IMPLEMENTED                                       |
| 5-document application + admin review                | 🔶     | `uploadDocument` exists; per-doc verify missing       |
| Monthly contribution split (empowerment + investment)| ✅     | `recordContribution` (80/20 hardcoded)                |
| 10% ops fee deduction (5% ops + 5% BPI revenue)     | 🔶     | BPI revenue recorded; ops fee model absent            |
| Empowerment rotation queue (1–11)                    | ✅     | `EliteClubEmpowermentPayout` + `getRotationQueue`     |
| Rotation swap request/approval                       | ✅     | `requestSwap` + `respondToSwap`                       |
| Opt-out + replacement                                | ✅     | `optOut` + `replaceOptedOutMember`                    |
| Investment pool 50/50 digital/offline                | 🔶     | Model exists; enforcement at proposal time missing    |
| Investment recommendation (credibility gate ≥ 7)    | 🔶     | `submitInvestmentRecommendation` (spec says = 10)     |
| Legal/compliance review workflow                     | ✅     | `submitLegalReview`                                   |
| 11-member vote (majority configurable)               | 🔶     | `castVote`, `getVoteResults` (quorum hardcoded at 8)  |
| Fund release + proof of deposit                      | ✅     | `approveInvestment` + `fundInvestment`                |
| Optional BPI profit share per investment (max 5%)    | ✅     | `bpiProfitShareEnabled` + `recordInvestmentReturn`    |
| Credibility score (0–10, event-driven)               | 🔶     | Core events done; MISSED/GUARANTEE_DEFAULT absent     |
| Default / suspension / legal enforcement             | 🔶     | `flagDefault`, `reinstateMember`, `EliteClubLegalEvent`|
| Guarantor levels 1–4                                 | 🔶     | `assignGuarantor`, `checkGuarantorEligibility` (partial)|
| Admin-configurable all thresholds                    | 🔶     | 18 AdminSettings keys; many not read dynamically      |
| Admin CMS page (8 tabs)                              | 🔶     | `/admin/elite-club` — contributions+legal tabs stubs  |
| Member dashboard (6 tabs)                            | ✅     | `/elite-club` — Manage tab added: swap, rec form, doc upload, member list |
| Notification lifecycle (21 event types)              | 🔶     | 14/21 implemented                                     |
| Revenue Pool integration                             | ✅     | Sources registered with full metadata tagging         |

---

### 🟥 KNOWN GAPS — Action Required

| # | Gap | Priority | Section |
|---|-----|----------|---------|
| 1 | ~~`EliteClubOperationsFee` model not created~~ ✅ DONE | Medium | 1d, 6a |
| 2 | Gold Plus membership gate missing from eligibility check | High | 3a |
| 3 | 2× Gold Plus invites gate missing from eligibility check | High | 3a |
| 4 | Auto-club-assign on application submission | Medium | 3c |
| 5 | Per-doc admin verification procedure | Low | 3d |
| 6 | Wallet connect (Web3) token holding verification | Low | 3e |
| 7 | Token re-check at monthly contribution cycle | Medium | 3e |
| 8 | Contribution deadline + auto-MISSED status transition (cron) | High | 4c |
| 9 | `CONTRIBUTION_MISSED` credibility auto-trigger | High | 4c, 10 |
| 10 | Rotation auto-assign on `activateClub` (randomly or sequentially) | Medium | 5a |
| 11 | Auto-spawn new FORMING club on existing club activation | Low | 2b |
| 12 | Payout amount auto-calculated from member contributions | Medium | 5b |
| 13 | ~~Guard: post-payout member cannot swap rotation~~ ✅ DONE | Low | 5c |
| 14 | ~~Opt-out notification + replacement confirmation notification~~ ✅ DONE | Low | 5d |
| 15 | ~~Formation status blocked on `submitApplication`~~ ✅ DONE | High | 2a |
| 16 | 50/50 category enforcement at investment proposal | Medium | 7a |
| 17 | Credibility gate = 10 for investment recommender (currently ≥ 7) | Medium | 8a |
| 18 | Vote deadline enforcement | Medium | 8d |
| 19 | ~~Vote quorum read from CMS (currently hardcoded = 8)~~ ✅ DONE | Low | 8d |
| 20 | ~~Vote-result-finalized notification to all members~~ ✅ DONE | Low | 8d |
| 21 | ~~Guarantor accountability — `GUARANTEE_DEFAULT` → guarantor's credibility~~ ✅ DONE | Medium | 9c |
| 22 | ~~`SUSPENSION` credibility event in `flagDefault`~~ ✅ DONE | Low | 10, 11 |
| 23 | ~~`status = DEFAULTED` on first default in `flagDefault`~~ ✅ DONE | Medium | 11 |
| 24 | ~~Admin notification on legal flag raised~~ ✅ DONE | Low | 11 |
| 25 | Admin CMS: contributions tab full implementation | Low | 12g |
| 26 | Admin CMS: legal events tab full implementation | Low | 12g |
| 27 | Exportable audit reports (CSV/PDF) | Low | 12g |
| 28 | ~~Member swap UI in dashboard~~ ✅ DONE | Medium | 13 |
| 29 | ~~Member investment recommendation form in dashboard~~ ✅ DONE | Medium | 13 |
| 30 | ~~Member document upload widget~~ ✅ DONE | Medium | 13 |
| 31 | ~~Club member list view (rotation, status, default flags)~~ ✅ DONE | Medium | 13 |
| 32 | ~~Revenue tagging with `programType`, `clubId`, `tier`, `month`/`year`~~ ✅ DONE | Low | 6c, 15 |
| 33 | Empowerment/investment share split % read from CMS | Low | 4a, 12c |
| 34 | Credibility delta values read from CMS | Low | 10, 12f |
| 35 | Token gate enabled/disabled toggle per tier | Low | 3b, 12b |

---

Personnel:  
Victoria Kanma – Quality Assessment (Structural Design, UI/UX Rendition)  
Alatari Douglas – Quality Assessment (Codebase, Local/Git Repo, Implementation Standard)  
Zino Abraham – Tester (Client Side)  
Oghenekaro Ogege – Tester (Client Side)  
Godbless Osaro – Quality Assessment (Admin UI/UX, RBAC, Schema)
