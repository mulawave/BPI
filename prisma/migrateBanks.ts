import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Bank {
  id: number;
  bankName: string;
  bankCode: string;
}

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

function parseBanksInsert(line: string): Bank[] {
  const banks: Bank[] = [];
  const insertMatch = line.match(/INSERT INTO `nigerian_banks`.*?VALUES\s*(.+);?$/s);
  
  if (!insertMatch) return banks;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 3) {
      const id = parseValue(fields[0]);
      const bankName = parseValue(fields[1]);
      const bankCode = parseValue(fields[2]);
      
      banks.push({
        id: Number(id),
        bankName: String(bankName),
        bankCode: String(bankCode),
      });
    }
  }
  
  return banks;
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
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  
  console.log("🏦 Starting bank data migration...\n");
  
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");
  
  const banks: Bank[] = [];
  const bankRecords: UserBankRecord[] = [];
  
  let currentInsert = "";
  let inBanksInsert = false;
  let inBankRecordsInsert = false;
  
  console.log("📖 Parsing SQL dump...");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Parse banks
    if (trimmedLine.startsWith("INSERT INTO `nigerian_banks`")) {
      inBanksInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        banks.push(...parseBanksInsert(currentInsert));
        currentInsert = "";
        inBanksInsert = false;
      }
    } else if (inBanksInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        banks.push(...parseBanksInsert(currentInsert));
        currentInsert = "";
        inBanksInsert = false;
      }
    }
    
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
  
  console.log(`✅ Parsed ${banks.length} banks`);
  console.log(`✅ Parsed ${bankRecords.length} bank records\n`);
  
  // Insert banks
  console.log("💾 Inserting banks into database...");
  
  for (const bank of banks) {
    try {
      await prisma.bank.upsert({
        where: { id: bank.id },
        update: {
          bankName: bank.bankName,
          bankCode: bank.bankCode,
        },
        create: {
          id: bank.id,
          bankName: bank.bankName,
          bankCode: bank.bankCode,
        },
      });
    } catch (error) {
      console.error(`Error inserting bank ${bank.bankName}:`, error);
    }
  }
  
  console.log(`✅ Inserted ${banks.length} banks\n`);
  
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
  
  // Insert bank records
  console.log("💾 Inserting user bank records...");
  
  let inserted = 0;
  let skipped = 0;
  
  for (const record of bankRecords) {
    const newUserId = legacyToNewId.get(record.userId.toString());
    
    if (!newUserId) {
      skipped++;
      continue;
    }
    
    // Legacy bankName field contains the bank CODE, not the name
    const bankCode = record.bankName;
    const bankId = bankCodeToId.get(bankCode);
    
    try {
      await prisma.userBankRecord.create({
        data: {
          userId: newUserId,
          bankId: bankId || null,
          bankName: bankId ? null : bankCode, // Fallback: store code if bank not found
          accountName: record.accountName,
          accountNumber: record.accountNumber,
          bvn: record.bvn || null,
        },
      });
      inserted++;
      
      if (inserted % 100 === 0) {
        console.log(`  Inserted ${inserted} records...`);
      }
    } catch (error) {
      console.error(`Error inserting bank record for user ${record.userId}:`, error);
      skipped++;
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Banks: ${banks.length}`);
  console.log(`   Bank records inserted: ${inserted}`);
  console.log(`   Bank records skipped: ${skipped}`);
  
  await prisma.$disconnect();
}

migrateBanks().catch(console.error);
