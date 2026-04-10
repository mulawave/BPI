/**
 * Cron endpoint: Recover Stuck Payments
 *
 * Finds PendingPayment records from Paystack/Flutterwave that are stuck in
 * "pending" or "processing" status, verifies them with the gateway, and
 * auto-completes them based on their transactionType.
 *
 * Handles: MEMBERSHIP, MEMBERSHIP_UPGRADE, EMPOWERMENT, DEPOSIT, STORE_PURCHASE
 *
 * Run every 5–10 minutes via external scheduler.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/recover-stuck-payments", "schedule": "*\/10 * * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentProcessor } from "@/server/services/payment/PaymentProcessor";
import { PaymentGateway, PaymentStatus } from "@/server/services/payment/types";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";

const CRON_SECRET = process.env.CRON_SECRET;

// Only recover payments stuck for at least 2 minutes (avoid racing with live webhooks)
const MIN_AGE_MS = 2 * 60 * 1000;
// Don't try to recover payments older than 48 hours
const MAX_AGE_MS = 48 * 60 * 60 * 1000;
// Process at most this many per run to avoid timeout
const BATCH_SIZE = 25;

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const minCreatedAt = new Date(now.getTime() - MAX_AGE_MS);
  const maxCreatedAt = new Date(now.getTime() - MIN_AGE_MS);

  const results: { reference: string; type: string; status: string; error?: string }[] = [];

  try {
    // Find stuck payments from automated gateways only
    const stuckPayments = await prisma.pendingPayment.findMany({
      where: {
        status: { in: ["pending", "processing"] },
        paymentMethod: { in: ["paystack", "flutterwave"] },
        gatewayReference: { not: null },
        createdAt: { gte: minCreatedAt, lte: maxCreatedAt },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      include: { User: { select: { id: true, name: true, email: true, country: true, state: true } } },
    });

    if (stuckPayments.length === 0) {
      return NextResponse.json({ message: "No stuck payments found", recovered: 0, results: [] });
    }

    console.log(`🔄 [PAYMENT-RECOVERY] Found ${stuckPayments.length} stuck payments to process`);

    for (const payment of stuckPayments) {
      const ref = payment.gatewayReference!;
      const gateway = payment.paymentMethod === "paystack" ? PaymentGateway.PAYSTACK : PaymentGateway.FLUTTERWAVE;

      try {
        // Skip if another process already handled this (optimistic concurrency)
        const fresh = await prisma.pendingPayment.findUnique({ where: { id: payment.id }, select: { status: true } });
        if (!fresh || fresh.status === "approved" || fresh.status === "completed") {
          results.push({ reference: ref, type: payment.transactionType, status: "already_processed" });
          continue;
        }

        // Verify with gateway
        const verification = await PaymentProcessor.verifyPayment(gateway, ref);
        const successStates = [PaymentStatus.SUCCESS, PaymentStatus.SUCCESSFUL];
        const isSuccess = verification.success && (!verification.status || successStates.includes(verification.status));

        if (!isSuccess) {
          // Distinguish gateway-confirmed failures from verification errors (network issues)
          // When PaymentProcessor.verifyPayment catches an exception, it sets error + message fields.
          // When the gateway API responds but the payment failed, no error field is set.
          const isVerificationError = !!verification.error;

          if (!isVerificationError) {
            // Gateway confirmed this payment was not successful — mark rejected
            await prisma.pendingPayment.update({
              where: { id: payment.id },
              data: {
                status: "rejected",
                reviewNotes: `Auto-rejected by recovery cron: gateway returned ${verification.status || "not_successful"} at ${now.toISOString()}`,
              },
            });
            results.push({ reference: ref, type: payment.transactionType, status: "rejected_gateway_failed" });
          } else {
            // Could not reach gateway or verification error — skip, retry next run
            results.push({ reference: ref, type: payment.transactionType, status: "verification_error_skipped" });
          }
          continue;
        }

        // Claim the payment atomically
        const claimed = await prisma.pendingPayment.updateMany({
          where: { id: payment.id, status: { in: ["pending", "processing"] } },
          data: { status: "processing", reviewNotes: `Recovery cron claimed at ${now.toISOString()}` },
        });
        if (claimed.count === 0) {
          results.push({ reference: ref, type: payment.transactionType, status: "claim_race_lost" });
          continue;
        }

        const meta = (payment.metadata as Record<string, any>) || {};
        const userId = payment.userId;

        // ── MEMBERSHIP ──────────────────────────────────────────
        if (payment.transactionType === "MEMBERSHIP") {
          const packageId = meta.packageId;
          if (!packageId) {
            await markRecoveryFailed(payment.id, "Missing packageId in metadata");
            results.push({ reference: ref, type: "MEMBERSHIP", status: "error", error: "missing_packageId" });
            continue;
          }
          const { activateMembershipAfterExternalPayment } = await import("@/server/services/membershipPayments.service");
          await activateMembershipAfterExternalPayment({
            prisma,
            userId,
            packageId,
            selectedPalliative: meta.selectedPalliative,
            paymentReference: ref,
            paymentMethodLabel: payment.paymentMethod,
            activatorName: payment.User?.name || payment.User?.email || "Member",
          });
          await prisma.transaction.updateMany({
            where: { reference: ref, userId, status: "pending" },
            data: { status: "completed" },
          });
          await markRecoveryApproved(payment.id, "MEMBERSHIP");

          // Revenue
          const pkg = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
          if (pkg) {
            try {
              await recordRevenue(prisma, {
                source: "MEMBERSHIP_REGISTRATION",
                amount: pkg.price,
                currency: "NGN",
                sourceId: `MEMBERSHIP_REGISTRATION:${ref}`,
                description: `Membership: ${pkg.name} (auto-recovered)`,
                userId,
                packageId,
                programType: "MEMBERSHIP",
                country: payment.User?.country ?? undefined,
                state: payment.User?.state ?? undefined,
                region: getNigerianRegion(payment.User?.state),
                metadata: { paymentRef: ref, autoRecovered: true, paymentMethod: payment.paymentMethod },
              });
            } catch (err: any) { if (err?.code !== "P2002") throw err; }
          }
          results.push({ reference: ref, type: "MEMBERSHIP", status: "recovered" });

        // ── MEMBERSHIP_UPGRADE ──────────────────────────────────
        } else if (payment.transactionType === "MEMBERSHIP_UPGRADE") {
          const packageId = meta.packageId;
          const currentPackageId = meta.currentPackageId;
          if (!packageId || !currentPackageId) {
            await markRecoveryFailed(payment.id, "Missing packageId or currentPackageId");
            results.push({ reference: ref, type: "MEMBERSHIP_UPGRADE", status: "error", error: "missing_package_ids" });
            continue;
          }
          const { upgradeMembershipAfterExternalPayment } = await import("@/server/services/membershipPayments.service");
          await upgradeMembershipAfterExternalPayment({
            prisma,
            userId,
            packageId,
            currentPackageId,
            selectedPalliative: meta.selectedPalliative,
            paymentReference: ref,
            paymentMethodLabel: payment.paymentMethod,
          });
          await prisma.transaction.updateMany({
            where: { reference: ref, userId, status: "pending" },
            data: { status: "completed" },
          });
          await markRecoveryApproved(payment.id, "MEMBERSHIP_UPGRADE");
          results.push({ reference: ref, type: "MEMBERSHIP_UPGRADE", status: "recovered" });

        // ── EMPOWERMENT ─────────────────────────────────────────
        } else if (payment.transactionType === "EMPOWERMENT") {
          await prisma.$transaction([
            prisma.transaction.updateMany({
              where: { reference: ref, userId, status: "pending" },
              data: { status: "completed" },
            }),
            prisma.pendingPayment.update({
              where: { id: payment.id },
              data: {
                status: "approved",
                reviewedAt: new Date(),
                reviewNotes: `Auto-recovered by cron (EMPOWERMENT)`,
              },
            }),
          ]);
          if (meta.beneficiaryId && meta.empowermentType) {
            const beneficiary = await prisma.user.findUnique({
              where: { id: meta.beneficiaryId },
              select: { id: true, name: true, email: true },
            });
            if (beneficiary) {
              const { finalizeEmpowermentPackage } = await import("@/server/services/empowermentPayments.service");
              await finalizeEmpowermentPackage({
                sponsorId: userId,
                beneficiary,
                empowermentType: meta.empowermentType,
                packageFee: meta.packageFee ?? 330000,
                vat: meta.vat ?? 24750,
                totalCost: meta.totalCost ?? (meta.packageFee ?? 330000) + (meta.vat ?? 24750),
              });
            }
          }
          results.push({ reference: ref, type: "EMPOWERMENT", status: "recovered" });

        // ── DEPOSIT / TOPUP ─────────────────────────────────────
        } else if (payment.transactionType === "DEPOSIT" || payment.transactionType === "TOPUP") {
          const transaction = await prisma.transaction.findFirst({
            where: { reference: ref, userId, status: "pending", transactionType: "DEPOSIT" },
          });
          if (transaction) {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: userId },
                data: { wallet: { increment: transaction.amount } },
              }),
              prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "completed" },
              }),
              prisma.pendingPayment.update({
                where: { id: payment.id },
                data: {
                  status: "approved",
                  reviewedAt: new Date(),
                  reviewNotes: `Auto-recovered by cron (DEPOSIT)`,
                },
              }),
            ]);
            await notifyDepositStatus(userId, "completed", transaction.amount, ref, generateReceiptLink(transaction.id, "deposit"));
            results.push({ reference: ref, type: "DEPOSIT", status: "recovered" });
          } else {
            await markRecoveryFailed(payment.id, "No pending deposit transaction found");
            results.push({ reference: ref, type: "DEPOSIT", status: "error", error: "no_pending_transaction" });
          }

        // ── STORE_PURCHASE ──────────────────────────────────────
        } else if (payment.transactionType === "STORE_PURCHASE") {
          const orderId = meta.orderId;
          if (!orderId) {
            await markRecoveryFailed(payment.id, "Missing orderId in metadata");
            results.push({ reference: ref, type: "STORE_PURCHASE", status: "error", error: "missing_orderId" });
            continue;
          }
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { product: { include: { pickupCenter: true } }, user: true, pickupCenter: true },
          });
          if (!order || order.userId !== userId) {
            await markRecoveryFailed(payment.id, `Order ${orderId} not found or user mismatch`);
            results.push({ reference: ref, type: "STORE_PURCHASE", status: "error", error: "order_invalid" });
            continue;
          }
          if (order.status === "PENDING") {
            let claimCode = "";
            let codeExists = true;
            while (codeExists) {
              const rand = Math.floor(100000 + Math.random() * 900000);
              claimCode = `BPI-${rand}-PC`;
              const found = await prisma.order.findFirst({ where: { claimCode } });
              codeExists = Boolean(found);
            }
            await prisma.order.update({
              where: { id: order.id },
              data: { status: "PROCESSING", claimStatus: "CODE_ISSUED", claimCode },
            });
            try {
              const { sendEmail } = await import("@/lib/email");
              if (order.user?.email) {
                await sendEmail({
                  to: order.user.email,
                  subject: "Your BPI pickup claim code",
                  html: `<p>Hello ${order.user.name ?? ""},</p><p>Your order for <strong>${order.product?.name ?? "your item"}</strong> is confirmed.</p><p><strong>Claim Code:</strong> ${claimCode}</p><p>Please present this code and a valid ID at the pickup center to receive your item.</p>`,
                });
              }
            } catch { /* Email failures should not block recovery */ }

            const profitFiat = Number((order.pricingSnapshot as any)?.profit_fiat ?? 0);
            const totalFiat = Number((order.pricingSnapshot as any)?.total_fiat ?? payment.amount ?? 0);
            const amountForPools = profitFiat > 0 ? profitFiat : totalFiat;
            if (amountForPools > 0) {
              try {
                await recordRevenue(prisma, {
                  source: "STORE_PURCHASE",
                  amount: amountForPools,
                  currency: "NGN",
                  sourceId: order.id,
                  description: `Store purchase profit: ${order.product?.name || "Product"} (auto-recovered)`,
                  userId,
                  orderId: order.id,
                  productId: order.productId,
                  programType: "STORE",
                  country: order.user?.country ?? undefined,
                  state: order.user?.state ?? undefined,
                  region: getNigerianRegion(order.user?.state),
                  metadata: { paymentRef: ref, autoRecovered: true },
                });
              } catch (err: any) { if (err?.code !== "P2002") throw err; }
            }
          }
          await prisma.transaction.updateMany({
            where: { reference: ref, userId, status: "pending" },
            data: { status: "completed" },
          });
          await markRecoveryApproved(payment.id, "STORE_PURCHASE");
          results.push({ reference: ref, type: "STORE_PURCHASE", status: "recovered" });

        } else {
          // Unknown transaction type — leave in processing, log warning
          results.push({ reference: ref, type: payment.transactionType, status: "unknown_type" });
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ [PAYMENT-RECOVERY] Failed to recover ${ref}:`, error);
        // Revert to pending so the next cron run can retry
        try {
          await prisma.pendingPayment.updateMany({
            where: { id: payment.id, status: "processing" },
            data: { reviewNotes: `Recovery cron failed: ${errMsg}. Will retry on next run.` },
          });
        } catch { /* swallow */ }
        results.push({ reference: ref, type: payment.transactionType, status: "error", error: errMsg });
      }
    }

    const recovered = results.filter(r => r.status === "recovered").length;
    console.log(`✅ [PAYMENT-RECOVERY] Complete: ${recovered}/${stuckPayments.length} recovered`);

    // Audit log — use first recovered payment's userId, or first payment's userId as fallback
    try {
      const auditUserId = stuckPayments[0]?.userId;
      if (auditUserId) {
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: auditUserId,
            action: "PAYMENT_AUTO_RECOVERY_CRON",
            entity: "PendingPayment",
            entityId: "cron-run",
            changes: JSON.stringify({ found: stuckPayments.length, recovered, results }),
            status: recovered === stuckPayments.length ? "success" : "warning",
            createdAt: new Date(),
          },
        });
      }
    } catch (auditErr) {
      console.error("⚠️ [PAYMENT-RECOVERY] Audit log write failed (non-blocking):", auditErr);
    }

    return NextResponse.json({ message: `Processed ${stuckPayments.length} stuck payments`, recovered, total: stuckPayments.length, results });
  } catch (error) {
    console.error("❌ [PAYMENT-RECOVERY] Cron error:", error);
    return NextResponse.json({ error: "Recovery cron failed", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

async function markRecoveryApproved(paymentId: string, type: string) {
  await prisma.pendingPayment.update({
    where: { id: paymentId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewNotes: `Auto-recovered by cron (${type})`,
    },
  });
}

async function markRecoveryFailed(paymentId: string, reason: string) {
  await prisma.pendingPayment.updateMany({
    where: { id: paymentId, status: "processing" },
    data: {
      status: "pending",
      reviewNotes: `Recovery cron could not complete: ${reason}. Will retry.`,
    },
  });
}
