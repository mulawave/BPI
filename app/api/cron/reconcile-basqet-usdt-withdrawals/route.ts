import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBasqetUsdtPayout } from "@/server/services/payment/BasqetClient";
import { notifyWithdrawalStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { verifyCronAuth } from "@/lib/cron";

const BATCH_SIZE = 25;

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const cryptoConfig = await prisma.paymentGatewayConfig.findFirst({
    where: { gatewayName: "crypto", isActive: true },
    select: {
      apiProvider: true,
      publicKey: true,
      secretKey: true,
      cryptoPublicKey: true,
      cryptoSecretKey: true,
    },
  });

  if ((cryptoConfig?.apiProvider || "").toLowerCase() !== "basqet") {
    return NextResponse.json({
      message: "Crypto provider is not basqet; skipping reconciliation",
      processed: 0,
      updated: 0,
      skipped: 0,
      failures: 0,
      results: [],
    });
  }

  const secretKey = cryptoConfig?.cryptoSecretKey || cryptoConfig?.secretKey;
  const publicKey = cryptoConfig?.cryptoPublicKey || cryptoConfig?.publicKey || undefined;

  if (!secretKey) {
    return NextResponse.json({ error: "Basqet secret key is not configured" }, { status: 503 });
  }

  const candidates = await prisma.transaction.findMany({
    where: {
      transactionType: "WITHDRAWAL_USDT",
      status: { in: ["pending", "processing"] },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  const results: Array<{ id: string; reference: string; status: string; detail?: string }> = [];
  let updated = 0;
  let skipped = 0;
  let failures = 0;

  for (const tx of candidates) {
    try {
      let metadata: Record<string, any> = {};
      try {
        metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
      } catch (parseError) {
        console.warn("[CRON][BASQET-USDT] Failed to parse transaction metadata", {
          transactionId: tx.id,
          reference: tx.reference,
          parseError: parseError instanceof Error ? parseError.message : "unknown_parse_error",
        });
        metadata = {};
      }

      const providerMode = String(metadata?.providerMode || "").toLowerCase();
      const provider = String(metadata?.provider || "").toLowerCase();
      const providerRef =
        metadata?.basqet?.providerRef ||
        metadata?.providerReference ||
        tx.reference;

      // Skip manual/fallback records and incomplete provider refs.
      if (providerMode.includes("manual") || provider === "manual" || !providerRef) {
        skipped += 1;
        results.push({
          id: tx.id,
          reference: tx.reference || tx.id,
          status: "skipped",
          detail: "manual_or_missing_provider_ref",
        });
        continue;
      }

      const verification = await verifyBasqetUsdtPayout(secretKey, publicKey, providerRef);
      const normalized = (verification.status || "pending").toLowerCase();
      const completed = ["completed", "success", "successful", "paid"].includes(normalized);
      const failed = ["failed", "rejected", "cancelled", "canceled"].includes(normalized);
      const nextStatus = completed ? "completed" : failed ? "failed" : "processing";

      metadata.basqet = {
        ...(metadata.basqet || {}),
        providerRef: verification.providerRef,
        payoutId: verification.payoutId,
        txHash: verification.txHash,
        status: verification.status,
        lastReconciledAt: new Date().toISOString(),
        source: "cron",
      };
      if (verification.txHash) {
        metadata.adminTxHash = verification.txHash;
      }

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: nextStatus,
          metadata: JSON.stringify(metadata),
        },
      });

      await prisma.withdrawalHistory.updateMany({
        where: {
          userId: tx.userId,
          amount: Math.abs(tx.amount),
          status: { in: ["pending", "processing"] },
        },
        data: { status: nextStatus },
      });

      if (completed) {
        const receiptUrl = generateReceiptLink(tx.id, "withdrawal");
        await notifyWithdrawalStatus(
          tx.userId,
          "completed",
          Math.abs(tx.amount),
          tx.reference || providerRef,
          receiptUrl,
        );
      } else if (failed) {
        await notifyWithdrawalStatus(
          tx.userId,
          "failed",
          Math.abs(tx.amount),
          tx.reference || providerRef,
        );
      }

      updated += 1;
      results.push({
        id: tx.id,
        reference: tx.reference || providerRef,
        status: nextStatus,
      });
    } catch (error) {
      failures += 1;
      results.push({
        id: tx.id,
        reference: tx.reference || tx.id,
        status: "error",
        detail: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return NextResponse.json({
    processed: candidates.length,
    updated,
    skipped,
    failures,
    results,
  });
}
