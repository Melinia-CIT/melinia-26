import http from "k6/http"
import { check, sleep } from "k6"

const BASE_URL = "https://app.melinia.in"

export const options = {
    scenarios: {
        login_browse: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "2m", target: 200 },
                { duration: "3m", target: 200 },
                { duration: "2m", target: 400 },
                { duration: "5m", target: 400 },
                { duration: "3m", target: 800 },
                { duration: "10m", target: 800 },
                { duration: "2m", target: 0 },
            ],
            gracefulRampDown: "30s",
        },
    },
    thresholds: {
        http_req_duration: ["p(95)<800", "p(99)<1500"],
        http_req_failed: ["rate<0.05"],
    },
}

const TEST_CREDENTIALS = JSON.parse(open(__ENV.CREDENTIALS_FILE || "./test-credentials.json"))

export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        JSON.stringify(TEST_CREDENTIALS.valid),
        { headers: { "Content-Type": "application/json" } }
    )

    check(loginRes, {
        "Test login successful": r => r.status === 200,
    })

    return { accessToken: loginRes.json("accessToken") }
}

export default function (data) {
    const action = Math.random()

    if (action < 0.4) {
        const loginRes = http.post(
            `${BASE_URL}/api/v1/auth/login`,
            JSON.stringify(TEST_CREDENTIALS.valid),
            { headers: { "Content-Type": "application/json" } }
        )

        check(loginRes, {
            "Login successful": r => r.status === 200,
            "Has access token": r => r.json("accessToken") !== undefined,
        })

        if (loginRes.status === 200) {
            const token = loginRes.json("accessToken")
            const headers = { Authorization: `Bearer ${token}` }

            const eventsRes = http.get(`${BASE_URL}/api/v1/events`, { headers })
            check(eventsRes, { "Events loaded after login": r => r.status === 200 })
        }
    } else if (action < 0.9) {
        const eventsRes = http.get(`${BASE_URL}/api/v1/events`)
        check(eventsRes, { "Events loaded": r => r.status === 200 })
    } else {
        const pingRes = http.get(`${BASE_URL}/api/v1/ping`)
        check(pingRes, { "Ping successful": r => r.status === 200 })
    }

    sleep(Math.random() * 2 + 1)
}

export function teardown(data) {
    console.log("Load test completed")
}
