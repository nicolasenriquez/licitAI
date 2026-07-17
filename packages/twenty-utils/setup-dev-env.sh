#!/bin/bash
# =============================================================================
# Twenty CRM - Docker-only development environment setup
# =============================================================================
# The full application stack runs through the production-like Docker Compose
# file. The only local environment file is packages/twenty-docker/.env.
#
# Usage (from repo root):
#   bash packages/twenty-utils/setup-dev-env.sh          # start full stack
#   bash packages/twenty-utils/setup-dev-env.sh --down   # stop full stack
#   bash packages/twenty-utils/setup-dev-env.sh --reset  # wipe volumes + start
#   bash packages/twenty-utils/setup-dev-env.sh --docker # accepted for compatibility
# =============================================================================
set -euo pipefail
SCRIPT_DIR="${BASH_SOURCE[0]%/*}"
REPO_ROOT="${SCRIPT_DIR}/../.."
COMPOSE_FILE="${REPO_ROOT}/packages/twenty-docker/docker-compose.yml"
ENV_FILE="${REPO_ROOT}/packages/twenty-docker/.env"
info() { echo "=> $@"; }
ok() { echo "done: $@"; }
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing packages/twenty-docker/.env" >&2
  exit 1
fi
compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

ACTION="up"
while [ $# -gt 0 ]; do
  case "$1" in
    --docker) ;;
    --down) ACTION="down" ;;
    --reset) ACTION="reset" ;;
    *) echo unknown-flag >&2; exit 1 ;;
  esac
  shift
done
case "$ACTION" in
  down)
    info stop
    compose down --remove-orphans
    ok stopped
    ;;
  reset)
    info reset
    compose down --volumes --remove-orphans
    compose up -d
    ok restarted
    ;;
  up)
    info start
    compose up -d
    ok started
    ;;
esac
echo
echo 'Local environment ready.'
echo
echo '  docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml ps'
echo '  Application: http://localhost:3000'
echo '  Health:      http://localhost:3000/healthz'
