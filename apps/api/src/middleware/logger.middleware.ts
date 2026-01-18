import { type Context, type Next } from "hono"
import { appendFileSync } from "fs"
import { join } from "path"

type LogLevel = "INFO" | "WARN" | "ERROR"

interface LogData {
    timestamp: string
    requestId: string
    level: LogLevel
    method: string
    path: string
    status?: number
    responseTime?: number
    userAgent?: string
    ip?: string
    error?: string
}

const generateRequestId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const LOG_DIR = process.env.LOG_DIR || "/app/logs"

const structuredLogger = (level: LogLevel, data: LogData): void => {
    const logLine = JSON.stringify(data) + "\n"
    console.log(logLine)

    try {
        appendFileSync(join(LOG_DIR, "app.log"), logLine)
    } catch {}
}

export const requestLogger = async (c: Context, next: Next): Promise<void> => {
    const requestId = c.get("requestId") || generateRequestId()
    c.set("requestId", requestId)

    const startTime = Date.now()
    const method = c.req.method
    const path = c.req.path
    const userAgent = c.req.header("user-agent")
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown"

    try {
        await next()

        const endTime = Date.now()
        const responseTime = endTime - startTime
        const status = c.res.status

        structuredLogger("INFO", {
            timestamp: new Date().toISOString(),
            requestId,
            level: "INFO",
            method,
            path,
            status,
            responseTime,
            userAgent,
            ip,
        })
    } catch (error: any) {
        const endTime = Date.now()
        const responseTime = endTime - startTime

        structuredLogger("ERROR", {
            timestamp: new Date().toISOString(),
            requestId,
            level: "ERROR",
            method,
            path,
            responseTime,
            userAgent,
            ip,
            error: error.message || "Unknown error",
        })

        throw error
    }
}
