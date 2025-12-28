#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for MySQL and Postgres to be ready..."
MAX_RETRIES=30
SLEEP=2

check_mysql() {
  docker-compose exec -T mysql sh -c 'mysqladmin ping -h localhost -u mysqluser -pmysqlpass' >/dev/null 2>&1
}

check_postgres() {
  docker-compose exec -T postgres pg_isready -U pguser -d bpi_dev >/dev/null 2>&1
}

retries=0
until check_mysql; do
  retries=$((retries+1))
  echo "Waiting for mysql... (${retries}/${MAX_RETRIES})"
  sleep ${SLEEP}
  if [ ${retries} -ge ${MAX_RETRIES} ]; then
    echo "MySQL did not become ready in time"
    exit 1
  fi
done

retries=0
until check_postgres; do
  retries=$((retries+1))
  echo "Waiting for postgres... (${retries}/${MAX_RETRIES})"
  sleep ${SLEEP}
  if [ ${retries} -ge ${MAX_RETRIES} ]; then
    echo "Postgres did not become ready in time"
    exit 1
  fi
done

echo "MySQL and Postgres are ready."
