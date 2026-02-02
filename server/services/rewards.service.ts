import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const BUY_BACK_WALLET_NAME = "BPI Token Buy-Back Wallet";

/**
 * Distributes BPI Token (BPT) rewards according to the 50/50 deflationary model.
 * 50% goes to the user's wallet, 50% goes to the system's buy-back wallet.
 *
 * @param userId - The ID of the user receiving the reward.
 * @param totalBptReward - The total amount of BPT to be distributed.
 * @param transactionType - The type of transaction (e.g., "REFERRAL_L1", "REFERRAL_L2").
 * @param description - A description of the transaction.
 */
export async function distributeBptReward(
  userId: string, 
  totalBptReward: number,
  transactionType: string = "REFERRAL",
  description: string = "BPT referral reward"
) {
  // INPUT VALIDATION: Ensure reward amount is positive
  if (totalBptReward <= 0) {
    console.error(`❌ Invalid BPT reward amount: ${totalBptReward} for user ${userId}`);
    throw new Error("BPT reward amount must be greater than zero");
  }

  // PRECISION: Round to prevent floating point issues
  const userReward = Math.round((totalBptReward / 2) * 100) / 100;
  const buyBackAmount = Math.round((totalBptReward / 2) * 100) / 100;

  // TOKEN CALCULATION VALIDATION: Verify split equals total
  const calculatedTotal = userReward + buyBackAmount;
  if (Math.abs(calculatedTotal - totalBptReward) > 0.01) {
    console.error(`❌ Token split calculation error: user(${userReward}) + buyBack(${buyBackAmount}) = ${calculatedTotal}, expected ${totalBptReward}`);
    throw new Error("Token distribution calculation mismatch detected");
  }

  // Ensure the buy-back wallet exists
  let buyBackWallet = await prisma.systemWallet.findUnique({
    where: { name: BUY_BACK_WALLET_NAME },
  });

  if (!buyBackWallet) {
    buyBackWallet = await prisma.systemWallet.create({
      data: {
        id: randomUUID(),
        name: BUY_BACK_WALLET_NAME,
        walletType: "BUY_BACK_BURN",
        balanceBpt: 0,
        updatedAt: new Date(),
      },
    });
  }

  // Perform the distribution in a transaction
  await prisma.$transaction(async (tx) => {
    // BALANCE VALIDATION: Check current BPT balance before update
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { bpiTokenWallet: true, name: true, email: true }
    });

    if (!currentUser) {
      throw new Error(`User ${userId} not found`);
    }

    const currentBalance = currentUser.bpiTokenWallet || 0;
    const newBalance = currentBalance + userReward;

    // SAFETY CHECK: Ensure new balance won't be negative (shouldn't happen on increment, but validate anyway)
    if (newBalance < 0) {
      console.error(`❌ BPT balance would become negative for user ${userId}: ${currentBalance} + ${userReward} = ${newBalance}`);
      throw new Error("BPT balance validation failed - operation would result in negative balance");
    }

    // Update user BPT wallet
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        bpiTokenWallet: {
          increment: userReward,
        },
      },
    });
    
    // VERIFICATION: Log the actual balance after update
    console.log(`✅ BPT Balance Update: ${currentUser.name} (${currentUser.email}) - Before: ${currentBalance}, Added: ${userReward}, After: ${updatedUser.bpiTokenWallet}`);
    
    // Record user transaction
    await tx.tokenTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType,
        grossAmount: totalBptReward,
        memberAmount: userReward,
        buyBackAmount: buyBackAmount,
        source: transactionType,
        description: `${description} (user share)`,
      }
    });

    // Update buy-back wallet
    const updatedSystemWallet = await tx.systemWallet.update({
      where: { id: buyBackWallet.id },
      data: {
        balanceBpt: {
          increment: buyBackAmount,
        },
      },
    });
    
    // Record buy-back transaction
    await tx.tokenTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "BUY_BACK_ALLOCATION",
        grossAmount: totalBptReward,
        memberAmount: 0,
        buyBackAmount: buyBackAmount,
        source: transactionType,
        description: `${description} (buy-back share)`,
      }
    });

    console.log(`✅ Distributed ${userReward} BPT to user ${userId} (${currentUser.name})`);
    console.log(`✅ Distributed ${buyBackAmount} BPT to ${BUY_BACK_WALLET_NAME}`);
  });
}
