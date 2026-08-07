#!/usr/bin/env sh
# Usage: CRON_SECRET=… SITE_URL=https://atlas-sinaloa.tech ./scripts/luma-sync-curl.sh
set -eu

SITE_URL="${SITE_URL:-${NEXT_PUBLIC_SITE_URL:-}}"
SECRET="${CRON_SECRET:-}"

if [ -z "$SITE_URL" ]; then
  echo "SITE_URL (or NEXT_PUBLIC_SITE_URL) is required" >&2
  exit 1
fi
if [ -z "$SECRET" ]; then
  echo "CRON_SECRET is required" >&2
  exit 1
fi

curl -fsS -X POST \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Accept: application/json" \
  "${SITE_URL%/}/api/cron/luma-sync"
echo
