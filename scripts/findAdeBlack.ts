import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdeBlack() {
  // Search for AdeBlack user
  const adeBlack = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'delightstores50@gmail.com' },
        { firstname: { contains: 'Ade', mode: 'insensitive' } },
        { lastname: { contains: 'Black', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      referredBy: true,
    },
  });

  if (adeBlack) {
    console.log('✅ Found AdeBlack:');
    console.log(`   ID: ${adeBlack.id}`);
    console.log(`   Name: ${adeBlack.firstname} ${adeBlack.lastname}`);
    console.log(`   Email: ${adeBlack.email}`);
    console.log(`   Referred By: ${adeBlack.referredBy || 'None'}`);

    if (adeBlack.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { id: adeBlack.referredBy },
        select: { id: true, firstname: true, lastname: true, email: true },
      });

      if (referrer) {
        console.log(`\n✅ AdeBlack was referred by:`);
        console.log(`   ${referrer.firstname} ${referrer.lastname} (${referrer.email})`);
      }
    }
  } else {
    console.log('❌ AdeBlack not found');
  }

  // Also search for Richard to see his referredBy
  const richard = await prisma.user.findUnique({
    where: { email: 'richardobroh@gmail.com' },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      referredBy: true,
    },
  });

  if (richard) {
    console.log('\n✅ Found Richard:');
    console.log(`   ID: ${richard.id}`);
    console.log(`   Name: ${richard.firstname} ${richard.lastname}`);
    console.log(`   Email: ${richard.email}`);
    console.log(`   Referred By: ${richard.referredBy || 'None'}`);
  }

  // Find who Richard actually referred
  const referredByRichard = await prisma.user.findMany({
    where: { referredBy: richard?.id },
    select: { id: true, firstname: true, lastname: true, email: true },
  });

  console.log(`\n📊 People referred by Richard: ${referredByRichard.length}`);
  referredByRichard.forEach((user) => {
    console.log(`   - ${user.firstname} ${user.lastname} (${user.email})`);
  });
}

findAdeBlack()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
