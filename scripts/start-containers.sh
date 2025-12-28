#!/usr/bin/env bash
set -euo pipefail

echo "Starting Docker containers (Postgres, MySQL, pgloader)..."
docker-compose up -d postgres mysql pgloader

echo "Waiting for containers to be ready..."
./scripts/wait-for-containers.sh

echo "Containers started and ready."
echo "Postgres -> localhost:5432 (pguser/pgpass, db=bpi_dev)"
echo "MySQL -> localhost:3306 (mysqluser/mysqlpass, db=source_db)"

echo "Note: if host ports 5432 or 3306 are in use, update docker-compose.yml to map to different host ports."
