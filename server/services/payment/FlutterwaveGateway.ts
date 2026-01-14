// Flutterwave Payment Gateway
// Supports card, bank transfer, USSD, account debit, mobile money

import {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentVerification,
  GatewayConfig,
  WebhookPayload,
  WebhookValidationResult,
} from "./types";
import crypto from "crypto";

interface FlutterwavePaymentData {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  payment_options?: string;
  meta?: Record<string, any>;
}

interface FlutterwaveResponse {
  status: string;
  message: string;
  data?: {
    link: string;
    [key: string]: any;
  };
}

interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    customer: {
      email: string;
      name: string;
    };
    meta?: Record<string, any>;
  };
}

export class FlutterwaveGateway implements IPaymentGateway {
  private config: GatewayConfig | null = null;
  private baseUrl = "";
  private publicKey = "";
  private secretKey = "";
  private encryptionKey = "";
  private webhookSecret = "";

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return this.initiatePayment(request);
  }

  async initialize(config: GatewayConfig): Promise<void> {
    this.config = config;

    // Set API base URL based on environment
    this.baseUrl =
      config.environment === "live"
        ? "https://api.flutterwave.com/v3"
        : "https://api.flutterwave.com/v3"; // Same URL for both, but use test keys

    // Get API keys from config
    this.publicKey = config.publicKey || process.env.FLUTTERWAVE_PUBLIC_KEY || "";
    this.secretKey = config.secretKey || process.env.FLUTTERWAVE_SECRET_KEY || "";
    this.encryptionKey = config.features?.encryptionKey || process.env.FLUTTERWAVE_ENCRYPTION_KEY || "";
    this.webhookSecret = config.webhookSecret || process.env.FLUTTERWAVE_WEBHOOK_SECRET || "myngul.com22";

    if (!this.publicKey || !this.secretKey) {
      throw new Error("Flutterwave API keys are required");
    }

    console.log("💳 Flutterwave Gateway initialized");
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`🔑 Public Key: ${this.publicKey.substring(0, 15)}...`);
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log("💳 Flutterwave: Initiating payment", {
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
    });

    try {
      // Generate transaction reference
      const txRef = `FLW-${Date.now()}-${request.userId.substring(0, 8)}`;

      // Get user details from metadata
      const userEmail = request.metadata?.userEmail || "user@bpi.com";
      const userName = request.metadata?.userName || "BPI User";
      const userPhone = request.metadata?.userPhone;

      // Prepare payment data
      const paymentData: FlutterwavePaymentData = {
        tx_ref: txRef,
        amount: request.amount,
        currency: request.currency || "NGN",
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/flutterwave/callback`,
        customer: {
          email: userEmail,
          phonenumber: userPhone,
          name: userName,
        },
        customizations: {
          title: "BPI Membership Payment",
          description: `Payment for ${request.purpose}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/img/logo.png`,
        },
        payment_options: this.getPaymentOptions(),
        meta: {
          userId: request.userId,
          purpose: request.purpose,
          packageId: request.packageId,
          ...request.metadata,
        },
      };

      // Make API request to Flutterwave
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const result: FlutterwaveResponse = await response.json();

      if (result.status === "success" && result.data?.link) {
        console.log("✅ Flutterwave: Payment link generated", {
          txRef,
          link: result.data.link,
        });

        return {
          success: true,
          status: PaymentStatus.PENDING,
          transactionId: txRef,
          gatewayReference: txRef,
          amount: request.amount,
          currency: request.currency,
          paymentUrl: result.data.link,
          message: "Payment initiated. Redirect user to payment page.",
          metadata: {
            txRef,
            flutterwaveData: result.data,
          },
        };
      } else {
        console.error("❌ Flutterwave: Payment initiation failed", result);

        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount: request.amount,
          currency: request.currency,
          error: result.message || "Failed to initiate payment",
          message: "Payment initiation failed. Please try again.",
        };
      }
    } catch (error) {
      console.error("❌ Flutterwave: Payment error", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: request.amount,
        currency: request.currency,
        error: error instanceof Error ? error.message : "Payment processing failed",
        message: "An error occurred while processing your payment",
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    console.log("🔍 Flutterwave: Verifying payment", { reference });

    try {
      // Query Flutterwave API to verify transaction
      const response = await fetch(
        `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result: FlutterwaveVerifyResponse = await response.json();

      if (result.status === "success" && result.data) {
        const { data } = result;

        // Check if payment was successful
        const isSuccessful = data.status === "successful";
        const status = isSuccessful ? "successful" : "failed";

        console.log("✅ Flutterwave: Payment verified", {
          reference,
          status: data.status,
          amount: data.amount,
        });

        return {
          success: isSuccessful,
          status: isSuccessful ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          transactionId: data.tx_ref,
          amount: data.amount,
          reference: data.flw_ref,
          metadata: {
            paymentType: data.payment_type,
            chargedAmount: data.charged_amount,
            currency: data.currency,
            customer: data.customer,
            flutterwaveData: data,
          },
        };
      } else {
        console.error("❌ Flutterwave: Verification failed", result);

        return {
          success: false,
          status: PaymentStatus.FAILED,
          transactionId: reference,
          amount: 0,
          reference: reference,
          metadata: {
            error: result.message || "Transaction not found",
          },
        };
      }
    } catch (error) {
      console.error("❌ Flutterwave: Verification error", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        transactionId: reference,
        amount: 0,
        reference: reference,
        metadata: {
          error: error instanceof Error ? error.message : "Verification failed",
        },
      };
    }
  }

  async validateWebhook(payload: WebhookPayload): Promise<WebhookValidationResult> {
    console.log("🔐 Flutterwave: Validating webhook", { event: payload.event });

    try {
      // Verify webhook signature
      const signature = payload.signature;
      if (!signature) {
        console.error("❌ Flutterwave: Missing webhook signature");
        return {
          isValid: false,
          error: "Missing webhook signature",
        };
      }

      // Generate expected signature
      const expectedSignature = this.generateWebhookSignature(payload.data);

      if (signature !== expectedSignature) {
        console.error("❌ Flutterwave: Invalid webhook signature");
        return {
          isValid: false,
          error: "Invalid webhook signature",
        };
      }

      // Extract transaction details
      const txRef = payload.data?.tx_ref || payload.data?.txRef;
      const status = payload.data?.status;

      let paymentStatus: PaymentStatus;
      if (status === "successful") {
        paymentStatus = PaymentStatus.SUCCESS;
      } else if (status === "failed") {
        paymentStatus = PaymentStatus.FAILED;
      } else {
        paymentStatus = PaymentStatus.PENDING;
      }

      console.log("✅ Flutterwave: Webhook validated", {
        txRef,
        status: paymentStatus,
      });

      return {
        isValid: true,
        transactionId: txRef,
        status: paymentStatus,
      };
    } catch (error) {
      console.error("❌ Flutterwave: Webhook validation error", error);

      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    console.log("🔄 Flutterwave: Processing refund", { transactionId, amount });

    try {
      // First, verify the transaction to get Flutterwave transaction ID
      const verification = await this.verifyPayment(transactionId);

      if (!verification.success || !verification.gatewayReference) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount: amount || 0,
          currency: "NGN",
          error: "Original transaction not found or invalid",
          message: "Cannot process refund",
        };
      }

      // Initiate refund via Flutterwave API
      const refundData = {
        id: verification.gatewayReference,
        amount: amount || verification.amount,
      };

      const response = await fetch(`${this.baseUrl}/transactions/${refundData.id}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: refundData.amount }),
      });

      const result = await response.json();

      if (result.status === "success") {
        console.log("✅ Flutterwave: Refund processed", {
          transactionId,
          amount: refundData.amount,
        });

        return {
          success: true,
          status: PaymentStatus.REFUNDED,
          transactionId: `REFUND-${transactionId}`,
          gatewayReference: result.data?.id || verification.gatewayReference,
          amount: refundData.amount,
          currency: verification.currency,
          message: "Refund processed successfully",
          metadata: {
            originalTransactionId: transactionId,
            flutterwaveData: result.data,
          },
        };
      } else {
        console.error("❌ Flutterwave: Refund failed", result);

        return {
          success: false,
          status: PaymentStatus.FAILED,
          amount: refundData.amount,
          currency: verification.currency,
          error: result.message || "Refund processing failed",
          message: "Failed to process refund",
        };
      }
    } catch (error) {
      console.error("❌ Flutterwave: Refund error", error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        amount: amount || 0,
        currency: "NGN",
        error: error instanceof Error ? error.message : "Refund processing failed",
        message: "An error occurred while processing refund",
      };
    }
  }

  // Helper: Get enabled payment options from config
  private getPaymentOptions(): string {
    const options = this.config?.features?.paymentMethods || [
      "card",
      "banktransfer",
      "ussd",
      "account",
    ];
    return options.join(",");
  }

  // Helper: Generate webhook signature for validation
  private generateWebhookSignature(data: Record<string, any>): string {
    const hash = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(data))
      .digest("hex");
    return hash;
  }
}
