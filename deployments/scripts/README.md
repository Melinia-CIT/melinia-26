# Melinia Deployment Scripts

This directory contains scripts for deploying and managing the Melinia application and monitoring stack.

## Scripts Overview

### Deployment Scripts

#### `deploy-api.sh`

Deploys the production API server.

```bash
./deploy-api.sh
```

**Features:**

- Environment file validation
- Required variable checking
- Docker availability verification
- Automated image pull and deployment
- Post-deployment health checks

**Requirements:**

- `.env` file must exist with all required values configured
- Docker and Docker Compose installed

#### `deploy-monitor.sh`

Deploys the monitoring server (Prometheus, Grafana, Alertmanager).

```bash
./deploy-monitor.sh
```

**Features:**

- Environment file validation
- Network connectivity tests to production server
- Exporter port accessibility checks
- Automated image pull and deployment
- Post-deployment verification

**Requirements:**

- `.env` file must exist with monitoring values:
    - `MONITORING_SERVER_PRIVATE_IP` (private IP of monitoring server)
    - `GRAFANA_ADMIN_PASSWORD` (strong password)
    - `MAILCOW_SMTP_PASSWORD` (from Mailcow)
- Production server exporters must be accessible

---

### Status Scripts

#### `status-api.sh`

Shows comprehensive status of the API server.

```bash
./status-api.sh
```

**Displays:**

- Container status (running/stopped)
- Resource usage (CPU, memory)
- Health check status
- Exporter endpoint availability

#### `status-monitor.sh`

Shows comprehensive status of the monitoring server.

```bash
./status-monitor.sh
```

**Displays:**

- Container status
- Resource usage
- Service endpoint status
- Prometheus targets health
- Active alerts
- Grafana datasources

---

### Log Scripts

#### `logs-api.sh`

Follows logs from API server services.

```bash
./logs-api.sh [service_name]
```

**Services:**

- `all` - All services (default)
- `postgres` - PostgreSQL
- `pgbouncer` - Connection pooler
- `redis` - Redis
- `api-1` through `api-4` - API instances
- `worker` - Background worker
- `caddy` - Reverse proxy
- `node` - Node exporter
- `postgres-exporter` - PostgreSQL exporter
- `redis-exporter` - Redis exporter
- `cadvisor` - Container metrics

#### `logs-monitor.sh`

Follows logs from monitoring services.

```bash
./logs-monitor.sh [service_name]
```

**Services:**

- `all` - All services (default)
- `prometheus` - Metrics server
- `grafana` - Dashboard
- `alertmanager` - Notifications
- `node-exporter` - System metrics

---

### Testing Scripts

#### `test-email.sh`

Sends a test alert to verify email notifications.

```bash
./test-email.sh
```

**What it does:**

- Sends a test alert via Alertmanager
- Verifies email delivery to all recipients
- Provides troubleshooting tips if email fails

---

## Quick Start Guide

### 1. Deploy Production Server

```bash
cd /home/kottes/melinia/deployments

# Configure environment
cp .env.example .env
nano .env  # Fill in all required values

# Deploy
./scripts/deploy-api.sh

# Check status
./scripts/status-api.sh
```

### 2. Deploy Monitoring Server

```bash
cd /home/kottes/melinia/deployments

# Configure environment (same .env file as API)
# Add monitoring variables to existing .env or copy from .env.example
nano .env  # Configure:
  # MONITORING_SERVER_PRIVATE_IP=actual_private_ip
  # GRAFANA_ADMIN_PASSWORD=strong_password
  # MAILCOW_SMTP_PASSWORD=mailcow_app_password
  # GRAFANA_DOMAIN=grafana.melinia.in

# Deploy
./scripts/deploy-monitor.sh

# Check status
./scripts/status-monitor.sh

# Test email alerts
./scripts/test-email.sh
```

---

## Access URLs

### Production Server

- API: `http://localhost:3000`
- Caddy HTTP: `http://localhost:80`
- Caddy HTTPS: `https://localhost:443`
- Exporters: `http://localhost:9100/metrics`, `:9187/metrics`, `:9121/metrics`, `:8080/metrics`

### Monitoring Server

- Grafana: `https://grafana.melinia.in` (admin / password from .env)
- Prometheus: `http://localhost:9090` (via SSH tunnel)
- Alertmanager: `http://localhost:9093` (via SSH tunnel)
- Targets: `http://localhost:9090/targets`
- Alerts: `http://localhost:9093/#/alerts`

---

## Troubleshooting

### Deployment Fails

- Check environment variables: `cat .env`
- Verify Docker is running: `docker ps`
- Check disk space: `df -h`
- View logs: `./logs-api.sh` or `./logs-monitor.sh`

### Exporters Not Accessible

- Verify production server is deployed: `./scripts/status-api.sh`
- Check exporter ports: `curl http://localhost:9100/metrics`
- Verify network connectivity: `ping <prod-private-ip>`
- Check firewall rules

### Email Alerts Not Working

- Run test: `./scripts/test-email.sh`
- Check Alertmanager logs: `docker logs melinia-alertmanager`
- Verify SMTP credentials in `.env`
- Check Mailcow mailbox configuration

### Grafana Can't Connect to Prometheus

- Check Prometheus is running: `docker ps | grep prometheus`
- Verify network: `docker network inspect melinia-monitoring`
- Check Grafana datasources: `http://localhost:3000/datasources`

---

## Useful Commands

```bash
# Check all containers
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.monitoring.yml ps

# Restart all services
docker-compose -f docker-compose.production.yml restart
docker-compose -f docker-compose.monitoring.yml restart

# Stop all services
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.monitoring.yml down

# View specific service logs
docker logs melinia-prometheus
docker logs melinia-api-1

# Check container stats
docker stats
```

---

## Script Features

All scripts include:

- ✅ Colored output (green=success, red=error, yellow=warning)
- ✅ Error handling with `set -e`
- ✅ Input validation
- ✅ Helpful error messages
- ✅ Progress indicators
- ✅ Clear section headers
