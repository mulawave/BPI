// Crypto Payment Gateway — Multi-provider (Coinbase Commerce, NowPayments, Binance Pay)
// Provider is selected via PaymentGatewayConfig.apiProvider field.
// Exchange rates come from CoinGecko with admin override.

import { prisma } from "@/lib/prisma";
import { getCryptoRate } from "@/lib/cryptoRates";
import { initializeBasqetPayin, verifyBasqetPayin, type BasqetPayinInitResult } from "./BasqetClient";
import {
  GatewayConfig,
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentVerification,
} from "./types";

// ── Provider abstraction ────────────────────────────────────────────

interface CryptoProviderResult {
  paymentUrl?: string;
  providerRef: string;
  address?: string;
  amountCrypto?: number;
  expiresAt?: string;
  qrCode?: string;
  auditLog?: object;
}

interface CryptoVerifyResult {
  paid: boolean;
  amountReceived: number;
  providerRef: string;
}

// ── Provider implementations ────────────────────────────────────────

async function initCoinbaseCommerce(
  apiKey: string,
  params: { name: string; description: string; amount: number; currency: string; reference: string; metadata: Record<string, any> }
): Promise<CryptoProviderResult> {
  const response = await fetch("https://api.commerce.coinbase.com/charges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      pricing_type: "fixed_price",
      local_price: { amount: String(params.amount), currency: params.currency },
      metadata: { ...params.metadata, reference: params.reference },
      redirect_url: params.metadata?.callbackUrl,
      cancel_url: params.metadata?.cancelUrl,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Coinbase Commerce error: ${err}`);
  }

  const data = await response.json();
  return {
    paymentUrl: data.data?.hosted_url,
    providerRef: data.data?.code || data.data?.id,
  };
}

async function verifyCoinbaseCommerce(apiKey: string, chargeId: string): Promise<CryptoVerifyResult> {
  const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
    headers: { "X-CC-Api-Key": apiKey, "X-CC-Version": "2018-03-22" },
  });

  if (!response.ok) throw new Error("Coinbase Commerce verification failed");

  const data = await response.json();
  const timeline = data.data?.timeline || [];
  const lastStatus = timeline[timeline.length - 1]?.status;

  return {
    paid: lastStatus === "COMPLETED" || lastStatus === "RESOLVED",
    amountReceived: parseFloat(data.data?.pricing?.local?.amount || "0"),
    providerRef: data.data?.code || chargeId,
  };
}

async function initNowPayments(
  apiKey: string,
  params: { amount: number; currency: string; payCurrency: string; reference: string; callbackUrl?: string; metadata: Record<string, any> }
): Promise<CryptoProviderResult> {
  const response = await fetch("https://api.nowpayments.io/v1/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      price_amount: params.amount,
      price_currency: params.currency.toLowerCase(),
      pay_currency: params.payCurrency.toLowerCase(),
      order_id: params.reference,
      order_description: `BPI deposit ${params.reference}`,
      ipn_callback_url: params.callbackUrl,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NowPayments error: ${err}`);
  }

  const data = await response.json();
  return {
    paymentUrl: data.invoice_url || undefined,
    providerRef: String(data.payment_id),
    address: data.pay_address,
    amountCrypto: data.pay_amount,
    expiresAt: data.expiration_estimate_date,
  };
}

async function verifyNowPayments(apiKey: string, paymentId: string): Promise<CryptoVerifyResult> {
  const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) throw new Error("NowPayments verification failed");

  const data = await response.json();
  return {
    paid: data.payment_status === "finished" || data.payment_status === "confirmed",
    amountReceived: data.actually_paid || 0,
    providerRef: String(data.payment_id),
  };
}

async function initBinancePay(
  apiKey: string,
  secretKey: string,
  params: { amount: number; currency: string; reference: string; metadata: Record<string, any> }
): Promise<CryptoProviderResult> {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2, 14);

  const body = JSON.stringify({
    env: { terminalType: "WEB" },
    merchantTradeNo: params.reference,
    orderAmount: params.amount,
    currency: params.currency,
    goods: {
      goodsType: "02",
      goodsCategory: "Z000",
      referenceGoodsId: params.reference,
      goodsName: "BPI Wallet Deposit",
    },
  });

  // Binance Pay requires HMAC-SHA512 signature
  const crypto = await import("crypto");
  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto.createHmac("sha512", secretKey).update(payload).digest("hex").toUpperCase();

  const response = await fetch("https://bpay.binanceapi.com/binancepay/openapi/v2/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": String(timestamp),
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": apiKey,
      "BinancePay-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Binance Pay error: ${err}`);
  }

  const data = await response.json();
  if (data.status !== "SUCCESS") {
    throw new Error(`Binance Pay error: ${data.errorMessage || "Unknown error"}`);
  }

  return {
    paymentUrl: data.data?.checkoutUrl || data.data?.universalUrl,
    providerRef: data.data?.prepayId || params.reference,
  };
}

async function verifyBinancePay(
  apiKey: string,
  secretKey: string,
  merchantTradeNo: string
): Promise<CryptoVerifyResult> {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2, 14);
  const body = JSON.stringify({ merchantTradeNo });

  const crypto = await import("crypto");
  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto.createHmac("sha512", secretKey).update(payload).digest("hex").toUpperCase();

  const response = await fetch("https://bpay.binanceapi.com/binancepay/openapi/v2/order/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": String(timestamp),
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": apiKey,
      "BinancePay-Signature": signature,
    },
    body,
  });

  if (!response.ok) throw new Error("Binance Pay verification failed");

  const data = await response.json();
  return {
    paid: data.data?.status === "PAID",
    amountReceived: parseFloat(data.data?.orderAmount || "0"),
    providerRef: data.data?.prepayId || merchantTradeNo,
  };
}

async function initBasqetPayin(
  apiKey: string,
  secretKey: string,
  params: {
    amount: number;
    currency: string;
    reference: string;
    customer: { name: string; email: string };
    metadata: Record<string, any>;
  }
): Promise<CryptoProviderResult> {
  const result: BasqetPayinInitResult = await initializeBasqetPayin({
    secretKey,
    publicKey: apiKey,
    reference: params.reference,
    amount: params.amount,
    currency: params.currency,
    customer: params.customer,
    currencyId: params.metadata?.currency_id,
    metadata: params.metadata,
  });

  return {
    providerRef: result.providerRef,
    address: result.paymentAddress,
    amountCrypto: result.paymentAmount,
    qrCode: result.qrCode,
    auditLog: result.auditLog,
    // Basqet does NOT return a hosted checkout URL.
    // Payment is made by sending crypto to the address.
  };
}

async function verifyBasqetPayment(
  apiKey: string,
  secretKey: string,
  reference: string
): Promise<CryptoVerifyResult> {
  const result = await verifyBasqetPayin(secretKey, apiKey, reference);
  return {
    paid: result.paid,
    amountReceived: result.amountReceived,
    providerRef: result.providerRef,
  };
}

// ── Main CryptoGateway class ────────────────────────────────────────

export class CryptoGateway implements IPaymentGateway {
  private apiKey?: string;
  private secretKey?: string;
  private provider?: string; // "coinbase_commerce" | "nowpayments" | "binance_pay"

  async initialize(config: GatewayConfig) {
    this.apiKey = config.publicKey;
    this.secretKey = config.secretKey;

    // Provider determined from DB config.apiProvider
    const dbConfig = await prisma.paymentGatewayConfig.findFirst({
      where: { gatewayName: "crypto", isActive: true },
      select: { apiProvider: true, publicKey: true, secretKey: true, cryptoPublicKey: true, cryptoSecretKey: true },
    });

    this.provider = dbConfig?.apiProvider?.toLowerCase() || "nowpayments";
    // Use crypto-specific keys if set, falling back to generic keys
    this.apiKey = dbConfig?.cryptoPublicKey || dbConfig?.publicKey || config.publicKey;
    this.secretKey = dbConfig?.cryptoSecretKey || dbConfig?.secretKey || config.secretKey;
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.apiKey) {
      throw new Error("Crypto gateway API key not configured");
    }

    const reference =
      (request.metadata?.reference as string) ||
      `CRYPTO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Get crypto amount from exchange rate
    const cryptoCurrency = request.cryptoCurrency || "USDT";
    const rate = await getCryptoRate(cryptoCurrency);
    const amountNgn = request.amount;
    const amountCrypto = amountNgn / rate.rateNgn;

    const callbackUrl = (request.metadata?.callbackUrl as string) || undefined;

    let result: CryptoProviderResult;

    switch (this.provider) {
      case "coinbase_commerce":
      case "coinbase": {
        result = await initCoinbaseCommerce(this.apiKey, {
          name: "BPI Wallet Deposit",
          description: `Deposit ${amountCrypto.toFixed(6)} ${cryptoCurrency}`,
          amount: amountCrypto,
          currency: cryptoCurrency,
          reference,
          metadata: { ...request.metadata, userId: request.userId, amountNgn },
        });
        break;
      }

      case "binance_pay":
      case "binance": {
        if (!this.secretKey) throw new Error("Binance Pay secret key not configured");
        result = await initBinancePay(this.apiKey, this.secretKey, {
          amount: amountCrypto,
          currency: cryptoCurrency,
          reference,
          metadata: { ...request.metadata, userId: request.userId, amountNgn },
        });
        break;
      }

      case "basqet": {
        if (!this.secretKey) throw new Error("Basqet secret key not configured");

        // CRITICAL: Always initialize Basqet with currency "USDT" (not fiat "USD").
        // When initialized_currency === payment_currency (both USDT), Basqet creates a
        // direct crypto-to-crypto invoice at 1:1 parity with no fiat spread applied.
        // Passing currency "USD" triggers Basqet's Quidax order-book fiat→USDT conversion
        // which applies an 11%+ premium (e.g. $2.31 USD → 1.91 USDT instead of 2.31 USDT).
        //
        // metadata.originalAmount = user's USD total inclusive of VAT (set in wallet.ts).
        // Since BPI accounts are USD-denominated, USD amount == USDT amount exactly.
        const originalCurrency = (request.metadata?.originalCurrency as string) || "";
        const originalAmount = request.metadata?.originalAmount as number | undefined;

        // Use the pre-computed USD total (with VAT) when available; otherwise fall back to
        // the crypto amount computed locally via getCryptoRate (for non-USD accounts).
        const basqetAmount = (originalAmount && originalCurrency === "USD")
          ? originalAmount   // USD total with VAT — equals exact USDT to charge (1 USDT = $1)
          : amountCrypto;    // Fallback: locally computed crypto equivalent

        result = await initBasqetPayin(this.apiKey, this.secretKey, {
          amount: basqetAmount,
          currency: "USDT",  // Always USDT — bypasses fiat-to-crypto spread entirely
          reference,
          customer: {
            name: request.name || "BPI User",
            email: request.email,
          },
          metadata: {
            ...request.metadata,
            userId: request.userId,
            amountNgn,
            cryptoCurrency,
            cryptoNetwork: request.cryptoNetwork || "TRC20",
          },
        });
        // Basqet returns address + amount, not a checkout URL
        if (!result.address) {
          console.error("[CryptoGateway] Basqet returned no payment address", JSON.stringify(result));
          throw new Error("Basqet payment initialization failed — no payment address returned. Please try again or use manual transfer.");
        }
        break;
      }

      case "nowpayments":
      default: {
        result = await initNowPayments(this.apiKey, {
          amount: amountNgn,
          currency: "NGN",
          payCurrency: cryptoCurrency,
          reference,
          callbackUrl,
          metadata: { ...request.metadata, userId: request.userId },
        });
        break;
      }
    }

    return {
      success: true,
      status: PaymentStatus.PENDING,
      transactionId: reference,
      gatewayReference: result.providerRef,
      paymentUrl: result.paymentUrl,
      amount: request.amount,
      currency: request.currency || "NGN",
      message: result.paymentUrl
        ? "Crypto payment created. Complete payment on the provider page."
        : `Send ${result.amountCrypto?.toFixed(6)} ${cryptoCurrency} to ${result.address}`,
      metadata: {
        provider: this.provider,
        cryptoCurrency,
        cryptoNetwork: request.cryptoNetwork || "TRC20",
        amountCrypto,
        exchangeRate: rate.rateNgn,
        rateSource: rate.source,
        address: result.address,
        expiresAt: result.expiresAt,
        qrCode: result.qrCode,
        ...(result.auditLog ? { basqetAudit: result.auditLog } : {}),
      },
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    if (!this.apiKey) {
      throw new Error("Crypto gateway API key not configured");
    }

    let result: CryptoVerifyResult;

    switch (this.provider) {
      case "coinbase_commerce":
      case "coinbase":
        result = await verifyCoinbaseCommerce(this.apiKey, reference);
        break;

      case "binance_pay":
      case "binance": {
        if (!this.secretKey) throw new Error("Binance Pay secret key not configured");
        result = await verifyBinancePay(this.apiKey, this.secretKey, reference);
        break;
      }

      case "basqet": {
        if (!this.secretKey) throw new Error("Basqet secret key not configured");
        result = await verifyBasqetPayment(this.apiKey, this.secretKey, reference);
        break;
      }

      case "nowpayments":
      default:
        result = await verifyNowPayments(this.apiKey, reference);
        break;
    }

    return {
      success: result.paid,
      status: result.paid ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
      transactionId: reference,
      amount: result.amountReceived,
      reference,
      gatewayReference: result.providerRef,
      currency: "NGN",
      message: result.paid ? "Payment confirmed" : "Payment not yet confirmed",
    };
  }

  async validateWebhook(payload: { event: string; data: any; signature?: string }) {
    // Webhook validation varies by provider. Each webhook route validates independently.
    // This is a generic fallback.
    return {
      isValid: !!payload.data,
      data: payload.data,
      transactionId: payload.data?.order_id || payload.data?.merchantTradeNo || payload.data?.metadata?.reference,
      status: PaymentStatus.PENDING,
    };
  }
}
