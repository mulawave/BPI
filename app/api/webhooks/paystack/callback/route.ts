// Paystack Payment Callback Handler
// Handles user redirect after payment
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayFactory, PaymentGateway } from "@/server/services/payment";

export async function GET(req: NextRequest) {
  console.log("🔄 Paystack callback received");

  try {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error&message=Missing transaction reference", req.url)
      );
    }

    const dbConfig = await prisma.paymentGatewayConfig.findUnique({
      where: { gatewayName: "paystack" },
      select: { isActive: true, secretKey: true },
    });

    const secretKey = dbConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error&message=Paystack keys not configured", req.url)
      );
    }

    const gateway = await PaymentGatewayFactory.getGateway(PaymentGateway.PAYSTACK, {
      enabled: dbConfig ? dbConfig.isActive : process.env.NODE_ENV !== "production",
      environment: (process.env.PAYSTACK_ENV as "test" | "live") || "test",
      secretKey,
    });

    const verification = await gateway.verifyPayment(reference);
    const purpose = (verification.metadata as any)?.metadata?.purpose || (verification.metadata as any)?.purpose;

    if (verification.success) {
      if (purpose === "EMPOWERMENT") {
        return NextResponse.redirect(
          new URL(`/empowerment?gateway=paystack&reference=${reference}&status=successful`, req.url)
        );
      }

      return NextResponse.redirect(
        new URL(`/dashboard?payment=success&amount=${verification.amount}&ref=${reference}`, req.url)
      );
    }

    return NextResponse.redirect(
      new URL(
        `/membership?payment=failed&message=${encodeURIComponent(verification.message || "Payment failed")}`,
        req.url
      )
    );
  } catch (error) {
    console.error("❌ Paystack callback processing error:", error);

    return NextResponse.redirect(
      new URL(
        `/membership?payment=error&message=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        req.url
      )
    );
  }
}
