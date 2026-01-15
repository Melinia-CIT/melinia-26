import sql from "../connection";
import {
    type Event, eventSchema,
    createEventSchema, type CreateEvent,
    getEventDetailsSchema, type GetEventDetailsInput,
    type DeleteEventInput,
    type UpdateEventDetailsInput, updateEventDetailsSchema,
    type EventRegistrationInput, eventRegistrationSchema
} from "@melinia/shared";

const dbRoundToCamel = (r: any) => ({
    roundNo: r.round_no,
    roundDescription: r.round_description,
    roundName: r.round_name
});

const dbPrizeToCamel = (p: any) => ({
    position: p.position,
    rewardValue: p.reward_value,
});

const dbOrganizerToCamel = (o: any) => ({
    userId: o.user_id,
    assignedBy: o.assigned_by,
    firstName: o.first_name,
    lastName: o.last_name,
    phoneNo: o.ph_no
});

const dbRuleToCamel = (rule: any) => ({
    id: rule.id,
    eventId: rule.event_id,
    roundNo: rule.round_no,
    ruleNumber: rule.rule_number,
    ruleDescription: rule.rule_description,
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
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
    const validation = createEventSchema.safeParse(input);
    
    if (!validation.success) {
        return {
            status: false,
            statusCode: 400,
            message: validation.error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join(", "),
            data: {}
        };
    }    
    
    const data = createEventSchema.parse(input);
    const minTeamSize = data.minTeamSize ?? 1;
    const maxTeamSize = data.maxTeamSize ?? null;
    const createdBy = data.createdBy ?? null;

    try {
        if (data.organizers && data.organizers.length > 0) {
            const orgIds = data.organizers.map(o => o.userId);
            const validOrganizers = await sql`
                SELECT id FROM users 
                WHERE id = ANY(${orgIds}::text[]) 
                AND (participant_type = 'ORGANIZER' OR participant_type = 'ADMIN')
            `;
            if (validOrganizers.length !== orgIds.length) {
                const validIds = validOrganizers.map(vo => vo.id);
                const invalidIds = orgIds.filter(id => !validIds.includes(id));

                return {
                    status: false,
                    statusCode: 400,
                    message: `Invalid organizers: [${invalidIds.join(", ")}]. Users must exist and have ORGANIZER or ADMIN permissions.`,
                    data: { invalidIds }
                };
            }
        }

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
            RETURNING id, name, description, participation_type, event_type, max_allowed, min_team_size, max_team_size, venue, start_time, end_time, registration_start, registration_end, created_by, created_at, updated_at;
        `;

        if (!eventRow) {
            return { status: false, statusCode: 500, message: "Event creation failed", data: {} };
        }

        const eventId = eventRow.id as string;

        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`INSERT INTO event_rounds (event_id, round_no, round_name, round_description) VALUES (${eventId}, ${r.roundNo}, ${r.roundName ?? null}, ${r.roundDescription ?? null});`;
            }
        }

        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`INSERT INTO event_prizes (event_id, position, reward_value) VALUES (${eventId}, ${p.position}, ${p.rewardValue});`;
            }
        }

        if (data.organizers && data.organizers.length > 0) {
            for (const o of data.organizers) {
                await sql`INSERT INTO event_organizers (event_id, user_id, assigned_by) VALUES (${eventId}, ${o.userId}, ${o.assignedBy ?? createdBy});`;
            }
        }

        if (data.rules && data.rules.length > 0) {
            for (const rule of data.rules) {
                await sql`INSERT INTO event_rules (event_id, round_no, rule_number, rule_description) VALUES (${eventId}, ${rule.roundNo ?? null}, ${rule.ruleNumber}, ${rule.ruleDescription ?? null});`;
            }
        }

        return await getEventById({ id: eventId });
    } catch (error) {
        throw error;
    }
}

// 2. Get All Events
export async function getEvents() {
    try {
        const events = await sql`
            SELECT id, name, description, participation_type, event_type, max_allowed, min_team_size, max_team_size, venue, start_time, end_time, registration_start, registration_end, created_by, created_at, updated_at 
            FROM events 
            ORDER BY created_at DESC;
        `;

        if (!events || events.length === 0) {
            return { status: true, statusCode: 200, message: "No events found", data: [] };
        }

        const eventIds = events.map((e) => e.id as string);
        
        const [rounds, prizes, rules, organizers] = await Promise.all([
            sql`SELECT event_id, round_no, round_name, round_description FROM event_rounds WHERE event_id = ANY(${eventIds}::text[]);`,
            sql`SELECT event_id, position, reward_value FROM event_prizes WHERE event_id = ANY(${eventIds}::text[]);`,
            sql`SELECT id, event_id, round_no, rule_number, rule_description, created_at, updated_at FROM event_rules WHERE event_id = ANY(${eventIds}::text[]);`,
            sql`SELECT eo.event_id, eo.user_id, eo.assigned_by, p.first_name, p.last_name, u.ph_no 
                FROM event_organizers eo
                JOIN profile p ON eo.user_id = p.user_id
                JOIN users u ON eo.user_id = u.id
                WHERE eo.event_id = ANY(${eventIds}::text[]);`
        ]);

        const roundsByEvent: Record<string, any[]> = {};
        const prizesByEvent: Record<string, any[]> = {};
        const organizersByEvent: Record<string, any[]> = {};
        const rulesByEvent: Record<string, any[]> = {};

        for (const r of rounds) (roundsByEvent[r.event_id] ??= []).push(dbRoundToCamel(r));
        for (const p of prizes) (prizesByEvent[p.event_id] ??= []).push(dbPrizeToCamel(p));
        for (const o of organizers) (organizersByEvent[o.event_id] ??= []).push(dbOrganizerToCamel(o));
        for (const rule of rules) (rulesByEvent[rule.event_id] ??= []).push(dbRuleToCamel(rule));

        const fullEvents = events.map((row) => {
            const id = row.id as string;
            const eventObj = {
                ...dbEventToCamel(row),
                rounds: roundsByEvent[id] ?? [],
                prizes: prizesByEvent[id] ?? [],
                organizers: organizersByEvent[id] ?? [],
                rules: rulesByEvent[id] ?? [],
            };
            // Use safeParse to avoid crashing the whole list if one event is "dirty"
            const parsed = eventSchema.safeParse(eventObj);
            return parsed.success ? parsed.data : eventObj; 
        });

        return { status: true, statusCode: 200, message: "Events fetched successfully", data: fullEvents };
    } catch (error: any) {
        return { 
            status: false, 
            statusCode: 500, 
            message: error.message || "Internal server error while fetching events", 
            data: [] 
        };
    }
}

// 3. Get Event By ID
export async function getEventById(input: GetEventDetailsInput) {
    const validation = getEventDetailsSchema.safeParse(input);
    if (!validation.success) {
        return {
            status: false,
            statusCode: 400,
            message: validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(", "),
            data: {}
        };
    }

    const { id } = validation.data;

    try {
        const events = await sql`
            SELECT id, name, description, participation_type, event_type, max_allowed, min_team_size, max_team_size, venue, start_time, end_time, registration_start, registration_end, created_by, created_at, updated_at 
            FROM events 
            WHERE id = ${id};
        `;

        if (!events || events.length === 0) {
            return { status: false, statusCode: 404, message: "Event not found", data: {} };
        }

        const eventRow = events[0];
        if(!eventRow){
            throw new Error("Event not found");
        }
        const eventId = eventRow.id as string;

        const [rounds, prizes, rules, organizers] = await Promise.all([
            sql`SELECT event_id, round_no, round_name, round_description FROM event_rounds WHERE event_id = ${eventId};`,
            sql`SELECT event_id, position, reward_value FROM event_prizes WHERE event_id = ${eventId};`,
            sql`SELECT id, event_id, round_no, rule_number, rule_description, created_at, updated_at FROM event_rules WHERE event_id = ${eventId};`,
            sql`SELECT eo.event_id, eo.user_id, eo.assigned_by, p.first_name, p.last_name, u.ph_no 
                FROM event_organizers eo
                JOIN profile p ON eo.user_id = p.user_id
                JOIN users u ON eo.user_id = u.id
                WHERE eo.event_id = ${eventId};`
        ]);

        const fullEvent = {
            ...dbEventToCamel(eventRow),
            rounds: rounds.map(dbRoundToCamel),
            prizes: prizes.map(dbPrizeToCamel),
            organizers: organizers.map(dbOrganizerToCamel),
            rules: rules.map(dbRuleToCamel),
        };

        // Final Schema Validation
        const parsedEvent = eventSchema.safeParse(fullEvent);
        if (!parsedEvent.success) {
            return {
                status: false,
                statusCode: 500,
                message: "Database record does not match the required Event schema",
                data: {}
            };
        }

        return { 
            status: true, 
            statusCode: 200, 
            message: "Event details retrieved successfully", 
            data: parsedEvent.data
        };
    } catch (error: any) {
        return { 
            status: false, 
            statusCode: 500, 
            message: error.message || "An unexpected error occurred", 
            data: {} 
        };
    }
}

// 4. Update Event
export async function updateEvent(input: UpdateEventDetailsInput & { id: string }) {
    const validation = updateEventDetailsSchema.safeParse(input);
    
    if (!validation.success) {
        return {
            status: false,
            statusCode: 400,
            message: validation.error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join(", "),
            data: {}
        };
    }

    const data = validation.data;
    const eventId = input.id;
    const minTeamSize = data.minTeamSize ?? 1;
    const maxTeamSize = data.maxTeamSize ?? null;
    const createdBy = data.createdBy ?? null;

    try {
        if (data.organizers && data.organizers.length > 0) {
            const orgIds = data.organizers.map(o => o.userId);
            const validOrganizers = await sql`
                SELECT id FROM users 
                WHERE id = ANY(${orgIds}::text[]) 
                AND (participant_type = 'ORGANIZER' OR participant_type = 'ADMIN')
            `;
            if (validOrganizers.length !== orgIds.length) {
                const validIds = validOrganizers.map((vo: any) => vo.id as string);
                const invalidIds = orgIds.filter(id => !validIds.includes(id));
                
                return { 
                    status: false, 
                    statusCode: 400, 
                    message: `Invalid or unauthorized organizer IDs: [${invalidIds.join(", ")}]`, 
                    data: { invalidIds } 
                };
            }
        }

        const [eventRow] = await sql`
            UPDATE events SET
                name = ${data.name}, description = ${data.description},
                participation_type = ${data.participationType}, event_type = ${data.eventType},
                max_allowed = ${data.maxAllowed}, min_team_size = ${minTeamSize},
                max_team_size = ${maxTeamSize}, venue = ${data.venue},
                start_time = ${data.startTime}, end_time = ${data.endTime},
                registration_start = ${data.registrationStart}, registration_end = ${data.registrationEnd},
                created_by = ${createdBy}, updated_at = NOW()
            WHERE id = ${eventId} 
            RETURNING id, name, description, participation_type, event_type, max_allowed, min_team_size, max_team_size, venue, start_time, end_time, registration_start, registration_end, created_by, created_at, updated_at;
        `;

        if (!eventRow) {
            return { status: false, statusCode: 404, message: "Event not found", data: {} };
        }

        await sql`DELETE FROM event_rounds WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_prizes WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_organizers WHERE event_id = ${eventId};`;
        await sql`DELETE FROM event_rules WHERE event_id = ${eventId};`;

        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`INSERT INTO event_rounds (event_id, round_no, round_name, round_description) VALUES (${eventId}, ${r.roundNo}, ${r.roundName ?? null}, ${r.roundDescription ?? null});`;
            }
        }

        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`INSERT INTO event_prizes (event_id, position, reward_value) VALUES (${eventId}, ${p.position}, ${p.rewardValue});`;
            }
        }

        if (data.organizers && data.organizers.length > 0) {
            for (const o of data.organizers) {
                await sql`INSERT INTO event_organizers (event_id, user_id, assigned_by) VALUES (${eventId}, ${o.userId}, ${o.assignedBy ?? createdBy});`;
            }
        }

        if (data.rules && data.rules.length > 0) {
            for (const rule of data.rules) {
                await sql`INSERT INTO event_rules (event_id, round_no, rule_number, rule_description) VALUES (${eventId}, ${rule.roundNo ?? null}, ${rule.ruleNumber}, ${rule.ruleDescription ?? null});`;
            }
        }

        return await getEventById({ id: eventId });
    } catch (error: any) {
        return {
            status: false,
            statusCode: 500,
            message: error.message || "An unexpected database error occurred during update",
            data: {}
        };
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
        await sql`DELETE FROM event_rules WHERE event_id = ${id};`;
        const result = await sql`DELETE FROM events WHERE id = ${id};`;
        const affected = (result as any).count ?? 0;
        if (affected === 0) {
            return { status: false, statusCode: 404, message: "Event not found", data: {} };
        }
        return { status: true, statusCode: 200, message: "Event deleted successfully", data: {} };
    } catch (error: any) {
        return { status: false, statusCode: 500, message: error.message || "Delete failed", data: {} };
    }
}

// 6. Register for Event
export async function registerForEvent(input: EventRegistrationInput & { userId: string; id: string }) {
    const validation = eventRegistrationSchema.safeParse(input);
    if (!validation.success) {
        return {
            status: false,
            statusCode: 400,
            message: validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(", "),
            data: {}
        };
    }

    const { id: eventId, userId } = input;
    const { teamId, participationType } = validation.data;
    try {
            const rows = await sql<{
            min_team_size: number | null;
            max_team_size: number | null;
            registration_start: string | Date;
            registration_end: string | Date;
        }[]>`
            SELECT min_team_size, max_team_size, registration_start, registration_end
            FROM events WHERE id = ${eventId}
        `;
        const eventRow = rows[0];

        if (!eventRow) {
            return { status: false, statusCode: 404, message: "Event not found", data: {} };
        }

        const { registration_start, registration_end, min_team_size, max_team_size } = eventRow;
        const now = new Date();
        const regStart = new Date(registration_start);
        const regEnd = new Date(registration_end);
        
        if (now < regStart && now > regEnd) {
            return { status: false, statusCode: 400, message: "Registration is not open for this event", data: {} };
        }
        
        const isTeamRegistration = participationType.toLowerCase() === "team";
        if (!isTeamRegistration) {
            if (teamId) {
                return { status: false, statusCode: 400, message: "Team registration not allowed for solo events", data: {} };
            }
            const existing = await sql`SELECT id FROM event_registrations WHERE event_id = ${eventId} AND user_id = ${userId} AND team_id IS NULL`;
            if (existing.length > 0) {
                return { status: false, statusCode: 400, message: "User already registered for this event", data: {} };
            }
        } else {
            if (!teamId) {
                return { status: false, statusCode: 400, message: "Team ID is required for team events", data: {} };
            }
            const [teamLeaderRow] = await sql`SELECT leader_id FROM teams WHERE id = ${teamId} AND leader_id = ${userId}`;
            if (!teamLeaderRow) {
                return { status: false, statusCode: 403, message: "Only team leader can register for events", data: {} };
            }
            const teamMembers = await sql`SELECT user_id FROM team_members WHERE team_id = ${teamId}`;
            const teamSize = teamMembers.length;
            if (min_team_size && teamSize < min_team_size) {
                return { status: false, statusCode: 400, message: `Team size ${teamSize} is less than minimum required ${min_team_size}`, data: {} };
            }
            if (max_team_size && teamSize > max_team_size) {
                return { status: false, statusCode: 400, message: `Team size ${teamSize} exceeds maximum allowed ${max_team_size}`, data: {} };
            }
            const memberIds = teamMembers.map((row: any) => row.user_id);
            if (memberIds.length > 0) {
                const conflicts = await sql`SELECT er.user_id FROM event_registrations er WHERE er.event_id = ${eventId} AND er.user_id = ANY(${memberIds}::text[])`;
                if (conflicts.length > 0) {
                    return { status: false, statusCode: 400, message: "Team cannot register - one or more members already registered for this event", data: {} };
                }
            }
        }
        
        const [result] = await sql`
            INSERT INTO event_registrations (event_id, team_id, user_id, registered_at) 
            VALUES (${eventId}, ${teamId || null}, ${userId}, NOW()) 
            RETURNING id, event_id, team_id, user_id, registered_at
        `;
        
        if (isTeamRegistration && teamId) {
            await sql`UPDATE teams SET event_id = ${eventId} WHERE id = ${teamId}`;
        }

        return { status: true, statusCode: 201, message: "Event registration successful", data: result };
    } catch (error) {
        throw error;
    }
}

// 7. Get User Status
export async function getUserEventStatusbyEventId(userId: string, eventId: string, teamId?: string) {
    try {
        const [event] = await sql`
            SELECT participation_type, min_team_size FROM events WHERE id = ${eventId}
        `;
        if (!event) {
            return { status: false, statusCode: 404, message: "Event not found", data: {} };
        }

        const isSolo = event.participation_type.toLowerCase() === "solo";
        const canBeSoloInTeam = event.participation_type.toLowerCase() === "team" && Number(event.min_team_size) === 1;

        if (isSolo || canBeSoloInTeam) {
            const [registration] = await sql`
                SELECT id FROM event_registrations 
                WHERE event_id = ${eventId} 
                AND user_id = ${userId} 
                AND team_id IS NULL
            `;

            if (registration) {
                return { 
                    status: true, 
                    statusCode: 200, 
                    message: isSolo 
                        ? "User is registered for this solo event" 
                        : "User is registered as a solo participant for this team event", 
                    data: { 
                        registration_status: "registered",
                        mode: "solo"
                    } 
                };
            }
        } 
        else {
            const userTeams = await sql`
                SELECT t.id, t.name, t.event_id, 
                (SELECT count(user_id) FROM team_members tm WHERE tm.team_id = t.id) as member_count
                FROM teams t
                JOIN team_members tm ON t.id = tm.team_id
                WHERE tm.user_id = ${userId}
            `;

            if (teamId) {
                const specificTeam = userTeams.find(t => t.id === teamId);
                if (specificTeam && specificTeam.event_id === eventId) {
                    return {
                        status: true,
                        statusCode: 200,
                        message: "The specified team is registered for this event",
                        data: {
                            registration_status: "registered",
                            team_name: specificTeam.name,
                            member_count: specificTeam.member_count
                        }
                    };
                }
            }

            const registeredTeam = userTeams.find(t => t.event_id === eventId);
            if (registeredTeam) {
                return {
                    status: true,
                    statusCode: 200,
                    message: "User is already registered for this event via a team",
                    data: {
                        registration_status: "registered",
                        team_name: registeredTeam.name,
                        member_count: registeredTeam.member_count
                    }
                };
            }
        }

        return { 
            status: true, 
            statusCode: 200, 
            message: "Not registered", 
            data: { registration_status: "not_registered" } 
        };

    } catch (error) {
        throw error;
    }
}

// 8. fetch all the registered events by the user
export async function getRegisteredEventsByUser(userId: string) {
    try {
        const data = await sql`
            SELECT DISTINCT
                e.id AS "eventId",
                e.name AS "eventName",
                e.event_type AS "eventType",
                e.participation_type AS "participationType",
                e.start_time AS "startTime",
                e.venue,
                t.name AS "teamName",
                CASE 
                    WHEN er.team_id IS NOT NULL THEN 'team'
                    ELSE 'solo'
                END AS "registrationMode"
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            LEFT JOIN teams t ON er.team_id = t.id
            -- We join team_members to ensure that if a user is part of a team 
            -- that was registered by a leader, they still see the event.
            LEFT JOIN team_members tm ON t.id = tm.team_id
            WHERE er.user_id = ${userId} OR tm.user_id = ${userId}
            ORDER BY e.start_time ASC
        `;

        if (!data || data.length === 0) {
            return { 
                status: true, 
                statusCode: 200, 
                message: "No registered events found for this user.", 
                data: [] 
            };
        }

        return { 
            status: true, 
            statusCode: 200, 
            message: "Registered events fetched successfully", 
            data 
        };
    } catch (error: any) {
        console.error("Database Error in getRegisteredEventsByUser:", error);
        return { 
            status: false, 
            statusCode: 500, 
            message: error.message || "Internal server error while fetching events", 
            data: [] 
        };
    }
}