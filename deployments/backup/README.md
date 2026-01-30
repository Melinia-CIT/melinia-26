# Melinia DB Backup Container

Automated PostgreSQL backup to Cloudflare R2, running every 30 minutes (UTC boundaries: `:00` and `:30`).

## Features

- **Scheduled backups**: Runs every 30 minutes on UTC half-hour boundaries (`:00` and `:30`)
- **R2 storage**: Uploads compressed `pg_dump` files to Cloudflare R2 (S3-compatible)
- **Email alerts**:
    - **Startup failure**: Sends email and exits immediately (no retry)
    - **Runtime failure**: Retries up to 3 times, then sends email and exits
- **Direct DB access**: Connects to `postgres` directly (not `pgbouncer`) to avoid transaction pooling issues
- **UTC timestamps**: All backups use UTC for consistent restore workflows
- **Detailed error reporting**: Email includes database name, target host, failed step, and actual error message

## Storage Layout

Backups are stored in R2 with this key format:

```
DD/MM YYYY/mln_HHMMSS.dump
```

Example:

```
30/01 2026/mln_003000.dump
30/01 2026/mln_010000.dump
30/01 2026/mln_013000.dump
```

## Environment Variables

Required (set in `deployments/.env`):

- `DB_NAME` - Database name
- `DB_USERNAME` - Database user
- `DB_PASSWORD` - Database password
- `R2_ENDPOINT` - Cloudflare R2 S3 endpoint URL
- `R2_BUCKET` - R2 bucket name
- `R2_ACCESS_KEY_ID` - R2 S3 access key
- `R2_SECRET_ACCESS_KEY` - R2 S3 secret key

Optional (for email alerts):

- `BACKUP_ALERT_EMAIL_TO` - Recipient email (falls back to `ALERT_EMAIL_TO`)
- `MAILCOW_SMTP_HOST` - SMTP server
- `MAILCOW_SMTP_PORT` - SMTP port
- `MAILCOW_SMTP_USERNAME` - SMTP username (also used as "From" address)
- `MAILCOW_SMTP_PASSWORD` - SMTP password

Overridden by compose (do not set in `.env`):

- `DB_HOST=postgres` - Force direct connection to postgres container
- `DB_PORT=5432`
- `TZ=UTC`

Test mode (optional):

- `BACKUP_TEST_MODE=true` - Run backups every 15 seconds instead of 30 minutes

## Email Alerts

The container sends emails in these scenarios:

### 1. Startup Validation Failure

- **When**: Required env vars or tools are missing at container start
- **Action**: Sends email immediately and exits (no retry)
- **Subject**: "Melinia DB backup service failed to start"

### 2. Runtime Backup Failure (3 consecutive attempts)

- **When**: Backup fails 3 times in a row (any step: pg_dump, upload, cleanup)
- **Action**: Retries up to 3 times, then sends email and exits
- **Subject**: "Melinia DB backup service STOPPED after 3 consecutive failures"
- **Email includes**:
    - Database name and target host
    - Timestamp of last failure
    - Failed step (pg_dump, r2_upload, cleanup)
    - Actual error message from the failing command

### 3. Success After Previous Failures

- The failure counter resets to 0 after any successful backup
- Container continues running normally

Email "From" address is taken from `MAILCOW_SMTP_USERNAME` (not `MAIL_FROM`, which is used for AWS SES).

## Testing

### Test R2 connectivity (smoke test)

```bash
cd deployments
docker build -t melinia-db-backup:test ./backup

docker run --rm \
  --env-file .env \
  -e DB_NAME=dummy -e DB_USERNAME=dummy -e DB_PASSWORD=dummy \
  --entrypoint /backup/smoke.sh \
  melinia-db-backup:test
```

### Test backup scheduler (15-second intervals)

```bash
docker run --rm \
  --network melinia-network \
  --env-file .env \
  -e BACKUP_TEST_MODE=true \
  melinia-db-backup:test
```

### Manual backup (one-shot)

```bash
docker run --rm \
  --network melinia-network \
  --env-file .env \
  --entrypoint /backup/backup.sh \
  melinia-db-backup:test
```

## Deployment

The `db-backup` service is included in `docker-compose.production.yml`.

Start it with your normal compose workflow (requires Docker Compose v1 or v2):

```bash
cd deployments
docker-compose -f docker-compose.production.yml up -d db-backup
```

Or rebuild + start:

```bash
docker-compose -f docker-compose.production.yml up -d --build db-backup
```

## Monitoring

Check logs:

```bash
docker logs -f melinia-db-backup
```

Check latest backups in R2:

```bash
docker exec melinia-db-backup \
  aws --endpoint-url "$R2_ENDPOINT" s3 ls "s3://$R2_BUCKET/" --recursive | tail -20
```

## Retention

Configure R2 bucket lifecycle rules to expire objects after N days (recommended):

- Go to Cloudflare R2 dashboard
- Select bucket `mlndb`
- Add lifecycle rule: "Delete objects older than X days"
- Recommended: 7–30 days (depending on your compliance requirements)

Since backups run every 30 minutes, you'll generate 48 backups/day.

## Restore

Download a backup:

```bash
aws --endpoint-url https://ff880a416ad0d154e0e7c45288dadbb9.r2.cloudflarestorage.com \
  s3 cp "s3://mlndb/30/01 2026/mln_003000.dump" ./restore.dump
```

Restore to a fresh database:

```bash
pg_restore -h postgres -U melinia -d melinia_db -c -v ./restore.dump
```

## Retry Behavior

- **Startup failures**: No retry — sends email and exits immediately
- **Runtime backup failures**:
    - Retries up to 3 times (3 consecutive failures)
    - After 3 failures: sends email and exits with code 1
    - Docker restart policy will restart the container automatically
    - Failure counter resets to 0 after any successful backup

## Security Notes

- The R2 credentials in `deployments/.env` were exposed during development. **Rotate them immediately** in Cloudflare R2 settings.
- Treat `deployments/.env` as highly sensitive (DB passwords, SMTP passwords, API keys).
- Ensure `deployments/.env` is in `.gitignore` (already configured).
