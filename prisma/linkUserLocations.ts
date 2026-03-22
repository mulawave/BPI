import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function linkUserLocations() {
  console.log("🔗 Linking user locations to Country/State/City tables...\n");
  
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      country: true,
      state: true,
      city: true,
    },
  });
  
  console.log(`📊 Found ${users.length} users to process\n`);
  
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  
  for (const user of users) {
    try {
      const countryId = user.country ? parseInt(user.country) : null;
      const stateId = user.state ? parseInt(user.state) : null;
      const cityId = user.city ? parseInt(user.city) : null;
      
      // Skip if all are null or invalid
      if (!countryId && !stateId && !cityId) {
        skippedCount++;
        continue;
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          countryId: countryId && !isNaN(countryId) ? countryId : null,
          stateId: stateId && !isNaN(stateId) ? stateId : null,
          cityId: cityId && !isNaN(cityId) ? cityId : null,
        },
      });
      
      successCount++;
      
      if (successCount % 500 === 0) {
        console.log(`   ✅ Processed ${successCount} users...`);
      }
    } catch (error) {
      failedCount++;
      if (failedCount <= 10) {
        console.log(`   ❌ Failed to update user ${user.id}: ${error}`);
      }
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("📈 Update Summary:");
  console.log(`   ✅ Successfully linked: ${successCount}`);
  console.log(`   ⏭️  Skipped (no location data): ${skippedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log("=".repeat(80));
  
  // Get sample of users with linked locations
  console.log("\n📋 Sample of linked users:");
  const sampleUsers = await prisma.user.findMany({
    where: {
      countryId: { not: null },
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      countryRelation: {
        select: {
          id: true,
          name: true,
        },
      },
      stateRelation: {
        select: {
          id: true,
          name: true,
        },
      },
      cityRelation: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 10,
  });
  
  sampleUsers.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.firstname} ${user.lastname}`);
    if (user.countryRelation) {
      console.log(`   Country: ${user.countryRelation.name} (ID: ${user.countryRelation.id})`);
    }
    if (user.stateRelation) {
      console.log(`   State: ${user.stateRelation.name} (ID: ${user.stateRelation.id})`);
    }
    if (user.cityRelation) {
      console.log(`   City: ${user.cityRelation.name} (ID: ${user.cityRelation.id})`);
    }
  });
}

linkUserLocations()
  .then(() => {
    console.log("\n✅ User location linking completed!");
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error("\n❌ Linking failed:", error);
    prisma.$disconnect();
    process.exit(1);
  });
