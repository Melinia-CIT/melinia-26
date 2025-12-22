import sql from "../connection";

export async function checkUserExists(email: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 FROM users WHERE id = ${email}
    `;

    return user.length > 0;
}