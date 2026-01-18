import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugUndefinedPackages() {
  console.log("🔍 Investigating undefined package assignments...\n");
  
  // Get all membership packages in database
  const packages = await prisma.membershipPackage.findMany();
  console.log("📦 Available packages in database:");
  packages.forEach(p => {
    console.log(`  - ID: ${p.id}`);
    console.log(`    Name: ${p.name}`);
    console.log(`    Price: ₦${p.price}`);
    console.log("");
  });
  
  // Get all unique package IDs assigned to users
  const userPackageIds = await prisma.user.groupBy({
    by: ["activeMembershipPackageId"],
    where: {
      activeMembershipPackageId: { not: null }
    },
    _count: true
  });
  
  console.log("\n📊 Package IDs assigned to users:");
  const packageMap = new Map(packages.map(p => [p.id, p.name]));
  
  for (const item of userPackageIds) {
    const pkgId = item.activeMembershipPackageId!;
    const pkgName = packageMap.get(pkgId);
    
    if (!pkgName) {
      console.log(`  ❌ ORPHANED: Package ID "${pkgId}" (${item._count} users) - DOES NOT EXIST IN DATABASE`);
      
      // Show sample users with this orphaned package ID
      const sampleUsers = await prisma.user.findMany({
        where: { activeMembershipPackageId: pkgId },
        select: { email: true, legacyId: true },
        take: 3
      });
      
      console.log(`     Sample users: ${sampleUsers.map(u => `${u.email} (legacy: ${u.legacyId})`).join(", ")}`);
    } else {
      console.log(`  ✅ ${pkgName}: ${item._count} users (ID: ${pkgId})`);
    }
  }
}

debugUndefinedPackages()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
