# Autonomous Mission Reporting Playbook: Mermaid View

This file is the visual companion to `.github/workflows/autonomous-mission-reporting-playbook.md`.

Use it when you want the reporting sequence in one glance before reading the fuller operational recipe.

For broader workflow navigation, also see:

- `.github/workflows/customization-system-map.md`
- `.github/workflows/README.md`

## Reporting Layer Overview

The autonomous reporting layer turns canonical mission roots into derived coordination outputs for current-state review, change-over-time comparison, standup alignment, and end-of-day reporting.

Authoritative mission truth still remains in the canonical mission artifacts, not in the derived reporting outputs shown below.

## Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- The diagrams below describe derived reporting outputs only.

## Reporting Sequence

```mermaid
flowchart LR
    A[Canonical mission root\nsources, mission-state, validation-log, handoff, resume-brief] --> B{Source set changed?}
    B -->|Yes| C[mission-root-and-new-sources-to-reconciled-mission-root]
    B -->|No| D[mission-root-to-operator-summary]
    C --> D
    D --> E{Need change over time?}
    E -->|Yes| F[mission-roots-to-delta-summary]
    E -->|No| G{Need cross-mission coordination?}
    F --> G
    G -->|Yes| H[mission-briefings-to-standup-drift-briefing]
    H -. review .-> I[Standup Drift Delta]
    H --> J{Need close-of-day reporting?}
    G -->|No| K[Stop at mission-level reporting]
    J -->|Yes| L[mission-briefings-to-end-of-day-operations-summary]
    L -. review .-> M[Stakeholder Narrative Drift]
    J -->|No| N[Stop at standup briefing]
```

## Decision Guide

```mermaid
flowchart TD
    Q[What reporting question are you answering?] --> A[One mission\ncurrent state only]
    Q --> B[One mission\nchange over time]
    Q --> C[Multiple missions\nexecution alignment]
    Q --> D[Multiple missions\nclose-of-day status]

    A --> A1[mission-root-to-operator-summary]
    B --> B1[mission-roots-to-delta-summary]
    C --> C1[mission-briefings-to-standup-drift-briefing]
    D --> D1[mission-briefings-to-end-of-day-operations-summary]
```

## Authority Rule

```mermaid
flowchart TD
    ROOT[Canonical mission artifacts] --> DERIVED[Derived reporting outputs]
    DERIVED --> OP[Operator summary]
    DERIVED --> DELTA[Delta summary]
    DERIVED --> STANDUP[Standup briefing]
    DERIVED --> EOD[End-of-day operations summary]

    ROOT --> AUTH[Authoritative mission truth stays here]
    OP --> NONAUTH[Not authoritative]
    DELTA --> NONAUTH
    STANDUP --> NONAUTH
    EOD --> NONAUTH
```