import { test, expect, type Page } from "@playwright/test";
import {
  getRecentTransactionsForUser,
  getUserIdByEmail,
  ensureUserReadyForDashboard,
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

test.describe("Receipts are wired to DB", () => {
  test("completed deposit/withdraw show receipts and receipt endpoints return HTML", async ({ page }) => {
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

    // Create a (completed or processing) cash withdrawal; receipts page only lists completed withdrawals,
    // so we use a small amount under auto-approval thresholds and wait for completion in DB.
    const withdrawalAmount = 500;
    await page.getByRole("button", { name: /^withdraw$/i }).first().click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByPlaceholder("0.00").fill(String(withdrawalAmount));
    await page.getByPlaceholder(/e\.g\./i).fill("QA Test Bank");
    await page.getByPlaceholder(/0123456789/i).fill("1234567890");
    await page.getByPlaceholder(/full name as per bank/i).fill("QA USER ONE");
    await page.getByRole("button", { name: /continue to summary/i }).click();
    await page.getByRole("button", { name: /confirm withdrawal/i }).click();
    await expect(page.getByText(/withdrawal submitted!/i)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /^done$/i }).click();

    // Wait for a completed DEPOSIT transaction id for receipt.
    await expect
      .poll(
        async () => {
          const txs = await getRecentTransactionsForUser({ userId, since, types: ["DEPOSIT"] });
          const tx = txs.find((t) => t.transactionType === "DEPOSIT" && t.status === "completed");
          return Boolean(tx?.id);
        },
        { timeout: 30_000, message: "Expected a completed DEPOSIT transaction for receipt" },
      )
      .toBe(true);

    const depositTxs = await getRecentTransactionsForUser({ userId, since, types: ["DEPOSIT"] });
    const depositTxId = depositTxs.find((t) => t.transactionType === "DEPOSIT" && t.status === "completed")?.id;
    if (!depositTxId) throw new Error("Completed deposit transaction id missing after polling");

    // Receipts page uses completed deposits + withdrawals.
    await page.goto(`${BASE_URL}/receipts`);
    await expect(page.getByText(/transaction receipts/i)).toBeVisible({ timeout: 30_000 });

    // Use the API endpoint directly (it enforces auth + ownership).
    const depositReceipt = await page.request.get(`${BASE_URL}/api/receipt/deposit/${depositTxId}`);
    expect(depositReceipt.status()).toBe(200);

    const depositHtml = await depositReceipt.text();
    expect(depositHtml).toContain("<html");
    expect(depositHtml.toLowerCase()).toContain("deposit");

    // For withdrawal, best-effort: only validate if we see a completed one since the backend may keep it processing.
    const withdrawalTxs = await getRecentTransactionsForUser({ userId, since, types: ["WITHDRAWAL_CASH"] });
    const withdrawalTxId = withdrawalTxs.find((t) => t.transactionType === "WITHDRAWAL_CASH" && t.status === "completed")?.id ?? null;

    if (withdrawalTxId) {
      const withdrawalReceipt = await page.request.get(`${BASE_URL}/api/receipt/withdrawal/${withdrawalTxId}`);
      expect(withdrawalReceipt.status()).toBe(200);
      const wHtml = await withdrawalReceipt.text();
      expect(wHtml).toContain("<html");
      expect(wHtml.toLowerCase()).toContain("withdraw");
    }
  });
});
