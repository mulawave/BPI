---
name: premium-ui-coherence
description: 'Review, guide, or upgrade new BPI pages, modals, overlays, dashboards, and components for consistent sophisticated premium UI/UX in light and dark themes. Use for UI coherence checks, dark mode parity, premium styling recommendations, non-conforming component audits, and fixing pages or modals that drift from the BPI design structure, colors, motion, and interaction standards.'
argument-hint: 'Describe the target UI and whether you want a strict audit, recommendations, or implementation guidance'
user-invocable: true
---

# Premium UI Coherence

Use this skill when working on BPI UI so new implementations stay aligned with the repo's default sophisticated premium design standard instead of drifting into one-off layouts or inconsistent dark-mode styling.

## What This Skill Produces

- A coherence audit for the target UI
- Concrete recommendations for non-conforming pages, modals, overlays, components, and styling
- A dark/light theme parity check
- A premium-upgrade plan for structure, motion, color, and interaction details

## When to Use

- Creating a new page, modal, overlay, dashboard, or reusable component
- Reviewing whether a UI matches the BPI premium house style
- Checking dark theme and light theme consistency
- Recommending fixes for weak, flat, generic, or off-brand styling
- Auditing a component before or after implementation

## Core Rule

Default to the BPI premium design baseline already established in the repo. Do not invent a parallel visual system unless the user explicitly asks for one.

## Required References

Load these before making recommendations:

- [Premium UI checklist](./references/premium-ui-checklist.md)
- [Premium UI examples](./references/premium-ui-examples.md)

## Procedure

1. Identify the target.
   - Determine whether the task is about a page, modal, overlay, dashboard, form, table, or shared component.
   - Identify whether the request is implementation, review, upgrade, or consistency checking.

2. Establish the baseline.
   - Compare the target against the repo's premium reference components and theme conventions.
   - Treat the repo's existing premium components as the source of truth for layout complexity, motion, color behavior, and polish.

3. Run a coherence audit.
   - Check structure: layout density, hierarchy, panes, cards, filters, detail views, bulk actions, and responsive behavior.
   - Check theme parity: light and dark states, background/text contrast, hover states, and status colors.
   - Check interactions: motion, loading states, empty states, toast feedback, and icon consistency.
   - Check styling: gradients, glassmorphism, premium shadows, border treatment, focus states, and brand color usage.

4. Flag non-conforming patterns.
   - Identify forbidden or weak patterns such as gray-black dark mode, generic modal shells, missing motion, missing feedback, or off-brand colors.
   - Call out the exact UI area that breaks coherence.

5. Recommend upgrades.
   - Provide specific structural recommendations, not vague advice.
   - Recommend how to upgrade the target to match the premium standard: pane layout, filters, analytics blocks, icon treatment, motion, theme pairs, and toast usage.
   - Prefer recommendations that fit existing repo patterns over novelty.

6. If implementing code.
   - Apply the checklist directly while editing.
   - Preserve the repo's established design language.
   - Ensure both light and dark theme states are intentionally designed, not mechanically mirrored.

7. Finish with a completion check.
   - Confirm premium structure quality
   - Confirm dark/light theme parity
   - Confirm brand-consistent colors and tokens
   - Confirm interaction polish and feedback states
   - Confirm no non-conforming patterns remain

## Output Format

When auditing, prefer this structure:

1. Overall conformity assessment
2. Critical mismatches
3. Premium-upgrade recommendations
4. Dark/light theme parity findings
5. Completion verdict

When no issues are found, explicitly say the UI conforms and note any minor opportunities only if they are meaningful.

## Quality Bar

The expected result is not merely functional UI. The expected result is cohesive, sophisticated, premium BPI UI that looks intentionally designed in both light and dark modes.