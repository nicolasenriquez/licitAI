#!/usr/bin/env bash
# =============================================================================
# licitai — Existing local runtime check
# =============================================================================
# The full application Compose project is the only supported local runtime for
# agents and routine development. This script is intentionally read-only: it
# never starts, stops, removes, rebuilds, or creates a container. Use the
# explicit Compose command (or just dev-up) only when a human has requested a
# state-changing startup.
#
# Usage (from repo root):
#   bash packages/twenty-utils/setup-dev-env.sh
#   bash packages/twenty-utils/setup-dev-env.sh --check
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/packages/twenty-docker/docker-compose.yml"
ENV_FILE="$REPO_ROOT/packages/twenty-docker/.env"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

case "${1:-}" in
  ""|--check)
    ;;
  *)
    fail "This script is read-only and only accepts --check. Use the existing full Compose project explicitly for state changes."
    ;;
esac

command -v docker >/dev/null 2>&1 || fail "Docker CLI is unavailable. No fallback to host services is allowed."
docker compose version >/dev/null 2>&1 || fail "Docker Compose is unavailable. No fallback to host services is allowed."
[ -f "$ENV_FILE" ] || fail "$ENV_FILE is missing; refusing to create it or start another stack."

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
"${compose[@]}" config --quiet

running_services="$("${compose[@]}" ps --services --filter status=running)"
for service in server worker db redis; do
  printf '%s\n' "$running_services" | grep -qx "$service" \
    || fail "Compose service '$service' is not already running; refusing to start or create containers."
done

"${compose[@]}" exec -T db pg_isready -U postgres -q \
  || fail "The existing Compose PostgreSQL service is not ready."
printf '%s\n' "$("${compose[@]}" exec -T redis redis-cli ping 2>/dev/null)" \
  | grep -qx PONG \
  || fail "The existing Compose Redis service is not ready."

if command -v curl >/dev/null 2>&1; then
  curl --fail --silent --show-error --max-time 5 http://localhost:3000/healthz >/dev/null \
    || fail "The existing Compose server is not healthy at http://localhost:3000/healthz."
fi

echo "Existing full Docker Compose runtime is configured and healthy."
echo "No containers were started, stopped, removed, rebuilt, or created."
