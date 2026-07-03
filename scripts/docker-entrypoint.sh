#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "Running prisma migrate deploy..."
  prisma migrate deploy
fi

exec "$@"
