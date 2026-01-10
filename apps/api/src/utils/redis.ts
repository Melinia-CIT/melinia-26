import IORedis from 'ioredis';
import { getEnv } from "./lib"

export const ioredis = new IORedis(getEnv("REDIS_URL"), { maxRetriesPerRequest: null });
