import sql from "../connection";
import { type Event, eventSchema, createEventSchema, type CreateEvent } from "@melinia/shared/dist";
import {type Team, teamSchema, createTeamSchema, type CreateTeam} from "@melinia/shared/dist/types";

export async function createTeam(input: CreateTeam){
    try {
        const data = createTeamSchema.parse(input);

        const rows = await sql`
            INSERT INTO teams(name, leader_id, event_id)
            VALUES(
                ${data.name},
                ${data.event_id},
                ${data.leader_id}
            );
        `;
        return {status:true, statusCode:201, message:"Team Created Successfully!", data:{}};
    } catch (error) {
        throw error;
    }
}
