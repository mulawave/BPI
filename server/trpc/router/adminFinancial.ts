import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { requireAdmin } from "../../utils/adminAuth";

const adminFinancialProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireAdmin(ctx);
  return next();
});

type FinancialDirection = "INFLOW" | "OUTFLOW" | "NEUTRAL";

function resolveWalletField(walletType?: string | null):
  | "wallet"
  | "spendable"
  | "cashback"
  | "community"
  | "shareholder"
  | "education"
  | "car"
  | "business"
  | "palliative"
  | "studentCashback"
  | "bpiTokenWallet" {
  const normalized = (walletType || "wallet").toLowerCase();
  if (normalized === "main" || normalized === "wallet") return "wallet";
  if (normalized === "spendable") return "spendable";
  if (normalized === "cashback") return "cashback";
  if (normalized === "community") return "community";
  if (normalized === "shareholder") return "shareholder";
  if (normalized === "education") return "education";
  if (normalized === "car") return "car";
  if (normalized === "business") return "business";
  if (normalized === "palliative") return "palliative";
  if (normalized === "studentcashback") return "studentCashback";
  if (normalized === "bpitoken" || normalized === "bpitokenwallet") return "bpiTokenWallet";
  return "wallet";
}

function classifyTransaction(type: string, description?: string | null): {
  direction: FinancialDirection;
  source: string;
} {
  const normalizedType = (type || "").toUpperCase();
  const normalizedDescription = (description || "").toLowerCase();

  if (
    normalizedType.includes("CSP") ||
    normalizedDescription.includes("csp") ||
    normalizedDescription.includes("community support")
  ) {
    return { direction: "INFLOW", source: "CSP" };
  }

  if (
    normalizedType.includes("WITHDRAWAL") ||
    normalizedType === "DEBIT" ||
    normalizedDescription.includes("withdrawal")
  ) {
    return { direction: "OUTFLOW", source: "WITHDRAWALS" };
  }

  if (
    normalizedType.startsWith("REFERRAL_") ||
    normalizedType.includes("REWARD") ||
    normalizedDescription.includes("reward")
  ) {
    return { direction: "OUTFLOW", source: "REWARDS" };
  }

  if (
    normalizedType.includes("MEMBERSHIP") ||
    normalizedType === "SUBSCRIPTION" ||
    normalizedType === "PURCHASE"
  ) {
    return { direction: "INFLOW", source: "MEMBERSHIP" };
  }

  if (normalizedType.includes("VAT") || normalizedType.includes("FEE")) {
    return { direction: "INFLOW", source: "FEES" };
  }

  if (normalizedType.includes("BPT") || normalizedDescription.includes("bpt")) {
    if (normalizedType.includes("WITHDRAWAL") || normalizedType.includes("CONVERT")) {
      return { direction: "OUTFLOW", source: "BPT" };
    }
    return { direction: "INFLOW", source: "BPT" };
  }

  if (
    normalizedType === "DEPOSIT" ||
    normalizedType === "CREDIT" ||
    normalizedType === "PACKAGE_ACTIVATION"
  ) {
    return { direction: "INFLOW", source: "DEPOSITS" };
  }

  return { direction: "NEUTRAL", source: "OTHER" };
}

export const adminFinancialRouter = createTRPCRouter({
  reverseOrAdjustLedgerEntry: adminFinancialProcedure
    .input(
      z.object({
        transactionId: z.string().min(1),
        action: z.enum(["REVERSE", "ADJUST"]),
        reason: z.string().min(10, "Reason must be at least 10 characters"),
        adjustmentAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const adminId = (ctx.session?.user as any)?.id || "system";
      const transaction = await prisma.transaction.findUnique({
        where: { id: input.transactionId },
        include: { User: { select: { id: true, email: true, name: true } } },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if ((transaction.status || "").toLowerCase() !== "completed") {
        throw new Error("Only completed transactions can be remediated");
      }

      if (["REVERSAL", "ADJUSTMENT"].includes((transaction.transactionType || "").toUpperCase())) {
        throw new Error("Reversal/Adjustment entries cannot be remediated again");
      }

      if (input.action === "ADJUST" && (!input.adjustmentAmount || input.adjustmentAmount === 0)) {
        throw new Error("Adjustment amount is required and cannot be zero");
      }

      const existingReversal =
        input.action === "REVERSE"
          ? await prisma.transaction.findFirst({
              where: {
                status: "completed",
                transactionType: "REVERSAL",
                OR: [
                  { reference: { startsWith: `REV-${transaction.reference || transaction.id}` } },
                  { description: { contains: transaction.id, mode: "insensitive" } },
                ],
              },
              select: { id: true },
            })
          : null;

      if (existingReversal) {
        throw new Error("This transaction has already been reversed");
      }

      const walletField = resolveWalletField(transaction.walletType);
      const walletType = transaction.walletType || "wallet";
      const delta = input.action === "REVERSE" ? -transaction.amount : Number(input.adjustmentAmount || 0);

      const userWallet = await prisma.user.findUnique({
        where: { id: transaction.userId },
        select: { id: true, [walletField]: true },
      });

      if (!userWallet) {
        throw new Error("User not found");
      }

      const currentBalance = Number((userWallet as any)[walletField] || 0);
      const newBalance = currentBalance + delta;
      if (newBalance < 0) {
        throw new Error(
          `Insufficient ${walletType} balance. Current: ${currentBalance.toLocaleString()}, required impact: ${Math.abs(delta).toLocaleString()}`,
        );
      }

      const now = Date.now();
      const actionType = input.action === "REVERSE" ? "REVERSAL" : "ADJUSTMENT";
      const actionRefPrefix = input.action === "REVERSE" ? "REV" : "ADJ";
      const actionRef = `${actionRefPrefix}-${transaction.reference || transaction.id}-${now}`;

      const created = await prisma.$transaction(async (tx) => {
        const createdTx = await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: transaction.userId,
            transactionType: actionType,
            amount: delta,
            description:
              input.action === "REVERSE"
                ? `Reversal of ${transaction.reference || transaction.id}. Reason: ${input.reason}. Original txId: ${transaction.id}`
                : `Adjustment on ${transaction.reference || transaction.id}. Reason: ${input.reason}. Original txId: ${transaction.id}`,
            status: "completed",
            reference: actionRef,
            walletType,
            metadata: JSON.stringify({
              remediatedByAdminId: adminId,
              originalTransactionId: transaction.id,
              originalReference: transaction.reference,
              remediationAction: input.action,
              reason: input.reason,
            }),
          },
        });

        await tx.user.update({
          where: { id: transaction.userId },
          data: { [walletField]: { increment: delta } },
        });

        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            userId: adminId,
            action: input.action === "REVERSE" ? "FINANCIAL_TRANSACTION_REVERSED" : "FINANCIAL_TRANSACTION_ADJUSTED",
            entity: "Transaction",
            entityId: transaction.id,
            changes: {
              remediationTransactionId: createdTx.id,
              remediationReference: actionRef,
              reason: input.reason,
              walletType,
              delta,
              oldBalance: currentBalance,
              newBalance,
            } as any,
            status: "success",
            createdAt: new Date(),
          },
        });

        return createdTx;
      });

      return {
        success: true,
        action: input.action,
        remediationTransaction: created,
        walletType,
        delta,
        newBalance,
      };
    }),

  getFinancialCommandCenter: adminFinancialProcedure
    .input(
      z
        .object({
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
          search: z.string().trim().optional(),
          source: z.string().optional(),
          page: z.number().min(1).default(1),
          pageSize: z.number().min(10).max(100).default(25),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const dateTo = input?.dateTo ?? now;
      const dateFrom = input?.dateFrom ?? new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 25;
      const sourceFilter = (input?.source || "ALL").toUpperCase();
      const search = input?.search?.trim();

      const completedWhere = {
        status: "completed" as const,
        createdAt: { gte: dateFrom, lte: dateTo },
      };

      const grouped = await prisma.transaction.groupBy({
        by: ["transactionType"],
        where: completedWhere,
        _sum: { amount: true },
        _count: { _all: true },
      });

      const sourceMap = new Map<
        string,
        { source: string; inflow: number; outflow: number; count: number; net: number }
      >();

      let totalInflows = 0;
      let totalOutflows = 0;

      grouped.forEach((row) => {
        const amount = Number(row._sum.amount || 0);
        const absAmount = Math.abs(amount);
        const { direction, source } = classifyTransaction(row.transactionType);

        if (sourceFilter !== "ALL" && sourceFilter !== source) {
          return;
        }

        const current = sourceMap.get(source) || { source, inflow: 0, outflow: 0, count: 0, net: 0 };
        if (direction === "INFLOW") {
          current.inflow += absAmount;
          totalInflows += absAmount;
        } else if (direction === "OUTFLOW") {
          current.outflow += absAmount;
          totalOutflows += absAmount;
        }
        current.count += row._count._all;
        current.net = current.inflow - current.outflow;
        sourceMap.set(source, current);
      });

      const sourceBreakdown = Array.from(sourceMap.values()).sort((a, b) => b.count - a.count);

      const txWhere: any = {
        status: "completed",
        createdAt: { gte: dateFrom, lte: dateTo },
      };

      if (search) {
        txWhere.OR = [
          { transactionType: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
          { userId: { contains: search, mode: "insensitive" } },
          { User: { email: { contains: search, mode: "insensitive" } } },
          { User: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [ledgerTotal, ledgerItemsRaw] = await Promise.all([
        prisma.transaction.count({ where: txWhere }),
        prisma.transaction.findMany({
          where: txWhere,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            transactionType: true,
            amount: true,
            walletType: true,
            description: true,
            reference: true,
            createdAt: true,
            User: { select: { name: true, email: true } },
          },
        }),
      ]);

      const ledgerItems = ledgerItemsRaw
        .map((tx) => {
          const classified = classifyTransaction(tx.transactionType, tx.description);
          return {
            ...tx,
            direction: classified.direction,
            source: classified.source,
            absoluteAmount: Math.abs(Number(tx.amount || 0)),
          };
        })
        .filter((tx) => sourceFilter === "ALL" || tx.source === sourceFilter);

      const [
        pendingPayments,
        pendingWithdrawals,
        walletSums,
        negativeWalletUsers,
        cspRequests,
        cspContributionsRange,
        cspRecent,
        companyReserve,
        strategicPools,
        executiveWallet,
        pendingPoolDistributions,
      ] = await Promise.all([
        prisma.pendingPayment.count({ where: { status: "pending" } }),
        prisma.transaction.count({
          where: {
            status: "pending",
            transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT", "WITHDRAWAL_USDT"] },
          },
        }),
        prisma.user.aggregate({
          _sum: {
            wallet: true,
            spendable: true,
            cashback: true,
            community: true,
            shareholder: true,
            education: true,
            car: true,
            business: true,
            palliative: true,
            studentCashback: true,
            bpiTokenWallet: true,
          },
        }),
        prisma.user.count({
          where: {
            OR: [
              { wallet: { lt: 0 } },
              { spendable: { lt: 0 } },
              { community: { lt: 0 } },
              { shareholder: { lt: 0 } },
              { cashback: { lt: 0 } },
              { bpiTokenWallet: { lt: 0 } },
            ],
          },
        }),
        prisma.cspSupportRequest.aggregate({
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          _sum: { amount: true, raisedAmount: true, contributorsCount: true },
          _count: { _all: true },
        }),
        prisma.cspContribution.aggregate({
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.cspContribution.findMany({
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            amount: true,
            walletType: true,
            createdAt: true,
            Contributor: { select: { id: true, name: true, email: true } },
            Request: { select: { id: true, status: true, category: true, amount: true, raisedAmount: true } },
          },
        }),
        prisma.companyReserve.findFirst({
          orderBy: { updatedAt: "desc" },
          select: { balance: true, totalReceived: true, totalSpent: true, updatedAt: true },
        }),
        prisma.strategyPool.findMany({
          orderBy: { type: "asc" },
          select: {
            id: true,
            type: true,
            name: true,
            balance: true,
            isActive: true,
            distributionFrequency: true,
            lastDistributedAt: true,
            nextDistributionAt: true,
            _count: { select: { Members: { where: { isActive: true } } } },
          },
        }),
        prisma.executiveShareholder.aggregate({
          _sum: { currentBalance: true, totalEarned: true },
          _count: { _all: true },
        }),
        prisma.poolDistribution.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      ]);

      const walletSnapshot = {
        main: Number(walletSums._sum.wallet || 0),
        spendable: Number(walletSums._sum.spendable || 0),
        cashback: Number(walletSums._sum.cashback || 0),
        community: Number(walletSums._sum.community || 0),
        shareholder: Number(walletSums._sum.shareholder || 0),
        education: Number(walletSums._sum.education || 0),
        car: Number(walletSums._sum.car || 0),
        business: Number(walletSums._sum.business || 0),
        palliative: Number(walletSums._sum.palliative || 0),
        studentCashback: Number(walletSums._sum.studentCashback || 0),
        bpt: Number(walletSums._sum.bpiTokenWallet || 0),
      };

      const strategicPoolBalance = strategicPools.reduce((sum, p) => sum + Number(p.balance || 0), 0);

      const cspSnapshot = {
        requestsInRange: cspRequests._count._all,
        totalTargetAmount: Number(cspRequests._sum.amount || 0),
        totalRaisedAmount: Number(cspRequests._sum.raisedAmount || 0),
        totalContributors: Number(cspRequests._sum.contributorsCount || 0),
        contributionsAmountInRange: Number(cspContributionsRange._sum.amount || 0),
        contributionsCountInRange: cspContributionsRange._count._all,
        recentContributions: cspRecent,
      };

      const unresolvedItems = pendingPayments + pendingWithdrawals + pendingPoolDistributions;

      return {
        period: { from: dateFrom, to: dateTo },
        summary: {
          inflows: totalInflows,
          outflows: totalOutflows,
          netFlow: totalInflows - totalOutflows,
          netFlowClamped: Math.max(0, totalInflows - totalOutflows),
          ledgerCount: ledgerTotal,
          unresolvedItems,
          pendingPayments,
          pendingWithdrawals,
          pendingPoolDistributions,
          negativeWalletUsers,
        },
        sourceBreakdown,
        walletSnapshot,
        cspSnapshot,
        reserveSnapshot: {
          companyReserveBalance: Number(companyReserve?.balance || 0),
          totalReceived: Number(companyReserve?.totalReceived || 0),
          totalSpent: Number(companyReserve?.totalSpent || 0),
          updatedAt: companyReserve?.updatedAt || null,
          strategicPoolsBalance: strategicPoolBalance,
          executiveWalletBalance: Number(executiveWallet._sum.currentBalance || 0),
          executiveLifetimeEarned: Number(executiveWallet._sum.totalEarned || 0),
          executiveCount: executiveWallet._count._all,
          strategicPools,
        },
        ledger: {
          page,
          pageSize,
          total: ledgerTotal,
          items: ledgerItems,
        },
      };
    }),

  getUserFinancialTrace: adminFinancialProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().min(10).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const dateTo = input.dateTo ?? now;
      const dateFrom = input.dateFrom ?? new Date(dateTo.getTime() - 90 * 24 * 60 * 60 * 1000);

      const [user, transactions, pendingPayments, pendingWithdrawals, cspContributions] = await Promise.all([
        prisma.user.findUnique({
          where: { id: input.userId },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            wallet: true,
            spendable: true,
            cashback: true,
            community: true,
            shareholder: true,
            education: true,
            car: true,
            business: true,
            palliative: true,
            studentCashback: true,
            bpiTokenWallet: true,
            createdAt: true,
          },
        }),
        prisma.transaction.findMany({
          where: {
            userId: input.userId,
            createdAt: { gte: dateFrom, lte: dateTo },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            transactionType: true,
            amount: true,
            status: true,
            walletType: true,
            description: true,
            reference: true,
            createdAt: true,
          },
        }),
        prisma.pendingPayment.findMany({
          where: { userId: input.userId, status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, amount: true, transactionType: true, currency: true, createdAt: true },
        }),
        prisma.transaction.findMany({
          where: {
            userId: input.userId,
            status: "pending",
            transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT", "WITHDRAWAL_USDT"] },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, amount: true, transactionType: true, walletType: true, createdAt: true, description: true },
        }),
        prisma.cspContribution.findMany({
          where: { contributorId: input.userId, createdAt: { gte: dateFrom, lte: dateTo } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            walletType: true,
            createdAt: true,
            Request: { select: { id: true, status: true, category: true } },
          },
        }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      const sourceTotals = new Map<string, { source: string; inflow: number; outflow: number; net: number; count: number }>();
      let inflowTotal = 0;
      let outflowTotal = 0;

      const timeline = transactions.map((tx) => {
        const classified = classifyTransaction(tx.transactionType, tx.description);
        const absAmount = Math.abs(Number(tx.amount || 0));
        const item = sourceTotals.get(classified.source) || {
          source: classified.source,
          inflow: 0,
          outflow: 0,
          net: 0,
          count: 0,
        };

        if (classified.direction === "INFLOW") {
          item.inflow += absAmount;
          inflowTotal += absAmount;
        }
        if (classified.direction === "OUTFLOW") {
          item.outflow += absAmount;
          outflowTotal += absAmount;
        }

        item.count += 1;
        item.net = item.inflow - item.outflow;
        sourceTotals.set(classified.source, item);

        return {
          ...tx,
          direction: classified.direction,
          source: classified.source,
          absoluteAmount: absAmount,
        };
      });

      return {
        user,
        period: { from: dateFrom, to: dateTo },
        summary: {
          inflowTotal,
          outflowTotal,
          netFlow: inflowTotal - outflowTotal,
          transactionCount: timeline.length,
          pendingPaymentsCount: pendingPayments.length,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          cspContributionCount: cspContributions.length,
        },
        sourceTotals: Array.from(sourceTotals.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
        timeline,
        pendingPayments,
        pendingWithdrawals,
        cspContributions,
      };
    }),
});
