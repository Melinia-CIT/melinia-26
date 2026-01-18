#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Melinia API Production Deployment"
echo "=========================================="
echo ""

cd "$DEPLOY_DIR"

mkdir -p /app/melinia/logs/api-1
mkdir -p /app/melinia/logs/api-2
mkdir -p /app/melinia/logs/api-3
mkdir -p /app/melinia/logs/api-4

echo "[1/5] Checking environment..."
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "OK: Created .env file"
    echo "WARNING: Please edit .env and fill in all required values before deploying again"
    echo "   Required: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, RAZORPAY credentials, AWS credentials"
    exit 1
fi
echo "OK: .env file found"

echo ""
echo "[2/5] Validating configuration..."

MISSING_VARS=0
check_var() {
    if grep -q "^$1=.*change_this" .env || grep -q "^$1=$" .env; then
        echo "ERROR: $1 is not configured"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
}

check_var "POSTGRES_PASSWORD"
check_var "REDIS_PASSWORD"
check_var "JWT_SECRET"
check_var "RAZORPAY_KEY_ID"
check_var "AWS_ACCESS_KEY"

if [ $MISSING_VARS -gt 0 ]; then
    echo "ERROR: Found $MISSING_VARS unconfigured variables in .env"
    echo "Please configure all required values before deploying."
    exit 1
fi
echo "OK: Configuration validated"

echo ""
echo "[3/5] Checking Docker availability..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi
if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi
echo "OK: Docker and Docker Compose available"

echo ""
echo "[4/5] Pulling latest images..."
docker compose -f docker-compose.production.yml pull
echo "OK: Images pulled"

echo ""
echo "[5/5] Deploying services..."
docker compose -f docker-compose.production.yml up -d
echo "OK: Services started"

echo ""
echo "[Final] Verifying deployment..."
sleep 5

CONTAINERS=("postgres" "pgbouncer" "redis" "api-1" "api-2" "api-3" "api-4" "worker" "caddy")
ALL_HEALTHY=true

for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker ps --filter "name=melinia-$container" --format "{{.Status}}")
    if [ -z "$STATUS" ]; then
        echo "ERROR: melinia-$container is not running"
        ALL_HEALTHY=false
    else
        echo "OK: melinia-$container: $STATUS"
    fi
done

echo ""
docker compose -f docker-compose.production.yml ps

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - PostgreSQL:     melinia-postgres"
echo "  - PgBouncer:       melinia-pgbouncer"
echo "  - Redis:           melinia-redis"
echo "  - API (4 instances): melinia-api-1, api-2, api-3, api-4"
echo "  - Worker:          melinia-worker"
echo "  - Caddy:           melinia-caddy"
echo "  - Exporters:       node, postgres, redis, cadvisor"
echo ""
echo "Access:"
echo "  - API:            http://localhost:3000"
echo "  - Caddy HTTP:     http://localhost:80"
echo "  - Caddy HTTPS:    https://localhost:443"
echo ""
echo "Exporter Metrics:"
echo "  - Node:           curl http://localhost:9100/metrics"
echo "  - Postgres:       curl http://localhost:9187/metrics"
echo "  - Redis:          curl http://localhost:9121/metrics"
echo "  - cAdvisor:       curl http://localhost:8080/metrics"
echo ""
echo "Useful commands:"
echo "  View logs:       docker compose -f docker-compose.production.yml logs -f"
echo "  Check status:    docker compose -f docker-compose.production.yml ps"
echo "  Restart service: docker compose -f docker-compose.production.yml restart [service]"
echo "  Stop all:        docker compose -f docker-compose.production.yml down"
echo ""
if [ "$ALL_HEALTHY" = false ]; then
    echo "WARNING: Some containers are not healthy. Check logs for details."
fi
