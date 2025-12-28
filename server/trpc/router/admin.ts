import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }
  const userRole = (ctx.session.user as any).role;
  if (userRole !== 'admin') {
    throw new Error("UNAUTHORIZED: You must be an admin to perform this action.");
  }
  return next();
});

export const adminRouter = createTRPCRouter({
  getPendingEmpowermentPackages: adminProcedure.query(async () => {
    return await prisma.empowermentPackage.findMany({
      where: {
        OR: [
          { status: "Pending Maturity" },
          { status: "Pending Maturity (24 Months)" }
        ],
        adminApproved: false,
      },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        beneficiary: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { maturityDate: "asc" },
    });
  }),

  getAllEmpowerments: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const where = input.status ? { status: input.status } : {};

      return await prisma.empowermentPackage.findMany({
        where,
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          beneficiary: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get L5-L10 shelter rewards (admin only visibility)
  getShelterRewardsExtended: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        minLevel: z.number().default(5),
        maxLevel: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const where: any = {
        level: {
          gte: input.minLevel,
          lte: input.maxLevel,
        },
      };

      if (input.userId) {
        where.userId = input.userId;
      }

      return await prisma.shelterReward.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ level: "asc" }, { createdAt: "desc" }],
      });
    }),

  // Get shelter reward statistics
  getShelterStats: adminProcedure.query(async () => {
    const totalShelterRewards = await prisma.shelterReward.count();
    const totalShelterAmount = await prisma.shelterReward.aggregate({
      _sum: { amount: true },
    });

    const rewardsByPackage = await prisma.shelterReward.groupBy({
      by: ["packageType"],
      _count: true,
      _sum: { amount: true },
    });

    // Get level distribution
    const levelDistribution = await prisma.shelterReward.groupBy({
      by: ["level"],
      _count: true,
      _sum: { amount: true },
      orderBy: { level: "asc" },
    });

    return {
      totalRewards: totalShelterRewards,
      totalAmount: totalShelterAmount._sum.amount || 0,
      byLevel: levelDistribution.map((r) => ({
        level: r.level,
        count: r._count,
        total: r._sum.amount || 0,
      })),
      byPackage: rewardsByPackage.map((r) => ({
        packageType: r.packageType,
        count: r._count,
        total: r._sum.amount || 0,
      })),
    };
  }),

  // Get BPT buy-back wallet balance
  getBuyBackWalletBalance: adminProcedure.query(async () => {
    const buyBackWallet = await prisma.systemWallet.findFirst({
      where: { name: "BPI Token Buy-Back Wallet" },
    });

    if (!buyBackWallet) {
      return {
        balanceNgn: 0,
        balanceBpt: 0,
        balanceUsd: 0,
      };
    }

    return {
      balanceNgn: buyBackWallet.balanceNgn,
      balanceBpt: buyBackWallet.balanceBpt,
      balanceUsd: buyBackWallet.balanceUsd,
    };
  }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    const [totalUsers,
      activeMembers,
      totalPackageActivations,
      totalRenewals,
      totalEmpowerments,
      pendingEmpowerments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { activated: true } }),
      prisma.packageActivation.count(),
      prisma.renewalHistory.count(),
      prisma.empowermentPackage.count(),
      prisma.empowermentPackage.count({
        where: {
          OR: [
            { status: "Pending Maturity" },
            { status: "Pending Maturity (24 Months)" }
          ],
          adminApproved: false,
        },
      }),
    ]);

    // Get total BPT distributed (member share only)
    const totalBptDistributed = await prisma.tokenTransaction.aggregate({
      _sum: { memberAmount: true },
    });

    return {
      totalUsers,
      activeMembers,
      totalPackageActivations,
      totalRenewals,
      totalEmpowerments,
      pendingEmpowerments,
      totalBptDistributed: totalBptDistributed._sum.memberAmount || 0,
    };
  }),

  // Get user's full wallet details (admin view)
  getUserWallets: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          wallet: true,
          palliative: true,
          cashback: true,
          bpiTokenWallet: true,
          shelter: true,
          health: true,
          meal: true,
          security: true,
          education: true,
          community: true,
          spendable: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          renewalCount: true,
        },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      return user;
    }),

  approveEmpowermentPackage: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.empowermentPackage.update({
        where: { id: input.packageId },
        data: { status: "Approved – Activation Pending" },
      });
    }),

  triggerFallbackProtection: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
      const FALLBACK_NET_AMOUNT = 366300;

      const pkg = await prisma.empowermentPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) {
        throw new Error("Package not found");
      }

      // Add funds to sponsor's main wallet
      await prisma.user.update({
        where: { id: pkg.sponsorId },
        data: { wallet: { increment: FALLBACK_NET_AMOUNT } },
      });

      return await prisma.empowermentPackage.update({
        where: { id: input.packageId },
        data: { status: "Fallback Protection Activated" },
      });
    }),
  
  convertEmpowermentPackage: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
        // This is a complex operation involving multiple steps.
        // For now, we'll just update the status.
        // Full implementation would require activating Regular Plus and Myngul,
        // and crediting the remaining balance to a restricted wallet.
        return await prisma.empowermentPackage.update({
            where: { id: input.packageId },
            data: { status: "Converted to Regular Plus", isConverted: true },
        });
    }),
});
