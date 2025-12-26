import { RedisClient } from "bun"
import { getEnv } from "./lib"
import IORedis from "ioredis";

export const redis = new RedisClient(getEnv("REDIS_URL"), { tls: true });

export const ioredis = new IORedis({
    host: getEnv("REDIS_HOST"),
    port: Number(getEnv("REDIS_PORT")) || 6379,
    password: getEnv("REDIS_PWD"),
    maxRetriesPerRequest: null,
    tls: {}
});
