#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Add it to .env at the project root." >&2
  exit 1
fi

if command -v psql >/dev/null 2>&1; then
  exec psql "$DATABASE_URL" "$@"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'morakab-bazi-postgres'; then
  exec docker exec -i morakab-bazi-postgres psql -U postgres -d morakab_bazi "$@"
fi

echo "psql not found and morakab-bazi-postgres container is not running." >&2
echo "Install psql locally, or run: docker compose -f _devops/docker-compose.yml up -d" >&2
exit 1
