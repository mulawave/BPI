# Maintainer Quick Use Cheat Sheet

Use this page when you do not want the full system explanation and only need to know where to start and what kind of input to give.

## How To Use This Cheat Sheet

1. Match your task to the closest row below.
2. Start with the listed prompt.
3. Paste an input shaped like the example.
4. Take the output and move to the next prompt in that same flow if needed.
5. Let hidden agents act as review gates when the prompt calls them.

For copy-paste PDF intake patterns, see `.github/workflows/pdf-mission-request-templates.md`.

## Quick Routing Table

| If you need to... | Start with... | Your input should look like... | Typical next step |
| --- | --- | --- | --- |
| drive a spec, tracker, script, or project doc to deploy-ready execution | `Autonomous Delivery Orchestrator` agent | repo artifact path, mission goal, execution mode, known constraints | execution-mode classification, mission-root bootstrap, task graph, validation-log updates, mission-state snapshots, canonical artifact storage, resume briefs, and repair loops until gatekeeper verdict |
| reconcile an existing autonomous mission with new or changed source artifacts | `mission-root-and-new-sources-to-reconciled-mission-root.prompt.md` | canonical mission root path, current mission-state or sources, new source artifacts, changed acceptance criteria, and latest validation context | update the existing mission root, then rerun task-graph planning or validation sequencing from the reconciled state |
| create a concise operator dashboard for an active autonomous mission | `mission-root-to-operator-summary.prompt.md` | canonical mission root path plus the latest mission-state, validation-log, handoff, and resume-brief context | share a compact current-state briefing while keeping the canonical mission root as the source of truth |
| compare two mission states and summarize what changed | `mission-roots-to-delta-summary.prompt.md` | earlier and later canonical mission roots or artifact snapshots plus mission-state, validation-log, handoff, and resume-brief context | produce a compact delta summary for standups, handoffs, or review without diffing every artifact manually |
| roll multiple active missions into one standup drift briefing | `mission-briefings-to-standup-drift-briefing.prompt.md` | multiple mission operator summaries, mission delta summaries, or canonical mission-root references | produce a cross-mission standup briefing with drift, blockers, validation focus, and ordered next actions |
| turn mission reporting into a close-of-day operations summary | `mission-briefings-to-end-of-day-operations-summary.prompt.md` | a standup drift briefing plus any supporting operator summaries or delta summaries | produce aligned leadership and operator end-of-day reporting across active missions |
| turn recurring implementation rules into permanent AI guidance | `guardrails-to-always-on-instructions.prompt.md` | recurring delivery failures, expected standards, scope boundaries | instruction drafting and finalization |
| organize release, restart, or relaunch work | `leadership-brief-and-readiness-to-execution-charter.prompt.md` | current release state, blockers, operating constraints, goals | recovery, control-room, or stabilization prompts |
| formalize stable practices into governance docs | `stable-guardrails-to-governance-summary.prompt.md` | stable rules, expectations, responsibilities, policy themes | handbook and governance-file prompts |
| package governance and onboarding into a maintainer docs set | `governance-and-onboarding-to-doc-bundle.prompt.md` | governance file proposal plus onboarding content | doc patch plans or quickstart generation |
| create a concise maintainer entry guide | `governance-and-onboarding-to-quickstart.prompt.md` | approved governance points plus onboarding essentials | rollout checklist or docs map |
| plan publication of approved maintainer docs | `quickstart-and-governance-to-rollout-checklist.prompt.md` | approved quickstart plus approved governance docs | rollout execution and cross-link updates |
| create a one-page maintainer index | `maintainer-docs-to-map.prompt.md` | stable final doc set with file locations | link from README, onboarding, or handbook |

## Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- Operator summaries, delta summaries, standup briefings, end-of-day summaries, and reporting playbooks are derived coordination outputs only.

## Starting Prompts And Example Inputs

### 0. Autonomous Delivery From Repo Artifacts

Start with:

- `.github/agents/autonomous-delivery-orchestrator.agent.md`

Use when:

- you want the system to act on a spec, tracker, script, or repo doc
- the mission should continue through edits, tests, validation, repair, and deploy-readiness gating
- you want a strict final verdict instead of a partial implementation summary

Example input:

```text
Mission goal:
- Use docs/specs/wallet-payout-redesign.md to fully implement the feature across the repo and continue until the work is deploy-ready.

Source artifacts:
- docs/specs/wallet-payout-redesign.md
- reports/current-wallet-bugs.md
- tests/acceptance/wallet-payout-smoke.md

Execution expectations:
- Read the artifacts and derive the full task graph.
- Work across app/, components/, server/, lib/, hooks/, contexts/, prisma/, and tests where needed.
- Run validations after each major execution batch.
- Refresh mission-state snapshots as the mission progresses.
- Keep repairing until the mission is deploy-ready or truly blocked.

Constraints:
- Surface any approval-required production or migration steps.
- Do not stop at code edits alone.
```

Typical next prompt:

- `.github/prompts/mission-intake-to-execution-mode.prompt.md`
- `.github/prompts/mission-intake-to-mission-root.prompt.md`
- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`
- `.github/prompts/artifact-intake-to-task-graph.prompt.md`
- `.github/prompts/validation-state-to-validation-log.prompt.md`
- `.github/prompts/execution-state-to-mission-state.prompt.md`
- `.github/prompts/mission-state-and-handoff-to-resume-brief.prompt.md`
- `.github/prompts/mission-root-to-operator-summary.prompt.md`
- `.github/prompts/mission-roots-to-delta-summary.prompt.md`
- `.github/prompts/mission-briefings-to-standup-drift-briefing.prompt.md`
- `.github/prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`

Control reference:

- `.github/workflows/autonomous-execution-modes-and-approval-boundaries.md`

Continuity reference:

- `.github/workflows/autonomous-mission-state-and-handoffs.md`

Storage and resume reference:

- `.github/workflows/autonomous-mission-artifact-storage-and-resume.md`

Reporting playbook reference:

- `.github/workflows/autonomous-mission-reporting-playbook.md`

Template reference:

- `.github/missions/templates/`

Reconciliation reference:

- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`

Operator summary reference:

- `.github/prompts/mission-root-to-operator-summary.prompt.md`

Delta summary reference:

- `.github/prompts/mission-roots-to-delta-summary.prompt.md`

Standup briefing reference:

- `.github/prompts/mission-briefings-to-standup-drift-briefing.prompt.md`

End-of-day reference:

- `.github/prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`

### 1. Implementation Policy Or Guardrails

Start with:

- `.github/prompts/guardrails-to-always-on-instructions.prompt.md`

Use when:

- Copilot keeps producing the same weak implementation pattern
- a review found a recurring completeness gap
- a repo standard should become permanent instruction

Example input:

```text
Recurring implementation problems:
- New admin features often ship without loading, empty, and error states.
- Backend actions are added without matching retrieval views or status-transition coverage.
- Feature work in app/ and components/ is being done without companion updates in server/.

Standards to enforce:
- Every new admin workflow must include full user-state coverage.
- Every status-changing backend action must have retrieval, auditability, and permission checks.
- Work touching app/, components/, and server/ must be treated as one end-to-end implementation surface.

Ownership notes:
- app/, components/, server/ are primary.
- hooks/, contexts/, and lib/ need companion support only when the feature depends on shared UI state or utilities.
```

Typical next prompt:

- `.github/prompts/operating-handbook-and-instruction-candidates-to-instruction-drafts.prompt.md`

### 2. Release Planning, Recovery, Or Relaunch

Start with:

- `.github/prompts/leadership-brief-and-readiness-to-execution-charter.prompt.md`

Use when:

- a release needs an operating plan
- the repo is in a recovery cycle
- relaunch work needs structured coordination

Example input:

```text
Current state:
- Revenue pool payout changes are implemented but staging validation is incomplete.
- Two admin regressions are still open in withdrawal review and payout audit history.
- The team wants a controlled relaunch this week.

Constraints:
- No schema changes after Wednesday.
- Release must include rollback ownership and first-hour monitoring.
- Customer-facing messaging must not overstate readiness.

Goals:
- Produce a clear execution charter.
- Separate blockers from monitor-only items.
- Define who owns relaunch decisions, rollback, and stabilization.
```

Typical next prompt:

- `.github/prompts/reconciled-state-to-recovery-checklist.prompt.md`

### 3. Governance Or Maintainer Policy Docs

Start with:

- `.github/prompts/stable-guardrails-to-governance-summary.prompt.md`

Use when:

- recurring operating rules are now stable enough to document formally
- maintainers need a durable policy layer
- you want to turn working norms into governance material

Example input:

```text
Stable guardrails:
- All admin features must be delivered end to end across UI and backend.
- Release confirmation is not allowed until stabilization checks are complete.
- New maintainer docs should prefer updating existing locations over creating new fragmented files.

Governance intent:
- Capture these as durable maintainer policy.
- Clarify owner responsibilities for implementation, release, and docs hygiene.
- Keep the summary short enough to seed a handbook and governance file.
```

Typical next prompt:

- `.github/prompts/governance-summary-to-maintainer-handbook.prompt.md`

### 4. Maintainer Docs Bundle

Start with:

- `.github/prompts/governance-and-onboarding-to-doc-bundle.prompt.md`

Use when:

- governance and onboarding material exist but are not yet organized into a coherent maintainer set
- you need exact or recommended target files

Example input:

```text
Governance file proposal:
- Add a maintainer governance doc covering implementation standards, release discipline, and documentation ownership.

Onboarding guide content:
- New maintainers need a quick way to learn where instructions live, which prompts start each workflow, and how to avoid duplicate docs.

Known repo context:
- There are already docs in README.md, docs/, and several root handoff files.
- The new bundle should avoid duplicating existing deployment or handoff material.
```

Typical next prompt:

- `.github/prompts/doc-bundle-to-patch-plans.prompt.md`

### 5. Maintainer Quickstart

Start with:

- `.github/prompts/governance-and-onboarding-to-quickstart.prompt.md`

Use when:

- maintainers need a concise entry guide instead of a full document bundle
- you already know the core governance and onboarding points

Example input:

```text
Approved governance points:
- Start from workflows docs, not from random prompts.
- Treat hidden agents as review gates, not primary entrypoints.
- Record major customization additions in repo memory.

Onboarding essentials:
- Show where instructions, prompts, agents, and workflow docs live.
- Explain which starting prompt to use for implementation, release, governance, and maintainer-doc tasks.
- Keep it short enough for a new maintainer to read in one pass.
```

Typical next prompt:

- `.github/prompts/quickstart-and-governance-to-rollout-checklist.prompt.md`

### 6. Maintainer Docs Rollout Checklist

Start with:

- `.github/prompts/quickstart-and-governance-to-rollout-checklist.prompt.md`

Use when:

- the docs are approved and now need publishing order, review gates, and follow-up checks

Example input:

```text
Approved quickstart:
- Add a one-page maintainer quickstart that explains where to start and which prompts map to which task types.

Approved governance docs:
- Add maintainer governance coverage for implementation standards, release discipline, and documentation hygiene.

Rollout needs:
- Identify which files are new versus updates.
- Add cross-linking tasks.
- Include maintainer announcement and post-rollout verification steps.
```

Typical next step:

- execute the create or update actions described by the checklist

### 7. Maintainer Docs Map Or Index

Start with:

- `.github/prompts/maintainer-docs-to-map.prompt.md`

Use when:

- the maintainer docs set is stable enough to index
- maintainers need one page that says what each doc is for and where to begin

Example input:

```text
Stable maintainer docs set:
- .github/workflows/README.md
- .github/workflows/customization-system-map.md
- .github/workflows/customization-system-map-mermaid.md
- maintainer quickstart document
- maintainer governance document

Goal:
- Produce one page that groups these docs by purpose.
- Show a reading order.
- Make it obvious where rollout, governance, and workflow docs fit.
```

Typical next step:

- link the final map from the main maintainer entrypoints

## Fast Rules Of Thumb

- If the task is about permanent AI behavior, start in the implementation policy flow.
- If the task is about shipping, rollback, restart, or stabilization, start in the release flow.
- If the task is about formal maintainer rules, start in the governance flow.
- If the task is about packaging, publishing, or navigating maintainer docs, start in the maintainer docs flow.
- If you already have approved docs, do not go backward into governance-summary work unless the policy itself changed.
- If you already have a stable doc set, use the map prompt instead of creating another summary document from scratch.