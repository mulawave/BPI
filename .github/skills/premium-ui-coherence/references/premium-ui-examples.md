# Premium UI Examples

Use these repo components and docs as the baseline for recommendations.

## Primary Premium Reference

- `components/notifications/NotificationsModal.tsx`
  - Use as the main premium modal benchmark
  - Multi-column layout
  - Search, filtering, bulk actions, detail panes
  - Motion-rich interactions
  - Strong visual hierarchy

## Additional Reference Components

- `components/wallet/WalletTimelineModal.tsx`
  - Timeline modal pattern with filters and richer interaction states

- `components/ui/Modal.tsx`
  - Base modal shell pattern

- `components/elite-club/EliteClubContent.tsx`
  - Premium dashboard/tier treatment and dark-mode-aware color mapping

- `app/admin/elite-club/page.tsx`
  - Status badge conventions with dark-mode variants

## Theme Source of Truth

- `tailwind.config.ts`
  - Brand palette, gradients, shadows, and UI tokens

- `styles/globals.css`
  - Light and dark theme variables

- `contexts/ThemeContext.tsx`
  - Theme switching and `data-theme` behavior

## Supporting Design Guidance

- `DARK_THEME_HANDOFF.md`
  - Dark theme migration and enforcement rules

- `.github/copilot-instructions.md`
  - Repo-level sophistication requirements

## Recommendation Heuristics

When a target UI is weak, recommend the closest fitting upgrade path:

- Generic modal -> premium multi-pane modal with backdrop blur, analytics, filters, and motion
- Flat admin page -> stronger information hierarchy, cards, status chips, sidebar or split-pane layout
- Weak dark mode -> green-dominant dark surfaces, explicit dark text colors, proper hover and badge states
- Bland hero or landing section -> richer background treatment, gradient atmosphere, stronger typography, clearer CTA hierarchy
- Thin feedback flow -> toast notifications, loading states, success/failure confirmation, and empty states