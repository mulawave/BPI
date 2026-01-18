import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function removeOrphanedMemberships() {
  console.log("🔧 Removing memberships for orphaned users (no payment record)...\n");
  
  // Get current valid packages
  const packages = await prisma.membershipPackage.findMany();
  const packageMap = new Map(packages.map(p => [p.id, p]));
  
  // Find orphaned users
  const allUsers = await prisma.user.findMany({
    where: { activeMembershipPackageId: { not: null } },
    select: { id: true, email: true, legacyId: true, activeMembershipPackageId: true }
  });
  
  const orphanedUsers = allUsers.filter(u => 
    u.activeMembershipPackageId && !packageMap.has(u.activeMembershipPackageId)
  );
  
  console.log(`Found ${orphanedUsers.length} orphaned users to clean up\n`);
  
  if (orphanedUsers.length === 0) {
    console.log("✅ No orphaned users found!");
    return;
  }
  
  console.log("Removing membership assignments:\n");
  
  let removedCount = 0;
  
  for (const user of orphanedUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeMembershipPackageId: null,
        activated: false,
        membershipActivatedAt: null
      }
    });
    
    removedCount++;
    console.log(`  ✅ ${user.email} (legacy ID: ${user.legacyId}) - membership removed`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 CLEANUP SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully removed: ${removedCount} memberships`);
  console.log("=".repeat(60));
  console.log("\nThese users had is_vip=1 but no payment record in active_shelters.");
  console.log("Their accounts are now marked as not activated.");
}

removeOrphanedMemberships()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
