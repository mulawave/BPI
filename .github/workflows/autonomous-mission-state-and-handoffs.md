# Autonomous Mission State And Handoffs

This document defines how autonomous delivery should persist mission state across long-running execution, repair cycles, and session boundaries.

## Purpose

The autonomous system must not rely on one uninterrupted session. It needs persistent state artifacts so it can resume work accurately, escalate safely, and preserve validation history.

## Why This Layer Exists

Without mission-state persistence, autonomous work can drift in these ways:

- completed work gets repeated
- failed validations are forgotten
- execution mode changes are lost
- blockers disappear from the narrative
- later sessions continue from stale assumptions

## Core Artifacts

### 1. Mission-State Snapshot

Prompt:

- `.github/prompts/execution-state-to-mission-state.prompt.md`

Purpose:

- capture the current mission truth after intake, execution, validation, or repair work

Must include:

- mission identity
- source artifacts
- current mode
- affected surfaces
- completed work
- open work
- validation history
- approval and dependency state
- next resume point

### 2. Handoff Artifact

Prompt:

- `.github/prompts/mission-state-and-validation-to-handoff.prompt.md`

Purpose:

- let later autonomous sessions or human reviewers continue from the exact current state without reconstructing history manually

Must include:

- mission summary
- current verdict
- latest validation state
- blockers and approval items
- next recommended actions

### 3. Resume Brief

Prompt:

- `.github/prompts/mission-state-and-handoff-to-resume-brief.prompt.md`

Purpose:

- give the next autonomous session a strict restart artifact with canonical mission artifact paths, current authority limits, and the exact first next step

Must include:

- mission identity
- canonical artifact paths
- current mode and verdict
- current mission truth in brief form
- unresolved gates and blockers
- exact first next step

### 4. Mission-State Integrity Check

Agent:

- `.github/agents/autonomous-mission-state-integrity.agent.md`

Purpose:

- reject stale, contradictory, or incomplete mission-state or handoff artifacts before they are trusted

## When To Capture Mission State

The orchestrator should create or refresh mission-state artifacts at these moments:

1. after execution mode selection
2. after task-graph creation
3. after each major implementation batch
4. after each validation cycle
5. after each repair loop
6. before release preparation
7. before any final deploy-ready or blocked verdict

## When To Produce A Handoff

The system should generate a handoff artifact when:

- the session is ending but the mission is not complete
- approval is required before the next step
- an external dependency blocks continuation
- a human reviewer needs the exact current state
- another autonomous session will resume the mission later

## Canonical Storage And Resume

Mission-state, handoff, validation, and resume artifacts should live in predictable repo-native locations rather than scattered notes.

Reference:

- `.github/workflows/autonomous-mission-artifact-storage-and-resume.md`

The next autonomous session should prefer a current resume brief over reconstructing history from mission-state and handoff artifacts by hand.

## State Discipline Rules

The autonomous system should never continue from memory alone when a mission is long-running or multi-stage.

It should instead:

1. refresh the mission-state snapshot
2. verify the snapshot with the integrity agent
3. derive the next step from the latest validated state

## Working Rule

Long-running autonomy is only reliable when planning, execution, validation, repair, and release preparation all leave behind an accurate mission-state trail.