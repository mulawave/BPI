import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('Checking ExecutiveWalletTransaction table...');
    const walletCount = await prisma.executiveWalletTransaction.count();
    console.log(`✅ ExecutiveWalletTransaction table exists (${walletCount} records)`);

    console.log('\nChecking CompanyReserveTransaction table...');
    const reserveCount = await prisma.companyReserveTransaction.count();
    console.log(`✅ CompanyReserveTransaction table exists (${reserveCount} records)`);

    console.log('\nChecking RevenueSnapshot table...');
    const snapshotCount = await prisma.revenueSnapshot.count();
    console.log(`✅ RevenueSnapshot table exists (${snapshotCount} records)`);

    console.log('\nAll new tables verified! Database schema is synced.');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSchema();
