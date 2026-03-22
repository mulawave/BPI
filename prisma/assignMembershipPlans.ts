import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

interface ActiveShelter {
  id: number;
  user_id: number;
  shelter_package: number;
  shelter_option: number;
  starter_pack: number | null;
  amount: number | null;
  status: string | null;
  activated_date: string;
}

function parseValue(value: string): any {
  if (!value || value === "NULL" || value === "null") return null;
  
  // Remove quotes if present
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  
  // Check if numeric
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  
  return value;
}

function parseActiveSheltersInsert(line: string): ActiveShelter[] | null {
  // Match INSERT INTO `active_shelters` ... VALUES pattern
  const insertMatch = line.match(/INSERT INTO `active_shelters`.*?VALUES\s*(.+);?$/s);
  if (!insertMatch) return null;

  const valuesString = insertMatch[1];
  const shelters: ActiveShelter[] = [];

  // Parse multiple value sets
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 8) {
      shelters.push({
        id: parseValue(fields[0]),
        user_id: parseValue(fields[1]),
        shelter_package: parseValue(fields[2]),
        shelter_option: parseValue(fields[3]),
        starter_pack: parseValue(fields[4]),
        amount: parseValue(fields[5]),
        status: parseValue(fields[6]),
        activated_date: parseValue(fields[7]),
      });
    }
  }

  return shelters.length > 0 ? shelters : null;
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

async function assignMembershipPlans() {
  console.log("🚀 Starting membership plan assignment...\n");

  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  
  if (!fs.existsSync(sqlDumpPath)) {
    console.error("❌ SQL dump file not found:", sqlDumpPath);
    return;
  }

  console.log("📖 Reading SQL dump file...");
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");

  const activeShelters: ActiveShelter[] = [];
  let currentInsert = "";
  let inInsert = false;

  console.log("🔍 Parsing active_shelters INSERT statements...");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith("INSERT INTO `active_shelters`")) {
      inInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        const shelters = parseActiveSheltersInsert(currentInsert);
        if (shelters) activeShelters.push(...shelters);
        currentInsert = "";
        inInsert = false;
      }
    } else if (inInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        const shelters = parseActiveSheltersInsert(currentInsert);
        if (shelters) activeShelters.push(...shelters);
        currentInsert = "";
        inInsert = false;
      }
    }
  }

  console.log(`✅ Found ${activeShelters.length} active shelter records\n`);

  if (activeShelters.length === 0) {
    console.log("⚠️  No active shelters found.");
    return;
  }

  // Get all membership packages from Prisma
  console.log("📦 Fetching membership packages from database...");
  const membershipPackages = await prisma.membershipPackage.findMany({
    select: {
      id: true,
      name: true,
      price: true,
    },
  });

  console.log(`✅ Found ${membershipPackages.length} membership packages\n`);

  // Create a map of price -> package ID
  const priceToPackageMap = new Map<number, string>();
  const packagesByName = new Map<string, { id: string; price: number }>();
  
  membershipPackages.forEach(pkg => {
    priceToPackageMap.set(pkg.price, pkg.id);
    packagesByName.set(pkg.name, { id: pkg.id, price: pkg.price });
    console.log(`   ${pkg.name}: ₦${pkg.price.toLocaleString()}`);
  });

  // Fallback mappings for legacy amounts
  const fallbackMappings = new Map<number, string>([
    [210000, packagesByName.get("Gold Plus")?.id || ""],
    [40000, packagesByName.get("Regular Plus")?.id || ""],
    [23000, packagesByName.get("Regular")?.id || ""],
    [310000, packagesByName.get("Platinum Plus")?.id || ""],
  ]);

  console.log("\n🔄 Processing user memberships...");
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  const errors: Array<{ userId: number; legacyId: string; error: string }> = [];
  const notFoundUsers: Array<{ legacyId: number; amount: number | null }> = [];

  for (const shelter of activeShelters) {
    try {
      // Find the user by legacy ID
      const user = await prisma.user.findFirst({
        where: { legacyId: shelter.user_id.toString() },
        select: { id: true, email: true, legacyId: true },
      });

      if (!user) {
        notFoundCount++;
        notFoundUsers.push({ legacyId: shelter.user_id, amount: shelter.amount });
        console.log(`  ⚠️  User with legacy ID ${shelter.user_id} not found in database`);
        continue;
      }

      // Find matching membership package by amount
      if (!shelter.amount) {
        console.log(`  ⚠️  No amount specified for user ${user.email} (legacy ID: ${shelter.user_id})`);
        continue;
      }

      let packageId = priceToPackageMap.get(shelter.amount);
      
      // Try fallback mapping if exact match not found
      if (!packageId && fallbackMappings.has(shelter.amount)) {
        packageId = fallbackMappings.get(shelter.amount);
        console.log(`  🔄 Mapping ₦${shelter.amount.toLocaleString()} → fallback package for ${user.email}`);
      }
      
      if (!packageId) {
        console.log(`  ⚠️  No membership package found with price ₦${shelter.amount.toLocaleString()} for user ${user.email}`);
        continue;
      }

      // Calculate expiry date (1 year from activation)
      const activatedAt = new Date(shelter.activated_date);
      const expiresAt = new Date(activatedAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Update user with membership info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeMembershipPackageId: packageId,
          membershipActivatedAt: activatedAt,
          membershipExpiresAt: expiresAt,
        },
      });

      successCount++;
      console.log(`  ✅ Assigned membership to ${user.email} (legacy ID: ${shelter.user_id}) - Amount: ₦${shelter.amount.toLocaleString()}`);

    } catch (error: any) {
      errorCount++;
      errors.push({
        userId: shelter.user_id,
        legacyId: shelter.user_id.toString(),
        error: error.message,
      });
      console.error(`  ❌ Error processing user ${shelter.user_id}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 MEMBERSHIP ASSIGNMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully assigned: ${successCount} memberships`);
  console.log(`⚠️  Users not found: ${notFoundCount}`);
  console.log(`❌ Failed to assign: ${errorCount} memberships`);
  console.log(`📈 Total processed: ${activeShelters.length} records`);
  console.log("=".repeat(60));

  if (notFoundUsers.length > 0) {
    console.log("\n🔍 Looking up email addresses for users not found...");
    
    // Parse users table from SQL dump to get emails
    const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
    const lines = sqlContent.split("\n");
    const userEmails = new Map<number, string>();
    
    let currentInsert = "";
    let inUsersInsert = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith("INSERT INTO `users`")) {
        inUsersInsert = true;
        currentInsert = trimmedLine;
        
        if (trimmedLine.endsWith(";")) {
          parseUsersForEmails(currentInsert, userEmails);
          currentInsert = "";
          inUsersInsert = false;
        }
      } else if (inUsersInsert) {
        currentInsert += " " + trimmedLine;
        
        if (trimmedLine.endsWith(";")) {
          parseUsersForEmails(currentInsert, userEmails);
          currentInsert = "";
          inUsersInsert = false;
        }
      }
    }
    
    console.log("\n📧 Users not found in database:");
    console.log("=".repeat(60));
    notFoundUsers.forEach(({ legacyId, amount }) => {
      const email = userEmails.get(legacyId) || "Email not found in SQL dump";
      console.log(`Legacy ID: ${legacyId} | Email: ${email} | Amount: ₦${amount?.toLocaleString() || 'N/A'}`);
    });
    console.log("=".repeat(60));
  }

  if (errors.length > 0) {
    console.log("\n💾 Saving error log...");
    fs.writeFileSync(
      "z:\\bpi\\v3\\bpi_main\\membership-assignment-errors.json",
      JSON.stringify(errors, null, 2)
    );
    console.log("📄 Error details saved to: membership-assignment-errors.json");
  }

  console.log("\n✨ Membership assignment complete!");
}

function parseUsersForEmails(line: string, userEmails: Map<number, string>) {
  const insertMatch = line.match(/INSERT INTO `users`.*?VALUES\s*(.+);?$/s);
  if (!insertMatch) return;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 15) {
      const id = parseValue(fields[0]);
      const email = parseValue(fields[14]); // email is at index 14
      if (id && email) {
        userEmails.set(Number(id), email);
      }
    }
  }
}

// Run assignment
assignMembershipPlans()
  .catch((error) => {
    console.error("❌ Fatal error during membership assignment:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
