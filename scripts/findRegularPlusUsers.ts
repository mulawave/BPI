import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Regular Plus package
  const regularPlus = await prisma.membershipPackage.findFirst({
    where: { name: 'Regular Plus' },
  });

  if (!regularPlus) {
    console.log('Regular Plus package not found');
    process.exit(1);
  }

  console.log('Regular Plus Package ID:', regularPlus.id);

  // Find all users with Regular Plus
  const users = await prisma.user.findMany({
    where: { activeMembershipPackageId: regularPlus.id },
    select: {
      id: true,
      email: true,
      name: true,
      sponsorId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n=== USERS WITH REGULAR PLUS ===');
  console.log('Total:', users.length);
  
  for (const user of users) {
    console.log('\n' + user.name, '(' + user.email + ')');
    console.log('  ID:', user.id);
    console.log('  Sponsor ID:', user.sponsorId || 'NONE');
    console.log('  Created:', user.createdAt.toISOString());
    
    if (user.sponsorId) {
      const sponsor = await prisma.user.findUnique({
        where: { id: user.sponsorId },
        select: { name: true, email: true },
      });
      console.log('  Sponsored by:', sponsor?.name, '(' + sponsor?.email + ')');
    }
  }

  // Check for any sponsorship relationships
  console.log('\n=== ALL SPONSORSHIPS ===');
  const allUsers = await prisma.user.findMany({
    where: { sponsorId: { not: null } },
    select: {
      email: true,
      name: true,
      sponsorId: true,
      activeMembershipPackageId: true,
    },
    take: 10,
  });

  for (const user of allUsers) {
    const sponsor = await prisma.user.findUnique({
      where: { id: user.sponsorId! },
      select: { email: true },
    });
    console.log(`${user.email} sponsored by ${sponsor?.email}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
