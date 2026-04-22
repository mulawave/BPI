// Poll-fallback status endpoint for Basqet USDT deposits.
// Frontend uses this with exponential backoff when webhooks are delayed.
// Returns the current status from both the DB record and Basqet API.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { verifyBasqetPayin } from "@/server/services/payment/BasqetClient";
import { applyRateLimit, webhookLimiter } from "@/lib/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } },
) {
  // Rate limit: shared with webhook limiter (60/min per IP)
  const limited = await applyRateLimit(request, webhookLimiter);
  if (limited) return limited;

  // Auth check — user must be signed in
  const session = await getServerSession(authConfig);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reference } = params;
  if (!reference) {
    return NextResponse.json({ error: "Reference is required" }, { status: 400 });
  }

  // Security: verify this reference belongs to the authenticated user
  const pendingPayment = await prisma.pendingPayment.findFirst({
    where: { gatewayReference: reference, userId },
    select: { id: true, status: true, metadata: true },
  });

  if (!pendingPayment) {
    // Do not reveal whether the reference exists at all for other users
    return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
  }

  // If already in a terminal state, return immediately without calling Basqet
  const terminalStatuses = ["completed", "approved", "abandoned", "failed"];
  if (terminalStatuses.includes(pendingPayment.status)) {
    return NextResponse.json({ status: pendingPayment.status.toUpperCase() });
  }

  // Try to get live status from Basqet (only if configured as active crypto provider)
  const cryptoGw = await prisma.paymentGatewayConfig.findFirst({
    where: { gatewayName: "crypto", isActive: true },
    select: { apiProvider: true, cryptoPublicKey: true, publicKey: true, cryptoSecretKey: true, secretKey: true },
  });

  const isBasqet = cryptoGw?.apiProvider?.toLowerCase() === "basqet";
  const publicKey = cryptoGw?.cryptoPublicKey || cryptoGw?.publicKey;
  const secretKey = cryptoGw?.cryptoSecretKey || cryptoGw?.secretKey;

  if (isBasqet && publicKey && secretKey) {
    try {
      const result = await verifyBasqetPayin(secretKey, publicKey, reference);
      return NextResponse.json({ status: result.status });
    } catch (err) {
      console.error("[CryptoStatus] Basqet verify failed, returning DB status:", err);
      // Fall through to DB status on Basqet error
    }
  }

  // Fallback: return status from DB record
  const dbStatusMap: Record<string, string> = {
    pending: "PENDING",
    processing: "PROCESSING",
    blockchain_awaiting: "PENDING",
    overpaid: "OVERPAID",
    underpaid: "UNDERPAID",
  };

  const status = dbStatusMap[pendingPayment.status] || pendingPayment.status.toUpperCase();
  return NextResponse.json({ status });
}
