# Database Seeder Pipeline Documentation

## Overview
This seeder pipeline preserves your current database state and allows you to restore it at any time during development, testing, or deployment.

## Generated Files (Last Export: 2026-01-09)

### 1. System Data Backup
**File:** `prisma/seed-data/systemDataBackup.ts`
- **Purpose:** Complete backup of all system configuration data
- **Size:** 714 lines, 106 total records
- **Contains:**
  - 6 Membership Packages (Regular, Regular Plus, Standard, Premium, etc.)
  - 4 Admin Settings (feature toggles: enableEpcEpp, enableSolarAssessment, enableBestDeals, enablePalliativeTracking)
  - 2 System Wallets
  - 1 BPT Conversion Rate
  - 4 YouTube Plans
  - 8 Third Party Platforms
  - 6 Palliative Options
  - 0 Community Features (not yet configured)
  - 0 Training Courses (not yet configured)
  - Leadership & Investors Pools

### 2. User Summary Report
**File:** `prisma/seed-data/userSummary.md`
- **Purpose:** Reference document listing current users and statistics
- **Total Users:** 5
  - 1 Super Admin (richardobroh@gmail.com)
  - 1 Member (delightstores50@gmail.com)
  - 3 Regular Users
- **Statistics:**
  - Activated: 5
  - Verified: 0
  - With Membership: 5
  - With Referrer: 0
  - Total Referrals: 3
  - Total Transactions: 46
  - Total Notifications: 21

### 3. Restore Script
**File:** `prisma/seedFromBackup.ts`
- **Purpose:** Automated script to restore database from backup
- **Features:**
  - Upserts all system data (won't duplicate)
  - Preserves existing records
  - Safe to run multiple times
  - Progress logging with emojis

### 4. Export Script
**File:** `scripts/exportDatabaseToSeed.ts`
- **Purpose:** Export current database state to seed files
- **Features:**
  - Exports all system configuration
  - Creates user summary (for reference only, no sensitive data)
  - Generates TypeScript seed files
  - Includes statistics and counts

## NPM Scripts

```bash
# Export current database to seed files
npm run db:export
# or
npm run db:backup

# Restore database from backup
npm run db:restore

# Run standard seed (initial setup)
npm run db:seed

# Reset database and reseed
npm run db:reset
```

## Usage Workflow

### Initial Setup (New Environment)
```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma db push

# 3. Seed with initial data
npm run db:seed
```

### Before Major Changes (Create Backup)
```bash
# Export current database state
npm run db:export

# This creates:
# - prisma/seed-data/systemDataBackup.ts (system config)
# - prisma/seed-data/userSummary.md (user reference)
# - prisma/seedFromBackup.ts (restore script)
```

### After Testing/Development (Restore Backup)
```bash
# Restore from last backup
npm run db:restore

# This will:
# - Restore all membership packages
# - Restore admin settings
# - Restore system wallets
# - Restore BPT conversion rates
# - Restore YouTube plans
# - Restore third-party platforms
# - Restore palliative options
# - Restore community features
# - Restore leadership & investor pools
```

### Complete Database Reset
```bash
# Reset database and apply fresh seed
npm run db:reset

# Warning: This will DELETE all data and reseed from scratch
```

## What Gets Backed Up

✅ **Included in Backup:**
- Membership Packages (pricing, features, rewards)
- Admin Settings (feature toggles)
- System Wallets (BuyBack, BurnWallet)
- BPT Conversion Rates
- YouTube Plans
- Third Party Platforms (Facebook, Twitter, etc.)
- Palliative Options (Education, Health, etc.)
- Community Features
- Leadership Pools
- Investors Pools

❌ **Excluded from Backup (User Data):**
- Users (passwords, personal info)
- User Wallets & Balances
- Transactions
- Referrals
- Notifications
- User Memberships
- Payments
- Orders

> **Why?** User data contains sensitive information and is dynamic. The backup focuses on system configuration that can be safely restored across environments.

## Current Database State (as of last export)

```
┌─────────────────────┬────────┐
│ Table               │ Count  │
├─────────────────────┼────────┤
│ users               │ 5      │
│ membershipPackages  │ 6      │
│ adminSettings       │ 4      │
│ youtubePlans        │ 4      │
│ referrals           │ 3      │
│ notifications       │ 21     │
│ transactions        │ 46     │
│ wallets             │ 2      │
│ bptConversionRates  │ 1      │
│ thirdPartyPlatforms │ 8      │
│ palliativeOptions   │ 6      │
│ trainingCourses     │ 0      │
│ communityFeatures   │ 0      │
└─────────────────────┴────────┘
```

## Example: Membership Packages Backed Up

1. **Regular** - ₦10,000 (entry level)
2. **Regular Plus** - ₦50,000 (enhanced rewards)
3. **Standard** - ₦100,000 (standard tier)
4. **Premium** - ₦250,000 (premium benefits)
5. **VIP** - ₦500,000 (VIP access)
6. **Elite** - ₦1,000,000 (elite tier)

Each package includes complete reward structure for 4 referral levels (cash, BPT, palliative).

## Admin Settings Backed Up

1. **enableEpcEpp** - EPC & EPP Card toggle (default: false)
2. **enableSolarAssessment** - Solar Assessment Card toggle (default: false)
3. **enableBestDeals** - Best Deals Card toggle (default: false)
4. **enablePalliativeTracking** - Palliative tracking feature (default: true)

## Best Practices

1. **Export before Admin Panel work** - The admin panel will modify system settings extensively
2. **Export before migrations** - Always create backup before schema changes
3. **Export after configuration** - When you add new membership packages or settings
4. **Version control backups** - Commit `systemDataBackup.ts` to git for team sharing
5. **Test restores** - Periodically test restore process in development

## Troubleshooting

### Export fails with "Cannot find module"
```bash
# Ensure Prisma client is generated
npx prisma generate
```

### Restore creates duplicates
```bash
# The restore script uses upsert, so duplicates shouldn't occur.
# If they do, check unique constraints in schema.prisma
```

### Missing data after restore
```bash
# User data is not included in backups by design.
# Only system configuration is restored.
```

## Integration with Admin Panel (Phase 1)

When you begin admin panel development:

1. **Before Phase 1:** Run `npm run db:export` to backup current state
2. **During Development:** Test admin features freely
3. **If Issues Arise:** Run `npm run db:restore` to reset configuration
4. **After Testing:** Run `npm run db:export` again to capture new admin settings

This seeder pipeline ensures you can safely develop the admin panel without fear of losing your current system configuration.

---

**Last Updated:** January 9, 2026  
**Database Schema Version:** 20260106233303 (User Bank Details)  
**Total Migrations:** 7  
**Database Status:** ✅ Synchronized
