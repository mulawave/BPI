import { test, expect, type Page } from "@playwright/test";
import {
  prisma,
  getUserIdByEmail,
  getUserWalletByEmail,
  ensureQaYoutubePlan,
  ensureUserReadyForDashboard,
  ensureUserExists,
  ensureVerifiedYoutubeChannelForOwner,
  ensureYoutubeProviderForOwner,
  resetYoutubeSubscriptionState,
} from "./helpers/db";
import { dismissEmailVerificationIfPresent } from "./helpers/ui";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || "qa.user1@example.com";
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || "Passw0rd!";

const OWNER_EMAIL = process.env.SMOKE_YT_OWNER_EMAIL || "qa.user2@example.com";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/email/i).fill(USER_EMAIL);
  await page.getByPlaceholder(/password/i).fill(USER_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 30_000 });
}

test.afterAll(async () => {
  // Intentionally do not disconnect here.
});

test.describe("YouTube claim earnings is wired to DB", () => {
  test("claiming ₦40 marks subscription paid, credits wallet, and records earnings", async ({ page }) => {
    test.setTimeout(120_000);

    const plan = await ensureQaYoutubePlan();

    const { id: ownerId } = await ensureUserExists({ email: OWNER_EMAIL, firstname: "QA", lastname: "Owner" });
    const { channelId, channelName } = await ensureVerifiedYoutubeChannelForOwner({ ownerEmail: OWNER_EMAIL });
    await ensureYoutubeProviderForOwner({ ownerId, planId: plan.id, balance: 5 });

    await ensureUserReadyForDashboard(USER_EMAIL);
    const subscriberId = await getUserIdByEmail(USER_EMAIL);

    await resetYoutubeSubscriptionState({ subscriberId, channelId });

    const since = new Date();
    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);
    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.getByRole("button", { name: /deposit/i }).first()).toBeVisible({ timeout: 60_000 });

    // Subscribe via UI to create a pending subscription.
    const exploreButton = page.getByRole("button", { name: /^explore$/i });
    await expect(exploreButton).toBeVisible({ timeout: 60_000 });
    await exploreButton.click();

    await expect(page.getByPlaceholder(/search channels/i)).toBeVisible({ timeout: 30_000 });
    await page.getByPlaceholder(/search channels/i).fill(channelName);

    const subscribeButton = page.getByRole("button", { name: /subscribe & earn/i }).first();
    await expect(subscribeButton).toBeVisible({ timeout: 30_000 });
    await subscribeButton.click();

    // Claim earnings (button text appears for pending state).
    const claimButton = page.getByRole("button", { name: /claim \₦?40/i });
    await expect(claimButton).toBeVisible({ timeout: 30_000 });
    await claimButton.click();

    // ---- DB assertions ----
    await expect
      .poll(
        async () => {
          const sub = await prisma.channelSubscription.findUnique({
            where: { subscriberId_channelId: { subscriberId, channelId } },
            select: { status: true, paidAt: true },
          });
          return { status: sub?.status ?? null, paidAt: Boolean(sub?.paidAt) };
        },
        { timeout: 30_000, message: "Subscription should be marked paid after claiming" }
      )
      .toEqual({ status: "paid", paidAt: true });

    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), {
        timeout: 30_000,
        message: "Wallet should be credited after claiming",
      })
      .toBe(walletBefore + 40);

    await expect
      .poll(
        async () => {
          const earning = await prisma.userEarning.findFirst({
            where: { userId: subscriberId, channelId, type: "subscription" },
            orderBy: { createdAt: "desc" },
            select: { amount: true, isPaid: true },
          });
          const tx = await prisma.transaction.findFirst({
            where: {
              userId: subscriberId,
              createdAt: { gte: since },
              description: { contains: "Youtube Subscription Earnings", mode: "insensitive" },
            },
            orderBy: { createdAt: "desc" },
            select: { amount: true, status: true },
          });
          return {
            earningAmount: earning ? Number(earning.amount) : null,
            earningPaid: earning?.isPaid ?? null,
            txAmount: tx ? Number(tx.amount) : null,
            txStatus: tx?.status ?? null,
          };
        },
        { timeout: 30_000, message: "Earning + transaction should be recorded after claiming" }
      )
      .toEqual({ earningAmount: 40, earningPaid: true, txAmount: 40, txStatus: "completed" });
  });
});
