export function getEnv(env: string): string {
    const value = process.env[env];
    if (!value) {
        throw new Error(`Missing required env variable ${env}`);
    }
    return value;
}

export function generateOTP(): string {
    return Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0');
}
