/**
 * Background job to verify pending YouTube channel subscriptions
 * This should be run via cron job every 5-10 minutes
 * 
 * Usage: npx tsx scripts/verifyYoutubeSubscriptions.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function verifySubscriptions() {
  console.log('🔍 Checking pending YouTube subscriptions...\n');

  try {
    // Get all pending subscriptions
    const pendingSubscriptions = await prisma.channelSubscription.findMany({
      where: { status: 'pending' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstname: true,
            wallet: true
          }
        },
        YoutubeChannel: {
          select: {
            id: true,
            userId: true,
            channelName: true,
            channelUrl: true
          }
        }
      }
    });

    console.log(`Found ${pendingSubscriptions.length} pending subscriptions\n`);

    if (pendingSubscriptions.length === 0) {
      console.log('✓ No pending subscriptions to process');
      return;
    }

    for (const subscription of pendingSubscriptions) {
      console.log(`Processing subscription: ${subscription.User.firstname} → ${subscription.YoutubeChannel.channelName}`);

      // TODO: Implement YouTube API verification here
      // For now, auto-approve for testing (REMOVE IN PRODUCTION)
      const isVerified = true; // Replace with actual YouTube API check

      if (isVerified) {
        // Get subscriber's referrer
        const referral = await prisma.referral.findFirst({
          where: { referredId: subscription.subscriberId }
        });

        const subscriberEarning = 40;
        const referrerEarning = 10;

        // Pay subscriber ₦40
        await prisma.user.update({
          where: { id: subscription.subscriberId },
          data: {
            wallet: { increment: subscriberEarning }
          }
        });

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId: subscription.subscriberId,
            transactionType: 'credit',
            amount: subscriberEarning,
            description: 'BPI Youtube Subscription Earnings',
            status: 'Successful'
          }
        });

        await prisma.userEarning.create({
          data: {
            id: randomUUID(),
            userId: subscription.subscriberId,
            channelId: subscription.channelId,
            amount: subscriberEarning,
            type: 'subscription',
            isPaid: true
          }
        });

        console.log(`  ✓ Credited ₦${subscriberEarning} to ${subscription.User.email}`);

        // Pay referrer ₦10
        if (referral) {
          await prisma.user.update({
            where: { id: referral.referrerId },
            data: {
              wallet: { increment: referrerEarning }
            }
          });

          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: referral.referrerId,
              transactionType: 'credit',
              amount: referrerEarning,
              description: 'BPI Youtube Subscription Referral Earnings',
              status: 'Successful'
            }
          });

          await prisma.userEarning.create({
            data: {
              id: randomUUID(),
              userId: referral.referrerId,
              channelId: subscription.channelId,
              amount: referrerEarning,
              type: 'referral',
              isPaid: true
            }
          });

          const subscriberName = subscription.User?.firstname || subscription.User?.email || 'your referral';
          await prisma.notification.create({
            data: {
              id: randomUUID(),
              userId: referral.referrerId,
              title: 'YouTube Referral Earning Received! 💰',
              message: `You earned ₦${referrerEarning.toLocaleString()} from ${subscriberName}'s YouTube subscription verification.`,
              link: '/dashboard',
              isRead: false,
            }
          });

          console.log(`  ✓ Credited ₦${referrerEarning} to referrer`);
        }

        // Decrement channel owner's balance
        await prisma.youtubeProvider.update({
          where: { userId: subscription.YoutubeChannel.userId },
          data: {
            balance: { decrement: 1 }
          }
        });

        // Update subscription status
        await prisma.channelSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'paid',
            verifiedAt: new Date(),
            paidAt: new Date()
          }
        });

        console.log(`  ✓ Subscription verified and paid\n`);
      } else {
        console.log(`  ⚠️  Subscription not yet verified on YouTube\n`);
      }
    }

    console.log('\n✓ Verification complete');
  } catch (error) {
    console.error('Error verifying subscriptions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifySubscriptions()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
