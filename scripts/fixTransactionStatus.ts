import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTransactionStatus() {
  try {
    // Update all "Successful" transactions to "completed"
    const result = await prisma.transaction.updateMany({
      where: {
        status: "Successful"
      },
      data: {
        status: "completed"
      }
    });

    console.log(`✅ Updated ${result.count} transactions from "Successful" to "completed"`);
    
    // Verify the changes
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        description: {
          contains: 'YouTube'
        }
      },
      select: {
        id: true,
        description: true,
        amount: true,
        status: true
      }
    });
    
    console.log('\n📋 YouTube transactions after update:');
    updatedTransactions.forEach(tx => {
      console.log(`- ${tx.description}: ₦${tx.amount} - ${tx.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTransactionStatus();
