import sql from "../connection"

export async function getColleges() {
    const data = await sql`
        SELECT DISTINCT ON (c.id, c.name)
            c.id,
            c.name,
            COALESCE(
                json_agg(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL),
                '[]'
            ) AS degrees
        FROM colleges c
        LEFT JOIN degrees d ON true
        WHERE c.is_default = true
        AND (d.college_id = c.id OR (d.college_id IS NULL AND d.is_default = true))
        GROUP BY c.id, c.name
        ORDER BY c.id, c.name;
    `

    return data
}

export async function searchColleges(searchTerm: string, limit = 20) {
    return sql`
        SELECT DISTINCT ON (c.id, c.name)
            c.id,
            c.name,
            COALESCE(
                json_agg(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL),
                '[]'
            ) AS degrees
        FROM colleges c
        LEFT JOIN degrees d ON true
        WHERE c.is_default = true
        AND (d.college_id = c.id OR (d.college_id IS NULL AND d.is_default = true))
        AND c.name ILIKE ${searchTerm + "%"}
        GROUP BY c.id, c.name
        ORDER BY c.id, c.name ASC
        LIMIT ${limit};
    `
}
