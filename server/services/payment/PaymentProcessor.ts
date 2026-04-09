// Main Payment Processor
// Orchestrates payment processing across different gateways

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  GatewayConfig,
  PaymentGateway,
} from "./types";
import { PaymentGatewayFactory } from "./PaymentGatewayFactory";

export class PaymentProcessor {
  /**
   * Get available payment gateways for a user
   */
  static async getAvailableGateways(userId: string): Promise<PaymentGateway[]> {
    // Gateway selection is UI-driven; this returns all enabled gateways.

    const configs = await prisma.paymentGatewayConfig.findMany({
      where: { gatewayName: { in: ["paystack", "flutterwave", "bank-transfer", "crypto", "utility-token"] } },
      select: { gatewayName: true, isActive: true, publicKey: true, secretKey: true, cryptoPublicKey: true, currentPriceNgn: true },
    });

    const configByName = Object.fromEntries(configs.map((c) => [c.gatewayName, c]));

    const paystackConfig = configByName.paystack;
    const flutterwaveConfig = configByName.flutterwave;
    const bankTransferConfig = configByName["bank-transfer"];
    const cryptoConfig = configByName.crypto;
    const utilityTokenConfig = configByName["utility-token"];

    const paystackEnabled =
      (paystackConfig?.isActive && !!paystackConfig?.secretKey) ||
      (!!process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV !== "production");

    const flutterwaveEnabled =
      (flutterwaveConfig?.isActive && !!flutterwaveConfig?.secretKey && !!flutterwaveConfig?.publicKey) ||
      (!!process.env.FLUTTERWAVE_SECRET_KEY && !!process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.NODE_ENV !== "production");

    // Bank transfer uses Paystack under the hood — requires Paystack secret key
    const bankTransferEnabled =
      bankTransferConfig?.isActive !== false && paystackEnabled;

    // Crypto requires provider API key
    const cryptoEnabled =
      cryptoConfig?.isActive === true &&
      !!(cryptoConfig?.publicKey || cryptoConfig?.cryptoPublicKey);

    // Utility token requires admin-set pricing
    const utilityTokenEnabled =
      utilityTokenConfig?.isActive === true &&
      !!utilityTokenConfig?.currentPriceNgn &&
      utilityTokenConfig.currentPriceNgn > 0;

    const gateways: Array<{ id: PaymentGateway; enabled: boolean }> = [
      { id: PaymentGateway.WALLET, enabled: true },
      { id: PaymentGateway.PAYSTACK, enabled: paystackEnabled },
      { id: PaymentGateway.FLUTTERWAVE, enabled: flutterwaveEnabled },
      { id: PaymentGateway.BANK_TRANSFER, enabled: bankTransferEnabled },
      { id: PaymentGateway.CRYPTO, enabled: cryptoEnabled },
      { id: PaymentGateway.UTILITY_TOKEN, enabled: utilityTokenEnabled },
    ];

    if (process.env.NODE_ENV !== "production") {
      gateways.push({ id: PaymentGateway.MOCK_DEV, enabled: true });
    }

    return gateways.filter((g) => g.enabled).map((g) => g.id);
  }

  /**
   * Get gateway configuration from database
   */
  private static async getGatewayConfig(gateway: PaymentGateway): Promise<GatewayConfig> {
    // MOCK_DEV and WALLET use static config; Paystack/Flutterwave read from DB with env fallback.

    if (gateway === PaymentGateway.MOCK_DEV) {
      if (process.env.NODE_ENV === "production") {
        return { enabled: false, environment: "live" };
      }
      return {
        enabled: true,
        environment: "test",
        features: {
          processingDelay: 2, // seconds
          randomFailureRate: 0, // percentage
        },
      };
    }

    if (gateway === PaymentGateway.WALLET) {
      return {
        enabled: true,
        environment: "live",
      };
    }

    if (gateway === PaymentGateway.PAYSTACK) {
      const dbConfig = await prisma.paymentGatewayConfig.findUnique({
        where: { gatewayName: "paystack" },
        select: { isActive: true, secretKey: true, publicKey: true, callbackUrl: true },
      });

      const secretKey = dbConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY;
      const enabled = !!secretKey && (dbConfig ? dbConfig.isActive : process.env.NODE_ENV !== "production");

      return {
        enabled,
        environment: (process.env.PAYSTACK_ENV as "test" | "live") || "test",
        secretKey,
        publicKey: dbConfig?.publicKey || undefined,
        features: {
          paymentMethods: ["card", "banktransfer", "ussd"],
        },
      };
    }

    if (gateway === PaymentGateway.FLUTTERWAVE) {
      const dbConfig = await prisma.paymentGatewayConfig.findUnique({
        where: { gatewayName: "flutterwave" },
        select: { isActive: true, publicKey: true, secretKey: true },
      });

      const publicKey = dbConfig?.publicKey || process.env.FLUTTERWAVE_PUBLIC_KEY;
      const secretKey = dbConfig?.secretKey || process.env.FLUTTERWAVE_SECRET_KEY;
      const encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
      const enabled = !!publicKey && !!secretKey && (dbConfig ? dbConfig.isActive : process.env.NODE_ENV !== "production");

      return {
        enabled,
        environment: (process.env.FLUTTERWAVE_ENV as "test" | "live") || "test",
        publicKey,
        secretKey,
        webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
        features: {
          paymentMethods: ["card", "banktransfer", "ussd", "account"],
          encryptionKey,
        },
      };
    }

    // Bank Transfer uses Paystack under the hood (channels: ["bank_transfer"])
    if (gateway === PaymentGateway.BANK_TRANSFER) {
      const dbConfig = await prisma.paymentGatewayConfig.findUnique({
        where: { gatewayName: "paystack" },
        select: { isActive: true, secretKey: true, publicKey: true },
      });

      const secretKey = dbConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY;
      const enabled = !!secretKey && (dbConfig ? dbConfig.isActive : process.env.NODE_ENV !== "production");

      return {
        enabled,
        environment: (process.env.PAYSTACK_ENV as "test" | "live") || "test",
        secretKey,
        publicKey: dbConfig?.publicKey || undefined,
        features: { paymentMethods: ["bank_transfer"] },
      };
    }

    // Crypto gateway — keys from crypto-specific fields or generic fields
    if (gateway === PaymentGateway.CRYPTO) {
      const dbConfig = await prisma.paymentGatewayConfig.findUnique({
        where: { gatewayName: "crypto" },
        select: { isActive: true, publicKey: true, secretKey: true, cryptoPublicKey: true, cryptoSecretKey: true, apiProvider: true },
      });

      const publicKey = dbConfig?.cryptoPublicKey || dbConfig?.publicKey;
      const secretKey = dbConfig?.cryptoSecretKey || dbConfig?.secretKey;
      const enabled = dbConfig?.isActive === true && !!publicKey;

      return {
        enabled,
        environment: "live",
        publicKey: publicKey || undefined,
        secretKey: secretKey || undefined,
        features: { paymentMethods: ["crypto"] },
      };
    }

    // Utility Token — fully internal, no external keys needed
    if (gateway === PaymentGateway.UTILITY_TOKEN) {
      const dbConfig = await prisma.paymentGatewayConfig.findUnique({
        where: { gatewayName: "utility-token" },
        select: { isActive: true, currentPriceNgn: true },
      });

      const enabled = dbConfig?.isActive === true && !!dbConfig?.currentPriceNgn && dbConfig.currentPriceNgn > 0;

      return {
        enabled,
        environment: "live",
      };
    }

    // Default config
    return {
      enabled: false,
      environment: "test",
    };
  }

  /**
   * Process a payment through specified gateway
   */
  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log("💳 Payment Processor: Processing payment", {
      gateway: request.gateway,
      amount: request.amount,
      currency: request.currency,
      purpose: request.purpose,
    });

    try {
      // Get gateway configuration
      const config = await this.getGatewayConfig(request.gateway!);

      // Get gateway instance from factory
      const gateway = await PaymentGatewayFactory.getGateway(request.gateway!, config);

      // Initiate payment
      const response = await gateway.initializePayment(request);

      // Log payment attempt
      await this.logPaymentAttempt(request, response);

      console.log("💳 Payment Processor: Payment result", {
        success: response.success,
        status: response.status,
        transactionId: response.transactionId,
      });

      return response;
    } catch (error) {
      console.error("❌ Payment Processor: Payment failed", error);

      const errorResponse: PaymentResponse = {
        success: false,
        status: PaymentStatus.FAILED,
        amount: request.amount,
        currency: request.currency,
        error: error instanceof Error ? error.message : "Payment processing failed",
        message: "An error occurred while processing your payment",
      };

      // Log failed attempt
      await this.logPaymentAttempt(request, errorResponse);

      return errorResponse;
    }
  }

  /**
   * Verify a payment transaction
   */
  static async verifyPayment(
    gateway: PaymentGateway,
    reference: string
  ): Promise<PaymentResponse> {
    console.log("🔍 Payment Processor: Verifying payment", { gateway, reference });

    try {
      const config = await this.getGatewayConfig(gateway);
      const gatewayInstance = await PaymentGatewayFactory.getGateway(gateway, config);

      const response = await gatewayInstance.verifyPayment(reference);

      console.log("🔍 Payment Processor: Verification result", {
        success: response.success,
        status: response.status,
      });

      return response;
    } catch (error) {
      console.error("❌ Payment Processor: Verification failed", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: "NGN",
        error: error instanceof Error ? error.message : "Verification failed",
        message: "Failed to verify payment",
      };
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    gateway: PaymentGateway,
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResponse> {
    console.log("🔄 Payment Processor: Processing refund", {
      gateway,
      transactionId,
      amount,
      reason,
    });

    try {
      const config = await this.getGatewayConfig(gateway);
      const gatewayInstance = await PaymentGatewayFactory.getGateway(gateway, config);

      if (!gatewayInstance.refundPayment) {
        throw new Error(`Refund is not supported by the ${gateway} gateway`);
      }

      const response = await gatewayInstance.refundPayment(transactionId, amount);

      console.log("🔄 Payment Processor: Refund result", {
        success: response.success,
        status: response.status,
      });

      return response;
    } catch (error) {
      console.error("❌ Payment Processor: Refund failed", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: amount || 0,
        currency: "NGN",
        error: error instanceof Error ? error.message : "Refund processing failed",
        message: "Failed to process refund",
      };
    }
  }

  /**
   * Log payment attempt to database
   */
  private static async logPaymentAttempt(
    request: PaymentRequest,
    response: PaymentResponse
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: request.userId || "system",
          action: response.success ? "PAYMENT_INITIATED" : "PAYMENT_FAILED",
          entity: "Payment",
          entityId: response.transactionId || response.gatewayReference || "unknown",
          changes: JSON.stringify({
            gateway: request.gateway,
            amount: request.amount,
            currency: request.currency,
            purpose: request.purpose,
            status: response.status,
            success: response.success,
            error: response.error,
          }),
          status: response.success ? "success" : "error",
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error("❌ Failed to log payment attempt:", error);
      // Don't throw - logging failure shouldn't affect payment
    }
  }

  /**
   * Get recommended gateway for user
   */
  static async getRecommendedGateway(
    userId: string,
    amount: number
  ): Promise<PaymentGateway> {
    // Get user's wallet balance and country for geo-based selection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wallet: true, country: true, countryId: true },
    });

    const walletBalance = user?.wallet || 0;

    // Recommend wallet if sufficient balance
    if (walletBalance >= amount) {
      return PaymentGateway.WALLET;
    }

    // Geo-based gateway selection: Nigerian users get Paystack (lower fees),
    // international users get Flutterwave (multi-currency support).
    const userCountry = user?.country?.toLowerCase().trim() ?? "";
    const isNigerian =
      userCountry === "nigeria" ||
      userCountry === "ng" ||
      user?.countryId === 161; // Nigeria country ID in the lookup table

    if (isNigerian) {
      // Prefer Paystack for Nigerian users (lower transaction fees)
      return PaymentGateway.PAYSTACK;
    }

    // Default to Flutterwave for international users (multi-currency)
    return PaymentGateway.FLUTTERWAVE;
  }
}
