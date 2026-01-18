import http from "k6/http"
import { check, sleep } from "k6"

const BASE_URL = "https://app.melinia.in"

export const options = {
    scenarios: {
        browse_heavy: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "2m", target: 300 },
                { duration: "5m", target: 600 },
                { duration: "8m", target: 800 },
                { duration: "12m", target: 800 },
                { duration: "3m", target: 0 },
            ],
        },
    },
}

export default function () {
    const action = Math.random()

    if (action < 0.6) {
        const res = http.get(`${BASE_URL}/api/v1/events`)
        check(res, { "Events loaded": r => r.status === 200 })
    } else if (action < 0.9) {
        const randomId = Math.floor(Math.random() * 100) + 1
        const res = http.get(`${BASE_URL}/api/v1/events/${randomId}`)
        check(res, { "Event details loaded": r => r.status === 200 || r.status === 404 })
    } else {
        const res = http.get(`${BASE_URL}/api/v1/ping`)
        check(res, { "Ping successful": r => r.status === 200 })
    }

    sleep(Math.random() * 3 + 1)
}
