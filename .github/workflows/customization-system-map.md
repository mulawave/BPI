# BPI Customization System Map

This document is the top-level entrypoint for the repo's GitHub Copilot customization system. It explains the layers, shows the main operating flows, and tells maintainers where to start for each class of customization task.

For a visual companion, see `.github/workflows/customization-system-map-mermaid.md`.

## System Layers

The customization stack is organized as five layers that work together:

1. Instructions
   - Permanent guardrails that shape routine implementation behavior.
   - Primary files:
     - `.github/copilot-instructions.md`
     - `.github/instructions/end-to-end-implementation.instructions.md`
     - `.github/instructions/supporting-ui-completeness.instructions.md`
   - Role: enforce complete delivery, proper ownership boundaries, and implementation quality by default.

2. Skills
   - Reusable domain standards that can be invoked when a task needs specialized judgment.
   - Primary files:
     - `.github/skills/premium-ui-coherence/SKILL.md`
   - Role: keep BPI UI work aligned with the repo's premium light and dark theme standard.

3. Prompts
   - Task transformers that convert one artifact into the next artifact in a controlled way.
   - Primary folders:
     - `.github/prompts/`
   - Role: move work forward through explicit stages instead of asking one prompt to do everything at once.

4. Hidden Agents
   - Read-only review checks that test prompt outputs for drift, overlap, fragmentation, churn, or risk before they harden into docs or process.
   - Primary folders:
     - `.github/agents/`
   - Role: challenge outputs without changing them, so the system catches weak spots before rollout.

5. Memory
   - Repo-scoped continuity for customization decisions and workflow additions.
   - Primary file:
     - `/memories/repo/ui-design.md`
   - Role: preserve what has already been added so future changes stay cumulative rather than repetitive.

## How The Layers Work Together

The layers form a pipeline:

1. Instructions define the non-negotiable rules.
2. Skills define quality standards for specialized areas.
3. Prompts transform input artifacts into the next operational output.
4. Hidden agents review those outputs for risk or duplication.
5. Memory records the result so the system retains context over time.

In practice, this means a maintainer should not think of the customization system as one giant prompt. It is a governed sequence of transformations with review gates.

The next layer on top of this is autonomous delivery: an orchestrated execution loop that starts from repo-native artifacts, drives implementation and validation work, and refuses completion until hard gates pass.

## Main Flows

### 1. Implementation Flow

Purpose: turn quality expectations into always-on implementation behavior for product work.

Primary path:

1. `guardrails-to-always-on-instructions.prompt.md`
2. `operating-handbook-and-instruction-candidates-to-instruction-drafts.prompt.md`
3. `instruction-drafts-to-finalized-instructions.prompt.md`
4. `finalized-instructions-to-file-proposals.prompt.md`
5. `file-proposals-to-patch-plans.prompt.md`
6. `patch-plans-to-apply-patch.prompt.md`

Primary hidden checks:

- `Instruction Enforcement Gaps`
- `Instruction Ownership Boundary Fit`
- `Instruction Scoping Mistakes`

Outcome: durable instruction files that govern implementation work in `app/`, `components/`, `server/`, `hooks/`, `contexts/`, and `lib/`.

### 2. Release And Recovery Flow

Purpose: carry an unstable or changing delivery state through release planning, restart readiness, relaunch, stabilization, and retrospective learning.

Primary path:

1. `leadership-brief-and-readiness-to-execution-charter.prompt.md`
2. `execution-charter-and-guardrails-to-operating-handbook.prompt.md`
3. `reconciled-state-to-recovery-checklist.prompt.md`
4. `restart-brief-and-recovery-to-control-room-agenda.prompt.md`
5. `control-room-and-relaunch-to-runbook.prompt.md`
6. `reconciled-recovery-to-relaunch-comms.prompt.md`
7. `post-relaunch-state-to-stabilization-watch.prompt.md`
8. `stabilized-state-to-release-confirmation.prompt.md`
9. `stable-post-launch-to-retrospective-seed.prompt.md`
10. `retrospective-themes-to-readiness-checklist.prompt.md`

Primary hidden checks:

- `Deployment Risk Sweep`
- `Release Artifact Alignment`
- `Restart Readiness Drift`
- `Stabilization Operational Drift`
- `Premature Closure Messaging`
- `Repeated Release Pattern Failures`
- `Readiness Lesson Retention`

Outcome: a release lifecycle with explicit gates, recovery artifacts, stabilization coverage, and lessons that feed back into future readiness.

### 3. Governance Flow

Purpose: turn stable operating patterns into durable governance and maintainer-facing policy documents.

Primary path:

1. `stable-guardrails-to-governance-summary.prompt.md`
2. `governance-summary-to-maintainer-handbook.prompt.md`
3. `maintainer-handbook-to-governance-file.prompt.md`
4. `governance-artifacts-to-maintainer-onboarding.prompt.md`
5. `governance-and-onboarding-to-doc-bundle.prompt.md`

Primary hidden checks:

- `Governance Doc Overlap`
- `Maintainer Onboarding Overlap`
- `Maintainer Docs Fragmentation`

Outcome: governance artifacts that are durable enough for maintainer use and aligned with existing repo documentation.

### 4. Maintainer Docs Flow

Purpose: take approved governance and onboarding material and turn it into a maintainable documentation set with controlled rollout and clear navigation.

Primary path:

1. `governance-and-onboarding-to-doc-bundle.prompt.md`
2. `doc-bundle-to-patch-plans.prompt.md`
3. `quickstart-and-governance-to-rollout-checklist.prompt.md`
4. `maintainer-docs-to-map.prompt.md`

Supporting prompt:

- `governance-and-onboarding-to-quickstart.prompt.md`

Primary hidden checks:

- `Maintainer Docs Fragmentation`
- `Maintainer Docs File Churn`
- `Maintainer Onboarding Overlap`
- `Governance Doc Overlap`

Outcome: a stable maintainer documentation set with exact patch plans, rollout sequencing, and a one-page map for navigation.

### 5. Autonomous Delivery Flow

Purpose: start from a spec, tracker, script, or repo documentation path and drive execution all the way through implementation, validation, repair, and final deploy-readiness gating.

Primary path:

1. `Autonomous Delivery Orchestrator` agent
2. `mission-intake-to-execution-mode.prompt.md`
3. `mission-intake-to-mission-root.prompt.md`
4. `mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`
5. `artifact-intake-to-task-graph.prompt.md`
6. worker delegation across frontend, backend, validation, repair, and release preparation
7. `validation-state-to-validation-log.prompt.md`
8. `execution-state-to-mission-state.prompt.md`
9. `execution-state-to-repair-loop.prompt.md`
10. `mission-state-and-validation-to-handoff.prompt.md`
11. `mission-state-and-handoff-to-resume-brief.prompt.md`
12. `Deploy Readiness Gatekeeper` agent

Primary worker model:

- `Frontend Delivery Worker`
- `Backend Delivery Worker`
- `Validation Execution Worker`
- `Test And Build Repair Worker`
- `Release Execution Worker`

Primary hidden checks:

- `Feature Completeness Review`
- `Backend Process Integrity Review`
- `Premium UI Audit`
- `Deployment Risk Sweep`
- `Deploy Readiness Gatekeeper`

Primary hard gate reference:

- `.github/workflows/autonomous-delivery-definition-of-done.md`

Primary delegation reference:

- `.github/workflows/autonomous-delivery-worker-model.md`

Primary control reference:

- `.github/workflows/autonomous-execution-modes-and-approval-boundaries.md`

Primary continuity reference:

- `.github/workflows/autonomous-mission-state-and-handoffs.md`

Primary storage and resume reference:

- `.github/workflows/autonomous-mission-artifact-storage-and-resume.md`

Primary reporting playbook reference:

- `.github/workflows/autonomous-mission-reporting-playbook.md`

Primary reconciliation reference:

- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`

Supporting operator-summary reference:

- `.github/prompts/mission-root-to-operator-summary.prompt.md`

Supporting delta-summary reference:

- `.github/prompts/mission-roots-to-delta-summary.prompt.md`

Supporting standup-briefing reference:

- `.github/prompts/mission-briefings-to-standup-drift-briefing.prompt.md`

Supporting end-of-day reference:

- `.github/prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`

Reporting quick-routing:

- open `.github/workflows/autonomous-mission-reporting-playbook.md` for the practical step-by-step reporting recipe
- open `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md` for the one-glance visual reporting sequence
- open `.github/missions/examples/reporting/` for worked derived reporting outputs

### Autonomous Reporting Surfaces

Use this grouped navigation when you already know you are working in the autonomous reporting layer:

- `.github/workflows/autonomous-mission-reporting-playbook.md`
- `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md`
- `.github/missions/examples/reporting/`

### Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- The reporting surfaces above are derived coordination outputs only.

Outcome: a mission that ends only as deploy-ready, not ready, or blocked, instead of stopping at partial implementation.

## Where To Start By Task Type

Use this section as the maintainer's quick routing guide.

### If the task is implementation policy or guardrails

Start with:

- `.github/prompts/guardrails-to-always-on-instructions.prompt.md`

Use when:

- a recurring implementation expectation should become permanent instruction
- a review keeps finding the same delivery gap
- you need to harden standards for feature work across ownership boundaries

### If the task is release planning, recovery, or relaunch operations

Start with:

- `.github/prompts/leadership-brief-and-readiness-to-execution-charter.prompt.md`

Use when:

- release readiness needs a clear operating charter
- recovery work must be turned into restart or control-room artifacts
- stabilization and release confirmation need structured handoff steps

### If the task is governance or maintainer policy documentation

Start with:

- `.github/prompts/stable-guardrails-to-governance-summary.prompt.md`

Use when:

- stable operating rules should become governance
- maintainers need a handbook or formal governance file
- onboarding and governance need to be reconciled into coherent maintainer guidance

### If the task is maintainer-doc packaging or rollout

Start with one of these depending on the input you already have:

- `.github/prompts/governance-and-onboarding-to-doc-bundle.prompt.md` for packaging a documentation set
- `.github/prompts/governance-and-onboarding-to-quickstart.prompt.md` for a concise entry guide
- `.github/prompts/quickstart-and-governance-to-rollout-checklist.prompt.md` for publishing and rollout steps
- `.github/prompts/maintainer-docs-to-map.prompt.md` for a one-page maintainer index

Use when:

- approved docs need exact file targets
- maintainers need a quickstart path
- docs need rollout sequencing and maintenance checks
- the final doc set needs a clear top-level map

### If the task is autonomous implementation from a repo artifact

Start with:

- `.github/agents/autonomous-delivery-orchestrator.agent.md`

Use when:

- you have a spec, tracker, script, or project doc in the repo and want the system to drive work from intake through deploy-readiness
- the task requires planning, code edits, validation, repair loops, and strict completion gating
- you want the system to stop only at deploy-ready, not ready, or blocked

## Hidden Agent Routing Guide

Maintainers generally should not start with hidden agents. Hidden agents are review gates that should be invoked from prompts when the work reaches a risky point.

Use them to answer questions like these:

- Is this new governance doc duplicating something already in the repo?
  - `Governance Doc Overlap`
- Is this onboarding guidance repeating existing maintainer material?
  - `Maintainer Onboarding Overlap`
- Is this docs bundle scattering information across too many locations?
  - `Maintainer Docs Fragmentation`
- Are these file actions creating needless documentation churn?
  - `Maintainer Docs File Churn`
- Are finalized instructions scoped correctly to real code ownership boundaries?
  - `Instruction Ownership Boundary Fit`
  - `Instruction Scoping Mistakes`
- Is this mission actually ready for deployment after implementation and repair loops?
  - `Deploy Readiness Gatekeeper`

## Recommended Maintainer Habit

When adding a new customization layer:

1. Decide which flow it belongs to.
2. Start from the earliest relevant prompt in that flow.
3. Let hidden agents challenge overlap, drift, or fragmentation before rollout.
4. Convert approved outputs into patch plans instead of ad hoc file creation.
5. Record the new workflow fact in `/memories/repo/ui-design.md`.

For autonomous missions specifically:

1. Start with the orchestrator agent and a repo-native input path.
2. Choose the correct execution mode and authority profile.
3. Convert the source artifact into a task graph.
4. Delegate implementation, validation, repair, and release preparation to the correct workers.
5. Refresh mission-state snapshots whenever the current execution truth changes.
6. Execute, validate, and repair until the definition of done is satisfied.
7. Stop at approval or dependency boundaries when required.
8. Produce handoff artifacts when another session or reviewer must continue the mission.
9. Use the gatekeeper before any deploy-ready claim.

## In One Sentence

The BPI customization system is a governed pipeline in which instructions set default behavior, skills define standards, prompts transform artifacts, hidden agents review them, and memory preserves continuity across implementation, release, governance, and maintainer documentation work.