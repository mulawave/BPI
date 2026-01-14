import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

import { membershipPackagesSeedData } from "./seed-data/membershipPackages";
import { adminSettingsSeedData } from "./seed-data/adminSettings";
import {
  initialBptConversionRateSeedData,
  systemWalletSeedData,
} from "./seed-data/system";
import { youtubePlansSeedData } from "./seed-data/youtubePlans";

const prisma = new PrismaClient();

async function main() {
  const createTestUser = process.env.SEED_CREATE_TEST_USER === "true";
  if (createTestUser) {
    const email = "user@example.com";
    const password = "password123";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const passwordHash = await hash(password, 10);
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          email,
          name: "Test User",
          emailVerified: new Date(),
          passwordHash,
          role: "user",
          activated: true,
          verified: true,
        },
      });
      console.log("Seed: created test user:", user.email);
      console.log("Seed: login with email:", email, "password:", password);
    } else {
      console.log("Seed: test user already exists:", email);
    }
  }

  // Seed membership packages (system data)
  for (const pkgData of membershipPackagesSeedData) {
    await prisma.membershipPackage.upsert({
      where: { name: pkgData.name },
      update: pkgData,
      create: pkgData,
    });
    console.log(`Seed: upserted membership package: ${pkgData.name}`);
  }

  // Seed admin settings (system config)
  for (const settingData of adminSettingsSeedData) {
    await prisma.adminSettings.upsert({
      where: { settingKey: settingData.settingKey },
      update: settingData,
      create: settingData,
    });
    console.log(`Seed: ensured admin setting: ${settingData.settingKey}`);
  }

  // Seed system wallets
  for (const walletData of systemWalletSeedData) {
    await prisma.systemWallet.upsert({
      where: { name: walletData.name },
      update: {},
      create: walletData,
    });
    console.log(`Seed: ensured system wallet: ${walletData.name}`);
  }

  // Seed initial BPT conversion rate (only if none exists)
  const existingActiveRate = await prisma.bptConversionRate.findFirst({
    where: { isActive: true },
  });
  if (!existingActiveRate) {
    await prisma.bptConversionRate.create({ data: initialBptConversionRateSeedData });
    console.log("Seed: created initial active BPT conversion rate");
  } else {
    console.log("Seed: active BPT conversion rate already exists");
  }

  // Seed YouTube plans
  for (const planData of youtubePlansSeedData) {
    await prisma.youtubePlan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    });
    console.log(`Seed: ensured YouTube plan: ${planData.name}`);
  }

  // Create third-party platforms
  const platformsData = [
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "Facebook",
      description: "Connect with friends and the world around you on Facebook",
      category: "social_media",
      adminDefaultLink: "https://facebook.com/beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "Instagram",
      description: "Share photos and videos with your followers",
      category: "social_media",
      adminDefaultLink: "https://instagram.com/beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "LinkedIn",
      description: "Professional networking and career development",
      category: "professional",
      adminDefaultLink: "https://linkedin.com/company/beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "Twitter/X",
      description: "Share your thoughts in 280 characters",
      category: "social_media",
      adminDefaultLink: "https://twitter.com/beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "YouTube",
      description: "Share and discover videos",
      category: "video",
      adminDefaultLink: "https://youtube.com/@beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "TikTok",
      description: "Create and share short-form videos",
      category: "video",
      adminDefaultLink: "https://tiktok.com/@beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "Telegram",
      description: "Fast and secure messaging",
      category: "messaging",
      adminDefaultLink: "https://t.me/beepagro",
      isActive: true,
    },
    {
      id: randomUUID(),
      updatedAt: new Date(),
      name: "WhatsApp Channel",
      description: "Stay updated with our WhatsApp channel",
      category: "messaging",
      adminDefaultLink: "https://whatsapp.com/channel/beepagro",
      isActive: true,
    },
  ];

  for (const platformData of platformsData) {
    const existingPlatform = await prisma.thirdPartyPlatform.findFirst({
      where: { name: platformData.name },
    });

    if (!existingPlatform) {
      await prisma.thirdPartyPlatform.create({
        data: platformData,
      });
      console.log(`Seed: created third-party platform: ${platformData.name}`);
    } else {
      console.log(`Seed: platform already exists: ${platformData.name}`);
    }
  }

  // Create palliative options
  const palliativeOptionsData = [
    {
      id: randomUUID(),
      name: "Car Palliative",
      slug: "car",
      targetAmount: 10000000, // ₦10M
      description: "Receive support toward purchasing your dream vehicle",
      icon: "car",
      active: true,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "House/Shelter Palliative",
      slug: "house",
      targetAmount: 40000000, // ₦40M
      description: "Get assistance with housing and shelter needs",
      icon: "home",
      active: true,
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Land Palliative",
      slug: "land",
      targetAmount: 5000000, // ₦5M
      description: "Land acquisition support for your future",
      icon: "map",
      active: true,
      displayOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Business Support Palliative",
      slug: "business",
      targetAmount: 10000000, // ₦10M
      description: "Capital support to start or grow your business",
      icon: "briefcase",
      active: true,
      displayOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Education Palliative",
      slug: "education",
      targetAmount: 20000000, // ₦20M
      description: "Educational funding for you or your family",
      icon: "graduation-cap",
      active: true,
      displayOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Solar Power Palliative",
      slug: "solar",
      targetAmount: 5000000, // ₦5M
      description: "Clean energy solution for your home or business",
      icon: "sun",
      active: true,
      displayOrder: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const optionData of palliativeOptionsData) {
    await prisma.palliativeOption.upsert({
      where: { slug: optionData.slug },
      update: optionData,
      create: optionData,
    });
    console.log(`Seed: ensured palliative option: ${optionData.name}`);
  }

  // Schema scan report: show non-user models that are currently not seeded by this script.
  // (We do not auto-invent values; this is a guardrail to keep system data coverage visible.)
  try {
    const schemaPath = resolve(process.cwd(), "prisma", "schema.prisma");
    const schemaText = readFileSync(schemaPath, "utf8");
    const modelNames = Array.from(schemaText.matchAll(/^model\s+(\w+)\s*\{/gm)).map(
      (m) => m[1]
    );

    const seededModels = new Set([
      "AdminSettings",
      "MembershipPackage",
      "SystemWallet",
      "BptConversionRate",
      "YoutubePlan",
      "ThirdPartyPlatform",
      "PalliativeOption",
    ]);

    const assumedUserDataModels = new Set([
      "User",
      "Account",
      "Session",
      "VerificationToken",
      "PasswordReset",
      "Referral",
      "Transaction",
      "Notification",
      "PackageActivation",
      "RenewalHistory",
      "EmpowermentPackage",
      "EmpowermentTransaction",
      "ChannelSubscription",
      "YoutubeChannel",
      "YoutubeProvider",
      "UserEarning",
      "UserThirdPartyLink",
      "ThirdPartyRegistration",
      "CommunityPost",
      "CommunityPostReply",
      "SupportTicket",
      "TicketReply",
      "PalliativeTicket",
      "DealClaim",
      "BestDeal",
      "PromotionalMaterial",
      "MaterialDownload",
      "BPICalculation",
      "SolarAssessment",
      "TrainingProgress",
      "EPCandEPP",
      "EPCPointHistory",
      "InviteUsage",
      "Contact",
      "TokenTransaction",
      "BuyBackEvent",
      "BurnEvent",
      "StoreOrder",
      "Assessment",
      "FundingHistory",
      "WithdrawalHistory",
      "TransactionHistory",
      "CommissionWallet",
      "CommissionPalliative",
      "CommissionShelter",
      "LeadershipPoolQualification",
      "UpdateRead",
      "UserFeatureProgress",
      "PalliativeWalletActivation",
      "PalliativeMaturity",
      "PalliativePackage",
      "BpiMember",
      "ReferralTree",
      "LeadershipPool",
      "InvestorsPool",
      "CommunityStats",
      "ActiveShelter",
    ]);

    const unseededNonUserModels = modelNames.filter(
      (name) => !seededModels.has(name) && !assumedUserDataModels.has(name)
    );

    if (unseededNonUserModels.length) {
      console.log("\nSeed: schema scan (unseeded non-user models):");
      console.log(unseededNonUserModels.sort().join(", "));
    } else {
      console.log("\nSeed: schema scan OK (no unseeded non-user models detected)");
    }
  } catch (e) {
    console.log("Seed: schema scan skipped:", (e as Error).message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
