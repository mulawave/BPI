import crypto from "crypto";

export interface BasqetPayinInitInput {
  secretKey: string;
  publicKey?: string;
  reference: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
  };
  metadata?: Record<string, any>;
}

export interface BasqetPayinInitResult {
  providerRef: string;
  transactionId?: string;
  paymentUrl?: string;
  status?: string;
  raw?: any;
}

export interface BasqetVerifyResult {
  paid: boolean;
  amountReceived: number;
  providerRef: string;
  status: string;
  raw?: any;
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
  raw?: any;
}

const DEFAULT_BASE_URL = process.env.BASQET_API_BASE_URL || "https://api.basqet.com";
const INIT_TRANSACTION_PATH = process.env.BASQET_INIT_TRANSACTION_PATH || "/payins/transactions/initialize";
const INITIATE_TRANSACTION_PATH = process.env.BASQET_INITIATE_TRANSACTION_PATH || "/payins/transactions/initiate";
const VERIFY_TRANSACTION_PATH = process.env.BASQET_VERIFY_TRANSACTION_PATH || "/payins/transactions";
const INIT_PAYOUT_PATH = process.env.BASQET_INIT_PAYOUT_PATH || "/payouts";
const VERIFY_PAYOUT_PATH = process.env.BASQET_VERIFY_PAYOUT_PATH || "/payouts";

function buildBasqetHeaders(secretKey: string, publicKey?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
  };

  if (publicKey) {
    headers["x-public-key"] = publicKey;
    headers["x-api-key"] = publicKey;
  }

  return headers;
}

async function basqetRequest<T>(
  secretKey: string,
  publicKey: string | undefined,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${DEFAULT_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildBasqetHeaders(secretKey, publicKey),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Basqet API error (${response.status}): ${errText}`);
  }

  return response.json() as Promise<T>;
}

function tryLoadBasqetSdk(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("basqet-node");
  } catch {
    return null;
  }
}

function readCandidate<T = any>(obj: any, paths: string[], fallback?: T): T | undefined {
  for (const path of paths) {
    const value = path.split(".").reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj);
    if (value !== undefined && value !== null && value !== "") {
      return value as T;
    }
  }
  return fallback;
}

export async function initializeBasqetPayin(input: BasqetPayinInitInput): Promise<BasqetPayinInitResult> {
  const sdk = tryLoadBasqetSdk();

  if (sdk) {
    const Basqet = sdk.default || sdk;
    const client = new Basqet(input.secretKey, input.publicKey || "");

    const initialized = await client.initializeTransaction({
      customer: input.customer,
      amount: String(input.amount),
      currency: input.currency,
      meta: {
        ...(input.metadata || {}),
        reference: input.reference,
      },
    });

    const initialPayload = initialized?.data || initialized;
    const transactionId = readCandidate<string>(initialPayload, ["id", "transaction_id", "data.id", "data.transaction_id"]);

    let initiated: any = initialPayload;
    if (transactionId) {
      try {
        initiated = await client.initiateTransaction(transactionId, {
          currency: input.currency,
          ...(input.metadata?.currency_id ? { currency_id: input.metadata.currency_id } : {}),
        });
      } catch {
        // Some Basqet setups return checkout URL at initialize stage and do not require initiate.
      }
    }

    const payload = initiated?.data || initiated || initialPayload;

    const providerRef =
      readCandidate<string>(payload, ["reference", "id", "transaction_id", "data.reference", "data.id", "data.transaction_id"]) ||
      input.reference;

    const paymentUrl = readCandidate<string>(payload, ["checkout_url", "payment_url", "hosted_url", "data.checkout_url", "data.payment_url"]);
    if (!paymentUrl) {
      console.warn("[BasqetClient SDK] No checkout URL found in response. Keys:", Object.keys(payload || {}), "Raw:", JSON.stringify(payload).slice(0, 500));
    }

    return {
      providerRef,
      transactionId: readCandidate<string>(payload, ["id", "transaction_id", "data.id", "data.transaction_id"], transactionId),
      paymentUrl,
      status: readCandidate<string>(payload, ["status", "data.status"], "pending"),
      raw: payload,
    };
  }

  // HTTP fallback when SDK is unavailable.
  const initializePayload = await basqetRequest<any>(input.secretKey, input.publicKey, INIT_TRANSACTION_PATH, {
    method: "POST",
    body: JSON.stringify({
      customer: input.customer,
      amount: String(input.amount),
      currency: input.currency,
      meta: {
        ...(input.metadata || {}),
        reference: input.reference,
      },
    }),
  });

  const initializedData = initializePayload?.data || initializePayload;
  const transactionId = readCandidate<string>(initializedData, ["id", "transaction_id", "data.id", "data.transaction_id"]);

  let initiatedPayload: any = initializedData;
  if (transactionId) {
    initiatedPayload = await basqetRequest<any>(input.secretKey, input.publicKey, INITIATE_TRANSACTION_PATH, {
      method: "POST",
      body: JSON.stringify({
        transactionId,
        currency: input.currency,
        ...(input.metadata?.currency_id ? { currency_id: input.metadata.currency_id } : {}),
      }),
    });
  }

  const data = initiatedPayload?.data || initiatedPayload || initializedData;
  const providerRef =
    readCandidate<string>(data, ["reference", "id", "transaction_id", "data.reference", "data.id", "data.transaction_id"]) ||
    input.reference;

  const paymentUrl = readCandidate<string>(data, ["checkout_url", "payment_url", "hosted_url", "data.checkout_url", "data.payment_url"]);
  if (!paymentUrl) {
    console.warn("[BasqetClient HTTP] No checkout URL found in response. Keys:", Object.keys(data || {}), "Raw:", JSON.stringify(data).slice(0, 500));
  }

  return {
    providerRef,
    transactionId,
    paymentUrl,
    status: readCandidate<string>(data, ["status", "data.status"], "pending"),
    raw: data,
  };
}

export async function verifyBasqetPayin(
  secretKey: string,
  publicKey: string | undefined,
  reference: string,
): Promise<BasqetVerifyResult> {
  const sdk = tryLoadBasqetSdk();

  let payload: any;
  if (sdk) {
    const Basqet = sdk.default || sdk;
    const client = new Basqet(secretKey, publicKey || "");
    payload = await client.verifyTransaction(reference);
  } else {
    payload = await basqetRequest<any>(secretKey, publicKey, `${VERIFY_TRANSACTION_PATH}/${encodeURIComponent(reference)}`, {
      method: "GET",
    });
  }

  const data = payload?.data || payload;
  const statusRaw = String(readCandidate<string>(data, ["status", "data.status"], "pending") || "pending").toLowerCase();
  const paid = ["successful", "success", "completed", "paid", "confirmed"].includes(statusRaw);

  return {
    paid,
    amountReceived: Number(readCandidate<number | string>(data, ["amount", "paid_amount", "amount_paid", "data.amount", "data.paid_amount"], 0)) || 0,
    providerRef:
      readCandidate<string>(data, ["reference", "id", "transaction_id", "data.reference", "data.id", "data.transaction_id"]) ||
      reference,
    status: statusRaw,
    raw: data,
  };
}

export function validateBasqetWebhookSignature(
  body: string,
  headers: Record<string, string>,
  secret: string | undefined,
): boolean {
  if (!secret) return true;

  const signatureHeader =
    headers["x-basqet-signature"] ||
    headers["basqet-signature"] ||
    headers["x-quidax-signature"] ||
    headers["quidax-signature"];

  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return signatureHeader === expected;
  }
}

export async function initiateBasqetUsdtPayout(input: BasqetPayoutInput): Promise<BasqetPayoutResult> {
  const payload = await basqetRequest<any>(input.secretKey, input.publicKey, INIT_PAYOUT_PATH, {
    method: "POST",
    headers: {
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      amount: String(input.amount),
      currency: input.currency,
      destination: {
        address: input.recipientAddress,
        network: input.network || "TRC-20",
      },
      reference: input.reference,
      ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),
      meta: input.metadata || {},
    }),
  });

  const data = payload?.data || payload;
  const status = String(readCandidate<string>(data, ["status", "data.status"], "pending") || "pending").toLowerCase();

  return {
    accepted: ["accepted", "queued", "processing", "pending", "submitted", "completed", "success", "successful"].includes(status),
    providerRef:
      readCandidate<string>(data, ["reference", "id", "payout_id", "data.reference", "data.id", "data.payout_id"]) ||
      input.reference,
    payoutId: readCandidate<string>(data, ["payout_id", "id", "data.payout_id", "data.id"]),
    status,
    txHash: readCandidate<string>(data, ["tx_hash", "transaction_hash", "data.tx_hash", "data.transaction_hash"]),
    raw: data,
  };
}

export async function verifyBasqetUsdtPayout(
  secretKey: string,
  publicKey: string | undefined,
  providerRef: string,
): Promise<BasqetPayoutResult> {
  const payload = await basqetRequest<any>(secretKey, publicKey, `${VERIFY_PAYOUT_PATH}/${encodeURIComponent(providerRef)}`, {
    method: "GET",
  });

  const data = payload?.data || payload;
  const status = String(readCandidate<string>(data, ["status", "data.status"], "pending") || "pending").toLowerCase();

  return {
    accepted: ["accepted", "queued", "processing", "pending", "submitted", "completed", "success", "successful"].includes(status),
    providerRef:
      readCandidate<string>(data, ["reference", "id", "payout_id", "data.reference", "data.id", "data.payout_id"]) ||
      providerRef,
    payoutId: readCandidate<string>(data, ["payout_id", "id", "data.payout_id", "data.id"]),
    status,
    txHash: readCandidate<string>(data, ["tx_hash", "transaction_hash", "data.tx_hash", "data.transaction_hash"]),
    raw: data,
  };
}
