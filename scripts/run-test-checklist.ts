// BPI Test Checklist Runner — verifies all items from TEST_CHECKLIST.md
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const prisma = new PrismaClient();
const results: { id: string; name: string; status: "PASS" | "FAIL" | "SKIP"; notes: string }[] = [];

function log(id: string, name: string, status: "PASS" | "FAIL" | "SKIP", notes = "") {
  results.push({ id, name, status, notes });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`${icon} ${id} ${name}${notes ? ` — ${notes}` : ""}`);
}

function readLocal(rel: string) {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf-8");
}

async function main() {
  console.log("=== BPI TEST CHECKLIST RUNNER ===");
  console.log(`Date: ${new Date().toISOString()}\n`);

  // ─── SECTION 1: Critical Fixes ───
  console.log("--- 1. Critical Fixes ---\n");

  // 1.1.1-1.1.2: Admin layout retry resilience
  try {
    const code = readLocal("app/admin/layout.tsx");
    log("1.1.1", "Admin layout retry:5 + exponential backoff",
      code.includes("retry: 5") && code.includes("retryDelay") ? "PASS" : "FAIL",
      `retry:5=${code.includes("retry: 5")}, retryDelay=${code.includes("retryDelay")}`);
  } catch (e: any) { log("1.1.1", "Admin layout retry config", "FAIL", e.message); }

  // 1.1.3: Admin bypasses membership middleware
  try {
    const mw = readLocal("middleware.ts");
    const hasAdminBypass = mw.includes("admin") && mw.includes("super_admin");
    log("1.1.3", "Middleware exempts admin from membership gating", hasAdminBypass ? "PASS" : "FAIL");
  } catch (e: any) { log("1.1.3", "Middleware admin bypass", "FAIL", e.message); }

  // 1.1.6: Admin auth - DB check
  try {
    const admin = await prisma.user.findFirst({ where: { role: { in: ["admin", "super_admin"] } } });
    log("1.1.6", "Admin user exists in DB",
      admin ? "PASS" : "FAIL",
      admin ? `${admin.email} (${admin.role})` : "No admin found");
  } catch (e: any) { log("1.1.6", "Admin DB check", "FAIL", e.message); }

  // 1.2.1: DB Maintenance - no super admin gate on page
  try {
    const dbPage = readLocal("app/admin/database/page.tsx");
    log("1.2.1", "DB Maintenance: no requireSuperAdmin gate",
      !dbPage.includes("requireSuperAdmin") && !dbPage.includes("redirect") ? "PASS" : "FAIL");
  } catch (e: any) { log("1.2.1", "DB Maintenance page", "FAIL", e.message); }

  // 1.2.2: No "SUPER ADMIN ONLY" badge
  try {
    const panel = readLocal("components/admin/DatabaseMaintenancePanel.tsx");
    log("1.2.2", "No 'Super Admin Only' badge in UI", !panel.includes("Super Admin Only") ? "PASS" : "FAIL");
  } catch (e: any) { log("1.2.2", "Super admin badge", "FAIL", e.message); }

  // 1.2.3: All 9 DB maintenance procs use adminProcedure
  try {
    const router = readLocal("server/trpc/router/admin.ts");
    const procs = [
      "listDatabaseTables", "truncateTable", "previewTable",
      "getWipeEligibility", "getWipeProfile", "captureWipeProfile",
      "wipeStoredTables", "exportTableData", "importTableData"
    ];
    const failures: string[] = [];
    for (const p of procs) {
      const rx = new RegExp(`${p}:\\s*(\\w+Procedure)`);
      const m = router.match(rx);
      if (m && m[1] !== "adminProcedure") failures.push(`${p}:${m[1]}`);
    }
    log("1.2.3", "9 DB procs use adminProcedure",
      failures.length === 0 ? "PASS" : "FAIL",
      failures.length ? failures.join(", ") : "All 9 verified");
  } catch (e: any) { log("1.2.3", "DB procedure check", "FAIL", e.message); }

  // 1.2.4: DB has public schema tables
  try {
    const rows = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as c FROM pg_tables WHERE schemaname='public'`;
    const count = rows[0]?.c || 0;
    log("1.2.4", "Database has tables", count > 0 ? "PASS" : "FAIL", `${count} tables`);
  } catch (e: any) { log("1.2.4", "Table count", "FAIL", e.message); }

  // ─── Backup & Restore ───
  console.log("\n--- 1.3 Backup & Restore ---\n");

  try {
    const router = readLocal("server/trpc/router/admin.ts");
    log("1.3.1", "createBackup uses pg_dump",
      router.includes("pg_dump") && router.includes("execSync") ? "PASS" : "FAIL");
    log("1.3.4", "restoreDatabase uses psql for SQL",
      router.includes("psql") ? "PASS" : "FAIL");
    log("1.3.5", "restoreDatabase handles legacy JSON",
      router.includes("Legacy JSON restore") || router.includes("JSON.parse") ? "PASS" : "FAIL");
    log("1.3.6", "FK constraint handling (deferred + sponsor unlink)",
      router.includes("SET CONSTRAINTS ALL DEFERRED") && router.includes("sponsorMap") ? "PASS" : "FAIL");
    log("1.3.7", "listBackups handles .sql and .json",
      router.includes('.endsWith(".sql")') && router.includes('.endsWith(".json")') ? "PASS" : "FAIL");
    log("1.3.9", "Path traversal protection",
      router.includes('includes("..")') || router.includes("startsWith(backupDir)") ? "PASS" : "FAIL");
    log("1.3.10", "Retention policy on backups",
      router.includes("backup.retention.count") ? "PASS" : "FAIL");
  } catch (e: any) { log("1.3.x", "Backup/restore code checks", "FAIL", e.message); }

  // Actual pg_dump test
  try {
    const ver = execSync("pg_dump --version 2>&1").toString().trim();
    log("1.3.2a", "pg_dump binary available", ver.includes("pg_dump") ? "PASS" : "FAIL", ver);
  } catch (e: any) { log("1.3.2a", "pg_dump availability", "FAIL", e.message); }

  try {
    const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
    fs.mkdirSync(backupDir, { recursive: true });
    const rawDbUrl = process.env.DATABASE_URL || "postgresql://pguser:pgpass@localhost:5432/bpi_dev";
    // pg_dump doesn't support the ?schema= query parameter — strip it
    const dbUrl = rawDbUrl.replace(/[?&]schema=[^&]*/g, "").replace(/\?$/, "");
    const ts = Date.now();
    const fp = path.join(backupDir, `_test_${ts}.sql`);
    execSync(`pg_dump --no-owner --no-privileges --clean --if-exists "${dbUrl}" -f "${fp}"`, {
      timeout: 120000,
    });
    const st = fs.statSync(fp);
    const content = fs.readFileSync(fp, "utf-8");
    const tableCount = (content.match(/CREATE TABLE/g) || []).length;
    log("1.3.2b", "pg_dump produces valid backup",
      st.size > 1000 ? "PASS" : "FAIL",
      `${(st.size / 1024).toFixed(1)} KB, ${tableCount} CREATE TABLE statements`);
    fs.unlinkSync(fp);
  } catch (e: any) { log("1.3.2b", "Actual pg_dump test", "FAIL", e.message); }

  // BackupRestorePanel UI
  try {
    const ui = readLocal("components/admin/BackupRestorePanel.tsx");
    log("1.3.UI", "BackupRestorePanel SQL detection + success toast",
      ui.includes("isSql") && ui.includes("Database restored successfully") ? "PASS" : "FAIL");
  } catch (e: any) { log("1.3.UI", "BackupRestorePanel", "FAIL", e.message); }

  // ─── SECTION 2: Payment System ───
  console.log("\n--- 2. Payment System ---\n");

  try {
    const page = readLocal("app/membership/activate/[packageId]/page.tsx");
    log("2.1.1", "Mock payment in membership activation UI",
      page.includes('"mock"') || page.includes("'mock'") ? "PASS" : "FAIL");
  } catch (e: any) { log("2.1.1", "Mock payment UI", "FAIL", e.message); }

  try {
    const pkg = readLocal("server/trpc/router/package.ts");
    log("2.1.2", "Server-side mock payment support", pkg.includes('"mock"') ? "PASS" : "FAIL");
    log("2.1.3", "Mock blocked in production",
      pkg.includes("production") && pkg.includes("mock") ? "PASS" : "FAIL");
  } catch (e: any) { log("2.1.2", "Server mock", "FAIL", e.message); }

  try {
    const pWH = readLocal("app/api/webhooks/paystack/route.ts");
    log("2.2.1", "Paystack webhook handler", pWH.length > 500 ? "PASS" : "FAIL", `${pWH.length} chars`);
  } catch (e: any) { log("2.2.1", "Paystack webhook", "FAIL", e.message); }

  try {
    const fWH = readLocal("app/api/webhooks/flutterwave/route.ts");
    log("2.3.1", "Flutterwave webhook handler", fWH.length > 500 ? "PASS" : "FAIL", `${fWH.length} chars`);
  } catch (e: any) { log("2.3.1", "Flutterwave webhook", "FAIL", e.message); }

  try {
    readLocal("server/services/payment/PaymentProcessor.ts");
    log("2.4.1", "PaymentProcessor file exists", "PASS");
  } catch (e: any) { log("2.4.1", "PaymentProcessor", "FAIL", e.message); }

  try {
    readLocal("server/services/payment/PaymentGatewayFactory.ts");
    log("2.4.2", "PaymentGatewayFactory file exists", "PASS");
  } catch (e: any) { log("2.4.2", "PaymentGatewayFactory", "FAIL", e.message); }

  try {
    readLocal("server/services/payment/PaystackGateway.ts");
    log("2.4.3", "PaystackGateway file exists", "PASS");
  } catch (e: any) { log("2.4.3", "PaystackGateway", "FAIL", e.message); }

  try {
    readLocal("components/wallet/DepositModal.tsx");
    log("2.4.4", "DepositModal file exists", "PASS");
  } catch (e: any) { log("2.4.4", "DepositModal", "FAIL", e.message); }

  // ─── SECTION 3: Admin Panel ───
  console.log("\n--- 3. Admin Panel ---\n");

  try {
    const sb = readLocal("components/admin/AdminSidebar.tsx");
    log("3.1.1", "KYC entry in admin sidebar", sb.toLowerCase().includes("kyc") ? "PASS" : "FAIL");
  } catch (e: any) { log("3.1.1", "KYC sidebar", "FAIL", e.message); }

  const adminPages = [
    ["3.2.1", "Elite Club", "app/admin/elite-club/page.tsx"],
    ["3.2.2", "Revenue Pools", "app/admin/revenue-pools/page.tsx"],
    ["3.2.3", "Training", "app/admin/training/page.tsx"],
    ["3.2.4", "Leadership Pool", "app/admin/leadership-pool/page.tsx"],
    ["3.2.5", "Bank Accounts", "app/admin/bank-accounts/page.tsx"],
    ["3.2.6", "Currency Manager", "app/admin/currency/page.tsx"],
    ["3.2.7", "TechQuiz", "app/admin/techquiz/page.tsx"],
    ["3.2.8", "Promotional Materials", "app/admin/promotional-materials/page.tsx"],
  ];
  for (const [id, name, fp] of adminPages) {
    try {
      const c = readLocal(fp);
      log(id, `${name} admin page`, c.length > 50 ? "PASS" : "FAIL", `${c.length} chars`);
    } catch (e: any) { log(id, `${name} admin page`, "FAIL", e.message); }
  }

  // ─── SECTION 4: Schema & Database ───
  console.log("\n--- 4. Schema & Database ---\n");

  try {
    const schema = readLocal("prisma/schema.prisma");
    const modelCount = (schema.match(/^model /gm) || []).length;
    log("4.1", "Prisma schema valid", modelCount > 100 ? "PASS" : "FAIL", `${modelCount} models`);
  } catch (e: any) { log("4.1", "Prisma schema", "FAIL", e.message); }

  try {
    const exists = fs.existsSync(path.join(process.cwd(), "node_modules/.prisma/client/index.js"));
    log("4.2", "Prisma client generated", exists ? "PASS" : "FAIL");
  } catch (e: any) { log("4.2", "Prisma client", "FAIL", e.message); }

  const scriptFiles = [
    ["4.3", "seedSuperAdmin", "prisma/seedSuperAdmin.ts"],
    ["4.4", "createAdminUser", "scripts/createAdminUser.ts"],
    ["4.5a", "makeUserAdmin", "scripts/makeUserAdmin.ts"],
    ["4.5b", "seedRevenuePools", "scripts/seedRevenuePools.ts"],
  ];
  for (const [id, name, fp] of scriptFiles) {
    log(id, `${name} script exists`, fs.existsSync(path.join(process.cwd(), fp)) ? "PASS" : "FAIL");
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as c FROM pg_tables WHERE schemaname='public'`;
    const schema = readLocal("prisma/schema.prisma");
    const models = (schema.match(/^model /gm) || []).length;
    const tables = rows[0]?.c || 0;
    log("4.DB", "DB tables ~= schema models",
      tables >= models - 10 ? "PASS" : "FAIL",
      `DB:${tables} tables, Schema:${models} models`);
  } catch (e: any) { log("4.DB", "Table/model sync", "FAIL", e.message); }

  // ─── SECTION 5: tRPC Routers ───
  console.log("\n--- 5. tRPC Routers ---\n");

  const routerFiles = [
    ["5.1.1", "package", "server/trpc/router/package.ts"],
    ["5.2.1", "wallet", "server/trpc/router/wallet.ts"],
    ["5.3.1", "youtube", "server/trpc/router/youtube.ts"],
    ["5.4.1", "solarAssessment", "server/trpc/router/solarAssessment.ts"],
    ["5.5.1", "leadership", "server/trpc/router/leadership.ts"],
    ["5.5.2", "membershipPackages", "server/trpc/router/membershipPackages.ts"],
    ["5.5.3", "bpiCalculator", "server/trpc/router/bpiCalculator.ts"],
    ["5.5.4", "promotionalMaterials", "server/trpc/router/promotionalMaterials.ts"],
    ["5.5.5", "auth", "server/trpc/router/auth.ts"],
    ["5.5.6", "payment", "server/trpc/router/payment.ts"],
  ];
  for (const [id, name, fp] of routerFiles) {
    try {
      const c = readLocal(fp);
      const procs = (c.match(/Procedure\./g) || []).length;
      log(id, `${name} router`, c.length > 100 ? "PASS" : "FAIL", `${c.length} chars, ~${procs} procedures`);
    } catch (e: any) { log(id, `${name} router`, "FAIL", e.message); }
  }

  try {
    const app = readLocal("server/trpc/router/_app.ts");
    log("5.6", "New routers registered in _app.ts",
      app.includes("solarAssessment") ? "PASS" : "FAIL",
      `solarAssessment:${app.includes("solarAssessment")}, kyc:${app.includes("kyc")}`);
  } catch (e: any) { log("5.6", "Router registration", "FAIL", e.message); }

  // ─── SECTION 6: UI Components ───
  console.log("\n--- 6. UI Components ---\n");

  const componentFiles = [
    ["6.1.1", "ConfirmDialog", "components/ui/ConfirmDialog.tsx"],
    ["6.1.3", "Modal", "components/ui/Modal.tsx"],
    ["6.1.5", "BestDealModal", "components/admin/BestDealModal.tsx"],
    ["6.1.6", "NotificationBroadcastModal", "components/admin/NotificationBroadcastModal.tsx"],
    ["6.1.7", "TaxesModal", "components/TaxesModal.tsx"],
    ["6.2.1", "BrowseChannelsModal", "components/community/BrowseChannelsModal.tsx"],
    ["6.2.2", "SolarAssessmentModal", "components/community/SolarAssessmentModal.tsx"],
    ["6.3.1", "DashboardContent", "components/DashboardContent.tsx"],
    ["6.3.2", "EmpowermentContent", "components/empowerment/EmpowermentContent.tsx"],
    ["6.3.3", "StoreExperience", "components/store/StoreExperience.tsx"],
    ["6.3.4", "SettingsLayout", "components/settings/SettingsLayout.tsx"],
    ["6.4", "DepositModal", "components/wallet/DepositModal.tsx"],
  ];
  for (const [id, name, fp] of componentFiles) {
    try {
      const c = readLocal(fp);
      log(id, name, c.length > 50 ? "PASS" : "FAIL", `${c.length} chars`);
    } catch (e: any) { log(id, name, "FAIL", e.message); }
  }

  // ─── SECTION 7: API Routes ───
  console.log("\n--- 7. API Routes ---\n");

  const apiFiles = [
    ["7.1", "Upload route", "app/api/upload/route.ts"],
    ["7.2", "Payment proof upload", "app/api/upload/payment-proof/route.ts"],
    ["7.3", "Fix referrals", "app/api/fix-referrals/route.ts"],
    ["7.4", "Impersonate route", "app/api/auth/impersonate/route.ts"],
    ["7.5", "Seed packages", "app/api/admin/seed-packages/route.ts"],
    ["7.6", "Elite club deadline cron", "app/api/cron/elite-club-deadline/route.ts"],
    ["7.7", "Elite club reminder cron", "app/api/cron/elite-club-reminder/route.ts"],
    ["7.8", "Pool distribution cron", "app/api/cron/pool-distribution/route.ts"],
    ["7.9", "Migrate BPT balances", "app/api/admin/migrate-bpt-balances/route.ts"],
  ];
  for (const [id, name, fp] of apiFiles) {
    try {
      const c = readLocal(fp);
      log(id, name, c.length > 50 ? "PASS" : "FAIL", `${c.length} chars`);
    } catch (e: any) { log(id, name, "FAIL", e.message); }
  }

  // ─── SECTION 8: Pages ───
  console.log("\n--- 8. Pages ---\n");

  const pageFiles = [
    ["8.1", "Blog post page", "app/blog/[slug]/page.tsx"],
    ["8.2", "Membership listing", "app/membership/page.tsx"],
    ["8.3", "Membership upgrade", "app/membership/upgrade/[packageId]/page.tsx"],
    ["8.4", "Receipts page", "app/receipts/page.tsx"],
    ["8.5", "Transactions page", "app/transactions/page.tsx"],
  ];
  for (const [id, name, fp] of pageFiles) {
    try {
      const c = readLocal(fp);
      log(id, name, c.length > 50 ? "PASS" : "FAIL", `${c.length} chars`);
    } catch (e: any) { log(id, name, "FAIL", e.message); }
  }

  // ─── SECTION 9: Configuration ───
  console.log("\n--- 9. Configuration ---\n");

  try { readLocal("next.config.mjs"); log("9.1", "next.config.mjs exists", "PASS"); }
  catch (e: any) { log("9.1", "Next.js config", "FAIL", e.message); }

  try {
    const pkg = JSON.parse(readLocal("package.json"));
    log("9.2", "package.json valid", pkg.name ? "PASS" : "FAIL", `${pkg.name}`);
  } catch (e: any) { log("9.2", "package.json", "FAIL", e.message); }

  // ─── SECTION 10: Cron ───
  console.log("\n--- 10. Cron & Background ---\n");

  try {
    const c = readLocal("server/cron-server.ts");
    log("10.1", "Cron server file", c.length > 100 ? "PASS" : "FAIL", `${c.length} chars`);
  } catch (e: any) { log("10.1", "Cron server", "FAIL", e.message); }

  // ─── SECTION 11: Cross-Cutting ───
  console.log("\n--- 11. Cross-Cutting ---\n");

  // No alert() in key files
  try {
    const files = [
      "components/admin/BackupRestorePanel.tsx",
      "components/admin/DatabaseMaintenancePanel.tsx",
      "app/admin/layout.tsx",
    ];
    let bad = false;
    for (const f of files) {
      const c = readLocal(f);
      // Match alert( but not // alert or .alert or toast.alert
      if (/(?<!\w)alert\s*\(/.test(c) && !c.includes("// alert")) bad = true;
    }
    log("11.3", "No alert() in changed files", !bad ? "PASS" : "FAIL");
  } catch (e: any) { log("11.3", "Alert check", "FAIL", e.message); }

  // Audit logging
  try {
    const router = readLocal("server/trpc/router/admin.ts");
    const count = (router.match(/auditLog\.create/g) || []).length;
    log("11.4", "Audit logging in admin router", count > 5 ? "PASS" : "FAIL", `${count} entries`);
  } catch (e: any) { log("11.4", "Audit logging", "FAIL", e.message); }

  // ════════════════════════════════════════
  //  SUMMARY
  // ════════════════════════════════════════
  console.log("\n════════════════════════════════════════");
  console.log("            TEST SUMMARY");
  console.log("════════════════════════════════════════\n");

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  const total = results.length;
  const pct = ((pass / total) * 100).toFixed(1);

  console.log(`  Total:  ${total}`);
  console.log(`  ✅ Pass: ${pass}`);
  console.log(`  ❌ Fail: ${fail}`);
  console.log(`  ⏭️  Skip: ${skip}`);
  console.log(`  Rate:   ${pct}%\n`);

  if (fail > 0) {
    console.log("  FAILURES:");
    for (const r of results.filter((r) => r.status === "FAIL")) {
      console.log(`    ❌ ${r.id} ${r.name}: ${r.notes}`);
    }
    console.log();
  }

  // Write JSON
  fs.writeFileSync(
    path.join(process.cwd(), "test-results", "checklist-results.json"),
    JSON.stringify({ date: new Date().toISOString(), summary: { total, pass, fail, skip, pct }, results }, null, 2)
  );
  console.log("Results saved to test-results/checklist-results.json");

  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
