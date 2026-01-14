import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateInviteCodes() {
  console.log('Starting invite code generation for existing users...');

  // Get all users without invite codes
  const usersWithoutCodes = await prisma.user.findMany({
    where: {
      OR: [
        { inviteCode: null },
        { inviteCode: '' }
      ]
    },
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      inviteCode: true
    }
  });

  console.log(`Found ${usersWithoutCodes.length} users without invite codes`);

  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  for (const user of usersWithoutCodes) {
    // Generate unique invite code
    let inviteCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      inviteCode = '';
      for (let i = 0; i < 12; i++) {
        inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check uniqueness
      const existing = await prisma.user.findUnique({
        where: { inviteCode }
      });

      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      console.error(`Failed to generate unique code for user ${user.email}`);
      continue;
    }

    // Update user with invite code and referral link
    const referralLink = `https://beepagro.com/register?ref=${inviteCode}`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        inviteCode,
        referralLink
      }
    });

    console.log(`✓ Generated invite code for ${user.email}: ${inviteCode}`);
  }

  console.log('\nInvite code generation complete!');
  
  // Verify richardobroh@gmail.com has an invite code
  const richard = await prisma.user.findUnique({
    where: { email: 'richardobroh@gmail.com' },
    select: {
      email: true,
      inviteCode: true,
      referralLink: true,
      firstname: true,
      lastname: true
    }
  });

  if (richard) {
    console.log('\n===================================');
    console.log('Richard Obroh Details:');
    console.log('Email:', richard.email);
    console.log('Name:', richard.firstname, richard.lastname);
    console.log('Invite Code:', richard.inviteCode);
    console.log('Referral Link:', richard.referralLink);
    console.log('===================================\n');
  }
}

generateInviteCodes()
  .catch((e) => {
    console.error('Error generating invite codes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
