/**
 * Fix YouTube transactions back to proper debit type for outflow totals
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing YouTube transaction types back to debit...\n');

  // Update all YouTube transactions to debit type (keeping improved descriptions)
  const updated = await prisma.transaction.updateMany({
    where: {
      description: {
        contains: 'YouTube'
      }
    },
    data: {
      transactionType: 'debit'
    }
  });

  console.log(`✅ Updated ${updated.count} YouTube transactions to "debit" type`);
  console.log('   (Maintaining outflow totals consistency)\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
