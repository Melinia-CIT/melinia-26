import sql from "../connection";
import { type Team, teamSchema, createTeamSchema, type CreateTeam } from "@melinia/shared/dist/types";

export async function createTeam(input: CreateTeam) {
    const data = createTeamSchema.parse(input);

    const result = await sql`
        INSERT INTO teams (name, leader_id, event_id)
        VALUES (${data.name}, ${data.leader_id}, ${data.event_id})
        RETURNING id;
    `;

    // Cast through unknown first
    const [row] = result as unknown as { id: number }[];
    if (!row) throw new Error('Insert failed');

    const team_id = row.id;

    await sql`
        INSERT INTO team_members (team_id, user_id)
        VALUES (${team_id}, ${data.leader_id});
    `;

    return {
        status: true,
        statusCode: 201,
        message: 'Team created successfully',
        data: { team_id }
    };
} 


export async function getAllTeamsForUser(userId: string) {
    try {

        const rows = await sql`
          SELECT
              t.id,
              t.name          AS team_name,
              t.event_id,
              e.name          AS event_name
          FROM team_members  AS tm
          JOIN teams         AS t  ON t.id  = tm.team_id
          JOIN events        AS e  ON e.id  = t.event_id
          WHERE tm.user_id = ${userId}
          ORDER BY t.created_at;
        `;

        return { status: true, statusCode: 200, message: 'List of all teams for this user', data: rows };
    } catch (error) {
        throw error;
    }
}