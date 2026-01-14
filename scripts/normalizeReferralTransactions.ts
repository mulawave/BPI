import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Package reward structure (based on your system)
const PACKAGE_REWARDS = {
  'Regular': {
    L1: { cash: 5000, palliative: 2500, cashback: 2500, bpt: 0 },
    L2: { cash: 2500, palliative: 1250, cashback: 1250, bpt: 0 },
    L3: { cash: 1250, palliative: 625, cashback: 625, bpt: 0 },
    L4: { cash: 625, palliative: 312.5, cashback: 312.5, bpt: 0 },
  },
  'Regular Plus': {
    L1: { cash: 5000, palliative: 2500, cashback: 2500, bpt: 1000 },
    L2: { cash: 2500, palliative: 1250, cashback: 1250, bpt: 500 },
    L3: { cash: 1250, palliative: 625, cashback: 625, bpt: 250 },
    L4: { cash: 625, palliative: 312.5, cashback: 312.5, bpt: 125 },
  },
};

async function normalizeReferralTransactions() {
  console.log('🔄 Starting referral transaction normalization...\n');

  // Find all old-format referral transactions
  const oldTransactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { transactionType: { contains: 'REFERRAL_REWARD_L' } },
        { transactionType: { startsWith: 'REFERRAL_L' } },
      ],
      NOT: {
        OR: [
          { transactionType: { contains: 'REFERRAL_CASH_L' } },
          { transactionType: { contains: 'REFERRAL_PALLIATIVE_L' } },
          { transactionType: { contains: 'REFERRAL_CASHBACK_L' } },
          { transactionType: { contains: 'REFERRAL_BPT_L' } },
        ],
      },
    },
    include: {
      User: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📊 Found ${oldTransactions.length} old-format referral transactions to normalize\n`);

  if (oldTransactions.length === 0) {
    console.log('✅ No transactions to normalize. Database is already clean!');
    return;
  }

  let migrated = 0;
  let errors = 0;

  for (const oldTx of oldTransactions) {
    try {
      console.log(`\n🔍 Processing transaction ${oldTx.id}:`);
      console.log(`   User: ${oldTx.User.firstname} ${oldTx.User.lastname} (${oldTx.User.email})`);
      console.log(`   Type: ${oldTx.transactionType}`);
      console.log(`   Amount: ₦${oldTx.amount}`);
      console.log(`   Description: ${oldTx.description.substring(0, 80)}...`);

      // Extract level from transaction type
      const levelMatch = oldTx.transactionType.match(/L(\d)/);
      if (!levelMatch) {
        console.log(`   ❌ Could not extract level from type: ${oldTx.transactionType}`);
        errors++;
        continue;
      }
      const level = parseInt(levelMatch[1]);

      // Extract package type and referral ID from description
      const packageMatch = oldTx.description.match(/(Regular Plus|Regular)/);
      const packageType = packageMatch ? packageMatch[1] : 'Regular';

      // Try to get referral chain to find who activated the package
      const referralChain = await prisma.user.findMany({
        where: { referredBy: oldTx.userId },
        select: { id: true, firstname: true, lastname: true },
        take: 10,
      });

      // Get the referral at this level (assuming first referral for simplicity)
      // In production, you might need more sophisticated logic
      const referralUser = referralChain[0];
      if (!referralUser) {
        console.log(`   ⚠️  No referral found, using generic description`);
      }

      const referralId = referralUser?.id || 'unknown';
      const referralName = referralUser ? `${referralUser.firstname} ${referralUser.lastname}` : 'Unknown User';

      // Get reward amounts for this package and level
      const rewards = PACKAGE_REWARDS[packageType as keyof typeof PACKAGE_REWARDS]?.[`L${level}` as 'L1' | 'L2' | 'L3' | 'L4'];
      
      if (!rewards) {
        console.log(`   ❌ Could not determine rewards for ${packageType} L${level}`);
        errors++;
        continue;
      }

      console.log(`   📦 Package: ${packageType}, Level: L${level}`);
      console.log(`   💰 Rewards: Cash=₦${rewards.cash}, Palliative=₦${rewards.palliative}, Cashback=₦${rewards.cashback}, BPT=${rewards.bpt}`);

      // Create new separate transactions
      const newTransactions: Array<{
        userId: string;
        transactionType: string;
        amount: number;
        status: string;
        description: string;
        createdAt: Date;
      }> = [];

      // Cash transaction
      if (rewards.cash > 0) {
        newTransactions.push({
          userId: oldTx.userId,
          transactionType: `REFERRAL_CASH_L${level}`,
          amount: rewards.cash,
          status: 'COMPLETED',
          description: `L${level} Cash Wallet referral reward from ${packageType} activation by ${referralName} (Referral ID: ${referralId})`,
          createdAt: oldTx.createdAt,
        });
      }

      // Palliative transaction
      if (rewards.palliative > 0) {
        newTransactions.push({
          userId: oldTx.userId,
          transactionType: `REFERRAL_PALLIATIVE_L${level}`,
          amount: rewards.palliative,
          status: 'COMPLETED',
          description: `L${level} Palliative Wallet referral reward from ${packageType} activation by ${referralName} (Referral ID: ${referralId})`,
          createdAt: oldTx.createdAt,
        });
      }

      // Cashback transaction
      if (rewards.cashback > 0) {
        newTransactions.push({
          userId: oldTx.userId,
          transactionType: `REFERRAL_CASHBACK_L${level}`,
          amount: rewards.cashback,
          status: 'COMPLETED',
          description: `L${level} Cashback Wallet referral reward from ${packageType} activation by ${referralName} (Referral ID: ${referralId})`,
          createdAt: oldTx.createdAt,
        });
      }

      // BPT transaction (only for Regular Plus)
      if (rewards.bpt > 0) {
        newTransactions.push({
          userId: oldTx.userId,
          transactionType: `REFERRAL_BPT_L${level}`,
          amount: rewards.bpt,
          status: 'COMPLETED',
          description: `L${level} BPT Wallet referral reward from ${packageType} activation by ${referralName} (50% user share) (Referral ID: ${referralId})`,
          createdAt: oldTx.createdAt,
        });
      }

      // Execute migration in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete old transaction
        await tx.transaction.delete({
          where: { id: oldTx.id },
        });

        // Create new transactions
        await tx.transaction.createMany({
          data: newTransactions.map(t => ({
            id: randomUUID(),
            ...t,
          })),
        });
      });

      console.log(`   ✅ Migrated! Created ${newTransactions.length} new transactions and deleted old one`);
      migrated++;

    } catch (error) {
      console.error(`   ❌ Error processing transaction ${oldTx.id}:`, error);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Migration complete!`);
  console.log(`   📊 Total processed: ${oldTransactions.length}`);
  console.log(`   ✅ Successfully migrated: ${migrated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`${'='.repeat(60)}\n`);
}

normalizeReferralTransactions()
  .then(() => {
    console.log('✅ Normalization script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Normalization script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
