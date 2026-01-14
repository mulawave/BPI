import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing CONVERT_TO_CONTACT transaction walletType...\n');

  // Update CONVERT_TO_CONTACT transactions to bpiToken wallet
  const result = await prisma.transaction.updateMany({
    where: {
      transactionType: 'CONVERT_TO_CONTACT',
    },
    data: {
      walletType: 'bpiToken',
    },
  });

  console.log(`✅ Updated ${result.count} CONVERT_TO_CONTACT transaction(s)\n`);

  // Verify
  const bptTransactions = await prisma.transaction.count({
    where: {
      walletType: 'bpiToken',
    },
  });

  console.log(`✅ Verification: ${bptTransactions} transactions now have walletType='bpiToken'\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
