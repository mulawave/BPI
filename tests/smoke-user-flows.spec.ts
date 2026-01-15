import { test, expect, type Page } from '@playwright/test';
import { ensureUserReadyForDashboard } from './helpers/db';
import { dismissEmailVerificationIfPresent } from './helpers/ui';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || 'qa.user1@example.com';
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || 'Passw0rd!';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/email/i).fill(USER_EMAIL);
  await page.getByPlaceholder(/password/i).fill(USER_PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/i);
}

test.describe('User smoke: login → dashboard → deposit/withdraw → membership → profile/referral', () => {
  test('happy path surfaces render and basic actions succeed', async ({ page }) => {
    test.setTimeout(120_000);

    await ensureUserReadyForDashboard(USER_EMAIL);

    // Login
    await login(page);

    // Some accounts show a verification modal that blocks interactions
    await dismissEmailVerificationIfPresent(page);

    // Dashboard loads (cold-start can be slow)
    await expect(page.getByText(/member dashboard/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^deposit$/i }).first()).toBeVisible({ timeout: 60_000 });

    // Deposit modal (happy path)
    const depositButton = page.getByRole('button', { name: /^deposit$/i }).first();
    if (await depositButton.isVisible()) {
      await depositButton.click();
      await page.getByPlaceholder('0.00').fill('1000');
      await page.getByRole('button', { name: /continue to payment gateway/i }).click();
      await page.getByRole('button', { name: /mock payment/i }).click();
      await page.getByRole('button', { name: /continue to summary/i }).click();
      await page.getByRole('button', { name: /confirm & pay/i }).click();
      await expect(page.getByRole('heading', { name: /deposit funds/i })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('button', { name: /^done$/i })).toBeVisible({ timeout: 30_000 });
      await page.getByRole('button', { name: /^done$/i }).click();
    }

    // Withdrawal modal (validation then submit)
    const withdrawButton = page.getByRole('button', { name: /withdraw/i }).first();
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click();
      await page.getByRole('button', { name: /^continue$/i }).click();
      await page.getByPlaceholder('0.00').fill('1');
      await page.getByPlaceholder(/e\.g\./i).fill('QA Test Bank');
      await page.getByPlaceholder(/0123456789/i).fill('1234567890');
      await page.getByPlaceholder(/full name as per bank/i).fill('QA USER ONE');
      await page.getByRole('button', { name: /continue to summary/i }).click();
      await page.getByRole('button', { name: /confirm withdrawal/i }).click();
      await expect(page.getByText(/withdrawal submitted!/i)).toBeVisible({ timeout: 30_000 });
      await page.getByRole('button', { name: /^done$/i }).click();
    }

    // Membership page renders (navigation-only)
    await page.goto(`${BASE_URL}/membership`);
    await expect(
      page.getByRole('heading', { name: /activate your membership|upgrade your membership/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Profile edit save (best-effort: change first name field if present)
    const profileLink = page.getByRole('link', { name: /profile|settings/i }).first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      const nameField = page.getByLabel(/name/i).first();
      if (await nameField.isVisible()) {
        await nameField.fill('QA User One');
        const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
        await saveBtn.click();
        await expect(page.getByText(/saved|updated/i)).toBeVisible({ timeout: 10_000 });
      }
    }

    // Referral display
    const referralSection = page.getByText(/referral/i).first();
    await expect(referralSection).toBeVisible({ timeout: 10_000 });
  });
});
