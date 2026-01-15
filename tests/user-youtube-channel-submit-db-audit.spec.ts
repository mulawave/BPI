import { test, expect, type Page } from "@playwright/test";
import {
  prisma,
  getUserIdByEmail,
  ensureQaYoutubePlan,
  ensureUserReadyForYouTubePlanPurchase,
} from "./helpers/db";
import { dismissEmailVerificationIfPresent } from "./helpers/ui";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || "qa.user1@example.com";
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || "Passw0rd!";

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

test.describe("YouTube channel submission is wired to DB", () => {
  test("submitting channel details updates YoutubeChannel draft → SUBMITTED and stores fields", async ({ page }) => {
    test.setTimeout(120_000);

    const plan = await ensureQaYoutubePlan();
    const totalCost = plan.amount + plan.vat;

    await ensureUserReadyForYouTubePlanPurchase({
      email: USER_EMAIL,
      walletMinimum: totalCost + 2000,
    });

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.getByRole("button", { name: /deposit/i }).first()).toBeVisible({ timeout: 60_000 });

    // Open Submit Channel modal.
    const submitChannelButton = page.getByRole("button", { name: /^submit channel$/i });
    await expect(submitChannelButton).toBeVisible({ timeout: 60_000 });
    await submitChannelButton.click();

    await expect(page.getByRole("heading", { name: /choose your plan/i })).toBeVisible({ timeout: 30_000 });

    // Purchase the deterministic plan.
    const planTitle = page.getByText(plan.name, { exact: true }).first();
    await expect(planTitle).toBeVisible({ timeout: 30_000 });
    await planTitle.click();

    // Wait for draft to exist and capture its id.
    let draftId: string | null = null;
    await expect
      .poll(
        async () => {
          const row = await prisma.youtubeChannel.findFirst({
            where: { userId, status: "DRAFT" },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });
          draftId = row?.id ?? null;
          return draftId;
        },
        { timeout: 30_000, message: "Expected draft YoutubeChannel after plan purchase" }
      )
      .not.toBeNull();

    // Fill channel details.
    const channelName = `QA Channel ${since.getTime()}`;
    const channelLink = "https://youtube.com/@qa-channel";
    const channelUsername = `qa_channel_${since.getTime()}`;

    await page.getByPlaceholder(/enter your youtube channel name/i).fill(channelName);
    await page.getByPlaceholder("https://youtube.com/@yourchannel").fill(channelLink);
    await page.getByPlaceholder("mychannel").fill(channelUsername);

    // Submit.
    await page.getByRole("button", { name: /continue to verification/i }).click();

    // Verification step should appear.
    await expect(page.getByText(/channel submitted!/i)).toBeVisible({ timeout: 30_000 });

    // ---- DB assertions ----
    await expect
      .poll(
        async () => {
          const row = await prisma.youtubeChannel.findUnique({
            where: { id: draftId as string },
            select: {
              status: true,
              isVerified: true,
              verificationCode: true,
              channelName: true,
              channelUrl: true,
              channelLink: true,
              updatedAt: true,
            },
          });

          return {
            status: row?.status ?? null,
            isVerified: row?.isVerified ?? null,
            hasCode: Boolean(row?.verificationCode),
            channelName: row?.channelName ?? null,
            channelUrl: row?.channelUrl ?? null,
            channelLink: row?.channelLink ?? null,
          };
        },
        { timeout: 30_000, message: "Expected YoutubeChannel draft to transition to SUBMITTED with fields persisted" }
      )
      .toEqual({
        status: "SUBMITTED",
        isVerified: false,
        hasCode: true,
        channelName,
        channelUrl: channelUsername,
        channelLink,
      });
  });
});
