// Crypto Provider Webhooks — unified handler for Coinbase Commerce, NowPayments, Binance Pay
// Each provider sends different webhook formats; this route detects and processes them.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { webhookLimiter, applyRateLimit } from "@/lib/rateLimit";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { validateBasqetWebhookSignature } from "@/server/services/payment/BasqetClient";
import { recordRevenue } from "@/server/services/revenue.service";

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const limited = await applyRateLimit(request, webhookLimiter);
    if (limited) return limited;

    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // Detect provider from headers
    const provider = detectProvider(headers);
    console.log(`[CryptoWebhook] Received webhook from: ${provider}`);

    let result: WebhookResult;

    switch (provider) {
      case "coinbase_commerce":
        result = await handleCoinbaseWebhook(body, headers);
        break;
      case "nowpayments":
        result = await handleNowPaymentsWebhook(body, headers);
        break;
      case "binance_pay":
        result = await handleBinancePayWebhook(body, headers);
        break;
      case "basqet":
        result = await handleBasqetWebhook(body, headers);
        // Route Basqet-specific non-payment events before the generic paid-check
        if (!result.paid && result.reference) {
          if (result.status === "blockchain_awaiting") {
            await processBasqetPending(result);
            return NextResponse.json({ status: "acknowledged" }, { status: 200 });
          }
          if (result.status === "abandoned") {
            await processBasqetAbandoned(result);
            return NextResponse.json({ status: "acknowledged" }, { status: 200 });
          }
          if (result.status === "overpaid" || result.status === "underpaid") {
            await processBasqetMismatch(result);
            return NextResponse.json({ status: "acknowledged" }, { status: 200 });
          }
        }
        break;
      default:
        console.warn("[CryptoWebhook] Unknown provider, ignoring");
        return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    if (!result.paid || !result.reference) {
      console.log(`[CryptoWebhook] Payment not confirmed yet: ${result.status}`);
      return NextResponse.json({ status: "acknowledged" }, { status: 200 });
    }

    // Process the confirmed payment
    await processConfirmedCryptoPayment(result);

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[CryptoWebhook] Error:", error);
    // Return 200 to prevent retries for unrecoverable errors
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ── Provider detection ──────────────────────────────────────────────

function detectProvider(headers: Record<string, string>): string {
  if (headers["x-cc-webhook-signature"]) return "coinbase_commerce";
  if (headers["x-nowpayments-sig"]) return "nowpayments";
  if (headers["binancepay-timestamp"]) return "binance_pay";
  // Basqet uses `basqetSignature` header (camelCase), which arrives lowercase in Node.js headers
  if (headers["basqetsignature"] || headers["x-basqet-signature"] || headers["basqet-signature"]) return "basqet";
  return "unknown";
}

// ── Webhook result type ─────────────────────────────────────────────

interface WebhookResult {
  paid: boolean;
  reference?: string;
  userId?: string;
  amountFiat: number;
  amountCrypto?: number;
  cryptoCurrency?: string;
  providerRef?: string;
  status: string;
}

// ── Coinbase Commerce ───────────────────────────────────────────────

async function handleCoinbaseWebhook(body: string, headers: Record<string, string>): Promise<WebhookResult> {
  const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sig = headers["x-cc-webhook-signature"];
    const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
    if (sig !== expected) {
      throw new Error("Invalid Coinbase Commerce webhook signature");
    }
  }

  const payload = JSON.parse(body);
  const event = payload.event;
  const data = event?.data;

  if (event?.type !== "charge:confirmed" && event?.type !== "charge:resolved") {
    return { paid: false, amountFiat: 0, status: event?.type || "unknown" };
  }

  const reference = data?.metadata?.reference;
  const userId = data?.metadata?.userId;
  const amountFiat = parseFloat(data?.pricing?.local?.amount || "0");

  return {
    paid: true,
    reference,
    userId,
    amountFiat,
    providerRef: data?.code,
    cryptoCurrency: data?.payments?.[0]?.value?.crypto?.currency,
    amountCrypto: parseFloat(data?.payments?.[0]?.value?.crypto?.amount || "0"),
    status: "confirmed",
  };
}

// ── NowPayments ─────────────────────────────────────────────────────

async function handleNowPaymentsWebhook(body: string, headers: Record<string, string>): Promise<WebhookResult> {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (ipnSecret) {
    const sig = headers["x-nowpayments-sig"];
    const payload = JSON.parse(body);
    // NowPayments sorts keys and HMACs the sorted JSON
    const sorted = Object.keys(payload).sort().reduce((obj: Record<string, unknown>, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});
    const expected = crypto.createHmac("sha512", ipnSecret).update(JSON.stringify(sorted)).digest("hex");
    if (sig !== expected) {
      throw new Error("Invalid NowPayments webhook signature");
    }
  }

  const payload = JSON.parse(body);
  const status = payload.payment_status;

  if (status !== "finished" && status !== "confirmed") {
    return { paid: false, amountFiat: payload.price_amount || 0, status };
  }

  return {
    paid: true,
    reference: payload.order_id,
    amountFiat: payload.price_amount || 0,
    amountCrypto: payload.actually_paid,
    cryptoCurrency: payload.pay_currency?.toUpperCase(),
    providerRef: String(payload.payment_id),
    status: "confirmed",
  };
}

// ── Binance Pay ─────────────────────────────────────────────────────

async function handleBinancePayWebhook(body: string, headers: Record<string, string>): Promise<WebhookResult> {
  // Binance Pay webhook verification uses the certificate public key
  // For now, we verify the basic structure; full cert verification is provider-specific
  const payload = JSON.parse(body);

  if (payload.bizType !== "PAY" || payload.bizStatus !== "PAY_SUCCESS") {
    return { paid: false, amountFiat: 0, status: payload.bizStatus || "unknown" };
  }

  const data = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;

  return {
    paid: true,
    reference: data?.merchantTradeNo,
    amountFiat: parseFloat(data?.orderAmount || "0"),
    providerRef: data?.transactionId,
    cryptoCurrency: data?.currency,
    status: "confirmed",
  };
}

// ── Basqet ─────────────────────────────────────────────────────────

async function handleBasqetWebhook(body: string, headers: Record<string, string>): Promise<WebhookResult> {
  if (!process.env.BASQET_WEBHOOK_SECRET) {
    throw new Error("BASQET_WEBHOOK_SECRET is not configured");
  }

  const isValid = validateBasqetWebhookSignature(body, headers, process.env.BASQET_WEBHOOK_SECRET);
  if (!isValid) {
    throw new Error("Invalid Basqet webhook signature");
  }

  const payload = JSON.parse(body);
  // Basqet webhook structure: { event: "payment.received", data: { transaction: { ... } } }
  const event = payload?.event || "";
  const transaction = payload?.data?.transaction || payload?.data || {};
  const meta = transaction?.meta || {};

  const rawStatus = (transaction?.status || "").toUpperCase();
  const reference = meta?.reference || transaction?.reference || transaction?.id;

  const amountFiat = Number(transaction?.amount_paid || transaction?.initialized_amount || 0);
  const amountCrypto = Number(transaction?.payment_amount || 0);

  // Map Basqet events to internal statuses
  let paid = false;
  let internalStatus: string;

  if (event === "payment.received" && rawStatus === "SUCCESSFUL") {
    // Only event that confirms blockchain delivery — trigger wallet credit
    paid = true;
    internalStatus = "successful";
  } else if (event === "payment.pending") {
    // Blockchain detected the transaction — awaiting confirmations
    internalStatus = "blockchain_awaiting";
  } else if (event === "payment.abandoned") {
    // Session expired; check for over/underpayment variants
    if (rawStatus === "OVERPAID") {
      internalStatus = "overpaid";
    } else if (rawStatus === "UNDERPAID") {
      internalStatus = "underpaid";
    } else {
      internalStatus = "abandoned";
    }
  } else {
    internalStatus = rawStatus.toLowerCase() || event;
  }

  return {
    paid,
    reference,
    userId: meta?.userId,
    amountFiat,
    amountCrypto,
    cryptoCurrency: (transaction?.payment_currency || meta?.cryptoCurrency || "USDT").toUpperCase(),
    providerRef: transaction?.id || transaction?.reference || reference,
    status: internalStatus,
  };
}

// ── Basqet pending / abandoned / mismatch helpers ──────────────────────

async function processBasqetPending(result: WebhookResult) {
  if (!result.reference) return;
  console.log(`[CryptoWebhook] Basqet payment.pending: blockchain detected for ${result.reference}`);

  // Update PendingPayment status so the frontend poller and admin can see it
  await prisma.pendingPayment.updateMany({
    where: { gatewayReference: result.reference, status: { in: ["pending", "processing"] } },
    data: { status: "blockchain_awaiting", reviewNotes: `Blockchain transaction detected at ${new Date().toISOString()}, awaiting confirmations.` },
  });

  // Notify user that their payment has been detected and is awaiting confirmations
  const pendingPayment = await prisma.pendingPayment.findFirst({
    where: { gatewayReference: result.reference },
    select: { userId: true, amount: true },
  });
  if (pendingPayment) {
    await notifyDepositStatus(pendingPayment.userId, "processing", pendingPayment.amount, result.reference);
  }
}

async function processBasqetAbandoned(result: WebhookResult) {
  if (!result.reference) return;
  console.log(`[CryptoWebhook] Basqet payment.abandoned: session expired for ${result.reference}`);

  const pendingPayment = await prisma.pendingPayment.findFirst({
    where: { gatewayReference: result.reference, status: { notIn: ["abandoned", "completed"] } },
    select: { id: true, userId: true, amount: true },
  });

  if (!pendingPayment) return;

  await prisma.$transaction([
    prisma.pendingPayment.update({
      where: { id: pendingPayment.id },
      data: { status: "abandoned", reviewNotes: `Payment session expired (Basqet abandoned) at ${new Date().toISOString()}` },
    }),
    prisma.transaction.updateMany({
      where: { reference: result.reference, userId: pendingPayment.userId, status: "pending" },
      data: { status: "failed", description: "Crypto deposit cancelled — payment session expired" },
    }),
  ]);

  await notifyDepositStatus(pendingPayment.userId, "failed", pendingPayment.amount, result.reference);
}

async function processBasqetMismatch(result: WebhookResult) {
  if (!result.reference) return;
  console.warn(`[CryptoWebhook] Basqet payment mismatch (${result.status}): ${result.reference} — requires admin review`);

  // Update PendingPayment to mismatch status for admin review. Do NOT credit the wallet.
  await prisma.pendingPayment.updateMany({
    where: { gatewayReference: result.reference, status: { notIn: ["completed", "abandoned"] } },
    data: {
      status: result.status, // "overpaid" or "underpaid"
      reviewNotes: `Basqet payment ${result.status} — requires admin review. Webhook received ${new Date().toISOString()}`,
    },
  });
}

// ── Process confirmed payment ───────────────────────────────────────

async function processConfirmedCryptoPayment(result: WebhookResult) {
  const { reference, userId: webhookUserId, amountFiat } = result;

  if (!reference) {
    console.warn("[CryptoWebhook] No reference in webhook data");
    return;
  }

  // Find the pending payment
  const pendingPayment = await prisma.pendingPayment.findFirst({
    where: { gatewayReference: reference, status: { in: ["pending", "processing"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!pendingPayment) {
    // Check if already processed
    const existing = await prisma.transaction.findFirst({
      where: { reference, status: { in: ["approved", "completed"] } },
    });
    if (existing) {
      console.log(`[CryptoWebhook] Payment ${reference} already processed`);
      return;
    }
    console.warn(`[CryptoWebhook] No pending payment found for reference: ${reference}`);
    return;
  }

  const userId = pendingPayment.userId;
  const metadata = pendingPayment.metadata as Record<string, any> | null;
  const depositAmount = metadata?.depositAmount || amountFiat;
  const vatAmount = metadata?.vatAmount || 0;
  // processingFeeAmount is stored in USD for revenue tracking
  // processingFeeAmountNgn is the NGN equivalent for transaction records
  const processingFeeAmount = Number(metadata?.processingFeeAmount || 0);
  const processingFeeAmountNgn = Number(metadata?.processingFeeAmountNgn || metadata?.processingFeeAmount || 0);

  // Atomically mark as processing
  const claimed = await prisma.pendingPayment.updateMany({
    where: { id: pendingPayment.id, status: { in: ["pending", "processing"] } },
    data: { status: "approved", reviewNotes: `Crypto webhook confirmed at ${new Date().toISOString()}` },
  });

  if (claimed.count === 0) {
    console.log(`[CryptoWebhook] Payment ${reference} already claimed`);
    return;
  }

  // Credit wallet
  await prisma.user.update({
    where: { id: userId },
    data: { wallet: { increment: depositAmount } },
  });

  // Update transaction to completed
  await prisma.transaction.updateMany({
    where: { reference, userId, status: "pending" },
    data: {
      status: "completed",
      description: `Wallet deposit via ${result.cryptoCurrency || "crypto"} (confirmed)`,
    },
  });

  // Create VAT transaction
  if (vatAmount > 0) {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "VAT",
        amount: vatAmount,
        description: `VAT on crypto deposit (7.5%)`,
        status: "completed",
        reference: `VAT-${reference}`,
        walletType: "main",
      },
    });
  }

  // Create USDT_DEPOSIT_FEE transaction and record as platform revenue
  if (processingFeeAmount > 0) {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "USDT_DEPOSIT_FEE",
        amount: processingFeeAmountNgn, // Store in NGN to match other transaction amounts
        description: `Processing fee on USDT deposit`,
        status: "completed",
        reference: `FEE-DEP-${reference}`,
        walletType: "main",
      },
    });

    await recordRevenue(prisma, {
      source: "DEPOSIT_FEE",
      amount: processingFeeAmount, // Revenue tracked in USD
      currency: "USD",
      sourceId: reference,
      userId,
      description: `USDT deposit processing fee — ref ${reference}`,
    });
  }

  // Mark pending payment as completed
  await prisma.pendingPayment.update({
    where: { id: pendingPayment.id },
    data: { status: "completed" },
  });

  const receiptLink = generateReceiptLink(pendingPayment.id, "deposit");
  await notifyDepositStatus(userId, "completed", depositAmount, reference, receiptLink);

  console.log(`[CryptoWebhook] Successfully credited ₦${depositAmount} to user ${userId} via ${result.cryptoCurrency}`);
}
