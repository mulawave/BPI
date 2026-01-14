// Flutterwave Webhook Handler
// Processes payment notifications from Flutterwave
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
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
      const purpose = payload.data.meta?.purpose;
      const packageId = payload.data.meta?.packageId;

      console.log("✅ Processing successful payment:", {
        txRef,
        userId,
        amount,
        purpose,
      });

      // TODO: Create payment_transactions table entry
      // For now, just log and return success

      // TODO: Trigger membership activation if purpose is MEMBERSHIP
      // if (purpose === "MEMBERSHIP" && packageId && userId) {
      //   await activateMembershipPackage(userId, packageId);
      // }

      console.log("💾 Payment webhook processed successfully");
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
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
