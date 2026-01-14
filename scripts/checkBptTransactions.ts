import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking BPT transactions in database...\n');
  
  // Get all transactions for the user
  const allTransactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 20,
    select: {
      id: true,
      transactionType: true,
      amount: true,
      description: true,
      walletType: true,
      createdAt: true,
      userId: true
    }
  });
  
  console.log(`📊 Total recent transactions: ${allTransactions.length}\n`);
  
  allTransactions.forEach((tx, i) => {
    console.log(`${i + 1}. ${tx.transactionType}`);
    console.log(`   Amount: ${tx.amount}`);
    console.log(`   Description: ${tx.description}`);
    console.log(`   WalletType: ${tx.walletType}`);
    console.log(`   Created: ${tx.createdAt}`);
    console.log('');
  });
  
  // Check BPT transactions specifically
  const bptTransactions = await prisma.transaction.findMany({
    where: {
      walletType: 'bpiToken'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`\n✅ BPT transactions (walletType='bpiToken'): ${bptTransactions.length}`);
  
  bptTransactions.forEach((tx, i) => {
    console.log(`  ${i + 1}. ${tx.transactionType} - ${tx.amount} - ${tx.description}`);
  });
  
  // Check what user has in bpiTokenWallet
  const users = await prisma.user.findMany({
    where: {
      bpiTokenWallet: {
        gt: 0
      }
    },
    select: {
      id: true,
      email: true,
      bpiTokenWallet: true
    }
  });
  
  console.log(`\n\n👥 Users with BPT balance: ${users.length}`);
  users.forEach(user => {
    console.log(`  ${user.email}: ${user.bpiTokenWallet} BPT`);
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
