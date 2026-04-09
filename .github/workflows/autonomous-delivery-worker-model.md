# Autonomous Delivery Worker Model

This document defines how the autonomous delivery layer delegates work after the orchestrator has accepted a mission.

## Purpose

The orchestrator should not try to do every kind of work itself. It should delegate execution to focused workers with narrower responsibilities and clearer success criteria.

The worker model operates underneath the execution-mode and approval-boundary layer, not instead of it.

It also depends on the mission-state layer so workers and later sessions can continue from the same execution truth.

## Worker Set

### 1. Frontend Delivery Worker

File:

- `.github/agents/frontend-delivery-worker.agent.md`

Use for:

- visible user flows
- app and component implementation
- state coverage
- frontend support wiring in hooks, contexts, and lib
- premium UI and theme parity expectations

### 2. Backend Delivery Worker

File:

- `.github/agents/backend-delivery-worker.agent.md`

Use for:

- server logic
- Prisma and data shape changes
- retrieval, persistence, permissions, and lifecycle transitions
- operational side effects and process integrity

### 3. Validation Execution Worker

File:

- `.github/agents/validation-execution-worker.agent.md`

Use for:

- lint
- typecheck
- tests
- build
- smoke or acceptance verification
- structured gate-by-gate status reporting

### 4. Test And Build Repair Worker

File:

- `.github/agents/test-and-build-repair-worker.agent.md`

Use for:

- failed validation loops
- repair planning
- root-cause clustering of broken checks
- targeted revalidation sequencing

### 5. Release Execution Worker

File:

- `.github/agents/release-execution-worker.agent.md`

Use for:

- rollout steps
- rollback planning
- monitoring and verification steps
- release-surface preparation before final gatekeeping

## Delegation Pattern

The intended execution pattern is:

1. The orchestrator accepts the mission.
2. `mission-intake-to-execution-mode.prompt.md` sets the authority profile.
3. `artifact-intake-to-task-graph.prompt.md` derives the task graph.
4. The orchestrator assigns work to frontend and backend workers as needed.
5. The validation worker runs the required hard gates.
6. `validation-state-to-validation-log.prompt.md` updates the canonical validation log.
7. If failures remain, the repair worker drives the next repair cycle.
8. When the mission is technically green, the release worker prepares the release surface.
9. The deploy-readiness gatekeeper returns the final verdict.

Between these steps, the orchestrator should refresh mission-state snapshots whenever the current truth has materially changed.

## Worker Boundaries

- Frontend and backend workers should not own the final readiness verdict.
- The validation worker reports gates; it does not redefine the mission.
- The repair worker resolves failure states; it does not skip completeness requirements.
- The release worker prepares the release surface; it does not bypass the gatekeeper.
- The deploy-readiness gatekeeper is the final read-only ship gate.
- The approval-boundary guard determines when autonomy must stop for approval or dependency reasons.
- The mission-state integrity agent determines whether stored state and handoffs are trustworthy enough to continue from.

## Why This Model Exists

Autonomy becomes unreliable when one agent tries to plan, implement, validate, repair, and release in a single undifferentiated pass. The worker model creates specialization, cleaner handoffs, and more trustworthy stop conditions.