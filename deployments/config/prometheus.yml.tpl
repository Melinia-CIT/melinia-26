global:
    scrape_interval: ${SCRAPE_INTERVAL}
    evaluation_interval: ${EVALUATION_INTERVAL}
    external_labels:
        server: "${MONITORING_SERVER_NAME}"

alerting:
    alertmanagers:
        - static_configs:
              - targets:
                    - alertmanager:9093

rule_files:
    - /etc/prometheus/rules/*.yml

scrape_configs:
    - job_name: "prometheus"
      static_configs:
          - targets: ["localhost:9090"]
      metrics_path: /metrics

    - job_name: "prod-node"
      static_configs:
          - targets: ["${API_SERVER_PRIVATE_IP}:9100"]
      metrics_path: /metrics
      scheme: http
      relabel_configs:
          - source_labels: [__address__]
            target_label: instance
            regex: '([^:]+):\d+'
            replacement: "${PROD_SERVER_NAME}"

    - job_name: "prod-postgres"
      static_configs:
          - targets: ["${API_SERVER_PRIVATE_IP}:9187"]
      metrics_path: /metrics
      scheme: http
      relabel_configs:
          - source_labels: [__address__]
            target_label: instance
            regex: '([^:]+):\d+'
            replacement: "${PROD_SERVER_NAME}"

    - job_name: "prod-redis"
      static_configs:
          - targets: ["${API_SERVER_PRIVATE_IP}:9121"]
      metrics_path: /metrics
      scheme: http
      relabel_configs:
          - source_labels: [__address__]
            target_label: instance
            regex: '([^:]+):\d+'
            replacement: "${PROD_SERVER_NAME}"

    - job_name: "prod-cadvisor"
      static_configs:
          - targets: ["${API_SERVER_PRIVATE_IP}:8080"]
      metrics_path: /metrics
      scheme: http
      relabel_configs:
          - source_labels: [__address__]
            target_label: instance
            regex: '([^:]+):\d+'
            replacement: "${PROD_SERVER_NAME}"

    - job_name: "monitoring-node"
      static_configs:
          - targets: ["localhost:9100"]
      metrics_path: /metrics
      relabel_configs:
          - source_labels: [__address__]
            target_label: instance
            regex: '([^:]+):\d+'
            replacement: "${MONITORING_SERVER_NAME}"
