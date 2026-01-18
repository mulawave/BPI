/**
 * Referral Data Sync Script
 * 
 * This script synchronizes the Referral table with the User.sponsorId relationships.
 * It truncates the Referral table and repopulates it based on the authoritative sponsorId field.
 * 
 * Usage: npx tsx prisma/syncReferrals.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function syncReferrals() {
  console.log("🔄 Starting referral data synchronization...\n");

  try {
    // Step 1: Count existing referral records
    const existingCount = await prisma.referral.count();
    console.log(`📊 Found ${existingCount} existing referral records`);

    // Step 2: Truncate the Referral table
    console.log("\n🗑️  Truncating Referral table...");
    await prisma.referral.deleteMany({});
    console.log("✅ Referral table truncated");

    // Step 3: Get all users with sponsors
    console.log("\n🔍 Fetching all users with sponsors...");
    const usersWithSponsors = await prisma.user.findMany({
      where: {
        sponsorId: {
          not: null,
        },
      },
      select: {
        id: true,
        sponsorId: true,
        createdAt: true,
        activated: true,
      },
    });

    console.log(`✅ Found ${usersWithSponsors.length} users with sponsors`);

    // Step 4: Create referral records
    console.log("\n📝 Creating referral records...");
    
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const user of usersWithSponsors) {
      if (!user.sponsorId) {
        skipped++;
        continue;
      }

      try {
        // Verify sponsor exists
        const sponsorExists = await prisma.user.findUnique({
          where: { id: user.sponsorId },
          select: { id: true },
        });

        if (!sponsorExists) {
          errors.push(`User ${user.id} has invalid sponsorId: ${user.sponsorId}`);
          skipped++;
          continue;
        }

        // Create referral record
        await prisma.referral.create({
          data: {
            id: randomUUID(),
            referrerId: user.sponsorId,
            referredId: user.id,
            status: user.activated ? "active" : "pending",
            rewardPaid: false,
            createdAt: user.createdAt,
            updatedAt: new Date(),
          },
        });

        created++;

        // Progress indicator
        if (created % 100 === 0) {
          console.log(`  ⏳ Progress: ${created}/${usersWithSponsors.length} records created...`);
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Duplicate entry, skip
          skipped++;
        } else {
          errors.push(`Failed to create referral for user ${user.id}: ${error.message}`);
          skipped++;
        }
      }
    }

    // Step 5: Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SYNCHRONIZATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully created: ${created} referral records`);
    console.log(`⏭️  Skipped: ${skipped} records`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log("\n⚠️  ERRORS:");
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    // Step 6: Verification
    console.log("\n🔍 Verifying synchronization...");
    const newCount = await prisma.referral.count();
    console.log(`✅ Total referral records in database: ${newCount}`);

    // Step 7: Sample validation
    console.log("\n🔍 Sample validation (checking first 5 users):");
    const sampleUsers = await prisma.user.findMany({
      where: {
        sponsorId: { not: null },
      },
      take: 5,
      select: {
        id: true,
        email: true,
        sponsorId: true,
      },
    });

    for (const user of sampleUsers) {
      const referralRecord = await prisma.referral.findFirst({
        where: {
          referredId: user.id,
          referrerId: user.sponsorId!,
        },
      });

      if (referralRecord) {
        console.log(`  ✅ ${user.email}: Referral record exists`);
      } else {
        console.log(`  ❌ ${user.email}: Referral record MISSING`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✨ Synchronization completed successfully!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Fatal error during synchronization:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncReferrals()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
