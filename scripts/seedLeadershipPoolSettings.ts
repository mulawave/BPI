import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Leadership Pool admin settings...');

  const settings = [
    {
      id: randomUUID(),
      settingKey: 'leadershipPoolAmount',
      settingValue: '50000000',
      description: 'Total amount to distribute in Leadership Pool',
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      settingKey: 'leadershipPoolEnabled',
      settingValue: 'true',
      description: 'Enable or disable Leadership Pool Challenge',
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      settingKey: 'leadershipPoolMaxParticipants',
      settingValue: '100',
      description: 'Maximum number of participants in Leadership Pool',
      updatedAt: new Date(),
    },
  ];

  for (const setting of settings) {
    await prisma.adminSettings.upsert({
      where: { settingKey: setting.settingKey },
      update: {
        settingValue: setting.settingValue,
        description: setting.description,
        updatedAt: setting.updatedAt,
      },
      create: setting,
    });
    console.log(`✓ Upserted setting: ${setting.settingKey}`);
  }

  console.log('✓ Leadership Pool settings seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding Leadership Pool settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
