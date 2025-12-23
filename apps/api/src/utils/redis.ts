import { RedisClient } from "bun"
import { getEnv } from "./lib"

export const redis = new RedisClient(getEnv("REDIS_URL"));
