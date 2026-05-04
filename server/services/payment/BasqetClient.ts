// Basqet API Client — Based on official docs: https://docs.basqet.com
//
// API Flow (Pay-in):
//   1. Initialize: POST /v1/transaction (auth: Bearer PUBLIC_KEY)
//      → returns { data: { id, reference, status: "INITIATED" } }
//   2. Initiate:   POST /v1/transaction/:id/pay (auth: Bearer SECRET_KEY)
//      → returns { data: { payment_address, payment_amount, qrCode, status: "PENDING" } }
//   3. Verify:     GET  /v1/transaction/:id/status (auth: Bearer PUBLIC_KEY or SECRET_KEY)
//      → returns { data: { status: "SUCCESSFUL" | "PENDING" | ... } }
//
// Basqet does NOT provide a hosted checkout URL. It returns a crypto address + amount + QR code.
// Currency IDs: USDT=3, BTC=4, QDX=5, ETH=6, LTC=7

import crypto from "crypto";
import { normalizeCryptoNetwork } from "./cryptoNetwork";

// ── Interfaces ──────────────────────────────────────────────────────

export interface BasqetPayinInitInput {
  secretKey: string;
  publicKey: string;
  reference: string;
  amount: number;
  /** Fiat currency for initialization: "USD" or "NGN" */
  currency: string;
  customer: { name: string; email: string };
  /** Currency ID for the crypto to pay with: USDT=3, BTC=4, QDX=5, ETH=6, LTC=7 */
  currencyId?: number;
  metadata?: Record<string, any>;
}

export interface BasqetPayinInitResult {
  providerRef: string;
  transactionId: string;
  paymentAddress: string;
  paymentAmount: number;
  qrCode?: string;
  paymentCurrency?: string;
  paymentNetwork?: string;
  status: string;
  auditLog: {
    initBody: object;
    initResponse: object;
    payBody: object;
    payResponse: object;
  };
}

export interface BasqetVerifyResult {
  paid: boolean;
  amountReceived: number;
  providerRef: string;
  status: string;
}

export interface BasqetPayoutInput {
  secretKey: string;
  publicKey?: string;
  reference: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  network?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface BasqetPayoutResult {
  accepted: boolean;
  providerRef: string;
  payoutId?: string;
  status: string;
  txHash?: string;
  auditLog?: {
    requestBody: object;
    response: object;
  };
}

// ── Constants ───────────────────────────────────────────────────────

const BASE_URL = "https://api.basqet.com/v1";
const USDT_CURRENCY_ID = 3;

// ── HTTP helpers ────────────────────────────────────────────────────

async function basqetFetch<T>(
  authKey: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  console.log(`[BasqetClient] ${options?.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${authKey}`,
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`[BasqetClient] Error ${response.status}: ${text}`);
    throw new Error(`Basqet API error (${response.status}): ${text}`);
  }

  const json = JSON.parse(text);
  if (json.status === "error" || json.status === "fail") {
    console.error(`[BasqetClient] API returned error:`, json);
    throw new Error(`Basqet API error: ${json.message || JSON.stringify(json)}`);
  }

  return json as T;
}

// ── Pay-in: Initialize + Initiate ───────────────────────────────────

export async function initializeBasqetPayin(input: BasqetPayinInitInput): Promise<BasqetPayinInitResult> {
  // Step 1: Initialize transaction (PUBLIC key)
  const initBody = {
    customer: input.customer,
    amount: String(input.amount),
    currency: input.currency,
    description: `BPI deposit ${input.reference}`,
    meta: {
      ...(input.metadata || {}),
      reference: input.reference,
    },
  };

  const initResponse = await basqetFetch<{
    status: string;
    data: {
      id: string;
      reference: string;
      status: string;
      initialized_amount: number;
      initialized_currency: string;
    };
  }>(input.publicKey, "/transaction", {
    method: "POST",
    body: JSON.stringify(initBody),
  });

  const transactionId = initResponse.data.id;
  const reference = initResponse.data.reference;

  if (!transactionId) {
    throw new Error("Basqet initialize returned no transaction ID");
  }

  console.log(`[BasqetClient] Initialized transaction ${transactionId} (ref: ${reference})`);

  // Step 2: Initiate payment with crypto currency (SECRET key)
  const currencyId = input.currencyId || USDT_CURRENCY_ID;
  const payBody = { currency_id: currencyId };

  const payResponse = await basqetFetch<{
    status: string;
    data: {
      id: string;
      reference: string;
      payment_address: string;
      payment_amount: number;
      payment_currency: string;
      qrCode?: string;
      status: string;
    };
  }>(input.secretKey, `/transaction/${transactionId}/pay`, {
    method: "POST",
    body: JSON.stringify(payBody),
  });

  const payData = payResponse.data;

  if (!payData.payment_address || !payData.payment_amount) {
    console.error("[BasqetClient] Initiate response missing address/amount:", JSON.stringify(payData));
    throw new Error("Basqet did not return a payment address or amount");
  }

  console.log(`[BasqetClient] Payment: send ${payData.payment_amount} ${payData.payment_currency} to ${payData.payment_address}`);

  return {
    providerRef: payData.reference || reference,
    transactionId: payData.id || transactionId,
    paymentAddress: payData.payment_address,
    paymentAmount: payData.payment_amount,
    qrCode: payData.qrCode,
    paymentCurrency: payData.payment_currency,
    paymentNetwork: normalizeCryptoNetwork(payData.payment_currency) ?? undefined,
    status: payData.status || "PENDING",
    auditLog: {
      initBody,
      initResponse: initResponse as object,
      payBody,
      payResponse: payResponse as object,
    },
  };
}

// ── Pay-in: Verify ──────────────────────────────────────────────────

export async function verifyBasqetPayin(
  secretKey: string,
  publicKey: string,
  transactionId: string,
): Promise<BasqetVerifyResult> {
  // Basqet verify endpoint only returns { data: { status } } per official docs.
  // It does NOT return amount_paid or payment_amount — those fields do not exist here.
  const response = await basqetFetch<{
    status: string;
    data: {
      id?: string;
      reference?: string;
      status: string;
    };
  }>(publicKey, `/transaction/${encodeURIComponent(transactionId)}/status`, {
    method: "GET",
  });

  const data = response.data;
  const statusRaw = (data.status || "PENDING").toUpperCase();
  const paid = statusRaw === "SUCCESSFUL";

  return {
    paid,
    amountReceived: 0, // verify endpoint does not return payment amounts
    providerRef: data.reference || data.id || transactionId,
    status: statusRaw,
  };
}

// ── Webhook signature validation ────────────────────────────────────
// Basqet webhooks use HMAC SHA512 with the SECRET key.
// Signature is in the `basqetSignature` header (camelCase).

export function validateBasqetWebhookSignature(
  body: string,
  headers: Record<string, string>,
  secret: string,
): boolean {
  // Header name is basqetSignature per docs, but check lowercase variants for safety
  const signatureHeader =
    headers["basqetsignature"] ||
    headers["basqetSignature"] ||
    headers["x-basqet-signature"] ||
    headers["basqet-signature"];

  if (!signatureHeader) {
    console.warn("[BasqetClient] No webhook signature header found");
    return false;
  }

  const expected = crypto.createHmac("sha512", secret).update(body).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return signatureHeader === expected;
  }
}

// ── Payout (withdrawal) ─────────────────────────────────────────────
// Payout API docs not fully confirmed — using best-effort implementation.
// These endpoints follow the pattern from the Basqet dashboard.

export async function initiateBasqetUsdtPayout(input: BasqetPayoutInput): Promise<BasqetPayoutResult> {
  const requestBody = {
    amount: String(input.amount),
    currency: input.currency,
    destination: {
      address: input.recipientAddress,
      network: input.network || "TRC-20",
    },
    reference: input.reference,
    meta: input.metadata || {},
  };

  const response = await basqetFetch<{
    status: string;
    data: {
      id?: string;
      reference?: string;
      status?: string;
      tx_hash?: string;
    };
  }>(input.secretKey, "/payout", {
    method: "POST",
    headers: {
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: JSON.stringify(requestBody),
  });

  const data = response.data;
  const status = (data.status || "pending").toLowerCase();

  return {
    accepted: ["accepted", "queued", "processing", "pending", "submitted", "completed", "success", "successful"].includes(status),
    providerRef: data.reference || data.id || input.reference,
    payoutId: data.id,
    status,
    txHash: data.tx_hash,
    auditLog: {
      requestBody,
      response: response as object,
    },
  };
}

export async function verifyBasqetUsdtPayout(
  secretKey: string,
  _publicKey: string | undefined,
  providerRef: string,
): Promise<BasqetPayoutResult> {
  const response = await basqetFetch<{
    status: string;
    data: {
      id?: string;
      reference?: string;
      status?: string;
      tx_hash?: string;
    };
  }>(secretKey, `/payout/${encodeURIComponent(providerRef)}`, {
    method: "GET",
  });

  const data = response.data;
  const status = (data.status || "pending").toLowerCase();

  return {
    accepted: ["accepted", "queued", "processing", "pending", "submitted", "completed", "success", "successful"].includes(status),
    providerRef: data.reference || data.id || providerRef,
    payoutId: data.id,
    status,
    txHash: data.tx_hash,
  };
}
