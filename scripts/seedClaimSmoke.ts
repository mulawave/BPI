import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const fixturePath = path.resolve(__dirname, "../tests/fixtures/claim-smoke.json");

const password = "Password123!";

const createUser = async (email: string, role: string) => {
  const id = crypto.randomUUID();
  const passwordHash = await hash(password, 10);
  return prisma.user.create({
    data: {
      id,
      email,
      name: role === "admin" ? "Claim Staff" : "Claim User",
      role,
      passwordHash,
    },
  });
};

const createPickupCenter = async () => {
  return prisma.pickupCenter.create({
    data: {
      name: "Smoke Pickup Center",
      addressLine1: "123 Test Street",
      city: "Lagos",
      state: "Lagos",
      country: "NG",
      contactEmail: "pickup@example.com",
      contactPhone: "+2348000000000",
    } as Prisma.PickupCenterCreateInput,
  });
};

const createProduct = async (pickupCenterId: string) => {
  return prisma.product.create({
    data: {
      name: "Smoke Test Product",
      description: "Auto-generated for claim smoke test",
      productType: "PHYSICAL",
      basePriceFiat: new Prisma.Decimal(100),
      acceptedTokens: ["USDT"],
      tokenPaymentLimits: { USDT: 1 },
      inventoryType: "UNLIMITED",
      status: "ACTIVE",
      pickupCenterId,
      images: [],
    },
  });
};

const createOrder = async (userId: string, productId: string, pickupCenterId: string, claimCode: string) => {
  const data: any = {
    user: { connect: { id: userId } },
    product: { connect: { id: productId } },
    pickupCenter: { connect: { id: pickupCenterId } },
    quantity: 1,
    pricingSnapshot: {
      base_price_fiat: 100,
      quantity: 1,
      token_symbol: "USDT",
      token_limit: 1,
      token_portion_fiat: 100,
      token_amount: 100,
      fiat_portion: 0,
      total_fiat: 100,
    },
    paymentBreakdown: { token: { symbol: "USDT", amount: 100, fiat_value: 100 }, fiat: 0 },
    status: "PROCESSING" as any,
    claimCode,
    claimStatus: "CODE_ISSUED" as any,
  };

  return prisma.order.create({ data });
};

const writeFixture = (baseURL: string, userEmail: string, staffEmail: string, claimCode: string) => {
  const payload = {
    baseURL,
    userEmail,
    userPassword: password,
    staffEmail,
    staffPassword: password,
    claimCode,
  };
  fs.writeFileSync(fixturePath, JSON.stringify(payload, null, 2));
  console.log(`Fixture written to ${fixturePath}`);
};

async function main() {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  const suffix = Date.now();
  const userEmail = `claim.user+${suffix}@example.com`;
  const staffEmail = `claim.staff+${suffix}@example.com`;
  const claimCode = `BPI-${Math.floor(100000 + Math.random() * 900000)}-PC`;

  const [user, staff, pickupCenter] = await Promise.all([
    createUser(userEmail, "user"),
    createUser(staffEmail, "admin"),
    createPickupCenter(),
  ]);

  const product = await createProduct(pickupCenter.id);
  const order = await createOrder(user.id, product.id, pickupCenter.id, claimCode);

  console.log("Seeded user:", user.email);
  console.log("Seeded staff:", staff.email);
  console.log("Order ID:", order.id, "Claim Code:", claimCode);

  writeFixture(baseURL, user.email ?? userEmail, staff.email ?? staffEmail, claimCode);
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
