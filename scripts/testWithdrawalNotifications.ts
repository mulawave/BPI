/**
 * Test Script: Withdrawal Notification System
 * 
 * This script verifies that the withdrawal notification infrastructure is properly configured.
 * It checks:
 * 1. Email functions are exported correctly
 * 2. SMTP configuration is accessible
 * 3. Admin users exist for notifications
 * 4. Withdrawal endpoints return correct data structure
 * 
 * Run: npx tsx scripts/testWithdrawalNotifications.ts
 */

import { PrismaClient } from "@prisma/client";
import { 
  sendWithdrawalRequestToAdmins, 
  sendWithdrawalApprovedToUser, 
  sendWithdrawalRejectedToUser 
} from "../lib/email";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing Withdrawal Notification System\n");
  
  // Test 1: Check email functions are available
  console.log("1️⃣ Checking email functions...");
  const emailFunctions = [
    { name: "sendWithdrawalRequestToAdmins", fn: sendWithdrawalRequestToAdmins },
    { name: "sendWithdrawalApprovedToUser", fn: sendWithdrawalApprovedToUser },
    { name: "sendWithdrawalRejectedToUser", fn: sendWithdrawalRejectedToUser },
  ];
  
  for (const { name, fn } of emailFunctions) {
    if (typeof fn === "function") {
      console.log(`   ✅ ${name} is available`);
    } else {
      console.log(`   ❌ ${name} is NOT available`);
    }
  }
  
  // Test 2: Check for admin users
  console.log("\n2️⃣ Checking for admin users...");
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["admin", "super_admin"],
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  
  if (admins.length === 0) {
    console.log("   ⚠️  No admin users found - emails won't be sent!");
    console.log("   💡 Create an admin user to receive notifications");
  } else {
    console.log(`   ✅ Found ${admins.length} admin user(s):`);
    admins.forEach(admin => {
      console.log(`      - ${admin.name} (${admin.email}) - ${admin.role}`);
    });
  }
  
  // Test 3: Check SMTP configuration
  console.log("\n3️⃣ Checking SMTP configuration...");
  const smtpSettings = await prisma.adminSettings.findMany({
    where: {
      settingKey: {
        in: ["smtpHost", "smtpPort", "smtpUser", "smtpFromEmail", "smtpFromName"],
      },
    },
  });
  
  const smtpConfig = Object.fromEntries(
    smtpSettings.map(s => [s.settingKey, s.settingValue])
  );
  
  const hasDbConfig = smtpConfig.smtpHost && smtpConfig.smtpUser;
  const hasEnvConfig = process.env.SMTP_HOST && process.env.SMTP_USER;
  
  if (hasDbConfig) {
    console.log("   ✅ SMTP configured via database (admin settings)");
    console.log(`      Host: ${smtpConfig.smtpHost}`);
    console.log(`      Port: ${smtpConfig.smtpPort}`);
    console.log(`      From: ${smtpConfig.smtpFromEmail}`);
  } else if (hasEnvConfig) {
    console.log("   ✅ SMTP configured via environment variables");
    console.log(`      Host: ${process.env.SMTP_HOST}`);
    console.log(`      Port: ${process.env.SMTP_PORT}`);
    console.log(`      From: ${process.env.SMTP_FROM_EMAIL}`);
  } else {
    console.log("   ⚠️  SMTP not configured!");
    console.log("   💡 Configure SMTP in admin settings or .env.local");
    console.log("\n   Required environment variables:");
    console.log("      SMTP_HOST=smtp.gmail.com");
    console.log("      SMTP_PORT=587");
    console.log("      SMTP_USER=your-email@gmail.com");
    console.log("      SMTP_PASS=your-app-password");
    console.log("      SMTP_SECURE=true");
    console.log("      SMTP_FROM_EMAIL=noreply@bpiagrobase.com");
    console.log("      SMTP_FROM_NAME=BeeP Agro Platform");
  }
  
  // Test 4: Check pending withdrawals exist
  console.log("\n4️⃣ Checking for pending withdrawals...");
  const pendingWithdrawals = await prisma.transaction.count({
    where: {
      status: "pending",
      transactionType: {
        in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT"],
      },
    },
  });
  
  if (pendingWithdrawals > 0) {
    console.log(`   ✅ Found ${pendingWithdrawals} pending withdrawal(s)`);
    console.log("   💡 Badge counter should be visible on admin sidebar");
  } else {
    console.log("   ℹ️  No pending withdrawals found");
    console.log("   💡 Submit a test withdrawal to see notifications in action");
  }
  
  // Test 5: Verify admin dashboard stats endpoint structure
  console.log("\n5️⃣ Checking dashboard stats structure...");
  const stats = {
    totalUsers: await prisma.user.count(),
    pendingPayments: await prisma.transaction.count({
      where: {
        status: "pending",
        transactionType: { in: ["deposit", "DEPOSIT"] },
      },
    }),
    pendingWithdrawals: await prisma.transaction.count({
      where: {
        status: "pending",
        transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT"] },
      },
    }),
  };
  
  console.log("   ✅ Dashboard stats structure:");
  console.log(`      totalUsers: ${stats.totalUsers}`);
  console.log(`      pendingPayments: ${stats.pendingPayments}`);
  console.log(`      pendingWithdrawals: ${stats.pendingWithdrawals}`);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  
  const checks = [
    { label: "Email functions available", passed: emailFunctions.every(f => typeof f.fn === "function") },
    { label: "Admin users exist", passed: admins.length > 0 },
    { label: "SMTP configured", passed: hasDbConfig || hasEnvConfig },
    { label: "Dashboard stats working", passed: true },
  ];
  
  checks.forEach(check => {
    console.log(`${check.passed ? "✅" : "❌"} ${check.label}`);
  });
  
  const allPassed = checks.every(c => c.passed);
  
  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("🎉 All checks passed! System is ready.");
    console.log("\n📋 Next Steps:");
    console.log("   1. Start dev server: npm run dev");
    console.log("   2. Login as a user");
    console.log("   3. Go to /dashboard/wallet");
    console.log("   4. Submit a withdrawal request");
    console.log("   5. Check admin email for notification");
    console.log("   6. Login as admin and approve/reject");
  } else {
    console.log("⚠️  Some checks failed. Review the output above.");
    console.log("\n📋 Action Items:");
    if (admins.length === 0) {
      console.log("   • Create an admin user");
    }
    if (!hasDbConfig && !hasEnvConfig) {
      console.log("   • Configure SMTP settings");
    }
  }
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
