import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.CRED_EMAIL || 'test-nonmember@example.com';
const PASSWORD = process.env.CRED_PASSWORD || 'Passw0rd!test';

test('non-member is redirected to /membership after login', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor();
  await emailInput.fill(EMAIL);
  const passwordInput = page.locator('input[type="password"], input[placeholder="Password"]').first();
  await passwordInput.waitFor();
  await passwordInput.fill(PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForURL('**/membership');
  expect(page.url()).toMatch(/\/membership$/);
});
