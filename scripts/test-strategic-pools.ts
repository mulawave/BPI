import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testStrategicPools() {
  try {
    console.log("\n=== TESTING STRATEGIC POOLS LOADING ===\n");

    // Test 1: Check if pools exist
    const pools = await prisma.strategyPool.findMany();
    console.log(`✓ Total strategic pools in database: ${pools.length}`);

    if (pools.length === 0) {
      console.log("\n⚠️  No pools found! Running seed script...\n");
      return;
    }

    // Test 2: Display all pools
    console.log(`\n✓ Strategic Pools:`);
    pools.forEach((pool) => {
      console.log(`  - ${pool.name} (${pool.type}): ₦${Number(pool.balance).toLocaleString()}`);
    });

    // Test 3: Check pools with members (like the frontend query)
    console.log(`\n✓ Testing query with Members relation:`);
    const poolsWithMembers = await prisma.strategyPool.findMany({
      include: {
        Members: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    console.log(`  Found ${poolsWithMembers.length} pools with member data:`);
    poolsWithMembers.forEach((pool) => {
      console.log(`  - ${pool.name}: ${pool.Members.length} members`);
      pool.Members.forEach((member) => {
        console.log(`    → ${member.User.name || "No name"} (${member.User.email})`);
      });
    });

    // Test 4: Check PoolMember table
    const totalMembers = await prisma.poolMember.count();
    console.log(`\n✓ Total pool members: ${totalMembers}`);

    console.log("\n✅ Strategic pools test complete!\n");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testStrategicPools();
