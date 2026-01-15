import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function getUserIdByEmail(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`User not found for email: ${email}`);
  return user.id;
}

export async function getUserWalletByEmail(email: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { email }, select: { wallet: true } });
  if (!user) throw new Error(`User not found for email: ${email}`);
  return user.wallet ?? 0;
}

export async function getRecentTransactionsForUser(args: {
  userId: string;
  since: Date;
  types?: string[];
}) {
  const { userId, since, types } = args;
  return prisma.transaction.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      ...(types && types.length > 0 ? { transactionType: { in: types } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      transactionType: true,
      amount: true,
      status: true,
      reference: true,
      description: true,
      createdAt: true,
    },
  });
}

export async function getCheapestMembershipPackage(): Promise<{
  id: string;
  name: string;
  price: number;
  vat: number;
}> {
  const pkg = await prisma.membershipPackage.findFirst({
    orderBy: { price: "asc" },
    select: { id: true, name: true, price: true, vat: true },
  });
  if (!pkg) throw new Error("No membership packages found in DB");
  return {
    id: pkg.id,
    name: pkg.name,
    price: pkg.price ?? 0,
    vat: pkg.vat ?? 0,
  };
}

const ONE_BY_ONE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOQYVx0AAAAASUVORK5CYII=";

export async function ensureUserReadyForDashboard(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`User not found for email: ${email}`);

  const pkg = await prisma.membershipPackage.findFirst({
    orderBy: { price: "asc" },
    select: { id: true },
  });
  if (!pkg) throw new Error("No membership packages found in DB");

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activeMembershipPackageId: pkg.id,
      membershipActivatedAt: now,
      membershipExpiresAt: expiresAt,
      firstname: "QA",
      lastname: "User",
      mobile: "+2348000000000",
      address: "QA Address",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      gender: "Prefer not to say",
      image: ONE_BY_ONE_PNG_DATA_URL,
    },
  });
}

export async function ensureUserReadyForMembershipActivation(args: {
  email: string;
  walletMinimum: number;
}) {
  const { email, walletMinimum } = args;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, wallet: true },
  });
  if (!user) throw new Error(`User not found for email: ${email}`);

  const targetWallet = Math.max(user.wallet ?? 0, walletMinimum);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Ensure we're in the pre-activation state
      activeMembershipPackageId: null,
      membershipActivatedAt: null,
      membershipExpiresAt: null,
      activated: false,

      // Avoid UI gating
      firstname: "QA",
      lastname: "User",
      mobile: "+2348000000000",
      address: "QA Address",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      gender: "Prefer not to say",
      image: ONE_BY_ONE_PNG_DATA_URL,

      // Ensure wallet can cover activation
      wallet: targetWallet,
    },
  });
}
