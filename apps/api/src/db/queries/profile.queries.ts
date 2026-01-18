import sql from "../connection"
import { type Profile, type CreateProfile, profileSchema } from "@melinia/shared"

interface IdResult {
    id: number;
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
        LIMIT 1;
    `;

    if (!result[0]) {
        throw new Error(`Failed to resolve ID for ${degreeName}`);
    }

    return result[0].id;
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
        LIMIT 1;
    `;

    if (!result[0]) {
        throw new Error(`Failed to resolve ID for ${collegeName}`);
    }

    return result[0].id;
}

export async function checkPhoneNumberExists(phone_number: string): Promise<boolean> {
    const number = await sql`SELECT 1 FROM  users WHERE ph_no = ${phone_number};`

    return number.length > 0;
}

export async function getProfileById(id: string): Promise<Profile | null> {
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
    `;

    return profile ? profileSchema.parse(profile) : null;
}


export async function createProfile(userId: string, profileData: CreateProfile): Promise<Profile> {
    const {
        first_name,
        last_name,
        college,
        degree,
        year,
        ph_no
    } = profileData;

    const collegeId = await resolveCollegeId(college);
    const degreeId = await resolveDegreeId(degree, collegeId);

    const [profile] = await sql`
            WITH p AS (
            INSERT INTO profile (
                user_id,
                first_name,
                last_name,
                college_id,
                degree_id,
                year
            )
            VALUES (
                ${userId},
                ${first_name},
                ${last_name ?? null},
                ${collegeId},
                ${degreeId},
                ${year}
            )
            RETURNING *
        )
        SELECT 
            p.*, 
            c.name as college, 
            d.name as degree
        FROM p
        JOIN colleges c ON p.college_id = c.id
        JOIN degrees d ON p.degree_id = d.id;
    `;

    await sql`
        UPDATE users
        SET ph_no = ${ph_no}
        WHERE id = ${userId};
	`;

    return profileSchema.parse(profile);
}

// TODO: This methods upserts, need refinement in the return.
export async function updateProfile(userId: string, profileData: CreateProfile): Promise<Profile> {
    const {
        first_name,
        last_name,
        college,
        degree,
        year,
        ph_no
    } = profileData;

    const collegeId = await resolveCollegeId(college);
    const degreeId = await resolveDegreeId(degree, collegeId);

    await sql`
        UPDATE users
        SET ph_no = ${ph_no}
        WHERE id = ${userId};
	`;

    const [profile] = await sql`
        WITH upsert AS (
            INSERT INTO profile (
                user_id,
                first_name,
                last_name,
                college_id,
                degree_id,
                year
            )
            VALUES (
                ${userId},
                ${first_name},
                ${last_name ?? null},
                ${collegeId},
                ${degreeId},
                ${year}
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                college_id = EXCLUDED.college_id,
                degree_id = EXCLUDED.degree_id,
                year = EXCLUDED.year,
                updated_at = NOW()
            RETURNING *
        )
        SELECT 
            upsert.*, 
            c.name as college, 
            d.name as degree
        FROM upsert
        JOIN colleges c ON upsert.college_id = c.id
        JOIN degrees d ON upsert.degree_id = d.id;
    `;

    return profileSchema.parse(profile);
}

export async function setProfileCompleted(userId: string) {
    const [result] = await sql`
        UPDATE users
        SET profile_completed = true
        WHERE id = ${userId}
        RETURNING *;
    `;

    return result;
}
