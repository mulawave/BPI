import { test, expect } from "@playwright/test";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import {
  prisma,
  deleteUserByEmail,
  getLatestPasswordResetForUserSince,
  getUserByEmail,
  getUserPasswordHashByEmail,
} from "./helpers/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function uniqueEmail() {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1_000_000);
  return `qa.reset.${ts}.${rnd}@example.com`;
}

test.describe("Forgot password + reset password are wired to DB", () => {
  test("request reset creates PasswordReset row; set-new-password marks token used and updates passwordHash", async ({ page }) => {
    test.setTimeout(180_000);

    const email = uniqueEmail();
    const initialPassword = "StartPassw0rd!";
    const newPassword = "NewPassw0rd!";

    const passwordHashBefore = await hash(initialPassword, 12);

    // Create a standalone user for this test.
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        name: `qa_reset_${Date.now()}`,
        firstname: "QA",
        lastname: "Reset",
        gender: "male",
        passwordHash: passwordHashBefore,
        role: "user",
        inviteCode: `QA${Math.floor(Math.random() * 1_000_000_000)}`,
        referralLink: `https://beepagro.com/register?ref=QA${Math.floor(Math.random() * 1_000_000_000)}`,
      },
    });

    try {
      const user = await getUserByEmail(email);
      if (!user) throw new Error("Failed to create test user");

      const since = new Date();

      // Request password reset
      await page.goto(`${BASE_URL}/forgot-password`);
      await page.getByPlaceholder(/email address/i).fill(email);
      await page.getByRole("button", { name: /send reset link/i }).click();
      await expect(page.getByText(new RegExp(`If an account exists for\\s+${email}`, "i"))).toBeVisible({ timeout: 30_000 });

      await expect
        .poll(
          async () => Boolean(await getLatestPasswordResetForUserSince({ userId: user.id, since })),
          { timeout: 30_000, message: "PasswordReset row should be created after forgot-password" },
        )
        .toBe(true);

      const resetRow = await getLatestPasswordResetForUserSince({ userId: user.id, since });
      if (!resetRow) throw new Error("PasswordReset row missing after polling");

      // Set new password via UI
      await page.goto(`${BASE_URL}/set-new-password?token=${encodeURIComponent(resetRow.token)}`);
      await expect(page.getByRole("heading", { name: /set new password/i })).toBeVisible({ timeout: 30_000 });

      await page.getByPlaceholder(/^new password$/i).fill(newPassword);
      await page.getByPlaceholder(/confirm new password/i).fill(newPassword);
      await page.getByRole("button", { name: /set password/i }).click();

      await expect(page.getByText(/password has been reset successfully/i)).toBeVisible({ timeout: 30_000 });

      // DB assertions
      await expect
        .poll(async () => getUserPasswordHashByEmail(email), {
          timeout: 30_000,
          message: "User passwordHash should change after reset",
        })
        .not.toBe(passwordHashBefore);

      await expect
        .poll(
          async () => {
            const row = await prisma.passwordReset.findUnique({
              where: { token: resetRow.token },
              select: { used: true },
            });
            return row?.used ?? false;
          },
          { timeout: 30_000, message: "PasswordReset token should be marked used" },
        )
        .toBe(true);
    } finally {
      await deleteUserByEmail(email);
    }
  });
});
