import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixOrphanedPackages() {
  console.log("🔧 Fixing orphaned package assignments...\n");
  
  // Get current packages
  const packages = await prisma.membershipPackage.findMany();
  const packageMap = new Map(packages.map(p => [p.id, p]));
  
  console.log("📦 Available packages:");
  packages.forEach(p => console.log(`  - ${p.name} (₦${p.price}): ${p.id}`));
  console.log("");
  
  // Find all users with orphaned package IDs
  const allUsers = await prisma.user.findMany({
    where: {
      activeMembershipPackageId: { not: null }
    },
    select: {
      id: true,
      email: true,
      legacyId: true,
      activeMembershipPackageId: true
    }
  });
  
  const orphanedUsers = allUsers.filter(u => 
    u.activeMembershipPackageId && !packageMap.has(u.activeMembershipPackageId)
  );
  
  console.log(`Found ${orphanedUsers.length} users with orphaned package IDs\n`);
  
  if (orphanedUsers.length === 0) {
    console.log("✅ No orphaned users found!");
    return;
  }
  
  // Get the correct package IDs
  const regularPkg = packages.find(p => p.name === "Regular");
  const regularPlusPkg = packages.find(p => p.name === "Regular Plus");
  const goldPlusPkg = packages.find(p => p.name === "Gold Plus");
  const platinumPlusPkg = packages.find(p => p.name === "Platinum Plus");
  
  if (!regularPkg || !regularPlusPkg || !goldPlusPkg || !platinumPlusPkg) {
    console.error("❌ Required packages not found in database!");
    return;
  }
  
  console.log("🔄 Reassigning orphaned users to correct packages...\n");
  
  // We need to re-check these users against their SQL dump amounts
  // For now, let's check what the orphaned package IDs were supposed to be
  
  const orphanedPackageIds = [...new Set(orphanedUsers.map(u => u.activeMembershipPackageId!))];
  
  for (const orphanedId of orphanedPackageIds) {
    const usersWithThisId = orphanedUsers.filter(u => u.activeMembershipPackageId === orphanedId);
    console.log(`\n❌ Orphaned Package ID: ${orphanedId}`);
    console.log(`   Affects ${usersWithThisId.length} users`);
    console.log(`   Sample users: ${usersWithThisId.slice(0, 3).map(u => `${u.email} (legacy: ${u.legacyId})`).join(", ")}`);
    
    // These users need to be reassigned based on their original payment amounts
    // Since we don't have that info here, we'll need to re-parse from SQL dump
  }
  
  console.log("\n⚠️  These users need to be checked against their original payment amounts in the SQL dump.");
  console.log("💡 Recommendation: Re-run the restoration script to fix these assignments.");
}

fixOrphanedPackages()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
