#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Melinia Monitoring Server Deployment"
echo "=========================================="
echo ""

cd "$DEPLOY_DIR"

echo "[1/7] Checking environment..."
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "OK: Created .env file"
    echo ""
    echo "WARNING: REQUIRED: Edit .env and configure:"
    echo "   1. MONITORING_SERVER_PRIVATE_IP (private IP of monitoring server)"
    echo "   2. GRAFANA_ADMIN_PASSWORD (strong password)"
    echo "   3. MAILCOW_SMTP_PASSWORD (from Mailcow app password)"
    echo "   4. GRAFANA_DOMAIN (e.g., grafana.melinia.in)"
    echo "   5. ALERT_EMAIL_TO (email to receive alerts)"
    echo ""
    echo "Example:"
    echo "   MONITORING_SERVER_PRIVATE_IP=10.0.0.10"
    echo "   GRAFANA_ADMIN_PASSWORD=your_secure_password_here"
    echo "   MAILCOW_SMTP_PASSWORD=your_mailcow_app_password"
    echo "   GRAFANA_DOMAIN=grafana.melinia.in"
    echo "   ALERT_EMAIL_TO=admin@example.com"
    echo ""
    echo "Please configure these values and run again."
    exit 1
fi
echo "OK: .env file found"

echo ""
echo "[2/7] Validating configuration..."

MISSING_VARS=0
check_var() {
    if grep -q "^$1=.*CHANGE_THIS" .env || grep -q "^$1=10.0.0.10" .env && [ "$1" = "MONITORING_SERVER_PRIVATE_IP" ]; then
        echo "ERROR: $1 is not configured"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
}

check_var "MONITORING_SERVER_PRIVATE_IP"
check_var "GRAFANA_ADMIN_PASSWORD"
check_var "MAILCOW_SMTP_PASSWORD"
check_var "GRAFANA_DOMAIN"
check_var "ALERT_EMAIL_TO"

if [ $MISSING_VARS -gt 0 ]; then
    echo "ERROR: Found $MISSING_VARS unconfigured variables in .env"
    echo "Please configure all required values before deploying."
    exit 1
fi
echo "OK: Configuration validated"

echo ""
echo "[3/7] Checking Docker availability..."
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
echo "[4/7] Generating config files from templates..."
export $(grep -v '^#' .env | xargs)
envsubst < config/prometheus.yml.tpl > config/prometheus.yml

if [ -n "${PROMETHEUS_REMOTE_WRITE_URL}" ]; then
    cat >> config/prometheus.yml << EOF

remote_write:
    - url: ${PROMETHEUS_REMOTE_WRITE_URL}
      queue_config:
          max_samples_per_send: ${PROMETHEUS_MAX_SAMPLES_PER_SEND:-10000}
          batch_send_deadline: ${PROMETHEUS_BATCH_DEADLINE:-30s}
          capacity: ${PROMETHEUS_QUEUE_CAPACITY:-20000}
          max_shards: ${PROMETHEUS_MAX_SHARDS:-30}
      write_relabel_configs:
          - source_labels: [__name__]
            regex: "up|go_.*"
            action: drop
EOF
fi

envsubst < config/alertmanager.yml.tpl > config/alertmanager.yml
echo "OK: Config files generated"

echo ""
echo "[5/7] Testing connectivity to monitoring server..."
API_SERVER_IP=$(grep "^API_SERVER_PRIVATE_IP=" .env | cut -d'=' -f2)
if [ -z "$API_SERVER_IP" ]; then
    echo "ERROR: API_SERVER_PRIVATE_IP not set in .env"
    exit 1
fi
echo "Testing connection to API server at $API_SERVER_IP..."

PORTS_TO_TEST=("9100" "9187" "9121" "8080")
PORT_NAMES=("Node Exporter" "PostgreSQL Exporter" "Redis Exporter" "cAdvisor")
ALL_OK=true

for i in "${!PORTS_TO_TEST[@]}"; do
    port="${PORTS_TO_TEST[$i]}"
    name="${PORT_NAMES[$i]}"
    if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$API_SERVER_IP/$port" 2>/dev/null; then
        echo "  OK: $name ($port) accessible"
    else
        echo "  ERROR: $name ($port) NOT accessible"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    echo ""
    echo "WARNING: Some exporter ports are not accessible from the monitoring server."
    echo "   Possible causes:"
    echo "   - API server exporters not deployed"
    echo "   - Exporters not exposed on 0.0.0.0 (check docker-compose.production.yml)"
    echo "   - Firewall blocking private network traffic"
    echo "   - Private network not configured correctly"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "[6/7] Pulling latest images..."
docker compose -f docker-compose.monitoring.yml pull
echo "OK: Images pulled"

echo ""
echo "[7/7] Deploying services..."
docker compose -f docker-compose.monitoring.yml up -d
echo "OK: Services started"

echo ""
echo "[8/8] Verifying deployment..."
sleep 5

CONTAINERS=("prometheus" "alertmanager" "monitor-caddy" "monitoring-node-exporter")
ALL_HEALTHY=true
FAILED_CONTAINERS=()

for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker ps --filter "name=melinia-$container" --format "{{.Status}}" 2>/dev/null || echo "")
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "melinia-$container" 2>/dev/null || echo "none")
    RUNNING=$(docker inspect --format='{{.State.Running}}' "melinia-$container" 2>/dev/null || echo "false")
    
    if [ "$RUNNING" != "true" ]; then
        echo "ERROR: melinia-$container is not running (Status: $STATUS)"
        ALL_HEALTHY=false
        FAILED_CONTAINERS+=("$container")
    elif [[ "$STATUS" == *"Restarting"* ]]; then
        echo "ERROR: melinia-$container is in restart loop (Status: $STATUS)"
        ALL_HEALTHY=false
        FAILED_CONTAINERS+=("$container")
    elif [ "$HEALTH" = "healthy" ]; then
        echo "OK: melinia-$container: $STATUS"
    elif [ "$HEALTH" = "none" ]; then
        echo "OK: melinia-$container: $STATUS (no health check)"
    else
        echo "INFO: melinia-$container: starting up ($STATUS)"
    fi
done

if [ "$ALL_HEALTHY" = false ]; then
    echo ""
    echo "ERROR: Deployment failed. Container logs:"
    for c in "${FAILED_CONTAINERS[@]}"; do
        echo ""
        echo "=== melinia-$c ==="
        docker compose -f docker-compose.monitoring.yml logs --tail=20 "$c"
    done
    exit 1
fi

echo ""
echo "Checking services..."
sleep 2

if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "OK: Prometheus API responding"
else
    echo "WARNING: Prometheus API not responding yet (may need more time)"
fi

if curl -s http://localhost:9093/-/healthy > /dev/null 2>&1; then
    echo "OK: Alertmanager API responding"
else
    echo "WARNING: Alertmanager API not responding yet (may need more time)"
fi

echo ""
docker compose -f docker-compose.monitoring.yml ps

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Prometheus:   internal:9090 (SSH tunnel required)"
echo "  - Alertmanager: internal:9093 (SSH tunnel required)"
echo "  - Caddy:        public:80, 443"
echo "  - Node Exporter: public:9100"
echo ""


PUBLIC_IP=$(hostname -I | awk '{print $1}')
echo "Access via internal ports (from monitoring server):"
echo "  Prometheus:     http://$PUBLIC_IP:9090"
echo "  Alertmanager:   http://$PUBLIC_IP:9093"
echo ""


echo "Useful commands:"
echo "  View logs:       docker compose -f docker-compose.monitoring.yml logs -f [service]"
echo "  Check status:    docker compose -f docker-compose.monitoring.yml ps"
echo "  Restart service: docker compose -f docker-compose.monitoring.yml restart [service]"
echo "  Stop all:        docker compose -f docker-compose.monitoring.yml down"
echo ""
echo "SSH Tunnel Commands (run from your local machine):"
echo "  Prometheus:      ssh -L 9090:localhost:9090 user@$PUBLIC_IP"
echo "  Alertmanager:    ssh -L 9093:localhost:9093 user@$PUBLIC_IP"
echo ""
echo "After SSH tunnel, access:"
echo "  Prometheus:      http://localhost:9090"
echo "  Alertmanager:    http://localhost:9093"
echo ""


echo "Test email alerts (optional):"
echo "  docker exec melinia-alertmanager amtool alert add alert=test_alert severity=warning --alertmanager.url=http://localhost:9093"
echo ""
