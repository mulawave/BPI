# Live Server Update Guide

Last updated: 2026-01-28

## Prerequisites
- Production environment variables are set (.env.local or platform secrets)
- Database access is available
- Build artifacts can be created on the target server

## Recommended Deployment Flow
1. Pull latest code from the main branch.
2. Install dependencies.
3. Apply database migrations.
4. Generate Prisma client.
5. Seed/update Help Center data.
6. Build the app.
7. Restart the server process.

## Commands (example)
> Adjust for your package manager and runtime.

- Install:
  - `npm install`
- Migrate:
  - `npx prisma migrate deploy`
- Generate client:
  - `npx prisma generate`
- Seed Help Center:
  - `npx tsx scripts/seedHelpFromDocs.ts`
- Build:
  - `npm run build`
- Start / Restart:
  - `npm run start` (or restart your process manager)

## Post‑Deploy Checks
- Verify Help Center topics load and search works.
- Confirm admin-only topics are hidden for non-admin users.
- Validate RAVEN assistant responds and auto-scroll behaves correctly.
- Check logs for migration or seed errors.

## Rollback Notes
- Revert to the previous release and run `npm run build` again.
- Prisma migrations are forward-only; restore database backup if needed.
