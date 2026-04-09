# Autonomous Mission Reporting Playbook

This playbook shows maintainers how to move from canonical mission roots to practical daily reporting without turning derived summaries into a second source of truth.

For the one-glance visual companion, see `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md`.

For broader workflow navigation, also see:

- `.github/workflows/customization-system-map.md`
- `.github/workflows/README.md`

## Purpose

Use this guide when you need a repeatable reporting recipe for active autonomous missions across operator review, standup coordination, and end-of-day status communication.

## Reporting Layer Overview

The autonomous reporting layer exists to turn canonical mission roots into coordination-ready summaries without creating a second source of truth.

It covers:

- operator summaries for single-mission current state
- delta summaries for single-mission change over time
- standup briefings for multi-mission execution alignment
- end-of-day operations summaries for close-of-day leadership and operator reporting

## Core Rule

Derived reporting outputs are for coordination and communication only.

Authoritative mission truth remains in the canonical mission artifacts:

- `sources.md`
- `mission-state.md`
- `validation-log.md`
- `handoff.md`
- `resume-brief.md`

## Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- Operator summaries, delta summaries, standup briefings, and end-of-day summaries are derived reporting outputs only.

## Reporting Sequence

### 1. Start From The Canonical Mission Root

Open the mission root under:

- `.github/missions/<mission-slug>/`

Confirm the latest:

- mission state
- validation log
- handoff
- resume brief

If the source set changed mid-flight, reconcile first with:

- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`

### 2. Produce An Operator Summary

Use when you need a compact current-state view for one mission.

Prompt:

- `.github/prompts/mission-root-to-operator-summary.prompt.md`

Output should capture:

- current verdict
- validation posture
- blockers or approval boundaries
- open work by ownership surface
- exact first next step

### 3. Produce A Delta Summary When Change Over Time Matters

Use when you need to compare an earlier and later mission state.

Prompt:

- `.github/prompts/mission-roots-to-delta-summary.prompt.md`

Output should capture:

- verdict change
- blocker drift
- validation movement
- completed versus newly open work
- resume-classification change

### 4. Roll Missions Into A Standup Drift Briefing

Use when multiple missions need one coordination view for the day.

Prompt:

- `.github/prompts/mission-briefings-to-standup-drift-briefing.prompt.md`

This briefing should focus on:

- mission-by-mission status lines
- newly introduced drift
- blockers and dependencies
- validation focus
- ordered next actions

The hidden review gate remains:

- `Standup Drift Delta`

### 5. Produce The End-Of-Day Operations Summary

Use when leadership and operators need aligned close-of-day reporting.

Prompt:

- `.github/prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`

This summary should capture:

- leadership summary
- operator summary
- confirmed progress
- outstanding blockers and risks
- validation posture
- next-day priorities

The hidden review gate remains:

- `Stakeholder Narrative Drift`

## Practical Decision Guide

Use the smallest derived output that answers the question at hand.

- One mission, current status only: operator summary
- One mission, earlier vs later change: delta summary
- Multiple missions, execution alignment: standup briefing
- Multiple missions, close-of-day communication: end-of-day operations summary

## Common Failure Modes To Avoid

- treating an operator summary as authoritative instead of reopening the mission root
- writing a standup briefing before reconciling new source artifacts into the mission root
- narrating technical green status as execution-ready when approval or dependency blockers still exist
- letting end-of-day messaging drift from the actual blocker and validation state stored in canonical artifacts

## Worked Example Chain

See the derived reporting examples under:

- `.github/missions/examples/reporting/`

Recommended order:

1. `wallet-payout-redesign.operator-summary.md`
2. `withdrawal-provider-cutover.operator-summary.md`
3. `withdrawal-provider-cutover.pre-approval-to-blocked.delta-summary.md`
4. `active-missions.standup-drift-briefing.md`
5. `active-missions.end-of-day-operations-summary.md`

## Operational Outcome

The reporting chain should help maintainers communicate execution status faster while preserving a single authoritative mission truth inside the canonical mission roots.