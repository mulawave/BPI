/*
  End-to-end-ish DB test for bank transfer proof -> PendingPayment -> admin approval.
  Runs against the configured Prisma DATABASE_URL.

  Usage:
    npx tsx scripts/e2e-bank-transfer-approval.ts
    npx tsx scripts/e2e-bank-transfer-approval.ts --email user@example.com --package "Gold Plus"
*/

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import { activateMembershipAfterExternalPayment } from "@/server/services/membershipPayments.service";

type Args = {
  email?: string;
  packageName?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--email") args.email = argv[++i];
    else if (token === "--package") args.packageName = argv[++i];
  }
  return args;
}

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    const value = stripQuotes(line.slice(eq + 1));
    if (!key) continue;

    // Respect existing env vars (e.g. CI overrides)
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  // Ensure DATABASE_URL is available for Prisma when running via tsx
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Ensure it exists in .env/.env.local or the shell env.",
    );
  }

  const { email, packageName } = parseArgs(process.argv);
  const targetEmail = email || "user@example.com";

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Find or create an admin reviewer.
    let admin = await prisma.user.findFirst({
      where: {
        role: { in: ["admin", "superadmin"] },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: "admin-e2e@example.com",
          name: "E2E Admin",
          role: "admin",
          activated: true,
          verified: true,
        },
        select: { id: true, email: true, name: true, role: true },
      });
    }

    // Find or create the target user.
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        id: true,
        email: true,
        name: true,
        activated: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        wallet: true,
        palliative: true,
        cashback: true,
        socialMedia: true,
        myngulActivationPin: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: targetEmail,
          name: "E2E Test User",
          role: "user",
          activated: false,
          verified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          activated: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          wallet: true,
          palliative: true,
          cashback: true,
          socialMedia: true,
          myngulActivationPin: true,
        },
      });
    }

    // Choose a membership package.
    const membershipPackage = packageName
      ? await prisma.membershipPackage.findUnique({ where: { name: packageName } })
      : await prisma.membershipPackage.findFirst({ orderBy: { price: "asc" } });

    if (!membershipPackage) {
      throw new Error(
        "No MembershipPackage found. Seed the DB (npm run db:seed) and try again.",
      );
    }

    const totalAmount = membershipPackage.price + (membershipPackage.vat || 0);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const pendingPaymentId = randomUUID();
    const paymentRef = `E2E-BANK-${Date.now()}-${user.id.slice(0, 8)}`;

    const pending = await prisma.pendingPayment.create({
      data: {
        id: pendingPaymentId,
        userId: user.id,
        transactionType: "MEMBERSHIP",
        amount: totalAmount,
        currency: "NGN",
        paymentMethod: "bank-transfer",
        gatewayReference: paymentRef,
        status: "pending",
        proofOfPayment: "/uploads/payment-proofs/e2e-proof.pdf",
        metadata: {
          packageId: membershipPackage.id,
        },
        expiresAt,
        updatedAt: now,
      },
    });

    const before = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        activated: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        wallet: true,
        palliative: true,
        cashback: true,
        socialMedia: true,
        myngulActivationPin: true,
      },
    });

    // Approve using the same service logic as admin router.
    await prisma.$transaction(async (tx) => {
      await activateMembershipAfterExternalPayment({
        prisma: tx,
        userId: pending.userId,
        packageId: membershipPackage.id,
        selectedPalliative: undefined,
        paymentReference: pending.gatewayReference || pending.id,
        paymentMethodLabel: "Bank Transfer",
        activatorName: user.name || user.email || "New Member",
      });

      await tx.pendingPayment.update({
        where: { id: pending.id },
        data: {
          status: "approved",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          reviewNotes: "E2E approval test",
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          userId: admin.id,
          action: "PAYMENT_APPROVE",
          entity: "PendingPayment",
          entityId: pending.id,
          changes: JSON.stringify({ action: "approve", amount: pending.amount, userId: pending.userId }),
          status: "success",
          createdAt: new Date(),
        },
      });
    });

    const after = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        activated: true,
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        wallet: true,
        palliative: true,
        cashback: true,
        socialMedia: true,
        myngulActivationPin: true,
      },
    });

    const updatedPayment = await prisma.pendingPayment.findUnique({
      where: { id: pending.id },
      select: { id: true, status: true, reviewedBy: true, reviewedAt: true, gatewayReference: true },
    });

    const activationTx = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        transactionType: "MEMBERSHIP_ACTIVATION",
        reference: paymentRef,
      },
      select: { id: true, amount: true, reference: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const vatTx = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        transactionType: "VAT",
        reference: `VAT-${paymentRef}`,
      },
      select: { id: true, amount: true, reference: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n=== E2E Bank Transfer Approval (DB) ===");
    console.log("Reviewer:", admin.email, admin.role);
    console.log("User:", user.email, user.id);
    console.log("Package:", membershipPackage.name, membershipPackage.id);
    console.log("PendingPayment created:", pending.id, pending.gatewayReference);

    console.log("\nUser BEFORE:", before);
    console.log("User AFTER:", after);

    console.log("\nPendingPayment AFTER:", updatedPayment);

    console.log("\nExpected total:", totalAmount);
    console.log("Activation transaction:", activationTx || "NOT FOUND");
    console.log("VAT transaction:", vatTx || "NOT FOUND");

    if (!after?.activeMembershipPackageId || after.activeMembershipPackageId !== membershipPackage.id) {
      throw new Error("E2E failed: user activeMembershipPackageId not updated.");
    }

    if (!updatedPayment || updatedPayment.status !== "approved") {
      throw new Error("E2E failed: pending payment not marked approved.");
    }

    if (!activationTx) {
      throw new Error("E2E failed: MEMBERSHIP_ACTIVATION transaction missing.");
    }

    const expectedActivationAmount = -totalAmount;
    if (Math.abs((activationTx.amount ?? 0) - expectedActivationAmount) > 1e-9) {
      throw new Error(
        `E2E failed: MEMBERSHIP_ACTIVATION amount mismatch. Expected ${expectedActivationAmount}, got ${activationTx.amount}`,
      );
    }

    console.log("\nE2E result: OK");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("E2E script failed:", err);
  process.exitCode = 1;
});
