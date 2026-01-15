import { test, expect, type Page } from "@playwright/test";
import {
  prisma,
  getUserIdByEmail,
  ensureUserReadyForDashboard,
  ensureVerifiedYoutubeChannelForOwner,
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

test.describe("YouTube browse/subscribe is wired to DB", () => {
  test("subscribing to a verified channel creates a ChannelSubscription row", async ({ page }) => {
    test.setTimeout(120_000);

    await ensureUserReadyForDashboard(USER_EMAIL);

    const { channelId, channelName } = await ensureVerifiedYoutubeChannelForOwner({
      ownerEmail: OWNER_EMAIL,
      channelName: "QA Verified Channel",
    });

    const subscriberId = await getUserIdByEmail(USER_EMAIL);

    // Ensure a clean slate for this subscriber/channel pair.
    await prisma.channelSubscription.deleteMany({ where: { subscriberId, channelId } });

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    // Ensure we're actually authenticated and the dashboard has rendered.
    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.getByRole("button", { name: /deposit/i }).first()).toBeVisible({ timeout: 60_000 });

    // Open Browse Channels modal from dashboard.
    const exploreButton = page.getByRole("button", { name: /^explore$/i });
    await expect(exploreButton).toBeVisible({ timeout: 60_000 });
    await exploreButton.click();

    await expect(page.getByPlaceholder(/search channels/i)).toBeVisible({ timeout: 30_000 });

    // Filter to our deterministic channel.
    await page.getByPlaceholder(/search channels/i).fill(channelName);

    // Subscribe.
    await page.getByRole("button", { name: /subscribe & earn/i }).first().click();

    await expect
      .poll(
        async () => {
          const row = await prisma.channelSubscription.findUnique({
            where: {
              subscriberId_channelId: {
                subscriberId,
                channelId,
              },
            },
            select: { id: true, status: true },
          });
          return { exists: Boolean(row), status: row?.status ?? null };
        },
        { timeout: 30_000, message: "Expected ChannelSubscription row after subscribing" }
      )
      .toEqual({ exists: true, status: "pending" });
  });
});
