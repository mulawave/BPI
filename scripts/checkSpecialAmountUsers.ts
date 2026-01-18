import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSpecialAmountUsers() {
  console.log("🔍 Checking users with special amounts...\n");
  
  // These are the legacy IDs we found in the SQL dump with special amounts
  const specialAmountUsers = [
    { legacyId: 2450, amount: 23000 },
    { legacyId: 2399, amount: 23000 },
    { legacyId: 2626, amount: 23000 },
    { legacyId: 21, amount: 23000 },
    { legacyId: 2867, amount: 23000 },
    { legacyId: 3099, amount: 23000 },
    { legacyId: 3126, amount: 23000 },
    { legacyId: 2884, amount: 23000 },
    { legacyId: 67, amount: 20000 },
  ];
  
  const regularPackage = await prisma.membershipPackage.findFirst({
    where: { name: "Regular" }
  });
  
  if (!regularPackage) {
    console.error("❌ Regular package not found!");
    return;
  }
  
  console.log(`📦 Regular package ID: ${regularPackage.id}\n`);
  console.log("Checking users:\n");
  
  let correctCount = 0;
  let incorrectCount = 0;
  let notFoundCount = 0;
  
  for (const { legacyId, amount } of specialAmountUsers) {
    const user = await prisma.user.findFirst({
      where: { legacyId: legacyId.toString() },
      select: {
        email: true,
        legacyId: true,
        activeMembershipPackageId: true
      }
    });
    
    if (!user) {
      notFoundCount++;
      console.log(`  ❌ Legacy ID ${legacyId} (₦${amount}) - NOT FOUND IN DATABASE`);
      continue;
    }
    
    // Get package name separately
    let packageName = "None";
    if (user.activeMembershipPackageId) {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: user.activeMembershipPackageId }
      });
      packageName = pkg?.name || "Unknown";
    }
    
    const isCorrect = user.activeMembershipPackageId === regularPackage.id;
    
    if (isCorrect) {
      correctCount++;
      console.log(`  ✅ ${user.email} (legacy: ${legacyId}, ₦${amount}) → ${packageName}`);
    } else {
      incorrectCount++;
      console.log(`  ⚠️  ${user.email} (legacy: ${legacyId}, ₦${amount}) → ${packageName} (SHOULD BE Regular)`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Correctly assigned to Regular: ${correctCount}`);
  console.log(`⚠️  Incorrectly assigned: ${incorrectCount}`);
  console.log(`❌ Not found in database: ${notFoundCount}`);
  console.log(`📈 Total checked: ${specialAmountUsers.length}`);
  console.log("=".repeat(60));
}

checkSpecialAmountUsers()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
