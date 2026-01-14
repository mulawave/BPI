import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('Checking YouTube tables...\n');

    // Check YoutubePlan
    const plans = await prisma.youtubePlan.findMany();
    console.log(`✓ YoutubePlan table exists (${plans.length} records)`);

    // Check YoutubeProvider
    const providers = await prisma.youtubeProvider.findMany();
    console.log(`✓ YoutubeProvider table exists (${providers.length} records)`);

    // Check ChannelSubscription
    const subscriptions = await prisma.channelSubscription.findMany();
    console.log(`✓ ChannelSubscription table exists (${subscriptions.length} records)`);

    // Check UserEarning
    const earnings = await prisma.userEarning.findMany();
    console.log(`✓ UserEarning table exists (${earnings.length} records)`);

    // Check YoutubeChannel
    const channels = await prisma.youtubeChannel.findMany();
    console.log(`✓ YoutubeChannel table exists (${channels.length} records)`);

  } catch (error: any) {
    console.error('Error checking tables:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
