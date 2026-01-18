import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

// Parse SQL INSERT statements
function parseSQLInserts(sqlContent: string, tableName: string): string[][] {
  const regex = new RegExp(`INSERT INTO \`${tableName}\`[^V]*VALUES\\s*([^;]+);`, "gi");
  const results: string[][] = [];
  let match;
  
  while ((match = regex.exec(sqlContent)) !== null) {
    const valuesString = match[1];
    const valuePattern = /\(([^)]+)\)/g;
    let valueMatch;
    
    while ((valueMatch = valuePattern.exec(valuesString)) !== null) {
      const fields = parseFields(valueMatch[1]);
      results.push(fields);
    }
  }
  
  return results;
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

function parseValue(value: string): any {
  if (!value || value === "NULL" || value === "null") return null;
  
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  
  return value;
}

async function showOrphanedAmounts() {
  console.log("🔍 Checking payment amounts for orphaned users...\n");
  
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  
  // Get current valid packages
  const packages = await prisma.membershipPackage.findMany();
  const packageMap = new Map(packages.map(p => [p.id, p]));
  
  // Find orphaned users
  const allUsers = await prisma.user.findMany({
    where: { activeMembershipPackageId: { not: null } },
    select: { id: true, email: true, legacyId: true, activeMembershipPackageId: true }
  });
  
  const orphanedUsers = allUsers.filter(u => 
    u.activeMembershipPackageId && !packageMap.has(u.activeMembershipPackageId)
  );
  
  console.log(`Found ${orphanedUsers.length} orphaned users\n`);
  
  // Parse active_shelters to get payment amounts
  const shelterRows = parseSQLInserts(sqlContent, "active_shelters");
  const amountMap = new Map<number, number>();
  
  for (const row of shelterRows) {
    const userId = parseValue(row[1]);
    const amount = parseValue(row[5]);
    if (userId && amount) {
      amountMap.set(userId, amount);
    }
  }
  
  console.log("=" .repeat(80));
  console.log("ORPHANED USERS - PAYMENT AMOUNTS FROM SQL DUMP");
  console.log("=".repeat(80));
  
  const amountGroups = new Map<number, any[]>();
  
  for (const user of orphanedUsers) {
    const legacyId = parseInt(user.legacyId || "0");
    const amount = amountMap.get(legacyId);
    
    if (!amountGroups.has(amount || 0)) {
      amountGroups.set(amount || 0, []);
    }
    
    amountGroups.get(amount || 0)!.push({
      legacyId,
      email: user.email,
      amount
    });
  }
  
  // Sort by amount
  const sortedAmounts = Array.from(amountGroups.keys()).sort((a, b) => (b || 0) - (a || 0));
  
  for (const amount of sortedAmounts) {
    const users = amountGroups.get(amount)!;
    
    if (amount) {
      console.log(`\n₦${amount.toLocaleString()} (${users.length} user${users.length > 1 ? 's' : ''}):`);
    } else {
      console.log(`\nNo amount found (${users.length} user${users.length > 1 ? 's' : ''}):`);
    }
    
    users.forEach(u => {
      console.log(`  - ${u.email} (legacy ID: ${u.legacyId})`);
    });
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("\nPlease specify which package each amount should map to:");
  console.log("\nAvailable packages:");
  packages.forEach(p => {
    console.log(`  - ${p.name} (₦${p.price})`);
  });
  console.log("\n" + "=".repeat(80));
}

showOrphanedAmounts()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
