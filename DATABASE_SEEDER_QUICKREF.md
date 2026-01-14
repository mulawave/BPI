# 🌱 Database Seeder Quick Reference

## Commands

```bash
# 📤 Export/Backup current database
npm run db:export

# 📥 Restore from backup
npm run db:restore

# 🌱 Fresh seed (initial setup)
npm run db:seed

# ⚠️ Complete reset (DELETES ALL DATA)
npm run db:reset
```

## What's Included in Backups

### ✅ System Configuration (Safe to Restore)
- Membership Packages (6)
- Admin Settings (4)
- System Wallets (2)
- BPT Conversion Rates (1)
- YouTube Plans (4)
- Third Party Platforms (8)
- Palliative Options (6)
- Community Features (0)
- Leadership & Investor Pools

### ❌ User Data (NOT Backed Up)
- User accounts & passwords
- User wallets & balances
- Transactions
- Referrals
- Notifications
- Personal information

## Workflow

### Before Admin Panel Development
```bash
# 1. Create safety backup
npm run db:export

# 2. Develop freely
# (make changes via admin panel)

# 3. If something breaks
npm run db:restore
```

### Production Deployment
```bash
# 1. Export dev database
npm run db:export

# 2. Commit systemDataBackup.ts

# 3. On production server:
npx prisma migrate deploy
npm run db:restore
```

## Files Created

| File | Purpose | Size |
|------|---------|------|
| `prisma/seed-data/systemDataBackup.ts` | System config backup | 714 lines |
| `prisma/seed-data/userSummary.md` | User reference | Report |
| `prisma/seedFromBackup.ts` | Restore script | Auto-generated |
| `scripts/exportDatabaseToSeed.ts` | Export script | Tool |

## Current Database Snapshot (Jan 9, 2026)

```
Users:               5
Membership Packages: 6
Admin Settings:      4
YouTube Plans:       4
Referrals:           3
Transactions:        46
Notifications:       21
```

## Safety Notes

⚠️ **Never commit user data**  
✅ **Always commit system configuration**  
🔒 **User data is excluded by design**  
💾 **Export before major changes**  
🧪 **Test restore in dev first**

---

📖 Full documentation: [prisma/SEEDER_README.md](./SEEDER_README.md)
