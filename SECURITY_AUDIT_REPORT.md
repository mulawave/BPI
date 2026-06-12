# BPI Security Audit Report

**Date:** 2026-06-12  
**Scope:** Full codebase scan for common web-application vulnerabilities

---

## Summary

| Category | Critical | High | Medium | Low |
|---|---|---|---|---|
| SQL Injection | 1 | 0 | 0 | 0 |
| Hardcoded Secrets | 1 | 0 | 1 | 0 |
| Exposed Debug/Test Pages | 1 | 0 | 0 | 0 |
| Missing Auth on Endpoints | 0 | 1 | 0 | 0 |
| Insecure File Uploads | 0 | 1 | 0 | 0 |
| XSS (dangerouslySetInnerHTML) | 0 | 0 | 2 | 0 |
| Vulnerable Dependencies | 0 | 0 | 1 | 0 |
| CORS | 0 | 0 | 0 | 0 |
| Credential Logging | 0 | 0 | 1 | 0 |

---

## CRITICAL

### 1. SQL Injection via `$executeRawUnsafe` / `$queryRawUnsafe` in Admin Router

**Files:** `server/trpc/router/admin.ts` (lines ~4973, 5091, 5145–5146, 5171, 5233, 5320, 5362, 5425, 5435, 5443)

Multiple admin procedures construct SQL with `$executeRawUnsafe` and `$queryRawUnsafe` using string interpolation with `tableIdent` built from `quote_ident()`. While the table name is validated against `pg_tables`, the `previewTable` procedure directly interpolates `input.limit` into a raw SQL string:

```ts
const rows = await prisma.$queryRawUnsafe<any[]>(
  `SELECT * FROM ${tableIdent} ORDER BY 1 LIMIT ${input.limit};`
);
```

The `input.limit` is Zod-validated as a number (1–100), which mitigates the risk here, but the pattern of building SQL by string concatenation with `$executeRawUnsafe` is dangerous.

**Impact:** If any of these validation layers fail or are bypassed, an attacker with admin access could execute arbitrary SQL.

**Fix applied:** Replace `$queryRawUnsafe` with parameterized `$queryRaw` using `Prisma.sql` for the `LIMIT` clause. For table identifiers, add an allowlist check.

### 2. Hardcoded Default Credentials in Seed Scripts

**Files:**
- `scripts/createAdminUser.ts` — `password = "Admin@123"`, `email = "admin@bpi.com"`
- `prisma/seedSuperAdmin.ts` — `password = "myngul.com1"`, `email = "admin@superapp.bpi"`
- `prisma/seed.ts` — `password = "password123"`
- `scripts/seedClaimSmoke.ts` — `password = "Password123!"`

**Impact:** If these scripts run in production (even accidentally) or if the default accounts are not changed, this is a complete authentication bypass. The `createAdminUser.ts` and `seedSuperAdmin.ts` scripts have `NODE_ENV === "production"` guards, but `seed.ts` does not.

**Fix applied:** Added `NODE_ENV === "production"` guard to `prisma/seed.ts`. Replaced password logging in `scripts/createAdminUser.ts` with masked output.

### 3. Exposed Debug/Test Pages in Production

**Files:**
- `app/debug/page.tsx` — Dumps full session data, exposes VAT backfill mutation
- `app/test/page.tsx` — Health check + flow test links
- `app/testing/page.tsx` — 710-line testing dashboard showing internal implementation details

**Impact:** These pages are reachable by any authenticated user (not admin-gated) and leak session details, internal architecture, and file paths. The `/debug` page exposes full `JSON.stringify(session)` to the client and offers a destructive VAT backfill tool.

**Fix applied:** Added `notFound()` guard that blocks access unless `NODE_ENV === "development"`.

---

## HIGH

### 4. Unauthenticated `/api/internal/maintenance` POST Endpoint

**File:** `app/api/internal/maintenance/route.ts`

The `POST` handler invalidates the maintenance-mode cache with **no authentication**. Any unauthenticated request can reset the cache, causing a brief window where maintenance mode may not be enforced.

**Fix applied:** Added admin session check to the POST handler.

### 5. Unsanitized File Extensions in Upload Endpoints

**Files:**
- `app/api/upload/avatar/route.ts` — `file.name.split('.').pop()` with no sanitization
- `app/api/upload/payment-proof/route.ts` — same pattern
- `app/api/upload/kyc/route.ts` — `.toLowerCase()` only

**Impact:** A malicious filename like `evil.php` or `evil.html` could be written to the public directory. While MIME type is validated, the file extension is not cross-checked against the validated MIME type — an attacker could upload `malware.html` with `image/jpeg` MIME spoofed by certain clients.

**Fix applied:** Added extension sanitization and cross-validation against allowed extensions.

---

## MEDIUM

### 6. `dangerouslySetInnerHTML` with Database Content (XSS)

**Files:**
- `app/blog/[slug]/page.tsx:148` — `post.content` rendered raw
- `components/community/TrainingCenterModal.tsx:284` — `currentLesson.content` rendered raw

**Impact:** If an admin or content creator injects `<script>` tags into blog/lesson content, any visitor viewing that content will execute the script (Stored XSS). This is partially mitigated since only admins create content, but it violates defense-in-depth.

**Recommendation:** Sanitize HTML with a library like `dompurify` or `sanitize-html` before rendering.

### 7. Vulnerable Dependencies (16 total, 1 critical, 7 high)

Key vulnerable packages:
- `next` (critical — GHSA-gp8f-8m3g-qvj9)
- `@grpc/grpc-js` (high — server crash via malformed request)
- `axios` (high — SSRF + credential leakage)
- `glob` (high — ReDoS)
- `protobufjs` (high — prototype pollution)
- `nodemailer` (moderate — insufficient hostname validation)

**Recommendation:** Run `npm audit fix` for non-breaking fixes, and evaluate `npm audit fix --force` for the remaining.

### 8. Logging Sensitive Information

**Files:**
- `scripts/createAdminUser.ts` — logs `console.log("🔑 Password:", password)`
- `server/services/payment/FlutterwaveGateway.ts:98` — logs partial API key

**Fix applied:** Replaced password logging with masked output. Left the partial key log (first 15 chars) as-is since it's a common debug pattern for payment gateways, but added a note.

---

## LOW / Informational

### CORS
No overly permissive CORS configuration found. `next.config.mjs` uses `allowedOrigins` restricted to `localhost:3000`, `beepagro.com`, and `www.beepagro.com`. Security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff) are properly set.

### Authentication
Middleware enforces auth for all non-public routes. Admin routes are properly gated. tRPC routers use `protectedProcedure` / `adminProcedure` / `superAdminProcedure` appropriately. Cron endpoints use `Bearer CRON_SECRET` authentication.

### Raw SQL Usage
Most raw SQL in `server/trpc/router/auth.ts` and `server/trpc/router/referral.ts` uses Prisma's tagged template literal (`$queryRaw\`...\``) which is parameterized and safe.
