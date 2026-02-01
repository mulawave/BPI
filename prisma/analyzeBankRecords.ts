import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const setDefaults = args.includes("--set-defaults");
const exportCsv = args.includes("--export") || !setDefaults; // default: export on analyze

const legacyDumpPath = path.join(__dirname, "..", "legacy_sql", "beepagro_beepagro.sql");
const exportPath = path.join(__dirname, "..", "logs", "user_bank_records.csv");

type LegacyBankRecord = {
  userId: number;
  bankCode: string;
  accountName: string;
  accountNumber: string;
  bvn: string;
};

function parseValue(value: string): string {
  if (value === undefined || value === null) return "";
  if (value === "NULL" || value === "null") return "";
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  return value;
}

function parseFields(valuesString: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];
    const nextChar = valuesString[i + 1];

    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      continue;
    } else if (char === quoteChar && inQuotes) {
      if (nextChar === quoteChar) {
        current += char;
        i++;
        continue;
      }
      inQuotes = false;
      quoteChar = "";
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) fields.push(current.trim());

  return fields;
}

function parseLegacyBankRecords(sql: string): LegacyBankRecord[] {
  const records: LegacyBankRecord[] = [];
  const insertRegex = /INSERT INTO `bank_records`.*?VALUES\s*(.+?);/gms;
  let match: RegExpExecArray | null;

  while ((match = insertRegex.exec(sql)) !== null) {
    const valuesString = match[1];
    const valuePattern = /\(([^)]+)\)/g;
    let vm: RegExpExecArray | null;
    while ((vm = valuePattern.exec(valuesString)) !== null) {
      const fields = parseFields(vm[1]);
      if (fields.length >= 6) {
        records.push({
          userId: Number(parseValue(fields[1])),
          bankCode: parseValue(fields[2]),
          accountName: parseValue(fields[3]),
          accountNumber: parseValue(fields[4]),
          bvn: parseValue(fields[5]),
        });
      }
    }
  }

  return records;
}

async function main() {
  console.log("🔎 Analyzing bank records (current + legacy)...\n");

  const sql = fs.readFileSync(legacyDumpPath, "utf-8");
  const legacyRecords = parseLegacyBankRecords(sql);

  // Current coverage
  const totalUsers = await prisma.user.count();
  const usersWithBanks = await prisma.user.count({ where: { bankRecords: { some: {} } } });
  const usersWithoutBanks = totalUsers - usersWithBanks;
  const usersWithBanksNoDefault = await prisma.user.count({
    where: {
      bankRecords: { some: {} },
      NOT: { bankRecords: { some: { isDefault: true } } },
    },
  });

  console.log({ totalUsers, usersWithBanks, usersWithoutBanks, usersWithBanksNoDefault });

  // Build legacy mapping for users without bank records
  const legacyUserIds = Array.from(new Set(legacyRecords.map((r) => r.userId.toString())));

  const usersMissing = await prisma.user.findMany({
    where: { bankRecords: { none: {} }, legacyId: { not: null } },
    select: { id: true, legacyId: true },
  });

  let matchable = 0;
  for (const u of usersMissing) {
    if (legacyUserIds.includes(u.legacyId!)) matchable++;
  }

  console.log({ usersMissingBankRecords: usersMissing.length, matchableFromLegacy: matchable });

  // Export current user bank records to CSV
  if (exportCsv) {
    console.log("\n📤 Exporting current user bank records to logs/user_bank_records.csv ...");
    const records = await prisma.userBankRecord.findMany({
      include: { bank: true, user: { select: { email: true, legacyId: true } } },
      orderBy: [{ userId: "asc" }, { isDefault: "desc" }, { createdAt: "asc" }],
    });

    const header = [
      "userId",
      "userEmail",
      "legacyId",
      "bankId",
      "bankName",
      "bankCode",
      "accountName",
      "accountNumber",
      "bvn",
      "isDefault",
      "createdAt",
    ];
    const lines = [header.join(",")];
    for (const r of records) {
      const row = [
        r.userId,
        r.user?.email ?? "",
        r.user?.legacyId ?? "",
        r.bankId ?? "",
        r.bank?.bankName ?? r.bankName ?? "",
        r.bank?.bankCode ?? "",
        r.accountName,
        r.accountNumber,
        r.bvn ?? "",
        r.isDefault ? "true" : "false",
        r.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
      lines.push(row);
    }

    fs.writeFileSync(exportPath, lines.join("\n"), "utf-8");
    console.log(`✅ Exported ${records.length} records to ${exportPath}`);
  }

  // Set defaults if requested
  if (setDefaults) {
    console.log("\n⚙️ Setting defaults for users with bank records but no default...");
    const targets = await prisma.user.findMany({
      where: {
        bankRecords: { some: {} },
        NOT: { bankRecords: { some: { isDefault: true } } },
      },
      select: {
        id: true,
        bankRecords: {
          orderBy: { createdAt: "asc" },
          select: { id: true },
        },
      },
    });

    let updated = 0;
    for (const user of targets) {
      if (!user.bankRecords.length) continue;
      const firstId = user.bankRecords[0].id;
      await prisma.userBankRecord.update({ where: { id: firstId }, data: { isDefault: true } });
      updated++;
    }

    console.log(`✅ Set defaults for ${updated} users.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
