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

## 3) Prisma migrate & generate

```bash
npx prisma migrate dev --name init
npx prisma db push # (optional if you didn't migrate)
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
```

Troubleshooting:
- Ensure `.env.local` is configured and the database is reachable.
- If Prisma types seem stale, run `npx prisma generate`.
- For audit logging foreign keys, scripts automatically use an existing admin (or first user) as the session user.
