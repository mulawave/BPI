import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixReferralIds() {
  console.log('🔍 Finding transactions with "Referral ID: unknown"...\n');

  // Find Richard
  const richard = await prisma.user.findUnique({
    where: { email: 'richardobroh@gmail.com' },
  });

  if (!richard) {
    console.log('❌ Richard not found');
    return;
  }

  console.log(`✅ Found Richard (${richard.id})`);

  // Find AdeBlack (the referral who activated the package)
  const adeBlack = await prisma.user.findUnique({
    where: { email: 'delightstores50@gmail.com' },
    select: { id: true, firstname: true, lastname: true, email: true },
  });

  if (!adeBlack) {
    console.log('❌ AdeBlack not found');
    return;
  }

  console.log(`✅ Found AdeBlack (${adeBlack.id}) - ${adeBlack.firstname} ${adeBlack.lastname}`);

  // Find transactions with "unknown" referral ID
  const unknownTransactions = await prisma.transaction.findMany({
    where: {
      userId: richard.id,
      description: { contains: 'Referral ID: unknown' },
    },
  });

  console.log(`\n📊 Found ${unknownTransactions.length} transactions with "unknown" referral ID`);

  if (unknownTransactions.length === 0) {
    console.log('✅ No transactions to fix!');
    return;
  }

  // Assume the first referral is the one who activated (AdeBlack)
  const actualReferral = adeBlack;

  console.log(`\n🔄 Updating transactions to use referral ID: ${actualReferral.id} (${actualReferral.firstname} ${actualReferral.lastname})`);

  let updated = 0;
  for (const tx of unknownTransactions) {
    const newDescription = tx.description.replace(
      'Referral ID: unknown',
      `Referral ID: ${actualReferral.id}`
    ).replace(
      'by Unknown User',
      `by ${actualReferral.firstname} ${actualReferral.lastname}`
    );

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { description: newDescription },
    });

    console.log(`   ✅ Updated transaction ${tx.id}`);
    console.log(`      Type: ${tx.transactionType}`);
    console.log(`      Old: ${tx.description.substring(0, 60)}...`);
    console.log(`      New: ${newDescription.substring(0, 60)}...`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} transactions!`);
}

fixReferralIds()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
