import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING YOUTUBE PLANS IN DATABASE ===\n');
  
  // Check if there are any YouTube channels
  const channels = await prisma.youtubeChannel.findMany({
    take: 5,
    include: {
      User: {
        select: { email: true, name: true },
      },
    },
  });
  
  console.log('YouTube Channels:', channels.length);
  channels.forEach(ch => {
    console.log(`- ${ch.channelName} by ${ch.User.email}`);
  });

  console.log('\n=== CHECKING FOR PLAN-RELATED TABLES ===\n');
  
  // Check MembershipPackages that might be used for YouTube
  const packages = await prisma.membershipPackage.findMany({
    select: { id: true, name: true, price: true, packageType: true },
  });
  
  console.log('Membership Packages:');
  packages.forEach(pkg => {
    console.log(`${pkg.name} (${pkg.packageType}): ₦${pkg.price}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
