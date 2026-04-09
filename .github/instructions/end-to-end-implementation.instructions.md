---
name: "End-to-End Implementation Guard"
description: "Use when implementing or fixing features in app, components, or server code. Enforces complete end-to-end delivery, blocks half-baked implementations, requires full user flow coverage, complete controls and states, and full backend operational wiring."
applyTo: "app/**, components/**, server/**"
---

# End-to-End Implementation Guard

Apply this instruction whenever modifying files under this repo for implementation or fix work.

## Core Rule

Do not treat a feature as complete when only the visible entry point, happy path, or first layer of UI exists. Build and validate the entire usable flow.

## Required Expansion

For any requested feature or fix, expand the scope to include all necessary adjacent pieces:

- Entry point and trigger UI
- Destination view, page, modal, dropdown, drawer, or panel
- Item-level and bulk actions when relevant
- Read, unread, active, inactive, archived, deleted, pending, loading, empty, success, and error states
- Links or navigation between summary views and detail views
- Server reads, mutations, permissions, persistence, and status transitions
- Validation, feedback, and recovery behavior
- Responsive behavior and dark/light theme parity for UI work

## Completion Questions

Before considering the work done, answer all of these:

1. Can a real user start, use, manage, and finish the feature end to end?
2. Are all expected controls present, not just the entry interaction?
3. Are supporting pages, panels, or management views implemented when needed?
4. Are permissions, persistence, and state transitions actually wired?
5. Are loading, empty, success, and failure states present?
6. Does the feature still feel complete after the first click?

If any answer is no, the implementation is still incomplete.

## UI Work

For UI work:

- Load and follow the `premium-ui-coherence` skill
- Invoke the hidden `Premium UI Audit` agent as a read-only final UI review when visible UI is part of the implementation
- Match the repo's sophisticated premium BPI standard
- Ensure intentional light and dark theme behavior
- Do not ship flat or partial management experiences

## Backend and Operational Work

For non-UI work, verify:

- Invoke the hidden `Backend Operational Audit` agent as a read-only final backend review when operational logic is part of the implementation
- Permissions and role enforcement
- Persistence and retrieval behavior
- Status transitions and lifecycle rules
- Error handling and recovery paths
- Operational completeness of related functions and processes

## Standard Example

If implementing notifications, the work is incomplete unless the system includes the trigger, dropdown or panel behavior, readable list design, read/unread distinction, item links, mark-all behavior, destination page, item management actions, bulk actions, persistence, and working end-to-end state updates.

Use this standard across all features, not only notifications.