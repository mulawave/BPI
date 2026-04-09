import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

if (process.env.NODE_ENV === "production") {
  console.error("❌ FATAL: seedSuperAdmin must not run in production. Aborting.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  console.log("🔐 Seeding Super Admin Account...\n");

  const email = "admin@superapp.bpi";
  const password = "myngul.com1";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("⚠️  Super admin already exists!");
    console.log(`   Email: ${email}`);
    console.log(`   ID: ${existingAdmin.id}\n`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create super admin
  const admin = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name: "Super Admin",
      firstname: "Super",
      lastname: "Admin",
      username: "superadmin",
      passwordHash,
      userType: "admin",
      role: "admin",
      rank: "Admin",
      activated: true,
      verified: true,
      emailVerified: new Date(),
      wallet: 0,
      spendable: 0,
      palliative: 0,
      cashback: 0,
      studentCashback: 0,
      community: 0,
      shareholder: 0,
      shelter: 0,
      education: 0,
      car: 0,
      business: 0,
      land: 0,
      meal: 0,
      health: 0,
      defaultCurrency: 1,
      level1Count: 0,
      level2Count: 0,
      level3Count: 0,
      level4Count: 0,
      kycPending: 0,
      withdrawBan: 0,
      isVip: 0,
      isShelter: 0,
      vipPending: 0,
      shelterPending: 0,
      shelterWallet: 0,
      isShareholder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    },
  });

  console.log("✅ Super Admin created successfully!\n");
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);
  console.log("🆔 ID:", admin.id);
  console.log("\n⚠️  IMPORTANT: Change this password after first login!\n");
}

seedSuperAdmin()
  .catch((error) => {
    console.error("❌ Error seeding super admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
