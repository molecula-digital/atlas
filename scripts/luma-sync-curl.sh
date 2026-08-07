#!/usr/bin/env sh
# Trigger Luma → Atlas event sync against a Coolify / VPS deployment.
# Usage:
#   CRON_SECRET=… SITE_URL=https://atlas-sinaloa.tech ./scripts/luma-sync-curl.sh
set -eu

SITE_URL="${SITE_URL:-${NEXT_PUBLIC_SITE_URL:-}}"
SECRET="${CRON_SECRET:-${LUMA_SYNC_SECRET:-}}"

if [ -z "$SITE_URL" ]; then
  echo "SITE_URL (or NEXT_PUBLIC_SITE_URL) is required" >&2
  exit 1
fi
if [ -z "$SECRET" ]; then
  echo "CRON_SECRET (or LUMA_SYNC_SECRET) is required" >&2
  exit 1
fi

url="${SITE_URL%/}/api/cron/luma-sync"
curl -fsS -X POST \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Accept: application/json" \
  "$url"
echo
