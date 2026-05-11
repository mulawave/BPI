// Flutterwave Payment Callback Handler
// Handles user redirect after payment
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentGatewayFactory,
  PaymentGateway,
} from "../../../../../server/services/payment";

async function getFlutterwaveCallbackConfig() {
  const [gatewayConfig, legacySecretSetting] = await Promise.all([
    prisma.paymentGatewayConfig.findUnique({
      where: { gatewayName: "flutterwave" },
      select: { isActive: true, publicKey: true, secretKey: true },
    }),
    prisma.adminSettings.findUnique({
      where: { settingKey: "flutterwave_secret_key" },
      select: { settingValue: true },
    }),
  ]);

  return {
    enabled: gatewayConfig?.isActive ?? true,
    publicKey: gatewayConfig?.publicKey || process.env.FLUTTERWAVE_PUBLIC_KEY || "",
    secretKey:
      gatewayConfig?.secretKey ||
      legacySecretSetting?.settingValue ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      "",
  };
}

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

    const runtimeConfig = await getFlutterwaveCallbackConfig();

    // Get Flutterwave gateway instance
    const config = {
      enabled: runtimeConfig.enabled,
      environment: (process.env.FLUTTERWAVE_ENV as "test" | "live") || "test",
      publicKey: runtimeConfig.publicKey,
      secretKey: runtimeConfig.secretKey,
    };

    const gateway = await PaymentGatewayFactory.getGateway(
      PaymentGateway.FLUTTERWAVE,
      config
    );

    // Verify payment
    const verification = await gateway.verifyPayment(txRef);

    const purpose = (verification.metadata as any)?.meta?.purpose || (verification.metadata as any)?.purpose;

    if (verification.success && status === "successful") {
      console.log("✅ Payment verified successfully");

      if (purpose === "EMPOWERMENT") {
        return NextResponse.redirect(
          new URL(`/empowerment?gateway=flutterwave&reference=${txRef}&status=successful`, req.url)
        );
      }

      // Redirect to payment verification page which calls verifyExternalPayment tRPC
      return NextResponse.redirect(
        new URL(
          `/payment/verify?gateway=flutterwave&ref=${encodeURIComponent(txRef)}`,
          req.url
        )
      );
    } else if (status === "cancelled") {
      console.log("⚠️ Payment cancelled by user");

      return NextResponse.redirect(
        new URL("/payment/verify?message=Payment%20cancelled%20by%20user", req.url)
      );
    } else {
      console.log("❌ Payment failed or pending");

      return NextResponse.redirect(
        new URL(
          `/payment/verify?gateway=flutterwave&ref=${encodeURIComponent(txRef)}&message=${encodeURIComponent(verification.message || "Payment failed")}`,
          req.url
        )
      );
    }
  } catch (error) {
    console.error("❌ Callback processing error:", error);

    return NextResponse.redirect(
      new URL(
        `/payment/verify?message=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
        req.url
      )
    );
  }
}
