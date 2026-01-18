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

async function fixSpecialAmounts() {
  console.log("🔧 Fixing users with special amounts (20000, 21000, 23000)...\n");
  
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  
  // Get Regular package
  const regularPackage = await prisma.membershipPackage.findFirst({
    where: { name: "Regular" }
  });
  
  if (!regularPackage) {
    console.error("❌ Regular package not found!");
    return;
  }
  
  console.log(`📦 Regular package: ${regularPackage.name} (${regularPackage.id})\n`);
  
  // Parse active_shelters to find users with these amounts
  const shelterRows = parseSQLInserts(sqlContent, "active_shelters");
  const specialAmounts = [20000, 21000, 23000];
  const usersToFix: Array<{ legacyId: number; amount: number }> = [];
  
  for (const row of shelterRows) {
    const userId = parseValue(row[1]);
    const amount = parseValue(row[5]);
    
    if (userId && specialAmounts.includes(amount)) {
      usersToFix.push({ legacyId: userId, amount });
    }
  }
  
  console.log(`Found ${usersToFix.length} users with amounts: 20000, 21000, or 23000\n`);
  
  // Group by amount
  const byAmount = new Map<number, number[]>();
  usersToFix.forEach(({ legacyId, amount }) => {
    if (!byAmount.has(amount)) byAmount.set(amount, []);
    byAmount.get(amount)!.push(legacyId);
  });
  
  console.log("📊 Breakdown:");
  byAmount.forEach((ids, amount) => {
    console.log(`  ₦${amount}: ${ids.length} users`);
  });
  console.log("");
  
  // Update each user
  let fixedCount = 0;
  let alreadyCorrect = 0;
  let notFound = 0;
  
  console.log("🔄 Updating users...\n");
  
  for (const { legacyId, amount } of usersToFix) {
    const user = await prisma.user.findFirst({
      where: { legacyId: legacyId.toString() }
    });
    
    if (!user) {
      notFound++;
      console.log(`  ⚠️  User with legacy ID ${legacyId} not found in database`);
      continue;
    }
    
    if (user.activeMembershipPackageId === regularPackage.id) {
      alreadyCorrect++;
      continue;
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { activeMembershipPackageId: regularPackage.id }
    });
    
    fixedCount++;
    console.log(`  ✅ ${user.email} (legacy: ${legacyId}, ₦${amount}) → Regular`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 FIX SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Updated to Regular: ${fixedCount} users`);
  console.log(`✓  Already Regular: ${alreadyCorrect} users`);
  console.log(`❌ Not found: ${notFound} users`);
  console.log(`📈 Total processed: ${usersToFix.length} users`);
  console.log("=".repeat(60));
}

fixSpecialAmounts()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
