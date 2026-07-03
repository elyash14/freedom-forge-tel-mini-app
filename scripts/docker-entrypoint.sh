#!/bin/sh
set -e

export PATH="/opt/db/node_modules/.bin:${PATH}"
export NODE_PATH="/opt/db/node_modules:/app/node_modules"

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "Running prisma migrate deploy..."
  prisma migrate deploy
fi

exec "$@"
