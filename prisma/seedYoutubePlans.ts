import { PrismaClient } from '@prisma/client';
import { youtubePlansSeedData } from "./seed-data/youtubePlans";

const prisma = new PrismaClient();

async function seedYoutubePlans() {
  console.log('Seeding YouTube plans...\n');

  for (const plan of youtubePlansSeedData) {
    const existing = await prisma.youtubePlan.findUnique({
      where: { name: plan.name },
    });

    if (existing) {
      console.log(`✓ Plan "${plan.name}" already exists, skipping...`);
    } else {
      await prisma.youtubePlan.create({ data: plan });
      console.log(`✓ Created plan "${plan.name}"`);
    }
  }

  console.log('\nYouTube plans seeded successfully!');
}

seedYoutubePlans()
  .catch((error) => {
    console.error('Error seeding YouTube plans:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
