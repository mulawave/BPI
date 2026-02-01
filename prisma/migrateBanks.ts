import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UserBankRecord {
  id: number;
  userId: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bvn: string;
}

function parseValue(value: string): any {
  if (!value || value === "NULL" || value === "null") return null;
  
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  
  // Don't convert to number - preserve all values as strings to keep leading zeros
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
  
  if (current.trim()) {
    fields.push(current.trim());
  }
  
  return fields;
}

function parseBankRecordsInsert(line: string): UserBankRecord[] {
  const records: UserBankRecord[] = [];
  const insertMatch = line.match(/INSERT INTO `bank_records`.*?VALUES\s*(.+);?$/s);
  
  if (!insertMatch) return records;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 6) {
      const id = parseValue(fields[0]);
      const userId = parseValue(fields[1]);
      const bankName = parseValue(fields[2]);
      const accountName = parseValue(fields[3]);
      const accountNumber = parseValue(fields[4]);
      const bvn = parseValue(fields[5]);
      
      records.push({
        id: Number(id),
        userId: Number(userId),
        bankName: String(bankName),
        accountName: String(accountName),
        accountNumber: String(accountNumber),
        bvn: String(bvn),
      });
    }
  }
  
  return records;
}

async function migrateBanks() {
  const commit = process.argv.includes("--commit");
  const sqlDumpPath = path.join(__dirname, "..", "legacy_sql", "beepagro_beepagro.sql");
  
  console.log("🏦 Starting bank data migration...\n");
  
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");
  
  const bankRecords: UserBankRecord[] = [];
  
  let currentInsert = "";
  let inBankRecordsInsert = false;
  
  console.log("📖 Parsing SQL dump...");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Parse bank records
    if (trimmedLine.startsWith("INSERT INTO `bank_records`")) {
      inBankRecordsInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        bankRecords.push(...parseBankRecordsInsert(currentInsert));
        currentInsert = "";
        inBankRecordsInsert = false;
      }
    } else if (inBankRecordsInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        bankRecords.push(...parseBankRecordsInsert(currentInsert));
        currentInsert = "";
        inBankRecordsInsert = false;
      }
    }
  }
  
  console.log(`✅ Parsed ${bankRecords.length} bank records\n`);
  
  // Get user ID mapping (legacyId to new UUID)
  console.log("🔗 Building user ID mapping...");
  const users = await prisma.user.findMany({
    where: {
      legacyId: {
        not: null
      }
    },
    select: {
      id: true,
      legacyId: true,
    }
  });
  
  const legacyToNewId = new Map(
    users.map(u => [u.legacyId!, u.id])
  );
  
  console.log(`✅ Found ${legacyToNewId.size} users with legacy IDs\n`);
  
  // Build bank code to ID mapping
  console.log("🔗 Building bank code to ID mapping...");
  const banksInDb = await prisma.bank.findMany({
    select: {
      id: true,
      bankCode: true,
      bankName: true,
    }
  });
  
  const bankCodeToId = new Map(
    banksInDb.map((b: any) => [b.bankCode, b.id])
  );
  
  console.log(`✅ Found ${bankCodeToId.size} banks in database\n`);
  
  // Build target set of records with mapped users
  const candidateRecords = bankRecords
    .map((record) => {
      const newUserId = legacyToNewId.get(record.userId.toString());
      if (!newUserId) return null;
      return { ...record, newUserId };
    })
    .filter(Boolean) as Array<UserBankRecord & { newUserId: string }>;

  const uniqueUserIds = Array.from(new Set(candidateRecords.map((r) => r.newUserId)));

  // Fetch existing bank records for these users to handle dedup and default logic
  console.log("📦 Loading existing user bank records for dedup/default checks...");
  const existingRecords = uniqueUserIds.length
    ? await prisma.userBankRecord.findMany({
        where: { userId: { in: uniqueUserIds } },
        select: {
          id: true,
          userId: true,
          bankId: true,
          bankName: true,
          accountNumber: true,
          isDefault: true,
        },
      })
    : [];

  const userHasDefault = new Map<string, boolean>();
  const userExistingKeys = new Map<string, Set<string>>();

  for (const rec of existingRecords) {
    const hasDefault = userHasDefault.get(rec.userId) || false;
    if (rec.isDefault) userHasDefault.set(rec.userId, true);

    const key = `${rec.bankId ?? "null"}|${rec.bankName ?? ""}|${rec.accountNumber}`;
    if (!userExistingKeys.has(rec.userId)) {
      userExistingKeys.set(rec.userId, new Set());
    }
    userExistingKeys.get(rec.userId)!.add(key);
  }

  console.log("💾 Preparing user bank record inserts...");

  let inserted = 0;
  let dedupSkipped = 0;
  let missingUser = 0;
  let missingBankCode = 0;
  let bankFallback = 0;

  const rowsToInsert: Parameters<typeof prisma.userBankRecord.create>[0]["data"][] = [];

  const perUserInsertedDefault = new Map<string, boolean>();

  for (const record of bankRecords) {
    const newUserId = legacyToNewId.get(record.userId.toString());

    if (!newUserId) {
      missingUser++;
      continue;
    }

    const bankCode = record.bankName; // legacy field holds bank code
    const bankId = bankCodeToId.get(bankCode);
    if (!bankId) missingBankCode++;

    const key = `${bankId ?? "null"}|${bankId ? "" : bankCode}|${record.accountNumber}`;
    const existingSet = userExistingKeys.get(newUserId) || new Set();

    if (existingSet.has(key)) {
      dedupSkipped++;
      continue;
    }

    const data = {
      userId: newUserId,
      bankId: bankId || null,
      bankName: bankId ? null : bankCode,
      accountName: record.accountName,
      accountNumber: record.accountNumber,
      bvn: record.bvn || null,
      isDefault: false,
    } as const;

    // Default assignment: if user has no default yet and we haven't set one in this run
    const hasDefaultAlready = userHasDefault.get(newUserId) || false;
    const defaultSetInBatch = perUserInsertedDefault.get(newUserId) || false;
    if (!hasDefaultAlready && !defaultSetInBatch) {
      (data as any).isDefault = true;
      perUserInsertedDefault.set(newUserId, true);
    }

    if (!bankId) bankFallback++;

    rowsToInsert.push(data);
    existingSet.add(key);
    userExistingKeys.set(newUserId, existingSet);
  }

  if (!commit) {
    console.log("🧪 Dry run (no writes). Summary:");
    console.log(`   Parsed legacy bank records: ${bankRecords.length}`);
    console.log(`   Mapped to users: ${bankRecords.length - missingUser}`);
    console.log(`   Missing users (no legacyId match): ${missingUser}`);
    console.log(`   Prepared inserts (after dedup): ${rowsToInsert.length}`);
    console.log(`   Dedup skipped: ${dedupSkipped}`);
    console.log(`   Missing bank code matches: ${missingBankCode}`);
    console.log(`   Fallback bankName (code stored): ${bankFallback}`);
    console.log(`   Users gaining default in this batch: ${perUserInsertedDefault.size}`);
    await prisma.$disconnect();
    return;
  }

  // Commit writes in chunks to avoid large transactions
  const chunkSize = 500;
  for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
    const slice = rowsToInsert.slice(i, i + chunkSize);
    await prisma.$transaction(
      slice.map((data) =>
        prisma.userBankRecord.create({
          data,
        })
      )
    );
    inserted += slice.length;
    console.log(`  Inserted ${inserted}/${rowsToInsert.length} records...`);
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Bank records inserted: ${inserted}`);
  console.log(`   Bank records skipped (no user match): ${missingUser}`);
  console.log(`   Bank records skipped (dedup): ${dedupSkipped}`);
  console.log(`   Missing bank code matches: ${missingBankCode}`);
  console.log(`   Fallback bankName (code stored): ${bankFallback}`);
  
  await prisma.$disconnect();
}

migrateBanks().catch(console.error);
