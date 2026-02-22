import sql from "../connection"
import { Result } from "true-myth"
import { getCollegeLeaderboardSchema, type GetCollegeLeaderboard, type GetLeaderboardError, type InternalError } from "@melinia/shared"

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
): Promise<Result<GetCollegeLeaderboard, GetLeaderboardError>> {
    try {
        const rows = await sql`
            SELECT *
            FROM (
                SELECT
                    c.id AS college_id,
                    c.name AS college_name,
                    COALESCE(SUM(combined.points), 0) AS points,
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
            ORDER BY points DESC
            LIMIT ${limit} OFFSET ${from};
        `

        const collegeLeaderboard = getCollegeLeaderboardSchema.parse(rows);

        return Result.ok(collegeLeaderboard);
    } catch (err) {
        console.error(`Leaderboard DB Error: ${err}`);

        return Result.err({
            code: "internal_error",
            message: "Failed to fetch leaderboard",
        });
    }
}

export async function getLeaderboardCollegesCount(): Promise<Result<number, InternalError>> {
    const [row] = await sql`
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
        ) subquery;
    `

    if (!row) {
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch total colleges on leaderboard"
        })
    }

    const count = parseInt(row.total ?? "0");

    return Result.ok(count);
}
