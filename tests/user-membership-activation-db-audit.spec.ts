import { test, expect, type Page } from "@playwright/test";
import {
  prisma,
  getCheapestMembershipPackage,
  getRecentTransactionsForUser,
  getUserIdByEmail,
  getUserWalletByEmail,
  ensureUserReadyForMembershipActivation,
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

test.describe("Membership activation is wired to DB", () => {
  test("wallet activation updates membership fields, decrements wallet, and creates tx rows", async ({ page }) => {
    test.setTimeout(150_000);

    const pkg = await getCheapestMembershipPackage();
    const totalCost = (pkg.price ?? 0) + (pkg.vat ?? 0);

    // Ensure user is not already active and has enough wallet for activation.
    await ensureUserReadyForMembershipActivation({
      email: USER_EMAIL,
      walletMinimum: totalCost + 10_000,
    });

    const since = new Date();
    const userId = await getUserIdByEmail(USER_EMAIL);
    const walletBefore = await getUserWalletByEmail(USER_EMAIL);

    await login(page);
    await dismissEmailVerificationIfPresent(page);

    await page.goto(`${BASE_URL}/membership/activate/${pkg.id}`);
    await expect(page.getByRole("heading", { name: /select payment method/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Wallet Balance" }).click();
    await page.getByRole("button", { name: /^complete payment/i }).click();

    await expect(
      page.getByRole("heading", { name: /membership activated!/i }),
    ).toBeVisible({ timeout: 60_000 });

    // The page auto-redirects after success.
    await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 60_000 });

    // ---- DB assertions ----
    await expect
      .poll(
        async () => {
          const user = await prisma.user.findUnique({
            where: { email: USER_EMAIL },
            select: {
              activeMembershipPackageId: true,
              membershipActivatedAt: true,
              membershipExpiresAt: true,
              activated: true,
              wallet: true,
            },
          });

          if (!user) return null;

          return {
            activeMembershipPackageId: user.activeMembershipPackageId,
            activated: user.activated,
            hasActivatedAt: Boolean(user.membershipActivatedAt),
            hasExpiresAt: Boolean(user.membershipExpiresAt),
            expiresAfterActivated:
              Boolean(user.membershipActivatedAt && user.membershipExpiresAt) &&
              (user.membershipExpiresAt as Date).getTime() > (user.membershipActivatedAt as Date).getTime(),
            wallet: user.wallet ?? 0,
          };
        },
        { timeout: 30_000, message: "User membership fields should be set after activation" },
      )
      .toEqual({
        activeMembershipPackageId: pkg.id,
        activated: true,
        hasActivatedAt: true,
        hasExpiresAt: true,
        expiresAfterActivated: true,
        wallet: walletBefore - totalCost,
      });

    await expect
      .poll(
        async () => {
          const txs = await getRecentTransactionsForUser({
            userId,
            since,
            types: ["MEMBERSHIP_PAYMENT", "MEMBERSHIP_ACTIVATION", "VAT"],
          });

          const payment = txs.find(
            (t) => t.transactionType === "MEMBERSHIP_PAYMENT" && t.amount === -totalCost && t.status === "completed",
          );
          const activation = txs.find(
            (t) => t.transactionType === "MEMBERSHIP_ACTIVATION" && t.amount === -totalCost && t.status === "completed",
          );
          const vat = pkg.vat
            ? txs.find((t) => t.transactionType === "VAT" && t.amount === pkg.vat && t.status === "completed")
            : { ok: true };

          return {
            hasMembershipPayment: Boolean(payment),
            hasMembershipActivation: Boolean(activation),
            hasVat: pkg.vat ? Boolean(vat) : true,
          };
        },
        { timeout: 30_000, message: "Expected membership activation transactions should be created" },
      )
      .toEqual({ hasMembershipPayment: true, hasMembershipActivation: true, hasVat: true });
  });
});
