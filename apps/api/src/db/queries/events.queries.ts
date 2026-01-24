import { HTTPException } from "hono/http-exception";
import sql from "../connection";
import {
    baseEventSchema,
    basePrizeSchema,
    baseRoundRulesSchema,
    baseRoundSchema,
    baseCrewSchema,
    getCrewSchema,
    verboseEventSchema,
    getVerboseEventResponseSchema,
    type CreateEvent,
    type CreateEventPrizes,
    type CreateRounds,
    type CreateRoundRules,
    type Event,
    type Prize,
    type Round,
    type Rule,
    type VerboseEvent,
    type AssignEventCrews,
    type Crew,
    type GetVerboseEvent,
    type GetCrew,
    type UserRegisteredEvents,
    userRegisteredEventsSchema,
} from "@melinia/shared";

export async function insertEvent(created_by: string, data: CreateEvent, tx = sql): Promise<Event> {
    const [event] = await tx`
        INSERT INTO events (
            name,
            description,
            participation_type,
            event_type, max_allowed,
            min_team_size,
            max_team_size,
            venue,
            registration_start,
            registration_end,
            start_time,
            end_time,
            created_by
        )
        VALUES (
            ${data.name},
            ${data.description},
            ${data.participation_type},
            ${data.event_type},
            ${data.max_allowed},
            ${data.min_team_size},
            ${data.max_team_size},
            ${data.venue},
            ${data.registration_start},
            ${data.registration_end},
            ${data.start_time},
            ${data.end_time},
            ${created_by}
        )
        RETURNING *;
    `;

    return baseEventSchema.parse(event);
};

export async function insertPrizes(eventId: string, data: CreateEventPrizes, tx = sql): Promise<Prize[]> {
    const prizes = await tx`
        INSERT INTO event_prizes (event_id, position, reward_value)
        VALUES ${sql(data.map(prize => [eventId, prize.position, prize.reward_value]))}
        RETURNING *;
    `;

    return prizes.map(prize => basePrizeSchema.parse(prize));
};

export async function insertCrew(
    eventId: string,
    assignedBy: string,
    data: AssignEventCrews,
    role: "ORGANIZER" | "VOLUNTEER",
    tx = sql
): Promise<Crew[]> {
    // TODO: if the user doesn't exits, sliently exits, Need fix!
    const crews = await tx`
        INSERT INTO event_crews
        (event_id, user_id, assigned_by)
        SELECT ${eventId}, u.id, ${assignedBy}
        FROM users u
        WHERE u.email IN ${sql(data.map(organizer => organizer.email))} AND u.role = ${role}
        RETURNING *;
    `;

    return crews.map(crew => baseCrewSchema.parse(crew));
};

export async function insertRounds(eventId: string, data: CreateRounds, tx = sql): Promise<Round[]> {
    const rounds = await tx`
        INSERT INTO event_rounds
        (event_id, round_no, round_name, round_description, start_time, end_time)
        VALUES ${sql(
        data.map(round => [
            eventId,
            round.round_no,
            round.round_name,
            round.round_description,
            round.start_time.toISOString(),
            round.end_time.toISOString()
        ])
    )}
        RETURNING *;
    `;

    return rounds.map(round => baseRoundSchema.parse(round));
};

export async function insertRoundRules(eventId: string, roundId: number, data: CreateRoundRules, tx = sql): Promise<Rule[]> {
    const rules = await tx`
        INSERT INTO round_rules
        (event_id, round_id, rule_no, rule_description)
        VALUES ${sql(data.map(rule => [eventId, roundId, rule.rule_no, rule.rule_description]))}
        RETURNING *;
    `;

    return rules.map(rule => baseRoundRulesSchema.parse(rule));
}

export async function createEvent(userId: string, data: CreateEvent): Promise<VerboseEvent> {
    const result = await sql.begin(async (tx) => {
        const event = await insertEvent(userId, data, tx);
        const prizes = data.prizes?.length ? await insertPrizes(event.id, data.prizes, tx) : [];

        const rounds = data.rounds?.length
            ? await Promise.all(
                data.rounds.map(async (roundData) => {
                    const { rules, ...round } = roundData;

                    const [insertedRound] = await insertRounds(event.id, [round], tx);

                    const insertedRules = insertedRound && rules?.length
                        ? await insertRoundRules(
                            event.id,
                            insertedRound.id,
                            rules,
                            tx
                        )
                        : [];

                    return {
                        ...insertedRound,
                        rules: insertedRules
                    };
                })
            )
            : [];

        const organizers = data?.crew?.organizers?.length
            ? await insertCrew(event.id, userId, data.crew?.organizers, "ORGANIZER", tx)
            : [];

        const volunteers = data?.crew?.volunteers?.length
            ? await insertCrew(event.id, userId, data?.crew?.volunteers, "VOLUNTEER", tx)
            : [];

        return {
            ...event,
            rounds,
            prizes,
            crew: {
                organizers,
                volunteers
            }
        }
    });

    return verboseEventSchema.parse(result);
}

export async function listEvents(): Promise<Event[]> {
    const events = await sql`
        SELECT 
            id,
            name,
            description,
            participation_type,
            event_type,
            max_allowed,
            min_team_size,
            max_team_size,
            venue,
            registration_start,
            registration_end,
            start_time,
            end_time,
            created_by,
            created_at,
            updated_at
        FROM events e
        ORDER BY e.name ASC;
    `

    return events.map(event => baseEventSchema.parse(event));
}

export async function getPrizes(eventIds: string[]): Promise<Prize[]> {
    if (eventIds.length === 0) {
        return [];
    }

    const prizes = await sql`
        SELECT
            id,
            event_id,
            position,
            reward_value,
            created_at,
            updated_at
        FROM event_prizes ep
        WHERE ep.event_id = ANY(${eventIds})
        ORDER BY event_id, position ASC;
    `

    return prizes.map(pz => basePrizeSchema.parse(pz));
}

export async function getRounds(eventIds: string[]): Promise<Round[]> {
    if (eventIds.length === 0) {
        return [];
    }

    const rounds = await sql`
        SELECT
            id,
            event_id,
            round_no,
            round_name,
            round_description,
            start_time,
            end_time,
            created_at,
            updated_at
        FROM event_rounds
        WHERE event_id = ANY(${eventIds})
        ORDER BY event_id, round_no ASC;
    `

    return rounds.map(round => baseRoundSchema.parse(round));
}

export async function getRoundRules(roundIds: number[]): Promise<Rule[]> {
    if (roundIds.length === 0) {
        return [];
    }

    const rules = await sql`
        SELECT
            id,
            event_id,
            round_id,
            rule_no,
            rule_description,
            created_at,
            updated_at
        FROM round_rules
        WHERE round_id = ANY(${roundIds})
        ORDER BY round_id, rule_no ASC;
    `

    return rules.map(rule => baseRoundRulesSchema.parse(rule));
}

export async function getOrganizers(eventIds: string[]): Promise<GetCrew[]> {
    if (eventIds.length === 0) {
        return [];
    }

    const organizers = await sql`
        SELECT
            ec.event_id,
            ec.user_id,
            p.first_name,
            p.last_name,
            u.ph_no,
            ec.assigned_by,
            ec.created_at
        FROM event_crews ec
        JOIN users u ON u.id = ec.user_id
        JOIN profile p ON p.user_id = u.id
        WHERE ec.event_id = ANY(${eventIds}) AND u.role = 'ORGANIZER'
        ORDER BY ec.event_id;
    `;

    return organizers.map(og => getCrewSchema.parse(og));
}

export async function getEvents(): Promise<GetVerboseEvent[]> {
    const events = await listEvents();

    if (events.length === 0) {
        return [];
    }

    const eventIds = events.map(event => event.id);
    const prizes = await getPrizes(eventIds);
    const rounds = await getRounds(eventIds);

    const roundIds = rounds.map(rnd => rnd.id);
    const rules = roundIds.length ? await getRoundRules(roundIds) : [];

    const organizers = await getOrganizers(eventIds);

    const verboseEvents = events
        .map(event => {
            const eventRounds = rounds
                .filter(round => round.event_id === event.id)
                .map(round => {
                    const roundRules = rules.filter(rule => rule.round_id === round.id)
                    return {
                        ...round,
                        rules: roundRules
                    }
                });

            return {
                ...event,
                rounds: eventRounds,
                prizes: prizes.filter(prize => prize.event_id === event.id),
                crew: {
                    organizers: organizers.filter(og => og.event_id === event.id)
                }
            }
        });

    return verboseEvents.map(ve => { return getVerboseEventResponseSchema.parse(ve) });
}

export async function getEventById(eventId: string): Promise<GetVerboseEvent> {
    const [event] = await sql`
        SELECT 
            id,
            name,
            description,
            participation_type,
            event_type,
            max_allowed,
            min_team_size,
            max_team_size,
            venue,
            registration_start,
            registration_end,
            start_time,
            end_time,
            created_by,
            created_at,
            updated_at
        FROM events e
        WHERE e.id = ${eventId};
    `

    if (!event) {
        throw new HTTPException(404, { message: "Event not found" });
    }

    const [prizes, rounds, organizers] = await Promise.all([
        await getPrizes([eventId]),
        await getRounds([eventId]),
        await getOrganizers([eventId])
    ]);

    const roundIds = rounds.map(rnd => rnd.id);
    const rules = roundIds.length ? await getRoundRules(roundIds) : [];

    const eventRounds = rounds
        .filter(round => round.event_id === eventId)
        .map(round => {
            const roundRules = rules.filter(rule => rule.round_id === round.id)
            return {
                ...round,
                rules: roundRules
            }
        });

    const verboseEvent = {
        ...event,
        rounds: eventRounds,
        prizes: prizes.filter(prize => prize.event_id === eventId),
        crew: {
            organizers: organizers.filter(og => og.event_id === eventId)
        }
    }

    return getVerboseEventResponseSchema.parse(verboseEvent);
}

export async function deleteEvent(eventId: string): Promise<Event> {
    const [deletedEvent] = await sql`
        DELETE FROM events
        WHERE id = ${eventId}
        RETURNING *;
    `

    if (!deletedEvent) {
        throw new HTTPException(404, { message: "Event not found" });
    }

    return baseEventSchema.parse(deletedEvent);
}

export async function getRegisteredEvents(userId: string): Promise<UserRegisteredEvents> {
    const registeredEvent = await sql`
        SELECT event_id
        FROM event_registrations
        WHERE user_id = ${userId};
    `

    const registeredEventIds = registeredEvent.map(re => re.event_id);

    const events = await sql`
        SELECT
            id,
            name,
            description,
            participation_type,
            event_type,
            max_allowed,
            min_team_size,
            max_team_size,
            venue,
            registration_start,
            registration_end,
            start_time,
            end_time,
            created_by,
            created_at,
            updated_at
        FROM events e
        WHERE e.id = ANY(${registeredEventIds});
    `
    const rounds = await getRounds(registeredEventIds);

    return userRegisteredEventsSchema
        .parse(
            events
            .map(event => {
                return {
                    ...event,
                    rounds: rounds.filter(round => round.event_id == event.id)
                }
            })
        );
}

export async function checkEventExists(eventId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM events WHERE id = ${eventId}
    `;
    return result.length > 0;
}

// ============= Event Registration Queries =============

export async function isUserRegisteredAlready(eventId: string, userId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM event_registrations 
        WHERE event_id = ${eventId} AND user_id = ${userId}
    `;
    return result.length > 0;
}

export async function isTeamRegisteredAlready(eventId: string, teamId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM event_registrations 
        WHERE event_id = ${eventId} AND team_id = ${teamId}
    `;
    return result.length > 0;
}

export async function getEventRegistrationCount(eventId: string): Promise<number> {
    const [result] = await sql<[{ count: number }]>`
        SELECT COUNT(*) as count FROM event_registrations 
        WHERE event_id = ${eventId}
    `;
    return result.count;
}
export async function getEventTeamRegistrationCount(eventId: string): Promise<number> {
    const [result] = await sql<[{ count: number }]>`
        SELECT COUNT(DISTINCT team_id) as count FROM event_registrations 
        WHERE event_id = ${eventId} AND team_id IS NOT NULL
    `;
    return result.count;
}

export async function getConflictingTeamMembers(eventId: string, memberIds: string[]) {
    const conflicts = await sql`
        SELECT DISTINCT 
            er.user_id,
            u.email
        FROM event_registrations er
        JOIN users u ON er.user_id = u.id
        WHERE er.event_id = ${eventId} 
        AND er.user_id = ANY(${memberIds}::text[])
    `;
    return conflicts;
}

export async function insertSoloRegistration(eventId: string, userId: string) {
    const [result] = await sql`
        INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
        VALUES (${eventId}, NULL, ${userId}, NOW())
        RETURNING id, event_id, team_id, user_id, registered_at
    `;
    return result;
}

export async function insertTeamRegistration(eventId: string, teamId: string, userId: string) {
    const [result] = await sql`
        INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
        VALUES (${eventId}, ${teamId}, ${userId}, NOW())
        RETURNING id, event_id, team_id, user_id, registered_at
    `;
    return result;
}

// ============= Team Related Queries =============

export async function getTeamLeaderId(teamId: string): Promise<string | null> {
    const [team] = await sql`
        SELECT leader_id FROM teams WHERE id = ${teamId}
    `;
    return team?.leader_id || null;
}

export async function getTeamMemberIds(teamId: string): Promise<string[]> {
    const members = await sql<{ user_id: string }[]>`
        SELECT user_id FROM team_members WHERE team_id = ${teamId}
    `;
    return members.map(m => m.user_id);
}

export async function getTeamMemberCount(teamId: string): Promise<number> {
    const [result] = await sql<[{ count: number }]>`
        SELECT COUNT(*) as count FROM team_members WHERE team_id = ${teamId}
    `;
    return result.count;
}

// // Update Event
// export async function updateEvent(input: UpdateEventDetails & { id: string }) {
//     const validation = updateEventDetailsSchema.safeParse(input);
// 
//     if (!validation.success) {
//         return {
//             status: false,
//             statusCode: 400,
//             message: validation.error.issues
//                 .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
//                 .join(", "),
//             data: {}
//         };
//     }
// 
//     const data = validation.data;
//     const eventId = input.id;
//     const minTeamSize = data.minTeamSize ?? 1;
//     const maxTeamSize = data.maxTeamSize ?? null;
//     const createdBy = data.createdBy ?? null;
// 
//     try {
//         if (data.organizers && data.organizers.length > 0) {
//             const orgIds = data.organizers.map(o => o.userId);
//             const validOrganizers = await sql`
//                 SELECT id FROM users 
//                 WHERE id = ANY(${orgIds}::text[]) 
//                 AND (role = "ORGANIZER" OR role = "ADMIN")
//             `;
//             if (validOrganizers.length !== orgIds.length) {
//                 const validIds = validOrganizers.map((vo: any) => vo.id as string);
//                 const invalidIds = orgIds.filter(id => !validIds.includes(id));
// 
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: `Invalid or unauthorized organizer IDs: [${invalidIds.join(", ")}]`,
//                     data: { invalidIds }
//                 };
//             }
//         }
// 
//         const [eventRow] = await sql`
//             UPDATE events SET
//                 name = ${data.name}, description = ${data.description},
//                 participation_type = ${data.participationType}, event_type = ${data.eventType},
//                 max_allowed = ${data.maxAllowed}, min_team_size = ${minTeamSize},
//                 max_team_size = ${maxTeamSize}, venue = ${data.venue},
//                 start_time = ${data.startTime}, end_time = ${data.endTime},
//                 registration_start = ${data.registrationStart}, registration_end = ${data.registrationEnd},
//                 created_by = ${createdBy}, updated_at = NOW()
//             WHERE id = ${eventId} 
//             RETURNING id, name, description, participation_type, event_type, max_allowed, min_team_size, max_team_size, venue, start_time, end_time, registration_start, registration_end, created_by, created_at, updated_at;
//         `;
// 
//         if (!eventRow) {
//             return { status: false, statusCode: 404, message: "Event not found", data: {} };
//         }
// 
//         await sql`DELETE FROM event_rounds WHERE event_id = ${eventId};`;
//         await sql`DELETE FROM event_prizes WHERE event_id = ${eventId};`;
//         await sql`DELETE FROM event_organizers WHERE event_id = ${eventId};`;
//         await sql`DELETE FROM round_rules WHERE event_id = ${eventId};`;
// 
//         if (data.rounds && data.rounds.length > 0) {
//             for (const r of data.rounds) {
//                 await sql`INSERT INTO event_rounds (event_id, round_no, round_name, round_description) VALUES (${eventId}, ${r.roundNo}, ${r.roundName ?? null}, ${r.roundDescription ?? null});`;
//             }
//         }
// 
//         if (data.prizes && data.prizes.length > 0) {
//             for (const p of data.prizes) {
//                 await sql`INSERT INTO event_prizes (event_id, position, reward_value) VALUES (${eventId}, ${p.position}, ${p.rewardValue});`;
//             }
//         }
// 
//         if (data.organizers && data.organizers.length > 0) {
//             for (const o of data.organizers) {
//                 await sql`INSERT INTO event_organizers (event_id, user_id, assigned_by) VALUES (${eventId}, ${o.userId}, ${o.assignedBy ?? createdBy});`;
//             }
//         }
// 
//         if (data.rules && data.rules.length > 0) {
//             for (const rule of data.rules) {
//                 await sql`INSERT INTO round_rules (event_id, round_no, rule_number, rule_description) VALUES (${eventId}, ${rule.roundNo ?? null}, ${rule.ruleNumber}, ${rule.ruleDescription ?? null});`;
//             }
//         }
// 
//         return await getEventById({ id: eventId });
//     } catch (error: any) {
//         return {
//             status: false,
//             statusCode: 500,
//             message: error.message || "An unexpected database error occurred during update",
//             data: {}
//         };
//     }
// }
// 
// // 6. Register for Event
// export async function registerForEvent(input: EventRegistrationInput & { userId: string; id: string }) {
// =======
// // Register for Event
// export async function registerForEvent(input: EventRegistration & { userId: string; id: string }) {
// >>>>>>> Stashed changes
//     const validation = eventRegistrationSchema.safeParse(input);
//     if (!validation.success) {
//         return {
//             status: false,
//             statusCode: 400,
//             message: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
//             data: {}
//         };
//     }
// 
//     const { id: eventId, userId } = input;
//     const { teamId, participationType } = validation.data;
//     console.log(participationType);
// 
//     try {
//         // 1. Fetch event details
//         const eventRows = await sql`
//             SELECT 
//                 id,
//                 participation_type,
//                 min_team_size,
//                 max_team_size,
//                 registration_start,
//                 registration_end,
//                 max_allowed
//             FROM events
//             WHERE id = ${eventId}
//         `;
// 
//         const eventRow = eventRows[0];
//         if (!eventRow) {
//             return {
//                 status: false,
//                 statusCode: 404,
//                 message: "Event not found",
//                 data: {}
//             };
//         }
// 
//         // 2. Validate registration window
//         const now = new Date();
//         const regStart = new Date(eventRow.registration_start);
//         const regEnd = new Date(eventRow.registration_end);
// 
//         if (now < regStart || now > regEnd) {
//             return {
//                 status: false,
//                 statusCode: 400,
//                 message: "Registration window is closed for this event",
//                 data: {}
//             };
//         }
//         // ========== SOLO REGISTRATION ==========
//         if (participationType === "solo") {
//             // 3a. Solo event: teamId should be null
//             if (teamId) {
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: "Team registration not allowed for solo events",
//                     data: {}
//                 };
//             }
// 
//             // 3b. Check if user already registered
//             const existingRegistration = await sql`
//                 SELECT id FROM event_registrations 
//                 WHERE event_id = ${eventId} AND user_id = ${userId} AND team_id IS NULL
//             `;
// 
//             if (existingRegistration.length > 0) {
//                 return {
//                     status: false,
//                     statusCode: 409,
//                     message: "User already registered for this event",
//                     data: {}
//                 };
//             }
// 
//             // 3c. Check max registration limit
//             const registrationCount = await sql<[{ count: number }]>`
//                 SELECT COUNT(*) as count FROM event_registrations 
//                 WHERE event_id = ${eventId}
//             `;
// 
//             if (registrationCount[0].count >= eventRow.max_allowed) {
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: `Event is full. Maximum ${eventRow.max_allowed} registrations allowed`,
//                     data: {}
//                 };
//             }
// 
//             // 3d. Register solo user
//             const [result] = await sql`
//                 INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
//                 VALUES (${eventId}, NULL, ${userId}, NOW())
//                 RETURNING id, event_id, team_id, user_id, registered_at
//             `;
// 
//             return {
//                 status: true,
//                 statusCode: 201,
//                 message: "Solo registration successful",
//                 data: result
//             };
//         }
// 
//         // ========== TEAM REGISTRATION ==========
//         if (participationType === "team") {
//             // 4a. Team event: teamId is required
//             if (!teamId) {
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: "Team ID is required for team events",
//                     data: {}
//                 };
//             }
// 
//             // 4b. Only team leader can register
//             const [teamLeaderRow] = await sql`
//                 SELECT leader_id FROM teams WHERE id = ${teamId}
//             `;
// 
//             if (!teamLeaderRow) {
//                 return {
//                     status: false,
//                     statusCode: 404,
//                     message: "Team not found",
//                     data: {}
//                 };
//             }
// 
//             if (teamLeaderRow.leader_id !== userId) {
//                 return {
//                     status: false,
//                     statusCode: 403,
//                     message: "Only team leader can register for events",
//                     data: {}
//                 };
//             }
// 
//             // 4c. Fetch all team members (leader is also in team_members table)
//             const teamMembers = await sql<{ user_id: string }[]>`
//                 SELECT user_id FROM team_members WHERE team_id = ${teamId}
//             `;
// 
//             const memberIds = teamMembers.map((m) => m.user_id);
//             const teamSize = memberIds.length;
// 
//             // 4d. Validate team size
//             if (eventRow.min_team_size && teamSize < eventRow.min_team_size) {
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: `Team size ${teamSize} is less than minimum required ${eventRow.min_team_size}`,
//                     data: {}
//                 };
//             }
// 
//             if (eventRow.max_team_size && teamSize > eventRow.max_team_size) {
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: `Team size ${teamSize} exceeds maximum allowed ${eventRow.max_team_size}`,
//                     data: {}
//                 };
//             }
// 
//             // 4e. Check if any team member already registered
//             const conflictingRegistrations = await sql`
//                 SELECT DISTINCT 
//                     er.user_id,
//                     u.email
//                     FROM event_registrations er
//                     JOIN users u ON er.user_id = u.id
//                     WHERE er.event_id = ${eventId} 
//                     AND er.user_id = ANY(${memberIds}::text[]);
//                 `;
// 
//             if (conflictingRegistrations.length > 0) {
//                 const conflictingEmails = conflictingRegistrations
//                     .map((r: any) => r.email)
//                     .join(", ");
// 
//                 return {
//                     status: false,
//                     statusCode: 409,
//                     message: `Team cannot register - following members already registered: ${conflictingEmails}`,
//                     data: {
//                         conflicting_members: conflictingRegistrations.map((r: any) => ({
//                             user_id: r.user_id,
//                             email: r.email
//                         }))
//                     }
//                 };
//             }
//             // 4f. Check max registration limit (count teams, not individuals)
//             const teamRegistrationCount = await sql<[{ count: number }]>`
//                 SELECT COUNT(DISTINCT team_id) as count FROM event_registrations 
//                 WHERE event_id = ${eventId} AND team_id IS NOT NULL
//             `;
// 
//             if (teamRegistrationCount[0].count >= eventRow.max_allowed) {
//                 return {
//                     status: false,
//                     statusCode: 400,
//                     message: `Event is full. Maximum ${eventRow.max_allowed} teams allowed`,
//                     data: {}
//                 };
//             }
// 
//             // 4g. Register all team members individually with team_id
//             for (const memberId of memberIds) {
//                 const [registration] = await sql`
//                     INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
//                     VALUES (${eventId}, ${teamId}, ${memberId}, NOW())
//                     RETURNING id, event_id, team_id, user_id, registered_at
//                 `;
//             }
// 
//             return {
//                 status: true,
//                 statusCode: 201,
//                 message: `Team registration successfull!`,
//                 data: {
//                 }
//             };
//         }
// 
//         return {
//             status: false,
//             statusCode: 400,
//             message: "Invalid event participation type",
//             data: {}
//         };
//     } catch (error) {
//         console.error("Event registration error:", error);
//         throw error;
//     }
// }
// // 7. Get User Status
// export async function getUserEventStatusbyEventId(userId: string, eventId: string, teamId?: string) {
//     try {
//         const [event] = await sql`
//             SELECT participation_type, min_team_size FROM events WHERE id = ${eventId}
//         `;
//         if (!event) {
//             return { status: false, statusCode: 404, message: "Event not found", data: {} };
//         }
// 
//         const [registration] = await sql`
//             SELECT 
//                 er.id, 
//                 er.team_id, 
//                 er.user_id,
//                 t.name as team_name,
//                 (SELECT count(*) FROM team_members WHERE team_id = er.team_id) as member_count
//             FROM event_registrations er
//             LEFT JOIN teams t ON er.team_id = t.id
//             WHERE er.event_id = ${eventId} 
//             AND (er.user_id = ${userId} OR er.team_id IN (SELECT team_id FROM team_members WHERE user_id = ${userId}))
//             LIMIT 1
//         `;
// 
//         if (registration) {
//             const isTeamMode = registration.team_id !== null;
//             return {
//                 status: true,
//                 statusCode: 200,
//                 message: isTeamMode ? "Registered via team" : "Registered solo",
//                 data: {
//                     registration_status: "registered",
//                     mode: isTeamMode ? "team" : "solo",
//                     team_id: registration.team_id,
//                     team_name: registration.team_name,
//                     member_count: registration.member_count
//                 }
//             };
//         }
// 
//         // const [syncedTeam] = await sql`
//         //     SELECT t.id, t.name, 
//         //     (SELECT count(*) FROM team_members WHERE team_id = t.id) as member_count
//         //     FROM teams t
//         //     JOIN team_members tm ON t.id = tm.team_id
//         //     WHERE tm.user_id = ${userId} AND t.event_id = ${eventId}
//         //     LIMIT 1
//         // `;
// 
//         // if (syncedTeam) {
//         //     return {
//         //         status: true,
//         //         statusCode: 200,
//         //         message: "Registered (Synced via Team)",
//         //         data: {
//         //             registration_status: "registered",
//         //             mode: "team",
//         //             team_id: syncedTeam.id,
//         //             team_name: syncedTeam.name,
//         //             member_count: syncedTeam.member_count
//         //         }
//         //     };
//         // }
// 
//         return {
//             status: true,
//             statusCode: 200,
//             message: "Not registered",
//             data: { registration_status: "not_registered" }
//         };
// 
//     } catch (error) {
//         console.error("Error in getUserEventStatusbyEventId:", error);
//         throw error;
//     }
// }
// 
// // 8. fetch all the registered events by the user
// export async function getRegisteredEventsByUser(userId: string) {
//     try {
//         const data = await sql`
//             SELECT DISTINCT
//                 e.id AS "eventId",
//                 e.name AS "eventName",
//                 e.event_type AS "eventType",
//                 e.participation_type AS "participationType",
//                 e.start_time AS "startTime",
//                 e.venue,
//                 t.name AS "teamName",
//                 CASE 
//                     WHEN er.team_id IS NOT NULL THEN "team"
//                     ELSE "solo"
//                 END AS "registrationMode",
//                 e.registration_start
//             FROM event_registrations er
//             JOIN events e ON er.event_id = e.id
//             LEFT JOIN teams t ON er.team_id = t.id
//             LEFT JOIN team_members tm ON t.id = tm.team_id
//             WHERE er.user_id = ${userId} OR tm.user_id = ${userId}
//             ORDER BY e.start_time ASC
//         `;
// 
//         if (!data || data.length === 0) {
//             return {
//                 status: true,
//                 statusCode: 200,
//                 message: "No registered events found for this user.",
//                 data: []
//             };
//         }
// 
//         return {
//             status: true,
//             statusCode: 200,
//             message: "Registered events fetched successfully",
//             data
//         };
//     } catch (error: any) {
//         console.error("Database Error in getRegisteredEventsByUser:", error);
//         return {
//             status: false,
//             statusCode: 500,
//             message: "Internal server error while fetching events",
//             data: []
//         };
//     }
// }
// 
// // Unregister from event
// export async function unregisterFromEvent(input: {
//     eventId: string;
//     userId: string;
//     participationType: string;
//     teamId?: string | null
// }) {
//     const { eventId, userId, participationType, teamId } = input;
// 
//     try {
//         if (participationType.toLowerCase() === "solo") {
//             const result = await sql`
//                 DELETE FROM event_registrations 
//                 WHERE event_id = ${eventId} 
//                 AND user_id = ${userId} 
//                 AND team_id IS NULL
//                 RETURNING id;
//             `;
// 
//             if (result.length === 0) {
//                 return { status: false, statusCode: 404, message: "Solo registration not found", data: {} };
//             }
// 
//             return { status: true, statusCode: 200, message: "Successfully unregistered from solo event", data: {} };
//         } else {
//             if (!teamId) {
//                 return { status: false, statusCode: 400, message: "Team ID is required for team unregistration", data: {} };
//             }
// 
//             const [team] = await sql`
//                 SELECT name FROM teams 
//                 WHERE id = ${teamId} 
//                 AND leader_id = ${userId} 
//             `;
// 
//             if (!team) {
//                 return {
//                     status: false,
//                     statusCode: 403,
//                     message: "Only the team leader can unregister the team from this event",
//                     data: {}
//                 };
//             }
// 
// 
//             await sql`DELETE FROM event_registrations WHERE event_id = ${eventId} AND team_id = ${teamId};`;
// 
//             return {
//                 status: true,
//                 statusCode: 200,
//                 message: `Team "${team.name}" has been successfully unregistered`,
//                 data: { teamName: team.name }
//             };
//         }
//     } catch (error: any) {
//         console.error("Unregister Error:", error);
//         return { status: false, statusCode: 500, message: error.message || "Unregistration failed", data: {} };
//     }
// }
// 
// export async function getPrizesForEvent(event_id: string) {
// 
//     const prizes = await sql`
//             SELECT id, event_id, position, reward_value 
//             FROM event_prizes 
//             WHERE event_id = ${event_id}
//             ORDER BY position ASC
//         `;
// 
//     return prizes;
// }
