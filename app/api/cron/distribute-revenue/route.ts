/**
 * Daily Executive Pool Distribution Cron Job
 * 
 * Vercel Cron Job Configuration
 * Add to vercel.json:
 * 
 * crons: [{
 *   path: "/api/cron/distribute-revenue",
 *   schedule: "0 8 * * *"
 * }]
 * 
 * Schedule: Every day at 8:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('\n🔄 [CRON] Revenue distribution triggered');

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all pending executive pool allocations from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingAllocations = await prisma.revenueAllocation.findMany({
      where: {
        destinationType: "EXECUTIVE_POOL",
        status: "PENDING",
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    if (pendingAllocations.length === 0) {
      console.log("ℹ️  No pending allocations for yesterday");
      return NextResponse.json({
        success: true,
        message: "No pending allocations",
        distributed: 0,
        totalAmount: 0,
      });
    }

    // Calculate total pending amount
    const totalAmount = pendingAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0
    );
    console.log(`💰 Total Executive Pool: ₦${totalAmount.toLocaleString()}`);

    // Get all executive shareholders with assigned users
    const shareholders = await prisma.executiveShareholder.findMany({
      where: {
        userId: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            shareholder: true,
          },
        },
      },
    });

    if (shareholders.length === 0) {
      console.log("⚠️  No shareholders assigned");
      return NextResponse.json({
        success: false,
        message: "No shareholders assigned",
        totalAmount,
      });
    }

    console.log(`👥 Active Shareholders: ${shareholders.length}`);

    // Calculate and distribute to each shareholder
    const distributions = [];
    for (const shareholder of shareholders) {
      if (!shareholder.user) continue;

      // Calculate shareholder's share
      const shareAmount = (totalAmount * shareholder.percentage) / 100;

      // Credit shareholder wallet
      await prisma.user.update({
        where: { id: shareholder.userId! },
        data: {
          shareholder: {
            increment: shareAmount,
          },
        },
      });

      // Record distribution
      await prisma.executiveDistribution.create({
        data: {
          shareholderId: shareholder.id,
          amount: shareAmount,
          distributionDate: new Date(),
          status: "COMPLETED",
        },
      });

      distributions.push({
        role: shareholder.role,
        name: shareholder.user.name,
        email: shareholder.user.email,
        percentage: shareholder.percentage,
        amount: shareAmount,
      });

      console.log(
        `  ✅ ${shareholder.role}: ₦${shareAmount.toLocaleString()} (${shareholder.percentage}%)`
      );
    }

    // Mark allocations as distributed
    await prisma.revenueAllocation.updateMany({
      where: {
        id: {
          in: pendingAllocations.map((a) => a.id),
        },
      },
      data: {
        status: "DISTRIBUTED",
      },
    });

    console.log(`✅ [CRON] Distribution completed successfully!`);

    return NextResponse.json({
      success: true,
      message: "Distribution completed",
      totalAmount,
      distributed: distributions.length,
      shareholders: distributions,
      allocationsProcessed: pendingAllocations.length,
    });
  } catch (error) {
    console.error('❌ [CRON] Distribution error:', error);
    return NextResponse.json(
      { 
        error: 'Distribution failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
