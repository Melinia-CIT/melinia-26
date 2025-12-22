import {z} from 'zod';
// CREATE TABLE IF NOT EXISTS teams (
//     id TEXT PRIMARY KEY DEFAULT gen_id('T'),
//     name TEXT NOT NULL,
//     leader_id TEXT NOT NULL REFERENCES users(id),
//     event_id TEXT REFERENCES events(id)

export const teamSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Team name is required"),
  leader_id: z.string(),
  event_id:z.string()
});

export const createTeamSchema = teamSchema.omit({
    id: true
}
);

export type Team = z.infer<typeof teamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;