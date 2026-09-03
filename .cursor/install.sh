#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agents.
# Installs system services (PostgreSQL, MinIO), project dependencies, and
# generates source-derived state. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

log() { echo "[install] $*"; }

# --- System packages: PostgreSQL + MinIO (S3) ---------------------------------
if ! command -v pg_ctl >/dev/null 2>&1 && ! ls /usr/lib/postgresql/*/bin/pg_ctl >/dev/null 2>&1; then
  log "Installing PostgreSQL..."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
else
  log "PostgreSQL already installed."
fi

if ! command -v minio >/dev/null 2>&1; then
  log "Installing MinIO server..."
  sudo curl -sSL https://dl.min.io/server/minio/release/linux-amd64/minio -o /usr/local/bin/minio
  sudo chmod +x /usr/local/bin/minio
else
  log "MinIO server already installed."
fi

if ! command -v mc >/dev/null 2>&1; then
  log "Installing MinIO client (mc)..."
  sudo curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
  sudo chmod +x /usr/local/bin/mc
else
  log "MinIO client already installed."
fi

# --- Environment file ---------------------------------------------------------
if [ ! -f "$REPO_ROOT/.env" ]; then
  log "Creating .env from .env.example (local dev defaults)."
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  # Deterministic local-only secrets so the app boots without manual steps.
  {
    echo ""
    echo "# --- Cloud Agent local dev overrides ---"
    echo "PAYLOAD_SECRET=local_dev_payload_secret_0123456789abcdef"
    echo "PREVIEW_SECRET=local_dev_preview_secret_0123456789abcdef"
    echo "BETTER_AUTH_SECRET=local_dev_better_auth_secret_base64_padding_xxxxxxxx="
    echo "CRON_SECRET=local_dev_cron_secret_0123456789abcdef0123456789abcdef"
  } >> "$REPO_ROOT/.env"
else
  log ".env already present; leaving it untouched."
fi

# --- Node dependencies --------------------------------------------------------
log "Installing pnpm dependencies..."
pnpm install --frozen-lockfile

# --- Source-derived generation ------------------------------------------------
# importMap.js is gitignored; Payload admin needs it. Generation touches no DB.
log "Generating Payload import map..."
pnpm generate:importmap

log "install complete."
