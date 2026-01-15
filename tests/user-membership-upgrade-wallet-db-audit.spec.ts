import { test, expect, type Page } from "@playwright/test";
import {
  prisma,
  ensureUserReadyForMembershipUpgrade,
  getRecentTransactionsForUser,
  getUserIdByEmail,
  getUserWalletByEmail,
} from "./helpers/db";
import { dismissEmailVerificationIfPresent } from "./helpers/ui";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const USER_EMAIL = process.env.SMOKE_USER2_EMAIL || "qa.user2@example.com";
const USER_PASSWORD = process.env.SMOKE_USER2_PASSWORD || "Passw0rd!";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/email/i).fill(USER_EMAIL);
  await page.getByPlaceholder(/password/i).fill(USER_PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 30_000 });
}

test.describe("Membership upgrade (wallet) is wired to DB", () => {
  test("wallet upgrade via activate page decrements wallet and writes upgrade tx rows", async ({ page }) => {
    test.setTimeout(180_000);

    // Pick two packages where target total > current total.
    const pkgs = await prisma.membershipPackage.findMany({
      orderBy: { price: "asc" },
      select: { id: true, name: true, price: true, vat: true },
    });
    if (pkgs.length < 2) throw new Error("Need at least 2 membership packages to test upgrade");

    const total = (p: (typeof pkgs)[number]) => (p.price ?? 0) + (p.vat ?? 0);

    const sorted = [...pkgs].sort((a, b) => total(a) - total(b));
    const current = sorted[0]!;
    const target = sorted[sorted.length - 1]!;

    const upgradeCost = total(target) - total(current);
    if (upgradeCost <= 0) throw new Error("No upgrade path found (target total is not higher than current total)");

    const vatDifferential = (target.vat ?? 0) - (current.vat ?? 0);

    await ensureUserReadyForMembershipUpgrade({
      email: USER_EMAIL,
      currentPackageId: current.id,
      walletMinimum: upgradeCost + 10_000,
    });

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);
    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    // Use the activation page upgrade flow, since it supports wallet payment.
    await page.goto(`${BASE_URL}/membership/activate/${target.id}?upgrade=true&from=${current.id}`);
    await expect(page.getByRole("heading", { name: /select payment method/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Wallet Balance" }).click();
    await page.getByRole("button", { name: /^complete payment/i }).click();

    await expect(page.getByRole("heading", { name: /upgrade successful!/i })).toBeVisible({ timeout: 60_000 });
    await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 60_000 });

    // ---- DB assertions ----
    await expect
      .poll(async () => getUserWalletByEmail(USER_EMAIL), {
        timeout: 30_000,
        message: "Wallet should decrement by the upgrade differential",
      })
      .toBe(walletBefore - upgradeCost);

    await expect
      .poll(async () => {
        const user = await prisma.user.findUnique({
          where: { email: USER_EMAIL },
          select: {
            activeMembershipPackageId: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
          },
        });

        if (!user) return null;

        return {
          activeMembershipPackageId: user.activeMembershipPackageId,
          hasActivatedAt: Boolean(user.membershipActivatedAt),
          hasExpiresAt: Boolean(user.membershipExpiresAt),
          expiresAfterActivated:
            Boolean(user.membershipActivatedAt && user.membershipExpiresAt) &&
            (user.membershipExpiresAt as Date).getTime() > (user.membershipActivatedAt as Date).getTime(),
        };
      })
      .toEqual({
        activeMembershipPackageId: target.id,
        hasActivatedAt: true,
        hasExpiresAt: true,
        expiresAfterActivated: true,
      });

    await expect
      .poll(
        async () => {
          const txs = await getRecentTransactionsForUser({
            userId,
            since,
            types: ["MEMBERSHIP_UPGRADE", "membership_upgrade", "VAT"],
          });

          const walletUpgradeTx = txs.find(
            (t) => t.transactionType === "MEMBERSHIP_UPGRADE" && t.amount === -upgradeCost && t.status === "completed",
          );

          const upgradeTx = txs.find(
            (t) => t.transactionType === "membership_upgrade" && t.amount === -upgradeCost && t.status === "completed",
          );

          const vatTx = vatDifferential > 0
            ? txs.find((t) => t.transactionType === "VAT" && t.amount === vatDifferential && t.status === "completed")
            : { ok: true };

          return {
            hasWalletUpgrade: Boolean(walletUpgradeTx),
            hasUpgrade: Boolean(upgradeTx),
            hasVat: vatDifferential > 0 ? Boolean(vatTx) : true,
          };
        },
        { timeout: 30_000, message: "Expected upgrade transactions should be created" },
      )
      .toEqual({ hasWalletUpgrade: true, hasUpgrade: true, hasVat: true });
  });
});
