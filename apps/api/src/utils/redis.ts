import IORedis from "ioredis"
import { getEnv } from "./lib"

export const ioredis = new IORedis(getEnv("REDIS_URL"), {
    // Don't retry in the request - handle in application
    maxRetriesPerRequest: null,

    // Retry strategy for initial connection
    retryStrategy: times => {
        const delay = Math.min(times * 50, 1000)
        return delay
    },

    // Connection Pool Settings
    enableReadyCheck: true,
    enableOfflineQueue: true,
    keepAlive: 10000, // 10 seconds

    // Timeouts (make it faster)
    connectTimeout: 5000, // 5 seconds
    lazyConnect: false,

    // DNS Settings
    family: 4,
})

// Monitor Redis status every 30 seconds
setInterval(() => {
    console.log("Redis Status:", {
        status: ioredis.status,
        ready: ioredis.status === "ready",
    })
}, 30 * 1000)

// Error handling
ioredis.on("error", error => {
    console.error("Redis Error:", error.message)
})

ioredis.on("connect", () => {
    console.log("Redis Connected")
})

ioredis.on("close", () => {
    console.log("Redis Disconnected")
})
