#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOY_DIR"

echo "=========================================="
echo "  Test Email Alerts"
echo "=========================================="
echo ""

echo "This will send a test alert to verify email notifications"
echo ""


if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    exit 1
fi

GRAFANA_PASS=$(grep "^GRAFANA_ADMIN_PASSWORD=" .env | cut -d'=' -f2)
SMTP_HOST=$(grep "^MAILCOW_SMTP_HOST=" .env | cut -d'=' -f2)
SMTP_PORT=$(grep "^MAILCOW_SMTP_PORT=" .env | cut -d'=' -f2)
SMTP_USER=$(grep "^MAILCOW_SMTP_USERNAME=" .env | cut -d'=' -f2)

echo "Email Configuration:"
echo "  SMTP Host: $SMTP_HOST:$SMTP_PORT"
echo "  SMTP User: $SMTP_USER"
echo "  Recipients: kottesh.j@gmail.com, ansuhm55@gmail.com, vishalmalathi2005@gmail.com"
echo ""

read -p "Send test alert now? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo "Sending test alert..."
echo ""

RESULT=$(docker exec melinia-alertmanager amtool alert add \
    alert=test_alert \
    alertname=TestAlert \
    severity=warning \
    description="This is a test alert from Melinia monitoring setup" \
    --alertmanager.url=http://localhost:9093 2>&1)

if [ $? -eq 0 ]; then
    echo "OK: Test alert sent successfully!"
    echo ""
    echo "Check your inbox at:"
    echo "  - kottesh.j@gmail.com"
    echo "  - ansuhm55@gmail.com"
    echo "  - vishalmalathi2005@gmail.com"
    echo ""
    echo "If you don't receive the email within a few minutes, check:"
    echo "  - Alertmanager logs: docker logs melinia-alertmanager"
    echo "  - SMTP settings in .env"
    echo "  - Mailcow mailbox configuration"
else
    echo "ERROR: Failed to send test alert"
    echo ""
    echo "Error: $RESULT"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check Alertmanager logs: docker logs melinia-alertmanager"
    echo "  - Verify Alertmanager is running: docker ps | grep alertmanager"
    echo "  - Check SMTP credentials in .env"
    echo "  - Verify Mailcow SMTP configuration"
fi

echo ""
echo "View all alerts:"
echo "  http://localhost:9093/#/alerts"
echo ""
