# BPI Project Snapshot — 2025-12-08

Purpose: fast reference of current progress, setup, auth flow, data model, and key artifacts to keep work on-track across devices/sessions.

## Progress to Date
- Repo setup: Next.js App Router + tRPC + Prisma + Auth.js (NextAuth) + ShadCN UI; Tailwind configured.
- Auth flows present under `app/(auth)/` (login, register, forgot-password, set-new-password); middleware in place.
- Membership work: `membership_docs/BPI Membership Package System.pdf` extracted to `.txt`; implementation plan authored in `docs/membership-implementation-plan.md` with milestones and future-proofing for new packages.
- Copilot guardrails updated in `.github/copilot-instructions.md` (trigger words required for code changes).
- Backup created: `../BPI-backup-2025-12-08.tar.gz` (from repo root) — restore with `tar -xzf ../BPI-backup-2025-12-08.tar.gz`.

## Environment & Tooling
- Node 18+; Postgres database (Neon/Supabase/Railway compatible).
- Env: copy `.env.example` → `.env.local`; set `DATABASE_URL`, `AUTH_SECRET`; add OAuth creds if used.
- Dev commands: `pnpm i`; `npx prisma migrate dev --name init`; `pnpm dev` → http://localhost:3000.
- Deploy: Vercel with same env vars; sessions database-backed by default.

## Auth / Login Flow (current state)
- Auth.js (NextAuth) with Prisma adapter; sessions stored in Postgres (switchable to JWT in `server/auth.ts` if desired).
- Custom pages live at `app/(auth)/login`, `register`, `forgot-password`, `set-new-password`.
- Middleware present (`middleware.ts`) to guard routes; providers configured in `server/auth.ts` (check file for specifics if updated).
- Login steps (current UX): open `/login` → credentials form (Auth.js credentials provider) → session stored in DB → middleware gates protected routes; forgot-password and reset flows live under `(auth)` group.

## Data Model Snapshot (Prisma)
- `User`: core profile, auth fields, balances for multiple wallets (wallet, spendable, palliative, cashback, community, shelter, education, meal, health, etc.), referral counters, flags (vip/shelter/shareholder), login metadata.
- `BpiMember`: membership linkage to user with status flags, balances, referral link.
- Referrals: `Referral` (referrer↔referred), plus `ReferralTree` (ancestry) present in schema.
- Auth tables: `Account`, `Session`, `VerificationToken`, `PasswordReset` for Auth.js flows.
- Palliative domain: `PalliativePackage`, `PackageActivation`, `PalliativeTicket`, `Partner`, `PartnerOffer`, `TicketCategory`.
- Transactions: `Transaction`, `TransactionHistory`, `FundingHistory`, `WithdrawalHistory`.
- Content/social: `Blog`, `CommunityPost`, `YoutubeChannel`, `StoreProduct/Order` (see schema for full fields).
- Note: schema currently uses many per-wallet columns on `User`; future membership plan may move to unified wallet tables per the implementation plan.
- Current gap vs. plan: no unified wallet table yet; referral ancestry not yet optimized for 4-level payout; membership packages not yet encoded in DB.

## Membership Documentation Artifacts
- Source PDF: `membership_docs/BPI Membership Package System.pdf` (+ text `BPI Membership Package System.txt`).
- Implementation plan: `docs/membership-implementation-plan.md` (phases, milestones, future-proofing for new packages, feature flags, validation, tests, observability).

## File/Folder Highlights
- `app/` (App Router pages including auth, dashboard, debug, test).
- `components/` (UI, auth forms, providers, ShadCN primitives).
- `server/` (tRPC routers, auth config).
- `prisma/` (schema, migrations, seed).
- `public/` (static assets + legacy site assets).
- `docs/` (implementation plan, this snapshot).
- `membership_docs/` (membership PDF and extracted text).
- `styles/`, `tailwind.config.ts`, `postcss.config.js` (styling setup); `next.config.mjs`, `middleware.ts` (routing/middleware); `lib/` (firebase/prisma helpers); `scripts/` (container/migration helpers); `legacy_design/` (old app assets).

## Open Focus Areas
- Implement data-driven wallet model and package registry per plan.
- Wire purchase/renewal flows, referral tree resolution, wallet allocations, and admin dashboards.
- Align existing schema (per-wallet columns) with planned unified wallet tables or bridge strategy.

## Backup Note
- See backup section in today’s log/commands for archive path once created.
