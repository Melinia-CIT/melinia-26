import sql from "../connection"
import { baseUserSchema, userSchema, profileSchema, type User, type BaseUser, type UserError, type Profile, type UserWithProfile } from "@melinia/shared"
import { Result } from "true-myth"

// User
export async function checkUserExists(email: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 FROM users WHERE email = ${email}
    `

    return user.length > 0
}

export async function getUserByMail(email: string): Promise<BaseUser | null> {
    const [user] = await sql`
        SELECT * FROM users WHERE email = ${email}
    `

    if (!user) {
        return null
    }

    return baseUserSchema.parse(user)
}

export async function getUserById(id: string): Promise<User | null> {
    const [user] = await sql`
        SELECT * FROM users WHERE id = ${id};
    `

    return !user ? null : userSchema.parse(user)
}

export async function getUser(id: string): Promise<Result<UserWithProfile, UserError>> {
    try {
        const [user] = await sql`
            SELECT * FROM users WHERE id = ${id};
        `;

        if (!user) {
            return Result.err({
                code: "user_not_found",
                message: "User not found"
            })
        }

        if (!user.profile_completed) {
            return Result.err({
                code: "profile_not_complete",
                message: "User profile is not completed"
            });
        }

        const [profile] = await sql`
            SELECT p.first_name,
                p.last_name,
                c.name as college,
                d.name as degree,
                p.year,
                p.created_at,
                p.updated_at
            FROM profile p
            LEFT JOIN colleges c ON p.college_id = c.id
            LEFT JOIN degrees d ON p.degree_id = d.id
            INNER JOIN users u ON p.user_id = u.id
            WHERE u.id = ${id};
        `

        if (!profile) {
            return Result.err({
                code: "profile_not_found",
                message: "Profile not found"
            });
        }

        return Result.ok({
            ...userSchema.parse(user),
            profile: profileSchema.parse(profile)
        });
    } catch (err) {
        console.error(err);
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch user"
        });
    }
}

export async function insertUser(
    email: string,
    passwdHash: string,
    validCoupon: boolean
): Promise<User> {
    const [row] = validCoupon
        ? await sql`
            INSERT INTO users (email, passwd_hash, payment_status)
            VALUES (${email}, ${passwdHash}, 'EXEMPTED')
            RETURNING *;
        `
        : await sql`
            INSERT INTO users (email, passwd_hash)
            VALUES (${email}, ${passwdHash})
            RETURNING *;
        `

    return userSchema.parse(row)
}

export async function updatePasswd(email: string, newPasswdHash: string): Promise<boolean> {
    const rows = await sql`
        UPDATE users
        SET passwd_hash = ${newPasswdHash}
        WHERE email = ${email}
        RETURNING id;
    `

    return rows.length > 0
}

export async function updateUserPaymentStatus(
    userId: string,
    paymentStatus: "PAID" | "UNPAID" | "EXEMPTED"
): Promise<boolean> {
    const rows = await sql`
        UPDATE users
        SET payment_status = ${paymentStatus}
        WHERE id = ${userId}
        RETURNING id;
    `

    return rows.length > 0
}

// Profile
export async function checkProfileExists(id: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 from users where id = ${id} and profile_completed = true
    `
    return user.length > 0
}

export async function isUserSuspended(id: string): Promise<boolean> {
    const user = await sql`
        SELECT 1 from users where id = ${id} and status = 'SUSPENDED'; 
    `
    return user.length > 0
}
