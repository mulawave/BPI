import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get your user email to find you
  const yourEmail = process.argv[2];
  if (!yourEmail) {
    console.log('Usage: tsx scripts/checkLeadership.ts <your-email>');
    process.exit(1);
  }

  const you = await prisma.user.findUnique({
    where: { email: yourEmail },
    select: {
      id: true,
      email: true,
      name: true,
      activeMembershipPackageId: true,
    },
  });

  if (!you) {
    console.log('User not found:', yourEmail);
    process.exit(1);
  }

  console.log('\n=== YOUR INFO ===');
  console.log('User:', you.name, '(' + you.email + ')');
  console.log('User ID:', you.id);
  console.log('Active Package ID:', you.activeMembershipPackageId);

  // Get your package name
  if (you.activeMembershipPackageId) {
    const yourPackage = await prisma.membershipPackage.findUnique({
      where: { id: you.activeMembershipPackageId },
      select: { name: true, price: true },
    });
    console.log('Your Package:', yourPackage?.name, '(₦' + yourPackage?.price + ')');
  } else {
    console.log('Your Package: NONE');
  }

  // Get all packages
  console.log('\n=== ALL PACKAGES ===');
  const allPackages = await prisma.membershipPackage.findMany({
    select: { id: true, name: true, price: true },
  });
  allPackages.forEach(pkg => {
    console.log(`${pkg.name}: ${pkg.id}`);
  });

  // Get your referrals
  console.log('\n=== YOUR REFERRALS ===');
  const referrals = await prisma.user.findMany({
    where: { sponsorId: you.id },
    select: {
      id: true,
      email: true,
      name: true,
      activeMembershipPackageId: true,
    },
  });

  console.log('Total referrals:', referrals.length);
  
  for (const ref of referrals) {
    console.log('\nReferral:', ref.name, '(' + ref.email + ')');
    console.log('  Sponsor ID:', you.id);
    console.log('  Package ID:', ref.activeMembershipPackageId);
    
    if (ref.activeMembershipPackageId) {
      const refPackage = await prisma.membershipPackage.findUnique({
        where: { id: ref.activeMembershipPackageId },
        select: { name: true },
      });
      console.log('  Package Name:', refPackage?.name);
    } else {
      console.log('  Package Name: NONE');
    }
  }

  // Check what the query would return
  console.log('\n=== TESTING LEADERSHIP QUERY ===');
  const eligiblePackages = await prisma.membershipPackage.findMany({
    where: {
      name: { in: ['Regular Plus', 'Premium', 'Gold', 'Platinum', 'Diamond'] },
    },
    select: { id: true, name: true },
  });
  console.log('Eligible package IDs:', eligiblePackages.map(p => `${p.name} (${p.id})`).join(', '));

  const eligiblePackageIds = eligiblePackages.map(p => p.id);
  
  const directSponsors = await prisma.user.count({
    where: {
      sponsorId: you.id,
      activeMembershipPackageId: { in: eligiblePackageIds },
    },
  });

  console.log('Direct Regular Plus+ sponsors counted:', directSponsors);

  await prisma.$disconnect();
}

main().catch(console.error);
