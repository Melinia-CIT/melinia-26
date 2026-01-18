import IORedis from "ioredis"
import { getEnv } from "./lib"

export const ioredis = new IORedis(
    `redis://:${getEnv("REDIS_PASSWORD")}@${getEnv("REDIS_HOST")}:${getEnv("REDIS_PORT")}`,
    {
        maxRetriesPerRequest: null,

        retryStrategy: times => {
            const delay = Math.min(times * 50, 1000)
            return delay
        },

        enableReadyCheck: true,
        enableOfflineQueue: true,
        keepAlive: 10000,
        connectTimeout: 5000,
        lazyConnect: false,
        family: 4,
        tls: getEnv("NODE_ENV") !== "production" ? { rejectUnauthorized: true } : undefined,
    }
)

ioredis.on("error", error => {
    console.error("Redis Error:", error.message)
})

ioredis.on("connect", () => {
    console.log("Redis Connected")
})

ioredis.on("close", () => {
    console.log("Redis Disconnected")
})
