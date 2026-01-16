import { test, expect, type Page } from "@playwright/test";
import { prisma, ensureAdminUserExists } from "./helpers/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "qa.admin@example.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "Passw0rd!";

async function adminLogin(page: Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.locator("input#email").fill(ADMIN_EMAIL);
  await page.locator("input#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /access control center/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 30_000 });
}

test.describe("Admin UI DB audit: settings persist to AdminSettings", () => {
  test.beforeAll(async () => {
    await ensureAdminUserExists({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "QA Admin",
      username: "qaadmin",
      role: "admin",
    });
  });

  test("updating Support Email persists in DB", async ({ page }) => {
    test.setTimeout(120_000);

    const settingKey = "support_email";
    const previous = await prisma.adminSettings.findUnique({
      where: { settingKey },
      select: { id: true, settingValue: true },
    });

    const newValue = `qa-support+${Date.now()}@example.com`;

    try {
      await adminLogin(page);
      await page.goto(`${BASE_URL}/admin/settings`);

      await expect(page.getByRole("heading", { name: /system settings/i })).toBeVisible({ timeout: 30_000 });

      // Ensure we're on General tab
      await page.getByRole("button", { name: /^general$/i }).click();

      // Locate the Support Email SettingField block by its label text.
      const supportLabel = page.locator("label", { hasText: "Support Email" });
      const supportField = supportLabel.locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]');

      await expect(supportField).toBeVisible({ timeout: 30_000 });
      await supportField.locator("input").fill(newValue);

      // Save button appears only after editing.
      const saveButton = supportField.locator("button");
      await expect(saveButton).toBeVisible({ timeout: 30_000 });
      await saveButton.evaluate((el) => (el as HTMLButtonElement).click());

      await expect
        .poll(
          async () => {
            const s = await prisma.adminSettings.findUnique({
              where: { settingKey },
              select: { settingValue: true },
            });
            return s?.settingValue ?? null;
          },
          { timeout: 30_000 },
        )
        .toBe(newValue);
    } finally {
      // Restore previous value to avoid leaving config drift in dev DB.
      if (previous?.id) {
        await prisma.adminSettings.update({
          where: { settingKey },
          data: { settingValue: previous.settingValue ?? "", updatedAt: new Date() },
        });
      } else {
        await prisma.adminSettings.deleteMany({ where: { settingKey } });
      }
    }
  });
});
