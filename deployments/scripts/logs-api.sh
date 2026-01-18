#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$DEPLOY_DIR"

SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo -e "${YELLOW}Usage: ./logs-api.sh [service_name]${NC}"
    echo ""
    echo "Available services:"
    echo "  all       - Follow all logs (default)"
    echo "  postgres  - PostgreSQL database"
    echo "  pgbouncer - PgBouncer connection pooler"
    echo "  redis     - Redis cache"
    echo "  api-1     - API instance 1"
    echo "  api-2     - API instance 2"
    echo "  api-3     - API instance 3"
    echo "  api-4     - API instance 4"
    echo "  worker    - Background worker"
    echo "  caddy     - Caddy reverse proxy"
    echo "  node      - Node exporter"
    echo "  postgres-exporter - PostgreSQL exporter"
    echo "  redis-exporter    - Redis exporter"
    echo "  cadvisor  - cAdvisor container metrics"
    exit 0
fi

echo -e "${GREEN}=========================================="
echo "  API Server Logs - $SERVICE"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

if [ "$SERVICE" = "all" ]; then
    docker-compose -f docker-compose.production.yml logs -f
else
    docker-compose -f docker-compose.production.yml logs -f "$SERVICE"
fi
