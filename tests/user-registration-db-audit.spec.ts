import { test, expect, type Page } from "@playwright/test";
import { getUserByEmail, deleteUserByEmail } from "./helpers/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function uniqueEmail() {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1_000_000);
  return `qa.register.${ts}.${rnd}@example.com`;
}

function uniqueScreenname() {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1_000_000);
  return `qa_user_${ts}_${rnd}`;
}

async function solveCaptcha(page: Page) {
  const captcha = page.locator('input[name="captcha"]');
  await expect(captcha).toBeVisible({ timeout: 30_000 });
  const placeholder = await captcha.getAttribute("placeholder");
  if (!placeholder) throw new Error("Captcha placeholder not found");

  const match = placeholder.match(/What is\s+(\d+)\s*\+\s*(\d+)\?/i);
  if (!match) throw new Error(`Could not parse captcha placeholder: ${placeholder}`);

  const a = Number(match[1]);
  const b = Number(match[2]);
  await captcha.fill(String(a + b));
}

test.describe("Registration is wired to DB", () => {
  test("register via UI creates a User row", async ({ page }) => {
    test.setTimeout(150_000);

    const email = uniqueEmail();
    const screenname = uniqueScreenname();

    try {
      await page.goto(`${BASE_URL}/register?ref=1`);

      await page.getByPlaceholder("First Name").fill("QA");
      await page.getByPlaceholder("Last Name").fill("Register");
      await page.getByPlaceholder("Screen Name").fill(screenname);

      await page.locator('select[name="gender"]').selectOption("male");

      await page.getByPlaceholder("Email").fill(email);

      const password = "Passw0rd!";
      await page.locator('input[name="password"]').fill(password);
      await page.locator('input[name="confirmPassword"]').fill(password);

      await solveCaptcha(page);

      await page.getByRole("checkbox", { name: /terms and conditions/i }).check();
      await page.getByRole("button", { name: /^register$/i }).click();

      await page.waitForURL((url) => url.pathname === "/login", { timeout: 30_000 });

      await expect
        .poll(
          async () => {
            const user = await getUserByEmail(email);
            return user
              ? { exists: true, email: user.email, name: user.name, hasPasswordHash: Boolean(user.passwordHash) }
              : { exists: false };
          },
          { timeout: 30_000, message: "User row should be created after registration" },
        )
        .toEqual({ exists: true, email, name: screenname, hasPasswordHash: true });
    } finally {
      // Keep DB tidy (best-effort)
      await deleteUserByEmail(email);
    }
  });
});
