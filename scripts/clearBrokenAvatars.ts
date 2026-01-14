/**
 * Script to clear broken avatar paths from database
 * Checks if avatar files actually exist, and clears the path if they don't
 */

import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function clearBrokenAvatars() {
  console.log('🔍 Checking for broken avatar paths...\n');
  
  // Get all users with image paths
  const usersWithImages = await prisma.user.findMany({
    where: {
      image: {
        not: null
      }
    },
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      image: true
    }
  });

  console.log(`Found ${usersWithImages.length} users with avatar paths`);
  
  let brokenCount = 0;
  let validCount = 0;

  for (const user of usersWithImages) {
    if (!user.image) continue;

    // Check if the file exists
    // Remove leading slash if present
    const imagePath = user.image.startsWith('/') 
      ? user.image.substring(1) 
      : user.image;
    
    const fullPath = join(process.cwd(), 'public', imagePath);
    const fileExists = existsSync(fullPath);

    if (!fileExists) {
      console.log(`❌ Broken: ${user.email || user.id} - ${user.image}`);
      
      // Clear the broken image path
      await prisma.user.update({
        where: { id: user.id },
        data: { image: null }
      });
      
      brokenCount++;
    } else {
      console.log(`✅ Valid: ${user.email || user.id} - ${user.image}`);
      validCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Valid avatars: ${validCount}`);
  console.log(`   Broken avatars cleared: ${brokenCount}`);
  console.log(`   Total processed: ${usersWithImages.length}`);
}

clearBrokenAvatars()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
