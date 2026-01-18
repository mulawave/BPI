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

async function fixOrphanedUsers() {
  console.log("🔧 Fixing orphaned package assignments...\n");
  
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  
  // Get current valid packages
  const packages = await prisma.membershipPackage.findMany();
  const packageMap = new Map(packages.map(p => [p.id, p]));
  const packageByName = new Map(packages.map(p => [p.name, p]));
  
  // Find orphaned users
  const allUsers = await prisma.user.findMany({
    where: { activeMembershipPackageId: { not: null } },
    select: { id: true, email: true, legacyId: true, activeMembershipPackageId: true }
  });
  
  const orphanedUsers = allUsers.filter(u => 
    u.activeMembershipPackageId && !packageMap.has(u.activeMembershipPackageId)
  );
  
  console.log(`📊 Found ${orphanedUsers.length} orphaned users\n`);
  
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
  
  // Map amounts to correct packages
  function getCorrectPackage(amount: number) {
    if (amount === 10000) return packageByName.get("Regular");
    if (amount === 40000 || amount === 50000) return packageByName.get("Regular Plus");
    if (amount === 110000 || amount === 200000 || amount === 210000) return packageByName.get("Gold Plus");
    if (amount === 310000) return packageByName.get("Platinum Plus");
    if (amount === 23000) return packageByName.get("Regular");
    return null;
  }
  
  console.log("🔄 Reassigning orphaned users...\n");
  
  let fixedCount = 0;
  const errors: any[] = [];
  
  for (const user of orphanedUsers) {
    const legacyId = parseInt(user.legacyId || "0");
    const amount = amountMap.get(legacyId);
    
    if (!amount) {
      errors.push({ user: user.email, reason: "No amount found in SQL dump" });
      console.log(`  ⚠️  ${user.email} (legacy: ${legacyId}) - no amount found`);
      continue;
    }
    
    const correctPackage = getCorrectPackage(amount);
    
    if (!correctPackage) {
      errors.push({ user: user.email, amount, reason: "No package match for amount" });
      console.log(`  ⚠️  ${user.email} (legacy: ${legacyId}) - unknown amount ₦${amount}`);
      continue;
    }
    
    // Update user with correct package
    await prisma.user.update({
      where: { id: user.id },
      data: { activeMembershipPackageId: correctPackage.id }
    });
    
    fixedCount++;
    console.log(`  ✅ ${user.email} → ${correctPackage.name} (₦${amount})`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 FIX SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully fixed: ${fixedCount} users`);
  console.log(`❌ Failed: ${errors.length} users`);
  console.log("=".repeat(60));
  
  if (errors.length > 0) {
    fs.writeFileSync(
      "orphaned-fix-errors.json",
      JSON.stringify(errors, null, 2)
    );
    console.log("\n💾 Error details saved to: orphaned-fix-errors.json");
  }
}

fixOrphanedUsers()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
