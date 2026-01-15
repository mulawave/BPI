import { test, expect, type Page } from "@playwright/test";
import { ensureUserReadyForDashboard } from "./helpers/db";
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

test.describe("User auth + navigation", () => {
  test("unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(/\/login/i, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/i);
  });

  test("after login, dashboard/transactions/membership pages render", async ({ page }) => {
    test.setTimeout(90_000);

    await ensureUserReadyForDashboard(USER_EMAIL);
    await login(page);

    await dismissEmailVerificationIfPresent(page);

    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.getByText(/member dashboard/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /deposit/i }).first()).toBeVisible({ timeout: 30_000 });

    await page.goto(`${BASE_URL}/transactions`);
    await expect(page.getByText("Transaction History")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();

    await page.goto(`${BASE_URL}/membership`);
    await expect(
      page.getByRole("heading", { name: /activate your membership|upgrade your membership/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
