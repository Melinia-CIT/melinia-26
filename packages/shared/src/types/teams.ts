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

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  leader_id: z.string(),
  event_id:z.string(),
  member_emails: z.array(z.string())
});

export const deleteTeamSchema = z.object({
  team_id: z.string().min(1, "Invalid Team"),
  requester_id: z.string().min(1, "Invalid User")
});

export type Team = z.infer<typeof teamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type DeleteTeamRequest = z.infer<typeof deleteTeamSchema>;