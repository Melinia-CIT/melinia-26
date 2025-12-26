import sql from "../connection";
import { type createUser, createUserSchema, userSchema, type User } from "@packages/shared/dist";

export async function checkUserExists(email: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 FROM users WHERE email = ${email}
    `;

    return user.length > 0;
}

export async function checkProfileCompleted(id:string) : Promise<boolean> {
    const userWithProfile = await sql`
        SELECT 1 from users where id = ${id} and profile_completed = true
    `
    return userWithProfile.length > 0;

}

export async function getUser(email: string): Promise<User | null> {
    const [user] = await sql`
        SELECT * FROM users WHERE email = ${email}
    `;

    if (!user) {
        return null
    }

    return userSchema.parse(user);
}

export async function insertUser(email: string, passwdHash: string): Promise<createUser> {
    const [row] = await sql`
        INSERT INTO users(email, passwd_hash)
        VALUES (${email}, ${passwdHash})
        RETURNING  *;
    `;

    return createUserSchema.parse(row);
}
