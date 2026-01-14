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
    // TODO: Fetch gateway configurations from database
    // TODO: Filter based on enabled status and user location

    // For now, return available gateways
    const availableGateways: PaymentGateway[] = [
      PaymentGateway.WALLET,
      PaymentGateway.FLUTTERWAVE,
      PaymentGateway.MOCK_DEV,
    ];

    return availableGateways;
  }

  /**
   * Get gateway configuration from database
   */
  private static async getGatewayConfig(gateway: PaymentGateway): Promise<GatewayConfig> {
    // TODO: Fetch from database payment_gateways table
    // For now, return mock configuration

    if (gateway === PaymentGateway.MOCK_DEV) {
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

    if (gateway === PaymentGateway.FLUTTERWAVE) {
      return {
        enabled: true,
        environment: (process.env.FLUTTERWAVE_ENV as "test" | "live") || "test",
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
        webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || "myngul.com22",
        features: {
          paymentMethods: ["card", "banktransfer", "ussd", "account"],
          encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
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

    // TODO: Detect if Nigerian user → recommend Flutterwave/Paystack
    // TODO: Detect if International user → recommend Flutterwave multi-currency

    // Default to mock dev for testing
    return PaymentGateway.MOCK_DEV;
  }
}
