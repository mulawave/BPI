import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING DATABASE FOR YOUTUBE_PLANS TABLE ===\n');
  
  try {
    // Try to query youtube_plans table directly
    const result = await prisma.$queryRaw`
      SELECT * FROM youtube_plans LIMIT 10
    `;
    console.log('YouTube Plans found in database:');
    console.log(result);
  } catch (error: any) {
    console.log('Error querying youtube_plans:', error.message);
    console.log('\nTable likely does not exist. Checking all tables...\n');
  }

  // List all tables in database
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%youtube%'
      ORDER BY table_name
    `;
    console.log('Tables containing "youtube":');
    console.log(tables);
  } catch (error: any) {
    console.log('Error listing tables:', error.message);
  }

  // Check youtube_provider table
  try {
    const providers = await prisma.$queryRaw`
      SELECT * FROM youtube_provider LIMIT 5
    `;
    console.log('\nYouTube Provider records:');
    console.log(providers);
  } catch (error: any) {
    console.log('\nYouTube Provider table error:', error.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
