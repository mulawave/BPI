import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.pendingPayment.deleteMany({
    where: {
      status: "pending",
      gatewayReference: { startsWith: "DEMO-" },
    } as any,
  });

  console.log(`Deleted ${result.count} demo pending payments (gatewayReference starts with DEMO-)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
