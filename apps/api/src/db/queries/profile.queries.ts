import sql from "../connection"
import { type Profile, profileSchema } from "@melinia/shared/dist"

export async function getProfile(id: string): Promise<Profile> {
    const user_details = await sql`
        SELECT p.first_name as "firstName",
               p.last_name as "lastName",
               c.name as college,
               CASE 
                   WHEN p.other_degree IS NOT NULL THEN 'other'
                   ELSE d.name
               END as degree,
               p.other_degree as "otherDegree",
               p.year
        FROM profile p
        LEFT JOIN colleges c ON p.college_id = c.id
        LEFT JOIN degrees d ON p.degree_id = d.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE u.id = ${id}
    `
    console.log(user_details)
    return user_details[0] as Profile
}

export async function checkCollegeExists(college_name: string): Promise<boolean> {
    const college = await sql`
        SELECT 1 FROM colleges WHERE name =   ${college_name}
    `

    return college.length != 0
}
export async function checkDegreeExists(degree_name: string): Promise<boolean> {
    const degree = await sql`
        SELECT 1 FROM  degrees WHERE name =   ${degree_name}
    `

    return degree.length != 0
}
export async function createProfile(id: string, profile: Profile) {
    profileSchema.parse(profile)
    const { firstName, lastName, college, degree, year, otherDegree } = profile

    const [result] = await sql`
        WITH inserted AS (
            INSERT INTO profile (
                user_id,
                first_name,
                last_name,
                college_id,
                degree_id,
                other_degree,
                year,
                created_at,
                updated_at
            )
            VALUES (
                ${id},
                ${firstName},
                ${lastName ?? null},
                (SELECT id FROM colleges WHERE name = ${college}),
                (SELECT id FROM degrees WHERE name = ${degree}),
                ${otherDegree ?? null},
                ${year},
                NOW(),
                NOW()
            )
            RETURNING *
        )
        SELECT 
            i.first_name AS "firstName",
            i.last_name AS "lastName",
            c.name AS college,
	    CASE 
                WHEN i.other_degree IS NOT NULL THEN 'other'
                ELSE d.name
            END AS degree,
            i.other_degree AS "otherDegree",
            i.year
        FROM inserted i
        LEFT JOIN colleges c ON i.college_id = c.id
        LEFT JOIN degrees d ON i.degree_id = d.id
    `

    return result
}
export async function updateProfile(id: string, profile: Profile) {
    profileSchema.parse(profile)
    const { firstName, lastName, college, degree, year, otherDegree } = profile
    const [result] = await sql`
        WITH updated AS (
            UPDATE profile
            SET
                first_name = ${firstName},
                last_name = ${lastName ?? null},
                college_id = (SELECT id FROM colleges WHERE name = ${college}),
                degree_id = (SELECT id FROM degrees WHERE name = ${degree}),
                other_degree = ${otherDegree ?? null},
                year = ${year},
                updated_at = NOW()
            WHERE user_id = ${id}
            RETURNING *
        )
        SELECT 
            u.first_name AS "firstName",
            u.last_name AS "lastName",
            c.name AS college,
            CASE 
                WHEN u.other_degree IS NOT NULL THEN 'other'
                ELSE d.name
            END AS degree,
            u.other_degree AS "otherDegree",
            u.year
        FROM updated u
        LEFT JOIN colleges c ON u.college_id = c.id
        LEFT JOIN degrees d ON u.degree_id = d.id
    `
    return result
}

export async function setProfileCompleted(userId: string) {
    const result = await sql`
        UPDATE users
        SET 
            profilecompleted = true,
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
    `

    return result[0]
}
