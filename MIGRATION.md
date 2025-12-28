MySQL → PostgreSQL migration (local testing)
===========================================

This repository includes helper automation to migrate a MySQL database into PostgreSQL using `pgloader` in Docker.

Files added:

- `docker-compose.yml` — spins up local `mysql`, `postgres`, and `pgloader` containers.
- `scripts/start-containers.sh` — start the required containers.
- `scripts/run-migration.sh` — runs `pgloader` inside the pgloader container (defaults point to the compose service names).

Quick steps (local test):

1. Start containers

```bash
chmod +x scripts/*.sh
./scripts/start-containers.sh
```

2. Run the migration (uses internal docker hostnames by default)

```bash
./scripts/run-migration.sh
# or point to your production MySQL and target Postgres:
./scripts/run-migration.sh \
  "mysql://user:pass@prod-mysql-host:3306/prod_db" \
  "postgresql://pguser:pgpass@localhost:5432/bpi_dev"
```

3. Update your `.env` `DATABASE_URL` to point to Postgres (local example):

```env
DATABASE_URL="postgresql://pguser:pgpass@localhost:5432/bpi_dev?schema=public"
```

4. Run Prisma commands in your project root:

```bash
npm install
npx prisma db pull    # introspect the migrated Postgres
npx prisma generate
npm run dev
```

Safety notes:
- Always backup your MySQL DB before migrating.
- This automation is for local testing. For production migrations, use a controlled process (replication + cutover) and test the results thoroughly.

Troubleshooting:
- If pgloader fails, inspect the pgloader container logs: `docker-compose logs pgloader`.
- Character set or enum errors often need manual adjustments.
