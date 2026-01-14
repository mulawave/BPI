// Payment tRPC Router
// User-facing payment operations

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  PaymentProcessor,
  PaymentGateway,
  PaymentPurpose,
} from "../../services/payment";
import { randomUUID } from "crypto";

export const paymentRouter = createTRPCRouter({
  /**
   * Get payment gateway configuration from live DB.
   * Creates default gateway rows (inactive) if missing.
   */
  getPaymentGateways: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const defaultGateways = [
      {
        gatewayName: "paystack",
        displayName: "Paystack",
        provider: "paystack",
        displayOrder: 10,
      },
      {
        gatewayName: "flutterwave",
        displayName: "Flutterwave",
        provider: "flutterwave",
        displayOrder: 20,
      },
      {
        gatewayName: "bank-transfer",
        displayName: "Bank Transfer",
        provider: "bank-transfer",
        displayOrder: 30,
      },
      {
        gatewayName: "utility-token",
        displayName: "Utility Token",
        provider: "utility-token",
        displayOrder: 40,
      },
      {
        gatewayName: "crypto",
        displayName: "Crypto",
        provider: "crypto",
        displayOrder: 50,
      },
      {
        gatewayName: "mock",
        displayName: "Mock",
        provider: "mock",
        displayOrder: 60,
      },
    ];

    await ctx.prisma.paymentGatewayConfig.createMany({
      data: defaultGateways.map((g) => ({
        id: randomUUID(),
        gatewayName: g.gatewayName,
        displayName: g.displayName,
        provider: g.provider,
        isActive: false,
        supportedMethods: [],
        currency: "NGN",
        displayOrder: g.displayOrder,
        updatedAt: now,
      })),
      skipDuplicates: true,
    });

    const gateways = await ctx.prisma.paymentGatewayConfig.findMany({
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        gatewayName: true,
        displayName: true,
        provider: true,
        isActive: true,
        displayOrder: true,
      },
    });

    return gateways;
  }),

  /**
   * Get available payment methods for the current user
   */
  getAvailableMethods: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        purpose: z.nativeEnum(PaymentPurpose),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;

      // Get all available gateways
      const gateways = await PaymentProcessor.getAvailableGateways(userId);

      // Get recommended gateway
      const recommended = await PaymentProcessor.getRecommendedGateway(
        userId,
        input.amount
      );

      // Get user wallet balance for display
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          wallet: true,
          palliative: true,
          bpiTokenWallet: true,
        },
      });

      return {
        gateways,
        recommended,
        walletBalance: {
          cash: user?.wallet || 0,
          palliative: user?.palliative || 0,
          bpiToken: user?.bpiTokenWallet || 0,
        },
      };
    }),

  /**
   * Initiate a payment
   */
  initiatePayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.string().default("NGN"),
        gateway: z.nativeEnum(PaymentGateway),
        purpose: z.nativeEnum(PaymentPurpose),
        packageId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      const userEmail = ctx.session!.user?.email || "no-email@example.com";
      const userName = ctx.session!.user?.name || "Unknown User";

      const result = await PaymentProcessor.processPayment({
        userId,
        email: userEmail,
        name: userName,
        paymentMethod: input.gateway === PaymentGateway.WALLET ? "wallet" : 
                       input.gateway === PaymentGateway.FLUTTERWAVE ? "flutterwave" : "mock",
        amount: input.amount,
        currency: input.currency,
        gateway: input.gateway,
        purpose: input.purpose.toString(),
        packageId: input.packageId || "unknown",
        metadata: input.metadata,
      });

      return result;
    }),

  /**
   * Verify a payment transaction
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        gateway: z.nativeEnum(PaymentGateway),
        reference: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await PaymentProcessor.verifyPayment(
        input.gateway,
        input.reference
      );

      return result;
    }),

  /**
   * Get user's payment transaction history
   */
  getMyTransactions: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;

      // Get transactions from database
      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: (input.page - 1) * input.limit,
      });

      const total = await ctx.prisma.transaction.count({
        where: { userId },
      });

      return {
        transactions,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Retry a failed payment
   */
  retryFailedPayment: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;

      // Get original transaction
      const transaction = await ctx.prisma.transaction.findFirst({
        where: {
          id: input.transactionId,
          userId,
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // TODO: Extract payment details from transaction and retry
      // For now, return error
      throw new Error("Payment retry not yet implemented");
    }),

  /**
   * Submit proof of payment for a bank transfer.
   * Creates a PendingPayment record for admin verification.
   */
  submitBankTransferProof: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.string().default("NGN"),
        purpose: z.nativeEnum(PaymentPurpose),
        packageId: z.string().optional(),
        isUpgrade: z.boolean().optional(),
        fromPackageId: z.string().optional(),
        proofUrl: z.string().min(1),
        reference: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const gatewayReference =
        input.reference || `BANK-${Date.now()}-${userId.substring(0, 8)}`;

      const created = await ctx.prisma.pendingPayment.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: input.purpose,
          amount: input.amount,
          currency: input.currency,
          paymentMethod: "bank-transfer",
          gatewayReference,
          status: "pending",
          proofOfPayment: input.proofUrl,
          metadata: {
            packageId: input.packageId,
            isUpgrade: input.isUpgrade,
            fromPackageId: input.fromPackageId,
            ...input.metadata,
          },
          expiresAt,
          updatedAt: now,
        },
      });

      return {
        success: true,
        pendingPaymentId: created.id,
        gatewayReference,
        message: "Proof submitted. Awaiting admin verification.",
      };
    }),
});
