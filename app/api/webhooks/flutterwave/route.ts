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

export async function POST(req: NextRequest) {
  console.log("📥 Flutterwave webhook received");

  try {
    const payload = await req.json();
    const signature = req.headers.get("verif-hash");

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
      webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || "myngul.com22",
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

          // Auto-approve PendingPayment
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
            data: {
              status: "approved",
              reviewedAt: new Date(),
              reviewNotes: "Auto-approved via Flutterwave webhook (payment verified)",
            },
          });

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
          console.error("❌ [FLUTTERWAVE-WEBHOOK] Membership activation failed:", error);
          throw error;
        }
      } else if (purpose === "UPGRADE" && packageId && currentPackageId && userId) {
        console.log("📦 [FLUTTERWAVE-WEBHOOK] Processing MEMBERSHIP upgrade...");
        
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

          // Auto-approve PendingPayment
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
            data: {
              status: "approved",
              reviewedAt: new Date(),
              reviewNotes: "Auto-approved via Flutterwave webhook (payment verified)",
            },
          });

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
          console.error("❌ [FLUTTERWAVE-WEBHOOK] Membership upgrade failed:", error);
          throw error;
        }
      } else if (purpose === "EMPOWERMENT" && userId) {
        console.log("📦 [FLUTTERWAVE-WEBHOOK] Processing EMPOWERMENT payment...");

        // Auto-approve PendingPayment so admin doesn't need to review
        await prisma.pendingPayment.updateMany({
          where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
          data: {
            status: "approved",
            reviewedAt: new Date(),
            reviewNotes: "Auto-approved via Flutterwave webhook (payment verified)",
          },
        });

        // Mark pending transaction as completed
        await prisma.transaction.updateMany({
          where: { reference: txRef, userId, status: "pending" },
          data: { status: "completed" },
        });

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

        // Find the pending deposit transaction
        const transaction = await prisma.transaction.findFirst({
          where: { reference: txRef, status: "pending", transactionType: "DEPOSIT" },
        });

        if (transaction) {
          // Credit user wallet
          await prisma.user.update({
            where: { id: transaction.userId },
            data: { wallet: { increment: transaction.amount } },
          });

          // Update transaction status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "completed" },
          });

          // Auto-approve PendingPayment
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: txRef, status: "pending" },
            data: {
              status: "approved",
              reviewedAt: new Date(),
              reviewNotes: "Auto-approved via Flutterwave webhook (payment verified)",
            },
          });

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
          console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Deposit transaction not found:", txRef);
        }
      } else {
        console.warn("⚠️  [FLUTTERWAVE-WEBHOOK] Unknown payment purpose:", purpose);
        
        // Even for unknown purposes, auto-approve if payment is successful
        await prisma.pendingPayment.updateMany({
          where: { gatewayReference: txRef, status: { in: ["pending", "processing"] } },
          data: {
            status: "approved",
            reviewedAt: new Date(),
            reviewNotes: `Auto-approved via Flutterwave webhook (unknown purpose: ${purpose})`,
          },
        });
      }

      console.log("💾 Flutterwave payment webhook processed successfully");
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ Flutterwave webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
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
