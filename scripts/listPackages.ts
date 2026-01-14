import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listPackages() {
  const packages = await prisma.membershipPackage.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      vat: true,
    },
    orderBy: { price: 'asc' },
  });

  console.log("\n📦 Membership Packages (Lowest to Highest):\n");
  console.log("=".repeat(60));
  
  packages.forEach((pkg, index) => {
    const total = pkg.price + pkg.vat;
    console.log(`${index + 1}. ${pkg.name}`);
    console.log(`   Price: ₦${pkg.price.toLocaleString()}`);
    console.log(`   VAT: ₦${pkg.vat.toLocaleString()}`);
    console.log(`   Total: ₦${total.toLocaleString()}`);
    console.log(`   ID: ${pkg.id}`);
    console.log("   " + "-".repeat(55));
  });

  console.log("\n✅ Total Packages:", packages.length);
  await prisma.$disconnect();
}

listPackages();
