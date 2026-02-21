import z from "zod";


export const getCollegeLeaderboardSchema = z
    .array(z.object({
        college_id: z.number(),
        college_name: z.string(),
        points: z.coerce.number(),
        rank: z.coerce.number()
    }))


export type GetCollegeLeaderboard = z.infer<typeof getCollegeLeaderboardSchema>;
