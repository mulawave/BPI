import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    const totalUsers = await prisma.user.count();
    const activatedUsers = await prisma.user.count({ where: { activated: true } });
    const usersWithMembership = await prisma.user.count({ 
      where: { activeMembershipPackageId: { not: null } } 
    });
    const usersWithActiveMembershipExpired = await prisma.user.count({
      where: {
        activated: true,
        activeMembershipPackageId: { not: null },
        membershipExpiresAt: { lt: new Date() }
      }
    });

    console.log("\n=== USER STATUS REPORT ===");
    console.log(`Total users: ${totalUsers}`);
    console.log(`Activated users: ${activatedUsers}`);
    console.log(`Users with membership package assigned: ${usersWithMembership}`);
    console.log(`Users with expired membership: ${usersWithActiveMembershipExpired}`);
    
    // Sample a few activated users with memberships
    const sampleUsers = await prisma.user.findMany({
      where: { activated: true },
      select: {
        id: true,
        email: true,
        name: true,
        activated: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
      },
      take: 5,
    });

    console.log("\n=== SAMPLE ACTIVATED USERS ===");
    sampleUsers.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`  Activated: ${user.activated}`);
      console.log(`  Membership ID: ${user.activeMembershipPackageId || 'NONE'}`);
      console.log(`  Activated At: ${user.membershipActivatedAt || 'N/A'}`);
      console.log(`  Expires At: ${user.membershipExpiresAt || 'N/A'}`);
    });

  } catch (error) {
    console.error("Error checking user status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();
