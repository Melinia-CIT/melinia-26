import sql from "../connection";
import {
    type Event, eventSchema,
    createEventSchema, type CreateEvent,
    getEventDetailsSchema, type GetEventDetailsInput,
    type DeleteEventInput,
    type UpdateEventDetailsInput, updateEventDetailsSchema,
    type EventRegistrationInput,eventRegistrationSchema
} from "@melinia/shared";

const dbRoundToCamel = (r: any) => ({
    roundNo: r.round_no,
    roundDescription: r.round_description,
});

const dbPrizeToCamel = (p: any) => ({
    position: p.position,
    rewardValue: p.reward_value,
});

const dbOrganizerToCamel = (o: any) => ({
    userId: o.user_id,
    assignedBy: o.assigned_by,
});

const dbEventToCamel = (e: any) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    participationType: e.participation_type,
    eventType: e.event_type,
    maxAllowed: e.max_allowed,
    minTeamSize: e.min_team_size,
    maxTeamSize: e.max_team_size,
    venue: e.venue,
    startTime: e.start_time,
    endTime: e.end_time,
    registrationStart: e.registration_start,
    registrationEnd: e.registration_end,
    createdBy: e.created_by,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
});

// 1. Create Event
export async function createEvent(input: CreateEvent) {
    const data = createEventSchema.parse(input);
    const minTeamSize = data.minTeamSize ?? 1;
    const maxTeamSize = data.maxTeamSize ?? null;
    const createdBy = data.createdBy ?? null;

    try {
        const [eventRow] = await sql`
            INSERT INTO events (
                name, description, participation_type, event_type,
                max_allowed, min_team_size, max_team_size, venue,
                start_time, end_time, registration_start, registration_end, created_by
            )
            VALUES (
                ${data.name}, ${data.description}, ${data.participationType}, ${data.eventType},
                ${data.maxAllowed}, ${minTeamSize}, ${maxTeamSize}, ${data.venue},
                ${data.startTime}, ${data.endTime}, ${data.registrationStart}, ${data.registrationEnd}, ${createdBy}
            )
            RETURNING *;
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 500,
                message: "Event creation failed",
                data: {}
            };
        }

        const eventId = eventRow.id as string;

        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`
                    INSERT INTO event_rounds (event_id, round_no, round_description)
                    VALUES (${eventId}, ${r.roundNo}, ${r.roundDescription});
                `;
            }
        }

        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`
                    INSERT INTO event_prizes (event_id, position, reward_value)
                    VALUES (${eventId}, ${p.position}, ${p.rewardValue});
                `;
            }
        }

        if (data.organizers && data.organizers.length > 0) {
            for (const o of data.organizers) {
                await sql`
                    INSERT INTO event_organizers (event_id, user_id, assigned_by)
                    VALUES (${eventId}, ${o.userId}, ${o.assignedBy ?? createdBy});
                `;
            }
        }

        const roundsRows = await sql`SELECT round_no, round_description FROM event_rounds WHERE event_id = ${eventId} ORDER BY round_no;`;
        const prizesRows = await sql`SELECT position, reward_value FROM event_prizes WHERE event_id = ${eventId} ORDER BY position;`;
        const organizersRows = await sql`SELECT user_id, assigned_by FROM event_organizers WHERE event_id = ${eventId};`;

        const fullEvent = {
            ...dbEventToCamel(eventRow),
            rounds: roundsRows.map(dbRoundToCamel),
            prizes: prizesRows.map(dbPrizeToCamel),
            organizers: organizersRows.map(dbOrganizerToCamel),
        };

        return {
            status: true,
            statusCode: 201,
            message: "Event created successfully",
            data: eventSchema.parse(fullEvent)
        };
    } catch (error) {
        throw error;
    }
}

// 2. Get All Events
export async function getEvents() {
    try {
        const events = await sql`
            SELECT id, name, description, participation_type, event_type,
                   max_allowed, min_team_size, max_team_size, venue,
                   start_time, end_time, registration_start, registration_end,
                   created_by, created_at, updated_at
            FROM events ORDER BY created_at DESC;
        `;

        if (events.length === 0) {
            return {
                status: true,
                statusCode: 200,
                message: "No events found",
                data: []
            };
        }

        const eventIds = events.map((e: any) => e.id);
        const rounds = await sql`SELECT event_id, round_no, round_description FROM event_rounds WHERE event_id = ANY(${eventIds});`;
        const prizes = await sql`SELECT event_id, position, reward_value FROM event_prizes WHERE event_id = ANY(${eventIds});`;
        const organizers = await sql`SELECT event_id, user_id, assigned_by FROM event_organizers WHERE event_id = ANY(${eventIds});`;

        const roundsByEvent: Record<string, any[]> = {};
        const prizesByEvent: Record<string, any[]> = {};
        const organizersByEvent: Record<string, any[]> = {};

        for (const r of rounds) (roundsByEvent[r.event_id] ??= []).push(dbRoundToCamel(r));
        for (const p of prizes) (prizesByEvent[p.event_id] ??= []).push(dbPrizeToCamel(p));
        for (const o of organizers) (organizersByEvent[o.event_id] ??= []).push(dbOrganizerToCamel(o));

        const fullEvents = events.map((row: any) => ({
            ...dbEventToCamel(row),
            rounds: roundsByEvent[row.id] ?? [],
            prizes: prizesByEvent[row.id] ?? [],
            organizers: organizersByEvent[row.id] ?? [],
        }));

        return {
            status: true,
            statusCode: 200,
            message: "Events fetched successfully",
            data: fullEvents
        };
    } catch (error) {
        throw error;
    }
}

// 3. Get Event By ID
export async function getEventById(input: GetEventDetailsInput) {
    const { id } = getEventDetailsSchema.parse(input);

    try {
        const [eventRow] = await sql`
            SELECT id, name, description, participation_type, event_type,
                   max_allowed, min_team_size, max_team_size, venue,
                   start_time, end_time, registration_start, registration_end,
                   created_by, created_at, updated_at
            FROM events WHERE id = ${id};
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: "Event not found",
                data: {}
            };
        }

        const roundsRows = await sql`SELECT round_no, round_description FROM event_rounds WHERE event_id = ${id} ORDER BY round_no;`;
        const prizesRows = await sql`SELECT position, reward_value FROM event_prizes WHERE event_id = ${id} ORDER BY position;`;
        const organizersRows = await sql`SELECT user_id, assigned_by FROM event_organizers WHERE event_id = ${id};`;

        const fullEvent = {
            ...dbEventToCamel(eventRow),
            rounds: roundsRows.map(dbRoundToCamel),
            prizes: prizesRows.map(dbPrizeToCamel),
            organizers: organizersRows.map(dbOrganizerToCamel),
        };

        return {
            status: true,
            statusCode: 200,
            message: "Event details retrieved successfully",
            data: eventSchema.parse(fullEvent)
        };
    } catch (error) {
        throw error;
    }
}

// 4. Update Event
export async function updateEvent(input: UpdateEventDetailsInput & { id: string }) {
    const data = updateEventDetailsSchema.parse(input);
    const eventId = input.id;
    const minTeamSize = data.minTeamSize ?? 1;
    const maxTeamSize = data.maxTeamSize ?? null;
    const createdBy = data.createdBy ?? null;

    try {
        const [eventRow] = await sql`
            UPDATE events SET
                name = ${data.name}, description = ${data.description},
                participation_type = ${data.participationType}, event_type = ${data.eventType},
                max_allowed = ${data.maxAllowed}, min_team_size = ${minTeamSize},
                max_team_size = ${maxTeamSize}, venue = ${data.venue},
                start_time = ${data.startTime}, end_time = ${data.endTime},
                registration_start = ${data.registrationStart}, registration_end = ${data.registrationEnd},
                created_by = ${createdBy}, updated_at = NOW()
            WHERE id = ${eventId} RETURNING *;
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: "Event not found",
                data: {}
            };
        }

        await sql`DELETE FROM event_rounds WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_prizes WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_organizers WHERE event_id = ${eventId};`;

        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`
                    INSERT INTO event_rounds (event_id, round_no, round_description)
                    VALUES (${eventId}, ${r.roundNo}, ${r.roundDescription});
                `;
            }
        }

        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`
                    INSERT INTO event_prizes (event_id, position, reward_value)
                    VALUES (${eventId}, ${p.position}, ${p.rewardValue});
                `;
            }
        }

        if (data.organizers && data.organizers.length > 0) {
            for (const o of data.organizers) {
                await sql`
                    INSERT INTO event_organizers (event_id, user_id, assigned_by)
                    VALUES (${eventId}, ${o.userId}, ${o.assignedBy ?? createdBy});
                `;
            }
        }

        const roundsRows = await sql`SELECT round_no, round_description FROM event_rounds WHERE event_id = ${eventId} ORDER BY round_no;`;
        const prizesRows = await sql`SELECT position, reward_value FROM event_prizes WHERE event_id = ${eventId} ORDER BY position;`;
        const organizersRows = await sql`SELECT user_id, assigned_by FROM event_organizers WHERE event_id = ${eventId};`;

        const fullEvent = {
            ...dbEventToCamel(eventRow),
            rounds: roundsRows.map(dbRoundToCamel),
            prizes: prizesRows.map(dbPrizeToCamel),
            organizers: organizersRows.map(dbOrganizerToCamel),
        };

        return {
            status: true,
            statusCode: 200,
            message: "Event updated successfully",
            data: eventSchema.parse(fullEvent)
        };
    } catch (error) {
        throw error;
    }
}

// 5. Delete Event
export async function deleteEvent(input: DeleteEventInput) {
    const { id } = input;

    try {
        await sql`DELETE FROM teams WHERE event_id = ${id};`;
        await sql`DELETE FROM event_rounds WHERE event_id = ${id};`;
        await sql`DELETE FROM event_prizes WHERE event_id = ${id};`;
        await sql`DELETE FROM event_organizers WHERE event_id = ${id};`;

        const result = await sql`DELETE FROM events WHERE id = ${id};`;
        const affected = (result as any).count ?? 0;

        if (affected === 0) {
            return {
                status: false,
                statusCode: 404,
                message: "Event not found",
                data: {}
            };
        }

        return {
            status: true,
            statusCode: 200,
            message: "Event deleted successfully",
            data: {}
        };
    } catch (error) {
        throw error;
    }
}

// 6. Register For Event 
export async function registerForEvent(input: EventRegistrationInput & { userId: string; id: string }) {
    const { id: eventId, teamId, userId } = input;

    try {
        const [eventRow] = await sql`
            SELECT participation_type, min_team_size, max_team_size, registration_start, registration_end
            FROM events WHERE id = ${eventId}
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: "Event not found",
                data: {}
            };
        }

        const now = new Date();

        if (!(now >= new Date(eventRow.registration_start) && now <= new Date(eventRow.registration_end))) {
            return {
                status: false,
                statusCode: 400,
                message: "Registration is not open for this event",
                data: {}
            };
        }

        const isTeamRegistration = eventRow.participation_type === "team";

        if (!isTeamRegistration) {
            if (teamId) {
                return {
                    status: false,
                    statusCode: 400,
                    message: "Team registration not allowed for solo events",
                    data: {}
                };
            }

            const existing = await sql`
                SELECT id FROM event_registrations
                WHERE event_id = ${eventId} AND user_id = ${userId} AND team_id IS NULL
            `;

            if (existing.length > 0) {
                return {
                    status: false,
                    statusCode: 400,
                    message: "User already registered for this event",
                    data: {}
                };
            }
        } else {
            if (!teamId) {
                return {
                    status: false,
                    statusCode: 400,
                    message: "Team ID is required for team events",
                    data: {}
                };
            }

            const [teamLeaderRow] = await sql`
                SELECT leader_id FROM teams 
                WHERE id = ${teamId} AND leader_id = ${userId}
            `;

            if (!teamLeaderRow) {
                return {
                    status: false,
                    statusCode: 403,
                    message: "Only team leader can register for events",
                    data: {}
                };
            }

            const teamMembers = await sql`
                SELECT user_id FROM team_members WHERE team_id = ${teamId}
            `;

            const teamSize = teamMembers.length;

            if (eventRow.min_team_size && teamSize < eventRow.min_team_size) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Team size ${teamSize} is less than minimum required ${eventRow.min_team_size}`,
                    data: {}
                };
            }

            if (eventRow.max_team_size && teamSize > eventRow.max_team_size) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Team size ${teamSize} exceeds maximum allowed ${eventRow.max_team_size}`,
                    data: {}
                };
            }

            const memberIds = teamMembers.map((row: any) => row.user_id);
            if (memberIds.length > 0) {
                const conflicts = await sql`
                    SELECT er.user_id FROM event_registrations er 
                    WHERE er.event_id = ${eventId} AND er.user_id = ANY(${memberIds}::text[])
                `;

                if (conflicts.length > 0) {
                    return {
                        status: false,
                        statusCode: 400,
                        message: "Team cannot register - one or more members already registered for this event",
                        data: {}
                    };
                }
            }
        }

        const [result] = await sql`
            INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
            VALUES (${eventId}, ${teamId || null}, ${userId}, NOW())
            RETURNING *
        `;

        return {
            status: true,
            statusCode: 201,
            message: "Event registration successful",
            data: result
        };
    } catch (error) {
        throw error;
    }
}

// 7. Get User Event Registrations
export async function getUserEventRegistrations(userId: string) {
    try {
        const registrations = await sql`
            SELECT
                er.*, e.name as event_name, e.participation_type
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE er.user_id = ${userId}
            ORDER BY er.registered_at DESC
        `;

        return {
            status: true,
            statusCode: 200,
            message: "User registrations fetched successfully",
            data: registrations
        };
    } catch (error) {
        throw error;
    }
}
