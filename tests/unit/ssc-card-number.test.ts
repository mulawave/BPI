/**
 * The Healthcare Card number is the member's SSC — there is only one number.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { generateSscCode, ensureMemberSsc } from "@/server/services/ssc.service";
import { findHealthcareCardBySsc } from "@/server/services/healthcareCard.service";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("SSC generation", () => {
  it("produces XXX-XXXX-XXX codes", () => {
    for (let i = 0; i < 50; i++) assert.match(generateSscCode(), /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/);
  });

  it("uses a cryptographically secure generator", () => {
    const src = read("server/services/ssc.service.ts");
    assert.match(src, /randomInt/);
    assert.doesNotMatch(src, /Math\.random/);
    assert.doesNotMatch(read("server/trpc/router/admin.ts"), /function generateSscCode/);
  });
});

describe("ensureMemberSsc", () => {
  it("keeps a member's existing SSC", async () => {
    let updated = false;
    const db = {
      user: {
        async findUnique() { return { ssc: "ABC-1234-XYZ" }; },
        async updateMany() { updated = true; return { count: 1 }; },
      },
    } as any;
    assert.equal(await ensureMemberSsc(db, "u1"), "ABC-1234-XYZ");
    assert.equal(updated, false);
  });

  it("assigns a new SSC only when the member has none", async () => {
    let where: any = null;
    const db = {
      user: {
        async findUnique() { return { ssc: null }; },
        async findFirst() { return null; },
        async updateMany(args: any) { where = args.where; return { count: 1 }; },
      },
    } as any;
    const ssc = await ensureMemberSsc(db, "u1");
    assert.match(ssc, /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/);
    assert.deepEqual(where, { id: "u1", ssc: null });
  });
});

describe("Healthcare Card uses the member SSC as its card number", () => {
  it("finds the card through the member's SSC, case-insensitively", async () => {
    let ssc: string | null = null;
    const db = {
      user: { async findFirst({ where }: any) { ssc = where.ssc; return { id: "u1" }; } },
      healthcareCard: { async findUnique({ where }: any) { return { id: "c1", userId: where.userId }; } },
    } as any;
    const card = await findHealthcareCardBySsc(db, "  abc-1234-xyz ");
    assert.equal(ssc, "ABC-1234-XYZ");
    assert.equal(card?.userId, "u1");
  });

  it("the card has no separate number of its own", () => {
    const schema = read("prisma/schema.prisma");
    const model = schema.slice(schema.indexOf("model HealthcareCard {"), schema.indexOf("}", schema.indexOf("model HealthcareCard {")));
    assert.doesNotMatch(model, /sscCode/);
    assert.match(read("prisma/migrations/20261012090000_healthcare_card_number_is_ssc/migration.sql"), /DROP COLUMN IF EXISTS "sscCode"/);
  });
});
