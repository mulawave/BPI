import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUser67() {
  const regularPkg = await prisma.membershipPackage.findFirst({
    where: { name: "Regular" }
  });
  
  if (!regularPkg) {
    console.error("❌ Regular package not found!");
    return;
  }
  
  const user = await prisma.user.update({
    where: { legacyId: "67" },
    data: { activeMembershipPackageId: regularPkg.id }
  });
  
  console.log(`✅ Updated ${user.email} (legacy ID: 67) from Gold Plus → Regular (₦20,000)`);
}

fixUser67()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
