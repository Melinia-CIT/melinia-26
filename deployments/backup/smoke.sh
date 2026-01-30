#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
}

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
export AWS_EC2_METADATA_DISABLED="true"

TMP="/tmp/r2-smoke-$$.txt"
KEY="__smoke__/$(date -u '+%Y%m%dT%H%M%SZ')-$(hostname).txt"
echo "ok $(date -u '+%Y-%m-%dT%H:%M:%SZ') host=$(hostname) db_target=${DB_HOST}:${DB_PORT}" >"$TMP"

log "Uploading smoke object: s3://${R2_BUCKET}/${KEY}"
aws --endpoint-url "$R2_ENDPOINT" s3 cp "$TMP" "s3://${R2_BUCKET}/${KEY}"

log "Deleting smoke object: s3://${R2_BUCKET}/${KEY}"
aws --endpoint-url "$R2_ENDPOINT" s3 rm "s3://${R2_BUCKET}/${KEY}"

rm -f "$TMP"

log "R2 smoke test OK"
