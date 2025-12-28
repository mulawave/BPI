import { prisma } from "@/lib/prisma";

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
  const userReward = totalBptReward / 2;
  const buyBackAmount = totalBptReward / 2;

  // Ensure the buy-back wallet exists
  let buyBackWallet = await prisma.systemWallet.findUnique({
    where: { name: BUY_BACK_WALLET_NAME },
  });

  if (!buyBackWallet) {
    buyBackWallet = await prisma.systemWallet.create({
      data: {
        name: BUY_BACK_WALLET_NAME,
        walletType: "BUY_BACK_BURN",
        balanceBpt: 0,
      },
    });
  }

  // Perform the distribution in a transaction
  await prisma.$transaction(async (tx) => {
    // Update user BPT wallet
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        bpiTokenWallet: {
          increment: userReward,
        },
      },
    });
    
    // Record user transaction
    await tx.tokenTransaction.create({
      data: {
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
        userId,
        transactionType: "BUY_BACK_ALLOCATION",
        grossAmount: totalBptReward,
        memberAmount: 0,
        buyBackAmount: buyBackAmount,
        source: transactionType,
        description: `${description} (buy-back share)`,
      }
    });

    console.log(`Distributed ${userReward} BPT to user ${userId}`);
    console.log(`Distributed ${buyBackAmount} BPT to ${BUY_BACK_WALLET_NAME}`);
  });
}
