import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyRestoration() {
  console.log("🔍 Verifying membership restoration...\n");
  
  // Count total users with memberships
  const totalWithMemberships = await prisma.user.count({
    where: {
      activeMembershipPackageId: { not: null }
    }
  });
  
  console.log(`✅ Total users with active memberships: ${totalWithMemberships}`);
  
  // Check a few sample restored users
  const sampleUsers = await prisma.user.findMany({
    where: {
      legacyId: { in: ["1", "2", "3", "5", "7"] }
    },
    select: {
      email: true,
      legacyId: true,
      activated: true,
      activeMembershipPackageId: true,
      membershipExpiresAt: true
    }
  });
  
  // Fetch package names separately
  const packageIds = [...new Set(sampleUsers.map(u => u.activeMembershipPackageId).filter(Boolean))];
  const packages = await prisma.membershipPackage.findMany({
    where: { id: { in: packageIds as string[] } }
  });
  const packageMap = new Map(packages.map(p => [p.id, p.name]));
  
  console.log("\n📋 Sample restored users:");
  for (const user of sampleUsers) {
    console.log(`  - ${user.email}`);
    console.log(`    Legacy ID: ${user.legacyId}`);
    console.log(`    Activated: ${user.activated}`);
    console.log(`    Package: ${user.activeMembershipPackageId ? packageMap.get(user.activeMembershipPackageId) : "None"}`);
    console.log(`    Expires: ${user.membershipExpiresAt?.toISOString().split('T')[0] || "N/A"}`);
    console.log("");
  }
  
  // Check package distribution
  const packageDistribution = await prisma.user.groupBy({
    by: ["activeMembershipPackageId"],
    where: {
      activeMembershipPackageId: { not: null }
    },
    _count: true
  });
  
  console.log("📊 Package distribution:");
  for (const item of packageDistribution) {
    if (item.activeMembershipPackageId) {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: item.activeMembershipPackageId }
      });
      console.log(`  - ${pkg?.name}: ${item._count} users`);
    }
  }
}

verifyRestoration()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
