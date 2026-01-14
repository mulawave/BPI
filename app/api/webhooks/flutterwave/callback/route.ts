// Flutterwave Payment Callback Handler
// Handles user redirect after payment
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import {
  PaymentGatewayFactory,
  PaymentGateway,
} from "../../../../../server/services/payment";

export async function GET(req: NextRequest) {
  console.log("🔄 Flutterwave callback received");

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");

    console.log("📋 Callback params:", { status, txRef, transactionId });

    if (!txRef) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error&message=Missing transaction reference", req.url)
      );
    }

    // Get Flutterwave gateway instance
    const config = {
      enabled: true,
      environment: (process.env.FLUTTERWAVE_ENV as "test" | "live") || "test",
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    };

    const gateway = await PaymentGatewayFactory.getGateway(
      PaymentGateway.FLUTTERWAVE,
      config
    );

    // Verify payment
    const verification = await gateway.verifyPayment(txRef);

    if (verification.success && status === "successful") {
      console.log("✅ Payment verified successfully");

      // Redirect to success page
      return NextResponse.redirect(
        new URL(
          `/dashboard?payment=success&amount=${verification.amount}&ref=${txRef}`,
          req.url
        )
      );
    } else if (status === "cancelled") {
      console.log("⚠️ Payment cancelled by user");

      return NextResponse.redirect(
        new URL("/membership?payment=cancelled", req.url)
      );
    } else {
      console.log("❌ Payment failed or pending");

      return NextResponse.redirect(
        new URL(
          `/membership?payment=failed&message=${encodeURIComponent(verification.message || "Payment failed")}`,
          req.url
        )
      );
    }
  } catch (error) {
    console.error("❌ Callback processing error:", error);

    return NextResponse.redirect(
      new URL(
        `/membership?payment=error&message=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
        req.url
      )
    );
  }
}
