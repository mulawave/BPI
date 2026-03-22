import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getActiveBptPrice, nairaToBpt } from "@/server/services/bptPrice.service";

const BUY_BACK_WALLET_NAME = "BPI Token Buy-Back Wallet";

/**
 * Distributes BPI Token (BPT) rewards according to the 50/50 deflationary model.
 * 50% goes to the user's wallet, 50% goes to the system's buy-back wallet.
 *
 * IMPORTANT: The input `totalNairaReward` is the naira denomination from the
 * membership package (e.g. bpt_l1 = 1000 means ₦1,000).
 * This function converts to BPT units using the current admin-set price:
 *   totalBptUnits = totalNairaReward / bptPrice
 *
 * The user's bpiTokenWallet stores ACTUAL BPT UNITS, not naira.
 *
 * @param userId - The ID of the user receiving the reward.
 * @param totalNairaReward - The total NAIRA amount to be converted to BPT and distributed.
 * @param transactionType - The type of transaction (e.g., "REFERRAL_L1", "REFERRAL_L2").
 * @param description - A description of the transaction.
 * @returns The calculated BPT values for use in caller transaction records.
 */
export async function distributeBptReward(
  userId: string, 
  totalNairaReward: number,
  transactionType: string = "REFERRAL",
  description: string = "BPT referral reward"
): Promise<{ totalBptUnits: number; userBptUnits: number; buybackBptUnits: number; bptPrice: number }> {
  // INPUT VALIDATION: Ensure reward amount is positive
  if (totalNairaReward <= 0) {
    console.error(`❌ Invalid BPT reward amount: ${totalNairaReward} for user ${userId}`);
    throw new Error("BPT reward amount must be greater than zero");
  }

  // Fetch the current admin-set BPT price
  const bptPrice = await getActiveBptPrice();

  // Convert naira to BPT units
  const totalBptUnits = nairaToBpt(totalNairaReward, bptPrice);

  // PRECISION: Round to prevent floating point issues
  const userBptUnits = Math.round((totalBptUnits / 2) * 100) / 100;
  const buybackBptUnits = Math.round((totalBptUnits / 2) * 100) / 100;

  // TOKEN CALCULATION VALIDATION: Verify split sums correctly
  const calculatedTotal = userBptUnits + buybackBptUnits;
  if (Math.abs(calculatedTotal - totalBptUnits) > 0.01) {
    console.error(`❌ Token split calculation error: user(${userBptUnits}) + buyBack(${buybackBptUnits}) = ${calculatedTotal}, expected ${totalBptUnits}`);
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
    const newBalance = currentBalance + userBptUnits;

    // SAFETY CHECK: Ensure new balance won't be negative
    if (newBalance < 0) {
      console.error(`❌ BPT balance would become negative for user ${userId}: ${currentBalance} + ${userBptUnits} = ${newBalance}`);
      throw new Error("BPT balance validation failed - operation would result in negative balance");
    }

    // Update user BPT wallet (stores BPT UNITS, not naira)
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        bpiTokenWallet: {
          increment: userBptUnits,
        },
      },
    });
    
    // VERIFICATION: Log the actual balance after update
    console.log(`✅ BPT Balance Update: ${currentUser.name} (${currentUser.email}) - Before: ${currentBalance} BPT, Added: ${userBptUnits} BPT (₦${totalNairaReward} @ ₦${bptPrice}/BPT), After: ${updatedUser.bpiTokenWallet} BPT`);
    
    // Record user transaction (amounts in BPT units)
    await tx.tokenTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType,
        grossAmount: totalBptUnits,
        memberAmount: userBptUnits,
        buyBackAmount: buybackBptUnits,
        source: transactionType,
        description: `${description} (user share: ${userBptUnits} BPT from ₦${totalNairaReward} @ ₦${bptPrice}/BPT)`,
      }
    });

    // Update buy-back wallet
    await tx.systemWallet.update({
      where: { id: buyBackWallet.id },
      data: {
        balanceBpt: {
          increment: buybackBptUnits,
        },
      },
    });
    
    // Record buy-back transaction
    await tx.tokenTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "BUY_BACK_ALLOCATION",
        grossAmount: totalBptUnits,
        memberAmount: 0,
        buyBackAmount: buybackBptUnits,
        source: transactionType,
        description: `${description} (buy-back share: ${buybackBptUnits} BPT from ₦${totalNairaReward} @ ₦${bptPrice}/BPT)`,
      }
    });

    console.log(`✅ Distributed ${userBptUnits} BPT to user ${userId} (${currentUser.name})`);
    console.log(`✅ Distributed ${buybackBptUnits} BPT to ${BUY_BACK_WALLET_NAME}`);
  });

  return { totalBptUnits, userBptUnits, buybackBptUnits, bptPrice };
}
