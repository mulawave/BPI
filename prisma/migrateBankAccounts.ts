import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LegacyBankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
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

function parseBankAccountsInsert(line: string): LegacyBankAccount[] {
  const accounts: LegacyBankAccount[] = [];
  const insertMatch = line.match(/INSERT INTO `bank_accounts`.*?VALUES\s*(.+);?$/s);
  if (!insertMatch) return accounts;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    if (fields.length >= 5) {
      const id = Number(parseValue(fields[0]));
      const bankName = parseValue(fields[1]);
      const accountNumber = parseValue(fields[2]);
      const accountName = parseValue(fields[3]);
      const status = parseValue(fields[4]);
      accounts.push({ id, bankName, accountNumber, accountName, status });
    }
  }

  return accounts;
}

async function migrateBankAccounts() {
  const commit = process.argv.includes("--commit");
  const sqlDumpPath = path.join(__dirname, "..", "legacy_sql", "beepagro_beepagro.sql");

  console.log("🏦 Starting bank_accounts migration (gateway receiving account)\n");

  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");

  const bankAccounts: LegacyBankAccount[] = [];
  let currentInsert = "";
  let inBankAccountsInsert = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("INSERT INTO `bank_accounts`")) {
      inBankAccountsInsert = true;
      currentInsert = trimmed;
      if (trimmed.endsWith(";")) {
        bankAccounts.push(...parseBankAccountsInsert(currentInsert));
        currentInsert = "";
        inBankAccountsInsert = false;
      }
    } else if (inBankAccountsInsert) {
      currentInsert += " " + trimmed;
      if (trimmed.endsWith(";")) {
        bankAccounts.push(...parseBankAccountsInsert(currentInsert));
        currentInsert = "";
        inBankAccountsInsert = false;
      }
    }
  }

  console.log(`✅ Parsed ${bankAccounts.length} bank_accounts rows\n`);

  if (!bankAccounts.length) {
    console.log("Nothing to migrate.");
    await prisma.$disconnect();
    return;
  }

  // Pick the active record; if multiple active, take the latest by id; otherwise latest by id
  const active = bankAccounts.filter((b) => b.status.toLowerCase() === "active");
  const chosen = (active.length ? active : bankAccounts).sort((a, b) => a.id - b.id)[active.length ? active.length - 1 : bankAccounts.length - 1];

  console.log("🧾 Selected legacy bank account to apply:");
  console.log(`   Bank: ${chosen.bankName}`);
  console.log(`   Account Name: ${chosen.accountName}`);
  console.log(`   Account Number: ${chosen.accountNumber}`);
  console.log(`   Status: ${chosen.status}`);

  if (!commit) {
    console.log("\n🧪 Dry run (no writes). Run with --commit to apply.");
    await prisma.$disconnect();
    return;
  }

  const now = new Date();
  const isActive = chosen.status.toLowerCase() === "active";

  const result = await prisma.paymentGatewayConfig.upsert({
    where: { gatewayName: "bank-transfer" },
    update: {
      bankName: chosen.bankName,
      bankAccount: chosen.accountNumber,
      bankAccountName: chosen.accountName,
      isActive,
      updatedAt: now,
    },
    create: {
      id: randomUUID(),
      gatewayName: "bank-transfer",
      displayName: "Bank Transfer",
      provider: "bank-transfer",
      isActive,
      supportedMethods: [],
      currency: "NGN",
      displayOrder: 30,
      bankName: chosen.bankName,
      bankAccount: chosen.accountNumber,
      bankAccountName: chosen.accountName,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log("\n✅ Migration complete. Updated bank-transfer gateway:");
  console.log(`   id: ${result.id}`);
  console.log(`   bankName: ${result.bankName}`);
  console.log(`   bankAccount: ${result.bankAccount}`);
  console.log(`   bankAccountName: ${result.bankAccountName}`);
  console.log(`   isActive: ${result.isActive}`);

  await prisma.$disconnect();
}

migrateBankAccounts().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
