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
    userRegistrationStatus,
    type UserRegistrationStatus,
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
        ORDER BY 
            CASE e.event_type
                WHEN 'flagship' THEN 1
                WHEN 'technical' THEN 2
                WHEN 'non-technical' THEN 3
                ELSE 4
            END,
            e.name ASC;
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

export async function getUserRegisteredEvents(userId: string): Promise<UserRegisteredEvents> {
    const regEvents = await sql`
        SELECT
            e.id,
            e.name,
            e.description,
            e.participation_type,
            e.event_type,
            e.max_allowed,
            e.min_team_size,
            e.max_team_size,
            e.venue,
            e.registration_start,
            e.registration_end,
            e.start_time,
            e.end_time,
            e.created_by,
            e.created_at,
            e.updated_at,

            er.team_id,
            t.name AS team_name,
            CASE
            WHEN er.team_id IS NULL THEN 'solo'
            ELSE 'team'
            END AS mode
        FROM event_registrations er
        JOIN events e ON e.id = er.event_id
        LEFT JOIN teams t ON t.id = er.team_id
        WHERE er.user_id = ${userId}
        ORDER BY 
            CASE e.event_type
                WHEN 'flagship' THEN 1
                WHEN 'technical' THEN 2
                WHEN 'non-technical' THEN 3
                ELSE 4
            END,
            e.event_type,
            e.start_time,
            e.name 
        ;
    `
    const rounds = await getRounds(regEvents.map(regEvent => regEvent.id));

    return userRegisteredEventsSchema
        .parse(
            regEvents
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

// Event Registration Queries 
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

// Team Related Queries 
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

export async function getRegistrationRecordForUser(userId: string, eventId: string) {
    const [result] = await sql`
        SELECT * FROM event_registrations WHERE user_id = ${userId} AND event_id = ${eventId}
    `;
    return result || null;
}

export async function deregisterTeam(teamId: string, eventId: string): Promise<void> {
    await sql`
        DELETE FROM event_registrations 
        WHERE event_id = ${eventId} AND team_id = ${teamId}
    `;
}

export async function deregisterUser(userId: string, eventId: string): Promise<void> {
    await sql`
        DELETE FROM event_registrations 
        WHERE event_id = ${eventId} AND user_id = ${userId} AND team_id IS NULL
    `;
}

export async function isTeamLeader(userId: string, teamId: string): Promise<boolean> {
    const [team] = await sql`
        SELECT 1 FROM teams WHERE id = ${teamId} AND leader_id = ${userId}
    `;
    return !!team;
}

export async function getUserRegStatus(eventId: string, userId: string): Promise<UserRegistrationStatus> {
    const [event] = await sql`
        SELECT 1 FROM events WHERE id = ${eventId};
    `
    if (!event) {
        throw new HTTPException(404, { message: "Event not found" });
    }

    const [eventReg] = await sql`
        SELECT
            er.team_id,
            t.name,
            er.registered_at
        FROM event_registrations er
        LEFT JOIN teams t ON t.id = er.team_id
        WHERE er.user_id = ${userId} AND er.event_id = ${eventId};
    `

    if (!eventReg) {
        return userRegistrationStatus.parse({
            registered: false
        });
    }

    if (eventReg.team_id) {
        return userRegistrationStatus.parse({
            registered: true,
            mode: "team",
            registered_at: eventReg.registered_at,
            team: {
                id: eventReg.team_id,
                name: eventReg.name
            }
        });
    } else {
        return userRegistrationStatus.parse({
            registered: true,
            mode: "solo",
            registered_at: eventReg.registered_at
        });
    }
}
