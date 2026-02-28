# BPI TechQuiz Competition — Implementation Tracker

> **Instructions:**  
> Each section is checked **✅** if fully implemented  
> Individual items in sections completed are marked **- [x]**  
> Individual items in sections that are pending/empty/skipped/missing are marked **- [ ]**  
> This file is updated in real-time as each item is completed.  
> No item is marked completed until it is audited, staged, tested, and confirmed.

Last updated: **2026-02-27** | Sections 1–16 fully implemented — ALL COMPLETE  
Maintained by **BPI Engineering Team**  
Reviewed and approved by **Richard Obroh, CTO, BPI**

Reference spec: **BPI TechQuiz Competition Master Specification v1.0** (Board Approval Draft)

> **Implementation Note:** This tracker covers the full BPI TechQuiz system — a state-based STEM competition platform for secondary school students. It encompasses parent/child onboarding, school partnership, CBT engine, onsite scoring, rankings, awards, sponsorship, compliance, and notifications. All modules are new-build; no prior codebase exists for this feature.

---

### ✅ SECTION 1 — Database Schema (TechQuiz Models)

#### 1a — Event Model
- [x] `TechQuizEvent` model — core event entity (`id`, `title`, `state`, `status`, `applicationWindowStart`, `applicationWindowEnd`, `sponsorshipPackagePrice`, `topQualifiersPerSchool`, `cbtWeightPct`, `onsiteWeightPct`, `createdAt`, `publishedAt`, `completedAt`)
- [x] `status` enum: `DRAFT`, `APPROVED`, `PUBLISHED`, `COMPLETED`, `ARCHIVED`
- [x] `Round1Schedule` model — (`id`, `eventId`, `venueDescription`, `cbtWindowStart`, `cbtWindowEnd`, `notes`)
- [x] `Round2Schedule` model — (`id`, `eventId`, `venueDescription`, `cbtWindowStart`, `cbtWindowEnd`, `onsiteDate`, `notes`)
- [x] Awards configuration embedded or in separate `TechQuizAwardBracket` model — (`id`, `eventId`, `minRank`, `maxRank`, `awardDescription`, `bpiActivationGranted`)

#### 1b — School Models
- [x] `TechQuizSchool` model — (`id`, `name`, `state`, `contactName`, `contactEmail`, `contactPhone`, `mouSigned`, `mouSignedAt`, `status`, `createdAt`)
- [x] `status` enum on school: `PENDING`, `APPROVED`, `SUSPENDED`
- [x] `TechQuizEventSchool` model (junction) — (`id`, `eventId`, `schoolId`, `minStudents`, `maxStudents`, `participationStatus`, `approvedAt`)
- [x] `participationStatus` enum: `APPROVED`, `ELIGIBLE`, `NOT_ELIGIBLE`, `CLOSED`
- [x] `SchoolAdminProfile` model — (`id`, `userId`, `schoolId`, `createdAt`, `isActive`) — lightweight school-side user profile

#### 1c — Parent / Child / Beneficiary Models
- [x] `TechQuizChildBeneficiary` model — (`id`, `parentUserId`, `childName`, `dateOfBirth`, `email`, `schoolId`, `state`, `parentalConsentGiven`, `parentalConsentAt`, `status`, `createdAt`)
- [x] `status` enum on child: `INACTIVE`, `TECH_QUIZ_ENABLED`, `ACTIVE`
- [x] `TechQuizChildProfile` model — (`id`, `childBeneficiaryId`, `state`, `schoolId`, `createdAt`) — state + school mapping for TechQuiz

#### 1d — Application Models
- [x] `TechQuizApplication` model — (`id`, `parentUserId`, `childBeneficiaryId`, `eventId`, `schoolId`, `state`, `paymentReference`, `paymentStatus`, `status`, `appliedAt`, `verifiedAt`, `verifiedBy`)
- [x] `status` enum on application: `APPLIED`, `SLOT_RESERVED`, `VERIFIED`, `REJECTED`, `ROUND1_ELIGIBLE`, `QUALIFIER`, `ROUND2_ELIGIBLE`
- [x] `paymentStatus` enum: `PENDING`, `PAID`, `REFUNDED`

#### 1e — CBT & Scoring Models
- [x] `TechQuizCBTSession` model — (`id`, `applicationId`, `round`, `startedAt`, `submittedAt`, `score`, `totalQuestions`, `status`)
- [x] `round` enum: `ROUND1`, `ROUND2`
- [x] `status` enum on CBT session: `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `SCORED`
- [x] `TechQuizOnsiteScore` model — (`id`, `applicationId`, `eventId`, `assessorUserId`, `presentationScore`, `logicalReasoningScore`, `useCaseScore`, `totalOnsiteScore`, `scoredAt`, `notes`)
- [x] Onsite scoring rubric configurable: `TechQuizScoringRubric` model — (`id`, `eventId`, `maxPresentation`, `maxLogicalReasoning`, `maxUseCase`)

#### 1f — Results & Ranking Models
- [x] `TechQuizResult` model — per student round/final result (`id`, `applicationId`, `eventId`, `round1Score`, `round2CbtScore`, `onsiteScore`, `finalScore`, `finalRank`, `intraSchoolRank`, `awardBracket`, `published`, `computedAt`)
- [x] `TechQuizQualifier` model — (`id`, `applicationId`, `eventId`, `schoolId`, `round1Rank`, `qualifiedAt`) — tracks top-N qualifiers per school post Round 1

#### 1g — Sponsorship Models
- [x] `TechQuizSponsor` model — (`id`, `userId`, `name`, `email`, `phone`, `status`, `createdAt`)
- [x] `TechQuizSponsorshipPackage` model — (`id`, `sponsorId`, `eventId`, `sponsorType`, `childrenCount`, `schoolId`, `totalAmount`, `paymentReference`, `paymentStatus`, `allocationPool`, `createdAt`)
- [x] `sponsorType` enum: `CHILD_PARENT`, `SCHOOL_COHORT`, `PRIZE_POOL`
- [x] `allocationPool` enum: `SCHOOL_POOL`, `EVENT_PRIZE_POOL`

#### 1h — Compliance & Audit Models
- [x] `TechQuizConsentLog` model — (`id`, `parentUserId`, `childBeneficiaryId`, `consentVersion`, `consentText`, `consentGivenAt`, `ipAddress`)
- [x] `TechQuizAuditLog` model — (`id`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`) — full audit trail for all critical state changes
- [x] `TechQuizLegalEvent` model — (`id`, `eventId`, `description`, `raisedBy`, `raisedAt`, `resolvedAt`, `resolvedBy`, `resolution`)

**✅ IMPLEMENTED 2026-02-26** — 20+ models, 10 enums, migration applied, Prisma client regenerated  
`prisma/schema.prisma` · `prisma/migrations/20260226000000_techquiz_initial/migration.sql`

---

### ✅ SECTION 2 — Admin CMS: TechQuiz Event Manager

#### 2a — Event Creation & Configuration
- [x] `createTechQuizEvent` procedure — admin creates event with: state, applicationWindowStart/End, sponsorshipPackagePrice, topQualifiersPerSchool (default 4), cbtWeightPct (default 55), onsiteWeightPct (default 45)
- [x] Round 1 schedule entry — venue, CBT window (start/end) configurable per event
- [x] Round 2 schedule entry — venue, CBT window, onsite date configurable per event
- [x] School quota configuration per event — default `minStudents = 10`, `maxStudents = 12`, admin-adjustable
- [x] Awards bracket configuration per event — 1st–3rd, 4th–10th, 11th–20th prize descriptions
- [x] Scoring rubric creation per event — max scores for each onsite component (presentation, logical reasoning, use-case)
- [x] CBT weight + onsite weight must sum to 100 (server-side validation)

#### 2b — School Assignment to Events
- [x] `assignSchoolToEvent` procedure — admin adds an approved school to an event with quota settings
- [x] `removeSchoolFromEvent` procedure — admin removes a school from an event (before applications open)
- [x] Admin bulk-assign schools from approved school list for a state
- [x] Per-school quota (minStudents, maxStudents) overridable after bulk assignment

#### 2c — Event Status Lifecycle Management
- [x] `updateEventStatus` procedure — admin transitions: `DRAFT → APPROVED → PUBLISHED → COMPLETED → ARCHIVED`
- [x] Guard: cannot publish event without at least one assigned school
- [x] Guard: cannot complete event without final results published
- [x] On `PUBLISHED`: system triggers broadcast notification to all eligible members (state-filtered if configured)
- [x] On `COMPLETED`: reporting locked; event archived after `COMPLETED`

#### 2d — Event Listing & Overview
- [x] `adminListTechQuizEvents` — paginated, filterable by state, status, date range
- [x] Admin event detail view — shows applications count, school participation summary, qualification progress, sponsorship raised
- [x] Extend / cancel school participation when minimum not reached by deadline
- [x] Admin configurable: extend application deadline per school or per event

**✅ COMPLETE** — `createEvent`, `updateEvent`, `upsertRound1Schedule`, `upsertRound2Schedule`, `upsertAwardBrackets`, `upsertScoringRubric`, `assignSchoolToEvent`, `removeSchoolFromEvent`, `updateSchoolQuota`, `updateEventStatus` (full lifecycle + guards), `adminListEvents`, `getEvent` — in `server/trpc/router/techquiz.ts`

---

### ✅ SECTION 3 — School Partnership & Verification Module

#### 3a — School Onboarding (Admin-Side)
- [x] `createSchool` procedure (admin-only) — creates `TechQuizSchool` with status `PENDING`
- [x] `approveSchool` procedure — admin sets status `APPROVED`; school appears in event assignment lists
- [x] `suspendSchool` procedure — admin sets status `SUSPENDED`; removes from active event availability
- [x] MoU/consent flag: `mouSigned` toggle + `mouSignedAt` timestamp (admin-managed)
- [x] Admin school list — paginated, filterable by state, status

#### 3b — School Admin Profile
- [x] `createSchoolAdminProfile` procedure — admin creates school-side user account linked to a school
- [x] School admin login — uses existing BPI auth with `SCHOOL_ADMIN` role flag
- [x] `getSchoolAdminProfile` procedure — returns linked school, event participations, pending verifications

#### 3c — School Dashboard
- [x] School admin: view all registered candidates per event (paginated)
- [x] School admin: approve or reject individual candidate eligibility — `verifyCandidate` procedure
- [x] School admin: view current quota status (slots used / total allowed)
- [x] School admin: download exam guidelines and schedules (PDF export or link)
- [x] School dashboard shows current `participationStatus` (Eligible / NotEligible / Pending)

#### 3d — Quota Engine
- [x] On application submission: check `currentEnrolled < maxStudents` for that school+event combination
- [x] Soft-lock slot on application creation (`SLOT_RESERVED` status) pending school verification
- [x] Release soft-locked slot if application is rejected by school or cancelled
- [x] When `approvedVerifications >= minStudents`: set `participationStatus = ELIGIBLE`
- [x] When `approvedVerifications >= maxStudents`: set `participationStatus = CLOSED`; reject new applications for that school
- [x] Admin can extend or adjust quotas before CBT window opens

**✅ COMPLETE** — `createSchool`, `approveSchool`, `suspendSchool`, `updateSchoolMoU`, `adminListSchools`, `createSchoolAdminProfile`, `getSchoolAdminProfile`, `schoolDashboardApplications`, `verifyCandidate` (quota engine integrated)

---

### ✅ SECTION 4 — Parent Eligibility & Child Registration Module

#### 4a — Parent Eligibility Check
- [x] `checkTechQuizEligibility` procedure — parent must hold ≥ Regular BPI membership
- [x] CTA "Apply for TechQuiz" shown on parent dashboard only when eligible
- [x] If ineligible: surfaced message with membership upgrade path

#### 4b — Child Beneficiary Record Creation
- [x] `createChildBeneficiary` procedure (parent-only) — creates `TechQuizChildBeneficiary` with status `INACTIVE`
- [x] Required fields: childName, dateOfBirth, email (child or parent), schoolId, state
- [x] Parental consent checkbox mandatory before creation (consent logged in `TechQuizConsentLog`)
- [x] Child data protection policy presented and acknowledged during creation flow
- [x] Child record linked to parent user ID
- [x] `updateChildBeneficiary` procedure — parent can update non-locked fields (name, DOB, email) before verification
- [x] Child profile wizard: progress indicators (3-step: personal info → school assignment → consent)

#### 4c — Application Submission
- [x] `applyForTechQuiz` procedure — parent selects published event → selects approved school → selects child(ren)
- [x] TechQuiz license/subscription purchased per child before application record created
- [x] Application record created with `status = APPLIED`, `paymentStatus = PAID`
- [x] Creates `TechQuizChildProfile` (state + school mapping) if not already existing
- [x] Child beneficiary status set to `TECH_QUIZ_ENABLED` on successful application
- [x] Duplicate application guard: one active application per child per event
- [x] Confirmation notification to parent on successful application

#### 4d — Application Status Tracker (Parent Dashboard)
- [x] Parent dashboard shows application status per child: `Applied → School Verified → Confirmed`
- [x] Status tracker widget: each state clearly labelled with timestamp
- [x] One-click application to published events available from parent dashboard CTA
- [x] Parent can view Round 1 and Round 2 results per child from dashboard

**✅ COMPLETE** — `checkParentEligibility`, `createChildBeneficiary` (consent log auto-created), `updateChildBeneficiary`, `myChildBeneficiaries`

---

### ✅ SECTION 5 — Application Processing & Quota Engine

#### 5a — Quota Validation on Application
- [x] On `applyForTechQuiz`: validate school is in approved school list for that event
- [x] Check `currentEnrolled < maxStudents` for that school+event before committing application
- [x] If quota full: reject with message "School quota reached for this event"
- [x] If quota available: reserve slot (`SLOT_RESERVED`) pending school verification
- [x] Quota count tracks only `SLOT_RESERVED` + `VERIFIED` (not `APPLIED` awaiting payment)

#### 5b — Payment Processing
- [x] TechQuiz license purchase integration — standard BPI payment flow
- [x] Payment reference stored on application (`paymentReference`)
- [x] `paymentStatus` updated to `PAID` on payment confirmation
- [x] Application only created after payment confirmed
- [x] Refund logic for rejected applications (admin-triggered; sets `paymentStatus = REFUNDED`)

#### 5c — School Verification Processing
- [x] `verifyCandidate` procedure (school admin only) — approve or reject individual application
- [x] On approve: set `application.status = VERIFIED`; retain `SLOT_RESERVED` slot
- [x] On reject: set `application.status = REJECTED`; release soft-locked slot; notify parent with reason
- [x] Quota engine recalculates `participationStatus` after each verification decision
- [x] Parent notified on school verification approved (`TECHQUIZ_APPLICATION_VERIFIED`)
- [x] Parent notified on school verification rejected with reason (`TECHQUIZ_APPLICATION_REJECTED`)

**✅ COMPLETE** — `applyForTechQuiz` (7-step quota + payment + duplicate guard), `verifyCandidate` (approve/reject, slot release, quota recalc, notifications), `adminListApplications`, `checkSchoolMinimumStatus`

---

### ✅ SECTION 6 — CBT Engine — Round 1 (Intra-School)

#### 6a — CBT Access Issuance
- [x] At configured CBT Material Release Date: system dispatches CBT instructions, exam window, venue, and login credentials to child + parent dashboard and via email notification
- [x] `issueCBTAccess` cron or admin trigger — sets `application.status = ROUND1_ELIGIBLE` for all `VERIFIED` applications where school `participationStatus = ELIGIBLE`
- [x] Login method: BPI TechQuiz Portal credentials mapped to child (`childBeneficiaryId`)
- [x] Access issuance notification sent to parent + school dashboard

#### 6b — CBT Session Execution
- [x] `startCBTSession` procedure — child (or proxy) initiates CBT session; validates: `ROUND1_ELIGIBLE` status + within CBT window + school `ELIGIBLE`
- [x] Creates `TechQuizCBTSession` with `status = IN_PROGRESS`
- [x] CBT Engine serves questions (question bank integration — separate module or static seed)
- [x] Session auto-submits at CBT window end time (cron-triggered `autoSubmitCBT`)
- [x] `submitCBTSession` procedure — child submits answers; marks `status = SUBMITTED`
- [x] Guard: duplicate session prevention (one session per child per round per event)

#### 6c — Instant Scoring & Intra-School Ranking
- [x] `scoreCBTSession` procedure — immediately after submission; computes `score` from answer key; marks `status = SCORED`
- [x] Score stored on `TechQuizCBTSession` and reflected in `TechQuizResult.round1Score`
- [x] Intra-school ranking computed after CBT window closes — `computeRound1Rankings` procedure
- [x] `intraSchoolRank` assigned per student within their school (ordered by round1Score desc)
- [x] Results published on parent/child dashboard immediately after scoring
- [x] School dashboard shows summary of all candidates' scores and ranks
- [x] Optional: summary published on BPI blog (`publishRound1BlogSummary` admin action)

#### 6d — Qualifier Selection
- [x] Top N per school selected after CBT window closes — N = `event.topQualifiersPerSchool` (default 4)
- [x] `selectQualifiers` procedure — selects top-N per school; creates `TechQuizQualifier` records
- [x] Tie-breaking rule: configurable (time of submission as tiebreaker; admin-settable)
- [x] Application status updated to `QUALIFIER` for selected students
- [x] Non-qualifying applications updated to `ROUND1_ELIGIBLE` (final Round 1 status, not progressing)
- [x] `QualifiersPublished` event state set; notifications sent to qualifiers and their schools
- [x] Results: `Round1Published` → `QualifiersPublished` state transitions

**✅ COMPLETE** — `issueCBTAccess`, `startCBTSession`, `submitCBTSession` (auto-scores + writes result), `autoSubmitExpiredSessions`, `computeRound1Rankings` (intra-school ranks + top-N qualifier selection + parent notifications)

---

### ✅ SECTION 7 — CBT Engine — Round 2 & Onsite Scoring

#### 7a — Round 2 Access & Notification
- [x] Only qualifiers (`QUALIFIER` status) notified and granted Round 2 access
- [x] `issueRound2Access` procedure — sets `application.status = ROUND2_ELIGIBLE` for all qualifiers
- [x] Notification to qualifier + parent + school: Round 2 CBT schedule, venue, exam rules
- [x] Round 2 CBT window configured separately on event (Round2Schedule)

#### 7b — Round 2 CBT Execution
- [x] `startRound2CBTSession` procedure — validates `ROUND2_ELIGIBLE` + within Round 2 CBT window
- [x] Creates `TechQuizCBTSession` with `round = ROUND2`, `status = IN_PROGRESS`
- [x] Session auto-submits at Round 2 CBT window end (cron `autoSubmitRound2CBT`)
- [x] `submitRound2CBTSession` procedure — marks `status = SUBMITTED`
- [x] `scoreRound2CBTSession` procedure — instant scoring; stores `round2CbtScore` on `TechQuizResult`

#### 7c — Onsite Assessment Scoring Module
- [x] `submitOnsiteScore` procedure — assessor-only (authenticated admin or assigned assessor role)
- [x] Assessor authentication required before scoring access granted
- [x] Scores recorded per component: `presentationScore`, `logicalReasoningScore`, `useCaseScore`
- [x] Component scores validated against configurable `TechQuizScoringRubric` maxima
- [x] Total onsite score auto-calculated: `presentationScore + logicalReasoningScore + useCaseScore`
- [x] Stored on `TechQuizOnsiteScore`; reflected in `TechQuizResult.onsiteScore`
- [x] Assessor can update scores until Final Ranking is locked (admin-controlled lock)
- [x] School and student can view onsite scores post-publication

#### 7d — Weighted Final Score Computation
- [x] `computeFinalScores` procedure — admin-triggered after both Round 2 CBT + onsite scores are complete
- [x] Formula: `FinalScore = (round2CbtScore × (cbtWeightPct/100)) + (onsiteScore × (onsiteWeightPct/100))`
- [x] `cbtWeightPct` and `onsiteWeightPct` read from event record (dynamic; default 55/45)
- [x] Validation: `cbtWeightPct + onsiteWeightPct == 100` enforced at event creation and update
- [x] Final scores stored on `TechQuizResult.finalScore`
- [x] Tie-breaking: same final score resolved by round2CbtScore; then by round1Score

#### 7e — Final Ranking & Winners
- [x] `computeFinalRankings` procedure — ranks all qualifiers across the state event by finalScore desc
- [x] Positions 1–20 assigned; positions beyond 20 recorded but not awarded
- [x] Award bracket auto-assigned: 1–3 (Major), 4–10 (Merit), 11–20 (Consolation)
- [x] `TechQuizResult.finalRank` and `awardBracket` fields populated
- [x] System state: `EventResults = Finalized`; `Winners = Published` flag set on event

**✅ COMPLETE** — `issueRound2Access`, `startCBTSession` (ROUND2 branch), `submitCBTSession` (ROUND2 branch), `submitOnsiteScore` (rubric-validated, locks), `lockOnsiteScores`, `computeFinalScores` (weighted formula + tie-break + bracket assignment)

---

### ✅ SECTION 8 — Results & Ranking Engine

#### 8a — Results Publication
- [x] `publishRound1Results` procedure — admin publishes Round 1 scores; "Round1Published" state set
- [x] `publishQualifiers` procedure — admin publishes qualifier list; "QualifiersPublished" state set
- [x] `publishFinalResults` procedure — admin publishes final rankings 1–20; "FinalPublished" state set
- [x] Each publication step is gated (cannot publish final before qualifiers; cannot publish qualifiers before Round 1)
- [x] Published results visible on: parent/child dashboard, school dashboard, BPI portal public results page
- [x] Optional: media export list (admin CSV download of top 20 with names, schools, states for PR)

#### 8b — Dashboard Result Display
- [x] Parent/child dashboard: Round 1 score, intra-school rank, qualifier status
- [x] Parent/child dashboard: Round 2 CBT score, onsite score, final score, final rank, award bracket
- [x] School dashboard: aggregated view of all their registered candidates' results per round
- [x] Admin dashboard: full event leaderboard with filters (school, state, score range)

#### 8c — Result Integrity & Audit
- [x] All computation steps logged in `TechQuizAuditLog` with actor, action, metadata, timestamp
- [x] `TechQuizResult` records locked after `publishFinalResults` — no edits without admin override + audit log entry
- [x] Admin override for result corrections — `correctResult` procedure with mandatory reason (logged to audit)

**✅ COMPLETE** — `publishRound1Results`, `publishFinalResults` (winners + general notifications, auto-COMPLETED transition), `adminGetLeaderboard`, `myChildResult`, `correctResult` (audit-guarded)

---

### ✅ SECTION 9 — Awards, Benefits & Publication

#### 9a — Award Assignment
- [x] Award brackets auto-assigned by `computeFinalRankings` based on event config (1–3, 4–10, 11–20)
- [x] Prize descriptions per bracket displayed to winners on dashboard post-publication
- [x] Winners listed on BPI portal public page (name, school, state, rank, bracket)
- [x] Winners listed on BPI social media export list (CSV; admin download)
- [x] Winners listed on partner channels (admin-configurable external publication links per event)

#### 9b — BPI Benefit Grant for Winners
- [x] For winners ranked 1–20: `grantBPIActivation` procedure — grants Regular BPI activation to winning child accounts (no cash payout)
- [x] Benefit is non-monetary: Regular activation only
- [x] `TechQuizChildBeneficiary.status` updated to `ACTIVE` for benefit recipients
- [x] Benefit grant logged in `TechQuizAuditLog`

#### 9c — Certificate Generation (Optional Module)
- [x] `generateCertificate` procedure — admin triggers certificate generation for award recipients
- [x] Certificate includes: child name, school, event name, rank, award bracket, BPI logo
- [x] Certificate available for download from parent/child dashboard
- [x] Certificate generation logged per child

#### 9d — Event Closure
- [x] `closeEvent` procedure — admin transitions: `PUBLISHED → COMPLETED → ARCHIVED`
- [x] Reporting locked after `COMPLETED` (no result edits without override)
- [x] Archived events preserved for full audit history
- [x] Parent and school dashboards continue to show historical event results after archival

**✅ COMPLETE** — `grantBPIActivation` (child status → ACTIVE + audit), `archiveEvent` (COMPLETED→ARCHIVED guard), `getPublicResults` (top-20 public)

---

### ✅ SECTION 10 — Sponsorship & Payments Module

#### 10a — Sponsor Access & Discovery
- [x] "Sponsor TechQuiz" page accessible in BPI back office (and optionally public-facing)
- [x] Active published events listed with state, date, and sponsorship options
- [x] Sponsor can be a BPI member or a non-member (configurable policy)

#### 10b — Sponsor Options & Cost Calculator
- [x] `calculateSponsorshipTotal` procedure — takes `sponsorType` + `childrenCount` + optional `schoolId`; returns `totalAmount`
- [x] Formula: `totalAmount = event.sponsorshipPackagePrice × childrenCount` (price configurable per event)
- [x] Three sponsor types: `CHILD_PARENT` (covers parent + child), `SCHOOL_COHORT` (covers a school's participants), `PRIZE_POOL` (general prize/award contribution)
- [x] School-specific sponsorship: `schoolId` provided → funds tagged to `SCHOOL_POOL`
- [x] General pool sponsorship: no `schoolId` → funds tagged to `EVENT_PRIZE_POOL`
- [x] Sponsor selects number of children + school or general pool before payment

#### 10c — Sponsorship Payment & Record
- [x] `createSponsorshipPackage` procedure — creates `TechQuizSponsorshipPackage` with `paymentStatus = PENDING`
- [x] Payment integration: standard BPI payment gateway
- [x] `confirmSponsorshipPayment` procedure — updates `paymentStatus = PAID`; allocates funds to correct pool
- [x] Sponsor acknowledgment/visibility subject to admin policy (toggle per event)

#### 10d — Admin Sponsorship Dashboard
- [x] Admin view: sponsorship pool balances per event (school pool + prize pool totals)
- [x] Admin view: sponsor list with type, amount, allocation, payment status
- [x] Admin view: allocation history (which funds went where)
- [x] Admin: manually adjust or reallocate sponsorship funds
- [x] CSV export of sponsorship data per event

**✅ COMPLETE** — `calculateSponsorshipTotal`, `createSponsorshipPackage`, `confirmSponsorshipPayment`, `adminSponsorshipDashboard` (pool balances)

---

### ✅ SECTION 11 — Compliance & Safeguards Module

#### 11a — Child Data Protection
- [x] Parental consent checkpoint — mandatory consent checkbox and child data protection policy text presented before `createChildBeneficiary`
- [x] Consent version stored with each `TechQuizConsentLog` record (allows policy versioning)
- [x] Consent re-confirmation triggered if policy version changes
- [x] Child data access restricted: only parent (owner), school admin (limited), and BPI admin can view child records
- [x] RBAC enforcement: no cross-parent or cross-school data leakage in any procedure
- [x] Child data fields encrypted at rest (PII: name, DOB, email) — database-level encryption or field-level note

#### 11b — Examination Safety Protocols
- [x] CBT eligibility gate: only `ROUND1_ELIGIBLE` or `ROUND2_ELIGIBLE` children can start CBT sessions
- [x] Identity verification note at exam venue (physical check — admin guideline; not system-enforced but documented in event guidelines)
- [x] Age-appropriate content filter flag on CBT question bank (questions tagged by age/grade appropriateness)
- [x] CBT session timeout and auto-submit prevents unlimited exam time
- [x] Supervised CBT environment guidance published in CBT instructions email

#### 11c — Audit & Compliance Reporting
- [x] All critical actions logged to `TechQuizAuditLog` (create, approve, reject, score, publish, override)
- [x] `TechQuizLegalEvent` raised and tracked for any compliance concerns
- [x] Admin: resolve legal events with resolution notes and timestamp
- [x] Compliance report exportable per event (CSV of all audit log entries)
- [x] Data retention policy: archived event records preserved for minimum 5 years (policy documented; enforcement via archival status)

**✅ COMPLETE** — `getConsentLog`, `createLegalEvent`, `resolveLegalEvent`, `adminListLegalEvents`, `getAuditLog`; RBAC enforced in every procedure; `audit()` helper called on all critical mutations

---

### ✅ SECTION 12 — Notification Engine

#### 12a — Event-Level Notifications
- [x] `TECHQUIZ_EVENT_PUBLISHED` — broadcast to all eligible BPI members (state-filtered if configured)

#### 12b — Application-Level Notifications
- [x] `TECHQUIZ_APPLICATION_SUBMITTED` — to parent on successful application + payment
- [x] `TECHQUIZ_APPLICATION_SLOT_RESERVED` — to parent confirming slot reserved pending school verification
- [x] `TECHQUIZ_APPLICATION_VERIFIED` — to parent when school approves the candidate
- [x] `TECHQUIZ_APPLICATION_REJECTED` — to parent with rejection reason when school rejects candidate

#### 12c — CBT & Exam Notifications
- [x] `TECHQUIZ_CBT_ACCESS_ISSUED` — to parent + school when CBT access is granted (includes instructions, window, venue)
- [x] `TECHQUIZ_ROUND1_RESULT` — to parent + student (child dashboard) + school after Round 1 scoring
- [x] `TECHQUIZ_QUALIFIER_NOTICE` — to parent + student + school when student qualifies for Round 2
- [x] `TECHQUIZ_ROUND2_SCHEDULE` — to qualifiers only: Round 2 CBT + onsite schedule and venue
- [x] `TECHQUIZ_ROUND2_RESULT` — to qualifier + parent after Round 2 CBT + onsite scores published

#### 12d — Results & Winners Notifications
- [x] `TECHQUIZ_FINAL_RESULTS_PUBLISHED` — to all stakeholders (parents, students, schools, admins)
- [x] `TECHQUIZ_WINNER_NOTIFICATION` — to winning students (1–20) and their parents with rank, award bracket details, and BPI activation notice

#### 12e — Sponsorship Notifications
- [x] `TECHQUIZ_SPONSORSHIP_CONFIRMED` — to sponsor on payment confirmation
- [x] `TECHQUIZ_SPONSORSHIP_ALLOCATED` — to admin on new sponsorship allocation

#### 12f — Admin / System Notifications
- [x] `TECHQUIZ_SCHOOL_QUOTA_FULL` — to admin when a school reaches `maxStudents`
- [x] `TECHQUIZ_SCHOOL_MIN_NOT_REACHED` — to admin when application deadline passes and `minStudents` not met for a school
- [x] `TECHQUIZ_COMPLIANCE_FLAG` — to admin on any legal event creation or data protection concern

**✅ COMPLETE** — All 17 `TECHQUIZ_*` types added to `NotificationType` union in `server/services/notification.service.ts`; `sendNotification()` called inline in every relevant mutation (event publish, application, CBT access, results, winners, sponsorship, compliance)

---

### ✅ SECTION 13 — Admin CMS: Reporting & Audit Dashboard

#### 13a — Event Reports
- [x] Event overview report: total applicants, verified candidates, qualifiers, Round 2 participants, final ranked count, revenue/sponsorship totals
- [x] Per-school participation report: quota used, verification rate, qualifiers per school
- [x] CSV export: full application list with status, payment, school, child name per event
- [x] CSV export: qualifiers list per event
- [x] CSV export: final results (1–20) per event (used for media/PR)

#### 13b — Sponsorship Reports
- [x] Total sponsorship raised per event
- [x] Pool breakdown: school pools vs general prize pool
- [x] Per-sponsor breakdown with type, amount, payment status

#### 13c — Compliance Reports
- [x] Full audit log per event — CSV export of all `TechQuizAuditLog` entries
- [x] Consent log report — all parental consent records (child ID, consent date, version)
- [x] Legal events log — all `TechQuizLegalEvent` records with resolution status

#### 13d — Cross-Event & Multi-State Analytics
- [x] Multi-state event comparison dashboard (events per state, participation rates, top schools)
- [x] Zonal / national rollup reporting (aggregate scores and rankings across states for zonal finals)
- [x] Year-over-year participation trend (event frequency: monthly / quarterly / biannual / annual)

**✅ COMPLETE** — `adminEventReport`, `adminSchoolReport`, `adminApplicationsExport`, `adminResultsExport`, `adminConsentLogExport`, `adminCrossStateAnalytics`

---

### ✅ SECTION 14 — Client-Side Dashboards

#### 14a — Parent Dashboard
- [x] "Apply for TechQuiz" CTA visible when parent has ≥ Regular membership
- [x] Child profile creation wizard (3-step with progress indicators)
- [x] Published events list filterable by state with one-click application
- [x] Application status tracker per child: `Applied → School Verified → Confirmed`
- [x] Round 1 results card per child: score, intra-school rank, qualifier status
- [x] Round 2 results card per child: CBT score, onsite score, final score, final rank, award bracket
- [x] Certificate download link (if generated)
- [x] Toast notifications for all actions (no `alert()`/`confirm()`)

#### 14b — School Admin Dashboard
- [x] School dashboard: registered candidates list per event (paginated)
- [x] Per-candidate: approve or decline eligibility with reason
- [x] Quota status bar: slots used / min / max
- [x] Exam guidelines & schedule download (PDF/link)
- [x] Results summary view: all candidates' Round 1 scores, qualifiers highlighted
- [x] Toast notifications for all verification actions

#### 14c — Student / Child Portal (Optional / Phase 2)
- [x] Child or parent-proxy login to access CBT portal
- [x] CBT session interface: question display, timer, answer submission, auto-submit
- [x] Result view: Round 1 score, Round 2 score, final rank, certificate download
- [x] Profile page showing event history and awards

#### 14d — Public Results Page
- [x] BPI portal page: list of published TechQuiz events with state and dates
- [x] Per-event: top 20 results published (child name, school, state, rank, award bracket)
- [x] BPI blog integration: auto-publish Round 1 summary and final winners post (admin-triggered) — **DONE** `publishRound1BlogPost` + `publishFinalBlogPost` procedures; wired into admin results tab

**✅ COMPLETE** — `TechQuizContent.tsx` (parent dashboard — apply, child wizard, status tracker, results), `SchoolAdminDashboard.tsx` (candidates list, quota bar, approve/reject), `CBTPortalContent.tsx` (CBT session start/submit portal), `PublicResultsContent.tsx` (top-20 public leaderboard); pages in `app/techquiz/`: `school/page.tsx`, `cbt/page.tsx`, `results/[eventId]/page.tsx`

---

### ✅ SECTION 15 — Multi-State & Expansion Framework

#### 15a — Multi-State Event Support
- [x] Events are state-scoped (`TechQuizEvent.state` field)
- [x] Simultaneous events across multiple states supported (no unique constraint on state+period unless configured)
- [x] Admin can create events for any state independently

#### 15b — Event Frequency Configuration
- [x] Event frequency type field on event: `MONTHLY`, `QUARTERLY`, `BIANNUAL`, `ANNUAL` (informational/reporting tag)
- [x] Admin can activate competitions on any of these frequencies without system restriction
- [x] Reporting dashboard groups events by frequency type

#### 15c — Zonal & National Finals
- [x] `TechQuizZonalEvent` model (or flag on `TechQuizEvent`) — marks an event as zonal or national finals
- [x] Zonal/national events pull qualifiers from their constituent state events
- [x] Cross-state ranking engine applies same weighted formula for zonal/national finals
- [x] Zonal/national events follow same application, CBT, onsite, and awards flow

**✅ COMPLETE** — `createZonalEvent` (constituent-event-aware, same full lifecycle); multi-state support via `TechQuizEvent.state`; `adminCrossStateAnalytics` cross-event report

---

### ✅ SECTION 16 — AdminSettings: Configurable Keys (CMS)

- [x] `techquiz_default_top_qualifiers_per_school` — default N qualifiers per school (default 4)
- [x] `techquiz_default_min_students_per_school` — default minimum students per school (default 10)
- [x] `techquiz_default_max_students_per_school` — default maximum students per school (default 12)
- [x] `techquiz_default_cbt_weight_pct` — default CBT weight % (default 55)
- [x] `techquiz_default_onsite_weight_pct` — default onsite weight % (default 45)
- [x] `techquiz_default_sponsorship_price` — default sponsorship price per parent+child unit (default ₦18,000)
- [x] `techquiz_cbt_tiebreak_method` — tiebreak method: `SUBMISSION_TIME` or `ROUND1_SCORE` (default `SUBMISSION_TIME`)
- [x] `techquiz_sponsor_visibility_enabled` — toggle sponsor acknowledgment/visibility on portal (default `false`)
- [x] `techquiz_certificate_generation_enabled` — toggle certificate generation module (default `false`)
- [x] `techquiz_blog_auto_publish_enabled` — toggle auto-publish to BPI blog on results (default `false`)
- [x] `techquiz_required_membership_tier` — minimum BPI membership tier required for parent eligibility (default `REGULAR`)

**✅ COMPLETE** — `getCmsSettings` (all 11 keys + defaults), `updateCmsSetting`, `seedDefaultCmsSettings`; all keys: `techquiz_default_top_qualifiers_per_school`, `techquiz_default_min_students_per_school`, `techquiz_default_max_students_per_school`, `techquiz_default_cbt_weight_pct`, `techquiz_default_onsite_weight_pct`, `techquiz_default_sponsorship_price`, `techquiz_cbt_tiebreak_method`, `techquiz_sponsor_visibility_enabled`, `techquiz_certificate_generation_enabled`, `techquiz_blog_auto_publish_enabled`, `techquiz_required_membership_tier`

---

### ✅ IMPLEMENTATION PRIORITY ORDER

**🔴 Critical (Core Engine)**
1. [x] Database schema — all models, enums, relations (Section 1) — **DONE** `prisma/schema.prisma` + migration applied
2. [x] Admin CMS: TechQuiz Event Manager — create, configure, publish events (Section 2) — **DONE** `techquiz.ts`
3. [x] School onboarding, school admin profile, school dashboard (Section 3) — **DONE**
4. [x] Parent eligibility check, child beneficiary creation, consent + data protection (Section 4) — **DONE**
5. [x] Application submission, payment, quota engine (Sections 4–5) — **DONE**
6. [x] School verification workflow (Section 5c) — **DONE**
7. [x] CBT Engine — Round 1: access issuance, session execution, instant scoring, qualifier selection (Section 6) — **DONE**

**🟡 Important (Round 2 & Results)**
8. [x] CBT Engine — Round 2: access, execution, scoring (Section 7) — **DONE**
9. [x] Onsite assessment scoring module (Section 7c) — **DONE**
10. [x] Weighted final score computation + final ranking (Section 7d–7e) — **DONE**
11. [x] Results publication engine — round 1, qualifiers, final (Section 8) — **DONE**
12. [x] Awards, BPI benefit grant, event closure (Section 9) — **DONE**

**🟠 Core Controls**
13. [x] Sponsorship module — options, cost calculator, payment, allocation, admin dashboard (Section 10) — **DONE**
14. [x] Compliance & safeguards — consent logs, RBAC, audit trail, data protection (Section 11) — **DONE**
15. [x] Notification engine — all 17 notification types (Section 12) — **DONE**
16. [x] Admin CMS: reporting & audit dashboard (Section 13) — **DONE**

**🟢 Enhancement & Completeness**
17. [x] Client dashboards — parent, school admin, student portal (Section 14) — **DONE**
18. [x] Multi-state expansion framework + zonal/national finals support (Section 15) — **DONE**
19. [x] AdminSettings CMS keys — all 11 configurable defaults (Section 16) — **DONE**
20. [x] Certificate generation module (Section 9c) — **DONE** `server/services/techquizCertificate.service.ts` + `app/api/certificate/techquiz/[applicationId]/route.ts`; download button wired in `TechQuizContent.tsx`
21. [x] Public results page + BPI blog integration (Section 14d) — **DONE** (results page complete; blog auto-publish complete)

---

### 🟩 QUICK REFERENCE — Feature Checklist

| Feature                                                    | Status | Location / Notes                                                          |
|------------------------------------------------------------|--------|---------------------------------------------------------------------------|
| TechQuiz Event model (state-based, lifecycle)              | ✅     | `prisma/schema.prisma` — Section 1a                                       |
| Round 1 + Round 2 schedules per event                      | ✅     | `prisma/schema.prisma` — Section 1a                                       |
| Awards bracket configuration per event                     | ✅     | `prisma/schema.prisma` — Section 1a, 9a                                   |
| School model + MoU consent flag                            | ✅     | `prisma/schema.prisma` — Section 1b                                       |
| School admin profile (lightweight)                         | ✅     | `prisma/schema.prisma` — Section 1b, 3b                                   |
| Child beneficiary model + parental consent log             | ✅     | `prisma/schema.prisma` — Section 1c, 4b, 11a                              |
| Application model (full lifecycle statuses)                | ✅     | `prisma/schema.prisma` — Section 1d                                       |
| CBT session model (Round 1 + Round 2)                      | ✅     | `prisma/schema.prisma` — Section 1e                                       |
| Onsite scoring model + rubric                              | ✅     | `prisma/schema.prisma` — Section 1e                                       |
| Results model (round scores + final rank + bracket)        | ✅     | `prisma/schema.prisma` — Section 1f                                       |
| Qualifier model (top-N per school)                         | ✅     | `prisma/schema.prisma` — Section 1f                                       |
| Sponsorship models (package, allocation pool)              | ✅     | `prisma/schema.prisma` — Section 1g                                       |
| Consent log + audit log + legal event models               | ✅     | `prisma/schema.prisma` — Section 1h                                       |
| Admin: create/configure/publish events                     | ✅     | `server/trpc/router/techquiz.ts` — Section 2                              |
| Admin: school assignment to events + quota config          | ✅     | `server/trpc/router/techquiz.ts` — Section 2b, 3                          |
| Event status lifecycle (Draft → Archived)                  | ✅     | `server/trpc/router/techquiz.ts` — Section 2c                             |
| School onboarding + MoU approval                           | ✅     | `server/trpc/router/techquiz.ts` — Section 3a                             |
| School admin dashboard (candidates, quotas, schedules)     | ✅     | `components/techquiz/SchoolAdminDashboard.tsx` — Section 3c               |
| Quota engine (soft-lock, eligibility, closed)              | ✅     | `server/trpc/router/techquiz.ts` — Section 3d, 5a                         |
| Parent eligibility check (≥ Regular membership)            | ✅     | `server/trpc/router/techquiz.ts` — Section 4a                             |
| Child beneficiary creation + consent wizard                | ✅     | `components/techquiz/TechQuizContent.tsx` — Section 4b                    |
| Application submission + TechQuiz license purchase         | ✅     | `server/trpc/router/techquiz.ts` — Section 4c, 5b                         |
| Application status tracker on parent dashboard             | ✅     | `components/techquiz/TechQuizContent.tsx` — Section 4d                    |
| School verification (approve/reject candidates)            | ✅     | `server/trpc/router/techquiz.ts` — Section 5c                             |
| CBT Round 1: access issuance, session, instant scoring     | ✅     | `server/trpc/router/techquiz.ts` — Section 6                              |
| Intra-school ranking + qualifier selection (Top-N)         | ✅     | `server/trpc/router/techquiz.ts` — Section 6c, 6d                         |
| CBT Round 2: access, session, scoring                      | ✅     | `server/trpc/router/techquiz.ts` — Section 7a, 7b                         |
| Onsite assessment scoring (3 components + rubric)          | ✅     | `server/trpc/router/techquiz.ts` — Section 7c                             |
| Weighted final score (CBT% + Onsite%, dynamic)             | ✅     | `server/trpc/router/techquiz.ts` — Section 7d                             |
| Final ranking 1–20 + auto award bracket assignment         | ✅     | `server/trpc/router/techquiz.ts` — Section 7e                             |
| Results publication (Round 1 → Qualifiers → Final)         | ✅     | `server/trpc/router/techquiz.ts` — Section 8                              |
| BPI Regular activation grant for winners 1–20             | ✅     | `server/trpc/router/techquiz.ts` — Section 9b                             |
| Certificate generation (optional)                          | ✅    | `server/services/techquizCertificate.service.ts` + `/api/certificate/techquiz/[applicationId]` — Section 9c |
| Sponsorship cost calculator (3 types, configurable price)  | ✅     | `server/trpc/router/techquiz.ts` — Section 10b                            |
| Sponsorship payment + pool allocation (school vs prize)    | ✅     | `server/trpc/router/techquiz.ts` — Section 10c                            |
| Admin sponsorship dashboard + CSV export                   | ✅     | `server/trpc/router/techquiz.ts` — Section 10d                            |
| Parental consent enforcement (mandatory, versioned)        | ✅     | `server/trpc/router/techquiz.ts` — Section 11a                            |
| RBAC: child data access restriction                        | ✅     | `server/trpc/router/techquiz.ts` — Section 11a                            |
| CBT safety gates (eligibility + window + auto-submit)      | ✅     | `server/trpc/router/techquiz.ts` — Section 11b                            |
| Compliance audit log (all critical actions)                | ✅     | `server/trpc/router/techquiz.ts` — Section 11c                            |
| Notification engine — 17 event types                       | ✅     | `server/services/notification.service.ts` — Section 12                    |
| Admin: event + school + application reports + CSV          | ✅     | `server/trpc/router/techquiz.ts` — Section 13a                            |
| Admin: sponsorship reports + compliance reports            | ✅     | `server/trpc/router/techquiz.ts` — Section 13b, 13c                       |
| Multi-state + zonal/national expansion framework           | ✅     | `server/trpc/router/techquiz.ts` — Section 15                             |
| AdminSettings CMS keys (11 configurable defaults)          | ✅     | `server/trpc/router/techquiz.ts` — Section 16                             |
| Parent dashboard (CTA, wizard, status tracker, results)    | ✅     | `components/techquiz/TechQuizContent.tsx` — Section 14a                   |
| School admin dashboard                                     | ✅     | `components/techquiz/SchoolAdminDashboard.tsx` — Section 14b              |
| Student / child CBT portal                                 | ✅     | `components/techquiz/CBTPortalContent.tsx` — Section 14c                  |
| Public results page                                        | ✅     | `components/techquiz/PublicResultsContent.tsx` — Section 14d              |
| BPI blog auto-publish integration                          | ✅    | `publishRound1BlogPost` + `publishFinalBlogPost` in `techquiz.ts`; buttons in admin results tab — Section 14d |

---

### 🟥 KNOWN GAPS — Action Required

| # | Gap | Priority | Section |
|---|-----|----------|---------|
| 1 | ~~Full database schema — all TechQuiz models not yet created~~ | ✅ RESOLVED | 1 |
| 2 | ~~Admin Event Manager — no create/configure/publish procedures~~ | ✅ RESOLVED | 2 |
| 3 | ~~School onboarding + school admin profile not implemented~~ | ✅ RESOLVED | 3 |
| 4 | ~~Parent eligibility + child beneficiary creation not implemented~~ | ✅ RESOLVED | 4 |
| 5 | ~~TechQuiz application submission + payment not implemented~~ | ✅ RESOLVED | 4, 5 |
| 6 | ~~Quota engine (soft-lock, min/max, eligibility transitions) not implemented~~ | ✅ RESOLVED | 3d, 5 |
| 7 | ~~School verification workflow not implemented~~ | ✅ RESOLVED | 5c |
| 8 | ~~CBT Engine Round 1 — session, scoring, ranking, qualifier selection not implemented~~ | ✅ RESOLVED | 6 |
| 9 | ~~CBT Engine Round 2 — session, scoring not implemented~~ | ✅ RESOLVED | 7 |
| 10 | ~~Onsite assessment scoring module not implemented~~ | ✅ RESOLVED | 7c |
| 11 | ~~Weighted final score computation not implemented~~ | ✅ RESOLVED | 7d |
| 12 | ~~Final ranking 1–20 + award bracket assignment not implemented~~ | ✅ RESOLVED | 7e |
| 13 | ~~Results publication flow (Round1 → Qualifiers → Final) not implemented~~ | ✅ RESOLVED | 8 |
| 14 | ~~BPI benefit grant for winners (Regular activation) not implemented~~ | ✅ RESOLVED | 9b |
| 15 | ~~Certificate generation module not implemented~~ | ✅ RESOLVED — `techquizCertificate.service.ts` + `/api/certificate/techquiz/[applicationId]` + download button in `TechQuizContent.tsx` | 9c |
| 16 | ~~Sponsorship module — all components not implemented~~ | ✅ RESOLVED | 10 |
| 17 | ~~Compliance module — consent logs, RBAC, data protection not implemented~~ | ✅ RESOLVED | 11 |
| 18 | ~~Notification engine — all 15 notification types not implemented~~ | ✅ RESOLVED (17 types) | 12 |
| 19 | ~~Admin reporting + audit dashboard not implemented~~ | ✅ RESOLVED | 13 |
| 20 | ~~Parent dashboard (TechQuiz UI) not implemented~~ | ✅ RESOLVED | 14a |
| 21 | ~~School admin dashboard not implemented~~ | ✅ RESOLVED | 14b |
| 22 | ~~Student / child CBT portal not implemented~~ | ✅ RESOLVED | 14c |
| 23 | ~~Public results page + BPI blog integration not implemented~~ | ✅ RESOLVED — results page done; `publishRound1BlogPost` + `publishFinalBlogPost` live | 14d |
| 24 | ~~Multi-state + zonal/national expansion framework not implemented~~ | ✅ RESOLVED | 15 |
| 25 | ~~AdminSettings CMS keys (all 11 defaults) not implemented~~ | ✅ RESOLVED | 16 |

---

Personnel:  
Victoria Kanma – Quality Assessment (Structural Design, UI/UX Rendition)  
Alatari Douglas – Quality Assessment (Codebase, Local/Git Repo, Implementation Standard)  
Zino Abraham – Tester (Client Side)  
Oghenekaro Ogege – Tester (Client Side)  
Godbless Osaro – Quality Assessment (Admin UI/UX, RBAC, Schema)
