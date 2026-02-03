/**
 * Seed Revenue Pools and Executive Shareholders
 * Run: npx ts-node scripts/seedRevenuePools.ts
 */

import { prisma } from "../lib/prisma";

async function seedRevenuePools() {
  console.log("🌱 [SEED] Starting revenue pools initialization...\n");

  try {
    // 1. Create Strategic Pools (5 pools, 4% each)
    console.log("📊 [SEED] Creating strategic pools...");
    const poolTypes = [
      "LEADERSHIP",
      "STATE",
      "DIRECTORS",
      "TECHNOLOGY",
      "INVESTORS",
    ] as const;

    for (const poolType of poolTypes) {
      const pool = await prisma.strategyPool.upsert({
        where: { type: poolType },
        update: {},
        create: {
          type: poolType,
          balance: 0,
        },
      });
      console.log(`  ✅ ${poolType} Pool created (ID: ${pool.id})`);
    }

    // 2. Create Executive Shareholder Placeholders (7 roles)
    console.log("\n👥 [SEED] Creating executive shareholder placeholders...");
    const executiveRoles = [
      { role: "CEO", percentage: 30 },
      { role: "CTO", percentage: 20 },
      { role: "HEAD_OF_TRAVEL", percentage: 20 },
      { role: "CMO", percentage: 10 },
      { role: "OLIVER", percentage: 5 },
      { role: "MORRISON", percentage: 5 },
      { role: "ANNIE", percentage: 10 },
    ] as const;

    for (const { role, percentage } of executiveRoles) {
      const shareholder = await prisma.executiveShareholder.upsert({
        where: { role },
        update: { percentage },
        create: {
          role,
          percentage,
          userId: null, // Will be assigned by admin via UI
        },
      });
      console.log(
        `  ✅ ${role} placeholder created (${percentage}%) - ID: ${shareholder.id}`
      );
    }

    // 3. Initialize Company Reserve
    console.log("\n💰 [SEED] Initializing company reserve...");
    const reserve = await prisma.companyReserve.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        balance: 0,
      },
    });
    console.log(`  ✅ Company Reserve created (ID: ${reserve.id})`);

    // 4. Verify percentages add up to 100%
    console.log("\n🔍 [SEED] Verifying executive pool percentages...");
    const totalPercentage = executiveRoles.reduce(
      (sum, { percentage }) => sum + percentage,
      0
    );
    if (totalPercentage !== 100) {
      console.warn(
        `  ⚠️  WARNING: Executive percentages total ${totalPercentage}% (should be 100%)`
      );
    } else {
      console.log(`  ✅ Executive percentages total: 100%`);
    }

    // 5. Summary
    console.log("\n📋 [SEED] Summary:");
    console.log("  Strategic Pools: 5");
    console.log("  Executive Roles: 7");
    console.log("  Company Reserve: Initialized");
    console.log("\n✅ [SEED] Revenue pools seeded successfully!");
    console.log(
      "\n💡 [NEXT STEPS]: Use the admin UI at /admin/revenue-pools to assign users to roles"
    );
  } catch (error) {
    console.error("\n❌ [SEED] Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedRevenuePools()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
