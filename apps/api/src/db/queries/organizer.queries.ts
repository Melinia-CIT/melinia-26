import sql from "../connection"
import { 
    userSchema, 
    profileSchema, 
    type User, 
    type Profile, 
    type CreateProfile 
} from "@melinia/shared"

interface IdResult {
    id: number;
}

async function resolveCollegeId(collegeName: string): Promise<number> {
    const result = await sql<IdResult[]>`
        WITH ins AS (
            INSERT INTO colleges (name) 
            VALUES (${collegeName}) 
            ON CONFLICT (name) DO NOTHING 
            RETURNING id
        )
        SELECT id FROM ins
        UNION ALL
        SELECT id FROM colleges WHERE name = ${collegeName}
        LIMIT 1
    `;

    if (!result[0]) throw new Error(`College resolution failed for: ${collegeName}`);
    return result[0].id;
}

async function resolveDegreeId(degreeName: string, collegeId: number): Promise<number> {
    const result = await sql<IdResult[]>`
        WITH ins AS (
            INSERT INTO degrees (name, college_id) 
            VALUES (${degreeName}, ${collegeId}) 
            ON CONFLICT (name, college_id) DO NOTHING 
            RETURNING id
        )
        SELECT id FROM ins
        UNION ALL
        SELECT id FROM degrees WHERE name = ${degreeName} and college_id = ${collegeId}
        LIMIT 1
    `;

    if (!result[0]) throw new Error(`Degree resolution failed for: ${degreeName}`);
    return result[0].id;
}

export async function insertOrganizer(
    email: string,
    ph_no: string,
    passwdHash: string
): Promise<User> {
    const [row] = await sql`
        INSERT INTO users (email, ph_no, passwd_hash, role, payment_status)
        VALUES (${email}, ${ph_no}, ${passwdHash}, 'ORGANIZER', 'EXEMPTED')
        RETURNING *;
    `
    return userSchema.parse(row)
}

export async function createOrganizerProfile(
    userId: string, 
    profileData: CreateProfile
): Promise<Profile> {
    const { first_name, last_name, college, degree, year, ph_no } = profileData;

    const collegeId = await resolveCollegeId(college);
    const degreeId = await resolveDegreeId(degree, collegeId);

    const [profile] = await sql`
        WITH p AS (
            INSERT INTO profile (user_id, first_name, last_name, college_id, degree_id, year)
            VALUES (${userId}, ${first_name}, ${last_name ?? null}, ${collegeId}, ${degreeId}, ${year})
            RETURNING *
        )
        SELECT p.*, c.name as college, d.name as degree
        FROM p
        JOIN colleges c ON p.college_id = c.id
        JOIN degrees d ON p.degree_id = d.id;
    `;

    await sql`UPDATE users SET ph_no = ${ph_no} WHERE id = ${userId}`;
    return profileSchema.parse(profile);
}