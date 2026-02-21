import sql from "../connection"
import { Result } from "true-myth"
import { fetchLeaderBoardSchema, GetLeaderboardError } from "@melinia/shared"

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

export async function getCollegeLeaderboard(
    from: number,
    limit: number
): Promise<
    Result<
        {
            data: Array<{
                college_id: string
                college_name: string
                total_points: number
                rank: number
            }>
            total: number
            from: number
            limit: number
            totalPages: number
        },
        GetLeaderboardError
    >
> {
    try {
        const offset = from

        const [countResult] = await sql`
            SELECT COUNT(*) AS total FROM (
                SELECT c.id
                FROM profile p
                JOIN users u ON u.id = p.user_id
                JOIN colleges c ON c.id = p.college_id
                LEFT JOIN (
                    SELECT user_id, points FROM round_results
                    UNION ALL
                    SELECT user_id, points FROM event_results
                ) combined ON combined.user_id = u.id
                GROUP BY c.id
            ) subquery
        `

        const total = Number(countResult.total)
        const totalPages = Math.ceil(total / limit)

        const rows = await sql`
            SELECT *
            FROM (
                SELECT
                    c.id AS college_id,
                    c.name AS college_name,
                    COALESCE(SUM(combined.points), 0) AS total_points,
                    DENSE_RANK() OVER (
                        ORDER BY COALESCE(SUM(combined.points), 0) DESC
                    ) AS rank
                FROM profile p
                JOIN users u ON u.id = p.user_id
                JOIN colleges c ON c.id = p.college_id
                LEFT JOIN (
                    SELECT user_id, points FROM round_results
                    UNION ALL
                    SELECT user_id, points FROM event_results
                ) combined ON combined.user_id = u.id
                GROUP BY c.id, c.name
            ) leaderboard
            ORDER BY total_points DESC
            LIMIT ${limit} OFFSET ${offset}
        `

        return Result.ok({
            data: rows,
            total,
            from,
            limit,
            totalPages,
        })
    } catch (error) {
        console.error("Leaderboard DB Error:")
        console.dir(error, { depth: null })

        return Result.err({
            code: "internal_error",
            message: "Failed to fetch leaderboard",
        })
    }
}