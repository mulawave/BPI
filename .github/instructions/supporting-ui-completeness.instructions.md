---
name: "Supporting UI Completeness Guard"
description: "Use when implementing or fixing supporting frontend infrastructure in hooks, contexts, or lib. Enforces end-to-end completeness for theme wiring, state containers, shared utilities, navigation support, and feature-adjacent UI infrastructure so partial supporting work does not break the full experience."
applyTo: "hooks/**, contexts/**, lib/**"
---

# Supporting UI Completeness Guard

Apply this instruction whenever modifying files in `hooks/**`, `contexts/**`, or `lib/**` that support frontend features.

## Core Rule

Do not treat supporting UI infrastructure as complete if it only exposes raw state or utilities without covering the full feature integration needs.

## What to Check

- Does the hook or context support the full user journey, not just one local state change?
- Are loading, error, success, empty, and reset behaviors represented when relevant?
- Are derived values, counters, filters, selection state, and bulk-action support exposed when the feature needs them?
- Do shared utilities in `lib/**` cover both read and write paths where appropriate?
- Are navigation helpers, summary-to-detail linking needs, and UI coordination requirements accounted for?
- Does this infrastructure leave obvious follow-up implementation gaps for `app/**` or `components/**`?

## Required Expansion

When the supporting layer is part of a feature flow, account for:

- Source data and persistence paths
- Client state lifecycle
- Synchronization after mutations
- Summary counts, badges, and derived states
- Selection and bulk-action helpers
- Theme, layout, or panel coordination when relevant
- Error propagation and recovery behavior

## UI Quality Requirement

If the change supports visible UI behavior, it must remain compatible with the BPI premium UI standard and not create friction for complete light/dark theme behavior or sophisticated interaction patterns.

## Completion Test

The work is incomplete if the hook, context, or utility still forces downstream files to invent major missing lifecycle logic, state management, or integration behavior on their own.