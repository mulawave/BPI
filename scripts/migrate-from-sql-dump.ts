/* 
  Usage:
  npx tsx scripts/migrate-from-sql-dump.ts /absolute/path/to/beepagro.sql
*/

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

if (process.argv.length < 3) {
  console.error("❌ SQL dump path not provided");
  process.exit(1);
}

const SQL_DUMP_PATH = path.resolve(process.argv[2]);

if (!fs.existsSync(SQL_DUMP_PATH)) {
  console.error("❌ SQL dump file not found:", SQL_DUMP_PATH);
  process.exit(1);
}

const sqlDump = fs.readFileSync(SQL_DUMP_PATH, "utf8");

/**
 * VERY IMPORTANT:
 * This script assumes the SQL dump uses standard INSERT INTO syntax
 * for `users` and `referrals`.
 */

/* ------------------ PARSERS ------------------ */

function extractTableInserts(table: string): string[] {
  const regex = new RegExp(`INSERT INTO\\s+\`${table}\`[\\s\\S]*?;`, "gi");
  return sqlDump.match(regex) || [];
}

const isUniqueConstraintError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function cleanString(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^'+|'+$/g, "");
  return unquoted.length > 0 ? unquoted : undefined;
}

function toDate(value: string | null): Date | undefined {
  const cleaned = cleanString(value || "");
  if (!cleaned) return undefined;
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime()) || !Number.isFinite(date.getTime())) return undefined;
  const year = date.getUTCFullYear();
  if (year > 9999 || year < 1000) return undefined;
  return date;
}

function parseValues(insert: string): any[] {
  const valuesPart = insert.substring(insert.indexOf("VALUES") + 6);
  const rows: string[] = [];
  let buffer = "";
  let depth = 0;

  for (const char of valuesPart) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    buffer += char;

    if (depth === 0 && buffer.trim().startsWith("(")) {
      rows.push(buffer.replace(/^[,(]+|[);]+$/g, ""));
      buffer = "";
    }
  }

  return rows.map((row) =>
    row
      .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
      .map((v) => (v === "NULL" ? null : v.replace(/^'|'$/g, "").replace(/\\'/g, "'")))
  );
}

/* ------------------ MAIN ------------------ */

async function main() {
  console.log("📥 Reading SQL dump:", SQL_DUMP_PATH);

  const userInserts = extractTableInserts("users");
  const referralInserts = extractTableInserts("referrals");

  console.log(`👤 Found ${userInserts.length} user insert blocks`);
  console.log(`🔗 Found ${referralInserts.length} referral insert blocks`);

  const prismaUserMap = new Map<string, string>();

  /* -------- USERS -------- */

  for (const insert of userInserts) {
    const rows = parseValues(insert);

    for (const r of rows) {
      const [id, firstname, lastname, email, username, password, created_at, updated_at, last_login] = r;

      const cleanedEmail = cleanString(email);
      const cleanedUsername = cleanString(username);
      const cleanedFirst = cleanString(firstname);
      const cleanedLast = cleanString(lastname);

      const createdAt = toDate(created_at);
      const updatedAt = toDate(updated_at);
      const lastLogin = toDate(last_login);

      const sanitizedIdSource = cleanString(id)?.replace(/[^a-zA-Z0-9_-]/g, "");
      const generatedId = sanitizedIdSource && sanitizedIdSource.length > 0 ? sanitizedIdSource : randomUUID();

      const hashedPassword = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : undefined;

      const where = cleanedEmail ? { email: cleanedEmail } : cleanedUsername ? { username: cleanedUsername } : undefined;
      if (!where) {
        console.warn("⚠️ Skipping row with no email/username", r);
        continue;
      }

      const updateData: Record<string, unknown> = {
        firstname: cleanedFirst,
        lastname: cleanedLast,
        username: cleanedUsername,
        passwordHash: hashedPassword,
        createdAt,
        updatedAt,
      };

      const createData: Record<string, unknown> = {
        id: generatedId,
        email: cleanedEmail,
        username: cleanedUsername,
        firstname: cleanedFirst,
        lastname: cleanedLast,
        passwordHash: hashedPassword,
        createdAt,
        updatedAt,
      };

      if (lastLogin) {
        updateData.lastLogin = lastLogin;
        createData.lastLogin = lastLogin;
      }

      let user;
      try {
        user = await prisma.user.upsert({
          where,
          update: updateData,
          create: createData,
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;

        let fallback = null;
        if (cleanedEmail) {
          fallback = await prisma.user.findUnique({ where: { email: cleanedEmail } });
        }
        if (!fallback && cleanedUsername) {
          fallback = await prisma.user.findUnique({ where: { username: cleanedUsername } });
        }

        if (fallback) {
          user = await prisma.user.update({ where: { id: fallback.id }, data: updateData });
        } else {
          const uniqueUsername = cleanedUsername ? `${cleanedUsername}-${Math.random().toString(36).slice(2, 6)}` : undefined;
          if (uniqueUsername) {
            updateData.username = uniqueUsername;
            createData.username = uniqueUsername;
          }

          const retryWhere = cleanedEmail ? { email: cleanedEmail } : uniqueUsername ? { username: uniqueUsername } : where;
          user = await prisma.user.upsert({ where: retryWhere, update: updateData, create: createData });
        }
      }

      if (cleanedEmail) prismaUserMap.set(cleanedEmail, user.id);
      if (cleanedUsername) prismaUserMap.set(cleanedUsername, user.id);
    }
  }

  /* -------- REFERRALS -------- */

  for (const insert of referralInserts) {
    const rows = parseValues(insert);

    for (const r of rows) {
      const [id, referrerEmail, referredEmail] = r;

      const referrerId = prismaUserMap.get(cleanString(referrerEmail) || "");
      const referredId = prismaUserMap.get(cleanString(referredEmail) || "");

      if (!referrerId || !referredId) continue;

      await prisma.user.update({
        where: { id: referredId },
        data: { referredById: referrerId },
      });
    }
  }

  console.log("✅ Migration completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
