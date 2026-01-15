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
  ensurePendingYoutubeSubscription,
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

async function trpcPost(page: Page, procedure: string, input: unknown) {
  const res = await page.request.post(`${BASE_URL}/api/trpc/${procedure}`,
    {
      data: { json: input },
    }
  );

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok() || body?.error) {
    const message = body?.error?.message || `tRPC call failed: ${procedure} (HTTP ${res.status()})`;
    throw new Error(message);
  }

  return body?.result?.data?.json ?? body?.result?.data ?? body;
}

test.describe("YouTube claim earnings idempotency", () => {
  test("claiming twice only credits once", async ({ page }) => {
    test.setTimeout(120_000);

    const plan = await ensureQaYoutubePlan();

    const { id: ownerId } = await ensureUserExists({ email: OWNER_EMAIL, firstname: "QA", lastname: "Owner" });
    const { channelId, channelName } = await ensureVerifiedYoutubeChannelForOwner({ ownerEmail: OWNER_EMAIL });
    await ensureYoutubeProviderForOwner({ ownerId, planId: plan.id, balance: 5 });

    await ensureUserReadyForDashboard(USER_EMAIL);
    const subscriberId = await getUserIdByEmail(USER_EMAIL);

    await clearReferral({ referredId: subscriberId });
    await resetYoutubeSubscriptionState({ subscriberId, channelId });
    await ensurePendingYoutubeSubscription({ subscriberId, channelId });

    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);
    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.getByRole("button", { name: /deposit/i }).first()).toBeVisible({ timeout: 60_000 });

    // Call the protected mutation twice via /api/trpc (uses the same auth cookies as the page).
    const first = await trpcPost(page, "youtube.claimEarnings", { channelId });
    expect(first?.success).toBeTruthy();
    expect(first?.amount).toBe(40);

    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), { timeout: 30_000 })
      .toBe(walletBefore + 40);

    const second = await trpcPost(page, "youtube.claimEarnings", { channelId });
    expect(second?.success).toBeTruthy();
    expect(second?.amount).toBe(0);

    // DB should still show only one paid earning and wallet unchanged.
    const walletAfter = await getUserWalletByEmail(USER_EMAIL);
    expect(walletAfter).toBe(walletBefore + 40);

    const paidCount = await prisma.userEarning.count({
      where: { userId: subscriberId, channelId, type: "subscription", isPaid: true },
    });
    expect(paidCount).toBe(1);
  });
});
