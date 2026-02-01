import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

type SmokeConfig = {
  baseURL: string;
  userEmail: string;
  userPassword: string;
  staffEmail: string;
  staffPassword: string;
  claimCode: string;
};

const fixturePath = path.resolve(__dirname, "./fixtures/claim-smoke.json");

const loadConfig = (): SmokeConfig | null => {
  if (fs.existsSync(fixturePath)) {
    try {
      const content = fs.readFileSync(fixturePath, "utf-8");
      const parsed = JSON.parse(content) as SmokeConfig;
      return parsed;
    } catch (err) {
      console.warn("Failed to read claim-smoke fixture:", err);
    }
  }

  // Fallback to environment for CI/one-off runs.
  if (
    process.env.CLAIM_SMOKE_ENABLED === "1" &&
    process.env.USER_EMAIL &&
    process.env.USER_PASSWORD &&
    process.env.STAFF_EMAIL &&
    process.env.STAFF_PASSWORD &&
    process.env.CLAIM_CODE
  ) {
    return {
      baseURL: process.env.BASE_URL || "http://localhost:3000",
      userEmail: process.env.USER_EMAIL,
      userPassword: process.env.USER_PASSWORD,
      staffEmail: process.env.STAFF_EMAIL,
      staffPassword: process.env.STAFF_PASSWORD,
      claimCode: process.env.CLAIM_CODE,
    } as SmokeConfig;
  }

  return null;
};

const config = loadConfig();
const requiredFieldsPresent = config
  ? Object.values(config).every((v) => typeof v === "string" && v.length > 0)
  : false;

test.describe("claim flow smoke", () => {
  test.skip(!requiredFieldsPresent, "Provide tests/fixtures/claim-smoke.json or set env vars with CLAIM_SMOKE_ENABLED=1.");

  test("user confirms claim after staff verification", async ({ page, context }) => {
    if (!config) {
      test.skip(true, "Config missing");
    }

    const cfg = config as SmokeConfig;

    // Login as staff and verify claim code
    const staffPage = await context.newPage();
    await staffPage.goto(`${cfg.baseURL}/login`);
    await staffPage.fill('input[type="email"]', cfg.staffEmail);
    await staffPage.fill('input[type="password"]', cfg.staffPassword);
    await staffPage.getByRole("button", { name: /sign in/i }).click();
    await staffPage.goto(`${cfg.baseURL}/store/pickup-verify`);
    await staffPage.fill('input[placeholder="e.g., BPI-123456-PC"]', cfg.claimCode);
    await staffPage.getByRole("button", { name: /verify code/i }).click();
    await expect(staffPage.getByText(/verified/i)).toBeVisible();

    // Login as customer and confirm pickup, then rate
    await page.goto(`${cfg.baseURL}/login`);
    await page.fill('input[type="email"]', cfg.userEmail);
    await page.fill('input[type="password"]', cfg.userPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.goto(`${cfg.baseURL}/store/orders`);
    await page.getByRole("button", { name: /confirm pickup/i }).first().click();
    await expect(page.getByText(/pickup confirmed/i)).toBeVisible();
    await page.getByRole("button", { name: /rate pickup/i }).first().click();
    await page.getByLabel(/comments/i).fill("Smoke test rating");
    await page.getByRole("button", { name: /^submit$/i }).click();
    await expect(page.getByText(/feedback saved/i)).toBeVisible();

    // Cleanup: log out both sessions
    await page.context().storageState({ path: "playwright-auth-user.json" });
    await staffPage.context().storageState({ path: "playwright-auth-staff.json" });
  });
});
