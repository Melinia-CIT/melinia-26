import sql from "../connection";
import { baseUserSchema, userSchema, type User, type BaseUser } from "@packages/shared/dist";

// User
export async function checkUserExists(email: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 FROM users WHERE email = ${email}
    `;

    return user.length > 0;
}

export async function getUserByMail(email: string): Promise<BaseUser | null> {
    const [user] = await sql`
        SELECT * FROM users WHERE email = ${email}
    `;

    if (!user) {
        return null
    }

    return baseUserSchema.parse(user);
}

export async function getUserById(id: string): Promise<User | null> {
    const [user] = await sql`
        SELECT * FROM users WHERE id = ${id};
    `;

    return !user ? null : userSchema.parse(user);
}

export async function insertUser(email: string, passwdHash: string): Promise<User> {
    const [row] = await sql`
        INSERT INTO users(email, passwd_hash)
        VALUES (${email}, ${passwdHash})
        RETURNING  *;
    `;

    return userSchema.parse(row);
}

export async function updatePasswd(email: string, newPasswdHash: string): Promise<boolean> {
    const rows = await sql`
        UPDATE users
        SET passwd_hash = ${newPasswdHash}
        WHERE email = ${email}
        RETURNING id;
    `

    return rows.length > 0;
}


// Profile
export async function checkProfileExists(id: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 from users where id = ${id} and profile_completed = true
    `
    return user.length > 0;
}