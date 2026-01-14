import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking PaymentGatewayConfig table...");
    
    const count = await prisma.paymentGatewayConfig.count();
    console.log(`Row count: ${count}`);
    
    const gateways = await prisma.paymentGatewayConfig.findMany();
    console.log("Gateways:", JSON.stringify(gateways, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
