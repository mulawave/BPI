/**
 * Update existing YouTube transaction records to use proper transaction types
 * Run with: npx tsx scripts/updateYoutubeTransactions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating YouTube transaction records...\n');

  try {
    // Update YouTube Plan transactions from "debit" to "subscription"
    const planTransactions = await prisma.transaction.findMany({
      where: {
        transactionType: 'debit',
        description: {
          contains: 'YouTube Plan'
        }
      }
    });

    for (const tx of planTransactions) {
      let newDescription = tx.description;
      if (tx.description.includes('Starter')) {
        newDescription = 'YouTube Growth - Starter';
      } else if (tx.description.includes('Growth')) {
        newDescription = 'YouTube Growth - Growth';
      } else if (tx.description.includes('Pro')) {
        newDescription = 'YouTube Growth - Pro';
      } else if (tx.description.includes('Enterprise')) {
        newDescription = 'YouTube Growth - Enterprise';
      } else {
        newDescription = tx.description.replace('YouTube Plan -', 'YouTube Growth -');
      }

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          transactionType: 'subscription',
          description: newDescription
        }
      });
    }

    console.log(`✅ Updated ${planTransactions.length} YouTube plan transactions to "subscription" type`);

    // Update VAT transactions from "debit" to "tax" - look for VAT amounts
    const vatTransactions = await prisma.transaction.findMany({
      where: {
        transactionType: 'debit',
        description: {
          contains: 'VAT'
        }
      }
    });

    console.log(`Found ${vatTransactions.length} potential VAT transactions`);

    for (const tx of vatTransactions) {
      console.log(`  - ${tx.description} (₦${tx.amount})`);
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          transactionType: 'tax',
          description: tx.description.includes('YouTube') 
            ? tx.description.replace('VAT charge for YouTube Plan', 'VAT - YouTube Plan')
            : tx.description
        }
      });
    }

    console.log(`✅ Updated ${vatTransactions.length} VAT transactions to "tax" type\n`);
    
    console.log('🎉 All YouTube transactions updated successfully!');
  } catch (error) {
    console.error('❌ Error updating transactions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
