# Customization Workflows

This folder is the entrypoint for maintainers who need to understand how the BPI GitHub Copilot customization system fits together.

## Start Here

- `customization-system-map.md`
  - Read this first for the narrative view.
  - Use it to understand the system layers, the major flows, and which prompt to start with for each task type.

- `customization-system-map-mermaid.md`
  - Open this next for the visual view.
  - Use it to scan the layer model, the main workflow paths, and the maintainer routing diagram.

- `maintainer-quick-use-cheat-sheet.md`
  - Use this when you want the practical version.
  - It gives one-page routing plus example inputs for each starting prompt.

- `pdf-mission-request-templates.md`
  - Use this when a new project starts from a PDF.
  - It gives copy-paste intake templates for full implementation, summary-only, and maintainer-doc conversion requests.

- `autonomous-delivery-definition-of-done.md`
  - Use this when you want the hard gates.
  - It defines what the autonomous delivery layer must satisfy before a mission can be called deploy-ready, not ready, or blocked.

- `autonomous-delivery-worker-model.md`
  - Use this when you want the delegation model.
  - It explains how the orchestrator hands work to specialized implementation, validation, repair, and release workers.

- `autonomous-execution-modes-and-approval-boundaries.md`
  - Use this when you want the control model.
  - It defines advisory, implementation, repair, release-prep, and deploy modes plus explicit approval and dependency stop lines.

- `autonomous-mission-state-and-handoffs.md`
  - Use this when you want continuity.
  - It defines mission-state snapshots, handoff artifacts, and the integrity checks needed for long-running autonomous work.

- `autonomous-mission-artifact-storage-and-resume.md`
  - Use this when you want canonical mission artifact paths and restart discipline.
  - It defines where long-running mission artifacts should live and how later autonomous sessions should resume from them.

- `autonomous-mission-reporting-playbook.md`
  - Use this when you want the practical reporting recipe.
  - It shows how to move from canonical mission roots to operator summaries, delta summaries, standup briefings, and end-of-day operations summaries.

- `autonomous-mission-reporting-playbook-mermaid.md`
  - Use this when you want the visual reporting recipe.
  - It shows the same reporting sequence as a one-glance Mermaid workflow and decision guide.

- `../prompts/mission-intake-to-mission-root.prompt.md`
  - Use this when you want mission bootstrap.
  - It initializes a canonical mission root from the mission goal and source artifacts before task-graph planning begins.

- `../prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`
  - Use this when you want mid-flight mission reconciliation.
  - It updates an existing canonical mission root when new or changed source artifacts expand or redirect the mission.

- `../prompts/mission-root-to-operator-summary.prompt.md`
  - Use this when you want a concise operator dashboard.
  - It derives a compact mission summary from the canonical mission root without replacing the authoritative artifacts.

- `../prompts/mission-roots-to-delta-summary.prompt.md`
  - Use this when you want a concise mission delta.
  - It compares earlier and later canonical mission states without replacing the authoritative artifacts.

- `../prompts/mission-briefings-to-standup-drift-briefing.prompt.md`
  - Use this when you want a cross-mission standup briefing.
  - It rolls mission summaries or deltas into a standup-ready execution-drift view without replacing the authoritative artifacts.

- `../prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`
  - Use this when you want close-of-day reporting from mission-derived briefings.
  - It turns standup briefings and related mission reporting into aligned leadership and operator end-of-day summaries without replacing the authoritative artifacts.

- `../prompts/validation-state-to-validation-log.prompt.md`
  - Use this when you want structured validation history.
  - It updates the canonical mission validation log after each meaningful gate run or repair cycle.

## When To Open What For Autonomous Reporting

- Open `customization-system-map.md` when you need the broader narrative view of how autonomous reporting fits into the full customization system.
- Open `autonomous-mission-reporting-playbook.md` when you need the practical step-by-step reporting recipe from mission roots through end-of-day outputs.
- Open `autonomous-mission-reporting-playbook-mermaid.md` when you want the fastest visual scan of the reporting sequence and authority rules.
- Open `.github/missions/examples/reporting/` when you want concrete worked examples of the derived reporting outputs.

## Autonomous Reporting Surfaces

Use this grouped navigation when you already know you are working in the autonomous reporting layer:

- `autonomous-mission-reporting-playbook.md`
- `autonomous-mission-reporting-playbook-mermaid.md`
- `.github/missions/examples/reporting/`

## Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- Reporting playbooks, reporting examples, operator summaries, delta summaries, standup briefings, and end-of-day summaries are derived coordination outputs only.

## What This Folder Covers

These workflow docs explain how the customization system works across:

- implementation guardrails and instruction generation
- autonomous delivery intake, repair loops, and deploy-readiness gating
- autonomous worker delegation across implementation, validation, repair, and release preparation
- autonomous execution modes and approval boundaries for high-risk actions
- autonomous mission-state persistence and handoffs across long-running sessions
- autonomous mission artifact storage and restart-safe resume discipline
- autonomous mission-root bootstrap from source artifacts into canonical repo-native state
- autonomous mission-root reconciliation when new source artifacts arrive mid-flight
- autonomous operator-facing mission summaries derived from canonical mission artifacts
- autonomous mission delta summaries derived from earlier and later canonical mission states
- autonomous cross-mission standup drift briefings derived from mission summaries and deltas
- autonomous end-of-day operations summaries derived from standup briefings and mission reporting
- PDF-driven mission intake templates for execution, summarization, and maintainer-doc conversion
- release, recovery, relaunch, and stabilization workflows
- governance and maintainer policy documentation
- maintainer documentation packaging, rollout, and mapping

## Recommended Reading Order

1. `customization-system-map.md`
2. `customization-system-map-mermaid.md`
3. `maintainer-quick-use-cheat-sheet.md`
4. `autonomous-delivery-definition-of-done.md`
5. `autonomous-delivery-worker-model.md`
6. `autonomous-execution-modes-and-approval-boundaries.md`
7. `autonomous-mission-state-and-handoffs.md`
8. `autonomous-mission-artifact-storage-and-resume.md`
9. `autonomous-mission-reporting-playbook.md`
10. `autonomous-mission-reporting-playbook-mermaid.md`

## When To Use This Folder

Use this folder when you need to:

- understand how instructions, skills, prompts, hidden agents, and memory fit together
- decide which prompt should be the starting point for a new customization task
- explain the system to a new maintainer without walking file by file through `.github/prompts` and `.github/agents`
- understand the hard finish line for autonomous execution before anything is treated as deploy-ready
- understand which autonomous worker should handle implementation, validation, repair, and release preparation tasks
- understand what the autonomous system may do on its own versus what it must stop and surface for approval
- understand how autonomous work persists its current truth across sessions, repairs, and escalation handoffs
- understand where autonomous mission artifacts should live and how later sessions should resume from a canonical restart brief
- understand the practical reporting recipe from mission roots through standup and end-of-day outputs

## Related Locations

- `.github/instructions/` for always-on implementation rules
- `.github/skills/` for reusable domain standards
- `.github/prompts/` for artifact-to-artifact workflow prompts
- `.github/agents/` for hidden read-only review checks
- `.github/missions/templates/` for canonical autonomous mission artifact templates
- `.github/missions/examples/` for worked autonomous mission roots
- `/memories/repo/ui-design.md` for repo-scoped continuity of customization decisions

The worked mission examples include both an active repair path and a blocked dependency path so maintainers can compare how canonical artifacts should express each state.

The example set also includes a derived reporting chain under `.github/missions/examples/reporting/` so maintainers can inspect operator summaries, delta summaries, and standup briefings produced from canonical mission roots.

That reporting chain also includes a derived end-of-day operations summary so maintainers can inspect the close-of-day bridge from standup reporting into leadership and operator status outputs.