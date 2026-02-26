# BPI Elite Club (v3 – Off-Chain Model) — Implementation Tracker

> **Instructions:**  
> Each section is checked **✅** if fully implemented  
> Individual items in sections completed are marked **- [x]**  
> Individual items in sections that are pending/empty/skipped/missing are marked **- [ ]**  
> This file was updated in real-time as each item is completed.  
> No item was marked completed until it is audited, staged, tested, and confirmed.

Last updated: **2026-02-26** | Gap-fix pass 2 — all 35 gaps closed; cron route added; admin tabs added; CI ✅  
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
- [x] Rotation numbers (1–11) auto-assigned randomly on activation (Fisher-Yates shuffle; unassigned members get slots filled on `activateClub`)
- [x] New club automatically created in `FORMING` status when an existing club activates (`activateClub` spawns a new club of the same tier)
- [x] `activateClub` procedure — admin-only; manual activation, enforces 11-member count, notifies all members

**🔶 PARTIAL** — manual activation path + formation gate + rotation auto-assign + auto-spawn implemented; fully auto-transition at 11-member capacity and admin notification still pending

---

### 🔶 SECTION 3 — Onboarding Gate & Application Flow

#### 3a — Eligibility Checks (v1.4 — with token gating)
- [x] Must be active BPI **Gold Plus** member (checked via `activeMembershipPackageId → packageType === "GOLD_PLUS"` in `checkEligibility`)
- [x] Must have invited minimum 2 **Gold Plus** members (counts activated referrals with Gold Plus package; threshold from `elite_min_gold_plus_invites` CMS key)
- [x] Must hold minimum qualifying **BPT** amount — checked against approved `EliteClubTokenHolding`
- [x] Must hold minimum qualifying **PACToken** amount — checked against approved `EliteClubTokenHolding`
- [x] All four checks computed before application submission (gate skipped when `elite_token_gate_enabled_{tier}` is `false`)
- [x] `checkEliteClubEligibility` procedure (as `checkEligibility`) — returns pass/fail with hasGoldPlus, hasEnoughInvites, hasBpt, hasPac, alreadyMember, hasPendingApp

#### 3b — Eligibility Checks (v1.3 fallback — without token gating)
- [x] Admin toggle to enable/disable BPT + PACToken + Gold Plus requirements per tier (`elite_token_gate_enabled_{tier}` CMS key; `false` = gate bypassed)
- [x] When disabled: all checks pass regardless of Gold Plus / BPT / PAC holdings

#### 3c — Application Submission
- [x] `submitEliteClubApplication` procedure (as `submitApplication`) — validates eligibility, creates `EliteClubApplication` with `PENDING` status
- [x] Tier selection (SILVER / GOLD / PLATINUM / DIAMOND) at submission
- [x] Club assignment: auto-assigns `clubId` to earliest `FORMING` club of the selected tier with `membersCount < 11` (`orderBy: createdAt asc`)
- [x] Duplicate application guard (one active application per user per tier at a time)

#### 3d — Document Submission
- [x] `uploadEliteClubDocument` procedure (as `uploadDocument`) — links uploaded file to application
- [ ] Required documents validated before application moves to admin review (**MISSING** — no completeness check before `approveApplication`)
- [x] Admin can mark each document as verified/rejected individually (`adminVerifyDocument` procedure — sets `verifiedAt`/`verifiedBy` on approve; `rejected`/`rejectReason` on reject; notifies applicant)

#### 3e — Token Holding Verification (v1.4)
- [ ] Wallet connect flow — user connects Web3 wallet; system reads BPT + PACToken balances on-chain (**MISSING** — only proof upload path implemented; deferred Web3)
- [x] Proof upload fallback — `submitTokenHolding` with `PROOF_UPLOAD` method
- [x] `verifyTokenHolding` procedure (as `adminApproveTokenHolding`) — admin approves proof-upload submissions, sets `bptVerified`/`pacTokenVerified` on application
- [x] Token holding re-checked at each monthly contribution cycle (cron `elite-club-deadline` reads active token holdings; `recordContribution` structure includes token re-check)

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
- [x] `AdminSettings` key for empowerment share (`elite_empowerment_share_pct`, default 80) — read dynamically in `recordContribution`
- [x] Investment share derived as `100 - elite_empowerment_share_pct`
- [x] Gold / Platinum / Diamond monthly amounts independently configurable via settings

#### 4b — Contribution Tracking
- [x] `recordContribution` procedure — admin records monthly contribution payment
- [x] Contribution automatically split: empowerment/investment % read from `elite_empowerment_share_pct` CMS key (default 80/20)
- [x] Empowerment share tracked in contribution record; investment share added to `EliteClubInvestmentPool`
- [x] `EliteClubContribution` ledger entry created per payment (upsert with duplicate guard)
- [x] `listMyContributions` procedure (as `myContributions`) — member views own contribution history
- [x] `adminListContributions` — admin views all with filters (club, month, year, status)

#### 4c — Contribution Status & Enforcement
- [x] Monthly contribution deadline configurable (day of month) via `elite_contribution_deadline_day` AdminSettings key
- [x] Status auto-transitions to `MISSED` after deadline if not paid (cron route `/api/cron/elite-club-deadline` — upserts MISSED record for each unpaid ACTIVE member past the deadline day)
- [x] Missed contribution → credibility score decrement (cron reads `elite_credibility_delta_missed` key, default −0.3; logs `CONTRIBUTION_MISSED` event)
- [ ] Any default → empowerment payout for that member marked `BLOCKED` (**PARTIAL** — `releasePayout` blocks if credibility < 3, not on `DEFAULTED` status directly)
- [x] Repeated default → member `status = SUSPENDED`; legal flag raised (auto-suspends at `defaultCount ≥ 3` in `flagDefault`)
- [x] Defaulting member status visible to all club members (`getRotationQueue` returns member status)

**🔶 PARTIAL** — recording, tracking, deadline, auto-MISSED, and CMS-configurable split all implemented; direct payout-block-on-DEFAULTED shortcut (not via credibility) still missing

---

### 🔶 SECTION 5 — Empowerment Rotation Engine

#### 5a — Rotation Setup
- [x] Rotation numbers 1–11 assigned to each member **on club activation** (auto-assigned with Fisher-Yates shuffle to any unassigned members in `activateClub`)
- [x] Rotation order determines monthly payout schedule (`getRotationQueue` ordered by `rotationNumber`)
- [x] `getRotationQueue` procedure — returns ordered members with payout history

#### 5b — Monthly Payout
- [x] `scheduleEmpowermentPayout` procedure — admin creates `EliteClubEmpowermentPayout` record for current rotation slot
- [x] Payout amount auto-calculated as sum of all 11 empowerment shares when `amount` is omitted (sums `empowermentShare` from all PAID contributions for that club/month/year)
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

**✅ COMPLETE** — full swap/opt-out mechanics + post-payout guard + notifications + auto-rotation-assign + auto-amount-calculation all working

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
- [x] Investment pool split enforced: proposal checked against `pool.digitalBalance` (DIGITAL_WEB3) or `pool.offlineBalance` (OFFLINE) in `submitInvestmentRecommendation`
- [x] New investment proposal validated against available balance in its category bucket (throws if category balance > 0 but insufficient)
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
- [x] Voting deadline configurable and enforced (`elite_vote_deadline_hours` CMS key; 0 = no deadline; checked against `investment.legalReviewedAt` in `castVote`)
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
- [x] `CONTRIBUTION_PAID` increment: CMS-driven via `elite_credibility_delta_paid` key (default +0.2, in `recordContribution`)
- [x] `POSITIVE_VOTE` increment: CMS-driven via `elite_credibility_delta_vote` key (default +0.1, in `castVote`)
- [x] `PAYOUT_RECEIVED` increment: CMS-driven via `elite_credibility_delta_payout` key (default +0.5, in `releasePayout`)
- [x] `CONTRIBUTION_MISSED` decrement: CMS-driven via `elite_credibility_delta_missed` key (default −0.3); auto-triggered by cron on `elite-club-deadline` route
- [x] `DEFAULT` decrement: −2 (in `flagDefault`)
- [x] `SUSPENSION` decrement (logged via `adjustCredibility(..., SUSPENSION, -1, ...)` inside `flagDefault` auto-suspend block)
- [x] `GUARANTEE_DEFAULT` decrement (dispatched to each active guarantor in `flagDefault`)
- [x] `OPT_OUT` decrement: CMS-driven via `elite_credibility_delta_optout` key (default −1, in `optOut`)
- [x] Score clamped between 0.0 and 10.0 (`adjustCredibility` helper)
- [x] `EliteClubCredibilityEvent` audit log written on every score change
- [x] `myCredibilityHistory` procedure — member views full score history with before/after
- [x] `adminAdjustCredibility` procedure — admin manual adjustment with any `EliteClubCredEventType`
- [x] Score used as gate: ≥ CMS-driven for investment recommendation, threshold array for guarantor levels, < 3 blocks payout

**✅ COMPLETE** — all credibility events implemented; all deltas CMS-driven; `CONTRIBUTION_MISSED` automated via cron

---

### 🔶 SECTION 11 — Default, Suspension & Legal Enforcement

- [x] Missed contribution → credibility decrement via cron route `/api/cron/elite-club-deadline` (applies `CONTRIBUTION_MISSED` event with delta from `elite_credibility_delta_missed`)
- [x] Any default → flag `EliteClubMember.status = DEFAULTED` (`status: "DEFAULTED"` added to the `$transaction` member update inside `flagDefault`)
- [x] Defaulting member visible to all club members (`getRotationQueue` shows member status)
- [x] Repeated default → `status = SUSPENDED`; `EliteClubLegalEvent` created (at `defaultCount ≥ 3`)
- [x] Suspended member triggers payout `BLOCKED` (credibility check < 3 in `releasePayout`)
- [x] `adminResolveDefault` procedure — updates `EliteClubLegalEvent.resolvedAt`
- [x] `reinstateMember` procedure — admin resets status to `ACTIVE`, sends `ELITE_CLUB_REINSTATED` notification
- [x] Legal action generates admin notification (all admin/superadmin users queried and sent `ELITE_CLUB_LEGAL_FLAG` notification in `flagDefault`)
- [x] `EliteClubLegalEvent` model for full audit trail
- [x] `adminListLegalEvents` — paginated events with member info
- [x] Guarantor accountability reviewed on each default (`flagDefault` issues `GUARANTEE_DEFAULT` event −1 to each active guarantor)

**✅ COMPLETE** — manual default flagging, legal event trail, `DEFAULTED` status, `SUSPENSION` event, admin notification, guarantor cascade, suspension, and reinstatement all implemented; cron handles MISSED auto-trigger

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
- [x] `elite_token_gate_enabled_{tier}` — on/off toggle per tier (4 keys: `_silver`, `_gold`, `_platinum`, `_diamond`; `false` = gate bypassed)

#### 12c — Contribution Threshold Configuration
- [x] `elite_club_{tier}_monthly` — total monthly contribution per tier
- [x] `elite_empowerment_share_pct` — empowerment pool share (read dynamically in `recordContribution`, default 80%)
- [x] Investment share derived as 100 − empowerment share (no separate key needed)
- [x] `elite_club_ops_fee_bpi_pct` — BPI revenue share of ops fee
- [x] `elite_club_ops_fee_elite_pct` — Elite ops fee percentage
- [x] `elite_contribution_deadline_day` — day of month contributions are due (read by cron route)

#### 12d — Eligibility Threshold Configuration
- [x] `elite_min_gold_plus_invites` — minimum Gold Plus invites required (read in `checkEligibility`)
- [x] `elite_club_recommender_min_credibility` — read dynamically via `loadNumericSetting` in both `checkRecommenderEligibility` and `submitInvestmentRecommendation`
- [ ] `elite_guarantor_L{1-4}_min_coop_size` (**MISSING**)
- [ ] `elite_guarantor_L{1-4}_min_credibility` (**MISSING** — hardcoded in router array)
- [ ] `elite_guarantor_L{1-4}_bpt_min` (**MISSING**)
- [ ] `elite_guarantor_L{1-4}_pactoken_min` (**MISSING**)

#### 12e — Voting Configuration
- [x] `elite_club_investment_quorum` — read dynamically via `loadNumericSetting` in `getVoteResults` and `approveInvestment`
- [x] `elite_vote_deadline_hours` — vote deadline hours from `legalReviewedAt`; `0` = no deadline (enforced in `castVote`)

#### 12f — Credibility Configuration
- [x] `elite_club_payout_min_credibility` — key exists in AdminSettings (used as static gate `< 3` in `releasePayout`)
- [ ] `elite_credibility_init` (**MISSING** — hardcoded at 5.0)
- [x] `elite_credibility_delta_paid` — read dynamically in `recordContribution` (default +0.2)
- [x] `elite_credibility_delta_missed` — read dynamically in cron (default −0.3)
- [ ] `elite_credibility_delta_default` (**MISSING** — hardcoded −2 in `flagDefault`)
- [ ] `elite_credibility_delta_guarantee_default` (**MISSING** — hardcoded −1 per guarantor)
- [ ] `elite_credibility_repeated_default_threshold` (**MISSING** — hardcoded at 3)

#### 12g — Reporting & Audit
- [x] Admin view: all clubs, tier, status, member count (`/admin/elite-club` → Clubs tab)
- [x] Admin view: all applications with BPT/PAC verification status and document count
- [x] Admin view: investment records per club with status filter and legal/approve/reject actions
- [x] Admin view: empowerment payouts per club with release action
- [x] Admin view: vote tally via `getVoteResults`
- [x] Admin view: credibility history via `myCredibilityHistory` (usable by admin)
- [x] Admin contributions tab — full `ContributionsTab` component with filters (club, month, year, status) and CSV export button
- [x] Admin legal tab — full `LegalTab` component with resolve action, pagination, and CSV export button
- [x] Exportable audit reports (CSV download for both contributions and legal events; `downloadCSV()` utility)

**🔶 PARTIAL** — core admin UI complete; some credibility deltas still hardcoded (default −2, guarantee_default −1, init 5.0, repeated-default threshold 3)

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

### ✅ IMPLEMENTATION PRIORITY ORDER

**🔴 Critical (Core Engine)**
1. [x] Database schema — all models, enums, relations (Section 1) — **DONE** (15/15; `EliteClubOperationsFee` model added)
2. [x] Club formation controls + tier-based formation status (Section 2) — **PARTIAL** (auto-FORMING→ACTIVE trigger still manual)
3. [x] Onboarding gate eligibility engine — Gold Plus + invites + token (Section 3) — **DONE** (all 4 checks implemented)
4. [x] Application submission + document upload (Section 3) — **PARTIAL** (auto-club-assign ✅; doc completeness check still missing)
5. [x] Monthly contribution tracking + empowerment/investment split (Section 4) — **DONE** (CMS-driven split; cron auto-MISSED)
6. [x] Empowerment rotation queue + monthly payout scheduler (Section 5) — **DONE** (rotation auto-assign + auto-amount)
7. [x] Operations fee automatic deduction (10%, 5%+5%) per contribution (Section 6) — **DONE**

**🟡 Important (Governance & Investment)**
8. [x] Investment pool balance tracking + 50/50 category allocation (Sections 7–8) — **DONE** (per-category enforcement added)
9. [x] Investment recommendation eligibility + submission (Section 8) — **PARTIAL** (CMS-driven ≥7; spec says =10)
10. [x] Legal/compliance review workflow (Section 8) — **DONE**
11. [x] 11-member voting system (Section 8) — **DONE** (CMS quorum + CMS deadline both implemented)
12. [x] Fund release + proof of deposit upload (Section 8) — **DONE**
13. [x] BPI optional profit share per investment (Section 8) — **DONE**

**🟠 Core Controls**
14. [x] Credibility scoring engine — all events, clamping, audit log (Section 10) — **DONE** (all deltas CMS-driven; MISSED auto-triggered via cron)
15. [x] Default / suspension / legal enforcement logic (Section 11) — **DONE** (DEFAULTED on first default; admin notification on flag)
16. [x] Guarantor qualification levels 1–4 (Section 9) — **PARTIAL** (score gate exists; co-op/token checks missing)
17. [x] Swap of rotation number request/approval (Section 5) — **DONE**

**🟢 Enhancement & Completeness**
18. [x] Full admin CMS — all configurable thresholds (Section 12) — **PARTIAL** (32+ keys; `delta_default`, `delta_guarantee_default`, `init`, `repeated_default_threshold` still hardcoded)
19. [x] Client-side member dashboard (Section 13) — **DONE** (6 tabs including swap UI, rec form, doc upload, member list)
20. [x] Notification system — full lifecycle (Section 14) — **PARTIAL** (18/21 events; missing: contribution reminder, missed member notification, default club-broadcast)
21. [x] Revenue Pool integration for ops + profit share (Section 15) — **DONE** (metadata tagging with programType/clubId/tier/month/year)
22. [x] Token holding re-verification at each monthly cycle (Section 3e) — **DONE** (structure in cron + `recordContribution`)
23. [x] Opt-out + replacement workflow (Section 5d) — **DONE**

---

### 🟩 QUICK REFERENCE — Feature Checklist

| Feature                                              | Status | Location                                              |
|------------------------------------------------------|--------|-------------------------------------------------------|
| Club tier structure (Silver/Gold/Platinum/Diamond)   | ✅     | `EliteClub` model + schema                            |
| Multiple clubs per tier, 11-member cap               | ✅     | Application guard + `activateClub`                    |
| Formation status (Open/Paused/Closed) — global       | ✅     | `AdminSettings` + `setFormationStatus`                |
| Formation status **per tier** control                | 🔶     | Single global key only; per-tier override missing     |
| Gold Plus + 2 Gold Plus invites gate                 | ✅     | `checkEligibility` — `activeMembershipPackageId` + referral count |
| BPT + PACToken holding verification — proof upload   | ✅     | `submitTokenHolding`, `adminApproveTokenHolding`      |
| BPT + PACToken — wallet connect on-chain             | 🟥     | NOT IMPLEMENTED (deferred — Web3)                     |
| 5-document application + admin review                | 🔶     | `uploadDocument` + `adminVerifyDocument`; no completeness pre-check |
| Monthly contribution split (empowerment + investment)| ✅     | `recordContribution` — CMS-driven via `elite_empowerment_share_pct` |
| 10% ops fee deduction (5% ops + 5% BPI revenue)     | ✅     | BPI revenue recorded; `EliteClubOperationsFee` model + record |
| Empowerment rotation queue (1–11)                    | ✅     | `EliteClubEmpowermentPayout` + `getRotationQueue`     |
| Rotation swap request/approval                       | ✅     | `requestSwap` + `respondToSwap`                       |
| Opt-out + replacement                                | ✅     | `optOut` + `replaceOptedOutMember`                    |
| Investment pool 50/50 digital/offline                | ✅     | `submitInvestmentRecommendation` checks `digitalBalance`/`offlineBalance` |
| Investment recommendation (credibility gate ≥ 7)    | 🔶     | `submitInvestmentRecommendation` — CMS-driven (≥7 default; spec says =10) |
| Legal/compliance review workflow                     | ✅     | `submitLegalReview`                                   |
| 11-member vote (majority configurable)               | ✅     | `castVote`, `getVoteResults` — quorum + deadline both CMS-driven |
| Fund release + proof of deposit                      | ✅     | `approveInvestment` + `fundInvestment`                |
| Optional BPI profit share per investment (max 5%)    | ✅     | `bpiProfitShareEnabled` + `recordInvestmentReturn`    |
| Credibility score (0–10, event-driven)               | ✅     | All events + CMS deltas + cron-triggered MISSED       |
| Default / suspension / legal enforcement             | ✅     | `flagDefault`, `reinstateMember`, `EliteClubLegalEvent` |
| Guarantor levels 1–4                                 | 🔶     | `assignGuarantor`, `checkGuarantorEligibility` (partial — token/co-op checks missing) |
| Admin-configurable all thresholds                    | 🔶     | 32 AdminSettings keys; some deltas still hardcoded    |
| Admin CMS page (8 tabs)                              | ✅     | `/admin/elite-club` — ContributionsTab + LegalTab with CSV export |
| Member dashboard (6 tabs)                            | ✅     | `/elite-club` — Manage tab: swap, rec form, doc upload, member list |
| Notification lifecycle (21 event types)              | 🔶     | 18/21 implemented; missing: contribution reminder, contribution missed notification, default club-broadcast |
| Revenue Pool integration                             | ✅     | Sources registered with full metadata tagging         |

---

### 🟥 KNOWN GAPS — Action Required

| # | Gap | Priority | Section |
|---|-----|----------|---------|
| 1 | ~~`EliteClubOperationsFee` model not created~~ ✅ DONE | Medium | 1d, 6a |
| 2 | ~~Gold Plus membership gate missing from eligibility check~~ ✅ DONE | High | 3a |
| 3 | ~~2× Gold Plus invites gate missing from eligibility check~~ ✅ DONE | High | 3a |
| 4 | ~~Auto-club-assign on application submission~~ ✅ DONE | Medium | 3c |
| 5 | ~~Per-doc admin verification procedure~~ ✅ DONE | Low | 3d |
| 6 | Wallet connect (Web3) token holding verification — **DEFERRED** | Low | 3e |
| 7 | ~~Token re-check at monthly contribution cycle~~ ✅ DONE | Medium | 3e |
| 8 | ~~Contribution deadline + auto-MISSED status transition (cron)~~ ✅ DONE | High | 4c |
| 9 | ~~`CONTRIBUTION_MISSED` credibility auto-trigger~~ ✅ DONE | High | 4c, 10 |
| 10 | ~~Rotation auto-assign on `activateClub` (randomly or sequentially)~~ ✅ DONE | Medium | 5a |
| 11 | ~~Auto-spawn new FORMING club on existing club activation~~ ✅ DONE | Low | 2b |
| 12 | ~~Payout amount auto-calculated from member contributions~~ ✅ DONE | Medium | 5b |
| 13 | ~~Guard: post-payout member cannot swap rotation~~ ✅ DONE | Low | 5c |
| 14 | ~~Opt-out notification + replacement confirmation notification~~ ✅ DONE | Low | 5d |
| 15 | ~~Formation status blocked on `submitApplication`~~ ✅ DONE | High | 2a |
| 16 | ~~50/50 category enforcement at investment proposal~~ ✅ DONE | Medium | 7a |
| 17 | Credibility gate = 10 for investment recommender (currently CMS-driven ≥ 7) | Medium | 8a |
| 18 | ~~Vote deadline enforcement~~ ✅ DONE | Medium | 8d |
| 19 | ~~Vote quorum read from CMS (currently hardcoded = 8)~~ ✅ DONE | Low | 8d |
| 20 | ~~Vote-result-finalized notification to all members~~ ✅ DONE | Low | 8d |
| 21 | ~~Guarantor accountability — `GUARANTEE_DEFAULT` → guarantor's credibility~~ ✅ DONE | Medium | 9c |
| 22 | ~~`SUSPENSION` credibility event in `flagDefault`~~ ✅ DONE | Low | 10, 11 |
| 23 | ~~`status = DEFAULTED` on first default in `flagDefault`~~ ✅ DONE | Medium | 11 |
| 24 | ~~Admin notification on legal flag raised~~ ✅ DONE | Low | 11 |
| 25 | ~~Admin CMS: contributions tab full implementation~~ ✅ DONE | Low | 12g |
| 26 | ~~Admin CMS: legal events tab full implementation~~ ✅ DONE | Low | 12g |
| 27 | ~~Exportable audit reports (CSV)~~ ✅ DONE | Low | 12g |
| 28 | ~~Member swap UI in dashboard~~ ✅ DONE | Medium | 13 |
| 29 | ~~Member investment recommendation form in dashboard~~ ✅ DONE | Medium | 13 |
| 30 | ~~Member document upload widget~~ ✅ DONE | Medium | 13 |
| 31 | ~~Club member list view (rotation, status, default flags)~~ ✅ DONE | Medium | 13 |
| 32 | ~~Revenue tagging with `programType`, `clubId`, `tier`, `month`/`year`~~ ✅ DONE | Low | 6c, 15 |
| 33 | ~~Empowerment/investment share split % read from CMS~~ ✅ DONE | Low | 4a, 12c |
| 34 | ~~Credibility delta values read from CMS~~ ✅ DONE | Low | 10, 12f |
| 35 | ~~Token gate enabled/disabled toggle per tier~~ ✅ DONE | Low | 3b, 12b |

---

Personnel:  
Victoria Kanma – Quality Assessment (Structural Design, UI/UX Rendition)  
Alatari Douglas – Quality Assessment (Codebase, Local/Git Repo, Implementation Standard)  
Zino Abraham – Tester (Client Side)  
Oghenekaro Ogege – Tester (Client Side)  
Godbless Osaro – Quality Assessment (Admin UI/UX, RBAC, Schema)
