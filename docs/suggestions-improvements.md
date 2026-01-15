# Admin Task Suggestions & Follow-ups (Jan 14, 2026)

Purpose: capture suggestions, improvements, and cleanup items to apply after each implementation for the current admin gaps.

## Community: Update Details Modal
- Load full update record (metadata, attachments, audience, status history) from backend before render.
- Show audit trail (created/updated by, timestamps, last actor) and expose inlined timeline.
- Actions inside modal: edit, toggle active, delete (with ConfirmDialog), plus toast + refetch hooks.
- Error/empty states: graceful fallback if record missing; retry control.
- Accessibility: focus trap, keyboard close, announce status changes.

## Community: Deal Details Modal
- Load deal record with pricing, validity windows, inventory/limits, tags, linked package/plan if applicable.
- Actions inside modal: approve/activate/deactivate/delete; support reason notes when deactivating.
- Show performance metrics (views, clicks, conversions) if available; include trend sparkline placeholder until wired.
- Add audit bar (created/updated, last actor) and status chips.
- Error handling and refetch on mutation success with optimistic loading where safe.

## Help Page: Wiring Status
- Replace static text with a data-driven status map (single source-of-truth object), rendered into cards.
- Consider pulling live “wired/not wired” signals from feature flags or a config export to avoid drift.
- Add last-updated timestamp and link to the relevant route/component for each item.
- Include quick actions: open route, copy tRPC procedure names, and link to server router section.
