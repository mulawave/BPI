/**
 * Check and update ALL YouTube-related transactions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking all YouTube-related transactions...\n');

  // Find ALL transactions with YouTube in description
  const allYoutubeTransactions = await prisma.transaction.findMany({
    where: {
      description: {
        contains: 'YouTube'
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Found ${allYoutubeTransactions.length} YouTube transactions:\n`);

  for (const tx of allYoutubeTransactions) {
    console.log(`ID: ${tx.id}`);
    console.log(`  Type: ${tx.transactionType}`);
    console.log(`  Description: ${tx.description}`);
    console.log(`  Amount: ₦${tx.amount}`);
    console.log(`  Status: ${tx.status}`);
    console.log(`  Date: ${tx.createdAt}`);
    console.log('');

    // Determine correct type and description
    let newType = tx.transactionType;
    let newDescription = tx.description;

    // Handle VAT transactions
    if (tx.description.includes('VAT')) {
      newType = 'tax';
      if (tx.description === 'VAT charge for YouTube Plan') {
        newDescription = 'VAT - YouTube Plan';
      }
    }
    // Handle plan purchase transactions
    else if (tx.description.includes('YouTube Plan') || tx.description.includes('YouTube Growth')) {
      newType = 'subscription';
      
      // Fix old descriptions
      if (tx.description === 'YouTube Plan') {
        newDescription = 'YouTube Growth - Starter';
      } else if (tx.description.startsWith('YouTube Plan -')) {
        newDescription = tx.description.replace('YouTube Plan -', 'YouTube Growth -');
      }
    }

    // Update if changed
    if (newType !== tx.transactionType || newDescription !== tx.description) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          transactionType: newType,
          description: newDescription
        }
      });
      console.log(`  ✅ Updated to: ${newType} - "${newDescription}"\n`);
    } else {
      console.log(`  ℹ️  Already correct\n`);
    }
  }

  console.log('\n🎉 All YouTube transactions checked and updated!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
