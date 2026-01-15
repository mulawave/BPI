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

test.describe("Membership upgrade is wired to DB", () => {
  test("mock upgrade updates membership fields, decrements wallet (if wallet payment is used), and creates upgrade tx rows", async ({ page }) => {
    test.setTimeout(180_000);

    // Pick two packages where target total > current total.
    const pkgs = await prisma.membershipPackage.findMany({
      orderBy: { price: "asc" },
      select: { id: true, name: true, price: true, vat: true },
    });
    if (pkgs.length < 2) throw new Error("Need at least 2 membership packages to test upgrade");

    let current = pkgs[0]!;
    let target = pkgs[pkgs.length - 1]!;

    // Ensure strictly higher total cost.
    const total = (p: typeof current) => (p.price ?? 0) + (p.vat ?? 0);
    const currentTotal = total(current);
    const targetTotal = total(target);

    if (targetTotal <= currentTotal) {
      // Fallback: find any pair with increasing total
      const sorted = [...pkgs].sort((a, b) => total(a) - total(b));
      const found = sorted.find((p, idx) => idx > 0 && total(p) > total(sorted[0]!));
      if (!found) throw new Error("No upgrade path found (no package is more expensive than another)");
      current = sorted[0]!;
      target = found;
    }

    const upgradeCost = total(target) - total(current);
    const vatDifferential = (target.vat ?? 0) - (current.vat ?? 0);

    // Prep user: active membership = current, wallet enough to pay upgrade.
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

    // Upgrade page uses query param ?from=<current>
    await page.goto(`${BASE_URL}/membership/upgrade/${target.id}?from=${current.id}`);
    await expect(page.getByRole("heading", { name: /upgrade your membership/i })).toBeVisible({ timeout: 30_000 });

    // This page currently uses mock payment only (no wallet option in UI).
    await page.getByRole("button", { name: new RegExp(`pay\\s+.*\\s+&\\s+upgrade now`, "i") }).click();

    // Redirects to dashboard on success.
    await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 60_000 });

    // ---- DB assertions ----
    await expect
      .poll(async () => {
        const user = await prisma.user.findUnique({
          where: { email: USER_EMAIL },
          select: {
            activeMembershipPackageId: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
            wallet: true,
          },
        });
        if (!user) return null;

        return {
          activeMembershipPackageId: user.activeMembershipPackageId,
          hasActivatedAt: Boolean(user.membershipActivatedAt),
          hasExpiresAt: Boolean(user.membershipExpiresAt),
          wallet: user.wallet ?? 0,
        };
      })
      .toEqual({
        activeMembershipPackageId: target.id,
        hasActivatedAt: true,
        hasExpiresAt: true,
        // UI uses mock payment -> wallet should not change (server only decrements for paymentMethod==='wallet').
        wallet: walletBefore,
      });

    await expect
      .poll(
        async () => {
          const txs = await getRecentTransactionsForUser({
            userId,
            since,
            types: ["membership_upgrade", "VAT", "MEMBERSHIP_UPGRADE"],
          });

          // processUpgradePayment always creates lowercase "membership_upgrade" tx
          const upgradeTx = txs.find(
            (t) => t.transactionType === "membership_upgrade" && t.amount === -upgradeCost && t.status === "completed",
          );

          // Wallet-based upgrade creates "MEMBERSHIP_UPGRADE" (not expected via current UI)
          const walletUpgradeTx = txs.find(
            (t) => t.transactionType === "MEMBERSHIP_UPGRADE" && t.amount === -upgradeCost && t.status === "completed",
          );

          const vatTx = vatDifferential > 0
            ? txs.find((t) => t.transactionType === "VAT" && t.amount === vatDifferential && t.status === "completed")
            : { ok: true };

          return {
            hasUpgrade: Boolean(upgradeTx),
            hasVat: vatDifferential > 0 ? Boolean(vatTx) : true,
            hasWalletUpgrade: Boolean(walletUpgradeTx),
          };
        },
        { timeout: 30_000 },
      )
      .toEqual({ hasUpgrade: true, hasVat: true, hasWalletUpgrade: false });
  });
});
