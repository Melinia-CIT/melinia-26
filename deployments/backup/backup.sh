#!/usr/bin/env bash
set -euo pipefail

STEP="init"

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
}

mk_msmtp_config() {
  local cfg
  cfg="/tmp/msmtprc"
  umask 077
  cat >"$cfg" <<EOF
defaults
auth           on
tls            on
tls_starttls   on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /tmp/msmtp.log

account default
host ${MAILCOW_SMTP_HOST}
port ${MAILCOW_SMTP_PORT}
user ${MAILCOW_SMTP_USERNAME}
password ${MAILCOW_SMTP_PASSWORD}
from ${MAILCOW_SMTP_USERNAME}
EOF
  echo "$cfg"
}

can_email() {
  [[ -n "${BACKUP_ALERT_EMAIL_TO:-}" ]] && \
  [[ -n "${MAILCOW_SMTP_HOST:-}" ]] && \
  [[ -n "${MAILCOW_SMTP_PORT:-}" ]] && \
  [[ -n "${MAILCOW_SMTP_USERNAME:-}" ]] && \
  [[ -n "${MAILCOW_SMTP_PASSWORD:-}" ]] && \
  command -v msmtp >/dev/null 2>&1
}

send_mail() {
  local subject body cfg
  subject="$1"
  body="$2"

  if ! can_email; then
    log "WARN: email not configured; cannot send alert: $subject"
    return 0
  fi

  cfg="$(mk_msmtp_config)"

  {
    echo "From: ${MAILCOW_SMTP_USERNAME}"
    echo "To: ${BACKUP_ALERT_EMAIL_TO}"
    echo "Subject: ${subject}"
    echo "Date: $(date -u '+%a, %d %b %Y %H:%M:%S +0000')"
    echo
    echo "$body"
  } | msmtp -C "$cfg" -t
}

on_exit() {
  local code="$?"
  if [[ "$code" -ne 0 ]]; then
    local error_msg=""
    
    # Capture last error from stderr if available
    if [[ -f /tmp/backup_error.log ]]; then
      error_msg=$(tail -10 /tmp/backup_error.log 2>/dev/null || echo "")
    fi
    
    log "ERROR: Backup failed at step '${STEP}' with exit code ${code}"
    log "Error details: ${error_msg:-No details}"
  fi
}
trap on_exit EXIT

export BACKUP_ALERT_EMAIL_TO="${BACKUP_ALERT_EMAIL_TO:-${ALERT_EMAIL_TO:-}}"

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"

export PGPASSWORD="${DB_PASSWORD}"
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
export AWS_EC2_METADATA_DISABLED="true"

DATE_DIR="$(date -u '+%d/%m %Y')"
FILE_NAME="mln_$(date -u '+%H%M%S').dump"
S3_KEY="${DATE_DIR}/${FILE_NAME}"

LOCAL_FILE="/tmp/${DB_NAME}_$(date -u '+%Y%m%dT%H%M%SZ').dump"

log "Starting DB backup: db=${DB_NAME} host=${DB_HOST}:${DB_PORT} -> s3://${R2_BUCKET}/${S3_KEY}"

STEP="pg_dump"
pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USERNAME" \
  -d "$DB_NAME" \
  -F c \
  -Z 9 \
  -f "$LOCAL_FILE" 2>/tmp/backup_error.log

STEP="r2_upload"
aws --endpoint-url "$R2_ENDPOINT" s3 cp \
  "$LOCAL_FILE" \
  "s3://${R2_BUCKET}/${S3_KEY}" 2>>/tmp/backup_error.log

STEP="cleanup"
rm -f "$LOCAL_FILE"

STEP="done"
log "Backup uploaded successfully"
