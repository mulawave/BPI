import { test, expect, type Page } from "@playwright/test";
import { readFile } from "fs/promises";
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

test.describe("Transactions export is wired to DB", () => {
  test.use({ acceptDownloads: true });

  test("Export downloads a CSV containing recent DB transactions", async ({ page }) => {
    test.setTimeout(180_000);

    await ensureUserReadyForDashboard(USER_EMAIL);

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    // Create a completed deposit so we have a known reference to assert in export.
    const depositAmount = 1000;
    await page.getByRole("button", { name: /^deposit$/i }).first().click();
    await page.getByPlaceholder("0.00").fill(String(depositAmount));
    await page.getByRole("button", { name: /continue to payment gateway/i }).click();
    await page.getByRole("button", { name: /mock payment/i }).click();
    await page.getByRole("button", { name: /continue to summary/i }).click();
    await page.getByRole("button", { name: /confirm & pay/i }).click();
    await expect(page.getByRole("heading", { name: /deposit funds/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /^done$/i }).click();

    await expect
      .poll(
        async () => {
          const txs = await getRecentTransactionsForUser({ userId, since, types: ["DEPOSIT"] });
          const tx = txs.find((t) => t.transactionType === "DEPOSIT" && t.amount === depositAmount && t.status === "completed");
          return tx?.reference ?? null;
        },
        { timeout: 30_000, message: "Expected a completed deposit transaction reference" },
      )
      .not.toBeNull();

    const txs = await getRecentTransactionsForUser({ userId, since, types: ["DEPOSIT"] });
    const depositTx = txs.find((t) => t.transactionType === "DEPOSIT" && t.amount === depositAmount && t.status === "completed");
    if (!depositTx?.reference) throw new Error("Deposit transaction reference missing");

    // Go to transactions page and export.
    await page.goto(`${BASE_URL}/transactions`);
    await expect(page.getByText(/transaction history/i)).toBeVisible({ timeout: 30_000 });

    // Ensure the UI actually has our transaction before exporting.
    await expect(page.getByText(new RegExp(`Ref:\\s+${depositTx.reference.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`))).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /^export$/i }).click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error("Download path unavailable");

    const csv = await readFile(path, "utf8");

    // Basic CSV sanity checks
    expect(csv).toContain("Date,Reference,Type,Description,Amount,Status");
    expect(csv).toContain(depositTx.reference);
    expect(csv).toContain("DEPOSIT");
  });
});
