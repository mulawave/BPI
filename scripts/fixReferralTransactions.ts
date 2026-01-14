import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to fix existing referral transactions by adding "Referral ID: {userId}" to descriptions
 * This allows the earnings to be properly tracked per referral in the new system
 */
async function fixReferralTransactions() {
  console.log('🔍 Finding all referral transactions...');

  try {
    // Get all referral transactions
    const referralTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { transactionType: { contains: 'REFERRAL_CASH_L' } },
          { transactionType: { contains: 'REFERRAL_PALLIATIVE_L' } },
          { transactionType: { contains: 'REFERRAL_CASHBACK_L' } },
          { transactionType: { contains: 'REFERRAL_BPT_L' } },
        ],
        NOT: {
          description: { contains: 'Referral ID:' }
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${referralTransactions.length} transactions to fix`);

    if (referralTransactions.length === 0) {
      console.log('✅ No transactions need fixing!');
      return;
    }

    // For each transaction, we need to find who activated the package
    // This is tricky since we don't have the referral's userId in the old format
    // We'll need to look at the referral chain to determine this

    let fixed = 0;
    let failed = 0;

    for (const transaction of referralTransactions) {
      try {
        // Extract level from transaction type (e.g., REFERRAL_CASH_L1 -> 1)
        const levelMatch = transaction.transactionType.match(/L(\d)/);
        if (!levelMatch) {
          console.log(`⚠️  Could not extract level from ${transaction.transactionType}`);
          failed++;
          continue;
        }
        const level = parseInt(levelMatch[1]);

        // Get referrals at this level for this user
        const referralChain = await getReferralChain(transaction.userId, level);
        
        if (referralChain.length >= level) {
          const referral = referralChain[level - 1];
          
          // Update the transaction description
          const newDescription = transaction.description + ` (Referral ID: ${referral.id})`;
          
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { description: newDescription }
          });

          console.log(`✅ Fixed transaction ${transaction.id} for ${transaction.User.name} - Added referral ${referral.name || referral.email}`);
          fixed++;
        } else {
          console.log(`⚠️  Could not find L${level} referral for transaction ${transaction.id}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error fixing transaction ${transaction.id}:`, error);
        failed++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${referralTransactions.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get the referral chain for a user (upline)
 */
async function getReferralChain(userId: string, depth: number): Promise<any[]> {
  const chain: any[] = [];
  let currentUserId = userId;

  for (let i = 0; i < depth; i++) {
    const referral = await prisma.referral.findFirst({
      where: { referredId: currentUserId },
      include: {
        User_Referral_referrerIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!referral) break;

    chain.push(referral.User_Referral_referrerIdToUser);
    currentUserId = referral.referrerId;
  }

  return chain;
}

// Run the script
fixReferralTransactions()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
