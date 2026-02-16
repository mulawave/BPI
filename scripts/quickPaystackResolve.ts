// Standalone Paystack bank resolve test (no DB required)
// Usage: npx tsx scripts/quickPaystackResolve.ts <accountNumber> <bankCode> <secretKey>

async function main() {
  const accountNumber = process.argv[2];
  const bankCode = process.argv[3];
  const secret = process.argv[4] || process.env.PAYSTACK_SECRET_KEY;

  if (!accountNumber || !bankCode || !secret) {
    console.error("Usage: npx tsx scripts/quickPaystackResolve.ts <accountNumber> <bankCode> <secretKey>");
    console.error("Or set PAYSTACK_SECRET_KEY env var and omit last arg");
    process.exit(1);
  }

  const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;

  console.log("🔍 Resolving bank account via Paystack...");
  console.log("   Account:", accountNumber);
  console.log("   Bank Code:", bankCode);

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
    console.error("❌ Non-JSON response:", text);
    process.exit(1);
  }

  if (!res.ok || !json?.status) {
    console.error("❌ Verification failed");
    console.error("   HTTP Status:", res.status);
    console.error("   Response:", json);
    process.exit(1);
  }

  console.log("\n✅ Verification SUCCESS");
  console.log("   Account Name:", json?.data?.account_name);
  console.log("   Account Number:", json?.data?.account_number);
  console.log("   Bank ID:", json?.data?.bank_id);
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
