import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

export const prisma = new PrismaClient();

export async function getUserIdByEmail(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`User not found for email: ${email}`);
  return user.id;
}

export async function ensureUserExists(args: {
  email: string;
  firstname?: string;
  lastname?: string;
}): Promise<{ id: string; email: string | null }> {
  const { email, firstname = "QA", lastname = "Owner" } = args;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      firstname,
      lastname,
      role: "user",
    },
    select: { id: true, email: true },
  });
}

export async function ensureReferral(args: {
  referrerId: string;
  referredId: string;
  status?: string;
}) {
  const { referrerId, referredId, status = "pending" } = args;

  const existing = await prisma.referral.findFirst({
    where: { referrerId, referredId },
    select: { id: true },
  });

  if (existing) {
    await prisma.referral.update({
      where: { id: existing.id },
      data: { status, updatedAt: new Date() },
    });
    return;
  }

  await prisma.referral.create({
    data: {
      id: randomUUID(),
      referrerId,
      referredId,
      status,
      rewardPaid: false,
      updatedAt: new Date(),
    },
  });
}

export async function clearReferral(args: { referredId: string }) {
  const { referredId } = args;
  await prisma.referral.deleteMany({ where: { referredId } });
}

export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string | null;
  name: string | null;
  passwordHash: string | null;
} | null> {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
}

export async function getUserPasswordHashByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true } });
  return user?.passwordHash ?? null;
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

export async function getLatestPasswordResetForUserSince(args: { userId: string; since: Date }) {
  const { userId, since } = args;
  return prisma.passwordReset.findFirst({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      used: true,
      expires: true,
      createdAt: true,
    },
  });
}

export async function deleteUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;
  await prisma.user.delete({ where: { id: user.id } });
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

export async function ensureQaYoutubePlan(): Promise<{
  id: string;
  name: string;
  amount: number;
  vat: number;
  totalSub: number;
}> {
  const QA_PLAN_NAME = "QA Starter";
  const amount = 1000;
  const vat = Number((amount * 0.075).toFixed(2));
  const totalSub = 5;

  const existing = await prisma.youtubePlan.findUnique({
    where: { name: QA_PLAN_NAME },
    select: { id: true, name: true, amount: true, vat: true, totalSub: true },
  });

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      amount: Number(existing.amount),
      vat: Number(existing.vat),
      totalSub: existing.totalSub,
    };
  }

  const created = await prisma.youtubePlan.create({
    data: {
      id: randomUUID(),
      name: QA_PLAN_NAME,
      amount: String(amount.toFixed(2)),
      vat: String(vat.toFixed(2)),
      totalSub,
      isActive: true,
      description: "Deterministic plan for Playwright DB audits",
      updatedAt: new Date(),
    },
    select: { id: true, name: true, amount: true, vat: true, totalSub: true },
  });

  return {
    id: created.id,
    name: created.name,
    amount: Number(created.amount),
    vat: Number(created.vat),
    totalSub: created.totalSub,
  };
}

export async function ensureVerifiedYoutubeChannelForOwner(args: {
  ownerEmail: string;
  channelName?: string;
}): Promise<{ channelId: string; ownerId: string; channelName: string }> {
  const { ownerEmail, channelName = "QA Verified Channel" } = args;

  const owner = await ensureUserExists({ email: ownerEmail, firstname: "QA", lastname: "ChannelOwner" });

  const existing = await prisma.youtubeChannel.findFirst({
    where: { userId: owner.id, isVerified: true, status: "VERIFIED", channelName },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, channelName: true },
  });
  if (existing && existing.channelName) {
    return { channelId: existing.id, ownerId: existing.userId, channelName: existing.channelName };
  }

  const created = await prisma.youtubeChannel.create({
    data: {
      id: randomUUID(),
      userId: owner.id,
      channelName,
      channelUrl: "https://youtube.com/@qa-verified-channel",
      channelLink: "https://youtube.com/@qa-verified-channel",
      status: "VERIFIED",
      isVerified: true,
      updatedAt: new Date(),
    },
    select: { id: true, userId: true, channelName: true },
  });

  return { channelId: created.id, ownerId: created.userId, channelName: created.channelName ?? channelName };
}

export async function ensureYoutubeProviderForOwner(args: {
  ownerId: string;
  planId: string;
  balance?: number;
}) {
  const { ownerId, planId, balance = 10 } = args;

  const existing = await prisma.youtubeProvider.findUnique({ where: { userId: ownerId } });
  if (existing) {
    await prisma.youtubeProvider.update({ where: { userId: ownerId }, data: { balance } });
    return;
  }

  await prisma.youtubeProvider.create({
    data: {
      id: randomUUID(),
      userId: ownerId,
      youtubePlanId: planId,
      balance,
      updatedAt: new Date(),
    },
  });
}

export async function resetYoutubeSubscriptionState(args: {
  subscriberId: string;
  channelId: string;
}) {
  const { subscriberId, channelId } = args;
  await prisma.userEarning.deleteMany({ where: { userId: subscriberId, channelId } });
  await prisma.transaction.deleteMany({
    where: {
      userId: subscriberId,
      description: { contains: "Youtube Subscription", mode: "insensitive" },
    },
  });
  await prisma.channelSubscription.deleteMany({ where: { subscriberId, channelId } });
}

export async function ensurePendingYoutubeSubscription(args: {
  subscriberId: string;
  channelId: string;
}) {
  const { subscriberId, channelId } = args;

  const existing = await prisma.channelSubscription.findUnique({
    where: {
      subscriberId_channelId: {
        subscriberId,
        channelId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.channelSubscription.update({
      where: { id: existing.id },
      data: {
        status: "pending",
        verifiedAt: null,
        paidAt: null,
        updatedAt: new Date(),
      },
    });
    return existing.id;
  }

  const created = await prisma.channelSubscription.create({
    data: {
      id: randomUUID(),
      subscriberId,
      channelId,
      status: "pending",
      subscriptionDate: new Date(),
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  return created.id;
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

export async function ensureUserReadyForMembershipUpgrade(args: {
  email: string;
  currentPackageId: string;
  walletMinimum: number;
}) {
  const { email, currentPackageId, walletMinimum } = args;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, wallet: true },
  });
  if (!user) throw new Error(`User not found for email: ${email}`);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const targetWallet = Math.max(user.wallet ?? 0, walletMinimum);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activeMembershipPackageId: currentPackageId,
      membershipActivatedAt: now,
      membershipExpiresAt: expiresAt,
      activated: true,

      // Some upgrades require palliative selection (high-tier packages).
      // The upgrade UI doesn't always collect this, so pre-mark as activated.
      palliativeActivated: true,
      selectedPalliative: "car",

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

      wallet: targetWallet,
    },
  });
}

export async function ensureUserReadyForYouTubePlanPurchase(args: {
  email: string;
  walletMinimum: number;
}) {
  const { email, walletMinimum } = args;

  await ensureUserReadyForDashboard(email);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, wallet: true } });
  if (!user) throw new Error(`User not found for email: ${email}`);

  // Clean any prior YouTube state to keep the flow deterministic.
  await prisma.channelSubscription.deleteMany({ where: { subscriberId: user.id } });
  await prisma.userEarning.deleteMany({ where: { userId: user.id } });
  await prisma.youtubeProvider.deleteMany({ where: { userId: user.id } });
  await prisma.youtubeChannel.deleteMany({ where: { userId: user.id } });

  const targetWallet = Math.max(user.wallet ?? 0, walletMinimum);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      wallet: targetWallet,
      spendable: 0,
    },
  });
}
