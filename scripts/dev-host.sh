#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"

CONFIG_PATH="${MANAGENT_CONFIG:-$ROOT_DIR/config/managent.example.json}"
DATABASE_URL="${MANAGENT_DATABASE_URL:-postgresql://neondb_owner:npg_AlLnCWK5rjI2@ep-late-firefly-atuf5bzi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require}"
MCP_SECRET_KEY="${MANAGENT_MCP_SECRET_KEY:-0123456789abcdef0123456789abcdef}"
API_BASE_URL="${MANAGENT_API_BASE_URL:-http://127.0.0.1:8081}"
ADMIN_TOKEN="${MANAGENT_ADMIN_TOKEN:-managent-admin-demo}"

info() {
  printf '[managent] %s\n' "$*"
}

warn() {
  printf '[managent] warning: %s\n' "$*" >&2
}

die() {
  printf '[managent] error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

database_host() {
  local without_scheme without_query authority hostport
  without_scheme="${DATABASE_URL#*://}"
  without_query="${without_scheme%%\?*}"
  authority="${without_query%%/*}"
  hostport="${authority##*@}"
  hostport="${hostport%%,*}"
  printf '%s\n' "${hostport%%:*}"
}

is_local_database() {
  local host
  host="$(database_host)"
  case "$host" in
    ""|localhost|127.0.0.1|0.0.0.0|::1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

parse_database_url() {
  local without_query query
  without_query="${DATABASE_URL%%\?*}"
  query=""
  if [[ "$DATABASE_URL" == *\?* ]]; then
    query="?${DATABASE_URL#*\?}"
  fi

  DB_NAME="${without_query##*/}"
  DB_ADMIN_URL="${without_query%/*}/postgres${query}"
}

check_prereqs() {
  require_cmd go
  require_cmd node
  require_cmd npm

  if ! command -v psql >/dev/null 2>&1; then
    warn "psql is not installed; database bootstrap checks will be skipped"
  fi

  info "go: $(go version)"
  info "node: $(node --version)"
  info "npm: $(npm --version)"
  info "gateway config: $CONFIG_PATH"
  info "database url: $DATABASE_URL"
  info "dashboard api base url: $API_BASE_URL"
}

bootstrap_db() {
  if ! is_local_database; then
    die "bootstrap-db only supports local Postgres. Current database host is '$(database_host)'. Create the database from your hosted provider dashboard instead."
  fi

  parse_database_url

  command -v psql >/dev/null 2>&1 || die "psql is required for bootstrap-db"

  info "checking postgres connection..."
  psql "$DB_ADMIN_URL" -Atqc "select 1" >/dev/null || die "cannot connect to postgres at $DB_ADMIN_URL"

  local exists
  exists="$(psql "$DB_ADMIN_URL" -Atqc "select 1 from pg_database where datname = '$DB_NAME'")"
  if [[ "$exists" == "1" ]]; then
    info "database '$DB_NAME' already exists"
    return
  fi

  info "creating database '$DB_NAME'..."
  psql "$DB_ADMIN_URL" -c "create database \"$DB_NAME\";" >/dev/null
  info "database '$DB_NAME' created"
}

install_web_deps() {
  require_cmd npm

  if [[ -d "$WEB_DIR/node_modules" ]]; then
    info "web dependencies already installed"
    return
  fi

  info "installing web dependencies..."
  (
    cd "$WEB_DIR"
    npm install
  )
}

run_gateway() {
  require_cmd go

  info "starting gateway on http://127.0.0.1:8080"
  (
    cd "$ROOT_DIR"
    MANAGENT_CONFIG="$CONFIG_PATH" \
    MANAGENT_DATABASE_URL="$DATABASE_URL" \
    MANAGENT_MCP_SECRET_KEY="$MCP_SECRET_KEY" \
    MANAGENT_ADMIN_TOKEN="$ADMIN_TOKEN" \
    go run ./cmd/gateway
  )
}

run_web() {
  require_cmd npm

  info "starting dashboard on http://127.0.0.1:3000"
  (
    cd "$WEB_DIR"
    MANAGENT_API_BASE_URL="$API_BASE_URL" \
    MANAGENT_ADMIN_TOKEN="$ADMIN_TOKEN" \
    npm run dev
  )
}

run_dev() {
  check_prereqs
  if is_local_database; then
    bootstrap_db
  else
    info "remote postgres detected at $(database_host); skipping local bootstrap"
  fi
  install_web_deps

  info "starting gateway in the background..."
  (
    cd "$ROOT_DIR"
    MANAGENT_CONFIG="$CONFIG_PATH" \
    MANAGENT_DATABASE_URL="$DATABASE_URL" \
    MANAGENT_MCP_SECRET_KEY="$MCP_SECRET_KEY" \
    MANAGENT_ADMIN_TOKEN="$ADMIN_TOKEN" \
    go run ./cmd/gateway
  ) &
  GATEWAY_PID=$!

  cleanup() {
    if kill -0 "$GATEWAY_PID" >/dev/null 2>&1; then
      info "stopping gateway..."
      kill "$GATEWAY_PID" >/dev/null 2>&1 || true
      wait "$GATEWAY_PID" 2>/dev/null || true
    fi
  }

  trap cleanup EXIT INT TERM

  sleep 2
  run_web
}

usage() {
  cat <<'EOF'
Usage: ./scripts/dev-host.sh <command>

Commands:
  check         Verify required local tools and show the resolved config
  bootstrap-db  Create the local Postgres database if it does not exist
  install-web   Install dashboard dependencies in ./web
  gateway       Run the Go gateway only
  web           Run the Next.js dashboard only
  dev           Bootstrap local Postgres if needed, install web deps, run gateway + dashboard

Environment overrides:
  MANAGENT_CONFIG
  MANAGENT_DATABASE_URL
  MANAGENT_MCP_SECRET_KEY
  MANAGENT_API_BASE_URL
  MANAGENT_ADMIN_TOKEN
EOF
}

main() {
  local command="${1:-}"

  case "$command" in
    check)
      check_prereqs
      ;;
    bootstrap-db)
      bootstrap_db
      ;;
    install-web)
      install_web_deps
      ;;
    gateway)
      run_gateway
      ;;
    web)
      run_web
      ;;
    dev)
      run_dev
      ;;
    ""|-h|--help|help)
      usage
      ;;
    *)
      die "unknown command: $command"
      ;;
  esac
}

main "$@"
