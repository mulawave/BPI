#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run-migration.sh [mysql_conn] [pg_conn] [optional_mysql_sql_dump]
# Examples:
# ./scripts/run-migration.sh
# ./scripts/run-migration.sh "mysql://user:pass@host:3306/db" "postgresql://pg:pass@host:5432/db"
# ./scripts/run-migration.sh "" "" /path/to/dump.sql

MYSQL_CONN=${1:-"mysql://mysqluser:mysqlpass@mysql:3306/source_db"}
PG_CONN=${2:-"postgresql://pguser:pgpass@postgres:5432/bpi_dev"}
SQL_DUMP_PATH=${3:-""}

echo "MYSQL_CONN=${MYSQL_CONN}"
echo "PG_CONN=${PG_CONN}"

# If a SQL dump path is provided, copy it into the mysql container and import it
if [[ -n "${SQL_DUMP_PATH}" ]]; then
	if [[ ! -f "${SQL_DUMP_PATH}" ]]; then
		echo "SQL dump not found at: ${SQL_DUMP_PATH}"
		exit 1
	fi

	echo "Copying SQL dump into mysql container..."
	docker cp "${SQL_DUMP_PATH}" "$(docker-compose ps -q mysql)":/tmp/dump.sql

	echo "Importing SQL into MySQL (database: source_db)..."
	docker-compose exec -T mysql sh -c 'mysql -u mysqluser -pmysqlpass source_db < /tmp/dump.sql'

	echo "Imported SQL dump into MySQL."
fi

echo "Running pgloader to migrate from MySQL -> Postgres"
docker-compose exec -T pgloader pgloader "${MYSQL_CONN}" "${PG_CONN}"

echo "Migration finished. Verify data in Postgres."
