import sql from "../connection";

export async function getColleges() {
    const data = await sql`
        SELECT
            c.id,
            c.name,
            COALESCE(
                json_agg(d.name) FILTER (WHERE d.id IS NOT NULL),
                '[]'
            ) AS degrees
        FROM colleges c
        LEFT JOIN degrees d
            ON d.college_id = c.id
        AND d.is_default = true
        WHERE c.is_default = true
        GROUP BY c.id, c.name;
    `;

    return data;
}
