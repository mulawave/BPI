⚠️ WARNING

This project uses an existing database with live data.

DO NOT run:
- prisma migrate dev
- prisma migrate reset

Baseline migration was created using:
- prisma migrate diff
- prisma migrate resolve

Use ONLY:
- prisma migrate deploy

Claim flow + migration workflow
-------------------------------
- To create a new migration against the live schema, use the diff pattern (no dev/reset):
	- `npx prisma migrate diff --from-schema-datasource=prisma/schema.prisma --to-schema-datamodel=prisma/schema.prisma --script --output prisma/migrations/<timestamp>_<name>/migration.sql`
	- Review the SQL, then apply with `npx prisma migrate deploy`.
- Never run `prisma migrate dev` or `prisma migrate reset` in this repo; they will wipe live data.
- Claim statuses are one-way: NOT_READY → CODE_ISSUED → VERIFIED → COMPLETED. Order verification only happens when status is PROCESSING/DELIVERED/PAID.
- After completion, ratings can be submitted once the claim is COMPLETED.