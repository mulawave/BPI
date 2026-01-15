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
  clearReferral,
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

test.describe("YouTube claim earnings balance guard", () => {
  test("claim fails when provider balance is 0 and does not credit wallet", async ({ page }) => {
    test.setTimeout(120_000);

    const plan = await ensureQaYoutubePlan();

    const { id: ownerId } = await ensureUserExists({ email: OWNER_EMAIL, firstname: "QA", lastname: "Owner" });
    const { channelId, channelName } = await ensureVerifiedYoutubeChannelForOwner({ ownerEmail: OWNER_EMAIL });
    await ensureYoutubeProviderForOwner({ ownerId, planId: plan.id, balance: 0 });

    await ensureUserReadyForDashboard(USER_EMAIL);
    const subscriberId = await getUserIdByEmail(USER_EMAIL);

    await clearReferral({ referredId: subscriberId });
    await resetYoutubeSubscriptionState({ subscriberId, channelId });

    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

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

    // DB should NOT be credited and subscription should remain pending.
    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), { timeout: 10_000 })
      .toBe(walletBefore);

    const sub = await prisma.channelSubscription.findUnique({
      where: { subscriberId_channelId: { subscriberId, channelId } },
      select: { status: true },
    });

    expect(sub?.status).toBe("pending");
  });
});
