// Wallet Payment Gateway
import { randomUUID } from "crypto";
// Deducts from user's internal wallet balance

import { prisma } from "@/lib/prisma";
import {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
  PaymentStatus,
  GatewayConfig,
  WebhookPayload,
  WebhookValidationResult,
} from "./types";

export class WalletGateway implements IPaymentGateway {
  private config: GatewayConfig | null = null;

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return this.initiatePayment(request);
  }

  async initialize(config: GatewayConfig): Promise<void> {
    this.config = config;
    console.log("💰 Wallet Payment Gateway initialized");
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const { userId, amount, currency, purpose, metadata } = request;

    console.log("💰 Wallet Gateway: Processing payment", {
      userId,
      amount,
      currency,
      purpose,
    });

    // Only support NGN for now
    if (currency !== "NGN") {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount,
        currency,
        error: "Wallet only supports NGN currency",
        message: "Only Nigerian Naira (NGN) is supported for wallet payments",
      };
    }

    try {
      // Get user's current wallet balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          wallet: true,
          palliative: true,
          bpiTokenWallet: true,
        },
      });

      if (!user) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount,
          currency,
          error: "User not found",
          message: "User account not found",
        };
      }

      const currentBalance = user.wallet || 0;

      // Check sufficient balance
      if (currentBalance < amount) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount,
          currency,
          error: "Insufficient wallet balance",
          message: `Insufficient balance. You have ₦${currentBalance.toLocaleString()} but need ₦${amount.toLocaleString()}`,
          balanceAfter: currentBalance,
        };
      }

      // Deduct from wallet
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          wallet: {
            decrement: amount,
          },
        },
        select: {
          wallet: true,
        },
      });

      const newBalance = updatedUser.wallet || 0;

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "DEBIT",
          amount,
          description: `Payment for ${purpose} - ${metadata?.packageName || "Membership Package"}`,
          status: "COMPLETED",
          reference: `WALLET-${Date.now()}-${userId.substring(0, 8)}`,
        },
      });

      console.log("✅ Wallet Gateway: Payment successful", {
        transactionId: transaction.id,
        balanceAfter: newBalance,
      });

      return {
        success: true,
        status: PaymentStatus.SUCCESS,
        transactionId: transaction.id,
        gatewayReference: transaction.reference || undefined,
        amount,
        currency,
        balanceAfter: newBalance,
        message: `Payment successful. New balance: ₦${newBalance.toLocaleString()}`,
        metadata: {
          previousBalance: currentBalance,
          ...metadata,
        },
      };
    } catch (error) {
      console.error("❌ Wallet Gateway: Payment failed", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount,
        currency,
        error: error instanceof Error ? error.message : "Payment processing failed",
        message: "Failed to process wallet payment",
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    console.log("💰 Wallet Gateway: Verifying payment", { reference });

    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          reference,
          transactionType: "DEBIT",
        },
      });

      if (!transaction) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          transactionId: reference,
          reference: reference,
          amount: 0,
          currency: "NGN",
          error: "Transaction not found",
          message: "Wallet transaction not found",
        };
      }

      // Get user balance separately
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId },
        select: { wallet: true },
      });

      const status =
        transaction.status === "COMPLETED"
          ? PaymentStatus.SUCCESS
          : transaction.status === "PENDING"
          ? PaymentStatus.PENDING
          : PaymentStatus.FAILED;

      return {
        success: status === PaymentStatus.SUCCESS,
        status,
        transactionId: transaction.id,
        reference: transaction.reference || reference,
        gatewayReference: transaction.reference || undefined,
        amount: transaction.amount,
        currency: "NGN",
        balanceAfter: user?.wallet || 0,
        message:
          status === PaymentStatus.SUCCESS
            ? "Payment verified successfully"
            : "Payment verification failed",
      };
    } catch (error) {
      console.error("❌ Wallet Gateway: Verification failed", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        transactionId: reference,
        reference: reference,
        amount: 0,
        currency: "NGN",
        error: error instanceof Error ? error.message : "Verification failed",
        message: "Failed to verify wallet payment",
      };
    }
  }

  async validateWebhook(payload: WebhookPayload): Promise<WebhookValidationResult> {
    // Wallet payments don't use webhooks
    console.log("💰 Wallet Gateway: Webhook validation not applicable");
    return {
      isValid: false,
      error: "Wallet payments do not use webhooks",
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    console.log("💰 Wallet Gateway: Processing refund", { transactionId, amount });

    try {
      // Find original transaction
      const originalTransaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: {
          userId: true,
          amount: true,
          status: true,
          transactionType: true,
        },
      });

      if (!originalTransaction) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount: 0,
          currency: "NGN",
          error: "Original transaction not found",
          message: "Cannot refund: transaction not found",
        };
      }

      if (originalTransaction.transactionType !== "DEBIT") {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount: 0,
          currency: "NGN",
          error: "Cannot refund: not a debit transaction",
          message: "Only debit transactions can be refunded",
        };
      }

      const refundAmount = amount || originalTransaction.amount;

      // Credit back to wallet
      const updatedUser = await prisma.user.update({
        where: { id: originalTransaction.userId },
        data: {
          wallet: {
            increment: refundAmount,
          },
        },
        select: {
          wallet: true,
        },
      });

      // Create refund transaction record
      const refundTransaction = await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: originalTransaction.userId,
          transactionType: "REFUND",
          amount: refundAmount,
          description: `Refund for transaction ${transactionId}`,
          status: "COMPLETED",
          reference: `REFUND-${Date.now()}-${originalTransaction.userId.substring(0, 8)}`,
        },
      });

      console.log("✅ Wallet Gateway: Refund successful", {
        refundId: refundTransaction.id,
        balanceAfter: updatedUser.wallet,
      });

      return {
        success: true,
        status: PaymentStatus.REFUNDED,
        transactionId: refundTransaction.id,
        gatewayReference: refundTransaction.reference || undefined,
        amount: refundAmount,
        currency: "NGN",
        balanceAfter: updatedUser.wallet || 0,
        message: `Refund successful. ₦${refundAmount.toLocaleString()} credited to your wallet`,
        metadata: {
          originalTransactionId: transactionId,
        },
      };
    } catch (error) {
      console.error("❌ Wallet Gateway: Refund failed", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: "NGN",
        error: error instanceof Error ? error.message : "Refund processing failed",
        message: "Failed to process wallet refund",
      };
    }
  }
}
