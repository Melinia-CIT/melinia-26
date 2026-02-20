import { HTTPException } from "hono/http-exception"
import sql from "../connection"
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
    type AssignVolunteersError,
    EventNotFound,
    AssigningUserNotFound,
    PermissionDenied,
    VolunteersNotFound,
    InvalidVolunteerRole,
    VolunteerAlreadyAssigned,
    EmptyVolunteerList,
    type Crew,
    type GetVerboseEvent,
    type GetCrew,
    type UserRegisteredEvents,
    type EventPatch,
    type RoundPatch,
    userRegisteredEventsSchema,
    userRegistrationStatus,
    type UserRegistrationStatus,
    type GetEventRegistration,
    type InternalError,
    getEventRegistrationSchema,
    getEventCheckInSchema,
    type GetEventCheckIn,
    type GetEventCheckInsError,
    type GetEventRegistrationsError,
    type GetEventParticipant,
    type GetEventParticipantsError,
    getEventParticipantSchema
} from "@melinia/shared"
import { Result } from "true-myth";


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
    `

    return baseEventSchema.parse(event)
}

export async function insertPrizes(
    eventId: string,
    data: CreateEventPrizes,
    tx = sql
): Promise<Prize[]> {
    const prizes = await tx`
        INSERT INTO event_prizes (event_id, position, reward_value)
        VALUES ${sql(data.map(prize => [eventId, prize.position, prize.reward_value]))}
        RETURNING *;
    `

    return prizes.map(prize => basePrizeSchema.parse(prize))
}

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
    `

    return crews.map(crew => baseCrewSchema.parse(crew))
}

export async function insertRounds(
    eventId: string,
    data: CreateRounds,
    tx = sql
): Promise<Round[]> {
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
            round.end_time.toISOString(),
        ])
    )}
        RETURNING *;
    `

    return rounds.map(round => baseRoundSchema.parse(round))
}

export async function insertRoundRules(
    eventId: string,
    roundId: number,
    data: CreateRoundRules,
    tx = sql
): Promise<Rule[]> {
    const rules = await tx`
        INSERT INTO round_rules
        (event_id, round_id, rule_no, rule_description)
        VALUES ${sql(data.map(rule => [eventId, roundId, rule.rule_no, rule.rule_description]))}
        RETURNING *;
    `

    return rules.map(rule => baseRoundRulesSchema.parse(rule))
}

export async function createEvent(userId: string, data: CreateEvent): Promise<VerboseEvent> {
    const result = await sql.begin(async tx => {
        const event = await insertEvent(userId, data, tx)
        const prizes = data.prizes?.length ? await insertPrizes(event.id, data.prizes, tx) : []

        const rounds = data.rounds?.length
            ? await Promise.all(
                data.rounds.map(async roundData => {
                    const { rules, ...round } = roundData

                    const [insertedRound] = await insertRounds(event.id, [round], tx)

                    const insertedRules =
                        insertedRound && rules?.length
                            ? await insertRoundRules(event.id, insertedRound.id, rules, tx)
                            : []

                    return {
                        ...insertedRound,
                        rules: insertedRules,
                    }
                })
            )
            : []

        const organizers = data?.crew?.organizers?.length
            ? await insertCrew(event.id, userId, data.crew?.organizers, "ORGANIZER", tx)
            : []

        const volunteers = data?.crew?.volunteers?.length
            ? await insertCrew(event.id, userId, data?.crew?.volunteers, "VOLUNTEER", tx)
            : []

        return {
            ...event,
            rounds,
            prizes,
            crew: {
                organizers,
                volunteers,
            },
        }
    })

    return verboseEventSchema.parse(result)
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

    return events.map(event => baseEventSchema.parse(event))
}

export async function getPrizes(eventIds: string[]): Promise<Prize[]> {
    if (eventIds.length === 0) {
        return []
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

    return prizes.map(pz => basePrizeSchema.parse(pz))
}

export async function getRounds(eventIds: string[]): Promise<Round[]> {
    if (eventIds.length === 0) {
        return []
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

    return rounds.map(round => baseRoundSchema.parse(round))
}

export async function getRoundRules(roundIds: number[]): Promise<Rule[]> {
    if (roundIds.length === 0) {
        return []
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

    return rules.map(rule => baseRoundRulesSchema.parse(rule))
}

export async function getOrganizers(eventIds: string[]): Promise<GetCrew[]> {
    if (eventIds.length === 0) {
        return []
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
    `

    return organizers.map(og => getCrewSchema.parse(og))
}

export async function getVolunteers(eventIds: string[]): Promise<GetCrew[]> {
    if (eventIds.length === 0) {
        return []
    }

    const volunteers = await sql`
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
        WHERE ec.event_id = ANY(${eventIds}) AND u.role = 'VOLUNTEER'
        ORDER BY ec.event_id;
    `

    return volunteers.map(og => getCrewSchema.parse(og))
}

export async function assignVolunteersToEvent(
    eventId: string,
    volunteerIds: string[],
    assignedBy: string,
    tx = sql
): Promise<Result<Crew[], AssignVolunteersError>> {
    try {
        const [event] = await tx`SELECT 1 FROM events WHERE id = ${eventId}`
        if (!event) {
            return Result.err({ code: "event_not_found", message: "Event not found" })
        }

        const [userRole] = await tx`SELECT role FROM users WHERE id = ${assignedBy}`
        if (!userRole) {
            return Result.err({ code: "assigning_user_not_found", message: "Assigning user not found" })
        }

        if (userRole.role !== "ADMIN") {
            const [organizerCheck] = await tx`
                SELECT 1 FROM event_crews 
                WHERE event_id = ${eventId} 
                AND user_id = ${assignedBy}`
            if (!organizerCheck) {
                return Result.err({ code: "permission_denied", message: "Only admin or organizer of the respective event can assign volunteers" })
            }
        }

        if (!volunteerIds || volunteerIds.length === 0) {
            return Result.err({ code: "empty_volunteer_list", message: "No volunteers provided" })
        }

        const users = await tx`
            SELECT id, role FROM users 
            WHERE id = ANY(${volunteerIds}::text[])`
        const foundIds = users.map(u => u.id)
        const notFoundIds = volunteerIds.filter(id => !foundIds.includes(id))
        if (notFoundIds.length > 0) {
            return Result.err({ code: "volunteers_not_found", message: `These user IDs do not exist: ${notFoundIds.join(", ")}` })
        }

        const invalidRoleIds = users.filter(u => u.role !== "VOLUNTEER").map(u => u.id)
        if (invalidRoleIds.length > 0) {
            return Result.err({ code: "invalid_volunteer_role", message: `These users are not volunteers: ${invalidRoleIds.join(", ")}` })
        }

        const existingAssignments = await tx`
            SELECT user_id FROM event_crews
            WHERE event_id = ${eventId} AND user_id = ANY(${volunteerIds}::text[])`
        const alreadyAssignedIds = existingAssignments.map(e => e.user_id)
        if (alreadyAssignedIds.length > 0) {
            return Result.err({ code: "volunteer_already_assigned", message: `Cannot assign same volunteer again: ${alreadyAssignedIds.join(", ")}` })
        }

        const crews = await tx`
            INSERT INTO event_crews (event_id, user_id, assigned_by)
            VALUES ${sql(volunteerIds.map(id => [eventId, id, assignedBy]))}
            RETURNING *`
        
        const parsedCrews = crews.map(crew => baseCrewSchema.parse(crew))
        return Result.ok(parsedCrews)
    } catch (err) {
        console.error(err)
        return Result.err({ code: "internal_error", message: "Failed to assign volunteers" })
    }
}

export async function getEvents(): Promise<GetVerboseEvent[]> {
    const events = await listEvents()

    if (events.length === 0) {
        return []
    }

    const eventIds = events.map(event => event.id)
    const prizes = await getPrizes(eventIds)
    const rounds = await getRounds(eventIds)

    const roundIds = rounds.map(rnd => rnd.id)
    const rules = roundIds.length ? await getRoundRules(roundIds) : []

    const organizers = await getOrganizers(eventIds)

    const verboseEvents = events.map(event => {
        const eventRounds = rounds
            .filter(round => round.event_id === event.id)
            .map(round => {
                const roundRules = rules.filter(rule => rule.round_id === round.id)
                return {
                    ...round,
                    rules: roundRules,
                }
            })

        return {
            ...event,
            rounds: eventRounds,
            prizes: prizes.filter(prize => prize.event_id === event.id),
            crew: {
                organizers: organizers.filter(og => og.event_id === event.id),
            },
        }
    })

    return verboseEvents.map(ve => {
        return getVerboseEventResponseSchema.parse(ve)
    })
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
        throw new HTTPException(404, { message: "Event not found" })
    }

    const [prizes, rounds, organizers, volunteers] = await Promise.all([
        getPrizes([eventId]),
        getRounds([eventId]),
        getOrganizers([eventId]),
        getVolunteers([eventId])
    ])

    const roundIds = rounds.map(rnd => rnd.id)
    const rules = roundIds.length ? await getRoundRules(roundIds) : []

    const eventRounds = rounds
        .filter(round => round.event_id === eventId)
        .map(round => {
            const roundRules = rules.filter(rule => rule.round_id === round.id)
            return {
                ...round,
                rules: roundRules,
            }
        })

    const verboseEvent = {
        ...event,
        rounds: eventRounds,
        prizes: prizes.filter(prize => prize.event_id === eventId),
        crew: {
            organizers: organizers.filter(og => og.event_id === eventId),
            volunteers: volunteers.filter(og => og.event_id === eventId)
        },
    }

    return getVerboseEventResponseSchema.parse(verboseEvent)
}

export async function deleteEvent(eventId: string): Promise<Event> {
    const [deletedEvent] = await sql`
        DELETE FROM events
        WHERE id = ${eventId}
        RETURNING *;
    `

    if (!deletedEvent) {
        throw new HTTPException(404, { message: "Event not found" })
    }

    return baseEventSchema.parse(deletedEvent)
}

export async function getUserRegisteredEvents(userId: string, userRole: string): Promise<UserRegisteredEvents> {
    if (userRole === 'PARTICIPANT') {
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

                /* registration object */
                CASE
                    WHEN er.team_id IS NULL THEN
                        jsonb_build_object(
                            'mode', 'solo',
                            'registered_at', er.registered_at
                        )
                    ELSE
                        jsonb_build_object(
                            'mode', 'team',
                            'registered_at', er.registered_at,
                            'team', jsonb_build_object(
                                'id', t.id,
                                'name', t.name
                            )
                        )
                END AS registration,

                /* rounds array */
                COALESCE(
                    jsonb_agg(
                        DISTINCT jsonb_build_object(
                            'id', r.id,
                            'round_name', r.round_name,
                            'start_time', r.start_time,
                            'end_time', r.end_time,
                            'created_at', r.created_at,
                            'updated_at', r.updated_at
                        )
                    ) FILTER (WHERE r.id IS NOT NULL),
                    '[]'::jsonb
                ) AS rounds

            FROM event_registrations er
            JOIN events e ON e.id = er.event_id
            LEFT JOIN teams t ON t.id = er.team_id
            LEFT JOIN event_rounds r ON r.event_id = e.id

            WHERE er.user_id = ${userId}

            GROUP BY
                e.id,
                er.id,
                t.id

            ORDER BY 
                CASE e.event_type
                    WHEN 'flagship' THEN 1
                    WHEN 'technical' THEN 2
                    WHEN 'non-technical' THEN 3
                    ELSE 4
                END,
                e.start_time,
                e.name;
        `
        const rounds = await getRounds(regEvents.map(regEvent => regEvent.id))

        return userRegisteredEventsSchema.parse(
            regEvents.map(event => {
                return {
                    ...event,
                    rounds: rounds.filter(round => round.event_id == event.id),
                }
            })
        )
    } else {
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
                e.end_time
            FROM events e
            JOIN event_crews ec ON ec.event_id = e.id
            WHERE ec.user_id = ${userId};
        `

        return userRegisteredEventsSchema.parse(regEvents);
    }
}

export async function checkEventExists(eventId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM events WHERE id = ${eventId}
    `
    return result.length > 0
}

// Event Registration Queries
export async function isUserRegisteredAlready(eventId: string, userId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM event_registrations 
        WHERE event_id = ${eventId} AND user_id = ${userId}
    `
    return result.length > 0
}

export async function isTeamRegisteredAlready(eventId: string, teamId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM event_registrations 
        WHERE event_id = ${eventId} AND team_id = ${teamId}
    `
    return result.length > 0
}

export async function getEventRegistrationCount(eventId: string): Promise<number> {
    const [result] = await sql<[{ count: number }]>`
        SELECT COUNT(*) as count FROM event_registrations 
        WHERE event_id = ${eventId}
    `
    return result.count
}
export async function getEventTeamRegistrationCount(eventId: string): Promise<number> {
    const [result] = await sql<[{ count: number }]>`
        SELECT COUNT(DISTINCT team_id) as count FROM event_registrations 
        WHERE event_id = ${eventId} AND team_id IS NOT NULL
    `
    return result.count
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
    `
    return conflicts
}

export async function insertSoloRegistration(eventId: string, userId: string) {
    const [result] = await sql`
        INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
        VALUES (${eventId}, NULL, ${userId}, NOW())
        RETURNING id, event_id, team_id, user_id, registered_at
    `
    return result
}

export async function insertTeamRegistration(eventId: string, teamId: string, userId: string) {
    const [result] = await sql`
        INSERT INTO event_registrations (event_id, team_id, user_id, registered_at)
        VALUES (${eventId}, ${teamId}, ${userId}, NOW())
        RETURNING id, event_id, team_id, user_id, registered_at
    `
    return result
}

// Team Related Queries
export async function getTeamLeaderId(teamId: string): Promise<string | null> {
    const [team] = await sql`
        SELECT leader_id FROM teams WHERE id = ${teamId}
    `
    return team?.leader_id || null
}

export async function getTeamMemberIds(teamId: string): Promise<string[]> {
    const members = await sql<{ user_id: string }[]>`
        SELECT user_id FROM team_members WHERE team_id = ${teamId}
    `
    return members.map(m => m.user_id)
}

export async function getTeamMemberCount(teamId: string): Promise<number> {
    const [result] = await sql<[{ count: number }]>`
        SELECT COUNT(*) as count FROM team_members WHERE team_id = ${teamId}
    `
    return result.count
}

export async function getRegistrationRecordForUser(userId: string, eventId: string) {
    const [result] = await sql`
        SELECT * FROM event_registrations WHERE user_id = ${userId} AND event_id = ${eventId}
    `
    return result || null
}

export async function deregisterTeam(teamId: string, eventId: string): Promise<void> {
    await sql`
        DELETE FROM event_registrations 
        WHERE event_id = ${eventId} AND team_id = ${teamId}
    `
}

export async function deregisterUser(userId: string, eventId: string): Promise<void> {
    await sql`
        DELETE FROM event_registrations 
        WHERE event_id = ${eventId} AND user_id = ${userId} AND team_id IS NULL
    `
}

export async function getUserRegStatus(
    eventId: string,
    userId: string
): Promise<UserRegistrationStatus> {
    const [event] = await sql`
        SELECT 1 FROM events WHERE id = ${eventId};
    `
    if (!event) {
        throw new HTTPException(404, { message: "Event not found" })
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
            registered: false,
        })
    }

    if (eventReg.team_id) {
        return userRegistrationStatus.parse({
            registered: true,
            mode: "team",
            registered_at: eventReg.registered_at,
            team: {
                id: eventReg.team_id,
                name: eventReg.name,
            },
        })
    } else {
        return userRegistrationStatus.parse({
            registered: true,
            mode: "solo",
            registered_at: eventReg.registered_at,
        })
    }
}

// ... existing imports

export async function updateEvent(eventId: string, updates: EventPatch, tx = sql): Promise<Event> {
    // Check if event exists
    const [eventCheck] = await tx`
        SELECT 1 FROM events WHERE id = ${eventId}
    `
    if (!eventCheck) {
        throw new HTTPException(404, { message: "Event not found" })
    }

    // Get current event data for comprehensive validation
    const [currentEvent] = await tx`
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
        WHERE e.id = ${eventId}
    `

    if (!currentEvent) {
        throw new HTTPException(404, { message: "Event not found" })
    }

    // Validate timing constraints with current event data
    if (
        updates.registration_start !== undefined ||
        updates.registration_end !== undefined ||
        updates.start_time !== undefined ||
        updates.end_time !== undefined
    ) {
        const regStart = updates.registration_start || currentEvent.registration_start
        const regEnd = updates.registration_end || currentEvent.registration_end
        const start = updates.start_time || currentEvent.start_time
        const end = updates.end_time || currentEvent.end_time

        // Validate registration window constraints
        if (regEnd > start) {
            throw new HTTPException(400, {
                message: "Registration end must be before or equal to event start time",
            })
        }

        if (regEnd <= regStart) {
            throw new HTTPException(400, {
                message: "Registration end must be after registration start",
            })
        }

        if (end <= start) {
            throw new HTTPException(400, {
                message: "Event end time must be after start time",
            })
        }

        // Check if we're trying to modify timing for events that have registrations
        const now = new Date()
        if (
            regStart < now &&
            (updates.registration_start !== undefined || updates.registration_end !== undefined)
        ) {
            throw new HTTPException(409, {
                message:
                    "Cannot modify registration timing for events where registration has already started",
            })
        }
    }

    // Validate team size constraints
    if (updates.min_team_size !== undefined || updates.max_team_size !== undefined) {
        const minSize = updates.min_team_size || currentEvent.min_team_size
        const maxSize = updates.max_team_size || currentEvent.max_team_size

        if (maxSize < minSize) {
            throw new HTTPException(400, {
                message: "Maximum team size must be greater than or equal to minimum team size",
            })
        }

        // Validate participation type consistency
        if (
            currentEvent.participation_type === "solo" &&
            (updates.min_team_size !== undefined || updates.max_team_size !== undefined)
        ) {
            if (minSize !== 1 || maxSize !== 1) {
                throw new HTTPException(400, {
                    message: "Solo events must have min_team_size and max_team_size set to 1",
                })
            }
        }
    }

    // Validate participation type changes
    if (
        updates.participation_type !== undefined &&
        updates.participation_type !== currentEvent.participation_type
    ) {
        // Check if event already has registrations
        // In a real implementation, this would query the database
        throw new HTTPException(409, {
            message: "Cannot change participation type for events with existing registrations",
        })
    }

    // 1. Build a clean object with only the fields that are defined
    const updateData: any = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.participation_type !== undefined)
        updateData.participation_type = updates.participation_type
    if (updates.event_type !== undefined) updateData.event_type = updates.event_type
    if (updates.max_allowed !== undefined) updateData.max_allowed = updates.max_allowed
    if (updates.min_team_size !== undefined) updateData.min_team_size = updates.min_team_size
    if (updates.max_team_size !== undefined) updateData.max_team_size = updates.max_team_size
    if (updates.venue !== undefined) updateData.venue = updates.venue
    if (updates.registration_start !== undefined)
        updateData.registration_start = updates.registration_start
    if (updates.registration_end !== undefined)
        updateData.registration_end = updates.registration_end
    if (updates.start_time !== undefined) updateData.start_time = updates.start_time
    if (updates.end_time !== undefined) updateData.end_time = updates.end_time

    // 2. Handle case where no fields are provided
    if (Object.keys(updateData).length === 0) {
        // If no updates, just return the existing event
        return baseEventSchema.parse(currentEvent)
    }

    // 3. Execute Update
    // postgres.js automatically converts ${updateData} into "col1 = $1, col2 = $2..."
    const [updatedEvent] = await tx`
        UPDATE events
        SET ${tx(updateData)}
        WHERE id = ${eventId}
        RETURNING *;
    `

    if (!updatedEvent) {
        throw new HTTPException(404, { message: "Event not found" })
    }

    return baseEventSchema.parse(updatedEvent)
}

export async function updateEventRound(
    eventId: string,
    roundNo: number,
    updates: RoundPatch,
    tx = sql
): Promise<Round> {
    const updateData: any = {}

    if (updates.round_no !== undefined) updateData.round_no = updates.round_no
    if (updates.round_name !== undefined) updateData.round_name = updates.round_name
    if (updates.round_description !== undefined)
        updateData.round_description = updates.round_description
    if (updates.start_time !== undefined) updateData.start_time = updates.start_time
    if (updates.end_time !== undefined) updateData.end_time = updates.end_time

    if (Object.keys(updateData).length === 0) {
        const [round] = await tx`
            SELECT * FROM event_rounds WHERE round_no = ${roundNo} AND event_id = ${eventId} 
        `
        if (!round) {
            throw new HTTPException(404, { message: "Round not found" })
        }
        return baseRoundSchema.parse(round)
    }

    const [updatedRound] = await tx`
        UPDATE event_rounds
        SET ${tx(updateData)}
        WHERE round_no = ${roundNo} AND event_id = ${eventId}
        RETURNING *;
    `

    if (!updatedRound) {
        throw new HTTPException(404, { message: "Round not found" })
    }

    return baseRoundSchema.parse(updatedRound)
}

export async function updateEventPrize(
    event_id: string,
    position: number,
    updates: Partial<Prize>,
    tx = sql
): Promise<Prize> {
    const updateData: any = {}

    if (updates.position !== undefined) updateData.position = updates.position
    if (updates.reward_value !== undefined) updateData.reward_value = updates.reward_value

    if (Object.keys(updateData).length === 0) {
        const [prize] = await tx`
            SELECT * FROM event_prizes WHERE position = ${position} AND event_id = ${event_id}
        `
        if (!prize) {
            throw new HTTPException(404, { message: "Prize not found" })
        }
        return basePrizeSchema.parse(prize)
    }

    const [updatedPrize] = await tx`
        UPDATE event_prizes
        SET ${tx(updateData)}
        WHERE position = ${position} AND event_id = ${event_id}
        RETURNING *;
    `

    if (!updatedPrize) {
        throw new HTTPException(404, { message: "Prize not found" })
    }

    return basePrizeSchema.parse(updatedPrize)
}

export async function getEventRegistrations(
    eventId: string, from: number, limit: number
): Promise<Result<GetEventRegistration[], GetEventRegistrationsError>> {
    try {
        const [row] = await sql`
            SELECT 1
            FROM events e
            WHERE e.id = ${eventId}; 
        `

        if (!row) {
            console.error("Event not found. Invalid event_id provided.")
            return Result.err({
                "code": "event_not_found",
                "message": "Invalid event id"
            })
        }

        const rows = await sql`
            WITH base AS (
                SELECT
                    er.team_id,
                    er.user_id,
                    er.registered_at,
                    p.first_name,
                    p.last_name,
                    u.ph_no,
                    u.email,
                    c.name AS college,
                    d.name AS degree,
                    t.name AS team_name
                FROM event_registrations er
                JOIN users u        ON u.id = er.user_id
                JOIN profile p      ON p.user_id = u.id
                JOIN colleges c     ON c.id = p.college_id
                JOIN degrees d      ON d.id = p.degree_id
                LEFT JOIN teams t   ON t.id = er.team_id
                WHERE er.event_id = ${eventId}
            )
            SELECT
                team_id AS id,
                'TEAM' AS type,
                team_name AS name,
                NULL AS first_name,
                NULL AS last_name,
                NULL AS college,
                NULL AS degree,
                NULL AS ph_no,
                NULL AS email,
                json_agg(json_build_object(
                    'participant_id', user_id,
                    'first_name',     first_name,
                    'last_name',      last_name,
                    'college',        college,
                    'degree',         degree,
                    'ph_no',          ph_no,
                    'email',          email
                )) AS members,
                MIN(registered_at) AS registered_at
            FROM base
            WHERE team_id IS NOT NULL
            GROUP BY team_id, team_name

            UNION ALL

            SELECT
                user_id AS id,
                'SOLO' AS type,
                NULL AS name,
                first_name,
                last_name,
                college,
                degree,
                ph_no,
                email,
                NULL AS members,
                registered_at
            FROM base
            WHERE team_id IS NULL

            ORDER BY registered_at DESC
            OFFSET ${from}
            LIMIT ${limit}
        `;

        const eventRegistrations = rows.map(row => {
            if (row.type === "SOLO") {
                return getEventRegistrationSchema.parse({
                    type: "SOLO",
                    participant_id: row.id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    college: row.college,
                    degree: row.degree,
                    registered_at: row.registered_at,
                    ph_no: row.ph_no,
                    email: row.email
                });
            } else {
                return getEventRegistrationSchema.parse({
                    type: "TEAM",
                    name: row.name,
                    members: row.members,
                    registered_at: row.registered_at,
                });
            }
        });

        return Result.ok(eventRegistrations);
    } catch (err) {
        console.error(err);
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch the registrations"
        })
    }
}

export async function getEventRegCount(
    eventId: string
): Promise<Result<number, InternalError>> {
    try {
        const [row] = await sql`
            SELECT COUNT(DISTINCT COALESCE(er.team_id, er.user_id))
            FROM event_registrations er
            WHERE event_id = ${eventId}
        `;

        return Result.ok(parseInt(row?.count ?? "0"))
    } catch (err) {
        console.error(`Failed to get event registration count ${err}`);
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch event registartions"
        })
    }
}

export async function getEventCheckIns(
    eventId: string, roundNo: number, from: number, limit: number
): Promise<Result<GetEventCheckIn[], GetEventCheckInsError>> {
    try {
        const [row] = await sql`
            SELECT 1
            FROM events e
            JOIN event_rounds er ON er.event_id = e.id
            WHERE e.id = ${eventId} AND er.round_no = ${roundNo};
        `;

        if (!row) {
            console.error("Event or Round not found. Invalid event_id or round_id provided.")
            return Result.err({
                "code": "event_or_round_not_found",
                "message": "Invalid Event or Round"
            });
        }

        const rows = await sql`
            WITH base AS (
                SELECT
                    erc.team_id,
                    erc.user_id,
                    erc.checkedin_at,
                    erc.checkedin_by,
                    p.first_name,
                    p.last_name,
                    c.name AS college,
                    d.name AS degree,
                    t.name AS team_name,
                    u.ph_no,
                    u.email
                FROM event_round_checkins erc
                JOIN users u        ON u.id = erc.user_id
                JOIN profile p      ON p.user_id = u.id
                JOIN colleges c     ON c.id = p.college_id
                JOIN degrees d      ON d.id = p.degree_id
                JOIN event_rounds r ON r.id = erc.round_id
                LEFT JOIN teams t   ON t.id = erc.team_id
                WHERE
                    r.event_id = ${eventId} AND
                    r.round_no = ${roundNo}
            )
            SELECT
                team_id AS id,
                'TEAM' AS type,
                team_name AS name,
                NULL AS first_name,
                NULL AS last_name,
                NULL AS college,
                NULL AS degree,
                NULL AS ph_no,
                NULL AS email,
                json_agg(json_build_object(
                    'participant_id', user_id,
                    'first_name',     first_name,
                    'last_name',      last_name,
                    'college',        college,
                    'degree',         degree,
                    'ph_no',          ph_no,
                    'email',          email
                )) AS members,
                MIN(checkedin_at) AS checkedin_at,
                MIN(checkedin_by) AS checkedin_by
            FROM base
            WHERE team_id IS NOT NULL
            GROUP BY team_id, team_name
            UNION ALL
            SELECT
                user_id AS id,
                'SOLO' AS type,
                NULL AS name,
                first_name,
                last_name,
                college,
                degree,
                ph_no,
                email,
                NULL AS members,
                checkedin_at,
                checkedin_by
            FROM base
            WHERE team_id IS NULL
            ORDER BY checkedin_at DESC
            OFFSET ${from}
            LIMIT ${limit}
        `;

        const eventCheckIns = rows.map(row => {
            if (row.type === "SOLO") {
                return getEventCheckInSchema.parse({
                    type: "SOLO",
                    participant_id: row.id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    college: row.college,
                    degree: row.degree,
                    ph_no: row.ph_no,
                    email: row.email,
                    checkedin_at: row.checkedin_at,
                    checkedin_by: row.checkedin_by
                });
            } else {
                return getEventCheckInSchema.parse({
                    type: "TEAM",
                    name: row.name,
                    members: row.members,
                    checkedin_at: row.checkedin_at,
                    checkedin_by: row.checkedin_by
                });
            }
        });

        return Result.ok(eventCheckIns);
    } catch (err) {
        console.error(err);
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch the registrations"
        });
    }
}

export async function getEventCheckInsCount(
    eventId: string, roundId: number
): Promise<Result<number, InternalError>> {
    try {
        const [row] = await sql`
            SELECT COUNT(DISTINCT COALESCE(erc.team_id, erc.user_id))
            FROM event_round_checkins erc
            JOIN event_rounds r ON r.id = erc.round_id
            WHERE r.event_id = ${eventId} AND erc.round_id = ${roundId}
        `;
        return Result.ok(parseInt(row?.count ?? "0"));
    } catch (err) {
        console.error(`Failed to get event checkins count ${err}`);
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch event checkins count"
        });
    }
}

export async function getEventParticipants(
    eventId: string, roundNo: number, from: number, limit: number
): Promise<Result<GetEventParticipant[], GetEventParticipantsError>> {
    try {
        const rounds = await sql`
            SELECT id, round_no FROM event_rounds
            WHERE event_id = ${eventId} AND round_no IN (${roundNo}, ${roundNo - 1})
        `;

        const currentRound = rounds.find(r => r.round_no === roundNo);
        const prevRound = rounds.find(r => r.round_no === roundNo - 1);

        if (!currentRound) {
            return Result.err({ code: "event_or_round_not_found", message: "Invalid Event or Round" });
        }
        if (roundNo > 1 && !prevRound) {
            return Result.err({ code: "event_or_round_not_found", message: "Previous round not found" });
        }


        const PARTICIPANT_UNION = (from: number, limit: number) => sql`
            SELECT 
                team_id AS id, 
                'TEAM' AS type, 
                team_name AS name,
                NULL AS first_name, 
                NULL AS last_name, 
                NULL AS college, 
                NULL AS degree, 
                NULL AS ph_no, 
                NULL AS email,
                json_agg(
                    json_build_object(
                        'participant_id', user_id,
                        'first_name', first_name,
                        'last_name', last_name,
                        'college', college,
                        'degree', degree,
                        'ph_no', ph_no,
                        'email', email
                    )
                ) AS members,
                MIN(sort_at) AS sort_at
            FROM base 
            WHERE team_id IS NOT NULL
            GROUP BY team_id, team_name

            UNION ALL

            SELECT 
                user_id AS id, 
                'SOLO' AS type, 
                NULL AS name,
                first_name, 
                last_name, 
                college, 
                degree, 
                ph_no, 
                email, 
                NULL AS members, 
                sort_at
            FROM base 
            WHERE team_id IS NULL

            ORDER BY sort_at DESC
            OFFSET ${from} LIMIT ${limit}
        `;

        function parseParticipantRow(row: any): GetEventParticipant {
            if (row.type === "SOLO") {
                return getEventParticipantSchema.parse({
                    type: "SOLO",
                    participant_id: row.id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    college: row.college,
                    degree: row.degree,
                    ph_no: row.ph_no,
                    email: row.email,
                    registered_at: row.sort_at,
                });
            }
            return getEventParticipantSchema.parse({
                type: "TEAM",
                team_id: row.id,
                name: row.name,
                members: row.members,
                registered_at: row.sort_at,
            });
        }

        if (roundNo === 1) {
            const rows = await sql`
                WITH base AS (
                    SELECT
                        er.team_id,
                        er.user_id,
                        er.registered_at AS sort_at,
                        p.first_name,
                        p.last_name,
                        c.name AS college,
                        d.name AS degree,
                        t.name AS team_name, 
                        u.ph_no,
                        u.email
                    FROM event_registrations er
                    JOIN users u      ON u.id = er.user_id
                    JOIN profile p    ON p.user_id = u.id
                    JOIN colleges c   ON c.id = p.college_id
                    JOIN degrees d    ON d.id = p.degree_id
                    LEFT JOIN teams t ON t.id = er.team_id
                    WHERE er.event_id = ${eventId}
                )
                ${PARTICIPANT_UNION(from, limit)}
            `;
            return Result.ok(rows.map(parseParticipantRow));
        }

        const rows = await sql`
            WITH base AS (
                SELECT rr.team_id, rr.user_id, rr.eval_at AS sort_at,
                       p.first_name, p.last_name,
                       c.name AS college, d.name AS degree, t.name AS team_name, u.ph_no, u.email
                FROM round_results rr
                JOIN users u      ON u.id = rr.user_id
                JOIN profile p    ON p.user_id = u.id
                JOIN colleges c   ON c.id = p.college_id
                JOIN degrees d    ON d.id = p.degree_id
                LEFT JOIN teams t ON t.id = rr.team_id
                WHERE rr.round_id = ${prevRound!.id}
                  AND rr.status = 'QUALIFIED'
            )
            ${PARTICIPANT_UNION(from, limit)}
        `;
        return Result.ok(rows.map(parseParticipantRow));

    } catch (err) {
        console.error(`Failed to get event participants: ${err}`);
        return Result.err({ code: "internal_error", message: "Failed to fetch participants" });
    }
}

export async function getEventParticipantsCount(
    eventId: string, roundNo: number
): Promise<Result<number, GetEventParticipantsError>> {
    try {
        const rounds = await sql`
            SELECT id, round_no FROM event_rounds
            WHERE event_id = ${eventId} AND round_no IN (${roundNo}, ${roundNo - 1})
        `;

        const currentRound = rounds.find(r => r.round_no === roundNo);
        const prevRound = rounds.find(r => r.round_no === roundNo - 1);

        if (!currentRound) {
            return Result.err({ code: "event_or_round_not_found", message: "Invalid Event or Round" });
        }
        if (roundNo > 1 && !prevRound) {
            return Result.err({ code: "event_or_round_not_found", message: "Previous round not found" });
        }

        if (roundNo === 1) {
            const [row] = await sql`
                SELECT COUNT(DISTINCT COALESCE(er.team_id, er.user_id)) AS count
                FROM event_registrations er
                WHERE er.event_id = ${eventId}
            `;
            return Result.ok(parseInt(row?.count ?? "0"));
        }

        const [row] = await sql`
            SELECT COUNT(DISTINCT COALESCE(rr.team_id, rr.user_id)) AS count
            FROM round_results rr
            WHERE rr.round_id = ${prevRound!.id}
              AND rr.status = 'QUALIFIED'
        `;
        return Result.ok(parseInt(row?.count ?? "0"));

    } catch (err) {
        console.error(`Failed to get event participant count: ${err}`);
        return Result.err({ code: "internal_error", message: "Failed to fetch participant count" });
    }
}
