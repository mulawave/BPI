# Admin Panel Go‑Live Handoff (Jan 15, 2026)

This document is a handoff snapshot of the current Admin Panel: what is **truly wired to backend control** (tRPC/Prisma), what is **read‑only**, and what is **still front‑end UI only** (not controlling production behavior).

## What you meant by “in control of the front end” (confirmed)

“In control” = actions in the Admin UI **persist real state** in the database and/or **trigger real business logic** (e.g., approving payments, changing roles, updating gateways/settings).

“Not in control” = screen looks finished but is effectively a **mock** (local state only, simulated timeouts, placeholder modals, or missing mutations/wiring).

---

## Current Status Summary

## Frontend Progress & Status

This section tracks the current Admin frontend implementation status (UI/UX + wiring signals).

### ✅ Frontend shipped (working UX, consistent patterns)

- **Premium admin shell + navigation loading UX**
  - Admin layout and route-level loading state exist: [app/admin/layout.tsx](app/admin/layout.tsx), [app/admin/loading.tsx](app/admin/loading.tsx)
  - Sidebar/header components: [components/admin/AdminSidebar.tsx](components/admin/AdminSidebar.tsx), [components/admin/AdminHeader.tsx](components/admin/AdminHeader.tsx)

- **Admin login premium background (green/brown/yellow sweep)**
  - Styling: [styles/admin-premium.css](styles/admin-premium.css)
  - Page usage: [app/admin/login/page.tsx](app/admin/login/page.tsx)

- **No native `alert()` / `confirm()` UX (premium confirmations + toasts)**
  - Reusable confirm modal: [components/ui/ConfirmDialog.tsx](components/ui/ConfirmDialog.tsx)
  - Toast provider is present: [components/providers.tsx](components/providers.tsx)
  - ConfirmDialog adopted in admin workflows (examples):
    - [app/admin/packages/page.tsx](app/admin/packages/page.tsx)
    - [app/admin/community/page.tsx](app/admin/community/page.tsx)
    - [components/admin/BackupRestorePanel.tsx](components/admin/BackupRestorePanel.tsx)

- **User Details modal improvements (portal + avatars + status clarity)**
  - Modal is portal-based (reliable overlay stacking): [components/admin/UserDetailsModal.tsx](components/admin/UserDetailsModal.tsx)
  - Verification display split (Activation vs Email Verified vs KYC Verified)

- **Admin Help / wiring documentation page**
  - Go-live wiring status matrix: [app/admin/help/page.tsx](app/admin/help/page.tsx)

### ✅ Frontend wired to backend (real control surfaces)

- **Users**: list/search/filter + edit + bulk actions UI wired: [app/admin/users/page.tsx](app/admin/users/page.tsx), [components/admin/UserEditModal.tsx](components/admin/UserEditModal.tsx)
- **Packages**: list + create/edit + toggle/bulk UI wired: [app/admin/packages/page.tsx](app/admin/packages/page.tsx), [components/admin/PackageCreateModal.tsx](components/admin/PackageCreateModal.tsx), [components/admin/PackageEditModal.tsx](components/admin/PackageEditModal.tsx)
- **Settings**: system settings + gateway config + notification settings UI wired: [app/admin/settings/page.tsx](app/admin/settings/page.tsx)
- **Integrations (Firebase Web Config)**
  - Admin-managed Firebase client config (apiKey/authDomain/projectId/storageBucket/messagingSenderId/appId/measurementId optional) stored in AdminSettings and surfaced via tRPC config endpoint.
  - UI: Integrations tab in [app/admin/settings/page.tsx](app/admin/settings/page.tsx)
  - API: [server/trpc/router/config.ts](server/trpc/router/config.ts) merges DB values with env fallbacks; measurementId treated as optional; exposes source/missing metadata.
  - Client usage: Hero ticker now initializes Firestore from tRPC-provided config with missing-key guard: [components/HeroTicker.tsx](components/HeroTicker.tsx), helper in [lib/firebase.ts](lib/firebase.ts).
- **Community**: create/update/delete updates + create/update deals are wired (broadcast modal wired too):
  - Page: [app/admin/community/page.tsx](app/admin/community/page.tsx)
  - Modals: [components/admin/CommunityUpdateModal.tsx](components/admin/CommunityUpdateModal.tsx), [components/admin/BestDealModal.tsx](components/admin/BestDealModal.tsx), [components/admin/NotificationBroadcastModal.tsx](components/admin/NotificationBroadcastModal.tsx)
- **Audit Logs**: filtering/search UI wired: [app/admin/audit/page.tsx](app/admin/audit/page.tsx)
- **Dashboard + Analytics + Reports charts**: read-only intelligence surfaces wired:
  - [app/admin/page.tsx](app/admin/page.tsx)
  - [app/admin/analytics/page.tsx](app/admin/analytics/page.tsx)
  - [app/admin/reports/page.tsx](app/admin/reports/page.tsx)

- **Payments Review (now fully wired)**
  - Pending reviews tab with details/review actions and bulk approve/reject.
  - Page: [app/admin/payments/page.tsx](app/admin/payments/page.tsx)
  - Modals: [components/admin/paymentdetailsmodal.tsx](components/admin/paymentdetailsmodal.tsx), [components/admin/paymentreviewmodal.tsx](components/admin/paymentreviewmodal.tsx)
  - Procedures: `admin.getPendingPayments`, `admin.getPaymentById`, `admin.reviewPayment`, `admin.bulkReviewPayments` in [server/trpc/router/admin.ts](server/trpc/router/admin.ts)

- **Backup & Restore (now real, with retention and listing)**
  - Create backup, restore from uploaded JSON, list and delete backups, enforce retention count.
  - Panel: [components/admin/backuprestorepanel.tsx](components/admin/backuprestorepanel.tsx)
  - Procedures: `admin.createBackup`, `admin.restoreDatabase`, `admin.listBackups`, `admin.deleteBackup` in [server/trpc/router/admin.ts](server/trpc/router/admin.ts)
  - Schedule and retention settings persisted via `admin.updateSystemSetting` (keys: `backup.schedule`, `backup.retention.count`).

- **Reports Export All (wired)**
  - Button now triggers exports for Users, Payments, Packages via existing CSV endpoints.
  - Page: [app/admin/reports/page.tsx](app/admin/reports/page.tsx)
  - Procedures: `admin.exportUsersToCSV`, `admin.exportPaymentsToCSV`, `admin.exportPackagesToCSV` in [server/trpc/router/admin.ts](server/trpc/router/admin.ts)

- **Reports scoped exports + tooltips (latest)**
  - CSV/JSON exports now respect current period + granularity; bucket labels include range tooltips.
  - Page: [app/admin/reports/page.tsx](app/admin/reports/page.tsx)

- **Global Search (latest)**
  - Debounced backend search plus keyboard navigation (↑/↓/Enter) with active highlighting.
  - Component: [components/admin/GlobalSearch.tsx](components/admin/GlobalSearch.tsx)

### ⚠️ Frontend present but not fully featured

- **Community Details modals remain placeholder**
  - Update and Deal details overlays render but are placeholder-only; no embedded actions/audit/state: [app/admin/community/page.tsx](app/admin/community/page.tsx#L520-L606)
- **Admin Help page is static**
  - Wiring matrix is hardcoded and drifts from reality; not data-driven: [app/admin/help/page.tsx](app/admin/help/page.tsx)

### ✅ Wired (real DB + real actions)

- **Admin Dashboard**: reads real platform intelligence via admin queries (stats, alerts, charts, performance, recent activity).
- **Users**: list/search/filter + bulk actions + edit modal are wired to backend mutations; user details pulls real data.
- **Referral Network counts (User Details modal)**: fixed to compute from the canonical `Referral` table traversal (levels 1–4), not stale `User.levelXCount`.
- **Packages**: list + toggle active + bulk update + create/edit modals are wired to backend.
- **Community**: create/update/delete community updates; create/update best deals; notification broadcast modal uses real mutation.
- **Settings**:
  - System settings query + update mutations are wired.
  - Payment gateways list + update mutations are wired.
  - Notification settings query + update mutations are wired.
  - Backup/restore fully wired with list/delete/retention and schedule persistence.
- **Audit Logs**: wired read + filtering.
- **Exports**: CSV export endpoints exist and are used by export UI.
  - “Export All” on Reports triggers consolidated downloads; scoped CSV/JSON export respects filters.

### ⚠️ Read‑only (wired to real data but no control actions exposed)

- None for Payments/Backup/Reports; read-only surfaces are analytics-only by design.

---

## Resolved Gaps (Jan 15, 2026)

- Payments review controls are now exposed on the Payments page, with single and bulk actions wired to real mutations and audit logging.
- Backup/Restore is fully implemented with create/restore/list/delete and retention policy; schedule and retention are persisted in Admin Settings.
- Reports “Export All” now wires to CSV endpoints and downloads consolidated files.
- Firebase client config is now admin-manageable (no redeploy needed); tRPC public config endpoint merges AdminSettings with env, and frontend reads from it (Hero ticker).

---

## Suggested Next Steps (Optional Enhancements)

1) **Harden Backups**
  - Add encryption-at-rest for backup JSON; optionally sign backups.
  - Support offsite storage (S3/Blob) with lifecycle policies.

2) **Payments**
  - Add reviewer notes templates and re-review policy controls if needed.

3) **Audit & Observability**
  - Add admin-side backup activity feed and retention alerts.

---

## Validation

- Type checks show no errors in updated files, and admin procedures for payments and backups respond correctly in local usage.

---

## Notes on Referral System (Admin)

- Canonical network computation uses the `Referral` table traversal (Level 1 → 4), mirroring user-side logic.
- Admin User Details modal now displays computed counts (with fallback for safety).

---

## Where to look (quick pointers)

- Admin routes: `app/admin/*`
- Admin components: `components/admin/*`
- Backend admin router: `server/trpc/router/admin.ts`
- User-side referral source of truth: `server/trpc/router/referral.ts`
- Payments review UI: [app/admin/payments/page.tsx](app/admin/payments/page.tsx) with modals under [components/admin](components/admin)
- Backup endpoints & UI: [server/trpc/router/admin.ts](server/trpc/router/admin.ts), [components/admin/backuprestorepanel.tsx](components/admin/backuprestorepanel.tsx)
- Reports export wiring: [app/admin/reports/page.tsx](app/admin/reports/page.tsx)

---

## Open Questions

- Should Payments approvals be single-review only, or allow re-review?
- Should backup/restore be implemented now (and if so, what storage target: local disk, S3, DB snapshots)?
- Do you want Level 5–10 referral counts displayed anywhere (schema supports higher in `ReferralTree`, but canonical traversal currently computes 1–4)?
