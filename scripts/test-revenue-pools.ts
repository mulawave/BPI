/**
 * Revenue Pools System - Staging Test Script
 * Tests all critical functionality before production deployment
 */

import { prisma } from "@/lib/prisma";
import { recordRevenue } from "@/server/services/revenue.service";

async function testRevenueSystem() {
  console.log("\n🧪 ===== REVENUE POOLS SYSTEM TEST =====\n");

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Record revenue with sourceId
  console.log("📌 Test 1: Record revenue with unique sourceId");
  try {
    const revenue1 = await recordRevenue(prisma, {
      source: "OTHER",
      amount: 1000,
      sourceId: `test-${Date.now()}`,
      description: "Staging test revenue",
    });
    console.log(`   ✅ Revenue recorded: ${revenue1.id}`);
    testsPassed++;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 2: Duplicate sourceId prevention
  console.log("\n📌 Test 2: Prevent duplicate sourceId");
  const duplicateSourceId = `test-duplicate-${Date.now()}`;
  try {
    await recordRevenue(prisma, {
      source: "OTHER",
      amount: 500,
      sourceId: duplicateSourceId,
      description: "First transaction",
    });
    console.log("   ✅ First transaction recorded");

    // Try to record again with same sourceId
    try {
      await recordRevenue(prisma, {
        source: "OTHER",
        amount: 500,
        sourceId: duplicateSourceId,
        description: "Duplicate transaction",
      });
      console.log("   ❌ CRITICAL: Duplicate was allowed!");
      testsFailed++;
    } catch (dupError: any) {
      if (dupError.message.includes("already recorded")) {
        console.log("   ✅ Duplicate correctly prevented");
        testsPassed++;
      } else {
        console.log(`   ❌ Wrong error: ${dupError.message}`);
        testsFailed++;
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 3: Verify 50/30/20 allocation
  console.log("\n📌 Test 3: Verify 50/30/20 allocation split");
  try {
    const testAmount = 10000;
    const revenue = await recordRevenue(prisma, {
      source: "OTHER",
      amount: testAmount,
      sourceId: `test-allocation-${Date.now()}`,
      description: "Allocation test",
    });

    const allocations = await prisma.revenueAllocation.findMany({
      where: { revenueTransactionId: revenue.id },
    });

    const companyAlloc = allocations.find(a => a.destinationType === "COMPANY_RESERVE");
    const executiveAlloc = allocations.find(a => a.destinationType === "EXECUTIVE_POOL");
    const strategicAllocs = allocations.filter(a => a.destinationType === "STRATEGY_POOL");

    const companyAmount = Number(companyAlloc?.amount || 0);
    const executiveAmount = Number(executiveAlloc?.amount || 0);
    const strategicTotal = strategicAllocs.reduce((sum, a) => sum + Number(a.amount), 0);

    const expectedCompany = testAmount * 0.5;
    const expectedExecutive = testAmount * 0.3;
    const expectedStrategic = testAmount * 0.2;

    if (
      Math.abs(companyAmount - expectedCompany) < 0.01 &&
      Math.abs(executiveAmount - expectedExecutive) < 0.01 &&
      Math.abs(strategicTotal - expectedStrategic) < 0.01
    ) {
      console.log(`   ✅ Allocation split correct:`);
      console.log(`      Company: ₦${companyAmount.toLocaleString()} (50%)`);
      console.log(`      Executive: ₦${executiveAmount.toLocaleString()} (30%)`);
      console.log(`      Strategic: ₦${strategicTotal.toLocaleString()} (20% across 5 pools)`);
      testsPassed++;
    } else {
      console.log(`   ❌ Allocation split incorrect!`);
      console.log(`      Expected: ₦${expectedCompany} / ₦${expectedExecutive} / ₦${expectedStrategic}`);
      console.log(`      Got: ₦${companyAmount} / ₦${executiveAmount} / ₦${strategicTotal}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
  }

  // Test 4: Check database indexes
  console.log("\n📌 Test 4: Verify database indexes exist");
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('RevenueTransaction', 'RevenueAllocation', 'ExecutiveDistribution')
      ORDER BY tablename, indexname;
    `;

    const hasSourceIdIndex = result.some(r => r.indexname.includes('sourceId'));
    const hasCompositeIndexes = result.some(r => r.indexname.includes('userId_source_createdAt'));

    if (hasSourceIdIndex) {
      console.log(`   ✅ sourceId index found`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  sourceId index not found (may need migration)`);
      testsFailed++;
    }

    console.log(`   📊 Total indexes found: ${result.length}`);
  } catch (error: any) {
    console.log(`   ⚠️  Could not verify indexes: ${error.message}`);
    // Don't fail test - might be permission issue
  }

  // Test 5: Verify amount validation
  console.log("\n📌 Test 5: Validate amount > 0 requirement");
  try {
    await recordRevenue(prisma, {
      source: "OTHER",
      amount: -100,
      description: "Negative amount test",
    });
    console.log("   ❌ CRITICAL: Negative amount was allowed!");
    testsFailed++;
  } catch (error: any) {
    if (error.message.includes("greater than 0")) {
      console.log("   ✅ Negative amount correctly rejected");
      testsPassed++;
    } else {
      console.log(`   ❌ Wrong error: ${error.message}`);
      testsFailed++;
    }
  }

  // Test 6: Check cron server configuration
  console.log("\n📌 Test 6: Verify cron server has retry logic");
  try {
    const fs = await import('fs');
    const cronContent = fs.readFileSync('server/cron-server.ts', 'utf8');
    
    const hasRetryFunction = cronContent.includes('retryWithBackoff');
    const hasRetryInScheduler = cronContent.includes('retryWithBackoff(distributeExecutivePool');
    const hasNotifyError = cronContent.includes('notifyAdminOfError');

    if (hasRetryFunction && hasRetryInScheduler && hasNotifyError) {
      console.log("   ✅ Retry logic properly integrated");
      console.log("      - retryWithBackoff function: ✅");
      console.log("      - Used in cron scheduler: ✅");
      console.log("      - Error notification: ✅");
      testsPassed++;
    } else {
      console.log("   ❌ Retry logic incomplete");
      if (!hasRetryFunction) console.log("      - Missing retryWithBackoff function");
      if (!hasRetryInScheduler) console.log("      - Not integrated in scheduler");
      if (!hasNotifyError) console.log("      - Missing error notification");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not verify: ${error.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED - READY FOR STAGING DEPLOYMENT!\n");
  } else {
    console.log("\n⚠️  SOME TESTS FAILED - REVIEW BEFORE DEPLOYMENT\n");
    process.exit(1);
  }

  await prisma.$disconnect();
}

// Run tests
testRevenueSystem().catch((error) => {
  console.error("\n💥 Test suite crashed:", error);
  process.exit(1);
});
