# User Migration Guide

## Overview
This guide walks you through migrating users from the legacy MySQL database (SQL dump) to the new Prisma PostgreSQL database.

## Prerequisites

1. **Database Connection**: Ensure your `.env.local` has valid PostgreSQL connection strings:
   ```env
   DATABASE_URL="postgresql://..."
   POSTGRES_URL="postgresql://..."
   ```

2. **Prisma Schema**: Push schema to ensure your database is in sync:
  ```bash
  npx prisma db push
  ```

3. **SQL Dump**: The SQL dump file should be at:
   ```
   z:\bpi\v3\bpi_main\sql_dump\beepagro_beepagro.sql
   ```

## Migration Script

The migration script (`prisma/migrateUsers.ts`) performs the following:

### 1. **Parsing**
- Reads the SQL dump file
- Extracts `INSERT INTO users` statements
- Parses all user records

### 2. **Transformation**
Maps SQL fields to Prisma schema:

| SQL Field | Prisma Field | Notes |
|-----------|--------------|-------|
| `id` | `legacyId` | Original ID preserved as string |
| - | `id` | New UUID generated |
| `firstname` + `lastname` | `name` | Combined full name |
| `password` | `passwordHash` | bcrypt hash (compatible) |
| `activated` (0/1) | `activated` (boolean) | Converted |
| `wallet`, `spendable`, etc. | Float fields | Decimal → Float |
| `created_at` | `createdAt` | Timestamp parsed |

### 3. **Batch Insertion**
- Inserts users in batches of 100
- Handles errors gracefully
- Generates detailed error log

## Running the Migration

### Step 1: Compile TypeScript
```bash
npx tsx prisma/migrateUsers.ts
```

Or compile first:
```bash
npx tsc prisma/migrateUsers.ts --outDir prisma/compiled
node prisma/compiled/migrateUsers.js
```

### Step 2: Monitor Progress
The script will show:
- Parsing progress
- Batch processing status
- Success/error counts
- Final summary

### Step 3: Review Results
Check the migration summary:
```
✅ Successfully migrated: X users
❌ Failed to migrate: Y users
```

If errors occurred, review `migration-errors.json` for details.

## Common Issues & Solutions

### Issue: Duplicate Email/Username
**Error**: `Unique constraint failed on the fields: (email)`

**Solution**: The SQL dump may have duplicate emails. Options:
1. Clean duplicates in SQL before migration
2. Modify script to skip duplicates
3. Append suffix to duplicate emails (e.g., `user+1@example.com`)

### Issue: Invalid Timestamps
**Error**: `Invalid time value`

**Solution**: Some legacy timestamps may be `'0000-00-00 00:00:00'`. The script should handle this, but you can add fallback:
```typescript
createdAt: isValidDate(sqlUser.created_at) ? new Date(sqlUser.created_at) : new Date(),
```

### Issue: Password Hash Incompatibility
**Error**: Users can't log in after migration

**Solution**: 
- SQL uses `$2y$` (PHP bcrypt)
- Node.js bcrypt uses `$2a$` or `$2b$`
- Most libraries handle this, but test login after migration
- May need to replace `$2y$` → `$2a$` in script

### Issue: Referral Links Need Updating
**Problem**: Referral links contain legacy MD5 hashes

**Solution**: Run a post-migration script to regenerate referral links based on new UUIDs:
```typescript
// After migration
await prisma.user.updateMany({
  data: {
    referralLink: // Generate new hash from new UUID
  }
});
```

## Post-Migration Tasks

### 1. Verify User Count
```sql
-- In PostgreSQL
SELECT COUNT(*) FROM "User";
```

Compare with:
```sql
-- Original MySQL count
SELECT COUNT(*) FROM users;
```

### 2. Test Authentication
- Try logging in with migrated users
- Verify password hashes work
- Check email verification status

### 3. Update Referral Relations
If your system tracks referrals, you'll need a second pass to link them:

```typescript
// prisma/migrateReferrals.ts
// Map legacy referral_link → new user IDs
// Update User.referredBy field
```

### 4. Migrate Related Data
After users are migrated, migrate related tables:
- Wallets/Transactions
- Memberships
- Notifications
- etc.

Use the `legacyId` field to maintain relationships.

## Rollback

If migration fails, you can delete all migrated users:

```typescript
// CAUTION: This deletes all users!
await prisma.user.deleteMany({
  where: {
    legacyId: {
      not: null // Delete only migrated users
    }
  }
});
```

## Validation Queries

After migration, run these to validate:

```sql
-- Check for users without legacy IDs (should be 0 or only new registrations)
SELECT COUNT(*) FROM "User" WHERE "legacyId" IS NULL;

-- Check for duplicate emails
SELECT email, COUNT(*) FROM "User" GROUP BY email HAVING COUNT(*) > 1;

-- Verify wallet balances migrated
SELECT SUM(wallet), SUM(spendable), SUM(palliative) FROM "User";

-- Check user types distribution
SELECT "userType", COUNT(*) FROM "User" GROUP BY "userType";
```

## Support

If you encounter issues:
1. Check `migration-errors.json` for error details
2. Review database constraints in `schema.prisma`
3. Ensure all required fields have values or defaults
4. Test with a small subset first (limit users in script)

## Next Steps

After successful user migration:
1. ✅ Migrate referral relationships
2. ✅ Migrate wallet transactions
3. ✅ Migrate memberships
4. ✅ Migrate notifications
5. ✅ Update application to use new auth system
6. ✅ Archive legacy database
