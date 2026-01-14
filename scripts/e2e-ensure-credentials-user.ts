/*
  Ensures a credentials-login user exists for HTTP E2E smoke tests.

  Usage:
    npx tsx scripts/e2e-ensure-credentials-user.ts
*/

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    const value = stripQuotes(line.slice(eq + 1));
    if (!key) continue;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const email = process.env.E2E_LOGIN_EMAIL || "uploadtest@example.com";
  const password = process.env.E2E_LOGIN_PASSWORD || "password123";

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();

    const existing = await prisma.user.findUnique({ where: { email } });
    const passwordHash = await hash(password, 10);

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          name: "E2E Upload Test User",
          role: "user",
          activated: true,
          verified: true,
          passwordHash,
        },
        select: { id: true, email: true },
      });
      console.log("E2E: created credentials user:", created.email);
    } else {
      // Ensure it can log in via credentials
      await prisma.user.update({ where: { email }, data: { passwordHash } });
      console.log("E2E: updated credentials password for:", email);
    }

    console.log("E2E: login with email:", email);
    console.log("E2E: password:", password);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("E2E ensure user failed:", err);
  process.exitCode = 1;
});
