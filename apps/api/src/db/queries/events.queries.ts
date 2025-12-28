import sql from "../connection";
import {
    type Event, eventSchema, 
    createEventSchema, type CreateEvent, 
    getEventDetailsSchema, type GetEventDetailsInput,
    deleteEventSchema, type DeleteEventInput, 
    type UpdateEventDetailsInput, updateEventDetailsSchema,
    eventRegistrationSchema, type EventRegistrationInput 
} from "@melinia/shared/dist";

// 1. Create Event
export async function createEvent(input: CreateEvent) {
    const data = createEventSchema.parse(input);
    const minTeamSize = data.min_team_size ?? 1;
    const maxTeamSize = data.max_team_size ?? null;
    const createdBy = data.created_by ?? null;

    try {
        const [eventRow] = await sql`
            INSERT INTO events (
                name, description, participation_type, event_type,
                max_allowed, min_team_size, max_team_size, venue,
                start_time, end_time, registration_start, registration_end, created_by
            )
            VALUES (
                ${data.name}, ${data.description}, ${data.participation_type}, ${data.event_type},
                ${data.max_allowed}, ${minTeamSize}, ${maxTeamSize}, ${data.venue},
                ${data.start_time}, ${data.end_time}, ${data.registration_start}, ${data.registration_end}, ${createdBy}
            )
            RETURNING *;
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 500,
                message: 'Event creation failed',
                data: {}
            };
        }

        const eventId = eventRow.id as string;

        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`
                    INSERT INTO event_rounds (event_id, round_no, round_description)
                    VALUES (${eventId}, ${r.round_no}, ${r.round_description});
                `;
            }
        }

        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`
                    INSERT INTO event_prizes (event_id, position, reward_value)
                    VALUES (${eventId}, ${p.position}, ${p.reward_value});
                `;
            }
        }

        if (data.organizers && data.organizers.length > 0) {
            for (const o of data.organizers) {
                await sql`
                    INSERT INTO event_organizers (event_id, user_id, assigned_by)
                    VALUES (${eventId}, ${o.user_id}, ${o.assigned_by ?? createdBy});
                `;
            }
        }

        const rounds = await sql`SELECT round_no, round_description FROM event_rounds WHERE event_id = ${eventId} ORDER BY round_no;`;
        const prizes = await sql`SELECT position, reward_value FROM event_prizes WHERE event_id = ${eventId} ORDER BY position;`;
        const organizers = await sql`SELECT user_id, assigned_by FROM event_organizers WHERE event_id = ${eventId};`;

        const fullEvent = { ...eventRow, rounds, prizes, organizers };

        return {
            status: true,
            statusCode: 201,
            message: 'Event created successfully',
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
                message: 'No events found',
                data: []
            };
        }

        const eventIds = events.map((e: any) => e.id);
        const rounds = await sql`SELECT event_id, round_no, round_description FROM event_rounds WHERE event_id = ANY(${eventIds});`;
        const prizes = await sql`SELECT event_id, position, reward_value FROM event_prizes WHERE event_id = ANY(${eventIds});`;
        const organizers = await sql`SELECT event_id, user_id, assigned_by FROM event_organizers WHERE event_id = ANY(${eventIds});`;

        // Group data by event_id
        const roundsByEvent: Record<string, any[]> = {};
        const prizesByEvent: Record<string, any[]> = {};
        const organizersByEvent: Record<string, any[]> = {};

        for (const r of rounds) (roundsByEvent[r.event_id] ??= []).push({ round_no: r.round_no, round_description: r.round_description });
        for (const p of prizes) (prizesByEvent[p.event_id] ??= []).push({ position: p.position, reward_value: p.reward_value });
        for (const o of organizers) (organizersByEvent[o.event_id] ??= []).push({ user_id: o.user_id, assigned_by: o.assigned_by });

        const fullEvents = events.map((row: any) => ({
            ...row,
            rounds: roundsByEvent[row.id] ?? [],
            prizes: prizesByEvent[row.id] ?? [],
            organizers: organizersByEvent[row.id] ?? [],
        }));

        return {
            status: true,
            statusCode: 200,
            message: 'Events fetched successfully',
            data: fullEvents
        };
    } catch (error) {
        throw error;
    }
}

// 3. Get Event By ID
export async function getEventById(input: GetEventDetailsInput) {
    const { event_id } = getEventDetailsSchema.parse(input);

    try {
        const [eventRow] = await sql`
            SELECT id, name, description, participation_type, event_type,
                   max_allowed, min_team_size, max_team_size, venue,
                   start_time, end_time, registration_start, registration_end,
                   created_by, created_at, updated_at
            FROM events WHERE id = ${event_id};
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: 'Event not found',
                data: {}
            };
        }

        const rounds = await sql`SELECT round_no, round_description FROM event_rounds WHERE event_id = ${event_id} ORDER BY round_no;`;
        const prizes = await sql`SELECT position, reward_value FROM event_prizes WHERE event_id = ${event_id} ORDER BY position;`;
        const organizers = await sql`SELECT user_id, assigned_by FROM event_organizers WHERE event_id = ${event_id};`;

        const fullEvent = { ...eventRow, rounds, prizes, organizers };

        return {
            status: true,
            statusCode: 200,
            message: 'Event details retrieved successfully',
            data: eventSchema.parse(fullEvent)
        };
    } catch (error) {
        throw error;
    }
}

// 4. Update Event
export async function updateEvent(input: UpdateEventDetailsInput) {
    const data = updateEventDetailsSchema.parse(input);
    const eventId = data.event_id;
    const minTeamSize = data.min_team_size ?? 1;
    const maxTeamSize = data.max_team_size ?? null;
    const createdBy = data.created_by ?? null;

    try {
        const [eventRow] = await sql`
            UPDATE events SET
                name = ${data.name}, description = ${data.description},
                participation_type = ${data.participation_type}, event_type = ${data.event_type},
                max_allowed = ${data.max_allowed}, min_team_size = ${minTeamSize},
                max_team_size = ${maxTeamSize}, venue = ${data.venue},
                start_time = ${data.start_time}, end_time = ${data.end_time},
                registration_start = ${data.registration_start}, registration_end = ${data.registration_end},
                created_by = ${createdBy}, updated_at = NOW()
            WHERE id = ${eventId} RETURNING *;
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: 'Event not found',
                data: {}
            };
        }

        // Clear existing related data
        await sql`DELETE FROM event_rounds WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_prizes WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_organizers WHERE event_id = ${eventId};`;

        // Insert new data
        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`
                    INSERT INTO event_rounds (event_id, round_no, round_description)
                    VALUES (${eventId}, ${r.round_no}, ${r.round_description});
                `;
            }
        }

        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`
                    INSERT INTO event_prizes (event_id, position, reward_value)
                    VALUES (${eventId}, ${p.position}, ${p.reward_value});
                `;
            }
        }

        if (data.organizers && data.organizers.length > 0) {
            for (const o of data.organizers) {
                await sql`
                    INSERT INTO event_organizers (event_id, user_id, assigned_by)
                    VALUES (${eventId}, ${o.user_id}, ${o.assigned_by ?? createdBy});
                `;
            }
        }

        // Fetch updated data
        const rounds = await sql`SELECT round_no, round_description FROM event_rounds WHERE event_id = ${eventId} ORDER BY round_no;`;
        const prizes = await sql`SELECT position, reward_value FROM event_prizes WHERE event_id = ${eventId} ORDER BY position;`;
        const organizers = await sql`SELECT user_id, assigned_by FROM event_organizers WHERE event_id = ${eventId};`;

        const fullEvent = { ...eventRow, rounds, prizes, organizers };

        return {
            status: true,
            statusCode: 200,
            message: 'Event updated successfully',
            data: eventSchema.parse(fullEvent)
        };
    } catch (error) {
        throw error;
    }
}

// 5. Delete Event
export async function deleteEvent(input: DeleteEventInput) {
    const { event_id } = deleteEventSchema.parse(input);

    try {
        await sql`DELETE FROM teams WHERE event_id = ${event_id};`;
        await sql`DELETE FROM event_rounds WHERE event_id = ${event_id};`;
        await sql`DELETE FROM event_prizes WHERE event_id = ${event_id};`;
        await sql`DELETE FROM event_organizers WHERE event_id = ${event_id};`;

        const result = await sql`DELETE FROM events WHERE id = ${event_id};`;
        const affected = (result as any).count ?? 0;

        if (affected === 0) {
            return {
                status: false,
                statusCode: 404,
                message: 'Event not found',
                data: {}
            };
        }

        return {
            status: true,
            statusCode: 200,
            message: 'Event deleted successfully',
            data: {}
        };
    } catch (error) {
        throw error;
    }
}

// 6. Register For Event 
export async function registerForEvent(input: EventRegistrationInput & { user_id: string }) {
    const { event_id, isTeam, team_id, user_id } = input;

    try {
        const [eventRow] = await sql`
            SELECT participation_type, min_team_size, max_team_size, registration_start, registration_end
            FROM events WHERE id = ${event_id}
        `;

        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: 'Event not found',
                data: {}
            };
        }

        const event = eventRow;
        const now = new Date();

        if (!(now >= new Date(event.registration_start) && now <= new Date(event.registration_end))) {
            return {
                status: false,
                statusCode: 400,
                message: 'Registration is not open for this event',
                data: {}
            };
        }

        if (!isTeam) {
            if (event.participation_type === "team") {
                return {
                    status: false,
                    statusCode: 400,
                    message: 'Solo registration not allowed for team events',
                    data: {}
                };
            }

            const existing = await sql`
                SELECT id FROM event_registrations
                WHERE event_id = ${event_id} AND user_id = ${user_id}
            `;

            if (existing.length > 0) {
                return {
                    status: false,
                    statusCode: 400,
                    message: 'User already registered for this event',
                    data: {}
                };
            }
        } else {
            if (event.participation_type === "solo") {
                return {
                    status: false,
                    statusCode: 400,
                    message: 'Team registration not allowed for solo events',
                    data: {}
                };
            }

            if (!team_id) {
                return {
                    status: false,
                    statusCode: 400,
                    message: 'Team ID is required for team events',
                    data: {}
                };
            }

            const teamMembers = await sql`
                SELECT user_id FROM team_members WHERE team_id = ${team_id}
            `;

            const teamSize = teamMembers.length;

            if (event.min_team_size && teamSize < event.min_team_size) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Team size ${teamSize} is less than minimum required ${event.min_team_size}`,
                    data: {}
                };
            }

            if (event.max_team_size && teamSize > event.max_team_size) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Team size ${teamSize} exceeds maximum allowed ${event.max_team_size}`,
                    data: {}
                };
            }

            const memberIds = teamMembers.map((row: any) => row.user_id);
            if (memberIds.length > 0) {
                const conflicts = await sql`
                    SELECT er.user_id FROM event_registrations er 
                    WHERE er.event_id = ${event_id} AND er.user_id = ANY(${memberIds}::text[])
                `;

                if (conflicts.length > 0) {
                    return {
                        status: false,
                        statusCode: 400,
                        message: 'Team cannot register - one or more members already registered for this event',
                        data: {}
                    };
                }
            }
        }

        const [result] = await sql`
            INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
            VALUES (${event_id}, ${team_id || null}, ${user_id}, NOW())
            RETURNING *
        `;

        return {
            status: true,
            statusCode: 201,
            message: 'Event registration successful',
            data: result
        };
    } catch (error) {
        throw error;
    }
}

// 7. Get User Event Registrations
export async function getUserEventRegistrations(user_id: string) {
    try {
        const registrations = await sql`
            SELECT 
                er.*, e.name as event_name, e.participation_type
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE er.user_id = ${user_id}
            ORDER BY er.registered_at DESC
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'User registrations fetched successfully',
            data: registrations
        };
    } catch (error) {
        throw error;
    }
}
