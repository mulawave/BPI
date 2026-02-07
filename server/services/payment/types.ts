export interface PaymentRequest {
  amount: number;
  userId: string;
  packageId: string;
  email: string;
  name: string;
  phone?: string;
  paymentMethod: "flutterwave" | "paystack" | "wallet" | "mock";
  currency?: string;
  purpose?: string;
  metadata?: Record<string, any>;
  gateway?: PaymentGateway;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  reference?: string;
  message?: string;
  error?: string;
  status?: PaymentStatus;
  gatewayReference?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
  balanceAfter?: number;
}

export interface PaymentVerification {
  success: boolean;
  status: PaymentStatus;
  transactionId: string;
  amount: number;
  reference: string;
  gatewayReference?: string;
  currency?: string;
  metadata?: Record<string, any>;
  error?: string;
  message?: string;
  balanceAfter?: number;
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentGateway {
  MOCK_DEV = "mock_dev",
  WALLET = "wallet",
  PAYSTACK = "paystack",
  FLUTTERWAVE = "flutterwave",
}

export enum PaymentPurpose {
  MEMBERSHIP = "MEMBERSHIP",
  UPGRADE = "UPGRADE",
  RENEWAL = "RENEWAL",
  TOPUP = "TOPUP",
  EMPOWERMENT = "EMPOWERMENT",
}

export interface GatewayConfig {
  publicKey?: string;
  secretKey?: string;
  encryptionKey?: string;
  environment?: "test" | "production" | "live";
  webhookSecret?: string;
  enabled?: boolean;
  features?: {
    encryptionKey?: string;
    paymentMethods?: string[];
    processingDelay?: number;
    randomFailureRate?: number;
  };
}

export interface WebhookPayload {
  event: string;
  data: any;
  signature?: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
  status?: PaymentStatus;
}

export interface IPaymentGateway {
  initializePayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  validateWebhook?(payload: WebhookPayload): Promise<WebhookValidationResult>;
  processWebhook?(payload: any): Promise<void>;
}
