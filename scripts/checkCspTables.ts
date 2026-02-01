/*
  Check existence of CSP tables in the connected database.
  Usage: npx tsx scripts/checkCspTables.ts
*/
import { prisma } from '@/lib/prisma';

async function exists(quotedName: string) {
  const [row] = await prisma.$queryRaw<{ present: string | null }[]>`
    SELECT to_regclass(${`public.${quotedName}`}) as present
  `;
  return row?.present !== null;
}

async function main() {
  const tables = [
    '"CspSupportRequest"',
    '"CspContribution"',
    '"CspBroadcastExtension"',
  ];
  const results: Record<string, boolean> = {};
  for (const t of tables) {
    try {
      results[t] = await exists(t);
    } catch (e) {
      results[t] = false;
    }
  }
  console.log('CSP table presence:', results);
}

main().catch((e) => {
  console.error('checkCspTables failed:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
