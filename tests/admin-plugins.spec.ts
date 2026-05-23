import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("admin plugins surfaces", () => {
  test("plugins inventory route responds", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/admin/plugins`);
    expect(response).toBeTruthy();
    expect(response?.status()).toBeLessThan(500);
  });

  test("plugins detail route responds", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/admin/plugins/non-existent-plugin`);
    expect(response).toBeTruthy();
    expect(response?.status()).toBeLessThan(500);
  });
});
