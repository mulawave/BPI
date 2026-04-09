// Utility Token Gateway — PACT (BeepaGro utility token on BSC)
// Admin-managed NGN/USD pricing via PaymentGatewayConfig fields.
// Payment flow: debit user's bpiTokenWallet at the admin-set rate → credit main wallet.
// Similar to WalletGateway but operates on the token balance.

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import {
  GatewayConfig,
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentVerification,
} from "./types";

export class UtilityTokenGateway implements IPaymentGateway {
  async initialize(_config: GatewayConfig) {
    // No external API keys needed — fully internal
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const { userId, amount } = request;

    if (!userId) {
      return { success: false, status: PaymentStatus.FAILED, error: "User ID is required", message: "Authentication required" };
    }

    // 1. Get admin-set token price from DB
    const config = await prisma.paymentGatewayConfig.findFirst({
      where: { gatewayName: "utility-token", isActive: true },
      select: {
        currentPriceNgn: true,
        currentPriceUsd: true,
        tokenName: true,
        tokenSymbol: true,
      },
    });

    if (!config?.currentPriceNgn || config.currentPriceNgn <= 0) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        error: "Token pricing not configured",
        message: "Utility token pricing has not been set by the admin. Please contact support.",
      };
    }

    const tokenPriceNgn = config.currentPriceNgn;
    const tokenSymbol = config.tokenSymbol || "PACT";
    const tokensRequired = amount / tokenPriceNgn;

    // 2. Check user's token balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bpiTokenWallet: true },
    });

    if (!user) {
      return { success: false, status: PaymentStatus.FAILED, error: "User not found", message: "User account not found" };
    }

    if (user.bpiTokenWallet < tokensRequired) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        error: "Insufficient token balance",
        message: `You need ${tokensRequired.toFixed(4)} ${tokenSymbol} but only have ${user.bpiTokenWallet.toFixed(4)} ${tokenSymbol}. Current rate: ₦${tokenPriceNgn.toLocaleString()} per ${tokenSymbol}.`,
      };
    }

    const reference = `TOKEN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const txId = randomUUID();

    // 3. Atomic operation: debit tokens + credit wallet + record transactions
    try {
      // Use Prisma batch transaction (array form) for atomicity
      await prisma.$transaction([
        // Debit token wallet
        prisma.user.update({
          where: { id: userId },
          data: { bpiTokenWallet: { decrement: tokensRequired } },
        }),
        // Credit main NGN wallet
        prisma.user.update({
          where: { id: userId },
          data: { wallet: { increment: amount } },
        }),
        // Record token transaction
        prisma.tokenTransaction.create({
          data: {
            id: txId,
            userId,
            transactionType: "TOKEN_PAYMENT",
            grossAmount: tokensRequired,
            memberAmount: tokensRequired,
            buyBackAmount: 0,
            source: "DEPOSIT",
            sourceId: reference,
            description: `Paid ${tokensRequired.toFixed(4)} ${tokenSymbol} for ₦${amount.toLocaleString()} deposit`,
          },
        }),
        // Record NGN deposit transaction
        prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount,
            description: `Wallet deposit via ${tokenSymbol} token (${tokensRequired.toFixed(4)} ${tokenSymbol} @ ₦${tokenPriceNgn.toLocaleString()})`,
            status: "completed",
            reference,
            walletType: "main",
          },
        }),
      ]);

      return {
        success: true,
        status: PaymentStatus.SUCCESS,
        transactionId: txId,
        reference,
        amount,
        currency: "NGN",
        message: `Successfully deposited ₦${amount.toLocaleString()} using ${tokensRequired.toFixed(4)} ${tokenSymbol}`,
        metadata: {
          tokenSymbol,
          tokensUsed: tokensRequired,
          tokenPriceNgn,
          newTokenBalance: user.bpiTokenWallet - tokensRequired,
        },
      };
    } catch (error) {
      console.error("[UtilityTokenGateway] Payment failed:", error);
      return {
        success: false,
        status: PaymentStatus.FAILED,
        error: error instanceof Error ? error.message : "Token payment failed",
        message: "Failed to process token payment. Please try again.",
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // Token payments are instant (internal ledger), so verification checks the transaction record
    const tx = await prisma.transaction.findFirst({
      where: { reference },
      select: { id: true, amount: true, status: true, reference: true },
    });

    if (!tx) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        transactionId: reference,
        amount: 0,
        reference,
        message: "Transaction not found",
      };
    }

    return {
      success: tx.status === "completed",
      status: tx.status === "completed" ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
      transactionId: tx.id,
      amount: tx.amount,
      reference: tx.reference ?? reference,
      currency: "NGN",
      message: tx.status === "completed" ? "Token payment verified" : "Payment pending",
    };
  }
}
