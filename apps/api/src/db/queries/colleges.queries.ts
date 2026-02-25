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
                WITH college_stats AS (
                    SELECT
                        c.id AS college_id,
                        c.name AS college_name,
                        COALESCE(SUM(user_points.total_points), 0) AS total_points,
                        COUNT(user_points.user_id) AS participant_count,
                        COALESCE(AVG(user_points.total_points), 0) AS raw_avg
                    FROM profile p
                    JOIN users u ON u.id = p.user_id
                    JOIN colleges c ON c.id = p.college_id
                    LEFT JOIN (
                        SELECT
                            combined.user_id,
                            SUM(combined.points) AS total_points
                        FROM (
                            SELECT user_id, points FROM round_results
                            UNION ALL
                            SELECT user_id, points FROM event_results
                        ) combined
                        GROUP BY combined.user_id
                        HAVING SUM(combined.points) > 0
                    ) user_points ON user_points.user_id = u.id
                    GROUP BY c.id, c.name
                ),

                global_avg AS (
                    SELECT COALESCE(AVG(raw_avg), 0) AS C
                    FROM college_stats
                )

                SELECT
                    cs.college_id,
                    cs.college_name,
                    cs.total_points,
                    cs.participant_count,

                    ROUND(
                        (
                            (cs.participant_count::numeric / (cs.participant_count + 5)) * cs.raw_avg
                            +
                            (5.0 / (cs.participant_count + 5)) * g.C
                        ),
                        2
                    ) AS avg_points_per_user,

                    DENSE_RANK() OVER (
                        ORDER BY
                        (
                            (cs.participant_count::numeric / (cs.participant_count + 5)) * cs.raw_avg
                            +
                            (5.0 / (cs.participant_count + 5)) * g.C
                        ) DESC
                    ) AS rank

                FROM college_stats cs
                CROSS JOIN global_avg g
            ) leaderboard
            ORDER BY avg_points_per_user DESC
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
