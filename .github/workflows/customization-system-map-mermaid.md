# BPI Customization System Map: Mermaid View

This file is the visual companion to `.github/workflows/customization-system-map.md`. It gives maintainers a quick diagram view of the same layers, flows, and starting points.

## Layer Diagram

```mermaid
flowchart TD
    I[Instructions\nPermanent guardrails] --> S[Skills\nReusable domain standards]
    S --> P[Prompts\nArtifact-to-artifact transformers]
    P --> A[Hidden Agents\nRead-only review gates]
    A --> M[Memory\nRepo continuity and retained decisions]

    I --> IFILES[.github/copilot-instructions.md\n.github/instructions/*]
    S --> SFILES[.github/skills/premium-ui-coherence/SKILL.md]
    P --> PFILES[.github/prompts/*]
    A --> AFILES[.github/agents/*]
    M --> MFILES[/memories/repo/ui-design.md]
```

## Flow Overview
    A --> B[artifact-intake-to-task-graph]
```mermaid
flowchart LR
    START[Maintainer task] --> CHOICE{What kind of work is it?}

    CHOICE --> IMPL[Implementation\npolicy or guardrails]
    E --> P[execution-state-to-mission-state]
    P -. state .-> Q[Autonomous Mission State Integrity]
    P --> F[execution-state-to-repair-loop]
    F --> C
    F --> D
    F --> G[Test And Build Repair Worker]
    G --> E
    E --> H[Release Execution Worker]
    H --> R[mission-state-and-validation-to-handoff]
    R -. state .-> Q
    H --> I[Deploy Readiness Gatekeeper]
    REL --> RELFLOW[Release flow]
    GOV --> GOVFLOW[Governance flow]
    DOCS --> DOCFLOW[Maintainer docs flow]

    IMPLFLOW --> REVIEW[Hidden agent review gates]
    AUTOFLOW --> REVIEW
    RELFLOW --> REVIEW
    GOVFLOW --> REVIEW
    DOCFLOW --> REVIEW

    REVIEW --> PATCH[Patch plans or durable docs]
    PATCH --> MEMORY[Record workflow fact in repo memory]
```

## Autonomous Delivery Flow

```mermaid
flowchart LR
    A --> B0[mission-intake-to-execution-mode]
    B0 --> B1[mission-intake-to-mission-root]
    B1 --> B1R[mission-root-and-new-sources-to-reconciled-mission-root]
    B1R --> B[artifact-intake-to-task-graph]
    B0 -. boundary .-> O[Autonomous Approval Boundary Guard]
    B1 -. state .-> Q[Autonomous Mission State Integrity]
    B1 -. storage .-> T[autonomous-mission-artifact-storage-and-resume]
    B1R -. state .-> Q[Autonomous Mission State Integrity]
    B1R -. storage .-> T[autonomous-mission-artifact-storage-and-resume]
    B --> C[Frontend Delivery Worker]
    B --> D[Backend Delivery Worker]
    C --> E[Validation Execution Worker]
    D --> E
    E --> V[validation-state-to-validation-log]
    V -. state .-> Q[Autonomous Mission State Integrity]
    V -. storage .-> T[autonomous-mission-artifact-storage-and-resume]
    V --> P[execution-state-to-mission-state]
    P -. state .-> Q[Autonomous Mission State Integrity]
    P --> F[execution-state-to-repair-loop]
    F --> C
    F --> D
    F --> G[Test And Build Repair Worker]
    G --> E
    E --> H[Release Execution Worker]
    H --> R[mission-state-and-validation-to-handoff]
    R -. state .-> Q
    R --> S[mission-state-and-handoff-to-resume-brief]
    S -. state .-> Q
    S -. storage .-> T[autonomous-mission-artifact-storage-and-resume]
    S --> U[mission-root-to-operator-summary]
    U --> W[mission-roots-to-delta-summary]
    W --> X[mission-briefings-to-standup-drift-briefing]
    X -. checks .-> Y[Standup Drift Delta]
    X --> Z[mission-briefings-to-end-of-day-operations-summary]
    Z -. checks .-> AA[Stakeholder Narrative Drift]
    H --> I[Deploy Readiness Gatekeeper]

    B -. checks .-> J[Instruction Ownership Boundary Fit]
    B -. checks .-> K[Guardrail Policy Drift]
    F -. checks .-> L[Feature Completeness Review]
    F -. checks .-> M[Backend Process Integrity Review]
    F -. checks .-> N[Premium UI Audit]
    H -. prep .-> I
```

Starting agent and prompt:

- `.github/agents/autonomous-delivery-orchestrator.agent.md`
- `.github/prompts/mission-intake-to-execution-mode.prompt.md`
- `.github/prompts/mission-intake-to-mission-root.prompt.md`
- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`
- `.github/prompts/artifact-intake-to-task-graph.prompt.md`
- `.github/prompts/validation-state-to-validation-log.prompt.md`
- `.github/prompts/execution-state-to-mission-state.prompt.md`
- `.github/prompts/mission-state-and-validation-to-handoff.prompt.md`
- `.github/prompts/mission-state-and-handoff-to-resume-brief.prompt.md`
- `.github/prompts/mission-root-to-operator-summary.prompt.md`
- `.github/prompts/mission-roots-to-delta-summary.prompt.md`
- `.github/prompts/mission-briefings-to-standup-drift-briefing.prompt.md`
- `.github/prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`

Hard gate reference:

- `.github/workflows/autonomous-delivery-definition-of-done.md`

Control reference:

- `.github/workflows/autonomous-execution-modes-and-approval-boundaries.md`

Continuity reference:

- `.github/workflows/autonomous-mission-state-and-handoffs.md`

Storage and resume reference:

- `.github/workflows/autonomous-mission-artifact-storage-and-resume.md`

Related navigation for autonomous reporting:

- `.github/workflows/autonomous-mission-reporting-playbook.md`
- `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md`
- `.github/missions/examples/reporting/`

## Autonomous Reporting Surfaces

Use this grouped navigation when you want to jump straight into the reporting layer:

- `.github/workflows/autonomous-mission-reporting-playbook.md`
- `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md`
- `.github/missions/examples/reporting/`

## Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- The reporting surfaces above describe derived coordination outputs only.

## Implementation Flow

```mermaid
flowchart LR
    A[guardrails-to-always-on-instructions] --> B[operating-handbook-and-instruction-candidates-to-instruction-drafts]
    B --> C[instruction-drafts-to-finalized-instructions]
    C --> D[finalized-instructions-to-file-proposals]
    D --> E[file-proposals-to-patch-plans]
    E --> F[patch-plans-to-apply-patch]

    C -. checks .-> G[Instruction Enforcement Gaps]
    C -. checks .-> H[Instruction Ownership Boundary Fit]
    C -. checks .-> I[Instruction Scoping Mistakes]
```

Starting prompt:

- `.github/prompts/guardrails-to-always-on-instructions.prompt.md`

## Release And Recovery Flow

```mermaid
flowchart LR
    A[leadership-brief-and-readiness-to-execution-charter] --> B[execution-charter-and-guardrails-to-operating-handbook]
    B --> C[reconciled-state-to-recovery-checklist]
    C --> D[restart-brief-and-recovery-to-control-room-agenda]
    D --> E[control-room-and-relaunch-to-runbook]
    E --> F[reconciled-recovery-to-relaunch-comms]
    F --> G[post-relaunch-state-to-stabilization-watch]
    G --> H[stabilized-state-to-release-confirmation]
    H --> I[stable-post-launch-to-retrospective-seed]
    I --> J[retrospective-themes-to-readiness-checklist]

    E -. checks .-> K[Deployment Risk Sweep]
    F -. checks .-> L[Release Artifact Alignment]
    D -. checks .-> M[Restart Readiness Drift]
    G -. checks .-> N[Stabilization Operational Drift]
    H -. checks .-> O[Premature Closure Messaging]
    I -. checks .-> P[Repeated Release Pattern Failures]
    J -. checks .-> Q[Readiness Lesson Retention]
```

Starting prompt:

- `.github/prompts/leadership-brief-and-readiness-to-execution-charter.prompt.md`

## Governance Flow

```mermaid
flowchart LR
    A[stable-guardrails-to-governance-summary] --> B[governance-summary-to-maintainer-handbook]
    B --> C[maintainer-handbook-to-governance-file]
    C --> D[governance-artifacts-to-maintainer-onboarding]
    D --> E[governance-and-onboarding-to-doc-bundle]

    E -. checks .-> F[Governance Doc Overlap]
    E -. checks .-> G[Maintainer Onboarding Overlap]
    E -. checks .-> H[Maintainer Docs Fragmentation]
```

Starting prompt:

- `.github/prompts/stable-guardrails-to-governance-summary.prompt.md`

## Maintainer Docs Flow

```mermaid
flowchart LR
    A[governance-and-onboarding-to-doc-bundle] --> B[doc-bundle-to-patch-plans]
    A --> C[governance-and-onboarding-to-quickstart]
    C --> D[quickstart-and-governance-to-rollout-checklist]
    B --> D
    D --> E[maintainer-docs-to-map]

    A -. checks .-> F[Maintainer Docs Fragmentation]
    B -. checks .-> G[Maintainer Docs File Churn]
    D -. checks .-> G
    E -. checks .-> F
    E -. checks .-> H[Maintainer Onboarding Overlap]
    A -. checks .-> I[Governance Doc Overlap]
```

Starting prompts by input state:

- `.github/prompts/governance-and-onboarding-to-doc-bundle.prompt.md`
- `.github/prompts/governance-and-onboarding-to-quickstart.prompt.md`
- `.github/prompts/quickstart-and-governance-to-rollout-checklist.prompt.md`
- `.github/prompts/maintainer-docs-to-map.prompt.md`

## Maintainer Routing Summary

```mermaid
flowchart TD
    T[Need to extend the customization system] --> Q{Input you already have}
    Q -->|Repo spec, tracker, script, or project doc| Z[Start with Autonomous Delivery Orchestrator]
    Q -->|Recurring delivery rule| A[Start with guardrails-to-always-on-instructions]
    Q -->|Release or restart state| B[Start with leadership-brief-and-readiness-to-execution-charter]
    Q -->|Stable guardrails needing policy docs| C[Start with stable-guardrails-to-governance-summary]
    Q -->|Approved governance and onboarding docs| D[Start with governance-and-onboarding-to-doc-bundle]
    Q -->|Need a concise maintainer entry guide| E[Start with governance-and-onboarding-to-quickstart]
    Q -->|Need docs rollout steps| F[Start with quickstart-and-governance-to-rollout-checklist]
    Q -->|Need a top-level maintainer index| G[Start with maintainer-docs-to-map]
```