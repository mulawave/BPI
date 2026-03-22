import { prisma } from "@/lib/prisma";

async function main() {
  const accountNumber = process.env.PAYSTACK_TEST_ACCOUNT_NUMBER || process.argv[2];
  const bankCode = process.env.PAYSTACK_TEST_BANK_CODE || process.argv[3];

  if (!accountNumber || !bankCode) {
    console.error("Usage: PAYSTACK_TEST_ACCOUNT_NUMBER=0123456789 PAYSTACK_TEST_BANK_CODE=058 npx tsx scripts/verifyPaystackBankResolve.ts");
    console.error("Or: npx tsx scripts/verifyPaystackBankResolve.ts <accountNumber> <bankCode>");
    process.exit(1);
  }

  // Fetch Paystack secret from DB (same source deposits use), fallback to env
  const paystackConfig = await prisma.paymentGatewayConfig.findUnique({
    where: { gatewayName: "paystack" },
    select: { secretKey: true, isActive: true },
  });

  const secret = paystackConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error("Paystack secret key not configured (DB or PAYSTACK_SECRET_KEY)");
    process.exit(1);
  }

  if (paystackConfig?.isActive === false) {
    console.warn("Warning: paystack gateway is marked inactive in DB; proceeding anyway.");
  }

  const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;

  console.log("🔍 Resolving bank account via Paystack...", { accountNumber, bankCode });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("Non-JSON response:", text);
    process.exit(1);
  }

  if (!res.ok || !json?.status) {
    console.error("❌ Verification failed", { status: res.status, body: json });
    process.exit(1);
  }

  console.log("✅ Verification success", {
    accountName: json?.data?.account_name,
    accountNumber: json?.data?.account_number,
    bankId: json?.data?.bank_id,
  });
}

main()
  .catch((err) => {
    console.error("❌ Error running verifier", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
