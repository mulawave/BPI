# Revenue Pools System - VPS Deployment Guide

## Overview
The BPI Revenue Tracking & Allocation System automatically splits revenue using a 50/30/20 model:
- **50%** → Company Reserve (operations)
- **30%** → Executive Shareholders (7 roles, distributed daily at 8am)
- **20%** → Strategic Pools (5 pools, distributed on-demand)

## System Architecture

### Revenue Flow
```
Transaction → recordRevenue() → Automatic 50/30/20 Split
├─ Company Reserve (50%) → Immediate allocation
├─ Executive Pool (30%) → Pending → Daily 8am distribution
└─ Strategic Pools (20%) → Pending → On-demand distribution
```

### Revenue Sources (11 total)
1. Community Support Payments
2. Membership Purchases
3. Membership Renewals
4. Store Orders
5. Withdrawal Fees (Cash)
6. Withdrawal Fees (BPT)
7. YouTube Plan Subscriptions
8. Third-Party Commissions
9. Leadership Pool Fees
10. Palliative Donations
11. Other Revenue

### Executive Shareholders (30% Pool)
Distributed daily at 8:00 AM to shareholder wallets:
- CEO: 30%
- CTO: 20%
- Head of Travel: 20%
- CMO: 10%
- Oliver: 5%
- Morrison: 5%
- Annie: 10%

### Strategic Pools (20% Total - 4% each)
Distributed on-demand by admin:
- Leadership Pool (4%)
- State Pool (4%)
- Directors Pool (4%)
- Technology Pool (4%)
- Investors Pool (4%)

## Installation & Setup

### 1. Install Dependencies
```bash
cd /var/www/bpi
npm install
```

### 2. Database Migration
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Seed Revenue Pools
```bash
# Initialize 5 strategic pools + 7 executive placeholders
npm run seed:revenue-pools
```

This creates:
- 5 strategic pools (balance: 0)
- 7 executive shareholder placeholders (unassigned)
- Company reserve (balance: 0)

### 4. Assign Users to Roles (Admin UI)
1. Start the server: `npm run dev` or `pm2 start ecosystem.config.js`
2. Navigate to: `/admin/revenue-pools`
3. Assign users to executive roles via email/name/username search
4. Add members to strategic pools

## Running in Production

### Option 1: PM2 (Recommended)
```bash
# Start both web server and cron scheduler
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Enable PM2 startup on reboot
pm2 startup

# Monitor logs
pm2 logs bpi-cron
pm2 logs bpi-production
```

### Option 2: Manual Start
```bash
# Terminal 1: Web Server
npm start

# Terminal 2: Cron Server
npm run cron:server
```

## PM2 Configuration

The `ecosystem.config.js` file runs TWO processes:

### 1. bpi-production (Web Server)
- Script: `npm start`
- Mode: Cluster (max instances)
- Port: 3000
- Auto-restart: Yes

### 2. bpi-cron (Cron Scheduler)
- Script: `npx tsx server/cron-server.ts`
- Mode: Fork (single instance)
- Auto-restart: Yes
- Schedule: Daily at 8:00 AM

## Manual Operations

### Manually Trigger Distribution
```bash
# Distribute executive pool manually
npm run cron:distribute
```

### Check Revenue Stats
Navigate to admin panel: `/admin/revenue-pools`
- View total revenue
- Company reserve balance
- Executive pool pending amount
- Strategic pool balances

### Distribute Strategic Pools
1. Go to `/admin/revenue-pools`
2. Find the strategic pool card
3. Click **"Distribute"** button
4. Amount splits equally among all members

## Monitoring & Logs

### PM2 Logs
```bash
# View cron logs
pm2 logs bpi-cron

# View web server logs
pm2 logs bpi-production

# View all logs
pm2 logs
```

### Log Files
- Cron errors: `./logs/cron-error.log`
- Cron output: `./logs/cron-out.log`
- Web errors: `./logs/pm2-error.log`
- Web output: `./logs/pm2-out.log`

## Cron Schedule

### Executive Pool Distribution
- **Frequency:** Daily at 8:00 AM
- **Cron Expression:** `0 8 * * *`
- **What it does:**
  1. Gets all pending executive allocations from yesterday
  2. Calculates total amount
  3. Distributes to each shareholder based on percentage
  4. Credits shareholder wallets
  5. Marks allocations as distributed

### Strategic Pools
- **Frequency:** On-demand (admin triggers)
- **Distribution:** Equal split among members
- **Controlled via:** Admin UI

## Database Models

### Core Models
- `RevenueTransaction` - All revenue entries
- `RevenueAllocation` - 50/30/20 split records
- `ExecutiveShareholder` - 7 role assignments
- `ExecutiveDistribution` - Daily distribution history
- `StrategyPool` - 5 pool configurations
- `PoolMember` - User assignments to pools
- `PoolAllocation` - Pool distribution records
- `CompanyReserve` - 50% reserve tracker
- `RevenueAdminAction` - Audit log

## Troubleshooting

### Cron Not Running
```bash
# Check if cron process is running
pm2 list

# Restart cron
pm2 restart bpi-cron

# View cron logs for errors
pm2 logs bpi-cron --lines 100
```

### No Revenue Being Recorded
1. Check if revenue sources are properly integrated
2. Verify `recordRevenue()` is called after transactions
3. Check database connection
4. View logs for errors

### Distribution Not Happening
1. Verify shareholders are assigned to roles
2. Check cron is running: `pm2 list`
3. Verify server timezone matches expected time
4. Check cron logs: `pm2 logs bpi-cron`

### TypeScript Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

## Security

### Admin Access
- All revenue endpoints require admin role
- Check: `session.user.role === 'admin'`
- Helper: `requireAdmin(ctx.session)`

### Audit Trail
- All admin actions logged in `RevenueAdminAction`
- Tracks: role assignments, pool additions/removals, distributions
- Includes: adminId, action type, metadata, timestamp

## API Endpoints (tRPC)

### Admin Endpoints
- `revenue.getExecutiveShareholders` - Get all shareholders
- `revenue.assignExecutiveRole` - Assign user to role
- `revenue.removeExecutiveRole` - Remove user from role
- `revenue.getStrategicPools` - Get all pools with members
- `revenue.addPoolMember` - Add user to pool
- `revenue.removePoolMember` - Remove user from pool
- `revenue.distributePool` - Trigger pool distribution
- `revenue.getDashboardStats` - Get revenue stats
- `revenue.getRevenueBreakdown` - Revenue by source
- `revenue.searchUsers` - Search for user assignment
- `revenue.getAdminActions` - View audit log

### Public Endpoints
- `revenue.recordRevenue` - Record transaction (internal)

## Next Steps

1. **Deploy to VPS**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

2. **Seed Initial Data**
   ```bash
   npm run seed:revenue-pools
   ```

3. **Assign Users**
   - Go to `/admin/revenue-pools`
   - Assign 7 executive roles
   - Add members to strategic pools

4. **Monitor First Distribution**
   - Wait for 8:00 AM next day
   - Check logs: `pm2 logs bpi-cron`
   - Verify shareholder wallets were credited

5. **Test Manual Distribution**
   - Add test revenue
   - Trigger manual: `npm run cron:distribute`
   - Verify in admin dashboard

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Review audit trail: `/admin/revenue-pools`
3. Verify database state
4. Contact system administrator
