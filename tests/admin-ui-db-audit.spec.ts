import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "crypto";
import {
  prisma,
  ensureAdminUserExists,
  getUserIdByEmail,
  getUserWalletByEmail,
} from "./helpers/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "qa.admin@example.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "Passw0rd!";
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || "qa.user1@example.com";

function parseNumberFromText(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  if (Number.isNaN(n)) {
    throw new Error(`Unable to parse number from: ${JSON.stringify(text)}`);
  }
  return n;
}

async function adminLogin(page: Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.locator("input#email").fill(ADMIN_EMAIL);
  await page.locator("input#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /access control center/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/admin(?:\?|$)/i);
}

test.describe("Admin UI DB audit: login → dashboard/users/payments", () => {
  test.beforeAll(async () => {
    // Ensure admin exists for credentials login.
    await ensureAdminUserExists({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "QA Admin",
      username: "qaadmin",
      role: "admin",
    });
  });

  test("dashboard stats reflect DB counts", async ({ page }) => {
    test.setTimeout(120_000);

    // Seed a deterministic pending payment so the dashboard has something concrete.
    const pendingBefore = await prisma.pendingPayment.count({ where: { status: "pending" } });
    const userId = await getUserIdByEmail(USER_EMAIL);
    const gatewayReference = `QA-DASH-${Date.now()}`;

    await prisma.pendingPayment.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "TOPUP",
        amount: 5,
        currency: "NGN",
        paymentMethod: "Bank Transfer",
        gatewayReference,
        status: "pending",
        updatedAt: new Date(),
      },
    });

    const expectedTotalUsers = await prisma.user.count();
    const expectedPendingPayments = pendingBefore + 1;

    await adminLogin(page);

    const totalUsersCard = page.locator(".premium-stat-card", {
      has: page.getByText("Total Users", { exact: true }),
    });
    const pendingPaymentsCard = page.locator(".premium-stat-card", {
      has: page.getByText("Pending Payments", { exact: true }),
    });

    await expect(totalUsersCard.locator("h3")).toBeVisible({ timeout: 30_000 });
    await expect(pendingPaymentsCard.locator("h3")).toBeVisible({ timeout: 30_000 });

    const totalUsersText = await totalUsersCard.locator("h3").innerText();
    const pendingText = await pendingPaymentsCard.locator("h3").innerText();

    expect(parseNumberFromText(totalUsersText)).toBe(expectedTotalUsers);
    expect(parseNumberFromText(pendingText)).toBe(expectedPendingPayments);
  });

  test("users page search returns DB user", async ({ page }) => {
    test.setTimeout(120_000);

    await adminLogin(page);

    await page.goto(`${BASE_URL}/admin/users`);

    const search = page.getByPlaceholder(/search by name, email, or username/i);
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.scrollIntoViewIfNeeded();
    await search.evaluate(
      (el, value) => {
        const input = el as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      USER_EMAIL,
    );

    await expect(page.getByText(USER_EMAIL).first()).toBeVisible({ timeout: 30_000 });
  });

  test("payments review approve updates PendingPayment + wallet + transaction", async ({ page }) => {
    test.setTimeout(150_000);

    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { id: true },
    });
    if (!admin) throw new Error("QA admin missing; ensure seeding ran");

    const userId = await getUserIdByEmail(USER_EMAIL);
    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    const gatewayReference = `QA-PAY-${Date.now()}`;
    const amount = 1234;
    const paymentId = randomUUID();

    await prisma.pendingPayment.create({
      data: {
        id: paymentId,
        userId,
        transactionType: "TOPUP",
        amount,
        currency: "NGN",
        paymentMethod: "Bank Transfer",
        gatewayReference,
        status: "pending",
        updatedAt: new Date(),
      },
    });

    await adminLogin(page);

    await page.goto(`${BASE_URL}/admin/payments`);
    await page.getByRole("button", { name: /^pending reviews$/i }).click();

    const search = page.getByPlaceholder(/search by reference/i);
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.fill(gatewayReference);

    const row = page.getByText(gatewayReference).locator("xpath=ancestor::tr");
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: /^review$/i }).click();

    // Modal approve path
    await expect(page.getByRole("heading", { name: /review payment/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /^approve payment$/i }).click();

    await expect
      .poll(
        async () => {
          const p = await prisma.pendingPayment.findUnique({
            where: { id: paymentId },
            select: { status: true, reviewedBy: true, reviewedAt: true },
          });
          return {
            status: p?.status,
            reviewedBy: p?.reviewedBy,
            reviewedAt: p?.reviewedAt ? "set" : null,
          };
        },
        { timeout: 30_000 },
      )
      .toEqual({ status: "approved", reviewedBy: admin.id, reviewedAt: "set" });

    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), { timeout: 30_000 })
      .toBe(walletBefore + amount);

    await expect
      .poll(
        async () =>
          prisma.transaction.count({
            where: {
              userId,
              transactionType: "DEPOSIT",
              reference: gatewayReference,
              status: "completed",
            },
          }),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
  });

  test("admin help DB audit coverage page renders", async ({ page }) => {
    test.setTimeout(120_000);

    await adminLogin(page);
    await page.goto(`${BASE_URL}/admin/help/db-audit`);

    await expect(
      page.getByRole("heading", { name: "User-Facing DB Audit Coverage", exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/coverage map/i).first()).toBeVisible({ timeout: 30_000 });
  });
});
