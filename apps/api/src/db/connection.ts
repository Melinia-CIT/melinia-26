import postgres from "postgres";

function getEnv(env: string): string {
    const value = process.env[env];
    if (!value) {
        throw new Error(`Missing required env variable ${env}`);
    }
    return value;
}

const sql = postgres({
    host: getEnv('DB_HOST'),
    port: Number(getEnv('DB_PORT')),
    database: getEnv('DB_NAME'),
    username: getEnv('DB_USERNAME'),
    password: getEnv('DB_PASSWORD'),
    max: 50,
    ssl: "require"
});

export default sql;
