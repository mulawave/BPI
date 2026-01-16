import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

interface SQLUser {
  id: number;
  firstname: string;
  lastname: string;
  mobile: string;
  ssc: string | null;
  solar_agent: number;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  profile_pic: string;
  merchant_pic: string | null;
  email: string;
  secondary_email: string | null;
  password: string;
  username: string;
  referral_link: string;
  user_type: string;
  rank: string;
  activated: number;
  last_login: string;
  kyc: string | null;
  kyc_pending: number;
  withdraw_ban: number;
  youtube_banned: number;
  card: string | null;
  card_type: string | null;
  pass_completed: number;
  community: number;
  shareholder: number;
  wallet: number;
  spendable: number;
  default_currency: number;
  palliative: number;
  cashback: number;
  student_cashback: number;
  token: string | null;
  mdc: number;
  shelter: number;
  shelter_wallet: number;
  education: number;
  car: number;
  business: number;
  solar: number | null;
  legals: number | null;
  land: number;
  meal: number;
  health: number;
  created_at: string;
  updated_at: string;
  verification_code: string | null;
  verified: number;
  pending_activation: number | null;
  reset_token: string | null;
  is_part_pay: number;
  first_pay: number;
  second_pay: number;
  third_pay: number;
  is_vip: number;
  bpi_upgrade: number | null;
  is_shelter: number;
  vip_pending: number;
  shelter_pending: number;
  is_shareholder: number;
  bpicg: number | null;
  level_1_count: number;
  level_2_count: number;
  level_3_count: number;
  level_4_count: number;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function parseInsertStatement(line: string): SQLUser[] | null {
  // Match INSERT INTO `users` ... VALUES pattern
  const insertMatch = line.match(/INSERT INTO `users`.*?VALUES\s*(.+);?$/s);
  if (!insertMatch) return null;

  const valuesString = insertMatch[1];
  const users: SQLUser[] = [];

  // Parse multiple value sets: (val1, val2, ...), (val1, val2, ...)
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 70) {
      const user = mapFieldsToUser(fields);
      if (user) users.push(user);
    }
  }

  return users.length > 0 ? users : null;
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
      // Check for escaped quote
      if (nextChar === quoteChar) {
        current += char;
        i++; // Skip next quote
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
  
  // Add last field
  if (current.trim()) {
    fields.push(current.trim());
  }
  
  return fields;
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

function mapFieldsToUser(fields: string[]): SQLUser | null {
  try {
    return {
      id: parseValue(fields[0]),
      firstname: parseValue(fields[1]),
      lastname: parseValue(fields[2]),
      mobile: parseValue(fields[3]),
      ssc: parseValue(fields[4]),
      solar_agent: parseValue(fields[5]),
      gender: parseValue(fields[6]),
      address: parseValue(fields[7]),
      city: parseValue(fields[8]),
      state: parseValue(fields[9]),
      zip: parseValue(fields[10]),
      country: parseValue(fields[11]),
      profile_pic: parseValue(fields[12]),
      merchant_pic: parseValue(fields[13]),
      email: parseValue(fields[14]),
      secondary_email: parseValue(fields[15]),
      password: parseValue(fields[16]),
      username: parseValue(fields[17]),
      referral_link: parseValue(fields[18]),
      user_type: parseValue(fields[19]),
      rank: parseValue(fields[20]),
      activated: parseValue(fields[21]),
      last_login: parseValue(fields[22]),
      kyc: parseValue(fields[23]),
      kyc_pending: parseValue(fields[24]),
      withdraw_ban: parseValue(fields[25]),
      youtube_banned: parseValue(fields[26]),
      card: parseValue(fields[27]),
      card_type: parseValue(fields[28]),
      pass_completed: parseValue(fields[29]),
      community: parseValue(fields[30]),
      shareholder: parseValue(fields[31]),
      wallet: parseValue(fields[32]),
      spendable: parseValue(fields[33]),
      default_currency: parseValue(fields[34]),
      palliative: parseValue(fields[35]),
      cashback: parseValue(fields[36]),
      student_cashback: parseValue(fields[37]),
      token: parseValue(fields[38]),
      mdc: parseValue(fields[39]),
      shelter: parseValue(fields[40]),
      shelter_wallet: parseValue(fields[41]),
      education: parseValue(fields[42]),
      car: parseValue(fields[43]),
      business: parseValue(fields[44]),
      solar: parseValue(fields[45]),
      legals: parseValue(fields[46]),
      land: parseValue(fields[47]),
      meal: parseValue(fields[48]),
      health: parseValue(fields[49]),
      created_at: parseValue(fields[50]),
      updated_at: parseValue(fields[51]),
      verification_code: parseValue(fields[52]),
      verified: parseValue(fields[53]),
      pending_activation: parseValue(fields[54]),
      reset_token: parseValue(fields[55]),
      is_part_pay: parseValue(fields[56]),
      first_pay: parseValue(fields[57]),
      second_pay: parseValue(fields[58]),
      third_pay: parseValue(fields[59]),
      is_vip: parseValue(fields[60]),
      bpi_upgrade: parseValue(fields[61]),
      is_shelter: parseValue(fields[62]),
      vip_pending: parseValue(fields[63]),
      shelter_pending: parseValue(fields[64]),
      is_shareholder: parseValue(fields[65]),
      bpicg: parseValue(fields[66]),
      level_1_count: parseValue(fields[67]),
      level_2_count: parseValue(fields[68]),
      level_3_count: parseValue(fields[69]),
      level_4_count: parseValue(fields[70]),
    };
  } catch (error) {
    console.error("Error mapping fields:", error);
    return null;
  }
}

function transformSQLUserToPrisma(sqlUser: SQLUser) {
  const newId = generateUUID();
  
  return {
    id: newId,
    legacyId: sqlUser.id.toString(),
    name: `${sqlUser.firstname} ${sqlUser.lastname}`.trim(),
    email: sqlUser.email || undefined,
    emailVerified: sqlUser.verified ? new Date() : null,
    image: sqlUser.profile_pic || null,
    firstname: sqlUser.firstname || null,
    lastname: sqlUser.lastname || null,
    mobile: sqlUser.mobile ? String(sqlUser.mobile) : null,
    ssc: sqlUser.ssc,
    gender: sqlUser.gender || null,
    address: sqlUser.address ? String(sqlUser.address) : null,
    city: sqlUser.city ? String(sqlUser.city) : null,
    state: sqlUser.state ? String(sqlUser.state) : null,
    zip: sqlUser.zip ? String(sqlUser.zip) : null,
    country: sqlUser.country ? String(sqlUser.country) : null,
    profilePic: sqlUser.profile_pic || null,
    secondaryEmail: sqlUser.secondary_email,
    username: sqlUser.username ? String(sqlUser.username) : undefined,
    referralLink: sqlUser.referral_link || null,
    userType: sqlUser.user_type || "user",
    rank: sqlUser.rank || "Newbie",
    activated: sqlUser.activated === 1,
    kyc: sqlUser.kyc ? String(sqlUser.kyc) : null,
    kycPending: sqlUser.kyc_pending || 0,
    withdrawBan: sqlUser.withdraw_ban || 0,
    verified: sqlUser.verified === 1,
    pendingActivation: sqlUser.pending_activation,
    isVip: sqlUser.is_vip || 0,
    isShelter: sqlUser.is_shelter || 0,
    vipPending: sqlUser.vip_pending || 0,
    shelterPending: sqlUser.shelter_pending || 0,
    shelterWallet: sqlUser.shelter_wallet || 0,
    isShareholder: sqlUser.is_shareholder || 0,
    wallet: Number(sqlUser.wallet) || 0,
    spendable: Number(sqlUser.spendable) || 0,
    palliative: Number(sqlUser.palliative) || 0,
    cashback: Number(sqlUser.cashback) || 0,
    studentCashback: Number(sqlUser.student_cashback) || 0,
    community: Number(sqlUser.community) || 0,
    shareholder: Number(sqlUser.shareholder) || 0,
    shelter: Number(sqlUser.shelter) || 0,
    education: Number(sqlUser.education) || 0,
    car: Number(sqlUser.car) || 0,
    business: Number(sqlUser.business) || 0,
    solar: sqlUser.solar ? Number(sqlUser.solar) : null,
    legals: sqlUser.legals ? Number(sqlUser.legals) : null,
    land: Number(sqlUser.land) || 0,
    meal: Number(sqlUser.meal) || 0,
    health: Number(sqlUser.health) || 0,
    defaultCurrency: sqlUser.default_currency || 1,
    level1Count: sqlUser.level_1_count || 0,
    level2Count: sqlUser.level_2_count || 0,
    level3Count: sqlUser.level_3_count || 0,
    level4Count: sqlUser.level_4_count || 0,
    role: sqlUser.user_type === "admin" ? "admin" : "user",
    passwordHash: sqlUser.password || null,
    verificationCode: sqlUser.verification_code ? String(sqlUser.verification_code) : null,
    resetToken: sqlUser.reset_token,
    createdAt: new Date(sqlUser.created_at),
    updatedAt: new Date(sqlUser.updated_at),
    lastLogin: new Date(sqlUser.last_login),
  };
}

async function migrateUsers() {
  console.log("🚀 Starting user migration from SQL dump...\n");

  // Truncate existing users to avoid duplicates
  console.log("🗑️  Truncating existing users table...");
  try {
    await prisma.user.deleteMany({});
    console.log("✅ Users table cleared\n");
  } catch (error) {
    console.error("⚠️  Error clearing users table:", error);
  }

  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  
  if (!fs.existsSync(sqlDumpPath)) {
    console.error("❌ SQL dump file not found:", sqlDumpPath);
    return;
  }

  console.log("📖 Reading SQL dump file...");
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");

  const allUsers: SQLUser[] = [];
  let currentInsert = "";
  let inInsert = false;

  console.log("🔍 Parsing INSERT statements...");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith("INSERT INTO `users`")) {
      inInsert = true;
      currentInsert = trimmedLine;
      
      // Check if statement ends on same line
      if (trimmedLine.endsWith(";")) {
        const users = parseInsertStatement(currentInsert);
        if (users) allUsers.push(...users);
        currentInsert = "";
        inInsert = false;
      }
    } else if (inInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        const users = parseInsertStatement(currentInsert);
        if (users) allUsers.push(...users);
        currentInsert = "";
        inInsert = false;
      }
    }
  }

  console.log(`✅ Parsed ${allUsers.length} users from SQL dump\n`);

  if (allUsers.length === 0) {
    console.log("⚠️  No users found to migrate.");
    return;
  }

  console.log("🔄 Transforming users to Prisma format...");
  const prismaUsers = allUsers.map(transformSQLUserToPrisma);

  console.log("💾 Inserting users into database...");
  
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ user: any; error: string }> = [];

  for (let i = 0; i < prismaUsers.length; i += BATCH_SIZE) {
    const batch = prismaUsers.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(prismaUsers.length / BATCH_SIZE);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)...`);

    for (const user of batch) {
      try {
        await prisma.user.create({
          data: user,
        });
        successCount++;
      } catch (error: any) {
        errorCount++;
        
        // Handle duplicate username by appending legacy ID
        if (error.message.includes("Unique constraint failed") && error.message.includes("username")) {
          try {
            await prisma.user.create({
              data: {
                ...user,
                username: user.username ? `${user.username}_${user.legacyId}` : undefined,
              },
            });
            successCount++;
            errorCount--; // Correction since we succeeded on retry
            continue;
          } catch (retryError: any) {
            // Still failed after retry
          }
        }
        
        errors.push({
          user: { email: user.email, legacyId: user.legacyId },
          error: error.message,
        });
        
        // Show first few errors inline
        if (errorCount <= 5) {
          console.error(`  ⚠️  Error with user ${user.email} (legacy ID: ${user.legacyId}):`, error.message);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully migrated: ${successCount} users`);
  console.log(`❌ Failed to migrate: ${errorCount} users`);
  console.log(`📈 Total processed: ${allUsers.length} users`);
  console.log("=".repeat(60));

  if (errors.length > 0) {
    console.log("\n💾 Saving error log...");
    fs.writeFileSync(
      "z:\\bpi\\v3\\bpi_main\\migration-errors.json",
      JSON.stringify(errors, null, 2)
    );
    console.log("📄 Error details saved to: migration-errors.json");
  }

  console.log("\n✨ Migration complete!");
}

// Run migration
migrateUsers()
  .catch((error) => {
    console.error("❌ Fatal error during migration:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
