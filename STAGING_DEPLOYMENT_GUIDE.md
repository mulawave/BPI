# Revenue Pools System - Staging Deployment Guide

**Date:** February 3, 2026  
**Critical Fixes Applied:** 3/3 ✅  
**Status:** READY FOR STAGING DEPLOYMENT

---

## ✅ CRITICAL FIXES IMPLEMENTED

### 1. ✅ Fixed Duplicate Return Statement
**File:** `server/cron-server.ts`  
**Issue:** Second return statement was unreachable dead code  
**Fix:** Removed duplicate, kept correct return with `result.totalAmount`

### 2. ✅ Integrated Retry Logic
**File:** `server/cron-server.ts`  
**Issue:** `retryWithBackoff()` function existed but wasn't used  
**Fix:** Wrapped cron scheduler call:
```typescript
await retryWithBackoff(distributeExecutivePool, 3, 2000);
```
**Result:** 3 retry attempts with exponential backoff (2s, 4s, 8s)

### 3. ✅ Database Schema Updated
**Commands Run:**
- `npx prisma db push` - Applied schema changes to database
- `npx prisma generate` - Regenerated Prisma client

**Schema Changes Applied:**
- `sourceId` unique constraint ✅
- Composite indexes on RevenueTransaction ✅
- Composite index on RevenueAllocation ✅
- Composite index on ExecutiveDistribution ✅

---

## 🚀 STAGING DEPLOYMENT STEPS

### 1. Pre-Deployment Verification

**Run Test Suite:**
```bash
npx tsx scripts/test-revenue-pools.ts
```

**Expected Output:**
- ✅ All 6 tests pass
- 100% success rate
- "READY FOR STAGING DEPLOYMENT" message

**If Tests Fail:**
- Review error messages
- Fix issues before proceeding
- Re-run tests until all pass

### 2. Build Application

```bash
# Install dependencies
npm install

# Build Next.js application
npm run build

# Verify build succeeded
# Look for "Compiled successfully" message
```

### 3. Deploy to Staging Server

**Option A: Manual Deployment (VPS/cPanel)**
```bash
# 1. Backup current staging database
pg_dump $STAGING_DATABASE_URL > backup_staging_$(date +%Y%m%d_%H%M%S).sql

# 2. Upload code to staging server
rsync -avz --exclude node_modules --exclude .git . user@staging-server:/var/www/bpi-staging/

# 3. SSH into staging server
ssh user@staging-server

# 4. Navigate to project directory
cd /var/www/bpi-staging

# 5. Install dependencies
npm install --production

# 6. Run database migrations
npx prisma db push
npx prisma generate

# 7. Build application
npm run build

# 8. Restart application
pm2 restart bpi-staging

# 9. Start cron server
pm2 restart bpi-cron-staging
# OR start if not running:
pm2 start server/cron-server.js --name bpi-cron-staging
```

**Option B: Git-based Deployment (Vercel/Railway)**
```bash
# 1. Commit changes
git add .
git commit -m "feat: implement revenue pools critical fixes"

# 2. Push to staging branch
git push origin staging

# 3. Platform will auto-deploy (Vercel/Railway)

# 4. Run migrations via platform CLI or dashboard
vercel env pull
npx prisma db push
```

### 4. Post-Deployment Verification

**A. Check Application Health**
```bash
# Visit staging URL
curl https://staging.yourdomain.com/api/health

# Check admin panel access
# Visit: https://staging.yourdomain.com/admin/revenue-pools
```

**B. Verify Cron Job Running**
```bash
# SSH into server
ssh user@staging-server

# Check PM2 status
pm2 status

# Should see:
# bpi-cron-staging | online | ...

# View cron logs
pm2 logs bpi-cron-staging --lines 50
```

**C. Test Revenue Recording**
```bash
# Option 1: Via admin panel
# 1. Login to staging admin
# 2. Navigate to CSP contribution
# 3. Make a test contribution (₦100)
# 4. Check revenue pools page for allocation

# Option 2: Via test script (on server)
npx tsx scripts/test-revenue-pools.ts
```

**D. Verify Database Changes**
```sql
-- Connect to staging database
psql $STAGING_DATABASE_URL

-- Check unique constraint
\d "RevenueTransaction"
-- Look for: sourceId | text | | | | UNIQUE

-- Check indexes
\di
-- Look for indexes on userId_source_createdAt, etc.

-- Check data integrity
SELECT COUNT(*) FROM "RevenueTransaction" WHERE "sourceId" IS NOT NULL;
-- Should have no duplicates

-- Exit
\q
```

### 5. Functional Testing Checklist

**Revenue Recording:**
- [ ] Record CSP contribution - verify 50/30/20 split
- [ ] Record store purchase - verify allocation
- [ ] Record withdrawal fee - verify allocation
- [ ] Try duplicate sourceId - verify rejection

**Executive Pool:**
- [ ] Assign executive shareholder (any role)
- [ ] View shareholders list
- [ ] Remove executive shareholder
- [ ] Check executive pool balance

**Strategic Pools:**
- [ ] Add member to pool (e.g., LEADERSHIP)
- [ ] View pool members
- [ ] Distribute pool (if balance > 0)
- [ ] Remove member from pool
- [ ] Verify member wallet credited

**Cron Job (Manual Trigger):**
```bash
# On server, manually trigger distribution
cd /var/www/bpi-staging
npx tsx -e "
import { distributeExecutivePool } from './server/cron-server.ts';
distributeExecutivePool().then(() => console.log('Done'));
"

# Check:
# - Pending allocations distributed
# - Shareholder wallets credited
# - Status changed to DISTRIBUTED
```

**Dashboard Stats:**
- [ ] Visit /admin/revenue-pools
- [ ] Verify stats card shows correct totals
- [ ] Check company reserve balance
- [ ] Check executive pool pending
- [ ] Check strategic pool balances

### 6. Monitor for 24 Hours

**Watch Cron Execution:**
```bash
# Next day at 8:00 AM (WAT), check logs
pm2 logs bpi-cron-staging --lines 100

# Look for:
# "✅ [EXECUTIVE DISTRIBUTION] Completed successfully!"
# "📊 Summary: Total Distributed: ₦..."
```

**Check Error Logs:**
```sql
SELECT * FROM "RevenueAdminAction"
WHERE "actionType" = 'DISTRIBUTION_ERROR'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Should be empty if no errors
```

**Monitor Performance:**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://staging.yourdomain.com/admin/revenue-pools

# Check database query performance
# In psql:
SELECT * FROM pg_stat_statements
WHERE query LIKE '%RevenueTransaction%'
ORDER BY total_exec_time DESC
LIMIT 5;
```

---

## 🔄 ROLLBACK PLAN

**If Critical Issues Found:**

```bash
# 1. Stop cron server immediately
pm2 stop bpi-cron-staging

# 2. Restore database backup
psql $STAGING_DATABASE_URL < backup_staging_YYYYMMDD_HHMMSS.sql

# 3. Revert code (if using Git)
git revert HEAD
git push origin staging

# 4. Restart application
pm2 restart bpi-staging

# 5. Investigate issues before re-attempting
```

---

## ✅ PRODUCTION READINESS CRITERIA

**Before promoting to production, verify:**

- [ ] All 6 automated tests pass
- [ ] Staging deployment successful
- [ ] No errors in cron logs for 24 hours
- [ ] Revenue recording works for all sources
- [ ] Executive distribution completes successfully
- [ ] Strategic pool distribution works
- [ ] Database indexes exist and perform well
- [ ] No duplicate sourceId entries in database
- [ ] Retry logic triggered on simulated failure
- [ ] Error notifications logged to database
- [ ] UI confirmations prevent accidental actions
- [ ] Admin access properly secured (no 2FA per requirements)

---

## 📊 STAGING TEST RESULTS

**Date:** _____________  
**Tester:** _____________

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| Revenue recording | ⬜ Pass / ⬜ Fail | |
| Duplicate prevention | ⬜ Pass / ⬜ Fail | |
| 50/30/20 allocation | ⬜ Pass / ⬜ Fail | |
| Executive distribution | ⬜ Pass / ⬜ Fail | |
| Pool distribution | ⬜ Pass / ⬜ Fail | |
| Cron job (manual) | ⬜ Pass / ⬜ Fail | |
| Dashboard stats | ⬜ Pass / ⬜ Fail | |
| Error handling | ⬜ Pass / ⬜ Fail | |

### Sign-off

**Staging Approved:** ⬜ Yes / ⬜ No  
**Production Ready:** ⬜ Yes / ⬜ No  
**Signature:** _____________  
**Date:** _____________

---

## 🆘 TROUBLESHOOTING

### Issue: Tests Fail with "Property does not exist on type PrismaClient"
**Solution:**
```bash
npx prisma generate
npm run build
```

### Issue: Cron job not running
**Solution:**
```bash
pm2 delete bpi-cron-staging
pm2 start server/cron-server.js --name bpi-cron-staging
pm2 save
```

### Issue: Duplicate sourceId not prevented
**Solution:**
```bash
# Check if unique constraint exists
psql $DATABASE_URL -c "\d \"RevenueTransaction\""

# If missing, run:
npx prisma db push --force-reset  # WARNING: Resets data
# OR manually add:
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_sourceId_key" UNIQUE ("sourceId");
```

### Issue: Allocations not summing to 100%
**Solution:**
- Check `allocateRevenue` function in revenue.service.ts
- Verify percentages: 50% + 30% + (5 × 4%) = 100%
- Check database decimal precision

---

## 📞 SUPPORT

**For issues during deployment:**
- Check logs: `pm2 logs bpi-staging`
- Check cron logs: `pm2 logs bpi-cron-staging`
- Database logs: `psql $DATABASE_URL -c "SELECT * FROM \"RevenueAdminAction\" ORDER BY \"createdAt\" DESC LIMIT 20;"`

**Emergency contacts:**
- Development Team: [team email]
- Database Admin: [DBA email]
- DevOps: [devops email]

---

**Deployment Version:** 1.0.0  
**Last Updated:** February 3, 2026  
**Next Review:** After 24h staging monitoring
