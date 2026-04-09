# Autonomous Execution Modes And Approval Boundaries

This document defines how autonomous delivery should choose its operating mode and where it must stop for approval, authority, or dependency reasons.

## Purpose

High autonomy is only trustworthy when the system knows both what it is allowed to do and when it must stop.

## Execution Modes

### 1. Advisory

Use when:

- the mission should analyze, plan, review, or propose without making implementation changes

Allowed actions:

- read repo artifacts
- derive task graphs
- propose changes
- run read-only review logic

Must not do autonomously:

- implement code changes
- run destructive or state-changing operations
- claim deploy-ready status based on hypothetical work

### 2. Implementation

Use when:

- the mission should make code and documentation changes across the repo
- the system may execute normal validation loops and repair cycles

Allowed actions:

- edit code and docs
- run lint, typecheck, tests, and builds
- perform repair loops
- prepare release surfaces

Must stop for approval when:

- production deployment is required
- risky schema or data operations are the next step
- environment or secret changes are required

### 3. Repair

Use when:

- the repo already has a known failure state and the mission is to fix it until validations are green again

Allowed actions:

- inspect failures
- patch code and config
- re-run validations
- continue repair loops until the failure state clears or a blocker remains

Must not do autonomously:

- broaden into unrelated feature work unless required by root cause
- perform release or deploy actions without a mode change

### 4. Release-Prep

Use when:

- the implementation is nearly complete and the focus is operational readiness

Allowed actions:

- prepare rollout, rollback, monitoring, verification, and handoff artifacts
- run final readiness checks
- surface explicit ship risks

Must stop for approval when:

- live deployment, production migration, or customer-facing execution is the next step

### 5. Deploy

Use when:

- the mission explicitly includes deployment execution and the required authority has been granted

Allowed actions:

- perform the approved deployment sequence
- run deploy-verification steps
- report final live status

Required conditions:

- deploy authority is explicit
- approval boundaries are resolved
- deploy-readiness gatekeeper has already returned a green verdict

## Approval Boundaries

The autonomous system must stop and surface approval whenever the next action includes:

- production deployment
- destructive data changes
- risky or irreversible migrations
- secret, environment, or credential changes
- irreversible third-party actions
- large deletions or wide movement of stable repo artifacts
- externally visible customer or stakeholder communication that requires human approval

## Dependency Boundaries

The system must stop as blocked whenever the remaining path depends on:

- unavailable infrastructure
- missing credentials or secrets
- missing service access
- ambiguous product or business decisions
- external systems that cannot be validated from the current environment

## Mode Selection Rules

The orchestrator should choose modes using these defaults:

1. If the user wants analysis only, choose `Advisory`.
2. If the user wants full repo changes and repair loops, choose `Implementation`.
3. If the repo already has a concrete broken state to clear, choose `Repair`.
4. If code is mostly finished and launch operations are the focus, choose `Release-Prep`.
5. If a live ship is explicitly authorized and all gates are green, choose `Deploy`.

## Escalation Rules

The system must escalate instead of guessing when:

- the requested mode is inconsistent with the risk level
- the requested authority is insufficient for the next action
- a mission begins in one mode but naturally reaches a higher-risk boundary

## Working Rule

The orchestrator should always use the lowest mode that can finish the current phase of work while still honoring the mission goal.

Mode changes and boundary decisions should always be reflected in the current mission-state snapshot so later sessions do not resume with stale authority assumptions.