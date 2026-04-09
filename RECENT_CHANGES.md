# Recent Fixes & Updates (Since Last Push)

**Base commit:** `591c41f3` — *fix: restore jose dependency for impersonation route*
**Date:** April 9, 2026
**Scope:** 80 code files changed — 4,149 insertions, 1,539 deletions

---

## Critical Fixes

### Admin Access & Authentication
- **Admin layout retry resilience** (`app/admin/layout.tsx`) — Increased `checkAdminAccess` query retries from 1 to 5 with exponential backoff. Prevents "Admin access check failed / The operation was aborted" errors during cold compilation of the admin tRPC router.
- **Middleware membership bypass** (`middleware.ts`) — Exempted `admin` and `super_admin` roles from membership gating so admins are no longer redirected to the membership activation page.
- **Admin auth improvements** (`server/trpc/router/adminAuth.ts`, `server/auth.ts`) — Refined admin access checks and session handling.

### Database Maintenance
- **Removed super admin gating from DB Maintenance page** (`app/admin/database/page.tsx`) — Removed `requireSuperAdmin()` gate; any admin can now access the page.
- **Removed super admin gating from 9 DB maintenance tRPC procedures** (`server/trpc/router/admin.ts`) — Changed `listDatabaseTables`, `truncateTable`, `previewTable`, `getWipeEligibility`, `getWipeProfile`, `captureWipeProfile`, `wipeStoredTables`, `exportTableData`, `importTableData` from `superAdminProcedure` to `adminProcedure`.
- **Removed "SUPER ADMIN ONLY" badge** (`components/admin/DatabaseMaintenancePanel.tsx`) — UI no longer displays the super admin-only label.

### Backup & Restore System (Complete Rewrite)
- **Full database backup via pg_dump** (`server/trpc/router/admin.ts`) — Replaced Prisma-based `createBackup` that only exported 12 hardcoded tables with `pg_dump` that dumps all 174 tables with proper FK ordering.
- **Full database restore via psql** (`server/trpc/router/admin.ts`) — Replaced broken sequential upsert restore with `psql`-based SQL restore. Added backward-compatible JSON restore with deferred FK constraints and sponsor-unlinking strategy.
- **Backup list & delete updated** (`server/trpc/router/admin.ts`) — `listBackups` and `deleteBackup` now handle both `.sql` and `.json` files. Added path traversal protection to `deleteBackup`.
- **UI updated for SQL format** (`components/admin/BackupRestorePanel.tsx`) — `performRestore` detects SQL vs JSON format, file input accepts `.sql` files, success toast added.

---

## Payment System

### Mock Payment Gateway
- **Added mock payment to membership activation** (`app/membership/activate/[packageId]/page.tsx`) — Added `"mock"` to `PaymentGateway` type, payment options array, and `handlePayment` handler.
- **Server-side mock payment support** (`server/trpc/router/package.ts`) — Added `"mock"` to gateway enums in `initiateMembershipPayment` and `processUpgradePayment` mutations with instant activation. Blocked in production environment.

### Paystack & Flutterwave Webhooks
- **Major webhook overhaul** (`app/api/webhooks/paystack/route.ts`, `app/api/webhooks/flutterwave/route.ts`) — Significant expansion of both Paystack (+447 lines) and Flutterwave (+456 lines) webhook handlers with improved event handling and error resilience.
- **Paystack callback improvements** (`app/api/webhooks/paystack/callback/route.ts`, `app/api/webhooks/flutterwave/callback/route.ts`) — Updated callback routes.
- **Paystack library updates** (`lib/paystack.ts`) — Enhanced Paystack integration utilities.

### Payment Infrastructure
- **PaymentProcessor fixes** (`server/services/payment/PaymentProcessor.ts`) — Fixed `null` vs `undefined` coercion for `publicKey`/`secretKey` fields. Major refactoring (+168 lines).
- **PaymentGatewayFactory updates** (`server/services/payment/PaymentGatewayFactory.ts`) — Updated gateway factory for new payment flows.
- **PaystackGateway additions** (`server/services/payment/PaystackGateway.ts`) — New Paystack gateway functionality (+53 lines).
- **Membership payments service refactor** (`server/services/membershipPayments.service.ts`) — Large refactor of the membership payments service (+775 lines changed).
- **Payment router expansion** (`server/trpc/router/payment.ts`) — Extended payment tRPC procedures.
- **Deposit modal improvements** (`components/wallet/DepositModal.tsx`) — Enhanced deposit UI with additional features.

---

## Admin Panel Enhancements

### Sidebar & Navigation
- **KYC added to admin sidebar** (`components/admin/AdminSidebar.tsx`) — Added KYC management entry after Withdrawals in the sidebar.

### Admin Pages
- **Elite Club admin overhaul** (`app/admin/elite-club/page.tsx`) — Major restructuring of the elite club admin page (214 lines changed).
- **Revenue Pools admin expansion** (`app/admin/revenue-pools/page.tsx`) — Extended revenue pools admin (+144 lines).
- **Training admin expansion** (`app/admin/training/page.tsx`) — Added training management features (+73 lines).
- **Leadership Pool admin updates** (`app/admin/leadership-pool/page.tsx`) — UI improvements.
- **Bank Accounts / Currency / TechQuiz / Promotional Materials** — Various admin page fixes and improvements.

### Admin tRPC Router
- **Large admin router expansion** (`server/trpc/router/admin.ts`) — 354 lines of changes including backup/restore rewrite, DB maintenance procedure changes, and general improvements.

---

## Schema & Database

### Prisma Schema
- **75 new lines added** (`prisma/schema.prisma`) — New model fields/relations added to support expanded features.

### Scripts
- **Super admin seeder** (`prisma/seedSuperAdmin.ts`) — Updated with additional configuration.
- **Admin user creation script** (`scripts/createAdminUser.ts`) — Updated.
- **Make user admin script** (`scripts/makeUserAdmin.ts`) — Updated.
- **Revenue pools seeder** (`scripts/seedRevenuePools.ts`) — Updated.
- **Financial summary smoke test** (`scripts/smokeFinancialSummary.ts`) — Updated.

---

## tRPC Router Updates

- **Package router major expansion** (`server/trpc/router/package.ts`) — +481 lines including mock payment support, membership upgrade improvements.
- **Wallet router expansion** (`server/trpc/router/wallet.ts`) — +221 lines of new wallet functionality.
- **YouTube router refactor** (`server/trpc/router/youtube.ts`) — 311 lines changed.
- **Solar Assessment router** (`server/trpc/router/solarAssessment.ts`) — New router (+97 lines).
- **Leadership router** (`server/trpc/router/leadership.ts`) — Extended.
- **Membership packages router** (`server/trpc/router/membershipPackages.ts`) — Extended.
- **BPI Calculator router** (`server/trpc/router/bpiCalculator.ts`) — Extended.
- **Promotional materials router** (`server/trpc/router/promotionalMaterials.ts`) — Extended.
- **Auth router** (`server/trpc/router/auth.ts`) — Updated.
- **tRPC base config** (`server/trpc/trpc.ts`, `server/trpc/context.ts`) — Infrastructure updates.
- **Router merge** (`server/trpc/router/_app.ts`) — New routers registered.

---

## UI Components

- **ConfirmDialog redesign** (`components/ui/ConfirmDialog.tsx`) — 102-line refactor of the confirmation dialog.
- **Modal improvements** (`components/ui/Modal.tsx`) — Enhanced modal component (+71 lines).
- **BestDealModal fixes** (`components/admin/BestDealModal.tsx`) — 86-line refactor.
- **NotificationBroadcastModal** (`components/admin/NotificationBroadcastModal.tsx`) — Updated broadcast modal.
- **BrowseChannelsModal** (`components/community/BrowseChannelsModal.tsx`) — Community channel browsing updates.
- **SolarAssessmentModal** (`components/community/SolarAssessmentModal.tsx`) — New solar assessment modal (+102 lines).
- **Dashboard content** (`components/DashboardContent.tsx`, `app/dashboard-client/page.tsx`) — Dashboard updates.
- **TaxesModal** (`components/TaxesModal.tsx`) — Minor fixes.
- **EmpowermentContent** (`components/empowerment/EmpowermentContent.tsx`) — Updates.
- **StoreExperience** (`components/store/StoreExperience.tsx`) — Store UI updates.
- **SettingsLayout** (`components/settings/SettingsLayout.tsx`) — Extended settings layout.

---

## API Routes

- **Registration route cleanup** (`app/api/register/route.ts`) — Removed 17 lines of dead code.
- **Upload routes** (`app/api/upload/route.ts`, `app/api/upload/payment-proof/route.ts`) — Upload handling improvements.
- **Fix referrals route** (`app/api/fix-referrals/route.ts`) — Extended referral fix utility (+96 lines).
- **Impersonate route** (`app/api/auth/impersonate/route.ts`) — Updated impersonation handling.
- **Seed packages route** (`app/api/admin/seed-packages/route.ts`) — Updated package seeding.
- **Cron routes** (`app/api/cron/elite-club-deadline/route.ts`, `elite-club-reminder/route.ts`, `pool-distribution/route.ts`) — Cron job updates.
- **Migrate BPT balances** (`app/api/admin/migrate-bpt-balances/route.ts`) — Updated migration route.

---

## Configuration

- **Next.js config** (`next.config.mjs`) — Configuration updates (+19 lines).
- **Package dependencies** (`package.json`, `package-lock.json`) — Dependency changes.

---

## Pages

- **Blog post page** (`app/blog/[slug]/page.tsx`) — Updated blog rendering.
- **Membership pages** (`app/membership/page.tsx`, `app/membership/upgrade/[packageId]/page.tsx`) — Membership flow updates.
- **Receipts page** (`app/receipts/page.tsx`) — Added functionality.
- **Transactions page** (`app/transactions/page.tsx`) — Added functionality.

---

## Cron & Background Services

- **Cron server expansion** (`server/cron-server.ts`) — Extended cron job handling (+74 lines).
