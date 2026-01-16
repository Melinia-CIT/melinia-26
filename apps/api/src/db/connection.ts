import postgres from "postgres"
import { getEnv } from "../utils/lib"

// With 4 API instances and 22 total DB connections:
// Each instance gets 5 connections (4 × 5 = 20 total)
// Leave 2 connections for maintenance/backups
const sql = postgres({
    host: getEnv("DB_HOST"),
    port: Number(getEnv("DB_PORT")),
    database: getEnv("DB_NAME"),
    username: getEnv("DB_USERNAME"),
    password: getEnv("DB_PASSWORD"),

    // Pool Configuration (CRITICAL CHANGE)
    max: 5, // Reduced from 400 to 5 per instance

    // Connection Timeout (make it faster)
    connect_timeout: 5, // 5 seconds
    idle_timeout: 10, // Release idle connections quickly
    max_lifetime: 1800, // Recycle every 30 minutes

    // SSL
    ssl: "require",
})

export default sql
