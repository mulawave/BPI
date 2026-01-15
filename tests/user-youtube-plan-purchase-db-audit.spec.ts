import { test, expect, type Page } from "@playwright/test";
import {
  getUserIdByEmail,
  getUserWalletByEmail,
  getRecentTransactionsForUser,
  ensureQaYoutubePlan,
  ensureUserReadyForYouTubePlanPurchase,
  prisma,
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

test.describe("YouTube plan purchase is wired to DB", () => {
  test("purchasing a YouTube plan debits wallet, creates provider + draft channel + tx rows", async ({ page }) => {
    test.setTimeout(120_000);

    const plan = await ensureQaYoutubePlan();
    const totalCost = plan.amount + plan.vat;

    await ensureUserReadyForYouTubePlanPurchase({
      email: USER_EMAIL,
      walletMinimum: totalCost + 2000,
    });

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);
    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    // Open the modal from the YouTube Builder section.
    const submitChannelButton = page.getByRole("button", { name: /^submit channel$/i });
    await expect(submitChannelButton).toBeVisible({ timeout: 60_000 });
    await submitChannelButton.scrollIntoViewIfNeeded();
    await submitChannelButton.click();

    await expect(page.getByRole("heading", { name: /choose your plan/i })).toBeVisible({ timeout: 30_000 });

    // Click the plan name (event bubbles to the card's onClick).
    const planTitle = page.getByText(plan.name, { exact: true }).first();
    await expect(planTitle).toBeVisible({ timeout: 30_000 });
    await planTitle.click();

    // Wait for server-side effects rather than a UI step transition.
    await expect
      .poll(
        async () => {
          const provider = await prisma.youtubeProvider.findUnique({
            where: { userId },
            select: { id: true },
          });
          const draft = await prisma.youtubeChannel.findFirst({
            where: { userId, status: "DRAFT" },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });
          return Boolean(provider && draft);
        },
        { timeout: 30_000, message: "Expected YouTube provider + draft channel to be created" }
      )
      .toBe(true);

    // ---- DB assertions ----
    await expect
      .poll(async () => {
        const provider = await prisma.youtubeProvider.findUnique({
          where: { userId },
          select: { id: true, youtubePlanId: true, balance: true },
        });
        const draft = await prisma.youtubeChannel.findFirst({
          where: { userId, status: "DRAFT" },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true, isVerified: true, verificationCode: true },
        });
        const walletNow = await getUserWalletByEmail(USER_EMAIL);

        return {
          hasProvider: Boolean(provider && provider.youtubePlanId === plan.id && provider.balance === plan.totalSub),
          hasDraft: Boolean(draft && draft.status === "DRAFT" && draft.isVerified === false && !!draft.verificationCode),
          walletDelta: walletBefore - walletNow,
        };
      }, {
        timeout: 30_000,
        message: "YouTube plan purchase should create provider + draft and debit wallet",
      })
      .toEqual({ hasProvider: true, hasDraft: true, walletDelta: totalCost });

    await expect
      .poll(async () => {
        const txs = await getRecentTransactionsForUser({ userId, since, types: ["debit"] });
        const growth = txs.find((t) => (t.description ?? "").includes("YouTube Growth") && t.status === "completed");
        const vatTx = txs.find((t) => (t.description ?? "").includes("VAT - YouTube") && t.status === "completed");
        return {
          hasGrowthDebit: Boolean(growth),
          hasVatDebit: Boolean(vatTx),
        };
      })
      .toEqual({ hasGrowthDebit: true, hasVatDebit: true });
  });
});
