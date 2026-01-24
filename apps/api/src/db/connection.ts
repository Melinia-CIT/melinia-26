import postgres from "postgres"
import { getEnv } from "../utils/lib"

const sql = postgres({
    host: getEnv("DB_HOST"),
    port: Number(getEnv("DB_PORT")),
    database: getEnv("DB_NAME"),
    username: getEnv("DB_USERNAME"),
    password: getEnv("DB_PASSWORD"),
    max: 50,
    connect_timeout: 5,
    idle_timeout: 30,
    max_lifetime: 300,
    ssl: getEnv("NODE_ENV") === "production" ? undefined : "require"
});

export default sql;
