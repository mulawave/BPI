import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const BUY_BACK_WALLET_NAME = "BPI Token Buy-Back Wallet";

export const tokenRouter = createTRPCRouter({
  getPublicStats: publicProcedure.query(async () => {
    // Get the buy-back wallet's current balance
    const buyBackWallet = await prisma.systemWallet.findUnique({
      where: { name: BUY_BACK_WALLET_NAME },
    });

    // Get all historical burn events
    const burnHistory = await prisma.burnEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total BPT burned
    const totalBptBurned = await prisma.burnEvent.aggregate({
      _sum: {
        amountBpt: true,
      },
    });

    return {
      buyBackWalletBalance: buyBackWallet?.balance ?? 0,
      totalBptBurned: totalBptBurned._sum.amountBpt ?? 0,
      burnHistory,
    };
  }),
});
