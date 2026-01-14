import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function exportDatabaseToSeed() {
  console.log("🔍 Exporting current database state...\n");

  try {
    // Get counts for all tables
    const counts = {
      users: await prisma.user.count(),
      membershipPackages: await prisma.membershipPackage.count(),
      adminSettings: await prisma.adminSettings.count(),
      youtubePlans: await prisma.youtubePlan.count(),
      referrals: await prisma.referral.count(),
      notifications: await prisma.notification.count(),
      transactions: await prisma.transaction.count(),
      wallets: await prisma.systemWallet.count(),
      bptConversionRates: await prisma.bptConversionRate.count(),
      thirdPartyPlatforms: await prisma.thirdPartyPlatform.count(),
      palliativeOptions: await prisma.palliativeOption.count(),
      trainingCourses: await prisma.trainingCourse.count(),
      communityFeatures: await prisma.communityFeature.count(),
    };

    console.log("📊 Database Record Counts:");
    console.table(counts);

    // Export System Data (non-user data)
    console.log("\n📦 Exporting system configuration data...");

    // 1. Membership Packages
    const membershipPackages = await prisma.membershipPackage.findMany({
      orderBy: { price: "asc" },
    });

    // 2. Admin Settings
    const adminSettings = await prisma.adminSettings.findMany({
      orderBy: { settingKey: "asc" },
    });

    // 3. System Wallets
    const systemWallets = await prisma.systemWallet.findMany({
      orderBy: { name: "asc" },
    });

    // 4. BPT Conversion Rates
    const bptConversionRates = await prisma.bptConversionRate.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 5. YouTube Plans
    const youtubePlans = await prisma.youtubePlan.findMany({
      orderBy: { amount: "asc" },
    });

    // 6. Third Party Platforms
    const thirdPartyPlatforms = await prisma.thirdPartyPlatform.findMany({
      orderBy: { displayOrder: "asc" },
    });

    // 7. Palliative Options
    const palliativeOptions = await prisma.palliativeOption.findMany({
      orderBy: { displayOrder: "asc" },
    });

    // 8. Community Features
    const communityFeatures = await prisma.communityFeature.findMany({
      orderBy: { displayOrder: "asc" },
    });

    // 9. Leadership Pools
    const leadershipPools = await prisma.leadershipPool.findMany();

    // 10. Investors Pools
    const investorsPools = await prisma.investorsPool.findMany();

    // Generate TypeScript seed files
    const systemDataExport = `// Generated seed data from database export
// Generated on: ${new Date().toISOString()}
// Total records: ${Object.values(counts).reduce((a, b) => a + b, 0)}

import type { Prisma } from "@prisma/client";

export const membershipPackagesBackup: Prisma.MembershipPackageCreateInput[] = ${JSON.stringify(
      membershipPackages.map((pkg) => ({
        ...pkg,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const adminSettingsBackup: Prisma.AdminSettingsCreateInput[] = ${JSON.stringify(
      adminSettings.map((setting) => ({
        ...setting,
      })),
      null,
      2
    )};

export const systemWalletsBackup: Prisma.SystemWalletCreateInput[] = ${JSON.stringify(
      systemWallets.map((wallet) => ({
        ...wallet,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const bptConversionRatesBackup: Prisma.BptConversionRateCreateInput[] = ${JSON.stringify(
      bptConversionRates.map((rate) => ({
        ...rate,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const youtubePlansBackup: Prisma.YoutubePlanCreateInput[] = ${JSON.stringify(
      youtubePlans.map((plan) => ({
        ...plan,
        amount: plan.amount.toString(),
        vat: plan.vat.toString(),
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const thirdPartyPlatformsBackup: Prisma.ThirdPartyPlatformCreateInput[] = ${JSON.stringify(
      thirdPartyPlatforms.map((platform) => ({
        ...platform,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const palliativeOptionsBackup: Prisma.PalliativeOptionCreateInput[] = ${JSON.stringify(
      palliativeOptions.map((option) => ({
        ...option,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const communityFeaturesBackup: Prisma.CommunityFeatureCreateInput[] = ${JSON.stringify(
      communityFeatures.map((feature) => ({
        ...feature,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const leadershipPoolsBackup: Prisma.LeadershipPoolCreateInput[] = ${JSON.stringify(
      leadershipPools.map((pool) => ({
        ...pool,
        updatedAt: undefined,
      })),
      null,
      2
    )};

export const investorsPoolsBackup: Prisma.InvestorsPoolCreateInput[] = ${JSON.stringify(
      investorsPools,
      null,
      2
    )};
`;

    // Write system data backup
    const systemBackupPath = resolve(
      __dirname,
      "../prisma/seed-data/systemDataBackup.ts"
    );
    writeFileSync(systemBackupPath, systemDataExport);
    console.log(`✅ System data exported to: ${systemBackupPath}`);

    // Export User Data Summary (for reference, not for seeding sensitive data)
    const usersSummary = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activated: true,
        verified: true,
        createdAt: true,
        activeMembershipPackageId: true,
        referredBy: true,
        wallet: true,
        bpiTokenWallet: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const userSummaryReport = `# Database User Summary
# Generated on: ${new Date().toISOString()}
# Total Users: ${counts.users}

## User Statistics:
- Activated Users: ${usersSummary.filter((u) => u.activated).length}
- Verified Users: ${usersSummary.filter((u) => u.verified).length}
- Admin Users: ${usersSummary.filter((u) => u.role === "admin").length}
- Users with Membership: ${
      usersSummary.filter((u) => u.activeMembershipPackageId).length
    }
- Users with Referrer: ${usersSummary.filter((u) => u.referredBy).length}

## Users:
${usersSummary
  .map(
    (u, i) =>
      `${i + 1}. ${u.email || u.name || u.id} (${u.role}) - Created: ${
        u.createdAt
      }`
  )
  .join("\n")}

## Database Statistics:
${Object.entries(counts)
  .map(([table, count]) => `- ${table}: ${count}`)
  .join("\n")}
`;

    const userSummaryPath = resolve(
      __dirname,
      "../prisma/seed-data/userSummary.md"
    );
    writeFileSync(userSummaryPath, userSummaryReport);
    console.log(`✅ User summary exported to: ${userSummaryPath}`);

    // Create seeder script
    const seederScript = `import { PrismaClient } from "@prisma/client";
import {
  membershipPackagesBackup,
  adminSettingsBackup,
  systemWalletsBackup,
  bptConversionRatesBackup,
  youtubePlansBackup,
  thirdPartyPlatformsBackup,
  palliativeOptionsBackup,
  communityFeaturesBackup,
  leadershipPoolsBackup,
  investorsPoolsBackup,
} from "./seed-data/systemDataBackup";

const prisma = new PrismaClient();

async function seedFromBackup() {
  console.log("🌱 Restoring database from backup...");

  try {
    // 1. Seed Membership Packages
    console.log("\\n📦 Seeding Membership Packages...");
    for (const pkg of membershipPackagesBackup) {
      await prisma.membershipPackage.upsert({
        where: { name: pkg.name },
        update: pkg,
        create: pkg,
      });
      console.log(\`  ✅ \${pkg.name}\`);
    }

    // 2. Seed Admin Settings
    console.log("\\n⚙️  Seeding Admin Settings...");
    for (const setting of adminSettingsBackup) {
      await prisma.adminSettings.upsert({
        where: { settingKey: setting.settingKey },
        update: setting,
        create: setting,
      });
      console.log(\`  ✅ \${setting.settingKey}\`);
    }

    // 3. Seed System Wallets
    console.log("\\n💰 Seeding System Wallets...");
    for (const wallet of systemWalletsBackup) {
      await prisma.systemWallet.upsert({
        where: { name: wallet.name },
        update: {},
        create: wallet,
      });
      console.log(\`  ✅ \${wallet.name}\`);
    }

    // 4. Seed BPT Conversion Rates
    console.log("\\n💱 Seeding BPT Conversion Rates...");
    for (const rate of bptConversionRatesBackup) {
      const existing = await prisma.bptConversionRate.findFirst({
        where: { conversionRate: rate.conversionRate },
      });
      if (!existing) {
        await prisma.bptConversionRate.create({ data: rate });
        console.log(\`  ✅ Rate: \${rate.conversionRate}\`);
      }
    }

    // 5. Seed YouTube Plans
    console.log("\\n📺 Seeding YouTube Plans...");
    for (const plan of youtubePlansBackup) {
      await prisma.youtubePlan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan,
      });
      console.log(\`  ✅ \${plan.name}\`);
    }

    // 6. Seed Third Party Platforms
    console.log("\\n🔗 Seeding Third Party Platforms...");
    for (const platform of thirdPartyPlatformsBackup) {
      await prisma.thirdPartyPlatform.upsert({
        where: { name: platform.name },
        update: platform,
        create: platform,
      });
      console.log(\`  ✅ \${platform.name}\`);
    }

    // 7. Seed Palliative Options
    console.log("\\n🏥 Seeding Palliative Options...");
    for (const option of palliativeOptionsBackup) {
      await prisma.palliativeOption.upsert({
        where: { slug: option.slug },
        update: option,
        create: option,
      });
      console.log(\`  ✅ \${option.name}\`);
    }

    // 8. Seed Community Features
    console.log("\\n👥 Seeding Community Features...");
    for (const feature of communityFeaturesBackup) {
      await prisma.communityFeature.upsert({
        where: { slug: feature.slug },
        update: feature,
        create: feature,
      });
      console.log(\`  ✅ \${feature.name}\`);
    }

    // 9. Seed Leadership Pools
    console.log("\\n🏆 Seeding Leadership Pools...");
    for (const pool of leadershipPoolsBackup) {
      await prisma.leadershipPool.upsert({
        where: { source: pool.source },
        update: pool,
        create: pool,
      });
      console.log(\`  ✅ \${pool.source}\`);
    }

    // 10. Seed Investors Pools
    console.log("\\n💼 Seeding Investors Pools...");
    for (const pool of investorsPoolsBackup) {
      await prisma.investorsPool.upsert({
        where: { source: pool.source },
        update: pool,
        create: pool,
      });
      console.log(\`  ✅ \${pool.source}\`);
    }

    console.log("\\n✅ Database restore complete!");
  } catch (error) {
    console.error("❌ Error during restore:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedFromBackup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
`;

    const seederPath = resolve(__dirname, "../prisma/seedFromBackup.ts");
    writeFileSync(seederPath, seederScript);
    console.log(`✅ Restore script created: ${seederPath}`);

    console.log("\n✅ Export complete!");
    console.log("\n📝 Summary:");
    console.log(`  - System data backup: prisma/seed-data/systemDataBackup.ts`);
    console.log(`  - User summary: prisma/seed-data/userSummary.md`);
    console.log(`  - Restore script: prisma/seedFromBackup.ts`);
    console.log("\n🔄 To restore from backup, run:");
    console.log("  npx ts-node prisma/seedFromBackup.ts");
  } catch (error) {
    console.error("❌ Export failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabaseToSeed();
