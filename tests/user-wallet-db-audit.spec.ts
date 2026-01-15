import { test, expect, type Page } from "@playwright/test";
import {
  prisma,
  getUserIdByEmail,
  getUserWalletByEmail,
  getRecentTransactionsForUser,
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

test.afterAll(async () => {
  // Intentionally do not disconnect here.
  // Playwright may run multiple spec files sequentially in the same worker;
  // disconnecting would break later specs that share the same Prisma client.
});

test.describe("User wallet flows are wired to DB", () => {
  test("mock deposit updates wallet + creates DEPOSIT/VAT tx; cash withdrawal deducts wallet + creates withdrawal tx", async ({ page }) => {
    test.setTimeout(120_000);

    await ensureUserReadyForDashboard(USER_EMAIL);

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);
    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    await login(page);

    await dismissEmailVerificationIfPresent(page);

    // ---- Deposit (mock gateway) ----
    const depositAmount = 1000;
    await page.getByRole("button", { name: /^deposit$/i }).first().click();
    await page.getByPlaceholder("0.00").fill(String(depositAmount));
    await page.getByRole("button", { name: /continue to payment gateway/i }).click();
    await page.getByRole("button", { name: /mock payment/i }).click();
    await page.getByRole("button", { name: /continue to summary/i }).click();
    await page.getByRole("button", { name: /confirm & pay/i }).click();
    await expect(page.getByRole("heading", { name: /deposit funds/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /^done$/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /^done$/i }).click();

    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), {
        timeout: 30_000,
        message: "Wallet balance should increment after deposit",
      })
      .toBe(walletBefore + depositAmount);

    await expect
      .poll(async () => {
        const txs = await getRecentTransactionsForUser({
          userId,
          since,
          types: ["DEPOSIT", "VAT"],
        });
        const depositTx = txs.find((t) => t.transactionType === "DEPOSIT" && t.amount === depositAmount);
        const vatTx = txs.find((t) => t.transactionType === "VAT");
        return {
          hasDeposit: Boolean(depositTx && depositTx.status === "completed"),
          hasVat: Boolean(vatTx && vatTx.status === "completed"),
        };
      })
      .toEqual({ hasDeposit: true, hasVat: true });

    // ---- Cash withdrawal (auto-approval threshold default is 100k, so keep small) ----
    const withdrawalAmount = 500;
    const expectedFee = 100; // default CASH_WITHDRAWAL_FEE when no admin override

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

    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), {
        timeout: 30_000,
        message: "Wallet balance should decrement after withdrawal",
      })
      .toBe(walletBefore + depositAmount - (withdrawalAmount + expectedFee));

    await expect
      .poll(async () => {
        const txs = await getRecentTransactionsForUser({
          userId,
          since,
          types: ["WITHDRAWAL_CASH", "WITHDRAWAL_FEE"],
        });

        const wd = txs.find((t) => t.transactionType === "WITHDRAWAL_CASH" && t.amount === -withdrawalAmount);
        const fee = txs.find((t) => t.transactionType === "WITHDRAWAL_FEE" && t.amount === -expectedFee);

        return {
          hasWithdrawal: Boolean(wd && (wd.status === "processing" || wd.status === "completed" || wd.status === "pending")),
          hasFee: Boolean(fee && fee.status === "completed"),
        };
      })
      .toEqual({ hasWithdrawal: true, hasFee: true });
  });
});
