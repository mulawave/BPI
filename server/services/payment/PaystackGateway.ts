import { initializePaystackPayment, verifyPaystackPayment } from "@/lib/paystack";
import {
  GatewayConfig,
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentVerification,
} from "./types";

export class PaystackGateway implements IPaymentGateway {
  private secretKey?: string;

  async initialize(config: GatewayConfig) {
    this.secretKey = config.secretKey;
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.secretKey) {
      throw new Error("Paystack secret key not configured");
    }

    const reference =
      (request.metadata && (request.metadata as any).reference) ||
      `PAYSTACK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const amountKobo = Math.round(request.amount * 100);

    const init = await initializePaystackPayment(this.secretKey, {
      email: request.email,
      amount: amountKobo,
      reference,
      callbackUrl: (request.metadata && (request.metadata as any).callbackUrl) || undefined,
      metadata: {
        ...request.metadata,
        userId: request.userId,
        packageId: request.packageId,
        purpose: request.purpose,
      },
    });

    return {
      success: init.status,
      status: init.status ? PaymentStatus.PENDING : PaymentStatus.FAILED,
      transactionId: reference,
      gatewayReference: reference,
      paymentUrl: init.data?.authorization_url,
      amount: request.amount,
      currency: request.currency,
      message: init.message,
      metadata: init.data as any,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    if (!this.secretKey) {
      throw new Error("Paystack secret key not configured");
    }

    const result = await verifyPaystackPayment(this.secretKey, reference);
    const isSuccess = result.status && result.data?.status === "success";

    return {
      success: isSuccess,
      status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      transactionId: reference,
      amount: result.data?.amount ? result.data.amount / 100 : 0,
      reference: result.data?.reference || reference,
      gatewayReference: result.data?.reference,
      currency: "NGN",
      metadata: result.data as any,
      message: result.message,
    };
  }
}
