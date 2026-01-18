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
    echo -e "${YELLOW}Usage: ./logs-monitor.sh [service_name]${NC}"
    echo ""
    echo "Available services:"
    echo "  all          - Follow all logs (default)"
    echo "  prometheus   - Prometheus metrics server"
    echo "  grafana      - Grafana dashboard"
    echo "  alertmanager - Alertmanager notifications"
    echo "  node-exporter - Node system metrics"
    exit 0
fi

echo -e "${GREEN}=========================================="
echo "  Monitoring Server Logs - $SERVICE"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

if [ "$SERVICE" = "all" ]; then
    docker-compose -f docker-compose.monitoring.yml logs -f
else
    docker-compose -f docker-compose.monitoring.yml logs -f "$SERVICE"
fi
