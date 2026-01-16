import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  console.log("🔍 Checking Migration Status\n");
  console.log("=".repeat(60));

  try {
    // Total users
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total Users: ${totalUsers}`);

    // Users with legacy IDs (migrated from SQL)
    const migratedUsers = await prisma.user.count({
      where: { legacyId: { not: null } },
    });
    console.log(`📦 Migrated Users (with legacyId): ${migratedUsers}`);

    // New registrations (no legacy ID)
    const newUsers = await prisma.user.count({
      where: { legacyId: null },
    });
    console.log(`✨ New Users (post-migration): ${newUsers}`);

    console.log("\n" + "-".repeat(60));

    // User type breakdown
    const userTypes = await prisma.user.groupBy({
      by: ["userType"],
      _count: true,
    });
    console.log("\n👥 User Types:");
    userTypes.forEach((type) => {
      console.log(`  - ${type.userType}: ${type._count}`);
    });

    // Rank distribution
    const ranks = await prisma.user.groupBy({
      by: ["rank"],
      _count: true,
    });
    console.log("\n🏆 Rank Distribution:");
    ranks.forEach((rank) => {
      console.log(`  - ${rank.rank}: ${rank._count}`);
    });

    // Activation status
    const activated = await prisma.user.count({
      where: { activated: true },
    });
    const notActivated = await prisma.user.count({
      where: { activated: false },
    });
    console.log("\n✅ Activation Status:");
    console.log(`  - Activated: ${activated}`);
    console.log(`  - Not Activated: ${notActivated}`);

    // Email verification
    const verified = await prisma.user.count({
      where: { verified: true },
    });
    const notVerified = await prisma.user.count({
      where: { verified: false },
    });
    console.log("\n📧 Email Verification:");
    console.log(`  - Verified: ${verified}`);
    console.log(`  - Not Verified: ${notVerified}`);

    // VIP and Shelter members
    const vipMembers = await prisma.user.count({
      where: { isVip: { gt: 0 } },
    });
    const shelterMembers = await prisma.user.count({
      where: { isShelter: { gt: 0 } },
    });
    const shareholders = await prisma.user.count({
      where: { isShareholder: { gt: 0 } },
    });
    console.log("\n⭐ Special Memberships:");
    console.log(`  - VIP Members: ${vipMembers}`);
    console.log(`  - Shelter Members: ${shelterMembers}`);
    console.log(`  - Shareholders: ${shareholders}`);

    // Wallet balances summary
    const walletStats = await prisma.user.aggregate({
      _sum: {
        wallet: true,
        spendable: true,
        palliative: true,
        community: true,
        shelter: true,
        education: true,
      },
      _avg: {
        wallet: true,
      },
    });

    console.log("\n💰 Wallet Balances (Total):");
    console.log(`  - Main Wallet: ₦${walletStats._sum.wallet?.toFixed(2) || 0}`);
    console.log(`  - Spendable: ₦${walletStats._sum.spendable?.toFixed(2) || 0}`);
    console.log(`  - Palliative: ₦${walletStats._sum.palliative?.toFixed(2) || 0}`);
    console.log(`  - Community: ₦${walletStats._sum.community?.toFixed(2) || 0}`);
    console.log(`  - Shelter: ₦${walletStats._sum.shelter?.toFixed(2) || 0}`);
    console.log(`  - Education: ₦${walletStats._sum.education?.toFixed(2) || 0}`);
    console.log(`\n  Average Wallet Balance: ₦${walletStats._avg.wallet?.toFixed(2) || 0}`);

    // Recent registrations
    const recentUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstname: true,
        lastname: true,
        createdAt: true,
        legacyId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log("\n🆕 Recent Users:");
    recentUsers.forEach((user, idx) => {
      const source = user.legacyId ? "(migrated)" : "(new)";
      console.log(`  ${idx + 1}. ${user.firstname} ${user.lastname} - ${user.email} ${source}`);
      console.log(`     Joined: ${user.createdAt.toLocaleDateString()}`);
    });

    // Check for potential issues
    console.log("\n" + "=".repeat(60));
    console.log("⚠️  POTENTIAL ISSUES CHECK");
    console.log("=".repeat(60));

    const noEmail = await prisma.user.count({
      where: { email: null },
    });
    if (noEmail > 0) {
      console.log(`❌ Users without email: ${noEmail}`);
    }

    const noUsername = await prisma.user.count({
      where: { username: null },
    });
    if (noUsername > 0) {
      console.log(`⚠️  Users without username: ${noUsername}`);
    }

    const noPasswordHash = await prisma.user.count({
      where: { passwordHash: null },
    });
    if (noPasswordHash > 0) {
      console.log(`❌ Users without password hash: ${noPasswordHash}`);
    }

    if (noEmail === 0 && noUsername === 0 && noPasswordHash === 0) {
      console.log("✅ No critical issues found!");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✨ Status check complete!");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("❌ Error checking migration status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
