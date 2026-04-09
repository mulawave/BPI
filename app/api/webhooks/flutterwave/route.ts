// Flutterwave Webhook Handler
// Processes payment notifications from Flutterwave
// Auto-approves all successful Flutterwave payments (only bank transfers require admin approval)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "../../../../lib/prisma";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import {
  PaymentGatewayFactory,
  PaymentGateway,
} from "../../../../server/services/payment";
import { webhookLimiter, applyRateLimit } from "@/lib/rateLimit";

type PendingPaymentClaim =
  | { status: "claimed"; paymentId: string; userId: string }
  | { status: "already_processed" | "in_progress" | "missing" };

async function claimPendingPayment(txRef: string, purpose: string, expectedUserId?: string): Promise<PendingPaymentClaim> {
  const pendingPayment = await prisma.pendingPayment.findFirst({
    where: {
      gatewayReference: txRef,
      ...(expectedUserId ? { userId: expectedUserId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pendingPayment) {
    const completedTransaction = await prisma.transaction.findFirst({
      where: {
        reference: txRef,
        ...(expectedUserId ? { userId: expectedUserId } : {}),
        status: "completed",
      },
    });

    return completedTransaction ? { status: "already_processed" } : { status: "missing" };
  }

  if (pendingPayment.status === "approved" || pendingPayment.status === "completed") {
    return { status: "already_processed" };
  }

  if (pendingPayment.status === "processing") {
    return { status: "in_progress" };
  }

  const claimed = await prisma.pendingPayment.updateMany({
    where: {
      id: pendingPayment.id,
      status: "pending",
    },
    data: {
      status: "processing",
      reviewNotes: `Flutterwave webhook claimed payment for ${purpose} processing at ${new Date().toISOString()}`,
    },
  });

  if (claimed.count === 0) {
    const refreshed = await prisma.pendingPayment.findUnique({ where: { id: pendingPayment.id } });
    if (refreshed?.status === "approved" || refreshed?.status === "completed") {
      return { status: "already_processed" };
    }
    return { status: "in_progress" };
  }

  return {
    status: "claimed",
    paymentId: pendingPayment.id,
    userId: pendingPayment.userId,
  };
}

async function markPaymentApproved(paymentId: string, note: string) {
  await prisma.pendingPayment.update({
    where: { id: paymentId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewNotes: note,
    },
  });
}

async function markPaymentNeedsReview(paymentId: string, note: string) {
  await prisma.pendingPayment.updateMany({
    where: { id: paymentId, status: "processing" },
    data: { reviewNotes: note },
  });
}

async function writeProcessingWarning(txRef: string, purpose: string, amount: number, reason: string) {
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: "system",
      action: "PAYMENT_WEBHOOK_REVIEW_REQUIRED",
      entity: "PendingPayment",
      entityId: txRef,
      changes: JSON.stringify({ purpose, amount, gateway: "flutterwave", reason }),
      status: "warning",
      createdAt: new Date(),
    },
  });
}

/** Verify that the webhook amount matches the stored pending payment amount. Returns true if OK or no record to compare. */
async function verifyPaymentAmount(paymentId: string, receivedAmountNgn: number, txRef: string, purpose: string): Promise<boolean> {
  const pending = await prisma.pendingPayment.findUnique({ where: { id: paymentId }, select: { amount: true } });
  if (!pending || !pending.amount || pending.amount <= 0) return true;
  if (Math.abs(receivedAmountNgn - pending.amount) <= 1) return true;
  await markPaymentNeedsReview(
    paymentId,
    `Amount mismatch: received ₦${receivedAmountNgn}, expected ₦${pending.amount}. Requires manual review.`,
  );
  await writeProcessingWarning(txRef, purpose, receivedAmountNgn, `Amount mismatch: received ₦${receivedAmountNgn}, expected ₦${pending.amount}`);
  return false;
}

export async function POST(req: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const blocked = applyRateLimit(req, webhookLimiter);
  if (blocked) return blocked;

  console.log("📥 Flutterwave webhook received");
  let parsedTxRef: string | undefined;

  try {
    const payload = await req.json();
    const signature = req.headers.get("verif-hash");
    const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ Flutterwave webhook secret is not configured");
      return NextResponse.json(
        { error: "Webhook is not configured" },
        { status: 503 }
      );
    }

    console.log("📋 Webhook payload:", {
      event: payload.event,
      txRef: payload.data?.tx_ref,
      status: payload.data?.status,
    });

    // Get Flutterwave gateway instance
    const config = {
      enabled: true,
      environment: (process.env.FLUTTERWAVE_ENV as "test" | "live") || "test",
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      webhookSecret,
    };

    const gateway = await PaymentGatewayFactory.getGateway(
      PaymentGateway.FLUTTERWAVE,
      config
    );

    // Validate webhook signature
    const validation = await gateway.validateWebhook?.({
      event: payload.event,
      data: payload.data,
      signature: signature || undefined,
    });

    if (!validation || !validation.isValid) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Only process successful payments
    if (payload.event === "charge.completed" && payload.data?.status === "successful") {
      const txRef = payload.data.tx_ref;
      parsedTxRef = txRef;
      const amount = payload.data.amount;
      const currency = payload.data.currency;
      const flwRef = payload.data.flw_ref;
      const userId = payload.data.meta?.userId;
      const purpose = (payload.data.meta?.purpose || '').toUpperCase();
      const packageId = payload.data.meta?.packageId;
      const currentPackageId = payload.data.meta?.currentPackageId;

      console.log("✅ Processing successful Flutterwave payment:", {
        txRef,
        userId,
        amount,
        purpose,
        packageId,
      });

      // AUTO-APPROVE: Handle different payment purposes
      if (purpose === "MEMBERSHIP" && packageId && userId) {
        console.log("📦 [FLUTTERWAVE-WEBHOOK] Processing MEMBERSHIP activation...");

        const claim = await claimPendingPayment(txRef, purpose, userId);
        if (claim.status !== "claimed") {
          if (claim.status === "missing") {
            await writeProcessingWarning(txRef, purpose, amount, "No pending payment record was available to claim.");
          }
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Skipping duplicate or untracked membership payment:", txRef, claim.status);
          return NextResponse.json({ status: "success" });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount, txRef, purpose)) {
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Amount mismatch for membership payment:", txRef);
          return NextResponse.json({ status: "success" });
        }
        
        try {
          const { activateMembershipAfterExternalPayment } = await import("@/server/services/membershipPayments.service");
          
          await activateMembershipAfterExternalPayment({
            prisma,
            userId,
            packageId,
            selectedPalliative: payload.data.meta?.selectedPalliative,
            paymentReference: txRef,
            paymentMethodLabel: "Flutterwave",
            activatorName: payload.data.customer?.name || "Member"
          });

          // Mark pending transaction as completed
          await prisma.transaction.updateMany({
            where: { reference: txRef, userId, status: "pending" },
            data: { status: "completed" },
          });

          await markPaymentApproved(claim.paymentId, "Auto-approved via Flutterwave webhook (payment verified)");

          // Record revenue
          const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
          if (membershipPackage) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { country: true, state: true },
            });
            try {
              await recordRevenue(prisma, {
                source: "MEMBERSHIP_REGISTRATION",
                amount: membershipPackage.price,
                currency: "NGN",
                sourceId: `MEMBERSHIP_REGISTRATION:${txRef}`,
                description: `Membership purchase: ${membershipPackage.name} (Flutterwave auto-approved)`,
                userId,
                packageId,
                programType: "MEMBERSHIP",
                country: user?.country ?? undefined,
                state: user?.state ?? undefined,
                region: getNigerianRegion(user?.state),
                metadata: {
                  paymentRef: txRef,
                  paymentAmount: amount,
                  basePrice: membershipPackage.price,
                  vat: membershipPackage.vat,
                  packageName: membershipPackage.name,
                  selectedPalliative: payload.data.meta?.selectedPalliative ?? null,
                  paymentMethod: "FLUTTERWAVE",
                  autoApproved: true,
                },
              });
            } catch (err: any) {
              if (err?.code !== "P2002") throw err;
            }
          }

          // Audit log
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: "system",
              action: "PAYMENT_AUTO_APPROVE",
              entity: "PendingPayment",
              entityId: txRef,
              changes: JSON.stringify({ purpose: "MEMBERSHIP", amount, userId, gateway: "flutterwave" }),
              status: "success",
              createdAt: new Date(),
            },
          });
          
          console.log("✅ [FLUTTERWAVE-WEBHOOK] Membership activated & auto-approved");
        } catch (error) {
          await markPaymentNeedsReview(
            claim.paymentId,
            `Flutterwave membership webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          console.error("❌ [FLUTTERWAVE-WEBHOOK] Membership activation failed:", error);
          throw error;
        }
      } else if (purpose === "UPGRADE" && packageId && currentPackageId && userId) {
        console.log("📦 [FLUTTERWAVE-WEBHOOK] Processing MEMBERSHIP upgrade...");

        const claim = await claimPendingPayment(txRef, purpose, userId);
        if (claim.status !== "claimed") {
          if (claim.status === "missing") {
            await writeProcessingWarning(txRef, purpose, amount, "No pending payment record was available to claim.");
          }
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Skipping duplicate or untracked upgrade payment:", txRef, claim.status);
          return NextResponse.json({ status: "success" });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount, txRef, purpose)) {
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Amount mismatch for upgrade payment:", txRef);
          return NextResponse.json({ status: "success" });
        }
        
        try {
          const { upgradeMembershipAfterExternalPayment } = await import("@/server/services/membershipPayments.service");
          
          await upgradeMembershipAfterExternalPayment({
            prisma,
            userId,
            packageId,
            currentPackageId,
            selectedPalliative: payload.data.meta?.selectedPalliative,
            paymentReference: txRef,
            paymentMethodLabel: "Flutterwave"
          });

          // Mark pending transaction as completed
          await prisma.transaction.updateMany({
            where: { reference: txRef, userId, status: "pending" },
            data: { status: "completed" },
          });

          await markPaymentApproved(claim.paymentId, "Auto-approved via Flutterwave webhook (payment verified)");

          // Record revenue for upgrade
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { country: true, state: true },
          });
          try {
            await recordRevenue(prisma, {
              source: "MEMBERSHIP_REGISTRATION",
              amount,
              currency: "NGN",
              sourceId: `MEMBERSHIP_UPGRADE:${txRef}`,
              description: `Membership upgrade: From ${currentPackageId} to ${packageId} (Flutterwave auto-approved)`,
              userId,
              packageId,
              programType: "MEMBERSHIP_UPGRADE",
              country: user?.country ?? undefined,
              state: user?.state ?? undefined,
              region: getNigerianRegion(user?.state),
              metadata: {
                paymentRef: txRef,
                paymentAmount: amount,
                fromPackageId: currentPackageId,
                toPackageId: packageId,
                selectedPalliative: payload.data.meta?.selectedPalliative ?? null,
                paymentMethod: "FLUTTERWAVE",
                autoApproved: true,
              },
            });
          } catch (err: any) {
            if (err?.code !== "P2002") throw err;
          }

          // Audit log
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: "system",
              action: "PAYMENT_AUTO_APPROVE",
              entity: "PendingPayment",
              entityId: txRef,
              changes: JSON.stringify({ purpose: "UPGRADE", amount, userId, gateway: "flutterwave" }),
              status: "success",
              createdAt: new Date(),
            },
          });
          
          console.log("✅ [FLUTTERWAVE-WEBHOOK] Membership upgraded & auto-approved");
        } catch (error) {
          await markPaymentNeedsReview(
            claim.paymentId,
            `Flutterwave upgrade webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          console.error("❌ [FLUTTERWAVE-WEBHOOK] Membership upgrade failed:", error);
          throw error;
        }
      } else if (purpose === "EMPOWERMENT" && userId) {
        console.log("📦 [FLUTTERWAVE-WEBHOOK] Processing EMPOWERMENT payment...");

        const claim = await claimPendingPayment(txRef, purpose, userId);
        if (claim.status !== "claimed") {
          if (claim.status === "missing") {
            await writeProcessingWarning(txRef, purpose, amount, "No pending payment record was available to claim.");
          }
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Skipping duplicate or untracked empowerment payment:", txRef, claim.status);
          return NextResponse.json({ status: "success" });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount, txRef, purpose)) {
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Amount mismatch for empowerment payment:", txRef);
          return NextResponse.json({ status: "success" });
        }

        try {
          await prisma.$transaction([
            prisma.transaction.updateMany({
              where: { reference: txRef, userId, status: "pending" },
              data: { status: "completed" },
            }),
            prisma.pendingPayment.update({
              where: { id: claim.paymentId },
              data: {
                status: "approved",
                reviewedAt: new Date(),
                reviewNotes: "Auto-approved via Flutterwave webhook (payment verified)",
              },
            }),
          ]);

          // Finalize empowerment package creation from PendingPayment metadata
          const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { id: claim.paymentId },
            select: { metadata: true },
          });
          const meta = (pendingPayment?.metadata as any) || {};
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
              console.log("✅ [FLUTTERWAVE-WEBHOOK] Empowerment package finalized for beneficiary:", beneficiary.id);
            } else {
              console.error("❌ [FLUTTERWAVE-WEBHOOK] Beneficiary not found for empowerment finalization:", meta.beneficiaryId);
              await markPaymentNeedsReview(claim.paymentId, `Payment approved but beneficiary ${meta.beneficiaryId} not found for package creation`);
            }
          } else {
            console.error("❌ [FLUTTERWAVE-WEBHOOK] Missing empowerment metadata in PendingPayment:", claim.paymentId);
            await markPaymentNeedsReview(claim.paymentId, "Payment approved but empowerment metadata missing — package not created");
          }
        } catch (error) {
          await markPaymentNeedsReview(
            claim.paymentId,
            `Flutterwave empowerment webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          throw error;
        }

        // Audit log
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: "system",
            action: "PAYMENT_AUTO_APPROVE",
            entity: "PendingPayment",
            entityId: txRef,
            changes: JSON.stringify({ purpose: "EMPOWERMENT", amount, userId, gateway: "flutterwave" }),
            status: "success",
            createdAt: new Date(),
          },
        });

        console.log("✅ [FLUTTERWAVE-WEBHOOK] Empowerment payment auto-approved");
      } else if (purpose === "DEPOSIT" || purpose === "TOPUP") {
        console.log("💰 [FLUTTERWAVE-WEBHOOK] Processing wallet deposit...");

        const claim = await claimPendingPayment(txRef, purpose);
        if (claim.status !== "claimed") {
          if (claim.status === "missing") {
            await writeProcessingWarning(txRef, purpose, amount, "No pending payment record was available to claim.");
          }
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Skipping duplicate or untracked deposit payment:", txRef, claim.status);
          return NextResponse.json({ status: "success" });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount, txRef, purpose)) {
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Amount mismatch for deposit payment:", txRef);
          return NextResponse.json({ status: "success" });
        }

        // Find the pending deposit transaction
        const transaction = await prisma.transaction.findFirst({
          where: { reference: txRef, userId: claim.userId, status: "pending", transactionType: "DEPOSIT" },
        });

        if (transaction) {
          try {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: transaction.userId },
                data: { wallet: { increment: transaction.amount } },
              }),
              prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "completed" },
              }),
              prisma.pendingPayment.update({
                where: { id: claim.paymentId },
                data: {
                  status: "approved",
                  reviewedAt: new Date(),
                  reviewNotes: "Auto-approved via Flutterwave webhook (payment verified)",
                },
              }),
            ]);
          } catch (error) {
            await markPaymentNeedsReview(
              claim.paymentId,
              `Flutterwave deposit webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            throw error;
          }

          // Generate receipt
          const receiptUrl = generateReceiptLink(transaction.id, "deposit");

          // Send success notification
          await notifyDepositStatus(
            transaction.userId,
            "completed",
            transaction.amount,
            txRef,
            receiptUrl
          );

          console.log("✅ [FLUTTERWAVE-WEBHOOK] Deposit processed & auto-approved");
        } else {
          await markPaymentNeedsReview(
            claim.paymentId,
            "Flutterwave deposit webhook claimed a payment but no pending deposit transaction was found. Manual review required."
          );
          await writeProcessingWarning(txRef, purpose, amount, "Claimed payment had no matching pending deposit transaction.");
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Deposit transaction not found:", txRef);
        }
      } else {
        // Purpose unknown from metadata — attempt recovery from PendingPayment record
        console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Unknown payment purpose from metadata:", purpose, "— attempting PendingPayment lookup");

        const fallbackPending = await prisma.pendingPayment.findFirst({
          where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
          select: { id: true, transactionType: true, userId: true, metadata: true },
          orderBy: { createdAt: "desc" },
        });

        if (fallbackPending?.transactionType) {
          const recoveredPurpose = fallbackPending.transactionType.toUpperCase();
          const recoveredUserId = fallbackPending.userId;
          const recoveredMeta = (fallbackPending.metadata as Record<string, any>) || {};
          const recoveredPackageId = recoveredMeta.packageId;
          const recoveredCurrentPackageId = recoveredMeta.currentPackageId;

          console.log("🔄 [FLUTTERWAVE-WEBHOOK] Recovered purpose from PendingPayment:", recoveredPurpose, "userId:", recoveredUserId);

          if ((recoveredPurpose === "MEMBERSHIP" || recoveredPurpose === "MEMBERSHIP_PAYMENT") && recoveredPackageId && recoveredUserId) {
            const claim = await claimPendingPayment(txRef, "MEMBERSHIP", recoveredUserId);
            if (claim.status === "claimed") {
              if (await verifyPaymentAmount(claim.paymentId, amount, txRef, "MEMBERSHIP")) {
                try {
                  const { activateMembershipAfterExternalPayment } = await import("@/server/services/membershipPayments.service");
                  await activateMembershipAfterExternalPayment({
                    prisma,
                    userId: recoveredUserId,
                    packageId: recoveredPackageId,
                    selectedPalliative: recoveredMeta.selectedPalliative,
                    paymentReference: txRef,
                    paymentMethodLabel: "Flutterwave",
                    activatorName: payload.data.customer?.name || "Member",
                  });
                  await prisma.transaction.updateMany({
                    where: { reference: txRef, userId: recoveredUserId, status: "pending" },
                    data: { status: "completed" },
                  });
                  await markPaymentApproved(claim.paymentId, "Auto-approved via Flutterwave webhook (purpose recovered from PendingPayment record)");
                  console.log("✅ [FLUTTERWAVE-WEBHOOK] Membership activated via fallback recovery");
                } catch (error) {
                  await markPaymentNeedsReview(claim.paymentId, `Flutterwave fallback membership activation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                  console.error("❌ [FLUTTERWAVE-WEBHOOK] Fallback membership activation failed:", error);
                }
              }
            } else {
              console.log("⚠️  [FLUTTERWAVE-WEBHOOK] Fallback claim status:", claim.status);
            }
          } else if ((recoveredPurpose === "UPGRADE" || recoveredPurpose === "MEMBERSHIP_UPGRADE") && recoveredPackageId && recoveredCurrentPackageId && recoveredUserId) {
            const claim = await claimPendingPayment(txRef, "UPGRADE", recoveredUserId);
            if (claim.status === "claimed") {
              if (await verifyPaymentAmount(claim.paymentId, amount, txRef, "UPGRADE")) {
                try {
                  const { upgradeMembershipAfterExternalPayment } = await import("@/server/services/membershipPayments.service");
                  await upgradeMembershipAfterExternalPayment({
                    prisma,
                    userId: recoveredUserId,
                    packageId: recoveredPackageId,
                    currentPackageId: recoveredCurrentPackageId,
                    selectedPalliative: recoveredMeta.selectedPalliative,
                    paymentReference: txRef,
                    paymentMethodLabel: "Flutterwave",
                  });
                  await prisma.transaction.updateMany({
                    where: { reference: txRef, userId: recoveredUserId, status: "pending" },
                    data: { status: "completed" },
                  });
                  await markPaymentApproved(claim.paymentId, "Auto-approved via Flutterwave webhook (upgrade purpose recovered from PendingPayment record)");
                  console.log("✅ [FLUTTERWAVE-WEBHOOK] Upgrade activated via fallback recovery");
                } catch (error) {
                  await markPaymentNeedsReview(claim.paymentId, `Flutterwave fallback upgrade activation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                  console.error("❌ [FLUTTERWAVE-WEBHOOK] Fallback upgrade activation failed:", error);
                }
              }
            }
          } else {
            // Recovered purpose but missing required fields — still needs review
            console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Recovered purpose but missing required fields:", { recoveredPurpose, recoveredPackageId, recoveredUserId });
            await prisma.pendingPayment.updateMany({
              where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
              data: {
                reviewNotes: `Flutterwave webhook: metadata purpose missing, recovered transactionType=${recoveredPurpose} but required fields incomplete. Manual review needed.`,
              },
            });
          }
        } else {
          // No PendingPayment found at all — log for manual review
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
            data: {
              reviewNotes: `Successful Flutterwave webhook requires manual review because payment purpose was unknown: ${purpose || "missing"} and no PendingPayment record found.`,
            },
          });

          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: "system",
              action: "PAYMENT_UNKNOWN_PURPOSE_REVIEW_REQUIRED",
              entity: "PendingPayment",
              entityId: txRef,
              changes: JSON.stringify({ purpose, amount, gateway: "flutterwave" }),
              status: "warning",
              createdAt: new Date(),
            },
          });
        }
      }

      console.log("💾 Flutterwave payment webhook processed successfully");
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ Flutterwave webhook processing error:", error);

    // Best-effort: release any payment stuck in "processing" so it can be reviewed
    try {
      if (parsedTxRef) {
        await prisma.pendingPayment.updateMany({
          where: { gatewayReference: parsedTxRef, status: "processing" },
          data: { reviewNotes: `Flutterwave webhook handler crashed: ${error instanceof Error ? error.message : 'Unknown error'}. Payment needs manual review.` },
        });
      }
    } catch { /* swallow – primary error is already logged */ }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Flutterwave webhook endpoint",
    status: "active",
  });
}
