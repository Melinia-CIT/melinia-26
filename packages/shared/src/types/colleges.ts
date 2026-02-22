import z from "zod";


export const getCollegeLeaderboardSchema = z
    .array(z.object({
        college_id: z.number(),
        college_name: z.string(),
        total_points: z.coerce.number(),
        participant_count: z.coerce.number(),
        avg_points_per_user: z.coerce.number(),
        rank: z.coerce.number()
    }))


export type GetCollegeLeaderboard = z.infer<typeof getCollegeLeaderboardSchema>;
