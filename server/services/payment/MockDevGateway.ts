// Mock Development Payment Gateway
// Auto-approves all payments for testing without real API calls

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

export class MockDevGateway implements IPaymentGateway {
  private config: GatewayConfig | null = null;
  private processingDelayMs = 2000; // 2 second delay
  private randomFailureRate = 0; // 0% failure rate by default

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return this.initiatePayment(request);
  }

  async initialize(config: GatewayConfig): Promise<void> {
    this.config = config;
    
    // Extract mock-specific settings from config
    if (config.features?.processingDelay) {
      this.processingDelayMs = config.features.processingDelay * 1000;
    }
    
    if (config.features?.randomFailureRate) {
      this.randomFailureRate = config.features.randomFailureRate;
    }

    console.log("🧪 Mock Dev Payment Gateway initialized");
    console.log(`⏱️  Processing delay: ${this.processingDelayMs}ms`);
    console.log(`❌ Random failure rate: ${this.randomFailureRate}%`);
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log("🧪 Mock Dev Gateway: Initiating payment", {
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
      purpose: request.purpose,
    });

    // Simulate processing delay
    await this.delay(this.processingDelayMs);

    // Simulate random failures for testing error handling
    if (this.shouldSimulateFailure()) {
      console.log("❌ Mock Dev Gateway: Simulating random failure");
      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: request.amount,
        currency: request.currency,
        error: "Mock payment randomly failed for testing purposes",
        message: "Payment failed (simulated error)",
      };
    }

    // Generate mock transaction reference
    const mockReference = `MOCK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    console.log("✅ Mock Dev Gateway: Payment auto-approved", { reference: mockReference });

    return {
      success: true,
      status: PaymentStatus.SUCCESS,
      transactionId: mockReference,
      gatewayReference: mockReference,
      amount: request.amount,
      currency: request.currency,
      message: "Payment successful (TEST MODE)",
      metadata: {
        testMode: true,
        timestamp: new Date().toISOString(),
        ...request.metadata,
      },
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    console.log("🧪 Mock Dev Gateway: Verifying payment", { reference });

    // Simulate processing delay
    await this.delay(500);

    // Check if it's a mock reference
    if (!reference.startsWith("MOCK-")) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        transactionId: reference,
        reference: reference,
        amount: 0,
        currency: "NGN",
        error: "Invalid mock reference",
        message: "This is not a valid mock payment reference",
      };
    }

    console.log("✅ Mock Dev Gateway: Payment verified");

    return {
      success: true,
      status: PaymentStatus.SUCCESS,
      transactionId: reference,
      reference: reference,
      gatewayReference: reference,
      amount: 0, // Amount unknown during verification
      currency: "NGN",
      message: "Payment verified (TEST MODE)",
      metadata: {
        testMode: true,
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  async validateWebhook(payload: WebhookPayload): Promise<WebhookValidationResult> {
    console.log("🧪 Mock Dev Gateway: Validating webhook", { event: payload.event });

    // Always valid for mock
    return {
      isValid: true,
      transactionId: payload.data.reference || `MOCK-${Date.now()}`,
      status: PaymentStatus.SUCCESS,
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    console.log("🧪 Mock Dev Gateway: Processing refund", { transactionId, amount });

    // Simulate processing delay
    await this.delay(1000);

    const mockRefundReference = `MOCK-REFUND-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    console.log("✅ Mock Dev Gateway: Refund processed", { reference: mockRefundReference });

    return {
      success: true,
      status: PaymentStatus.REFUNDED,
      transactionId: mockRefundReference,
      gatewayReference: mockRefundReference,
      amount: amount || 0,
      currency: "NGN",
      message: "Refund processed (TEST MODE)",
      metadata: {
        testMode: true,
        originalTransactionId: transactionId,
        refundedAt: new Date().toISOString(),
      },
    };
  }

  // Helper: Simulate processing delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper: Determine if should simulate failure
  private shouldSimulateFailure(): boolean {
    if (this.randomFailureRate === 0) return false;
    const random = Math.random() * 100;
    return random < this.randomFailureRate;
  }
}
