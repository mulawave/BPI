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

const DEFAULT_USD_WITHDRAWAL_FEE = 2;

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
        currency: g.gatewayName === "crypto" ? "USD" : "NGN",
        displayOrder: g.displayOrder,
        updatedAt: now,
      })),
      skipDuplicates: true,
    });

    // Ensure crypto gateway currency is USD (fix legacy NGN rows)
    await ctx.prisma.paymentGatewayConfig.updateMany({
      where: { gatewayName: "crypto", currency: "NGN" },
      data: { currency: "USD" },
    });

    const gateways = await ctx.prisma.paymentGatewayConfig.findMany({
      where: { gatewayName: { in: ["paystack", "flutterwave", "mock", "crypto"] } },
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
   * Gateway health/config status for live readiness checks
   */
  getGatewayHealth: protectedProcedure.query(async ({ ctx }) => {
    const configs = await ctx.prisma.paymentGatewayConfig.findMany({
      where: { gatewayName: { in: ["paystack", "flutterwave"] } },
      select: {
        gatewayName: true,
        isActive: true,
        secretKey: true,
        publicKey: true,
      },
    });

    const byName = Object.fromEntries(configs.map((c) => [c.gatewayName, c]));

    const flutterwaveEnv = {
      publicKey: !!process.env.FLUTTERWAVE_PUBLIC_KEY,
      secretKey: !!process.env.FLUTTERWAVE_SECRET_KEY,
      encryptionKey: !!process.env.FLUTTERWAVE_ENCRYPTION_KEY,
    };

    const statuses = [
      {
        gateway: "wallet" as const,
        isActive: true,
        hasKeys: true,
        envConfigured: true,
        issues: [] as string[],
      },
      {
        gateway: "paystack" as const,
        isActive: byName.paystack?.isActive ?? false,
        hasKeys: !!byName.paystack?.secretKey,
        envConfigured: !!byName.paystack?.secretKey,
        issues: [] as string[],
      },
      {
        gateway: "flutterwave" as const,
        isActive: byName.flutterwave?.isActive ?? false,
        hasKeys: !!byName.flutterwave?.secretKey && !!byName.flutterwave?.publicKey,
        envConfigured: flutterwaveEnv.publicKey && flutterwaveEnv.secretKey,
        issues: [] as string[],
      },
    ];

    statuses.forEach((s) => {
      if (!s.isActive) s.issues.push("Gateway is inactive in DB config");
      if (!s.hasKeys) s.issues.push("Missing gateway keys in DB config");
      if (!s.envConfigured) s.issues.push("Missing required environment keys");
    });

    return statuses;
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
        paymentMethod:
          input.gateway === PaymentGateway.WALLET
            ? "wallet"
            : input.gateway === PaymentGateway.FLUTTERWAVE
              ? "flutterwave"
              : input.gateway === PaymentGateway.PAYSTACK
                ? "paystack"
                : "mock",
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

      if (transaction.status === "completed") {
        throw new Error("This transaction is already completed and cannot be retried");
      }

      if (transaction.status !== "failed" && transaction.status !== "pending") {
        throw new Error(`Transaction in '${transaction.status}' status cannot be retried`);
      }

      // Find the associated PendingPayment to determine gateway and metadata
      const pendingPayment = await ctx.prisma.pendingPayment.findFirst({
        where: {
          userId,
          gatewayReference: transaction.reference,
        },
      });

      if (!pendingPayment) {
        throw new Error("No pending payment record found for this transaction. Please initiate a new payment instead.");
      }

      if (pendingPayment.status === "approved" || pendingPayment.status === "completed") {
        throw new Error("This payment has already been approved");
      }

      const meta = (pendingPayment.metadata as any) || {};
      const gateway = pendingPayment.paymentMethod;

      // Only external gateways (paystack/flutterwave) can be retried
      if (gateway !== "paystack" && gateway !== "flutterwave") {
        throw new Error(`Payments via '${gateway}' cannot be retried. Please initiate a new payment.`);
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user) throw new Error("User not found");

      const gatewayEnum = gateway === "paystack" ? PaymentGateway.PAYSTACK : PaymentGateway.FLUTTERWAVE;

      // Re-initiate payment through the same gateway
      const result = await PaymentProcessor.processPayment({
        userId,
        email: user.email || "",
        name: user.name || "",
        paymentMethod: gateway,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        gateway: gatewayEnum,
        purpose: pendingPayment.transactionType,
        packageId: meta.packageId || "unknown",
        metadata: meta,
      });

      if (!result.success) {
        throw new Error(result.error || result.message || "Payment retry failed");
      }

      const newReference = result.transactionId || result.reference || result.gatewayReference || `RETRY-${gateway}-${Date.now()}`;

      // Update existing records with new reference
      await ctx.prisma.$transaction([
        ctx.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "pending",
            reference: newReference,
            description: `${transaction.description} (retry)`,
          },
        }),
        ctx.prisma.pendingPayment.update({
          where: { id: pendingPayment.id },
          data: {
            status: "pending",
            gatewayReference: newReference,
            reviewNotes: `Retried at ${new Date().toISOString()} — original ref: ${transaction.reference}`,
            updatedAt: new Date(),
          },
        }),
      ]);

      return {
        success: true,
        paymentUrl: result.paymentUrl,
        reference: newReference,
        message: "Payment re-initiated. Please complete the payment.",
      };
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

  /**
   * Get manual crypto transfer settings.
   * This admin-configured address/network is separate from provider-generated Basqet payment addresses.
   */
  getCryptoDepositInfo: protectedProcedure.query(async ({ ctx }) => {
    const cryptoGateway = await ctx.prisma.paymentGatewayConfig.findUnique({
      where: { gatewayName: "crypto" },
      select: {
        isActive: true,
        cryptoDepositAddress: true,
        cryptoNetwork: true,
        tokenName: true,
        tokenSymbol: true,
        apiProvider: true,
      },
    });

    const feeSetting = await ctx.prisma.adminSettings.findUnique({
      where: { settingKey: "USD_WITHDRAWAL_FEE" },
      select: { settingValue: true },
    });
    const feeUsd = feeSetting ? parseFloat(feeSetting.settingValue) : DEFAULT_USD_WITHDRAWAL_FEE;

    if (!cryptoGateway || !cryptoGateway.isActive || !cryptoGateway.cryptoDepositAddress) {
      return { available: false as const, depositAddress: null, network: null, tokenName: null, tokenSymbol: null, apiProvider: null, feeUsd };
    }

    return {
      available: true as const,
      mode: "manual" as const,
      depositAddress: cryptoGateway.cryptoDepositAddress,
      network: cryptoGateway.cryptoNetwork || "TRC-20",
      tokenName: cryptoGateway.tokenName || "USDT",
      tokenSymbol: cryptoGateway.tokenSymbol || "USDT",
      apiProvider: cryptoGateway.apiProvider?.toLowerCase() || null,
      feeUsd,
    };
  }),

  /**
   * Submit crypto transaction hash for admin verification.
   * Creates a PendingPayment record with the tx hash as proof.
   */
  submitCryptoProof: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.string().default("USDT"),
        purpose: z.nativeEnum(PaymentPurpose),
        txHash: z.string().min(10, "Transaction hash is required"),
        packageId: z.string().optional(),
        isUpgrade: z.boolean().optional(),
        fromPackageId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;

      // Validate that crypto gateway is active and has an address
      const cryptoGateway = await ctx.prisma.paymentGatewayConfig.findUnique({
        where: { gatewayName: "crypto" },
        select: { isActive: true, cryptoDepositAddress: true, cryptoNetwork: true },
      });

      if (!cryptoGateway?.isActive || !cryptoGateway.cryptoDepositAddress) {
        throw new Error("Crypto payments are not currently available");
      }

      // Prevent duplicate submission of same tx hash
      const existingWithHash = await ctx.prisma.pendingPayment.findFirst({
        where: {
          paymentMethod: "crypto",
          proofOfPayment: input.txHash,
          status: { in: ["pending", "approved"] },
        },
      });
      if (existingWithHash) {
        throw new Error("This transaction hash has already been submitted");
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h for crypto

      const gatewayReference = `CRYPTO-${Date.now()}-${userId.substring(0, 8)}`;

      const created = await ctx.prisma.pendingPayment.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: input.purpose,
          amount: input.amount,
          currency: input.currency,
          paymentMethod: "crypto",
          gatewayReference,
          status: "pending",
          proofOfPayment: input.txHash,
          metadata: {
            packageId: input.packageId,
            isUpgrade: input.isUpgrade,
            fromPackageId: input.fromPackageId,
            txHash: input.txHash,
            network: cryptoGateway.cryptoNetwork || "TRC-20",
            depositAddress: cryptoGateway.cryptoDepositAddress,
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
        message: "Transaction hash submitted. Awaiting admin verification.",
      };
    }),
});
