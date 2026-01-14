import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransactionAmounts() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        transactionType: {
          in: ['debit', 'credit', 'WITHDRAWAL', 'INTER_WALLET_TRANSFER', 'MEMBERSHIP_ACTIVATION']
        }
      },
      select: {
        transactionType: true,
        amount: true,
        description: true,
        createdAt: true
      },
      take: 30,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Transaction amounts by type:\n');
    console.log('TYPE'.padEnd(30) + 'AMOUNT'.padStart(12) + '  DESCRIPTION');
    console.log('-'.repeat(80));
    
    transactions.forEach(tx => {
      const type = tx.transactionType.padEnd(30);
      const amount = String(tx.amount).padStart(12);
      const desc = (tx.description || 'N/A').substring(0, 35);
      console.log(`${type}${amount}  ${desc}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionAmounts();
