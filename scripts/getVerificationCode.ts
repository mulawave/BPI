import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getVerificationCode() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'richrardobroh@gmail.com' },
      select: {
        email: true,
        emailVerified: true,
        verificationCode: true,
        name: true,
      },
    });

    if (!user) {
      console.log('User not found. Checking all users...');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          verificationCode: true,
          emailVerified: true,
        },
        take: 10,
      });
      console.log('Recent users:', JSON.stringify(allUsers, null, 2));
    } else {
      console.log('User Data:');
      console.log(JSON.stringify(user, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getVerificationCode();
