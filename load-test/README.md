# Load Testing Scripts

This directory contains k6 load testing scripts for the Melinia API.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Linux
curl https://github.com/grafana/k6/releases/download/v0.53.0/k6-v0.53.0-linux-amd64.tar.gz -L | tar xvz
sudo mv k6-v0.53.0-linux-amd64/k6 /usr/local/bin/
```

## Test Scripts

### 1. login-flow.js

Tests login + browse scenario with realistic user behavior.

**Load Profile:**

- Ramp 0 → 200 VUs (2 min)
- Hold 200 VUs (3 min)
- Ramp 200 → 400 VUs (2 min)
- Hold 400 VUs (5 min)
- Ramp 400 → 800 VUs (3 min)
- Hold 800 VUs (10 min) ← SUSTAINED
- Ramp 800 → 0 VUs (2 min)
- Total: 27 minutes

**Run:**

```bash
k6 run login-flow.js --out html=report-login.html
```

### 2. browse-only.js

Tests browse-only scenario (read-heavy traffic).

**Load Profile:**

- Ramp 0 → 300 VUs (2 min)
- Ramp 300 → 600 VUs (5 min)
- Ramp 600 → 800 VUs (8 min)
- Hold 800 VUs (12 min)
- Ramp 800 → 0 VUs (3 min)
- Total: 30 minutes

**Run:**

```bash
k6 run browse-only.js --out html=report-browse.html
```

## Test Credentials

Copy `test-credentials.json.example` to `test-credentials.json` and add real credentials:

```json
{
    "valid": {
        "email": "your_test_email@example.com",
        "passwd": "YourTestPassword123"
    },
    "invalid": {
        "email": "nonexistent@test.com",
        "passwd": "wrongpassword"
    }
}
```

## Monitoring During Test

Open multiple terminals to monitor:

1. Container stats:

```bash
docker stats melinia-api-{1,2,3,4} melinia-caddy
```

2. API logs (errors only):

```bash
docker logs -f melinia-api-1 | grep ERROR
```

3. Caddy logs:

```bash
docker logs -f melinia-caddy
```

4. Uptime Kuma: https://uptime.melinia.in

## Success Criteria

| Metric               | Target   |
| -------------------- | -------- |
| Response time p95    | < 800ms  |
| Response time p99    | < 1500ms |
| Error rate           | < 5%     |
| CPU usage            | < 85%    |
| RAM usage            | < 3.5GB  |
| No container crashes | ✅       |

## Quick Test

For a quick 2-minute smoke test:

```bash
k6 run browse-only.js --duration 2m
```
