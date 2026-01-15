import { test, expect, type Page } from "@playwright/test";
import {
  ensureUserReadyForDashboard,
  getRecentTransactionsForUser,
  getUserIdByEmail,
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

test.describe("Receipts UI download opens correct receipt", () => {
  test("clicking Receipt opens /api/receipt/deposit/<id> in a new tab", async ({ page }) => {
    test.setTimeout(180_000);

    await ensureUserReadyForDashboard(USER_EMAIL);

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    // Create a completed deposit (mock gateway)
    const depositAmount = 1000;
    await page.getByRole("button", { name: /^deposit$/i }).first().click();
    await page.getByPlaceholder("0.00").fill(String(depositAmount));
    await page.getByRole("button", { name: /continue to payment gateway/i }).click();
    await page.getByRole("button", { name: /mock payment/i }).click();
    await page.getByRole("button", { name: /continue to summary/i }).click();
    await page.getByRole("button", { name: /confirm & pay/i }).click();
    await expect(page.getByRole("heading", { name: /deposit funds/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /^done$/i }).click();

    // Fetch the deposit tx id from DB so we can click the matching receipt card.
    await expect
      .poll(
        async () => {
          const txs = await getRecentTransactionsForUser({ userId, since, types: ["DEPOSIT"] });
          return txs.some((t) => t.transactionType === "DEPOSIT" && t.amount === depositAmount && t.status === "completed");
        },
        { timeout: 30_000, message: "Expected a completed DEPOSIT transaction" },
      )
      .toBe(true);

    const txs = await getRecentTransactionsForUser({ userId, since, types: ["DEPOSIT"] });
    const depositTx = txs.find((t) => t.transactionType === "DEPOSIT" && t.amount === depositAmount && t.status === "completed");
    if (!depositTx) throw new Error("Deposit transaction not found after polling");

    const idPrefix = depositTx.id.slice(0, 8);

    await page.goto(`${BASE_URL}/receipts`);
    await expect(page.getByText(/transaction receipts/i)).toBeVisible({ timeout: 30_000 });

    const card = page.getByText(new RegExp(`Transaction ID:\\s+${idPrefix}\\.\\.\\.`)).first();
    await expect(card).toBeVisible({ timeout: 30_000 });

    // Click the receipt button within the matching card and verify it opens the right URL.
    const receiptButton = card.locator("..")
      .locator("..")
      .getByRole("button", { name: /^receipt$/i });

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      receiptButton.click(),
    ]);

    await popup.waitForLoadState("domcontentloaded");
    expect(popup.url()).toContain(`/api/receipt/deposit/${depositTx.id}`);

    const html = await popup.content();
    expect(html).toContain("<html");

    await popup.close();
  });
});
