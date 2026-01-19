import sql from "../connection"

export async function getColleges(limit = 20) {
    return sql`
        SELECT id, name
        FROM colleges
        WHERE is_default = TRUE
        ORDER BY name ASC
        LIMIT ${limit};
    `
}

export async function searchColleges(searchTerm: string, limit = 20) {
    return sql`
        SELECT id, name
        FROM colleges
        WHERE is_default = TRUE
        ORDER BY SIMILARITY(name, ${searchTerm}) DESC 
        LIMIT ${limit};
    `
}

export async function getDegrees(limit = 10) {
    return sql`
        SELECT id, name
        FROM degrees
        WHERE is_default = TRUE
        ORDER BY name ASC
        LIMIT ${limit};
    `
}

export async function searchDegrees(searchTerm: string, limit = 20) {
    return sql`
        SELECT id, name
        FROM degrees
        WHERE is_default = TRUE
        ORDER BY SIMILARITY(name, ${searchTerm}) DESC 
        LIMIT ${limit};
    `
}
