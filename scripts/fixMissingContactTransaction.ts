/**
 * Script to insert missing CONVERT_TO_CONTACT transaction
 * Run this once to fix the missing transaction from your recent conversion
 * 
 * Usage: npx tsx scripts/fixMissingContactTransaction.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // CONFIGURATION: Update these values
  const YOUR_USER_ID = 'your-user-id-here'; // Replace with your actual user ID
  const CONTACT_EMAIL = 'contact-email@example.com'; // Email of the person you converted
  
  console.log('🔍 Finding contact record...');
  
  // Find the contact that was converted
  const contact = await prisma.contact.findFirst({
    where: {
      userId: YOUR_USER_ID,
      email: CONTACT_EMAIL,
      bptSpent: 0.75, // Recently converted contacts have this exact amount
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!contact) {
    console.log('❌ Contact not found. Please verify the email and user ID.');
    return;
  }

  console.log(`✅ Found contact: ${contact.firstname} ${contact.lastname}`);

  // Check if transaction already exists
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      userId: YOUR_USER_ID,
      transactionType: 'CONVERT_TO_CONTACT',
      description: {
        contains: `${contact.firstname} ${contact.lastname}`
      }
    }
  });

  if (existingTransaction) {
    console.log('⚠️  Transaction already exists! No need to create duplicate.');
    console.log(`   Transaction ID: ${existingTransaction.id}`);
    return;
  }

  // Create the missing transaction
  console.log('📝 Creating missing transaction...');
  
  const transaction = await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId: YOUR_USER_ID,
      transactionType: 'CONVERT_TO_CONTACT',
      amount: -0.75,
      description: `Converted ${contact.firstname} ${contact.lastname} to contact`,
      status: 'completed',
      reference: `CONTACT-${contact.createdAt.getTime()}`,
      createdAt: contact.createdAt, // Use same date as when contact was created
    }
  });

  console.log('✅ Transaction created successfully!');
  console.log(`   Transaction ID: ${transaction.id}`);
  console.log(`   Amount: ${transaction.amount} BPT`);
  console.log(`   Reference: ${transaction.reference}`);
  console.log('\n✨ Done! The transaction now appears in your transaction history.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
