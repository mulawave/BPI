import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== REFERRALS TABLE ===');
  const referrals = await prisma.referral.findMany({
    include: {
      User_Referral_referrerIdToUser: { select: { email: true, name: true } },
      User_Referral_referredIdToUser: { select: { email: true, name: true, activeMembershipPackageId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('Total referrals found:', referrals.length);
  
  for (const ref of referrals) {
    console.log('\nReferrer:', ref.User_Referral_referrerIdToUser.name, '(' + ref.User_Referral_referrerIdToUser.email + ')');
    console.log('Referred:', ref.User_Referral_referredIdToUser.name, '(' + ref.User_Referral_referredIdToUser.email + ')');
    console.log('Package ID:', ref.User_Referral_referredIdToUser.activeMembershipPackageId || 'NONE');
    console.log('Created:', ref.createdAt);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
