import { RedisClient } from "bun"
import IORedis from 'ioredis';
import { getEnv } from "./lib"

export const redis = new RedisClient(getEnv("REDIS_URL"));

export const ioredis = new IORedis(getEnv("REDIS_URL"), { maxRetriesPerRequest: null });
