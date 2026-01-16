import { test, expect, type Page } from "@playwright/test";
import { prisma, ensureAdminUserExists } from "./helpers/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "qa.admin@example.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "Passw0rd!";

function parseNumberFromText(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  if (Number.isNaN(n)) throw new Error(`Unable to parse number from: ${JSON.stringify(text)}`);
  return n;
}

async function adminLogin(page: Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.locator("input#email").fill(ADMIN_EMAIL);
  await page.locator("input#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /access control center/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 30_000 });
}

test.describe("Admin UI DB audit: reports reflect DB analytics", () => {
  test.beforeAll(async () => {
    await ensureAdminUserExists({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "QA Admin",
      username: "qaadmin",
      role: "admin",
    });
  });

  test("/admin/reports shows totals matching Prisma aggregates", async ({ page }) => {
    test.setTimeout(120_000);

    // Defaults in UI/server: period=30d, granularity=day
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [payments, newUsers] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          status: "completed",
          transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
          amount: { gt: 0 },
          createdAt: { gte: startDate },
        },
        select: { amount: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { membershipActivatedAt: true },
      }),
    ]);

    const expectedTotalRevenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const expectedTransactionCount = payments.length;

    const expectedTotalRegistrations = newUsers.length;
    const expectedTotalActivations = newUsers.filter(
      (u) => u.membershipActivatedAt && u.membershipActivatedAt >= startDate,
    ).length;

    await adminLogin(page);
    await page.goto(`${BASE_URL}/admin/reports`);

    await expect(page.getByRole("heading", { name: "Reports & Trends", exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // Revenue section assertions (anchor to the specific card containing the label)
    const totalRevenueCard = page
      .getByText("Total Revenue", { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    await expect(totalRevenueCard).toBeVisible({ timeout: 30_000 });

    const totalRevenueText = await totalRevenueCard.locator('p.text-2xl').innerText();
    const expectedRevenueText = `₦${(expectedTotalRevenue / 1_000_000).toFixed(2)}M`;
    expect(totalRevenueText.trim()).toBe(expectedRevenueText);

    const txCard = page
      .getByText("Transactions", { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    await expect(txCard).toBeVisible({ timeout: 30_000 });
    const txCountText = await txCard.locator('p.text-2xl').innerText();
    expect(parseNumberFromText(txCountText)).toBe(expectedTransactionCount);

    // User section assertions
    const totalRegistrationsCard = page
      .getByText("Total Registrations", { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    await expect(totalRegistrationsCard).toBeVisible({ timeout: 30_000 });
    const regText = await totalRegistrationsCard.locator('p.text-2xl').innerText();
    expect(parseNumberFromText(regText)).toBe(expectedTotalRegistrations);

    const totalActivationsCard = page
      .getByText("Total Activations", { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    await expect(totalActivationsCard).toBeVisible({ timeout: 30_000 });
    const actText = await totalActivationsCard.locator('p.text-2xl').innerText();
    expect(parseNumberFromText(actText)).toBe(expectedTotalActivations);
  });
});
