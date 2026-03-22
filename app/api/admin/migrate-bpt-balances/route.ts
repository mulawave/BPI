import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/migrate-bpt-balances
 *
 * One-time admin migration to convert existing BPT wallet balances and
 * BPT transaction records from naira-denominated values to BPT unit values.
 *
 * Formula: existingNairaValue / currentBptPrice = correctBptUnits
 *
 * Requires super_admin role. Idempotent safe — records a migration flag
 * in AdminSettings to prevent double-execution.
 */
export async function POST() {
  // Auth check — super_admin only
  const session = await getServerSession(authConfig);
  const user = session?.user as any;
  if (!user || user.role !== "super_admin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized — super_admin only" },
      { status: 403 }
    );
  }

  // Idempotency check
  const migrationFlag = await prisma.adminSettings.findUnique({
    where: { settingKey: "bpt_naira_to_units_migration_done" },
  });
  if (migrationFlag?.settingValue === "true") {
    return NextResponse.json({
      success: false,
      message: "Migration already executed. Remove the 'bpt_naira_to_units_migration_done' admin setting to re-run.",
    });
  }

  // Get current admin-set BPT price
  const activePrice = await prisma.bPTokenPrice.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!activePrice || activePrice.price <= 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          "No active BPT price found. Set one in Admin > Currency Manager first.",
      },
      { status: 400 }
    );
  }

  const bptPrice = activePrice.price;
  const results = {
    bptPrice,
    usersUpdated: 0,
    transactionsUpdated: 0,
    tokenTransactionsUpdated: 0,
    errors: [] as string[],
  };

  try {
    // 1. Convert all user bpiTokenWallet balances: naira → BPT units
    const usersWithBpt = await prisma.user.findMany({
      where: { bpiTokenWallet: { gt: 0 } },
      select: { id: true, bpiTokenWallet: true, email: true },
    });

    for (const u of usersWithBpt) {
      try {
        const oldNaira = u.bpiTokenWallet;
        const newBptUnits = Math.round((oldNaira / bptPrice) * 100) / 100;

        await prisma.user.update({
          where: { id: u.id },
          data: { bpiTokenWallet: newBptUnits },
        });

        results.usersUpdated++;
      } catch (err: any) {
        results.errors.push(
          `User ${u.email}: ${err.message}`
        );
      }
    }

    // 2. Convert BPT transaction amounts: naira → BPT units
    const bptTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { transactionType: { startsWith: "REFERRAL_BPT_" } },
          { transactionType: "CONVERT_TO_CONTACT" },
          { transactionType: "STORE_PURCHASE_TOKEN" },
          { transactionType: "WITHDRAWAL_BPT" },
          { walletType: "bpiToken" },
        ],
      },
      select: { id: true, amount: true, transactionType: true },
    });

    for (const tx of bptTransactions) {
      try {
        // Skip small unit-denominated values (0.5, 0.75 BPT) that were already correct
        const absAmount = Math.abs(tx.amount);
        if (absAmount <= 1) continue; // Likely already BPT units (e.g. 0.5, 0.75)

        const isNegative = tx.amount < 0;
        const newAmount = Math.round((absAmount / bptPrice) * 100) / 100;

        await prisma.transaction.update({
          where: { id: tx.id },
          data: { amount: isNegative ? -newAmount : newAmount },
        });

        results.transactionsUpdated++;
      } catch (err: any) {
        results.errors.push(`Transaction ${tx.id}: ${err.message}`);
      }
    }

    // 3. Convert tokenTransaction amounts: naira → BPT units
    const tokenTxs = await prisma.tokenTransaction.findMany({
      select: {
        id: true,
        grossAmount: true,
        memberAmount: true,
        buyBackAmount: true,
      },
    });

    for (const ttx of tokenTxs) {
      try {
        await prisma.tokenTransaction.update({
          where: { id: ttx.id },
          data: {
            grossAmount: Math.round((ttx.grossAmount / bptPrice) * 100) / 100,
            memberAmount: Math.round((ttx.memberAmount / bptPrice) * 100) / 100,
            buyBackAmount: Math.round((ttx.buyBackAmount / bptPrice) * 100) / 100,
          },
        });
        results.tokenTransactionsUpdated++;
      } catch (err: any) {
        results.errors.push(`TokenTransaction ${ttx.id}: ${err.message}`);
      }
    }

    // 4. Convert system wallet BPT balance
    const buyBackWallet = await prisma.systemWallet.findUnique({
      where: { name: "BPI Token Buy-Back Wallet" },
    });
    if (buyBackWallet && buyBackWallet.balanceBpt > 0) {
      await prisma.systemWallet.update({
        where: { id: buyBackWallet.id },
        data: {
          balanceBpt: Math.round((buyBackWallet.balanceBpt / bptPrice) * 100) / 100,
        },
      });
    }

    // 5. Mark migration as done (idempotency)
    await prisma.adminSettings.upsert({
      where: { settingKey: "bpt_naira_to_units_migration_done" },
      update: { settingValue: "true", updatedAt: new Date() },
      create: {
        id: crypto.randomUUID(),
        settingKey: "bpt_naira_to_units_migration_done",
        settingValue: "true",
        description: `BPT naira-to-units migration completed at ${new Date().toISOString()} with BPT price ₦${bptPrice}`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, ...results },
      { status: 500 }
    );
  }
}
