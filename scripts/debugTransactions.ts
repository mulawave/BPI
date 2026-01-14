import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTransactions() {
  console.log('🔍 Debugging referral transactions...\n');

  try {
    // Get user by email (the one who has 1 referral)
    const user = await prisma.user.findUnique({
      where: { email: 'richardobroh@gmail.com' },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User:', user.name, '(', user.id, ')');

    // Get their referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        User_Referral_referredIdToUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('\n📊 Referrals found:', referrals.length);
    referrals.forEach((ref, i) => {
      console.log(`  ${i + 1}. ${ref.User_Referral_referredIdToUser.name} (${ref.User_Referral_referredIdToUser.id})`);
    });

    // Check all referral transactions for this user
    console.log('\n💰 Checking ALL referral transactions for user...');
    const allReferralTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [
          { transactionType: { contains: 'REFERRAL' } },
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\nFound ${allReferralTransactions.length} referral transactions:`);
    allReferralTransactions.forEach((tx, i) => {
      console.log(`\n${i + 1}. Transaction ID: ${tx.id}`);
      console.log(`   Type: ${tx.transactionType}`);
      console.log(`   Amount: ${tx.amount}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Reference: ${tx.reference}`);
      console.log(`   Created: ${tx.createdAt}`);
    });

    // Check if descriptions have "Referral ID:"
    const withReferralId = allReferralTransactions.filter(tx => tx.description.includes('Referral ID:'));
    const withoutReferralId = allReferralTransactions.filter(tx => !tx.description.includes('Referral ID:'));

    console.log(`\n✅ With "Referral ID:": ${withReferralId.length}`);
    console.log(`❌ Without "Referral ID:": ${withoutReferralId.length}`);

    // For each referral, check what transactions match
    if (referrals.length > 0) {
      console.log('\n🔬 Testing query for first referral...');
      const referral = referrals[0];
      
      console.log(`\nSearching for transactions with "Referral ID: ${referral.User_Referral_referredIdToUser.id}"`);
      
      const matchingTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          transactionType: 'REFERRAL_CASH_L1',
          description: {
            contains: `Referral ID: ${referral.User_Referral_referredIdToUser.id}`
          }
        }
      });

      console.log(`Found ${matchingTransactions.length} matching transactions`);
      matchingTransactions.forEach(tx => {
        console.log(`  - ${tx.transactionType}: ₦${tx.amount} - ${tx.description.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTransactions()
  .then(() => {
    console.log('\n✨ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });
