export async function generateOTP(): Promise<string> {
    return Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0');
}