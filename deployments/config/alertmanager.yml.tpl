global:
    resolve_timeout: 5m

route:
    receiver: "email-default"
    group_by: ["alertname", "severity", "instance"]
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h
    routes:
        - match:
              severity: critical
          receiver: "email-critical"
          continue: true
        - match:
              severity: warning
          receiver: "email-warning"

receivers:
    - name: "email-default"
      email_configs:
          - to: "${ALERT_EMAIL_TO}"
            from: "${MAILCOW_SMTP_USERNAME}"
            smarthost: "${MAILCOW_SMTP_HOST}:${MAILCOW_SMTP_PORT}"
            auth_username: "${MAILCOW_SMTP_USERNAME}"
            auth_password: "${MAILCOW_SMTP_PASSWORD}"
            require_tls: true
            tls_config:
                insecure_skip_verify: false
            send_resolved: true

    - name: "email-critical"
      email_configs:
          - to: "${ALERT_EMAIL_TO}"
            from: "${MAILCOW_SMTP_USERNAME}"
            smarthost: "${MAILCOW_SMTP_HOST}:${MAILCOW_SMTP_PORT}"
            auth_username: "${MAILCOW_SMTP_USERNAME}"
            auth_password: "${MAILCOW_SMTP_PASSWORD}"
            require_tls: true
            tls_config:
                insecure_skip_verify: false
            send_resolved: true
            headers:
                Subject: "[CRITICAL] {{ .GroupLabels.alertname }}"

    - name: "email-warning"
      email_configs:
          - to: "${ALERT_EMAIL_TO}"
            from: "${MAILCOW_SMTP_USERNAME}"
            smarthost: "${MAILCOW_SMTP_HOST}:${MAILCOW_SMTP_PORT}"
            auth_username: "${MAILCOW_SMTP_USERNAME}"
            auth_password: "${MAILCOW_SMTP_PASSWORD}"
            require_tls: true
            tls_config:
                insecure_skip_verify: false
            send_resolved: true
            headers:
                Subject: "[WARNING] {{ .GroupLabels.alertname }}"

inhibit_rules:
    - source_match:
          severity: "critical"
      target_match:
          severity: "warning"
      equal: ["alertname", "instance"]
