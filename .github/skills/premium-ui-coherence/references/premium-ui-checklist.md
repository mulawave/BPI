# Premium UI Checklist

Use this checklist to audit or implement new BPI UI.

## 1. Structure and Composition

- Pages should have clear hierarchy, strong section rhythm, and intentional spacing.
- Complex views should prefer multi-pane or multi-section layouts over flat single-column dumps.
- Modals should feel substantial, especially for complex workflows.
- Tables, lists, or notifications should support filtering, sorting, selection, and useful detail views when appropriate.
- Empty, loading, and error states must be designed, not omitted.

## 2. Theme Parity

- Every light-mode decision should have an intentional dark-mode equivalent.
- Dark backgrounds must remain within the BPI green-dominant dark palette.
- Pair every `dark:bg-*` with explicit readable `dark:text-*` behavior.
- Avoid generic gray-black dark mode.
- Badge, hover, border, and panel states need dark-mode treatment, not only base surfaces.

## 3. Forbidden or Weak Patterns

- `dark:bg-gray-900`, `dark:bg-gray-800`, `dark:bg-black`
- Generic modal containers with no backdrop treatment or animation
- Flat white cards with no depth, motion, or hierarchy in premium contexts
- Missing toast feedback for actions
- Icons outside established repo usage unless clearly justified
- Arbitrary color choices that ignore the BPI palette

## 4. Color and Styling Expectations

- Prefer BPI green, forest, gold, and approved dark palette tokens.
- Use gradients and glassmorphism selectively to create atmosphere, not clutter.
- Maintain premium shadows and border definition.
- Focus states must feel branded and intentional.
- Status colors can vary, but must include dark-mode counterparts.

## 5. Interaction Quality

- Use smooth Framer Motion transitions for sophisticated components.
- Complex modals and overlays should animate in and out cleanly.
- Hover and selection states should reinforce hierarchy.
- Bulk actions, search, filters, and detail panes should appear where they materially improve the workflow.

## 6. Forms and Feedback

- Inputs should follow the repo’s strong-value-text, lighter-placeholder pattern.
- Focus border and focus rings should align with BPI green styling.
- Use toast feedback instead of browser alerts, confirms, or prompts.
- Validation, loading, success, and failure states must be visible.

## 7. Completion Criteria

A UI is coherent only when all of the following are true:

- It matches the premium BPI house style
- It works visually in light mode and dark mode
- Its colors and surfaces are brand consistent
- Its motion and feedback feel intentional
- It avoids forbidden dark-mode and off-brand styling patterns