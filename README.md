# Next + tRPC + Prisma + Auth.js + ShadCN

## Prereqs

- Node 18+
- Postgres database (Neon, Supabase, Railway, etc.)

## 1) Install deps

```bash
pnpm i # or npm i / yarn
```

## 2) Configure env

Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `AUTH_SECRET` (use `openssl rand -base64 32`). Add provider creds if using GitHub/Google.

## 3) Prisma schema sync & generate

```bash
npx prisma db push
```

## 4) Dev

```bash
pnpm dev
```

Visit <http://localhost:3000>

## 5) Deploy

- Push to GitHub, import into Vercel
- Set prod env vars in Vercel dashboard (same as `.env.local`)
- Add Neon/Supabase connection string

## Notes

- Sessions are database-backed (durable). Switch to `strategy: "jwt"` in `server/auth.ts` if you prefer.
- Add more ShadCN components via `npx shadcn-ui@latest add <component>`.
- Add routers in `server/trpc/router/*` and merge in `_app.ts`.

## Admin Smoke Tests

These scripts call the admin tRPC router directly (no HTTP) to validate critical admin flows on any environment.

Run from project root:

```powershell
# Backups: list → create → list → delete
npx tsx scripts/smokeAdminBackups.ts

# Reports: export Users, Payments, Packages CSVs
npx tsx scripts/smokeAdminReports.ts

# Payments: seed a pending payment, then review (reject) it
npx tsx scripts/seedPendingPaymentForSmoke.ts
npx tsx scripts/smokeAdminPayments.ts

# Withdrawal Notifications: test email system and admin notifications
npx tsx scripts/testWithdrawalNotifications.ts
```

Troubleshooting:
- Ensure `.env.local` is configured and the database is reachable.
- If Prisma types seem stale, run `npx prisma generate`.
- For audit logging foreign keys, scripts automatically use an existing admin (or first user) as the session user.

## Documentation

### System Guides
- **[ADMIN_NOTIFICATION_SYSTEM.md](./ADMIN_NOTIFICATION_SYSTEM.md)** - Complete guide to withdrawal notification system
- **[WITHDRAWAL_AUDIT_REPORT.md](./WITHDRAWAL_AUDIT_REPORT.md)** - Comprehensive audit and code quality report
- **[WITHDRAWAL_EXECUTIVE_SUMMARY.md](./WITHDRAWAL_EXECUTIVE_SUMMARY.md)** - Executive summary and deployment status
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Production deployment checklist

### Deployment Guides
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - General deployment guide
- **[CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md)** - cPanel-specific deployment
- **[PRODUCTION_SUMMARY.md](./PRODUCTION_SUMMARY.md)** - Production configuration summary

