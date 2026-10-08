/**
 * Default beneficiaries.
 *
 * Corporate decision (Q28, 29/09/2026; follow-up Q10, 06/10/2026): when a CSP
 * sponsor share has no sponsor to pay, and when a member's referral
 * commissions redirect away from them after 7 days of membership expiry
 * (follow-up Q8a), the money goes to these named accounts instead — split
 * equally. Editable only by a super admin.
 */

import { randomUUID } from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_BENEFICIARY_SETTINGS_KEY = "default_beneficiary_emails";

/** Seed values (corporate decision, follow-up Q10, 07/10/2026): Richard and Gilead, split equally. */
export const DEFAULT_BENEFICIARY_EMAILS = ["richardobroh@gmail.com", "quicksave01@gmail.com"];

export async function loadDefaultBeneficiaryEmails(db: TxClient): Promise<string[]> {
  const row = await db.adminSettings.findUnique({ where: { settingKey: DEFAULT_BENEFICIARY_SETTINGS_KEY } });
  if (!row?.settingValue) return DEFAULT_BENEFICIARY_EMAILS;
  try {
    const parsed = JSON.parse(row.settingValue);
    if (Array.isArray(parsed) && parsed.every((e) => typeof e === "string") && parsed.length > 0) return parsed;
  } catch {
    // fall through to default
  }
  return DEFAULT_BENEFICIARY_EMAILS;
}

/** Only a super admin may change the default beneficiary list. */
export async function saveDefaultBeneficiaryEmails(
  db: TxClient,
  input: { emails: string[]; adminUserId: string; adminRole: string | null | undefined },
): Promise<void> {
  const role = (input.adminRole ?? "").toLowerCase();
  if (role !== "superadmin" && role !== "super_admin") {
    throw new Error("Only a super admin can change the default beneficiary list.");
  }
  if (input.emails.length === 0) throw new Error("At least one default beneficiary is required.");
  await db.adminSettings.upsert({
    where: { settingKey: DEFAULT_BENEFICIARY_SETTINGS_KEY },
    update: { settingValue: JSON.stringify(input.emails), updatedAt: new Date() },
    create: { id: randomUUID(), settingKey: DEFAULT_BENEFICIARY_SETTINGS_KEY, settingValue: JSON.stringify(input.emails), updatedAt: new Date() },
  });
}

/** Resolves the configured emails to live user accounts, equal split among whichever resolve. */
export async function resolveDefaultBeneficiaries(db: TxClient): Promise<Array<{ userId: string; sharePercent: number }>> {
  const emails = await loadDefaultBeneficiaryEmails(db);
  const users = await db.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  if (users.length === 0) return [];
  const sharePercent = 100 / users.length;
  return users.map((u) => ({ userId: u.id, sharePercent }));
}

/**
 * Splits an amount equally among the resolved default beneficiaries and
 * credits each one's Main Wallet. Returns how much, if any, could not be
 * credited (no beneficiary account could be resolved).
 */
export async function creditDefaultBeneficiaries(
  tx: TxClient,
  input: { amount: number; description: string; transactionType: string; reference: string },
): Promise<{ creditedTotal: number; perBeneficiary: Array<{ userId: string; amount: number }> }> {
  if (!(input.amount > 0)) return { creditedTotal: 0, perBeneficiary: [] };
  const beneficiaries = await resolveDefaultBeneficiaries(tx);
  if (beneficiaries.length === 0) return { creditedTotal: 0, perBeneficiary: [] };

  const shares = beneficiaries.map((b, i) => {
    const raw = (input.amount * b.sharePercent) / 100;
    // Last beneficiary absorbs the rounding remainder so the total matches exactly.
    return i === beneficiaries.length - 1
      ? input.amount - beneficiaries.slice(0, -1).reduce((sum, _, j) => sum + Math.floor((input.amount * beneficiaries[j].sharePercent) / 100), 0)
      : Math.floor(raw);
  });

  const perBeneficiary: Array<{ userId: string; amount: number }> = [];
  for (let i = 0; i < beneficiaries.length; i++) {
    const amount = shares[i];
    if (amount <= 0) continue;
    await tx.user.update({ where: { id: beneficiaries[i].userId }, data: { wallet: { increment: amount } } });
    await tx.transaction.create({
      data: {
        id: randomUUID(),
        userId: beneficiaries[i].userId,
        transactionType: input.transactionType,
        amount,
        description: input.description,
        status: "completed",
        reference: `${input.reference}-BEN${i + 1}`,
        walletType: "main",
      },
    });
    perBeneficiary.push({ userId: beneficiaries[i].userId, amount });
  }

  return { creditedTotal: perBeneficiary.reduce((s, b) => s + b.amount, 0), perBeneficiary };
}
