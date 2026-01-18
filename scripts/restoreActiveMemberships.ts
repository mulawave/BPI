import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

interface SQLUser {
  id: number;
  email: string;
  is_vip: number;
}

interface ActiveShelter {
  user_id: number;
  amount: number;
}

function parseSQLInserts(content: string, tableName: string): any[] {
  const results: any[] = [];
  const lines = content.split("\n");
  
  let currentInsert = "";
  let inInsert = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.includes(`INSERT INTO \`${tableName}\``)) {
      inInsert = true;
      currentInsert = trimmed;
      
      if (trimmed.endsWith(";")) {
        parseInsertLine(currentInsert, results);
        currentInsert = "";
        inInsert = false;
      }
    } else if (inInsert) {
      currentInsert += " " + trimmed;
      
      if (trimmed.endsWith(";")) {
        parseInsertLine(currentInsert, results);
        currentInsert = "";
        inInsert = false;
      }
    }
  }
  
  return results;
}

function parseInsertLine(line: string, results: any[]) {
  const valuesMatch = line.match(/VALUES\s*(.+);?$/s);
  if (!valuesMatch) return;
  
  const valuesString = valuesMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;
  
  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = parseFields(match[1]);
    results.push(values);
  }
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

function mapAmountToPackageName(amount: number): string | null {
  // Map amounts found in SQL dump to membership packages
  // These are the actual payment amounts, not package IDs
  
  const packageMap: Record<number, string> = {
    // Regular tier (₦10,000)
    10000: "Regular",
    
    // Regular Plus tier (₦40,000 or ₦50,000 variations)
    40000: "Regular Plus",
    50000: "Regular Plus",
    
    // Gold Plus tier (variations: 110000, 200000, 210000)
    110000: "Gold Plus",
    200000: "Gold Plus",
    210000: "Gold Plus",
    
    // Platinum/higher tiers
    310000: "Platinum Plus",
    
    // Unknown/special amounts - need clarification
    23000: "Regular", // Unknown tier - defaulting to Regular
  };
  
  return packageMap[amount] || null;
}

async function restoreActiveMemberships() {
  console.log("🔄 Starting membership restoration from SQL dump...\n");
  
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  
  if (!fs.existsSync(sqlDumpPath)) {
    console.error("❌ SQL dump file not found:", sqlDumpPath);
    return;
  }
  
  console.log("📖 Reading SQL dump file...");
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  
  // Parse users table to find is_vip = 1 users
  console.log("🔍 Parsing users table (looking for is_vip = 1)...");
  const userRows = parseSQLInserts(sqlContent, "users");
  
  const vipUsers: SQLUser[] = [];
  for (const row of userRows) {
    const id = parseValue(row[0]);
    const email = parseValue(row[14]); // email is at index 14
    const is_vip = parseValue(row[60]); // is_vip is at index 60
    
    if (is_vip === 1) {
      vipUsers.push({ id, email, is_vip });
    }
  }
  
  console.log(`✅ Found ${vipUsers.length} users with is_vip = 1\n`);
  
  // Parse active_shelters table
  console.log("🔍 Parsing active_shelters table...");
  const shelterRows = parseSQLInserts(sqlContent, "active_shelters");
  
  const shelterMap = new Map<number, number>();
  for (const row of shelterRows) {
    const userId = parseValue(row[1]); // user_id is at index 1
    const amount = parseValue(row[5]); // amount is at index 5 (NOT 4 - that's starter_pack!)
    
    if (userId && amount) {
      shelterMap.set(userId, amount);
    }
  }
  
  console.log(`✅ Found ${shelterMap.size} active shelter records\n`);
  
  // Get all membership packages
  console.log("📦 Fetching membership packages from database...");
  const packages = await prisma.membershipPackage.findMany();
  const packageByName = new Map(packages.map(p => [p.name, p]));
  
  console.log(`✅ Found ${packages.length} membership packages\n`);
  
  // Process each VIP user
  console.log("🔄 Restoring memberships...\n");
  
  let successCount = 0;
  let notFoundCount = 0;
  let noAmountCount = 0;
  let noPackageMatchCount = 0;
  
  const errors: Array<{ legacyId: number; email: string; reason: string; amount?: number }> = [];
  
  for (const vipUser of vipUsers) {
    const amount = shelterMap.get(vipUser.id);
    
    if (!amount) {
      noAmountCount++;
      errors.push({
        legacyId: vipUser.id,
        email: vipUser.email,
        reason: "No amount found in active_shelters"
      });
      continue;
    }
    
    const packageName = mapAmountToPackageName(amount);
    
    if (!packageName) {
      noPackageMatchCount++;
      errors.push({
        legacyId: vipUser.id,
        email: vipUser.email,
        reason: "No package match for amount",
        amount
      });
      console.log(`  ⚠️  Unknown amount ${amount} for user ${vipUser.email} (legacy ID: ${vipUser.id})`);
      continue;
    }
    
    const membershipPackage = packageByName.get(packageName);
    
    if (!membershipPackage) {
      noPackageMatchCount++;
      errors.push({
        legacyId: vipUser.id,
        email: vipUser.email,
        reason: `Package "${packageName}" not found in database`,
        amount
      });
      continue;
    }
    
    // Find user in Prisma by legacy ID
    const user = await prisma.user.findFirst({
      where: { legacyId: vipUser.id.toString() }
    });
    
    if (!user) {
      notFoundCount++;
      errors.push({
        legacyId: vipUser.id,
        email: vipUser.email,
        reason: "User not found in Prisma database"
      });
      continue;
    }
    
    // Update user with membership
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now
    
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activated: true,
          activeMembershipPackageId: membershipPackage.id,
          membershipActivatedAt: now,
          membershipExpiresAt: expiresAt,
        }
      });
      
      successCount++;
      
      if (successCount % 50 === 0) {
        console.log(`  ✅ Processed ${successCount} users...`);
      }
    } catch (error: any) {
      errors.push({
        legacyId: vipUser.id,
        email: vipUser.email,
        reason: `Update failed: ${error.message}`,
        amount
      });
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESTORATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully restored: ${successCount} memberships`);
  console.log(`❌ No amount in active_shelters: ${noAmountCount} users`);
  console.log(`❌ No package match: ${noPackageMatchCount} users`);
  console.log(`❌ User not found in Prisma: ${notFoundCount} users`);
  console.log(`📈 Total VIP users processed: ${vipUsers.length}`);
  console.log("=".repeat(60));
  
  if (errors.length > 0) {
    console.log("\n💾 Saving error log...");
    fs.writeFileSync(
      "z:\\bpi\\v3\\bpi_main\\membership-restoration-errors.json",
      JSON.stringify(errors, null, 2)
    );
    console.log("📄 Error details saved to: membership-restoration-errors.json");
    
    console.log("\n📋 Sample errors:");
    errors.slice(0, 10).forEach(err => {
      console.log(`  - Legacy ID ${err.legacyId} (${err.email}): ${err.reason}${err.amount ? ` (amount: ${err.amount})` : ''}`);
    });
  }
  
  console.log("\n✨ Membership restoration complete!");
}

restoreActiveMemberships()
  .catch((error) => {
    console.error("❌ Fatal error during restoration:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
