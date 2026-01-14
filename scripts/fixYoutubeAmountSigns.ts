import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixYoutubeAmountSigns() {
  try {
    // Update YouTube transactions to have negative amounts (they are debits/outflows)
    const youtubeTransactions = await prisma.transaction.findMany({
      where: {
        description: {
          contains: 'YouTube'
        },
        transactionType: 'debit'
      }
    });
    
    console.log(`Found ${youtubeTransactions.length} YouTube debit transactions`);
    
    for (const tx of youtubeTransactions) {
      if (tx.amount > 0) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { amount: -Math.abs(tx.amount) }
        });
        console.log(`✅ Fixed: ${tx.description} - ${tx.amount} → ${-Math.abs(tx.amount)}`);
      }
    }
    
    console.log('\n✅ All YouTube debit transactions now have negative amounts');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixYoutubeAmountSigns();
