/*
 * Legacy transactions migrator
 * - Reads legacy MySQL dump (beepagro_beepagro.sql)
 * - Extracts transaction_history and withdrawal_history inserts
 * - Maps to current Prisma Transaction / TransactionHistory / WithdrawalHistory
 * - Skips & logs unmapped users, zero/negative amounts
 * - Dry run by default; use --write to persist
 */

import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

type LegacyTxnRow = {
  id: number;
  user_id: number;
  order_id: number;
  transaction_type: string;
  amount: string;
  description: string | null;
  transaction_date: string;
  status: string;
};

type LegacyWithdrawalRow = {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
};

type ParsedTuple = (string | number | null)[];

function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1];
const isWrite = args.includes("--write");
const sqlFile = fileArg || path.join(process.cwd(), "legacy_sql", "beepagro_beepagro.sql");

const logDir = path.join(process.cwd(), "logs");
const reportPath = path.join(logDir, `legacy-import-report-${Date.now()}.json`);

function ensureLogDir() {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
}

function parseValuesSection(valuesText: string): ParsedTuple[] {
  const rows: ParsedTuple[] = [];
  let current: (string | number | null)[] = [];
  let token = "";
  let inString = false;
  let escapeNext = false;

  const flushToken = () => {
    const trimmed = token.trim();
    if (!inString) {
      if (trimmed.toLowerCase() === "null") current.push(null);
      else if (!Number.isNaN(Number(trimmed))) current.push(Number(trimmed));
      else current.push(trimmed);
    } else {
      current.push(token);
    }
    token = "";
  };

  for (let i = 0; i < valuesText.length; i++) {
    const ch = valuesText[i];
    if (escapeNext) {
      token += ch;
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }
    if (ch === "'") {
      inString = !inString;
      continue;
    }
    if (!inString && ch === ",") {
      flushToken();
      continue;
    }
    if (!inString && ch === "(") {
      current = [];
      continue;
    }
    if (!inString && ch === ")") {
      flushToken();
      rows.push(current);
      current = [];
      continue;
    }
    token += ch;
  }
  return rows;
}

function extractInsertTuples(sql: string, table: string): ParsedTuple[] {
  const regex = new RegExp(`INSERT INTO\\s+\\\`${table}\\\`[^]*?VALUES\\s*([^;]+);`, "gi");
  let match: RegExpExecArray | null;
  const tuples: ParsedTuple[] = [];
  while ((match = regex.exec(sql)) !== null) {
    const valuesPart = match[1];
    tuples.push(...parseValuesSection(valuesPart));
  }
  return tuples;
}

function normalizeStatus(raw: string): "completed" | "pending" | "failed" {
  const s = raw.toLowerCase();
  if (s.includes("success")) return "completed";
  if (s.includes("fail") || s.includes("reject")) return "failed";
  return "pending";
}

function mapTransactionType(legacyType: string, description: string | null): string {
  const t = legacyType.toLowerCase();
  const desc = (description || "").toLowerCase();

  if (desc.includes("withdrawal")) return "WITHDRAWAL_CASH";
  if (desc.includes("vat")) return "VAT";
  if (desc.includes("service charge")) return "WITHDRAWAL_FEE";
  if (desc.includes("membership") || desc.includes("subscription") || desc.includes("upgrade")) return "MEMBERSHIP_PAYMENT";
  if (desc.includes("deposit") || desc.includes("funding") || desc.includes("topup")) return "DEPOSIT";
  if (desc.includes("convert to contact")) return "CONVERT_TO_CONTACT";
  if (desc.includes("referral") || desc.includes("reward")) return "REFERRAL_REWARD";
  if (t === "credit") return "DEPOSIT";
  if (t === "debit") return "WITHDRAWAL_CASH";
  return legacyType.toUpperCase();
}

async function main() {
  console.log(`Reading legacy SQL from ${sqlFile}`);
  const sql = fs.readFileSync(sqlFile, "utf8");

  const transactionTuples = extractInsertTuples(sql, "transaction_history");
  const withdrawalTuples = extractInsertTuples(sql, "withdrawal_history");

  const legacyTransactions: LegacyTxnRow[] = transactionTuples.map((row) => ({
    id: row[0] as number,
    user_id: row[1] as number,
    order_id: row[2] as number,
    transaction_type: String(row[3] ?? ""),
    amount: String(row[4] ?? "0"),
    description: row[5] === null ? null : String(row[5]),
    transaction_date: String(row[6] ?? ""),
    status: String(row[7] ?? "pending"),
  }));

  const legacyWithdrawals: LegacyWithdrawalRow[] = withdrawalTuples.map((row) => ({
    id: row[0] as number,
    user_id: row[1] as number,
    description: String(row[2] ?? ""),
    amount: Number(row[3] ?? 0),
    currency: String(row[4] ?? "NGN"),
    status: String(row[5] ?? "pending"),
    date: String(row[6] ?? ""),
  }));

  console.log(`Parsed legacy rows: transactions=${legacyTransactions.length}, withdrawals=${legacyWithdrawals.length}`);

  const users = await prisma.user.findMany({ select: { id: true, legacyId: true } });
  const userMap = new Map<string, string>();
  users.forEach((u) => {
    if (u.legacyId) userMap.set(u.legacyId, u.id);
  });

  const issues = {
    unmappedUsers: new Set<number>(),
    skippedZeroOrNegative: [] as number[],
    invalidDate: [] as number[],
  };

  type PreparedTransaction = {
    id: string;
    legacyId: number;
    userId: string;
    transactionType: string;
    amount: number;
    description: string;
    status: string;
    reference: string | null;
    createdAt: Date;
    walletType: string;
    orderId: number | null;
  };

  const txData: PreparedTransaction[] = legacyTransactions
    .map((tx) => {
      const userId = userMap.get(String(tx.user_id));
      if (!userId) {
        issues.unmappedUsers.add(tx.user_id);
        return null;
      }
      const amt = Number(tx.amount);
      if (!amt || amt <= 0) {
        issues.skippedZeroOrNegative.push(tx.id);
        return null;
      }
      const status = normalizeStatus(tx.status);
      const type = mapTransactionType(tx.transaction_type, tx.description);
      const createdAt = new Date(tx.transaction_date);
      const safeDate = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;
      if (Number.isNaN(createdAt.getTime())) {
        issues.invalidDate.push(tx.id);
      }
      return {
        id: `legacy-tx-${tx.id}`,
        legacyId: tx.id,
        userId,
        transactionType: type,
        amount: amt,
        description: tx.description || "",
        status,
        reference: null,
        createdAt: safeDate,
        walletType: "main",
        orderId: tx.order_id ?? null,
      };
    })
    .filter(Boolean) as PreparedTransaction[];

  const whData: Prisma.WithdrawalHistoryCreateManyInput[] = legacyWithdrawals
    .map((w) => {
      const userId = userMap.get(String(w.user_id));
      if (!userId) {
        issues.unmappedUsers.add(w.user_id);
        return null;
      }
      if (!w.amount || w.amount <= 0) {
        issues.skippedZeroOrNegative.push(w.id);
        return null;
      }
      const status = normalizeStatus(w.status);
      const date = new Date(w.date);
      return {
        id: `legacy-wh-${w.id}`,
        userId,
        description: w.description,
        amount: w.amount,
        currency: w.currency,
        status,
        date: Number.isNaN(date.getTime()) ? new Date() : date,
      } satisfies Prisma.WithdrawalHistoryCreateManyInput;
    })
    .filter(Boolean) as Prisma.WithdrawalHistoryCreateManyInput[];

  console.log(`Prepared rows -> Transaction: ${txData.length}, WithdrawalHistory: ${whData.length}`);

  ensureLogDir();
  const report = {
    file: sqlFile,
    isWrite,
    parsed: { transactions: legacyTransactions.length, withdrawals: legacyWithdrawals.length },
    prepared: { transactions: txData.length, withdrawals: whData.length },
    unmappedUsers: Array.from(issues.unmappedUsers),
    skippedZeroOrNegative: issues.skippedZeroOrNegative,
    invalidDate: issues.invalidDate,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Report written to ${reportPath}`);

  if (!isWrite) {
    console.log("Dry run complete. Re-run with --write to persist.");
    return;
  }

  // Insert TransactionHistory backup
  const txHistoryData = txData.map((t) => ({
    id: `legacy-th-${t.legacyId}`,
    userId: t.userId,
    orderId: t.orderId,
    transactionType: t.transactionType,
    amount: String(t.amount),
    description: t.description,
    transactionDate: t.createdAt,
    status: t.status,
  }));

  await prisma.$transaction([
    prisma.transaction.createMany({ data: txData.map(({ orderId, legacyId, ...rest }) => rest), skipDuplicates: true }),
    prisma.transactionHistory.createMany({ data: txHistoryData, skipDuplicates: true }),
    prisma.withdrawalHistory.createMany({ data: whData, skipDuplicates: true }),
  ]);

  console.log("Write complete.");
}

main()
  .catch((err) => {
    console.error("Migration failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });