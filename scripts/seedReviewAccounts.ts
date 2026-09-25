/*
  Creates throwaway accounts for reviewing a deployment (e.g. a Vercel preview):

    review-member@bpi.test   active Regular Plus member (or the cheapest active
                             package), ₦50,000 Cash Wallet, ₦10,000 Community
                             Wallet, linked to a sponsor so CSP sponsor shares show
    review-sponsor@bpi.test  the member's sponsor; owns one live sample CSP campaign
                             the member can contribute to
    review-admin@bpi.test    admin account for Admin → CSP / Payments

  Passwords are random and printed once. Re-running resets them.

  Usage (point DATABASE_URL at the database the deployment uses):
    REVIEW_SEED_CONFIRM=yes DATABASE_URL="postgres://..." npx tsx scripts/seedReviewAccounts.ts
    REVIEW_SEED_CONFIRM=yes DATABASE_URL="postgres://..." npx tsx scripts/seedReviewAccounts.ts --cleanup

  If the deployment shares the production database, these accounts will exist
  in production — run --cleanup when the review is done.
*/

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";

const MEMBER_EMAIL = "review-member@bpi.test";
const SPONSOR_EMAIL = "review-sponsor@bpi.test";
const ADMIN_EMAIL = "review-admin@bpi.test";
const EMAILS = [MEMBER_EMAIL, SPONSOR_EMAIL, ADMIN_EMAIL];

if (process.env.REVIEW_SEED_CONFIRM !== "yes") {
  console.error("Refusing to run: set REVIEW_SEED_CONFIRM=yes to confirm you are pointing at the right database.");
  process.exit(1);
}

const prisma = new PrismaClient();

function newPassword() {
  return `Rv-${randomBytes(9).toString("base64url")}`;
}

function databaseHost() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").host || "(unknown)";
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function upsertUser(input: {
  email: string;
  name: string;
  role: "user" | "admin";
  password: string;
  data?: Record<string, unknown>;
}) {
  const passwordHash = await hash(input.password, 10);
  const common = {
    name: input.name,
    passwordHash,
    role: input.role,
    activated: true,
    verified: true,
    emailVerified: new Date(),
    forcePasswordReset: false,
    updatedAt: new Date(),
    ...(input.data ?? {}),
  };
  return prisma.user.upsert({
    where: { email: input.email },
    update: common as any,
    create: { id: randomUUID(), email: input.email, ...common } as any,
  });
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) {
    console.log("No review accounts found.");
    return;
  }
  const requests = await prisma.cspSupportRequest.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const requestIds = requests.map((r) => r.id);
  await prisma.$transaction([
    prisma.cspContribution.deleteMany({ where: { OR: [{ requestId: { in: requestIds } }, { contributorId: { in: ids } }] } }),
    prisma.cspSupportRequest.deleteMany({ where: { id: { in: requestIds } } }),
    prisma.systemWallet.deleteMany({ where: { name: { in: requestIds.map((id) => `CSP Holding - ${id}`) } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
  console.log(`Removed ${ids.length} review account(s) and ${requestIds.length} sample campaign(s).`);
}

async function seed() {
  const pkg =
    (await prisma.membershipPackage.findFirst({ where: { name: "Regular Plus", isActive: true } })) ??
    (await prisma.membershipPackage.findFirst({ where: { isActive: true }, orderBy: { price: "asc" } }));
  if (!pkg) throw new Error("No active membership package found; seed membership packages first.");

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
  const membership = {
    activeMembershipPackageId: pkg.id,
    membershipActivatedAt: activatedAt,
    membershipExpiresAt: expiresAt,
  };

  const passwords = { member: newPassword(), sponsor: newPassword(), admin: newPassword() };

  const sponsor = await upsertUser({
    email: SPONSOR_EMAIL,
    name: "Review Sponsor",
    role: "user",
    password: passwords.sponsor,
    data: { ...membership, firstname: "Review", lastname: "Sponsor" },
  });

  await upsertUser({
    email: MEMBER_EMAIL,
    name: "Review Member",
    role: "user",
    password: passwords.member,
    data: { ...membership, firstname: "Review", lastname: "Member", sponsorId: sponsor.id, wallet: 50000, community: 10000 },
  });

  await upsertUser({ email: ADMIN_EMAIL, name: "Review Admin", role: "admin", password: passwords.admin });

  // One live sample campaign owned by the sponsor, so the member can contribute.
  const existingCampaign = await prisma.cspSupportRequest.findFirst({
    where: { userId: sponsor.id, status: { in: ["broadcasting", "ready_for_release"] } },
    select: { id: true },
  });
  if (!existingCampaign) {
    await prisma.cspSupportRequest.create({
      data: {
        userId: sponsor.id,
        category: "national",
        amount: 12000,
        requestedAmount: 10000,
        thresholdAmount: 12000,
        raisedAmount: 0,
        contributorsCount: 0,
        purpose: "Review sample campaign (safe to delete)",
        status: "broadcasting",
        isActive: true,
        approvedBy: "review-seed",
        approvedAt: new Date(),
        cooldownMonths: 12,
        broadcastExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`\nReview accounts ready on database host ${databaseHost()} (package: ${pkg.name})\n`);
  console.table([
    { role: "Member (dashboard, CSP, wallet)", email: MEMBER_EMAIL, password: passwords.member },
    { role: "Sponsor (owns sample campaign)", email: SPONSOR_EMAIL, password: passwords.sponsor },
    { role: "Admin (/admin/login)", email: ADMIN_EMAIL, password: passwords.admin },
  ]);
  console.log("\nRemove them afterwards with --cleanup.");
}

(process.argv.includes("--cleanup") ? cleanup() : seed())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
