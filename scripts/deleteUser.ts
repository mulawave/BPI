import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function requireDevOrTest() {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    throw new Error('Refusing to run in production (NODE_ENV=production).');
  }
}

function hasYesFlag(args: string[]) {
  return args.includes('--yes') || args.includes('--force');
}

function quoteIdent(ident: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`Unsafe identifier: ${ident}`);
  }
  return `"${ident}"`;
}

async function deleteByColumn(options: {
  table: string;
  column: string;
  value: string;
}) {
  const tableSql = quoteIdent(options.table);
  const columnSql = quoteIdent(options.column);
  const sql = `DELETE FROM ${tableSql} WHERE ${columnSql} = $1`;
  return prisma.$executeRawUnsafe(sql, options.value);
}

async function deleteUser(email: string) {
  try {
    requireDevOrTest();

    console.log(`🔍 Looking for user with email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return;
    }

    console.log(`👤 Found user: ${user.firstname} ${user.lastname} (${user.email})`);
    console.log(`🗑️  Deleting all related data...`);

    // Detach references that are NOT cascade, to avoid deleting other users' records.
    // User.sponsorId is onDelete: NoAction
    const detachedSponsors = await prisma.user.updateMany({
      where: { sponsorId: user.id },
      data: { sponsorId: null },
    });
    if (detachedSponsors.count > 0) {
      console.log(`✓ Detached sponsorId from ${detachedSponsors.count} user(s)`);
    }

    // ThirdPartyRegistration.referredByUserId is onDelete: SetNull
    try {
      const detachedReferrals = await prisma.thirdPartyRegistration.updateMany({
        where: { referredByUserId: user.id },
        data: { referredByUserId: null },
      });
      if (detachedReferrals.count > 0) {
        console.log(`✓ Detached referredByUserId from ${detachedReferrals.count} third-party registration(s)`);
      }
    } catch {
      // If the model/table doesn't exist in this DB, ignore.
    }

    // Delete referrals that directly reference this user (relationship rows).
    try {
      const deletedReferrals = await prisma.referral.deleteMany({
        where: { OR: [{ referrerId: user.id }, { referredId: user.id }] },
      });
      if (deletedReferrals.count > 0) {
        console.log(`✓ Deleted ${deletedReferrals.count} referral(s)`);
      }
    } catch {
      // ignore
    }

    // EmpowermentPackage references User via sponsorId/beneficiaryId with no onDelete specified.
    // We delete packages that reference this user to unblock user deletion.
    try {
      const empowermentPackages = await prisma.empowermentPackage.findMany({
        where: {
          OR: [{ sponsorId: user.id }, { beneficiaryId: user.id }],
        },
        select: { id: true },
      });

      if (empowermentPackages.length > 0) {
        const empowermentPackageIds = empowermentPackages.map((p) => p.id);
        try {
          const deletedEmpowermentTx = await prisma.empowermentTransaction.deleteMany({
            where: { empowermentPackageId: { in: empowermentPackageIds } },
          });
          if (deletedEmpowermentTx.count > 0) {
            console.log(`✓ Deleted ${deletedEmpowermentTx.count} empowerment transaction(s)`);
          }
        } catch {
          // ignore
        }

        const deletedEmpowermentPackages = await prisma.empowermentPackage.deleteMany({
          where: { id: { in: empowermentPackageIds } },
        });
        console.log(`✓ Deleted ${deletedEmpowermentPackages.count} empowerment package(s)`);
      }
    } catch {
      // ignore
    }

    // Verification tokens are keyed by email identifier
    if (user.email) {
      try {
        const deletedTokens = await prisma.verificationToken.deleteMany({
          where: { identifier: user.email },
        });
        if (deletedTokens.count > 0) {
          console.log(`✓ Deleted ${deletedTokens.count} verification token(s)`);
        }
      } catch {
        // ignore
      }
    }

    // Dynamic cleanup: delete any row in any table that has a string user reference column.
    // This keeps the script resilient to schema changes.
    const userRefColumns = ['userId', 'createdBy', 'referrerId', 'referredId'] as const;
    const refColsSql = userRefColumns.map((c) => `'${c}'`).join(',');
    const refs = (await prisma.$queryRawUnsafe<
      Array<{ table_name: string; column_name: string; data_type: string }>
    >(
      `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN (${refColsSql})
        AND data_type IN ('text', 'character varying', 'uuid')
      ORDER BY table_name, column_name
      `,
    )) ?? [];

    const deletions = refs
      .filter((r) => r.table_name !== 'User')
      .map((r) => ({ table: r.table_name, column: r.column_name }));

    const maxPasses = 6;
    const failedKeys = new Set<string>();

    for (let pass = 1; pass <= maxPasses; pass++) {
      let failuresThisPass = 0;
      let deletedThisPass = 0;
      failedKeys.clear();

      for (const del of deletions) {
        const key = `${del.table}.${del.column}`;
        try {
          const count = await deleteByColumn({
            table: del.table,
            column: del.column,
            value: user.id,
          });
          deletedThisPass += Number(count ?? 0);
        } catch (err) {
          failuresThisPass += 1;
          failedKeys.add(key);
        }
      }

      console.log(
        `✓ Cleanup pass ${pass}/${maxPasses}: deleted ${deletedThisPass} row(s)` +
          (failuresThisPass > 0 ? `, ${failuresThisPass} operation(s) deferred` : ''),
      );

      if (failuresThisPass === 0) break;
    }

    // Finally, delete the user (should now be unblocked)
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log('✓ Deleted user');

    console.log(`✅ Successfully deleted user and terminated all sessions: ${email}`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx tsx scripts/deleteUser.ts <email> --yes');
  process.exit(1);
}

if (!hasYesFlag(args) && process.env.BPI_DB_WIPE_CONFIRM !== 'DELETE_USER_DATA') {
  console.error('❌ Refusing to delete without confirmation.');
  console.log('Set env var BPI_DB_WIPE_CONFIRM=DELETE_USER_DATA or pass --yes');
  process.exit(1);
}

deleteUser(email)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
