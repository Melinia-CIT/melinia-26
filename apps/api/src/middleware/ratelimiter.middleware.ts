import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { ioredis } from "../utils/redis";

interface Limits {
    ipLimit?: number;
    emailLimit?: number;
    windowSeconds?: number;
    cooldownSeconds?: number;
}

export const createRateLimiter = ({
    prefix,
    limits = {}
}: {
    prefix: string,
    limits?: Limits
}) => {
    const {
        ipLimit = 10,
        emailLimit = 3,
        windowSeconds = 900,
        cooldownSeconds = 60
    } = limits;

    return createMiddleware(async (c, next) => {
        const { email } = await c.req.json();

        if (!email) {
            throw new HTTPException(400, { message: "Email is required" });
        }

        const getIp = () => {
            return c.req.header("CF-Connecting-IP") ||
                c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
                c.req.header("X-Real-IP") ||
                "127.0.0.1";
        };

        const ip = getIp();

        const ipRateKey = `rl:${prefix}:ip:${ip}`;

        const ipCount = await ioredis.incr(ipRateKey);
        if (ipCount === 1) {
            await ioredis.expire(ipRateKey, windowSeconds);
        }

        if (ipCount > ipLimit) {
            throw new HTTPException(429, {
                message: "Too many requests from your network. Please wait a while.",
            });
        }

        const cooldownKey = `rl:${prefix}:cooldown:${email}`;

        const isOnCooldown = await ioredis.get(cooldownKey);
        if (isOnCooldown) {
            throw new HTTPException(429, {
                message: "Please wait a moment before requesting again.",
            });
        }

        const emailRateKey = `rl:${prefix}:email:${email}`;

        const emailCount = await ioredis.incr(emailRateKey);
        if (emailCount === 1) {
            await ioredis.expire(emailRateKey, windowSeconds);
        }

        if (emailCount > emailLimit) {
            throw new HTTPException(429, {
                message: "Maximum attempts exceeded.",
            });
        }

        await ioredis.set(cooldownKey, "1", "EX", cooldownSeconds);

        await next();
    });
};
