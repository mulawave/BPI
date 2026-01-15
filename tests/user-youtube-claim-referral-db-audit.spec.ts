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
  ensureReferral,
} from "./helpers/db";
import { dismissEmailVerificationIfPresent } from "./helpers/ui";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || "qa.user1@example.com";
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || "Passw0rd!";

const OWNER_EMAIL = process.env.SMOKE_YT_OWNER_EMAIL || "qa.user2@example.com";
const REFERRER_EMAIL = process.env.SMOKE_YT_REFERRER_EMAIL || "qa.referrer@example.com";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/email/i).fill(USER_EMAIL);
  await page.getByPlaceholder(/password/i).fill(USER_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 30_000 });
}

test.describe("YouTube claim earnings referral credit", () => {
  test("claim credits subscriber (+40) and referrer (+10)", async ({ page }) => {
    test.setTimeout(120_000);

    const plan = await ensureQaYoutubePlan();

    const { id: ownerId } = await ensureUserExists({ email: OWNER_EMAIL, firstname: "QA", lastname: "Owner" });
    const { channelId, channelName } = await ensureVerifiedYoutubeChannelForOwner({ ownerEmail: OWNER_EMAIL });
    await ensureYoutubeProviderForOwner({ ownerId, planId: plan.id, balance: 5 });

    await ensureUserReadyForDashboard(USER_EMAIL);

    const subscriberId = await getUserIdByEmail(USER_EMAIL);
    const { id: referrerId } = await ensureUserExists({ email: REFERRER_EMAIL, firstname: "QA", lastname: "Referrer" });

    await ensureReferral({ referrerId, referredId: subscriberId, status: "pending" });

    await resetYoutubeSubscriptionState({ subscriberId, channelId });

    const walletSubscriberBefore = await getUserWalletByEmail(USER_EMAIL);
    const walletReferrerBefore = (await prisma.user.findUnique({ where: { id: referrerId }, select: { wallet: true } }))
      ?.wallet ?? 0;

    await login(page);
    await dismissEmailVerificationIfPresent(page);
    await expect(page).toHaveURL(/\/dashboard/i);

    await page.getByRole("button", { name: /^explore$/i }).click();
    await expect(page.getByPlaceholder(/search channels/i)).toBeVisible({ timeout: 30_000 });
    await page.getByPlaceholder(/search channels/i).fill(channelName);
    await page.getByRole("button", { name: /subscribe & earn/i }).first().click();

    const claimButton = page.getByRole("button", { name: /claim \₦?40/i });
    await expect(claimButton).toBeVisible({ timeout: 30_000 });
    await claimButton.click();

    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), { timeout: 30_000 })
      .toBe(walletSubscriberBefore + 40);

    await expect
      .poll(async () => {
        const u = await prisma.user.findUnique({ where: { id: referrerId }, select: { wallet: true } });
        return u?.wallet ?? 0;
      })
      .toBe(walletReferrerBefore + 10);

    const refEarning = await prisma.userEarning.findFirst({
      where: { userId: referrerId, channelId, type: "referral", isPaid: true },
      orderBy: { createdAt: "desc" },
      select: { amount: true },
    });

    expect(refEarning ? Number(refEarning.amount) : null).toBe(10);
  });
});
