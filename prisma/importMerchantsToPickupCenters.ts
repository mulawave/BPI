import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

/**
 * One-off importer: parses merchants from legacy_sql/beepagro_beepagro.sql and upserts into Prisma PickupCenter.
 * Usage: ts-node prisma/importMerchantsToPickupCenters.ts
 */
async function main() {
  const sqlPath = path.join(process.cwd(), "legacy_sql", "beepagro_beepagro.sql");
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL dump not found at ${sqlPath}`);
  }

  const raw = fs.readFileSync(sqlPath, "utf8");
  const insertStart = raw.indexOf("INSERT INTO `merchants`");
  if (insertStart === -1) {
    throw new Error("INSERT INTO `merchants` not found in dump");
  }

  const insertSection = raw.slice(insertStart, raw.indexOf(";", insertStart));

  const tupleRegex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)/g;

  const centers: Array<{
    legacyId: number;
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    contactPhone?: string;
    contactName?: string;
    isActive: boolean;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = tupleRegex.exec(insertSection)) !== null) {
    const legacyId = Number(match[1]);
    // const userId = Number(match[2]); // unused
    const name = match[3];
    const addressLine1 = match[4];
    const city = match[5];
    const state = match[6];
    const country = match[7];
    const phone = match[8];
    const email = match[9];
    const link = match[10];
    // const datejoined = match[11];
    const status = match[12];

    centers.push({
      legacyId,
      name,
      addressLine1,
      city,
      state,
      country,
      contactPhone: phone || undefined,
      contactName: email || link || undefined,
      isActive: status?.toLowerCase() === "active",
    });
  }

  if (centers.length === 0) {
    throw new Error("No merchant rows parsed");
  }

  console.log(`Parsed ${centers.length} merchant rows. Upserting into PickupCenter…`);

  for (const c of centers) {
    await prisma.pickupCenter.upsert({
      where: { id: `legacy-merchant-${c.legacyId}` },
      update: {
        name: c.name,
        addressLine1: c.addressLine1,
        addressLine2: undefined,
        city: c.city,
        state: c.state,
        country: c.country,
        contactName: c.contactName,
        contactPhone: c.contactPhone,
        isActive: c.isActive,
      },
      create: {
        id: `legacy-merchant-${c.legacyId}`,
        name: c.name,
        addressLine1: c.addressLine1,
        addressLine2: undefined,
        city: c.city,
        state: c.state,
        country: c.country,
        contactName: c.contactName,
        contactPhone: c.contactPhone,
        isActive: c.isActive,
      },
    });
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
