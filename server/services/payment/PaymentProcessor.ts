// Main Payment Processor
// Orchestrates payment processing across different gateways

import { prisma } from "@/lib/prisma";
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
    // TODO: Implement user location detection (Nigerian vs International)

    const configs = await prisma.paymentGatewayConfig.findMany({
      where: { gatewayName: { in: ["paystack", "flutterwave"] } },
      select: { gatewayName: true, isActive: true, publicKey: true, secretKey: true },
    });

    const configByName = Object.fromEntries(configs.map((c) => [c.gatewayName, c]));

    const paystackConfig = configByName.paystack;
    const flutterwaveConfig = configByName.flutterwave;

    const paystackEnabled =
      (paystackConfig?.isActive && !!paystackConfig?.secretKey) ||
      (!!process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV !== "production");

    const flutterwaveEnabled =
      (flutterwaveConfig?.isActive && !!flutterwaveConfig?.secretKey && !!flutterwaveConfig?.publicKey) ||
      (!!process.env.FLUTTERWAVE_SECRET_KEY && !!process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.NODE_ENV !== "production");

    const gateways: Array<{ id: PaymentGateway; enabled: boolean }> = [
      { id: PaymentGateway.WALLET, enabled: true },
      { id: PaymentGateway.PAYSTACK, enabled: paystackEnabled },
      { id: PaymentGateway.FLUTTERWAVE, enabled: flutterwaveEnabled },
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
    // TODO: Fetch from database payment_gateways table
    // For now, return mock configuration

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
        webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || "myngul.com22",
        features: {
          paymentMethods: ["card", "banktransfer", "ussd", "account"],
          encryptionKey,
        },
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

      // TODO: Implement refundPayment in IPaymentGateway interface
      throw new Error("Refund functionality not yet implemented in gateway interface");
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
      // TODO: Create payment_transactions table entry
      // For now, just log to console
      console.log("📝 Payment log:", {
        userId: request.userId,
        gateway: request.gateway,
        amount: request.amount,
        currency: request.currency,
        status: response.status,
        success: response.success,
        transactionId: response.transactionId,
        purpose: request.purpose,
      });

      // This will be implemented when payment_transactions table is created
      // await prisma.paymentTransaction.create({
      //   data: {
      //     userId: request.userId,
      //     gateway: request.gateway,
      //     amount: request.amount,
      //     currency: request.currency,
      //     status: response.status,
      //     gatewayReference: response.gatewayReference,
      //     purpose: request.purpose,
      //     metadata: {
      //       request: request.metadata,
      //       response: response.metadata,
      //     },
      //   },
      // });
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
    // Get user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wallet: true },
    });

    const walletBalance = user?.wallet || 0;

    // Recommend wallet if sufficient balance
    if (walletBalance >= amount) {
      return PaymentGateway.WALLET;
    }

    // TODO: Detect if Nigerian user → recommend Flutterwave
    // TODO: Detect if International user → recommend Flutterwave multi-currency

    // Default to Flutterwave for card/bank rails in other cases
    return PaymentGateway.FLUTTERWAVE;
  }
}
