/*
  One-time, run-once-at-release script (corporate decision, follow-up Q8c,
  06/10/2026): every member who is ALREADY expired when this update goes
  live gets a fresh 15-day access grace and 7-day commission grace counted
  from release day, instead of their real (possibly long-past) expiry date.

  It does this by setting User.membershipGraceAnchorAt to "now" for every
  member who:
    - has an active membership package,
    - has already expired (membershipExpiresAt < now),
    - does not already have a grace anchor set.

  Idempotent: re-running it is a no-op for members it already touched (the
  WHERE clause excludes rows with membershipGraceAnchorAt already set), and
  it never touches members who are not yet expired — their grace is simply
  counted from their real expiry date when it happens, as normal.

  Usage:
    npx tsx scripts/resetGraceForExpiredMembers.ts              # report only (dry run)
    npx tsx scripts/resetGraceForExpiredMembers.ts --apply      # actually set the anchor
*/

import { prisma } from "@/lib/prisma";

async function main() {
  const apply = process.argv.includes("--apply");
  const now = new Date();

  const candidates = await prisma.user.findMany({
    where: {
      activeMembershipPackageId: { not: null },
      membershipExpiresAt: { lt: now },
      membershipGraceAnchorAt: null,
    },
    select: { id: true, email: true, membershipExpiresAt: true },
  });

  console.log(`Found ${candidates.length} already-expired member(s) with no grace anchor set.`);
  if (candidates.length > 0) {
    console.log("Sample (up to 10):");
    for (const c of candidates.slice(0, 10)) {
      console.log(`  ${c.email ?? c.id} — expired ${c.membershipExpiresAt?.toISOString()}`);
    }
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to set the grace anchor to now for these members.");
    return;
  }

  const result = await prisma.user.updateMany({
    where: {
      activeMembershipPackageId: { not: null },
      membershipExpiresAt: { lt: now },
      membershipGraceAnchorAt: null,
    },
    data: { membershipGraceAnchorAt: now },
  });

  console.log(`\nSet membershipGraceAnchorAt = ${now.toISOString()} for ${result.count} member(s).`);
  console.log("Their 15-day access grace and 7-day commission grace now count from today.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
