#!/usr/bin/env bash
# Per-boot service reconciliation for Cloud Agents.
# Starts PostgreSQL and MinIO, ensures the database, role and bucket exist,
# then applies migrations. Idempotent: safe to run on every boot.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

log() { echo "[start] $*"; }

# Load DATABASE_* and S3_* values written by install.sh.
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$REPO_ROOT/.env"
  set +a
fi

# --- PostgreSQL (runs as the current user, not the postgres system user) -------
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
export PATH="$PGBIN:$PATH"
PGDATA="${PGDATA:-$HOME/.atlas-pgdata}"
PGPORT=5432

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  log "Initializing PostgreSQL data directory at $PGDATA..."
  mkdir -p "$PGDATA"
  initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
fi

if ! pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  log "Starting PostgreSQL on port $PGPORT..."
  pg_ctl -D "$PGDATA" -o "-p $PGPORT -c listen_addresses='127.0.0.1' -c unix_socket_directories='/tmp'" -l "$PGDATA/server.log" -w start
else
  log "PostgreSQL already running."
fi

# Wait for readiness.
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p "$PGPORT" -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done

# Ensure the atlas role and database exist (idempotent).
psql -h 127.0.0.1 -p "$PGPORT" -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='atlas'" \
  | grep -q 1 || psql -h 127.0.0.1 -p "$PGPORT" -U postgres -c "CREATE ROLE atlas LOGIN PASSWORD 'atlas_local' SUPERUSER"
psql -h 127.0.0.1 -p "$PGPORT" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='atlas'" \
  | grep -q 1 || psql -h 127.0.0.1 -p "$PGPORT" -U postgres -c "CREATE DATABASE atlas OWNER atlas"

# --- MinIO (S3-compatible object storage) -------------------------------------
MINIO_DATA="${MINIO_DATA:-$HOME/.atlas-minio}"
mkdir -p "$MINIO_DATA"
if ! curl -fsS http://127.0.0.1:9000/minio/health/ready >/dev/null 2>&1; then
  log "Starting MinIO on ports 9000/9001..."
  MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin \
    nohup minio server "$MINIO_DATA" --address ':9000' --console-address ':9001' \
    >"$MINIO_DATA/minio.log" 2>&1 &
  for _ in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:9000/minio/health/ready >/dev/null 2>&1; then break; fi
    sleep 1
  done
else
  log "MinIO already running."
fi

# Ensure the media bucket exists and is publicly readable (idempotent).
mc alias set atlas-local http://127.0.0.1:9000 minioadmin minioadmin >/dev/null 2>&1 || true
mc mb --ignore-existing atlas-local/atlas-media >/dev/null 2>&1 || true
mc anonymous set download atlas-local/atlas-media >/dev/null 2>&1 || true

# --- Migrations ---------------------------------------------------------------
# Require a reachable DB; migrations are the source of the schema.
log "Applying Payload migrations..."
pnpm payload:migrate -- --force-accept-warning
log "Applying Drizzle migrations..."
node scripts/migrate.mjs

log "start complete: PostgreSQL (5432), MinIO (9000/9001), migrations applied."
