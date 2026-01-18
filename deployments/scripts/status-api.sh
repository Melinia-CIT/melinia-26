#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOY_DIR"

echo "=========================================="
echo "  API Server Status"
echo "=========================================="
echo ""

CONTAINERS=("postgres" "pgbouncer" "redis" "api-1" "api-2" "api-3" "api-4" "worker" "caddy" "node-exporter" "postgres-exporter" "redis-exporter" "cadvisor")

echo "Container Status:"
for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker ps -a --filter "name=melinia-$container" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "melinia-$container")
    if [ -n "$STATUS" ]; then
        STATE=$(echo "$STATUS" | awk '{print $2}')
        if [[ "$STATE" == *"Up"* ]]; then
            echo "$STATUS"
        else
            echo "$STATUS"
        fi
    else
        echo "ERROR: melinia-$container - Not found"
    fi
done

echo ""
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" melinia-* 2>/dev/null | grep -v "CONTAINER" || echo "No containers running"

echo ""
echo "Health Checks:"

HEALTHY_CONTAINERS=("postgres" "pgbouncer" "redis" "api-1" "api-2" "api-3" "api-4" "caddy")

for container in "${HEALTHY_CONTAINERS[@]}"; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "melinia-$container" 2>/dev/null || echo "no-healthcheck")
    if [ "$HEALTH" = "healthy" ]; then
        echo "OK: melinia-$container: healthy"
    elif [ "$HEALTH" = "unhealthy" ]; then
        echo "ERROR: melinia-$container: unhealthy"
    elif [ "$HEALTH" = "no-healthcheck" ]; then
        echo "WARNING: melinia-$container: no healthcheck"
    else
        echo "INFO: melinia-$container: $HEALTH"
    fi
done

echo ""
echo "Exporter Endpoints:"
EXPORTER_PORTS=("9100:Node" "9187:PostgreSQL" "9121:Redis" "8080:cAdvisor")

for port_info in "${EXPORTER_PORTS[@]}"; do
    port="${port_info%%:*}"
    name="${port_info##*:}"
    if curl -s http://localhost:$port/metrics > /dev/null 2>&1; then
        echo "OK: $name Exporter: http://localhost:$port/metrics"
    else
        echo "ERROR: $name Exporter: NOT responding on port $port"
    fi
done

echo ""
echo "Useful commands:"
echo "  View all logs:   docker-compose -f docker-compose.production.yml logs"
echo "  Follow logs:      docker-compose -f docker-compose.production.yml logs -f [service]"
echo "  Restart all:      docker-compose -f docker-compose.production.yml restart"
echo "  Stop all:         docker-compose -f docker-compose.production.yml down"
echo ""
