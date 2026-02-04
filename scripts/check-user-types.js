const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserTypes() {
  const users = await prisma.user.findMany({ 
    select: { id: true, email: true, userType: true }, 
    take: 10 
  });
  
  console.log('\nSample users with userType values:');
  users.forEach(u => {
    console.log(`  ${u.email}: userType='${u.userType}'`);
  });
  
  const adminUsers = await prisma.user.findMany({
    where: { userType: { in: ['admin', 'super_admin'] } },
    select: { email: true, userType: true }
  });
  
  console.log(`\nFound ${adminUsers.length} admin users`);
  adminUsers.forEach(u => console.log(`  ${u.email}: ${u.userType}`));
  
  await prisma.$disconnect();
}

checkUserTypes().catch(console.error);
