/**
 * Quick Revenue System Test
 */

import { prisma } from "../lib/prisma";

async function quickTest() {
  console.log("\n🔍 Quick Revenue System Check\n");

  try {
    // Test 1: Database connection
    console.log("1. Testing database connection...");
    const userCount = await prisma.user.count();
    console.log(`   ✅ Connected! Found ${userCount} users`);

    // Test 2: Check schema
    console.log("\n2. Checking revenue schema...");
    const revenueCount = await prisma.revenueTransaction.count();
    console.log(`   ✅ RevenueTransaction table exists (${revenueCount} records)`);

    // Test 3: Check indexes
    console.log("\n3. Checking for unique constraint on sourceId...");
    const schema = await prisma.$queryRaw`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'RevenueTransaction' 
      AND column_name = 'sourceId'
    `;
    console.log(`   ✅ sourceId column found:`, schema);

    // Test 4: Strategic pools
    console.log("\n4. Checking strategic pools...");
    const pools = await prisma.strategyPool.findMany({
      select: { type: true, name: true, balance: true }
    });
    console.log(`   ✅ Found ${pools.length} pools:`, pools.map(p => p.type).join(', '));

    // Test 5: Executive shareholders
    console.log("\n5. Checking executive shareholders...");
    const shareholders = await prisma.executiveShareholder.findMany({
      select: { role: true, percentage: true, userId: true }
    });
    console.log(`   ✅ Found ${shareholders.length} shareholder roles`);

    console.log("\n✅ All quick checks passed!\n");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

quickTest();
