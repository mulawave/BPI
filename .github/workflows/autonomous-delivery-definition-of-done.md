# Autonomous Delivery Definition Of Done

This document defines what the autonomous delivery layer must satisfy before a mission can be declared complete, deploy-ready, or blocked.

## Purpose

The system must not stop at code generation. It must continue through implementation, validation, repair, and release gating until the mission reaches a strict final state.

The system must also respect execution-mode limits and approval boundaries while doing so.

## Accepted Mission Inputs

The autonomous delivery layer is designed to start from repo-native artifacts such as:

- feature specs
- project briefs
- rollout or handoff docs
- implementation trackers
- bug audits
- test scripts or acceptance scripts
- file or folder paths in the repo

## Final Verdict Types

Every mission must end in exactly one of these states:

1. Deploy-ready
   - All required hard gates passed.
   - No unresolved critical implementation gaps remain.
   - No missing mandatory feature behavior remains relative to the input artifact.
   - Only normal release execution remains.

2. Not ready
   - The mission can continue autonomously, but one or more required gates are still failing.
   - More edits, tests, audits, or repair loops are required.

3. Blocked
   - The remaining path requires an external dependency, missing credential, infrastructure access, unresolved business rule, or explicit approval.

## Hard Validation Gates

The autonomous system must treat these as hard gates whenever they are relevant to the mission:

1. Lint passes
2. Typecheck passes
3. Build passes
4. Required tests pass
5. Required smoke or acceptance checks pass
6. Required data or migration safety checks pass
7. Required permissions and lifecycle behavior are in place
8. Required loading, empty, error, and success states exist for user-facing features
9. Required retrieval, persistence, and side effects exist for backend changes
10. Required docs, rollout notes, or operator guidance are generated when the mission includes delivery or maintainer-facing changes

## Strict Completeness Gates

A mission is not complete if any of the following remain true:

- a requested feature is only partially implemented
- a user flow exists without its management, review, or recovery states
- a backend transition exists without retrieval or auditability support
- a visible UI surface fails the expected BPI premium standard when that standard applies
- a release flow is missing rollback, monitoring, or verification coverage
- a documentation mission created fragmented or duplicate guidance when consolidation was available

## Review Gates

The autonomous system should use hidden review agents as strict checks, not as optional commentary.

Relevant review gates may include:

- `Feature Completeness Review`
- `Backend Process Integrity Review`
- `Premium UI Audit`
- `Deployment Risk Sweep`
- `Deploy Readiness Gatekeeper`
- `Governance Doc Overlap`
- `Maintainer Docs Fragmentation`
- `Maintainer Docs File Churn`

## Repair Loop Contract

After any execution batch, the system should:

1. Run the relevant hard validations.
2. Collect failures and incompleteness findings.
3. Classify the likely root causes.
4. Produce the next repair loop.
5. Apply repairs.
6. Re-run validations and review gates.

The mission should not stop at the first failure unless the remaining issue is truly blocked.

## Mission-State Persistence

Long-running autonomy must preserve the current mission truth across sessions.

At minimum, the system should persist:

1. current mission identity and source artifacts
2. current execution mode
3. completed and open work
4. validation history and gate state
5. approval and dependency status
6. exact next resume point

When the mission is long-running or multi-session, this state should live in canonical repo-native mission artifact locations and include a current resume brief rather than only ad hoc summaries.

A mission is not operationally well-governed if this state is lost between execution phases.

## Approval Boundaries

Even in autonomous mode, the system must surface and respect approval-required actions such as:

- production deployments
- destructive data changes
- risky schema or migration steps
- secret, credential, or environment changes
- irreversible third-party operations
- large deletions or repository-wide movement of stable artifacts

The approval-boundary guard should classify these explicitly before the orchestrator continues past them.

## Stop Conditions

The autonomous system must stop and return `blocked` when any of these are true:

- required credentials or infrastructure access are missing
- the business requirement is ambiguous enough that implementation could be wrong
- a required external dependency is unavailable
- a requested action crosses an approval boundary that has not been granted

## Mode Compliance

A mission is not validly complete if the system reached the result by exceeding the authority of its execution mode.

The orchestrator must:

1. choose the correct execution mode early
2. keep the mission within that mode's authority
3. escalate when the next step requires a higher-risk mode or explicit approval

## Working Standard

The target is not vague perfection. The target is refusal to stop until all formal completeness, validation, and deploy-readiness gates are satisfied.