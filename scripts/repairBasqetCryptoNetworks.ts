/*
  Repairs stale Basqet crypto-network metadata for active pending provider-address payments.

  Usage:
    npx tsx scripts/repairBasqetCryptoNetworks.ts
    npx tsx scripts/repairBasqetCryptoNetworks.ts --apply
*/

import { prisma } from "@/lib/prisma";
import { resolveCryptoPaymentNetworkDetails } from "@/server/services/payment/cryptoPaymentDetails";

const APPLY = process.argv.includes("--apply");
const ACTIVE_STATUSES = ["pending", "processing", "blockchain_awaiting"];

type PaymentMetadata = Record<string, any>;

async function main() {
  const rows = await prisma.pendingPayment.findMany({
    where: {
      paymentMethod: "crypto",
      status: { in: ACTIVE_STATUSES },
    },
    select: {
      id: true,
      gatewayReference: true,
      status: true,
      metadata: true,
    },
  });

  let scanned = 0;
  let candidates = 0;
  let updated = 0;

  for (const row of rows) {
    scanned += 1;

    const meta = (row.metadata as PaymentMetadata | null) || {};
    const payResponseData = meta?.basqetAudit?.payResponse?.data || {};
    const provider = typeof meta.provider === "string" ? meta.provider.toLowerCase() : "";

    if (provider !== "basqet" && !payResponseData.payment_currency) {
      continue;
    }

    const resolvedNetworkDetails = resolveCryptoPaymentNetworkDetails({
      cryptoNetwork: meta.cryptoNetwork ?? null,
      paymentCurrency: payResponseData.payment_currency ?? null,
      address: meta.address || payResponseData.payment_address || null,
      networkInstruction: meta.networkInstruction ?? null,
      providerNetworkExact: meta.providerNetworkExact ?? null,
    });

    if (!resolvedNetworkDetails.cryptoNetwork) {
      continue;
    }

    const nextMetadata: PaymentMetadata = {
      ...meta,
      cryptoNetwork: resolvedNetworkDetails.cryptoNetwork,
      address: meta.address || payResponseData.payment_address || null,
      addressFormat: resolvedNetworkDetails.addressFormat ?? meta.addressFormat,
      providerNetworkExact: resolvedNetworkDetails.providerNetworkExact ?? meta.providerNetworkExact,
      networkInstruction: resolvedNetworkDetails.networkInstruction ?? meta.networkInstruction,
      basqetAudit: meta.basqetAudit
        ? {
            ...meta.basqetAudit,
            providerAddress: meta.address || payResponseData.payment_address || null,
            providerAddressFormat: resolvedNetworkDetails.addressFormat ?? meta.addressFormat,
            providerNetworkDisplay: resolvedNetworkDetails.cryptoNetwork,
            providerNetworkExact: resolvedNetworkDetails.providerNetworkExact ?? meta.providerNetworkExact,
            providerPaymentCurrency: payResponseData.payment_currency ?? null,
          }
        : meta.basqetAudit,
    };

    if (JSON.stringify(nextMetadata) === JSON.stringify(meta)) {
      continue;
    }

    candidates += 1;

    if (APPLY) {
      await prisma.pendingPayment.update({
        where: { id: row.id },
        data: {
          metadata: nextMetadata,
          updatedAt: new Date(),
        },
      });
      updated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: APPLY ? "apply" : "dry-run",
        scanned,
        candidates,
        updated,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("repairBasqetCryptoNetworks failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });