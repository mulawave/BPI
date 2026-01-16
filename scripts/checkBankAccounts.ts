import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkBankAccounts() {
  console.log("Checking bank account numbers...\n");
  
  const records = await prisma.userBankRecord.findMany({
    take: 20,
    include: {
      bank: true,
      user: {
        select: {
          email: true,
          legacyId: true,
        }
      }
    },
    orderBy: { id: 'asc' }
  });
  
  console.log(`Found ${records.length} records\n`);
  
  records.forEach((record, index) => {
    console.log(`${index + 1}. ID: ${record.id}`);
    console.log(`   User: ${record.user.email} (Legacy ID: ${record.user.legacyId})`);
    console.log(`   Bank: ${record.bank?.bankName || 'N/A'} (${record.bank?.bankCode || 'N/A'})`);
    console.log(`   Account Name: ${record.accountName}`);
    console.log(`   Account Number: ${record.accountNumber} (Length: ${record.accountNumber.length})`);
    console.log(`   BVN: ${record.bvn}\n`);
  });
  
  await prisma.$disconnect();
}

checkBankAccounts().catch(console.error);
