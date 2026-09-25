/*
  Reconciliation report for the Paystack auto-fulfilment and CSP release bugs.

  1. Gateway payments that were auto-rejected (or left pending) although the
     gateway confirms they were paid. Before the fix, the recovery job rejected
     any payment not yet "success" 2 minutes after creation (e.g. an unfinished
     Paystack checkout or an in-flight bank transfer), and the webhook then
     ignored the late success — so members paid but received nothing.
  2. Released CSP requests whose contribution ledger exceeds the amount that
     was released. Auto-contributions never funded the request's holding
     wallet, and release paid min(holding, raised), so beneficiaries were
     under-paid.
  3. CSP campaigns whose countdown ended with contributions and which were
     closed without ever being paid out. They can now be released from
     Admin → CSP (open the request → Release funds).

  Usage:
    npx tsx scripts/reconcilePaymentsAndCsp.ts               # report only
    npx tsx scripts/reconcilePaymentsAndCsp.ts --days=60     # look back 60 days (default 30)
    npx tsx scripts/reconcilePaymentsAndCsp.ts --apply       # also credit gateway-confirmed DEPOSITS

  --apply only credits wallet deposits (idempotent, via the shared deposit
  fulfilment). Other payment types and CSP shortfalls are listed for an admin
  to action (Admin → Payments can approve the listed payments).
*/

import { prisma } from "@/lib/prisma";
import { PaymentProcessor } from "@/server/services/payment/PaymentProcessor";
import { PaymentGateway } from "@/server/services/payment/types";
import { classifyGatewayVerification } from "@/server/services/payment/gatewayOutcome";
import { fulfillDepositPayment, isGatewayAmountAcceptable } from "@/server/services/payment/depositFulfillment";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const days = Number(args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 30);

function gatewayFor(method: string): PaymentGateway | null {
  if (method === "paystack" || method === "bank-transfer") return PaymentGateway.PAYSTACK;
  if (method === "flutterwave") return PaymentGateway.FLUTTERWAVE;
  return null;
}

async function reconcileGatewayPayments() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const candidates = await prisma.pendingPayment.findMany({
    where: {
      createdAt: { gte: since },
      gatewayReference: { not: null },
      paymentMethod: { in: ["paystack", "flutterwave", "bank-transfer"] },
      OR: [
        { status: "rejected", reviewNotes: { startsWith: "Auto-rejected by recovery cron" } },
        { status: { in: ["pending", "processing"] } },
      ],
    },
    include: { User: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n== Gateway payments (${candidates.length} candidates since ${since.toISOString()}) ==`);
  const owed: Array<Record<string, unknown>> = [];

  for (const payment of candidates) {
    const gateway = gatewayFor(payment.paymentMethod);
    if (!gateway) continue;
    if (payment.paymentMethod === "bank-transfer" && payment.proofOfPayment) continue; // manual transfer

    const verification = await PaymentProcessor.verifyPayment(gateway, payment.gatewayReference!);
    if (classifyGatewayVerification(verification) !== "success") continue;

    const amountOk = isGatewayAmountAcceptable(verification.amount, payment.amount);
    const row: Record<string, unknown> = {
      id: payment.id,
      reference: payment.gatewayReference,
      type: payment.transactionType,
      status: payment.status,
      user: payment.User?.email ?? payment.userId,
      expected: payment.amount,
      paid: verification.amount,
      amountOk,
      action: "admin review",
    };

    if (apply && amountOk && ["DEPOSIT", "TOPUP"].includes(payment.transactionType)) {
      const result = await fulfillDepositPayment(prisma, {
        pendingPaymentId: payment.id,
        userId: payment.userId,
        reference: payment.gatewayReference!,
        note: "Credited by reconciliation script (gateway confirmed payment)",
      });
      row.action = `deposit ${result.status}`;
    } else if (["DEPOSIT", "TOPUP"].includes(payment.transactionType)) {
      row.action = amountOk ? "run with --apply" : "amount mismatch — admin review";
    }

    owed.push(row);
  }

  if (owed.length === 0) {
    console.log("No paid-but-unfulfilled gateway payments found.");
  } else {
    console.table(owed);
  }
}

async function reconcileCspReleases() {
  const releases = await prisma.auditLog.findMany({
    where: { action: "CSP_RELEASE_FUNDS" },
    select: { entityId: true, metadata: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const rows: Array<Record<string, unknown>> = [];
  for (const log of releases) {
    if (!log.entityId) continue;
    const meta = (log.metadata as Record<string, any> | null) ?? {};
    const released = Number(meta.totalReleased ?? 0);
    const ledger = await prisma.cspContribution.aggregate({
      where: { requestId: log.entityId },
      _sum: { amount: true },
    });
    const contributed = ledger._sum.amount ?? 0;
    const shortfall = contributed - released;
    if (shortfall > 0.5) {
      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: log.entityId },
        select: { userId: true, User: { select: { email: true } } },
      });
      rows.push({
        requestId: log.entityId,
        beneficiary: request?.User?.email ?? request?.userId ?? "?",
        releasedAt: log.createdAt.toISOString(),
        contributed,
        released,
        shortfall,
      });
    }
  }

  console.log(`\n== CSP releases with unreleased contributions (${rows.length}) ==`);
  if (rows.length === 0) {
    console.log("All released requests paid out their full contribution ledger.");
  } else {
    console.table(rows);
    const total = rows.reduce((sum, r) => sum + Number(r.shortfall), 0);
    console.log(`Total unreleased: ₦${total.toLocaleString()} — review and settle via admin tooling.`);
  }
}

async function reportStrandedCspCampaigns() {
  const closed = await prisma.cspSupportRequest.findMany({
    where: { status: "closed", raisedAmount: { gt: 0 } },
    select: { id: true, raisedAmount: true, updatedAt: true, User: { select: { email: true } } },
    orderBy: { updatedAt: "asc" },
  });

  const rows: Array<Record<string, unknown>> = [];
  for (const request of closed) {
    const released = await prisma.auditLog.findFirst({
      where: { action: "CSP_RELEASE_FUNDS", entityId: request.id },
      select: { id: true },
    });
    if (released) continue;
    const ledger = await prisma.cspContribution.aggregate({ where: { requestId: request.id }, _sum: { amount: true } });
    rows.push({
      requestId: request.id,
      beneficiary: request.User?.email ?? "?",
      closedAt: request.updatedAt.toISOString(),
      contributed: ledger._sum.amount ?? 0,
    });
  }

  console.log(`\n== Closed CSP campaigns never paid out (${rows.length}) ==`);
  if (rows.length === 0) {
    console.log("None found.");
  } else {
    console.table(rows);
    console.log("Release these from Admin → CSP: open the request and use Release funds.");
  }
}

async function main() {
  console.log(`Reconciliation (${apply ? "APPLY deposits" : "report only"}), lookback ${days} days`);
  await reconcileGatewayPayments();
  await reconcileCspReleases();
  await reportStrandedCspCampaigns();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
