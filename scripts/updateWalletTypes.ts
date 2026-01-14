import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating BPT transactions to have walletType="bpiToken"...');
  
  // Update transactions where transactionType contains BPT or TOKEN
  const result = await prisma.transaction.updateMany({
    where: {
      OR: [
        { transactionType: { contains: 'BPT' } },
        { transactionType: { contains: 'TOKEN' } },
        { transactionType: { contains: 'REFERRAL' } },
        { description: { contains: 'BPT' } },
        { description: { contains: 'token' } }
      ]
    },
    data: {
      walletType: 'bpiToken'
    }
  });
  
  console.log(`✅ Updated ${result.count} BPT transactions`);
  
  // Verify
  const bptCount = await prisma.transaction.count({
    where: {
      walletType: 'bpiToken'
    }
  });
  
  console.log(`✅ Verification: ${bptCount} transactions now have walletType="bpiToken"`);
  
  // Show some examples
  const examples = await prisma.transaction.findMany({
    where: {
      walletType: 'bpiToken'
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      transactionType: true,
      amount: true,
      description: true,
      createdAt: true
    }
  });
  
  console.log('\n📋 Sample BPT transactions:');
  examples.forEach((tx, i) => {
    console.log(`  ${i + 1}. ${tx.transactionType} - ${tx.amount} - ${tx.description}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
