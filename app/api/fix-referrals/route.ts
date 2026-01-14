import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 0: Fix membership_upgrade transaction amount to be negative
    await prisma.transaction.updateMany({
      where: {
        userId,
        transactionType: 'membership_upgrade',
        amount: { gt: 0 }, // Only update positive amounts
      },
      data: {
        amount: { multiply: -1 }, // Make it negative
      },
    });
    console.log('Fixed membership_upgrade transaction amounts to be negative');

    // Step 1: Delete ALL referral transactions (to clean up duplicates and wrong status)
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        userId,
        OR: [
          { transactionType: 'REFERRAL_CASH_L1' },
          { transactionType: 'REFERRAL_PALLIATIVE_L1' },
          { transactionType: 'REFERRAL_CASHBACK_L1' },
          { transactionType: 'REFERRAL_BPT_L1' },
        ],
      },
    });

    console.log(`Deleted ${deletedTransactions.count} referral transactions`);

    // Step 2: Find the user's actual package activation to recreate correct transactions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!user?.activeMembershipPackageId) {
      return NextResponse.json({
        success: false,
        message: 'No active membership package found',
        deleted: deletedTransactions.count,
      });
    }

    const membershipPackage = await prisma.membershipPackage.findUnique({
      where: { id: user.activeMembershipPackageId },
    });

    if (!membershipPackage) {
      return NextResponse.json({
        success: false,
        message: 'Membership package not found',
        deleted: deletedTransactions.count,
      });
    }

    // Step 3: Find AdeBlack (the referral)
    const adeBlack = await prisma.user.findUnique({
      where: { email: 'delightstores50@gmail.com' },
      select: { id: true, firstname: true, lastname: true, email: true },
    });

    if (!adeBlack) {
      return NextResponse.json({
        success: false,
        message: 'Could not find referral user (AdeBlack)',
        deleted: deletedTransactions.count,
      });
    }

    // Step 4: Create correct transactions based on actual package data
    const level = 1; // AdeBlack is L1 referral
    const timestamp = Date.now();
    const activatorName = `${adeBlack.firstname} ${adeBlack.lastname}`;

    const createdTransactions = [];

    // Cash transaction (from actual package schema)
    const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
    if (cashReward > 0) {
      const cashTx = await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: `REFERRAL_CASH_L${level}`,
          amount: cashReward,
          status: 'completed',
          description: `L${level} Cash Wallet referral reward from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${adeBlack.id})`,
          reference: `REF-CASH-FIX-${timestamp}`,
          createdAt: user.membershipActivatedAt || new Date(),
        },
      });
      createdTransactions.push(`CASH: ₦${cashReward}`);
    }

    // Palliative transaction
    const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
    if (palliativeReward > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: `REFERRAL_PALLIATIVE_L${level}`,
          amount: palliativeReward,
          status: 'completed',
          description: `L${level} Palliative Wallet referral reward from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${adeBlack.id})`,
          reference: `REF-PAL-FIX-${timestamp}`,
          createdAt: user.membershipActivatedAt || new Date(),
        },
      });
      createdTransactions.push(`PALLIATIVE: ₦${palliativeReward}`);
    }

    // Cashback transaction (if package has it)
    const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;
    if (cashbackReward > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: `REFERRAL_CASHBACK_L${level}`,
          amount: cashbackReward,
          status: 'completed',
          description: `L${level} Cashback Wallet referral reward from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${adeBlack.id})`,
          reference: `REF-CB-FIX-${timestamp}`,
          createdAt: user.membershipActivatedAt || new Date(),
        },
      });
      createdTransactions.push(`CASHBACK: ₦${cashbackReward}`);
    }

    // BPT transaction (user's 50% share)
    const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
    const userBptShare = bptReward / 2; // 50% to user, 50% to buyback
    if (userBptShare > 0) {
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: `REFERRAL_BPT_L${level}`,
          amount: userBptShare,
          status: 'completed',
          description: `L${level} BPT Wallet referral reward (50% user share) from ${membershipPackage.name} activation by ${activatorName} (Referral ID: ${adeBlack.id})`,
          reference: `REF-BPT-FIX-${timestamp}`,
          createdAt: user.membershipActivatedAt || new Date(),
        },
      });
      createdTransactions.push(`BPT: ${userBptShare} (50% of ${bptReward})`);
    }

    return NextResponse.json({
      success: true,
      message: `Fixed referral transactions for ${membershipPackage.name} package`,
      deleted: deletedTransactions.count,
      created: createdTransactions,
      packageData: {
        name: membershipPackage.name,
        cash_l1: (membershipPackage as any).cash_l1,
        palliative_l1: (membershipPackage as any).palliative_l1,
        bpt_l1: (membershipPackage as any).bpt_l1,
        cashback_l1: (membershipPackage as any).cashback_l1 || 0,
      },
      referral: {
        id: adeBlack.id,
        name: activatorName,
        email: adeBlack.email,
      },
    });
  } catch (error) {
    console.error('Error fixing referral transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fix transactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Find transactions with "unknown" referral ID for this user
    const unknownTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        description: { contains: 'Referral ID: unknown' },
      },
    });

    if (unknownTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No transactions to fix',
        updated: 0,
      });
    }

    // Find the user's referrals (who they referred)
    const referrals = await prisma.user.findMany({
      where: { referredBy: userId },
      select: { id: true, firstname: true, lastname: true, email: true },
      orderBy: { createdAt: 'asc' },
    });

    if (referrals.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No referrals found to associate with transactions',
        updated: 0,
      });
    }

    // Use the first referral as the one who activated
    const actualReferral = referrals[0];
    
    let updated = 0;
    for (const tx of unknownTransactions) {
      const newDescription = tx.description
        .replace('Referral ID: unknown', `Referral ID: ${actualReferral.id}`)
        .replace('by Unknown User', `by ${actualReferral.firstname} ${actualReferral.lastname}`);

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { description: newDescription },
      });

      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} transactions with referral: ${actualReferral.firstname} ${actualReferral.lastname}`,
      updated,
      referralId: actualReferral.id,
      referralEmail: actualReferral.email,
    });
  } catch (error) {
    console.error('Error fixing referral transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fix transactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
