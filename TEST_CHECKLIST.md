# Test Checklist — Post-Push Verification

**Commit:** `ba34261e` — *feat: admin access fixes, backup/restore rewrite, payment & UI improvements*
**Date:** April 9, 2026
**Tester:** _______________
**Environment:** ☐ Local Dev ☐ Staging ☐ Production

> Mark each item: ✅ Pass | ❌ Fail | ⏭️ Skipped | 🔶 Partial
> Add notes in the **Notes** column for any failures or observations.

---

## 1. Critical Fixes

### 1.1 Admin Access & Authentication

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 1.1.1 | Admin login works on cold start | 1. Stop dev server. 2. Clear `.next` cache. 3. Start dev server. 4. Navigate to `/admin`. 5. Log in with admin credentials. | Login succeeds without "Admin access check failed" error. Loading spinner shows while compiling. | | |
| 1.1.2 | Retry resilience on slow compilation | 1. Log in to admin. 2. Open Network tab. 3. Observe `checkAdminAccess` requests. | Query retries up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 15s) before showing error. | | |
| 1.1.3 | Admin bypasses membership gating | 1. Log in as admin user without active membership. 2. Navigate to `/admin`. | Admin is NOT redirected to `/membership/activate`. Admin dashboard loads. | | |
| 1.1.4 | Super admin bypasses membership gating | 1. Log in as super_admin user without active membership. 2. Navigate to `/admin`. | Super admin is NOT redirected to `/membership/activate`. Admin dashboard loads. | | |
| 1.1.5 | Regular user still gated by membership | 1. Log in as a regular user with `role: "user"` and no active membership. 2. Navigate to `/dashboard`. | User IS redirected to membership activation page. | | |
| 1.1.6 | Admin auth session handling | 1. Log in as admin. 2. Verify session contains role. 3. Navigate between admin pages. | Session persists, role is correctly read, no auth errors on navigation. | | |

### 1.2 Database Maintenance Page

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 1.2.1 | Admin can access DB Maintenance | 1. Log in as `admin` role user. 2. Navigate to Admin > DB Maintenance. | Page loads fully. No "UNAUTHORIZED" or "super admin" errors. Tables listed. | | |
| 1.2.2 | No "SUPER ADMIN ONLY" badge | 1. Load DB Maintenance page. 2. Inspect page header. | The "SUPER ADMIN ONLY" badge/pill is NOT displayed. | | |
| 1.2.3 | List database tables | 1. Open DB Maintenance. 2. Observe the "Public schema tables" section. | All tables load with row estimates and sizes. No errors. | | |
| 1.2.4 | Preview a table | 1. Click on any table row. 2. Select "Preview" / expand to see rows. | First 20 rows display with column headers. No UNAUTHORIZED error. | | |
| 1.2.5 | Truncate a table | 1. Create a test table or use a safe empty table. 2. Click "Truncate" and confirm. | Table truncated. Row count drops to 0. Audit log entry created. | | |
| 1.2.6 | Export table data | 1. Select a table with data. 2. Click "Export". | JSON file downloads with all rows from the selected table. | | |
| 1.2.7 | Import table data | 1. Export a table. 2. Truncate it. 3. Import the exported JSON. | Data restored. Row count matches original. | | |
| 1.2.8 | Wipe eligibility check | 1. Click "Refresh eligibility". | Tables categorized as wipeable (empty) or protected (has data). No errors. | | |
| 1.2.9 | Capture wipe profile | 1. Click "Capture wipeable list". | Profile saved. Wipeable and protected lists displayed. Audit log created. | | |
| 1.2.10 | Wipe using stored profile | 1. Capture a wipe profile. 2. Click "Reset using stored list" and confirm. | Listed tables truncated. Success message shown. | | |
| 1.2.11 | Database reset / nuke section | 1. Fill in super admin credentials. 2. Type confirmation phrase. 3. Click "Wipe non-essential data". | Non-essential data wiped, super admin reseeded. System config preserved. | | |

### 1.3 Backup & Restore System

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 1.3.1 | Create backup (pg_dump) | 1. Go to Admin > Settings > Backup tab. 2. Click "Create Backup". | Backup created as `.sql` file. Success toast shown. File appears in backup list. | | |
| 1.3.2 | Backup includes all tables | 1. Download the created `.sql` backup. 2. Open it and search for table names. | All 174 tables present in the SQL dump (not just 12). Includes CREATE TABLE and INSERT statements. | | |
| 1.3.3 | Download backup | 1. Click "Download" on a backup entry. | `.sql` file downloads to browser. File is valid SQL. | | |
| 1.3.4 | Restore from SQL backup | 1. Create a backup. 2. Delete some data. 3. Click "Restore from File". 4. Select the `.sql` file. 5. Confirm. | Database restored. Data matches pre-backup state. Success toast "Database restored successfully" shown. | | |
| 1.3.5 | Restore from legacy JSON backup | 1. If a `.json` backup exists, upload it via "Restore from File". | JSON detected automatically. Legacy restore runs with deferred FK constraints. Data restored. | | |
| 1.3.6 | Restore handles FK constraints | 1. Backup. 2. Delete users who are sponsors. 3. Restore the SQL backup. | Restoration completes without FK constraint violations. Self-referential `sponsorId` links intact. | | |
| 1.3.7 | List backups shows both formats | 1. Have both `.sql` and `.json` files in backups directory. 2. View backup list. | Both `.sql` and `.json` backups listed with correct sizes and dates. | | |
| 1.3.8 | Delete backup | 1. Click "Delete" on a backup. 2. Confirm. | Backup removed from list and filesystem. Audit log entry created. | | |
| 1.3.9 | Path traversal protection | 1. Attempt to call `deleteBackup` with `filename: "../../etc/passwd"`. | Request rejected with "Invalid backup file path" error. File NOT deleted. | | |
| 1.3.10 | Retention policy | 1. Set retention to 2. 2. Create 3 backups. | Only the 2 most recent backups remain. Oldest auto-deleted. | | |
| 1.3.11 | Automated backup schedule | 1. Select a backup schedule (e.g., "Daily at 2:00 AM"). 2. Verify setting saved. | Schedule setting persisted in admin settings. | | |

---

## 2. Payment System

### 2.1 Mock Payment Gateway

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 2.1.1 | Mock payment visible in dev | 1. Ensure admin has enabled mock payment in settings. 2. Navigate to `/membership/activate/[packageId]`. 3. Look for mock payment option. | "Mock Payment (Dev)" option visible in payment method list. | | |
| 2.1.2 | Mock payment activates membership | 1. Select mock payment. 2. Click pay. | Membership activated instantly. Success redirect to dashboard. | | |
| 2.1.3 | Mock payment blocked in production | 1. Set `NODE_ENV=production`. 2. Attempt mock payment via API. | Server rejects with error. Mock payment not processed. | | |
| 2.1.4 | Mock payment on upgrade | 1. Have active membership. 2. Navigate to upgrade page. 3. Select mock payment. | Upgrade processed instantly. Membership tier updated. | | |

### 2.2 Paystack Webhooks

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 2.2.1 | Paystack payment success webhook | 1. Initiate Paystack payment. 2. Complete payment in Paystack. 3. Webhook fires to `/api/webhooks/paystack`. | Payment recorded. Membership activated. Transaction logged. | | |
| 2.2.2 | Paystack payment failure webhook | 1. Initiate Paystack payment. 2. Cancel/fail in Paystack. | Payment marked as failed. User notified. No membership change. | | |
| 2.2.3 | Paystack callback redirect | 1. Complete Paystack payment. 2. Check redirect from callback URL. | User redirected to correct verification/success page. | | |
| 2.2.4 | Paystack webhook signature validation | 1. Send a webhook with invalid signature. | Request rejected. Payment not processed. | | |
| 2.2.5 | Paystack duplicate webhook handling | 1. Send the same webhook event twice. | Second event ignored or handled idempotently. No duplicate records. | | |

### 2.3 Flutterwave Webhooks

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 2.3.1 | Flutterwave payment success webhook | 1. Initiate Flutterwave payment. 2. Complete payment. 3. Webhook fires. | Payment recorded. Membership activated. Transaction logged. | | |
| 2.3.2 | Flutterwave payment failure webhook | 1. Initiate and fail/cancel a Flutterwave payment. | Payment marked as failed. No membership change. | | |
| 2.3.3 | Flutterwave callback redirect | 1. Complete Flutterwave payment. 2. Check callback redirect. | User redirected to correct page. | | |
| 2.3.4 | Flutterwave webhook validation | 1. Send webhook with invalid secret hash. | Request rejected. | | |

### 2.4 Payment Infrastructure

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 2.4.1 | PaymentProcessor handles null keys | 1. Configure a gateway with null `publicKey` or `secretKey`. 2. Attempt a payment. | Graceful error handling. No crash from `null` vs `undefined` mismatch. | | |
| 2.4.2 | PaymentGatewayFactory returns correct gateway | 1. Request `"paystack"` gateway. 2. Request `"flutterwave"` gateway. 3. Request `"mock"` gateway. | Correct gateway instance returned for each. | | |
| 2.4.3 | Membership payment flow end-to-end | 1. Choose a membership package. 2. Select a payment method. 3. Complete payment. 4. Verify membership activated. | Full flow works. Transaction recorded. Wallet updated if applicable. | | |
| 2.4.4 | Deposit modal UI | 1. Open wallet. 2. Click "Deposit". 3. Interact with all deposit options. | Modal opens, all options render, amounts calculate correctly, submission works. | | |

---

## 3. Admin Panel

### 3.1 Sidebar & Navigation

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 3.1.1 | KYC entry in sidebar | 1. Log in as admin. 2. Look at the admin sidebar. | "KYC" entry appears after "Withdrawals" in the sidebar. | | |
| 3.1.2 | KYC navigation | 1. Click "KYC" in the sidebar. | Navigates to KYC management page. Page loads without errors. | | |
| 3.1.3 | All sidebar links functional | 1. Click through every sidebar item. | Each page loads without errors or blank screens. | | |

### 3.2 Admin Pages

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 3.2.1 | Elite Club admin page | 1. Navigate to Admin > Elite Club. | Page loads with restructured layout. All controls functional. | | |
| 3.2.2 | Revenue Pools admin page | 1. Navigate to Admin > Revenue Pools. | Page loads with expanded features. Pool data displayed correctly. | | |
| 3.2.3 | Training admin page | 1. Navigate to Admin > Training. | Training management features visible and functional. | | |
| 3.2.4 | Leadership Pool admin page | 1. Navigate to Admin > Leadership Pool. | UI improvements visible. Data loads correctly. | | |
| 3.2.5 | Bank Accounts admin page | 1. Navigate to Admin > Bank Accounts. | Page loads with updated layout. CRUD operations work. | | |
| 3.2.6 | Currency Manager admin page | 1. Navigate to Admin > Currency Manager. | Page loads. Exchange rates and BPToken price display. | | |
| 3.2.7 | TechQuiz admin page | 1. Navigate to Admin > TechQuiz. | Quiz management panel loads. Schools subpage accessible. | | |
| 3.2.8 | Promotional Materials admin page | 1. Navigate to Admin > Promotional Materials. | Page loads. Materials listed and manageable. | | |

---

## 4. Schema & Database

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 4.1 | Prisma schema syncs | 1. Run `npx prisma db push` or `npx prisma migrate deploy`. | Schema applied without errors. All new fields created. | | |
| 4.2 | Prisma client generates | 1. Run `npx prisma generate`. | Client generated successfully. No type errors. | | |
| 4.3 | Super admin seeder | 1. Run `npx ts-node prisma/seedSuperAdmin.ts`. | Super admin account created/updated. Login works. | | |
| 4.4 | Admin user creation script | 1. Run `npx ts-node scripts/createAdminUser.ts`. | Admin user created. Can log in to admin panel. | | |
| 4.5 | Revenue pools seeder | 1. Run `npx ts-node scripts/seedRevenuePools.ts`. | Revenue pool records created. Visible in admin. | | |

---

## 5. tRPC Routers

### 5.1 Package Router

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 5.1.1 | List membership packages | 1. Navigate to `/membership`. | Packages load and display with pricing. | | |
| 5.1.2 | Initiate membership payment | 1. Select a package. 2. Choose payment method. 3. Initiate payment. | Payment reference created. Redirect to payment gateway. | | |
| 5.1.3 | Process upgrade payment | 1. As active member, go to upgrade page. 2. Select higher tier. 3. Pay. | Upgrade processed. Tier updated. | | |

### 5.2 Wallet Router

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 5.2.1 | View wallet balances | 1. Log in as user with wallet. 2. Navigate to dashboard. | All wallet balances displayed correctly. | | |
| 5.2.2 | Wallet deposit | 1. Initiate a deposit. 2. Complete payment. | Balance updated. Transaction recorded. | | |
| 5.2.3 | Wallet withdrawal | 1. Initiate a withdrawal. 2. Admin approves. | Balance deducted. Transaction recorded. | | |

### 5.3 YouTube Router

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 5.3.1 | YouTube features load | 1. Navigate to YouTube-related features. | Data loads. No errors from refactored router. | | |

### 5.4 Solar Assessment Router

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 5.4.1 | Solar assessment submission | 1. Open Solar Assessment modal. 2. Fill in form. 3. Submit. | Assessment saved. Confirmation shown. | | |
| 5.4.2 | Solar assessment listing | 1. As admin, view solar assessments. | Submissions listed with details. | | |

### 5.5 Other Routers

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 5.5.1 | Leadership router | 1. Access leadership features. | Data loads correctly from extended router. | | |
| 5.5.2 | Membership packages router | 1. List packages as user and admin. | Packages display with correct pricing and features. | | |
| 5.5.3 | BPI Calculator router | 1. Use the BPI calculator feature. | Calculations return correct results. | | |
| 5.5.4 | Promotional materials router | 1. View promotional materials as user. | Materials load and display correctly. | | |
| 5.5.5 | Auth router | 1. Log in. 2. Log out. 3. Register new account. | Auth flows work without errors. | | |

---

## 6. UI Components

### 6.1 Dialogs & Modals

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 6.1.1 | ConfirmDialog renders correctly | 1. Trigger any confirmation dialog (e.g., delete backup). 2. Check styling. | Redesigned dialog renders. Confirm/Cancel buttons work. Backdrop blur present. | | |
| 6.1.2 | ConfirmDialog dark mode | 1. Switch to dark mode. 2. Trigger a confirmation dialog. | Proper dark theme styling. Text readable. Borders visible. | | |
| 6.1.3 | Modal component | 1. Open any modal. 2. Check close behavior (X, backdrop click, Escape). | Modal opens/closes correctly. Animations smooth. Content scrollable. | | |
| 6.1.4 | Modal dark mode | 1. Open modal in dark mode. | Proper dark theme. No contrast issues. | | |
| 6.1.5 | BestDealModal | 1. Navigate to admin > deals. 2. Open a deal modal. | Modal renders with refactored layout. Data displays correctly. | | |
| 6.1.6 | NotificationBroadcastModal | 1. Go to admin notifications. 2. Open broadcast modal. 3. Send a broadcast. | Modal works. Broadcast sent. Toast notification on success. | | |
| 6.1.7 | TaxesModal | 1. Open taxes/fees modal from relevant section. | Modal displays tax information correctly. | | |

### 6.2 Community Components

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 6.2.1 | BrowseChannelsModal | 1. Open community section. 2. Click "Browse Channels". | Modal opens. Channels listed. Search/filter works. | | |
| 6.2.2 | SolarAssessmentModal | 1. Access solar assessment feature. 2. Complete the form. | Modal renders all fields. Validation works. Submission succeeds. | | |

### 6.3 Page Components

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 6.3.1 | Dashboard content | 1. Log in as active member. 2. View dashboard. | Dashboard loads with all sections. Widgets display data. | | |
| 6.3.2 | Empowerment content | 1. Navigate to empowerment page. | Content loads correctly with updates applied. | | |
| 6.3.3 | Store experience | 1. Navigate to store. | Store page renders with updated UI. Products display. | | |
| 6.3.4 | Settings layout | 1. Navigate to user settings. 2. Check all tabs. | Extended settings layout renders. All tabs accessible. | | |

---

## 7. API Routes

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 7.1 | File upload | 1. Upload a file (e.g., profile image). | File uploads successfully. URL returned. | | |
| 7.2 | Payment proof upload | 1. Submit a payment proof image. | File saved. Linked to payment record. | | |
| 7.3 | Fix referrals utility | 1. Call `/api/fix-referrals` endpoint (admin only). | Referral tree rebuilt/repaired as needed. | | |
| 7.4 | Impersonation route | 1. As super admin, impersonate a user. | Session switches. Impersonation indicator shown. | | |
| 7.5 | Seed packages route | 1. Call `/api/admin/seed-packages`. | Default membership packages created. | | |
| 7.6 | Cron: Elite Club deadline | 1. Trigger `/api/cron/elite-club-deadline`. | Expired entries processed. Notifications sent. | | |
| 7.7 | Cron: Elite Club reminder | 1. Trigger `/api/cron/elite-club-reminder`. | Reminders sent to approaching-deadline members. | | |
| 7.8 | Cron: Pool distribution | 1. Trigger `/api/cron/pool-distribution`. | Pool distributions calculated and applied. | | |
| 7.9 | Migrate BPT balances | 1. Trigger `/api/admin/migrate-bpt-balances`. | BPT balances migrated correctly. | | |

---

## 8. Pages

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 8.1 | Blog post page | 1. Navigate to `/blog/[valid-slug]`. | Blog post renders with updated layout. Images load. | | |
| 8.2 | Membership listing page | 1. Navigate to `/membership`. | Membership packages listed with pricing and features. | | |
| 8.3 | Membership upgrade page | 1. As active member, navigate to upgrade page. | Available upgrades shown. Payment options work. | | |
| 8.4 | Receipts page | 1. Navigate to `/receipts`. | Payment receipts listed. Download/view works. | | |
| 8.5 | Transactions page | 1. Navigate to `/transactions`. | Transaction history displayed with new functionality. | | |

---

## 9. Configuration & Infrastructure

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 9.1 | Next.js config changes | 1. Run `npm run dev`. 2. Check for config warnings. | Dev server starts without config errors. | | |
| 9.2 | Package dependencies | 1. Run `npm install`. 2. Check for vulnerability warnings. | Dependencies install cleanly. No critical vulnerabilities. | | |
| 9.3 | Build succeeds | 1. Run `npm run build`. | Production build completes without errors. | | |
| 9.4 | Type check passes | 1. Run `npx tsc --noEmit`. | No TypeScript errors. | | |
| 9.5 | Lint passes | 1. Run `npm run lint`. | No ESLint errors. | | |

---

## 10. Cron & Background Services

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 10.1 | Cron server starts | 1. Start the cron server. | All cron jobs registered. No startup errors. | | |
| 10.2 | Scheduled jobs execute | 1. Check cron logs after scheduled time. | Jobs fire at configured intervals. Results logged. | | |
| 10.3 | Elite club cron jobs | 1. Trigger elite club deadline and reminder crons. | Deadlines processed. Reminders sent. | | |
| 10.4 | Pool distribution cron | 1. Trigger pool distribution cron. | Distributions calculated and applied to wallets. | | |

---

## 11. Cross-Cutting Concerns

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|-----------------|--------|-------|
| 11.1 | Dark mode across all changed pages | 1. Toggle dark mode. 2. Visit every changed page. | All pages render correctly in dark mode. No contrast issues. | | |
| 11.2 | Mobile responsiveness | 1. Resize browser to mobile width. 2. Navigate through admin and user pages. | Layouts adapt. No horizontal overflow. Touch targets adequate. | | |
| 11.3 | Toast notifications | 1. Perform various actions (backup, restore, delete, truncate, payment). | Toasts appear for success, error, and loading states. No `alert()` used. | | |
| 11.4 | Audit logging | 1. Perform backup, restore, delete backup, truncate, wipe operations. 2. Check audit_log table. | All operations logged with userId, action, entity, status, and timestamp. | | |
| 11.5 | Error boundaries | 1. Navigate to `/admin` pages. 2. Force errors (disconnect DB, etc.). | Error boundaries catch errors. Retry/fallback UI shown. No white screens. | | |
| 11.6 | Session persistence | 1. Log in. 2. Navigate between pages rapidly. 3. Wait 10 minutes. | Session persists. No unexpected logouts. | | |

---

## Test Summary

| Category | Total Tests | Pass | Fail | Skip | Partial |
|----------|------------|------|------|------|---------|
| 1. Critical Fixes | 22 | | | | |
| 2. Payment System | 14 | | | | |
| 3. Admin Panel | 11 | | | | |
| 4. Schema & Database | 5 | | | | |
| 5. tRPC Routers | 12 | | | | |
| 6. UI Components | 13 | | | | |
| 7. API Routes | 9 | | | | |
| 8. Pages | 5 | | | | |
| 9. Configuration | 5 | | | | |
| 10. Cron & Background | 4 | | | | |
| 11. Cross-Cutting | 6 | | | | |
| **TOTAL** | **106** | | | | |

---

**Sign-off:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Developer | | | |
| Reviewer | | | |
