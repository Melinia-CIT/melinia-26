#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
}

have() {
  command -v "$1" >/dev/null 2>&1
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
  have msmtp
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

require_env() {
  local name missing=0
  for name in "$@"; do
    if [[ -z "${!name:-}" ]]; then
      log "ERROR: missing env var: $name"
      missing=1
    fi
  done
  return "$missing"
}

validate() {
  local ok=0

  have pg_dump || { log "ERROR: pg_dump not found"; ok=1; }
  have aws || { log "ERROR: aws cli not found"; ok=1; }

  require_env DB_NAME DB_USERNAME DB_PASSWORD R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY || ok=1

  # DB_HOST/DB_PORT are optional; we default them.
  export DB_HOST="${DB_HOST:-postgres}"
  export DB_PORT="${DB_PORT:-5432}"

  # Email vars validated only if configured; if not, backups still run but no alerts.
  # Email vars validated only if configured; if not, backups still run but no alerts.
  if [[ -n "${BACKUP_ALERT_EMAIL_TO:-}" ]]; then
    require_env MAILCOW_SMTP_HOST MAILCOW_SMTP_PORT MAILCOW_SMTP_USERNAME MAILCOW_SMTP_PASSWORD || ok=1
  fi

  return "$ok"
}

sleep_until_next_half_hour_utc() {
  local m s target_min sleep_secs
  
  # TEST MODE: run every 15 seconds instead of 30 minutes
  if [[ "${BACKUP_TEST_MODE:-}" == "true" ]]; then
    log "TEST MODE: waiting 15s"
    sleep 15
    return 0
  fi
  
  m="$(date -u +%M)"
  s="$(date -u +%S)"
  m=$((10#$m))
  s=$((10#$s))

  if (( m < 30 )); then
    target_min=30
  else
    target_min=60
  fi

  sleep_secs=$(((target_min - m) * 60 - s))
  if (( sleep_secs <= 0 )); then
    sleep_secs=1
  fi

  log "Next backup in ${sleep_secs}s (UTC boundary)"
  sleep "$sleep_secs"
}

main() {
  export BACKUP_ALERT_EMAIL_TO="${BACKUP_ALERT_EMAIL_TO:-${ALERT_EMAIL_TO:-}}"

  if ! validate; then
    send_mail \
      "Melinia DB backup service failed to start" \
      "Startup validation failed on host $(hostname) at $(date -u '+%Y-%m-%dT%H:%M:%SZ').

Check container logs for details."
    exit 1
  fi

  log "db-backup service started (UTC scheduler)"

  local consecutive_failures=0
  local max_failures=3

  while true; do
    sleep_until_next_half_hour_utc
    
    if /backup/backup.sh; then
      consecutive_failures=0
      log "Backup succeeded, resetting failure counter"
    else
      consecutive_failures=$((consecutive_failures + 1))
      log "ERROR: Backup failed (attempt ${consecutive_failures}/${max_failures})"
      
      if (( consecutive_failures >= max_failures )); then
        log "CRITICAL: Max failures reached, sending alert email and exiting"
        send_mail \
          "Melinia DB backup service STOPPED after ${max_failures} consecutive failures" \
          "Backup service on host $(hostname) has failed ${max_failures} times in a row and will now exit.

Last failure: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
Database: ${DB_NAME}
Target: ${DB_HOST}:${DB_PORT}

Check container logs for error details:
  docker logs melinia-db-backup

The container will restart automatically if restart policy is configured."
        log "Alert email sent, exiting with code 1"
        exit 1
      fi
    fi
  done
}

main "$@"
