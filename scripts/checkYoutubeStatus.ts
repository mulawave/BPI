import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkYoutubeTransactionStatus() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        description: {
          contains: 'YouTube'
        }
      },
      select: {
        id: true,
        description: true,
        amount: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('YouTube Transactions:');
    transactions.forEach(tx => {
      console.log(JSON.stringify(tx, null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYoutubeTransactionStatus();
