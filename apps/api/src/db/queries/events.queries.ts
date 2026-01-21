import sql from "../connection";
import {
    type Event, eventSchema,
    createEventSchema, type CreateEvent,
    getEventDetailsSchema, type GetEventDetailsInput,
    type DeleteEventInput,
    type UpdateEventDetailsInput, updateEventDetailsSchema,
    type EventRegistrationInput, eventRegistrationSchema,
    prizeSchema, type Prize
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
export async function createEvent(input: CreateEvent, user_id: string) {

    const data = createEventSchema.parse(input);
    const minTeamSize = data.minTeamSize ?? 1;
    const maxTeamSize = data.maxTeamSize ?? null;
    const createdBy = user_id;

    try {
        // Validate organizers by email
        const organizerEmails: string[] = [];
        const organizerIds: string[] = [];

        if (data.organizers && data.organizers.length > 0) {
            const validOrganizers = await sql`
                SELECT id, email FROM users 
                WHERE email = ANY(${sql.array(data.organizers)})
                AND (role = 'ORGANIZER' OR role = 'ADMIN')
            `;

            if (validOrganizers.length !== data.organizers.length) {
                const validEmails = validOrganizers.map(vo => vo.email);
                const invalidEmails = data.organizers.filter(email => !validEmails.includes(email));
                return {
                    status: false,
                    statusCode: 400,
                    message: `Invalid organizers: [${invalidEmails.join(", ")}]. Users must exist and have ORGANIZER or ADMIN permissions.`,
                    data: { invalidEmails }
                };
            }

            validOrganizers.forEach(org => {
                organizerEmails.push(org.email);
                organizerIds.push(org.id);
            });
        }

        // Create event
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

        // Insert rounds
        if (data.rounds && data.rounds.length > 0) {
            for (const r of data.rounds) {
                await sql`
                    INSERT INTO event_rounds (event_id, round_no, round_name, round_description) 
                    VALUES (${eventId}, ${r.roundNo}, ${r.roundName ?? null}, ${r.roundDescription ?? null})
                `;
            }
        }

        // Insert prizes
        if (data.prizes && data.prizes.length > 0) {
            for (const p of data.prizes) {
                await sql`
                    INSERT INTO event_prizes (event_id, position, reward_value) 
                    VALUES (${eventId}, ${p.position}, ${p.rewardValue})
                `;
            }
        }

        // Insert organizers using their user IDs
        if (organizerIds.length > 0) {
            for (const organizerId of organizerIds) {
                await sql`
                    INSERT INTO event_organizers (event_id, user_id, assigned_by) 
                    VALUES (${eventId}, ${organizerId}, ${createdBy})
                `;
            }
        }

        // Insert rules
        if (data.rules && data.rules.length > 0) {
            for (const rule of data.rules) {
                await sql`
                    INSERT INTO event_rules (event_id, round_no, rule_number, rule_description) 
                    VALUES (${eventId}, ${rule.roundNo ?? null}, ${rule.ruleNumber}, ${rule.ruleDescription ?? null})
                `;
            }
        }

        return await getEventById({ id: eventId });
    } catch (error) {
        console.error("Error creating event:", error);
        return {
            status: false,
            statusCode: 500,
            message: "An error occurred while creating the event",
            data: {}
        };
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
        if (!eventRow) {
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
                AND (role = 'ORGANIZER' OR role = 'ADMIN')
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
        await sql`UPDATE teams SET event_id = NULL WHERE event_id = ${id}`;
        await sql`DELETE FROM event_rounds WHERE event_id = ${id};`;
        await sql`DELETE FROM event_prizes WHERE event_id = ${id};`;
        await sql`DELETE FROM event_organizers WHERE event_id = ${id};`;
        await sql`DELETE FROM event_rules WHERE event_id = ${id};`;
        await sql`DELETE FROM event_registration WHERE event_id=${id}`;

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
            message: validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
            data: {}
        };
    }

    const { id: eventId, userId } = input;
    const { teamId, participationType } = validation.data;
    console.log(participationType);

    try {
        // 1. Fetch event details
        const eventRows = await sql`
            SELECT 
                id,
                participation_type,
                min_team_size,
                max_team_size,
                registration_start,
                registration_end,
                max_allowed
            FROM events
            WHERE id = ${eventId}
        `;

        const eventRow = eventRows[0];
        if (!eventRow) {
            return {
                status: false,
                statusCode: 404,
                message: 'Event not found',
                data: {}
            };
        }

        // 2. Validate registration window
        const now = new Date();
        const regStart = new Date(eventRow.registration_start);
        const regEnd = new Date(eventRow.registration_end);

        if (now < regStart || now > regEnd) {
            return {
                status: false,
                statusCode: 400,
                message: 'Registration window is closed for this event',
                data: {}
            };
        }
        // ========== SOLO REGISTRATION ==========
        if (participationType === 'solo') {
            // 3a. Solo event: teamId should be null
            if (teamId) {
                return {
                    status: false,
                    statusCode: 400,
                    message: 'Team registration not allowed for solo events',
                    data: {}
                };
            }

            // 3b. Check if user already registered
            const existingRegistration = await sql`
                SELECT id FROM event_registrations 
                WHERE event_id = ${eventId} AND user_id = ${userId} AND team_id IS NULL
            `;

            if (existingRegistration.length > 0) {
                return {
                    status: false,
                    statusCode: 409,
                    message: 'User already registered for this event',
                    data: {}
                };
            }

            // 3c. Check max registration limit
            const registrationCount = await sql<[{ count: number }]>`
                SELECT COUNT(*) as count FROM event_registrations 
                WHERE event_id = ${eventId}
            `;

            if (registrationCount[0].count >= eventRow.max_allowed) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Event is full. Maximum ${eventRow.max_allowed} registrations allowed`,
                    data: {}
                };
            }

            // 3d. Register solo user
            const [result] = await sql`
                INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
                VALUES (${eventId}, NULL, ${userId}, NOW())
                RETURNING id, event_id, team_id, user_id, registered_at
            `;

            return {
                status: true,
                statusCode: 201,
                message: 'Solo registration successful',
                data: result
            };
        }

        // ========== TEAM REGISTRATION ==========
        if (participationType === 'team') {
            // 4a. Team event: teamId is required
            if (!teamId) {
                return {
                    status: false,
                    statusCode: 400,
                    message: 'Team ID is required for team events',
                    data: {}
                };
            }

            // 4b. Only team leader can register
            const [teamLeaderRow] = await sql`
                SELECT leader_id FROM teams WHERE id = ${teamId}
            `;

            if (!teamLeaderRow) {
                return {
                    status: false,
                    statusCode: 404,
                    message: 'Team not found',
                    data: {}
                };
            }

            if (teamLeaderRow.leader_id !== userId) {
                return {
                    status: false,
                    statusCode: 403,
                    message: 'Only team leader can register for events',
                    data: {}
                };
            }

            // 4c. Fetch all team members (leader is also in team_members table)
            const teamMembers = await sql<{ user_id: string }[]>`
                SELECT user_id FROM team_members WHERE team_id = ${teamId}
            `;

            const memberIds = teamMembers.map((m) => m.user_id);
            const teamSize = memberIds.length;

            // 4d. Validate team size
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

            // 4e. Check if any team member already registered
            const conflictingRegistrations = await sql`
                SELECT DISTINCT 
                    er.user_id,
                    u.email
                    FROM event_registrations er
                    JOIN users u ON er.user_id = u.id
                    WHERE er.event_id = ${eventId} 
                    AND er.user_id = ANY(${memberIds}::text[]);
                `;

            if (conflictingRegistrations.length > 0) {
                const conflictingEmails = conflictingRegistrations
                    .map((r: any) => r.email)
                    .join(', ');

                return {
                    status: false,
                    statusCode: 409,
                    message: `Team cannot register - following members already registered: ${conflictingEmails}`,
                    data: {
                        conflicting_members: conflictingRegistrations.map((r: any) => ({
                            user_id: r.user_id,
                            email: r.email
                        }))
                    }
                };
            }
            // 4f. Check max registration limit (count teams, not individuals)
            const teamRegistrationCount = await sql<[{ count: number }]>`
                SELECT COUNT(DISTINCT team_id) as count FROM event_registrations 
                WHERE event_id = ${eventId} AND team_id IS NOT NULL
            `;

            if (teamRegistrationCount[0].count >= eventRow.max_allowed) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Event is full. Maximum ${eventRow.max_allowed} teams allowed`,
                    data: {}
                };
            }

            // 4g. Register all team members individually with team_id
            for (const memberId of memberIds) {
                const [registration] = await sql`
                    INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
                    VALUES (${eventId}, ${teamId}, ${memberId}, NOW())
                    RETURNING id, event_id, team_id, user_id, registered_at
                `;
            }

            return {
                status: true,
                statusCode: 201,
                message: `Team registration successfull!`,
                data: {
                }
            };
        }

        return {
            status: false,
            statusCode: 400,
            message: 'Invalid event participation type',
            data: {}
        };
    } catch (error) {
        console.error('Event registration error:', error);
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

        const [registration] = await sql`
            SELECT 
                er.id, 
                er.team_id, 
                er.user_id,
                t.name as team_name,
                (SELECT count(*) FROM team_members WHERE team_id = er.team_id) as member_count
            FROM event_registrations er
            LEFT JOIN teams t ON er.team_id = t.id
            WHERE er.event_id = ${eventId} 
            AND (er.user_id = ${userId} OR er.team_id IN (SELECT team_id FROM team_members WHERE user_id = ${userId}))
            LIMIT 1
        `;

        if (registration) {
            const isTeamMode = registration.team_id !== null;
            return {
                status: true,
                statusCode: 200,
                message: isTeamMode ? "Registered via team" : "Registered solo",
                data: {
                    registration_status: "registered",
                    mode: isTeamMode ? "team" : "solo",
                    team_id: registration.team_id,
                    team_name: registration.team_name,
                    member_count: registration.member_count
                }
            };
        }

        // const [syncedTeam] = await sql`
        //     SELECT t.id, t.name, 
        //     (SELECT count(*) FROM team_members WHERE team_id = t.id) as member_count
        //     FROM teams t
        //     JOIN team_members tm ON t.id = tm.team_id
        //     WHERE tm.user_id = ${userId} AND t.event_id = ${eventId}
        //     LIMIT 1
        // `;

        // if (syncedTeam) {
        //     return {
        //         status: true,
        //         statusCode: 200,
        //         message: "Registered (Synced via Team)",
        //         data: {
        //             registration_status: "registered",
        //             mode: "team",
        //             team_id: syncedTeam.id,
        //             team_name: syncedTeam.name,
        //             member_count: syncedTeam.member_count
        //         }
        //     };
        // }

        return {
            status: true,
            statusCode: 200,
            message: "Not registered",
            data: { registration_status: "not_registered" }
        };

    } catch (error) {
        console.error("Error in getUserEventStatusbyEventId:", error);
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

// Unregister from event
export async function unregisterFromEvent(input: {
    eventId: string;
    userId: string;
    participationType: string;
    teamId?: string | null
}) {
    const { eventId, userId, participationType, teamId } = input;

    try {
        if (participationType.toLowerCase() === "solo") {
            const result = await sql`
                DELETE FROM event_registrations 
                WHERE event_id = ${eventId} 
                AND user_id = ${userId} 
                AND team_id IS NULL
                RETURNING id;
            `;

            if (result.length === 0) {
                return { status: false, statusCode: 404, message: "Solo registration not found", data: {} };
            }

            return { status: true, statusCode: 200, message: "Successfully unregistered from solo event", data: {} };
        } else {
            if (!teamId) {
                return { status: false, statusCode: 400, message: "Team ID is required for team unregistration", data: {} };
            }

            const [team] = await sql`
                SELECT name FROM teams 
                WHERE id = ${teamId} 
                AND leader_id = ${userId} 
            `;

            if (!team) {
                return {
                    status: false,
                    statusCode: 403,
                    message: "Only the team leader can unregister the team from this event",
                    data: {}
                };
            }


            await sql`DELETE FROM event_registrations WHERE event_id = ${eventId} AND team_id = ${teamId};`;

            return {
                status: true,
                statusCode: 200,
                message: `Team "${team.name}" has been successfully unregistered`,
                data: { teamName: team.name }
            };
        }
    } catch (error: any) {
        console.error("Unregister Error:", error);
        return { status: false, statusCode: 500, message: error.message || "Unregistration failed", data: {} };
    }
}

export async function getPrizesForEvent(event_id: string) {

    const prizes = await sql`
            SELECT id, event_id, position, reward_value 
            FROM event_prizes 
            WHERE event_id = ${event_id}
            ORDER BY position ASC
        `;

    return prizes;
}
