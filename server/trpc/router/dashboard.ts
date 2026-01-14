import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const dashboardRouter = createTRPCRouter({
  /**
   * Get comprehensive dashboard overview data
   * Returns: wallets, packages, transactions, portfolio stats
   */
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    // In protectedProcedure, session.user is guaranteed to exist
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User ID not found",
      });
    }

    try{
      // Fetch user with all wallet data
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          // Main wallet balances
          wallet: true,
          spendable: true,
          cashback: true,
          
          // BPI Token
          bpiTokenWallet: true,
          
          // Community wallets
          palliative: true,
          shelter: true,
          community: true,
          
          // Other wallets
          studentCashback: true,
          education: true,
          land: true,
          meal: true,
          health: true,
          security: true,
          business: true,
          car: true,
          solar: true,
          shareholder: true,
          
          // Membership
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          
          // User details
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get active membership package (user has 1 membership at a time)
      let activePackage = null;
      let packageStats = {
        totalActive: 0,
        totalInvested: 0,
        totalCurrentValue: 0,
        totalAccruedROI: 0,
        upcomingMaturities: 0,
      };

      if (user.activeMembershipPackageId) {
        const pkgData = await ctx.prisma.membershipPackage.findUnique({
          where: { id: user.activeMembershipPackageId },
          select: {
            id: true,
            name: true,
            price: true,
            packageType: true,
          }
        });

        if (pkgData && user.membershipActivatedAt) {
          // Calculate days since activation and ROI accumulation
          const activatedDate = new Date(user.membershipActivatedAt);
          const now = new Date();
          const daysSinceActivation = Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Example ROI calculation (adjust based on your business logic)
          // Assuming packages have a 365-day duration and cumulative ROI
          const duration = 365; // days
          const roiPercentage = 12; // 12% annual ROI example
          const dailyRoiRate = roiPercentage / duration / 100;
          const accruedROI = pkgData.price * dailyRoiRate * daysSinceActivation;
          const currentValue = pkgData.price + accruedROI;
          
          // Calculate maturity date
          const maturityDate = new Date(activatedDate);
          maturityDate.setDate(maturityDate.getDate() + duration);
          const daysUntilMaturity = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          activePackage = {
            id: pkgData.id,
            packageName: pkgData.name,
            amount: pkgData.price,
            roiPercentage: roiPercentage,
            duration: duration,
            status: daysUntilMaturity > 0 ? 'active' : 'matured',
            activatedAt: activatedDate,
            maturityDate: maturityDate,
            currentValue: currentValue,
            accruedROI: accruedROI,
          };

          packageStats = {
            totalActive: daysUntilMaturity > 0 ? 1 : 0,
            totalInvested: pkgData.price,
            totalCurrentValue: currentValue,
            totalAccruedROI: accruedROI,
            upcomingMaturities: (daysUntilMaturity > 0 && daysUntilMaturity <= 7) ? 1 : 0,
          };
        }
      }

      // Get recent transactions (all types: payments, bonuses, withdrawals)
      const recentTransactions = await ctx.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          transactionType: true,
          amount: true,
          description: true,
          status: true,
          reference: true,
          createdAt: true,
        },
      });

      // Format transactions for display
      const formattedTransactions = recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.transactionType,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        reference: tx.reference,
        currency: 'NGN', // Default to Naira, can be extended later
        createdAt: tx.createdAt,
      }));

      // Calculate total locked capital from active package
      const totalLocked = packageStats.totalInvested;

      // Calculate total rewards (cashback + student cashback + education)
      const totalRewards = (user.cashback || 0) + (user.studentCashback || 0) + (user.education || 0);

      // Calculate total portfolio value (excluding membership package payments)
      const BPI_TOKEN_RATE = 2.5; // 1 BPT = ₦2.5 (should be dynamic)
      const totalAssets = (user.wallet || 0) +
        (user.spendable || 0) +
        (user.bpiTokenWallet || 0) * BPI_TOKEN_RATE +
        totalRewards +
        // totalLocked + // Excluded: membership package payments not counted in portfolio
        (user.palliative || 0) +
        (user.shelter || 0) +
        (user.community || 0) +
        (user.land || 0) +
        (user.meal || 0) +
        (user.health || 0) +
        (user.security || 0) +
        (user.business || 0) +
        (user.car || 0) +
        (user.solar || 0) +
        (user.shareholder || 0);

      // Calculate 24h change using stored snapshots
      // This will be computed on the client side using localStorage
      const change24h = 0; 
      const changePercentage24h = 0;

      // Organize wallets by tier/category
      const wallets = {
        // Tier 1 - Primary (always visible)
        primary: {
          bpiToken: {
            balance: user.bpiTokenWallet || 0,
            balanceInNaira: (user.bpiTokenWallet || 0) * BPI_TOKEN_RATE,
            name: "BPI Token",
            symbol: "BPT",
            category: "operational",
          },
          main: {
            balance: user.wallet || 0,
            name: "Main Wallet",
            category: "operational",
          },
          locked: {
            balance: totalLocked,
            name: "Locked Capital",
            category: "investment",
            packagesCount: activePackage ? 1 : 0,
          },
          rewards: {
            balance: totalRewards,
            name: "Total Rewards",
            category: "rewards",
            breakdown: {
              cashback: user.cashback || 0,
              studentCashback: user.studentCashback || 0,
              education: user.education || 0,
            }
          }
        },
        
        // Tier 2 - Operational
        operational: [
          {
            id: 'spendable',
            balance: user.spendable || 0,
            name: "Spendable",
            description: "Available for immediate use",
          },
          {
            id: 'cashback',
            balance: user.cashback || 0,
            name: "Cashback",
            description: "Earned from purchases",
          },
          {
            id: 'studentCashback',
            balance: user.studentCashback || 0,
            name: "Student Cashback",
            description: "Student rewards",
          },
          {
            id: 'meal',
            balance: user.meal || 0,
            name: "Meal Wallet",
            description: "Food support fund",
          },
        ],
        
        // Tier 3 - Investment
        investment: [
          {
            id: 'business',
            balance: user.business || 0,
            name: "Business Wallet",
            description: "Business investments",
          },
          {
            id: 'land',
            balance: user.land || 0,
            name: "Land Wallet",
            description: "Real estate fund",
          },
          {
            id: 'shareholder',
            balance: user.shareholder || 0,
            name: "Shareholder Wallet",
            description: "Equity holdings",
          },
        ],
        
        // Tier 4 - Community
        community: [
          {
            id: 'palliative',
            balance: user.palliative || 0,
            name: "Palliative",
            description: "Community support fund",
          },
          {
            id: 'shelter',
            balance: user.shelter || 0,
            name: "Shelter",
            description: "Housing support fund",
          },
          {
            id: 'communityWallet',
            balance: user.community || 0,
            name: "Community Wallet",
            description: "General community fund",
          },
          {
            id: 'health',
            balance: user.health || 0,
            name: "Health Wallet",
            description: "Healthcare fund",
          },
          {
            id: 'education',
            balance: user.education || 0,
            name: "Education Wallet",
            description: "Learning support",
          },
        ],
        
        // Tier 5 - Promotional
        promotional: [
          {
            id: 'car',
            balance: user.car || 0,
            name: "Car Wallet",
            description: "Vehicle fund",
          },
          {
            id: 'solar',
            balance: user.solar || 0,
            name: "Solar Wallet",
            description: "Energy fund",
          },
          {
            id: 'security',
            balance: user.security || 0,
            name: "Security Wallet",
            description: "Safety fund",
          },
        ],
      };

      // Portfolio distribution for visualization
      const portfolioDistribution = [
        { name: "BPI Token", value: wallets.primary.bpiToken.balanceInNaira, percentage: 0 },
        { name: "Main Wallet", value: wallets.primary.main.balance, percentage: 0 },
        { name: "Locked Capital", value: wallets.primary.locked.balance, percentage: 0 },
        { name: "Rewards", value: wallets.primary.rewards.balance, percentage: 0 },
        { name: "Community", value: (user.palliative || 0) + (user.shelter || 0) + (user.community || 0), percentage: 0 },
        { name: "Others", value: (user.spendable || 0) + (user.land || 0) + (user.business || 0), percentage: 0 },
      ].map(item => ({
        ...item,
        percentage: totalAssets > 0 ? (item.value / totalAssets) * 100 : 0
      }));

      return {
        portfolio: {
          totalValue: totalAssets,
          change24h,
          changePercentage24h,
          distribution: portfolioDistribution,
        },
        wallets,
        packages: {
          active: activePackage ? [activePackage] : [],
          stats: packageStats,
        },
        transactions: formattedTransactions,
        notifications: [
          // TODO: Generate smart notifications based on wallet states
        ],
      };
    } catch (error) {
      console.error("Dashboard overview error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard data",
      });
    }
  }),

  /**
   * Get wallet health status
   */
  getWalletHealth: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User ID not found",
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        bpiTokenWallet: true,
        wallet: true,
        spendable: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const bpiTokenWallet = user.bpiTokenWallet ?? 0;
    const mainWallet = user.wallet ?? 0;
    const spendable = user.spendable ?? 0;

    const health = {
      bpiToken:
        bpiTokenWallet >= 10 ? "healthy" : bpiTokenWallet >= 1 ? "low" : "critical",
      mainWallet:
        mainWallet >= 100000 ? "healthy" : mainWallet >= 10000 ? "low" : "critical",
      spendable:
        spendable >= 50000 ? "healthy" : spendable >= 10000 ? "low" : "critical",
    };

    const warnings: string[] = [];
    if (health.bpiToken === "critical") {
      warnings.push(
        "BPI Token balance critically low. Buy more to continue using services.",
      );
    } else if (health.bpiToken === "low") {
      warnings.push("BPI Token balance is low. Consider topping up.");
    }

    if (health.mainWallet === "critical") {
      warnings.push("Main Wallet balance is critically low.");
    } else if (health.mainWallet === "low") {
      warnings.push("Main Wallet balance is low.");
    }

    if (health.spendable === "critical") {
      warnings.push("Spendable Wallet balance is critically low.");
    } else if (health.spendable === "low") {
      warnings.push("Spendable Wallet balance is low.");
    }

    return {
      health,
      warnings,
      overall: Object.values(health).every(h => h === 'healthy') ? 'healthy' :
               Object.values(health).some(h => h === 'critical') ? 'critical' : 'low'
    };
  }),

  /**
   * Get all transactions for user
   */
  getAllTransactions: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User ID not found",
      });
    }

    const transactions = await ctx.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transactionType: true,
        amount: true,
        description: true,
        status: true,
        reference: true,
        createdAt: true,
      },
    });

    return transactions;
  }),

  getWalletTimeline: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(30),
      cursor: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      transactionType: z.enum(['all', 'debit', 'credit']).default('all'),
      status: z.enum(['all', 'completed', 'pending', 'failed']).default('all'),
      walletType: z.string().optional().default('main'), // main, bpiToken, referral
      minAmount: z.number().optional(),
      maxAmount: z.number().optional(),
      searchTerm: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { limit, cursor, dateFrom, dateTo, transactionType, status, walletType, minAmount, maxAmount, searchTerm } = input;

      // Build where clause
      const where: any = { userId, walletType };

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Transaction type filter
      if (transactionType !== 'all') {
        where.transactionType = transactionType;
      }

      // Status filter
      if (status !== 'all') {
        where.status = status;
      }

      // Amount range filter
      if (minAmount !== undefined || maxAmount !== undefined) {
        where.amount = {};
        if (minAmount !== undefined) where.amount.gte = minAmount;
        if (maxAmount !== undefined) where.amount.lte = maxAmount;
      }

      // Search filter
      if (searchTerm) {
        where.OR = [
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { reference: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Cursor pagination
      const transactions = await ctx.prisma.transaction.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transactionType: true,
          amount: true,
          description: true,
          status: true,
          reference: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (transactions.length > limit) {
        const nextItem = transactions.pop();
        nextCursor = nextItem!.id;
      }

      // For first page, get current wallet balance based on wallet type
      // For subsequent pages, client will calculate running balance
      let currentBalance = 0;
      if (!cursor) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { 
            wallet: true,
            bpiTokenWallet: true,
          },
        });
        
        // Select balance based on wallet type
        if (walletType === 'bpiToken') {
          currentBalance = user?.bpiTokenWallet || 0;
        } else {
          currentBalance = user?.wallet || 0;
        }
      }

      return {
        transactions,
        nextCursor,
        currentBalance, // Current wallet balance (only on first page)
      };
    }),
});
