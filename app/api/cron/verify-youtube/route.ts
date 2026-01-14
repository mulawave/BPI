/**
 * Vercel Cron Job Configuration
 * For deployment to Vercel - runs subscription verification every 5 minutes
 * 
 * Add to vercel.json:
 * crons: [{
 *   path: "/api/cron/verify-youtube",
 *   schedule: "star-slash-5 star star star star" (replace with actual cron syntax)
 * }]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { notifyYoutubeReferralEarning } from '@/server/services/notification.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting YouTube subscription verification...');

    // Get all pending subscriptions
    const pendingSubscriptions = await prisma.channelSubscription.findMany({
      where: { status: 'pending' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            wallet: true
          }
        },
        YoutubeChannel: {
          select: {
            id: true,
            userId: true,
            channelName: true
          }
        }
      },
      take: 50 // Process 50 at a time
    });

    const processed = [];
    
    for (const subscription of pendingSubscriptions) {
      // TODO: Implement actual YouTube API subscription check
      // For now, auto-approve after 24 hours
      const hoursSinceSubscription = (Date.now() - subscription.subscriptionDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceSubscription >= 24) {
        // Get subscriber's referrer
        const referral = await prisma.referral.findFirst({
          where: { referredId: subscription.subscriberId }
        });

        const subscriberEarning = 40;
        const referrerEarning = 10;

        // Pay subscriber ₦40
        await prisma.user.update({
          where: { id: subscription.subscriberId },
          data: { wallet: { increment: subscriberEarning } }
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

        // Pay referrer ₦10
        if (referral) {
          await prisma.user.update({
            where: { id: referral.referrerId },
            data: { wallet: { increment: referrerEarning } }
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

          const subscriberName = subscription.User?.email || 'your referral';
          await notifyYoutubeReferralEarning(referral.referrerId, subscriberName, referrerEarning);
        }

        // Decrement channel owner's balance
        await prisma.youtubeProvider.update({
          where: { userId: subscription.YoutubeChannel.userId },
          data: { balance: { decrement: 1 } }
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

        processed.push(subscription.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed.length} subscriptions`,
      processed
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
