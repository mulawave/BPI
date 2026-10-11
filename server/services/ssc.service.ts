import { randomInt } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

const SSC_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** A member's Social Security Code: XXX-XXXX-XXX, cryptographically random. */
export function generateSscCode(): string {
  const segment = (length: number) =>
    Array.from({ length }, () => SSC_ALPHABET[randomInt(SSC_ALPHABET.length)]).join("");
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

export function normalizeSsc(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Returns the member's SSC, assigning a new unique one if they don't have
 * one yet. The SSC is also the Healthcare Card number — there is only one.
 */
export async function ensureMemberSsc(db: Db, userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { ssc: true } });
  if (!user) throw new Error("User not found.");
  if (user.ssc) return user.ssc;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateSscCode();
    const taken = await db.user.findFirst({ where: { ssc: candidate }, select: { id: true } });
    if (taken) continue;
    // Only assign if the member still has none, so a concurrent assignment is never overwritten.
    const assigned = await db.user.updateMany({ where: { id: userId, ssc: null }, data: { ssc: candidate } });
    if (assigned.count === 1) return candidate;
    const current = await db.user.findUnique({ where: { id: userId }, select: { ssc: true } });
    if (current?.ssc) return current.ssc;
  }
  throw new Error("Failed to generate a unique SSC code after multiple attempts.");
}
