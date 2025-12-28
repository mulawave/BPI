import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const email = "user@example.com";
  const password = "password123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
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

  // Create membership packages
  const packagesData = [
    {
      name: "Basic",
      price: 10000,
      vat: 750,
      cash_l1: 1000,
      cash_l2: 500,
      cash_l3: 250,
      cash_l4: 100,
      palliative_l1: 500,
      palliative_l2: 250,
      palliative_l3: 125,
      palliative_l4: 50,
      bpt_l1: 0.001,
      bpt_l2: 0.0005,
      bpt_l3: 0.00025,
      bpt_l4: 0.0001,
      isActive: true,
    },
    {
      name: "Regular Plus",
      price: 50000,
      vat: 3750,
      cash_l1: 7500,
      cash_l2: 3750,
      cash_l3: 1875,
      cash_l4: 750,
      palliative_l1: 3750,
      palliative_l2: 1875,
      palliative_l3: 937,
      palliative_l4: 375,
      bpt_l1: 0.005,
      bpt_l2: 0.0025,
      bpt_l3: 0.00125,
      bpt_l4: 0.0005,
      isActive: true,
    },
    {
      name: "Premium",
      price: 100000,
      vat: 7500,
      cash_l1: 15000,
      cash_l2: 7500,
      cash_l3: 3750,
      cash_l4: 1500,
      palliative_l1: 7500,
      palliative_l2: 3750,
      palliative_l3: 1875,
      palliative_l4: 750,
      bpt_l1: 0.01,
      bpt_l2: 0.005,
      bpt_l3: 0.0025,
      bpt_l4: 0.001,
      isActive: true,
    },
  ];

  for (const pkgData of packagesData) {
    const existingPkg = await prisma.membershipPackage.findFirst({
      where: { name: pkgData.name },
    });

    if (!existingPkg) {
      await prisma.membershipPackage.create({
        data: pkgData,
      });
      console.log(`Seed: created membership package: ${pkgData.name}`);
    } else {
      console.log(`Seed: package already exists: ${pkgData.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
