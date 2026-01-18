import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ReferralRow = {
  userId: number;
  sponsorId: number | null;
};

type ParsedDump = {
  legacyEmails: Map<number, string>;
  referrals: ReferralRow[];
};

const ROOT_LEGACY_ID = 1;

type ParsedUsers = {
  legacyToUser: Map<string, { id: string; email: string | null; legacyId: string | null; sponsorId: string | null }>;
  emailToUser: Map<string, { id: string; email: string | null; legacyId: string | null; sponsorId: string | null }>;
};

function parseValuesTuple(raw: string): string[] {
  const content = raw.trim().replace(/^[\(]/, "").replace(/[\),;]+$/, "");
  const values: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : "";
    if (ch === "'" && prev !== "\\") {
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.length > 0) {
    values.push(current.trim());
  }
  return values;
}

function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.toUpperCase() === "NULL") return undefined;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseLegacyDump(filePath: string): ParsedDump {
  const sql = fs.readFileSync(filePath, "utf8");
  const lines = sql.split(/\r?\n/);

  const legacyEmails = new Map<number, string>();
  const referrals: ReferralRow[] = [];

  let inUsers = false;
  let inReferrals = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("INSERT INTO `users`")) {
      inUsers = true;
      inReferrals = false;
      continue;
    }
    if (trimmed.startsWith("INSERT INTO `referrals`")) {
      inReferrals = true;
      inUsers = false;
      continue;
    }

    if (inUsers) {
      if (!trimmed.startsWith("(")) continue;
      const tokens = parseValuesTuple(trimmed);
      const legacyIdRaw = tokens[0];
      const emailRaw = tokens[14];
      const legacyId = Number(legacyIdRaw);
      const email = stripQuotes(emailRaw);
      if (!Number.isNaN(legacyId) && email) {
        legacyEmails.set(legacyId, email.toLowerCase());
      }
      continue;
    }

    if (inReferrals) {
      if (!trimmed.startsWith("(")) continue;
      const tokens = parseValuesTuple(trimmed);
      const legacyUserId = Number(tokens[1]);
      const legacySponsorId = tokens[2] ? Number(tokens[2]) : NaN;
      const sponsorId = Number.isNaN(legacySponsorId)
        ? null
        : legacySponsorId === 0
        ? ROOT_LEGACY_ID
        : legacySponsorId;
      if (!Number.isNaN(legacyUserId)) {
        referrals.push({ userId: legacyUserId, sponsorId });
      }
      continue;
    }
  }

  return { legacyEmails, referrals };
}

async function loadUserMaps(): Promise<ParsedUsers> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, legacyId: true, sponsorId: true },
  });

  const legacyToUser = new Map<string, { id: string; email: string | null; legacyId: string | null; sponsorId: string | null }>();
  const emailToUser = new Map<string, { id: string; email: string | null; legacyId: string | null; sponsorId: string | null }>();

  for (const u of users) {
    if (u.legacyId) {
      legacyToUser.set(u.legacyId, u);
    }
    if (u.email) {
      emailToUser.set(u.email.toLowerCase(), u);
    }
  }

  return { legacyToUser, emailToUser };
}

function resolveUser(
  legacyId: number,
  legacyEmails: Map<number, string>,
  maps: ParsedUsers
): { id: string; email: string | null; legacyId: string | null; sponsorId: string | null } | null {
  const legacyKey = legacyId.toString();
  const fromLegacy = maps.legacyToUser.get(legacyKey);
  if (fromLegacy) return fromLegacy;

  const email = legacyEmails.get(legacyId)?.toLowerCase();
  if (email) {
    const fromEmail = maps.emailToUser.get(email);
    if (fromEmail) return fromEmail;
  }

  return null;
}

async function main() {
  const dumpPath = path.resolve(process.cwd(), "sql_dump/beepagro_beepagro.sql");
  console.log(`📄 Reading legacy dump from ${dumpPath}`);

  const { legacyEmails, referrals } = parseLegacyDump(dumpPath);
  console.log(`Parsed ${legacyEmails.size} legacy user emails and ${referrals.length} referral rows`);

  const maps = await loadUserMaps();

  const rootUser = resolveUser(ROOT_LEGACY_ID, legacyEmails, maps);
  if (!rootUser) {
    throw new Error(`Root user with legacy id ${ROOT_LEGACY_ID} (quicksave01@gmail.com) not found in current DB`);
  }

  let updated = 0;
  let skippedMissingUser = 0;
  let unchanged = 0;
  let fallbackToRootForMissingSponsor = 0;
  let fallbackToRootForSelf = 0;
  const missingReferredIds = new Set<number>();

  for (const ref of referrals) {
    const referredUser = resolveUser(ref.userId, legacyEmails, maps);
    if (!referredUser) {
      skippedMissingUser++;
      console.warn(`⚠️ User not found for legacy user_id=${ref.userId}`);
      missingReferredIds.add(ref.userId);
      continue;
    }

    let sponsorUser = ref.sponsorId === null ? rootUser : resolveUser(ref.sponsorId, legacyEmails, maps);
    if (!sponsorUser) {
      sponsorUser = rootUser;
      fallbackToRootForMissingSponsor++;
      console.warn(`⚠️ Sponsor not found for legacy referred_by=${ref.sponsorId} (user_id=${ref.userId}); defaulting to root`);
    } else if (ref.sponsorId === null) {
      fallbackToRootForMissingSponsor++;
      console.warn(`⚠️ Sponsor missing for legacy user_id=${ref.userId}; defaulting to root`);
    }

    if (referredUser.id === sponsorUser.id) {
      if (referredUser.id === rootUser.id) {
        unchanged++;
        continue;
      }
      sponsorUser = rootUser;
      fallbackToRootForSelf++;
      console.warn(`⚠️ Self-sponsor detected for user_id=${ref.userId}; defaulting sponsor to root`);
    }

    if (referredUser.sponsorId === sponsorUser.id) {
      unchanged++;
      continue;
    }

    await prisma.user.update({
      where: { id: referredUser.id },
      data: { sponsorId: sponsorUser.id },
    });

    updated++;
    console.log(`✅ Linked user ${referredUser.email} (legacy ${ref.userId}) -> sponsor ${sponsorUser.email} (legacy ${ref.sponsorId})`);
  }

  console.log("\nSummary:");
  console.log(`Updated sponsorId: ${updated}`);
  console.log(`Unchanged (already correct): ${unchanged}`);
  console.log(`Missing referred user: ${skippedMissingUser}`);
  console.log(`Defaulted to root for missing sponsor: ${fallbackToRootForMissingSponsor}`);
  console.log(`Defaulted to root for self-sponsor: ${fallbackToRootForSelf}`);

  if (missingReferredIds.size > 0) {
    const outPath = path.resolve(process.cwd(), "missing_referred_users.csv");
    const csv = ["legacy_user_id", ...Array.from(missingReferredIds).map((id) => id.toString())].join("\n");
    fs.writeFileSync(outPath, csv, "utf8");
    console.log(`Missing referred users list written to ${outPath}`);
  }
}

main()
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
