export interface PaymentRequest {
  amount: number;
  userId: string;
  packageId: string;
  email: string;
  name: string;
  phone?: string;
  paymentMethod: "flutterwave" | "paystack" | "wallet" | "mock" | "bank_transfer" | "crypto" | "utility_token";
  currency?: string;
  purpose?: string;
  metadata?: Record<string, any>;
  gateway?: PaymentGateway;
  /** Crypto-specific: provider to use (e.g. "coinbase_commerce", "nowpayments", "binance_pay") */
  cryptoProvider?: string;
  /** Crypto-specific: cryptocurrency symbol (e.g. "USDT", "BTC") */
  cryptoCurrency?: string;
  /** Crypto-specific: blockchain network (e.g. "TRC20", "ERC20", "BSC") */
  cryptoNetwork?: string;
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
  BANK_TRANSFER = "bank_transfer",
  CRYPTO = "crypto",
  UTILITY_TOKEN = "utility_token",
}

export enum PaymentPurpose {
  MEMBERSHIP = "MEMBERSHIP",
  UPGRADE = "UPGRADE",
  RENEWAL = "RENEWAL",
  TOPUP = "TOPUP",
  EMPOWERMENT = "EMPOWERMENT",
  DEPOSIT = "DEPOSIT",
  STORE_PURCHASE = "STORE_PURCHASE",
  CSP_CONTRIBUTION = "CSP_CONTRIBUTION",
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
  refundPayment?(transactionId: string, amount?: number): Promise<PaymentResponse>;
  validateWebhook?(payload: WebhookPayload): Promise<WebhookValidationResult>;
  processWebhook?(payload: any): Promise<void>;
}
