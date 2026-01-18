#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOY_DIR"

echo "=========================================="
echo "  Monitoring Server Status"
echo "=========================================="
echo ""

CONTAINERS=("prometheus" "grafana" "alertmanager" "node-exporter")

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
echo "Service Endpoints:"
SERVICES=("9090:Prometheus:API" "9093:Alertmanager:API" "3000:Grafana:Web" "9100:Node-Exporter:Metrics")

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r port name type <<< "$service_info"
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        echo "OK: $name ($type): http://localhost:$port"
    else
        echo "ERROR: $name ($type): NOT responding on port $port"
    fi
done

echo ""
echo "Prometheus Targets:"
if curl -s http://localhost:9090/api/v1/targets > /dev/null 2>&1; then
    TARGETS=$(curl -s http://localhost:9090/api/v1/targets | python3 -c "import sys, json; data = json.load(sys.stdin); targets = [f\"{t['labels']['job']} ({t['labels'].get('instance', 'unknown')}): {t['health']}\" for t in data['data']['activeTargets']]; print('\n'.join(targets))" 2>/dev/null)

    if [ -n "$TARGETS" ]; then
        echo "$TARGETS" | while read -r line; do
            if [[ "$line" == *"up"* ]]; then
                echo "OK: $line"
            else
                echo "ERROR: $line"
            fi
        done
    else
        echo "WARNING: No targets found or unable to parse"
    fi
else
    echo "ERROR: Prometheus API not responding"
fi

echo ""
echo "Active Alerts:"
if curl -s http://localhost:9093/api/v2/alerts > /dev/null 2>&1; then
    ALERTS=$(curl -s http://localhost:9093/api/v2/alerts | python3 -c "import sys, json; data = json.load(sys.stdin); alerts = [f\"{a['labels'].get('alertname', 'unknown')} ({a['labels'].get('severity', 'unknown')}): {a['status']['state']}\" for a in data if a['status']['state'] == 'firing']; print('\n'.join(alerts) if alerts else 'No firing alerts')" 2>/dev/null)

    if [ "$ALERTS" = "No firing alerts" ]; then
        echo "OK: No firing alerts"
    else
        echo "$ALERTS" | while read -r line; do
            echo "ALERT: $line"
        done
    fi
else
    echo "ERROR: Alertmanager API not responding"
fi

echo ""
echo "Grafana Datasources:"
if curl -s http://localhost:3000/api/datasources > /dev/null 2>&1; then
    DS=$(curl -s http://localhost:3000/api/datasources -u admin:$(grep "^GRAFANA_ADMIN_PASSWORD=" .env | cut -d'=' -f2) | python3 -c "import sys, json; data = json.load(sys.stdin); datasources = [f\"{ds['name']}: {ds['type']}\" for ds in data]; print('\n'.join(datasources))" 2>/dev/null)
    if [ -n "$DS" ]; then
        echo "$DS" | while read -r line; do
            echo "OK: $line"
        done
    else
        echo "WARNING: No datasources found or unable to parse"
    fi
else
    echo "ERROR: Grafana API not responding"
fi

echo ""
echo "Access URLs:"
PUBLIC_IP=$(hostname -I | awk '{print $1}')
echo "  Grafana:        http://$PUBLIC_IP:3000"
echo "  Prometheus:     http://$PUBLIC_IP:9090"
echo "  Alertmanager:   http://$PUBLIC_IP:9093"
echo "  Prometheus Targets: http://$PUBLIC_IP:9090/targets"
echo "  Alertmanager Alerts: http://$PUBLIC_IP:9093/#/alerts"
echo ""


echo "Useful commands:"
echo "  View all logs:   docker-compose -f docker-compose.monitoring.yml logs"
echo "  Follow logs:      docker-compose -f docker-compose.monitoring.yml logs -f [service]"
echo "  Restart all:      docker-compose -f docker-compose.monitoring.yml restart"
echo "  Stop all:         docker-compose -f docker-compose.monitoring.yml down"
echo ""
