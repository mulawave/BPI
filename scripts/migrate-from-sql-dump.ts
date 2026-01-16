/* 
  Usage:
  npx tsx scripts/migrate-from-sql-dump.ts /absolute/path/to/beepagro.sql
*/

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

if (process.argv.length < 3) {
  console.error("❌ SQL dump path not provided");
  process.exit(1);
}

const SQL_DUMP_PATH = path.resolve(process.argv[2]);

if (!fs.existsSync(SQL_DUMP_PATH)) {
  console.error("❌ SQL dump file not found:", SQL_DUMP_PATH);
  process.exit(1);
}

const sqlDump = fs.readFileSync(SQL_DUMP_PATH, "utf8");

/**
 * VERY IMPORTANT:
 * This script assumes the SQL dump uses standard INSERT INTO syntax
 * for `users` and `referrals`.
 */

/* ------------------ PARSERS ------------------ */

function extractTableInserts(table: string): string[] {
  const regex = new RegExp(`INSERT INTO\\s+\`${table}\`[\\s\\S]*?;`, "gi");
  return sqlDump.match(regex) || [];
}

const isUniqueConstraintError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function cleanString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^'+|'+$/g, "");
  return unquoted.length > 0 ? unquoted : undefined;
}

function toDate(value: string | null): Date | undefined {
  const cleaned = cleanString(value || "");
  if (!cleaned) return undefined;
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime()) || !Number.isFinite(date.getTime())) return undefined;
  const year = date.getUTCFullYear();
  if (year > 9999 || year < 1000) return undefined;
  return date;
}

function toNumber(value: string | null): number | undefined {
  const cleaned = cleanString(value || "");
  if (!cleaned) return undefined;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function parseValues(insert: string): any[] {
  const valuesPart = insert.substring(insert.indexOf("VALUES") + 6);
  const rows: string[] = [];
  let buffer = "";
  let depth = 0;

  for (const char of valuesPart) {
    if (depth === 0 && (char === "," || char === "\n" || char === "\r" || char === " ")) {
      // skip delimiters between tuples
      continue;
    }

    if (char === "(") depth++;
    if (char === ")") depth--;
    buffer += char;

    if (depth === 0 && buffer.trim().startsWith("(")) {
      rows.push(buffer.replace(/^[,(]+|[);]+$/g, ""));
      buffer = "";
    }
  }

  return rows.map((row) =>
    row
      .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
      .map((v) => (v === "NULL" ? null : v.replace(/^'|'$/g, "").replace(/\\'/g, "'")))
  );
}

/* ------------------ MAIN ------------------ */

async function main() {
  console.log("📥 Reading SQL dump:", SQL_DUMP_PATH);

  const userInserts = extractTableInserts("users");
  const referralInserts = extractTableInserts("referrals");

  console.log(`👤 Found ${userInserts.length} user insert blocks`);
  console.log(`🔗 Found ${referralInserts.length} referral insert blocks`);

  const prismaUserMap = new Map<string, string>();

  /* -------- USERS -------- */

  for (const insert of userInserts) {
    const rows = parseValues(insert);

    for (const r of rows) {
      const [
        id,
        firstname,
        lastname,
        mobile,
        ssc,
        solar_agent,
        gender,
        address,
        city,
        state,
        zip,
        country,
        profile_pic,
        merchant_pic,
        email,
        secondary_email,
        password,
        username,
        referral_link,
        user_type,
        rank,
        activated,
        last_login,
        kyc,
        kyc_pending,
        withdraw_ban,
        youtube_banned,
        card,
        card_type,
        pass_completed,
        community,
        shareholder,
        wallet,
        spendable,
        default_currency,
        palliative,
        cashback,
        student_cashback,
        token,
        mdc,
        shelter,
        shelter_wallet,
        education,
        car,
        business,
        solar,
        legals,
        land,
        meal,
        health,
        created_at,
        updated_at,
        verification_code,
        verified,
        pending_activation,
        reset_token,
        is_part_pay,
        first_pay,
        second_pay,
        third_pay,
        is_vip,
        bpi_upgrade,
        is_shelter,
        vip_pending,
        shelter_pending,
        is_shareholder,
        bpicg,
        level_1_count,
        level_2_count,
        level_3_count,
        level_4_count,
      ] = r;

      const cleanedEmail = cleanString(email);
      const cleanedUsername = cleanString(username);
      const cleanedMobile = cleanString(mobile);
      const cleanedFirst = cleanString(firstname);
      const cleanedLast = cleanString(lastname);
      const cleanedReferral = cleanString(referral_link);
      const cleanedSecondaryEmail = cleanString(secondary_email);
      const cleanedGender = cleanString(gender);
      const cleanedAddress = cleanString(address);
      const cleanedCity = cleanString(city);
      const cleanedState = cleanString(state);
      const cleanedZip = cleanString(zip);
      const cleanedCountry = cleanString(country);
      const cleanedProfilePic = cleanString(profile_pic);
      const cleanedMerchantPic = cleanString(merchant_pic);
      const cleanedKyc = cleanString(kyc);
      const cleanedResetToken = cleanString(reset_token);
      const cleanedVerification = cleanString(verification_code);
      const cleanedUserType = cleanString(user_type);
      const cleanedRank = cleanString(rank);

      const createdAt = toDate(created_at);
      const updatedAt = toDate(updated_at);
      const lastLogin = toDate(last_login);

      const generatedId = randomUUID();
      const legacyId = cleanString(id);
      const numericActivated = toNumber(activated);
      const numericKycPending = toNumber(kyc_pending);
      const numericWithdrawBan = toNumber(withdraw_ban);
      const numericYoutubeBanned = toNumber(youtube_banned);
      const numericPassCompleted = toNumber(pass_completed);
      const numericCommunity = toNumber(community);
      const numericShareholder = toNumber(shareholder);
      const numericWallet = toNumber(wallet);
      const numericSpendable = toNumber(spendable);
      const numericDefaultCurrency = toNumber(default_currency);
      const numericPalliative = toNumber(palliative);
      const numericCashback = toNumber(cashback);
      const numericStudentCashback = toNumber(student_cashback);
      const numericShelterWallet = toNumber(shelter_wallet);
      const numericEducation = toNumber(education);
      const numericCar = toNumber(car);
      const numericBusiness = toNumber(business);
      const numericSolar = toNumber(solar);
      const numericLegals = toNumber(legals);
      const numericLand = toNumber(land);
      const numericMeal = toNumber(meal);
      const numericHealth = toNumber(health);
      const numericVerified = toNumber(verified);
      const numericPendingActivation = toNumber(pending_activation);
      const numericIsVip = toNumber(is_vip);
      const numericIsShelter = toNumber(is_shelter);
      const numericVipPending = toNumber(vip_pending);
      const numericShelterPending = toNumber(shelter_pending);
      const numericIsShareholder = toNumber(is_shareholder);
      const numericLevel1 = toNumber(level_1_count);
      const numericLevel2 = toNumber(level_2_count);
      const numericLevel3 = toNumber(level_3_count);
      const numericLevel4 = toNumber(level_4_count);

      const passwordHash = cleanString(password) || undefined;

      const identifierWhere: Prisma.UserWhereUniqueInput | undefined = legacyId
        ? { legacyId }
        : cleanedEmail
        ? { email: cleanedEmail }
        : cleanedUsername
        ? { username: cleanedUsername }
        : undefined;

      const secondaryMatch = cleanedMobile || cleanedSecondaryEmail || cleanedReferral;

      if (!identifierWhere) {
        console.warn("⚠️ Skipping row with no email/username/mobile", r);
        continue;
      }

      const where = identifierWhere;

      const updateData: Prisma.UserUncheckedUpdateInput = {};
      const createData: Prisma.UserUncheckedCreateInput = { id: generatedId };

      if (legacyId) {
        updateData.legacyId = legacyId;
        createData.legacyId = legacyId;
      }
      if (cleanedFirst) {
        updateData.firstname = cleanedFirst;
        createData.firstname = cleanedFirst;
      }
      if (cleanedLast) {
        updateData.lastname = cleanedLast;
        createData.lastname = cleanedLast;
      }
      if (cleanedEmail) {
        updateData.email = cleanedEmail;
        createData.email = cleanedEmail;
      }
      if (cleanedSecondaryEmail) {
        updateData.secondaryEmail = cleanedSecondaryEmail;
        createData.secondaryEmail = cleanedSecondaryEmail;
      }
      if (cleanedUsername) {
        updateData.username = cleanedUsername;
        createData.username = cleanedUsername;
      }
      if (cleanedMobile) {
        updateData.mobile = cleanedMobile;
        createData.mobile = cleanedMobile;
      }
      if (cleanedReferral) {
        updateData.referralLink = cleanedReferral;
        createData.referralLink = cleanedReferral;
      }
      if (cleanedUserType) {
        updateData.userType = cleanedUserType;
        createData.userType = cleanedUserType;
      }
      if (cleanedRank) {
        updateData.rank = cleanedRank;
        createData.rank = cleanedRank;
      }
      if (cleanedAddress) {
        updateData.address = cleanedAddress;
        createData.address = cleanedAddress;
      }
      if (cleanedCity) {
        updateData.city = cleanedCity;
        createData.city = cleanedCity;
      }
      if (cleanedState) {
        updateData.state = cleanedState;
        createData.state = cleanedState;
      }
      if (cleanedZip) {
        updateData.zip = cleanedZip;
        createData.zip = cleanedZip;
      }
      if (cleanedCountry) {
        updateData.country = cleanedCountry;
        createData.country = cleanedCountry;
      }
      if (cleanedGender) {
        updateData.gender = cleanedGender;
        createData.gender = cleanedGender;
      }
      if (cleanedProfilePic) {
        updateData.profilePic = cleanedProfilePic;
        createData.profilePic = cleanedProfilePic;
      }
      if (passwordHash) {
        updateData.passwordHash = passwordHash;
        createData.passwordHash = passwordHash;
      }
      if (createdAt) {
        updateData.createdAt = createdAt;
        createData.createdAt = createdAt;
      }
      if (updatedAt) {
        updateData.updatedAt = updatedAt;
        createData.updatedAt = updatedAt;
      }
      if (lastLogin) {
        updateData.lastLogin = lastLogin;
        createData.lastLogin = lastLogin;
      }
      if (numericActivated !== undefined) {
        updateData.activated = Boolean(numericActivated);
        createData.activated = Boolean(numericActivated);
      }
      if (cleanedKyc) {
        updateData.kyc = cleanedKyc;
        createData.kyc = cleanedKyc;
      }
      if (numericKycPending !== undefined) {
        updateData.kycPending = numericKycPending;
        createData.kycPending = numericKycPending;
      }
      if (numericWithdrawBan !== undefined) {
        updateData.withdrawBan = numericWithdrawBan;
        createData.withdrawBan = numericWithdrawBan;
      }
      // Fields not present in current schema (e.g., youtubeBanned, passCompleted) are ignored.
      if (numericCommunity !== undefined) {
        updateData.community = numericCommunity;
        createData.community = numericCommunity;
      }
      if (numericShareholder !== undefined) {
        updateData.shareholder = numericShareholder;
        createData.shareholder = numericShareholder;
      }
      if (numericWallet !== undefined) {
        updateData.wallet = numericWallet;
        createData.wallet = numericWallet;
      }
      if (numericSpendable !== undefined) {
        updateData.spendable = numericSpendable;
        createData.spendable = numericSpendable;
      }
      if (numericDefaultCurrency !== undefined) {
        updateData.defaultCurrency = numericDefaultCurrency;
        createData.defaultCurrency = numericDefaultCurrency;
      }
      if (numericPalliative !== undefined) {
        updateData.palliative = numericPalliative;
        createData.palliative = numericPalliative;
      }
      if (numericCashback !== undefined) {
        updateData.cashback = numericCashback;
        createData.cashback = numericCashback;
      }
      if (numericStudentCashback !== undefined) {
        updateData.studentCashback = numericStudentCashback;
        createData.studentCashback = numericStudentCashback;
      }
      if (numericShelterWallet !== undefined) {
        updateData.shelterWallet = numericShelterWallet;
        createData.shelterWallet = numericShelterWallet;
      }
      if (numericEducation !== undefined) {
        updateData.education = numericEducation;
        createData.education = numericEducation;
      }
      if (numericCar !== undefined) {
        updateData.car = numericCar;
        createData.car = numericCar;
      }
      if (numericBusiness !== undefined) {
        updateData.business = numericBusiness;
        createData.business = numericBusiness;
      }
      if (numericSolar !== undefined) {
        updateData.solar = numericSolar;
        createData.solar = numericSolar;
      }
      if (numericLegals !== undefined) {
        updateData.legals = numericLegals;
        createData.legals = numericLegals;
      }
      if (numericLand !== undefined) {
        updateData.land = numericLand;
        createData.land = numericLand;
      }
      if (numericMeal !== undefined) {
        updateData.meal = numericMeal;
        createData.meal = numericMeal;
      }
      if (numericHealth !== undefined) {
        updateData.health = numericHealth;
        createData.health = numericHealth;
      }
      if (cleanedVerification) {
        updateData.verificationCode = cleanedVerification;
        createData.verificationCode = cleanedVerification;
      }
      if (cleanedResetToken) {
        updateData.resetToken = cleanedResetToken;
        createData.resetToken = cleanedResetToken;
      }
      if (numericVerified !== undefined) {
        updateData.verified = Boolean(numericVerified);
        createData.verified = Boolean(numericVerified);
      }
      if (numericPendingActivation !== undefined) {
        updateData.pendingActivation = numericPendingActivation;
        createData.pendingActivation = numericPendingActivation;
      }
      if (numericIsVip !== undefined) {
        updateData.isVip = numericIsVip;
        createData.isVip = numericIsVip;
      }
      if (numericIsShelter !== undefined) {
        updateData.isShelter = numericIsShelter;
        createData.isShelter = numericIsShelter;
      }
      if (numericVipPending !== undefined) {
        updateData.vipPending = numericVipPending;
        createData.vipPending = numericVipPending;
      }
      if (numericShelterPending !== undefined) {
        updateData.shelterPending = numericShelterPending;
        createData.shelterPending = numericShelterPending;
      }
      if (numericIsShareholder !== undefined) {
        updateData.isShareholder = numericIsShareholder;
        createData.isShareholder = numericIsShareholder;
      }
      if (numericLevel1 !== undefined) {
        updateData.level1Count = numericLevel1;
        createData.level1Count = numericLevel1;
      }
      if (numericLevel2 !== undefined) {
        updateData.level2Count = numericLevel2;
        createData.level2Count = numericLevel2;
      }
      if (numericLevel3 !== undefined) {
        updateData.level3Count = numericLevel3;
        createData.level3Count = numericLevel3;
      }
      if (numericLevel4 !== undefined) {
        updateData.level4Count = numericLevel4;
        createData.level4Count = numericLevel4;
      }

      let user;
      try {
        user = await prisma.user.upsert({
          where,
          update: updateData,
          create: createData,
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;

        let fallback = null;
        if (cleanedEmail) {
          fallback = await prisma.user.findUnique({ where: { email: cleanedEmail } });
        }
        if (!fallback && cleanedUsername) {
          fallback = await prisma.user.findUnique({ where: { username: cleanedUsername } });
        }

        if (fallback) {
          user = await prisma.user.update({ where: { id: fallback.id }, data: updateData });
        } else {
          const uniqueUsername = cleanedUsername ? `${cleanedUsername}-${Math.random().toString(36).slice(2, 6)}` : undefined;
          if (uniqueUsername) {
            updateData.username = uniqueUsername;
            createData.username = uniqueUsername;
          }

          const retryWhere = cleanedEmail ? { email: cleanedEmail } : uniqueUsername ? { username: uniqueUsername } : where;
          user = await prisma.user.upsert({ where: retryWhere, update: updateData, create: createData });
        }
      }

      if (cleanedEmail) prismaUserMap.set(cleanedEmail, user.id);
      if (cleanedUsername) prismaUserMap.set(cleanedUsername, user.id);
    }
  }

  /* -------- REFERRALS -------- */

  for (const insert of referralInserts) {
    const rows = parseValues(insert);

    for (const r of rows) {
      const [id, referrerEmail, referredEmail] = r;

      const referrerId = prismaUserMap.get(cleanString(referrerEmail) || "");
      const referredId = prismaUserMap.get(cleanString(referredEmail) || "");

      if (!referrerId || !referredId) continue;

      await prisma.user.update({
        where: { id: referredId },
        data: { referredBy: referrerId },
      });
    }
  }

  console.log("✅ Migration completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
