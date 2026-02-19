import { Result } from "true-myth"
import {
    type CheckIn,
    type CheckInError,
    baseCheckInSchema,
    type RoundResult,
    type BulkOperationResult,
    type AssignResultsError,
    DEFAULT_POINTS,
    WINNER_POINTS,
    type EventRoundCheckInInput,
    type EventRoundCheckIn,
    type RoundCheckInError,
    baseEventRoundCheckInSchema,
    type UserResultError,
    type TeamResultError,
    type PrizeAssignment,
    type BulkPrizeResult,
    type AssignPrizesError,
} from "@melinia/shared"
import sql from "../connection"
import postgres from "postgres"

export async function checkInParticipant(
    participantId: string,
    checkInBy: string
): Promise<Result<CheckIn, CheckInError>> {
    try {
        const [user] = await sql`
            SELECT 1, payment_status FROM users WHERE id = ${participantId} AND role = 'PARTICIPANT';
        `
        if (!user) {
            return Result.err({
                code: "user_not_found",
                message: "Participant doesn't exist",
            })
        }

        if (user.payment_status === "UNPAID") {
            return Result.err({
                code: "payment_pending",
                message: "Participant payment pending",
            })
        }

        const [checkIn] = await sql`
            INSERT INTO check_ins (
                participant_id,
                checkedin_by
            ) VALUES (
                ${participantId},
                ${checkInBy}
            )
            RETURNING *;
        `

        if (!checkIn) {
            return Result.err({
                code: "internal_error",
                message: "Failed to checkin participant",
            })
        }
        return Result.ok(baseCheckInSchema.parse(checkIn))
    } catch (err) {
        console.error(err)

        if (err instanceof postgres.PostgresError) {
            const constraint = err?.constraint_name
            if (constraint) {
                switch (constraint) {
                    case "check_ins_participant_id_key":
                        return Result.err({
                            code: "already_checked_in",
                            message: "Participant already checked in",
                        })
                }
            }
        }

        return Result.err({
            code: "internal_error",
            message: "Failed to checkin",
        })
    }
}

/**
 * Check in participant to a specific event round
 */
export async function checkInParticipantToRound(
    eventId: string,
    roundNo: number,
    data: EventRoundCheckInInput,
    checkInBy: string
): Promise<Result<EventRoundCheckIn, RoundCheckInError>> {
    try {
        // Get round ID
        const [round] = await sql`
            SELECT id 
            FROM event_rounds 
            WHERE event_id = ${eventId} AND round_no = ${roundNo}
        `

        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: `Round ${roundNo} not found for event ${eventId}`,
            })
        }

        const roundId = round.id

        // Check if user is registered for the event
        const [registration] = await sql`
            SELECT er.id 
            FROM event_registrations er
            WHERE er.event_id = ${eventId} 
            AND er.user_id = ${data.user_id}
            ${data.team_id ? sql`AND er.team_id = ${data.team_id}` : sql``}
        `

        if (!registration) {
            return Result.err({
                code: "user_not_registered",
                message: `User not registered for event ${eventId}`,
            })
        }

        // Check if user has global check-in
        const [globalCheckIn] = await sql`
            SELECT 1 FROM check_ins 
            WHERE participant_id = ${data.user_id}
        `

        if (!globalCheckIn) {
            return Result.err({
                code: "not_checked_in_globally",
                message: "Participant must complete global check-in first",
            })
        }

        // Insert event round check-in
        const [checkIn] = await sql`
            INSERT INTO event_round_checkins (
                user_id,
                round_id,
                team_id,
                checkedin_by
            ) VALUES (
                ${data.user_id},
                ${roundId},
                ${data.team_id || null},
                ${checkInBy}
            )
            RETURNING *;
        `

        if (!checkIn) {
            return Result.err({
                code: "internal_error",
                message: "Failed to check in participant to round",
            })
        }

        return Result.ok(baseEventRoundCheckInSchema.parse(checkIn))
    } catch (err) {
        console.error(err)

        if (err instanceof postgres.PostgresError) {
            const constraint = err?.constraint_name
            if (constraint) {
                switch (constraint) {
                    case "event_round_checkins_user_id_round_id_key":
                        return Result.err({
                            code: "already_checked_in",
                            message: "Participant already checked in to this round",
                        })
                }
            }
        }

        return Result.err({
            code: "internal_error",
            message: "Failed to check in to round",
        })
    }
}

/**
 * Assign round results (points and status) for participants
 */
export async function assignRoundResults(
    eventId: string,
    roundNo: number,
    results: RoundResult[],
    evalBy: string
): Promise<Result<BulkOperationResult, AssignResultsError>> {
    try {
        // Get round ID
        const [round] = await sql`
            SELECT id 
            FROM event_rounds 
            WHERE event_id = ${eventId} AND round_no = ${roundNo}
        `

        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: `Round ${roundNo} not found for event ${eventId}`,
            })
        }

        const roundId = round.id
        const recordedResults: Array<any> = []
        const userErrors: Array<UserResultError> = []
        const teamErrors: Array<TeamResultError> = []

        // Process each result
        for (const result of results) {
            try {
                // Apply default points if not provided
                const finalPoints =
                    result.points !== undefined ? result.points : DEFAULT_POINTS[result.status]

                // Determine if this is team-based or individual assignment
                const isTeamAssignment = !result.user_id && result.team_id

                // Get list of users to assign points to
                let usersToProcess: Array<{ user_id: string; team_id: string | null }> = []

                if (isTeamAssignment) {
                    // Team-based assignment: get all team members
                    const teamMembers = await sql`
                        SELECT tm.user_id, ${result.team_id} as team_id
                        FROM team_members tm
                        WHERE tm.team_id = ${result.team_id}
                    `

                    if (teamMembers.length === 0) {
                        teamErrors.push({
                            team_id: result.team_id!,
                            error: `No members found for team ${result.team_id}`,
                        })
                        continue
                    }

                    usersToProcess = teamMembers.map(m => ({
                        user_id: m.user_id,
                        team_id: m.team_id,
                    }))
                } else {
                    // Individual assignment
                    usersToProcess = [
                        {
                            user_id: result.user_id!,
                            team_id: result.team_id || null,
                        },
                    ]
                }

                // Process each user
                for (const userToProcess of usersToProcess) {
                    try {
                        // Check if participant is registered for the event
                        const [participant] = await sql`
                            SELECT er.id 
                            FROM event_registrations er
                            WHERE er.event_id = ${eventId} 
                            AND er.user_id = ${userToProcess.user_id}
                            ${userToProcess.team_id ? sql`AND er.team_id = ${userToProcess.team_id}` : sql``}
                        `

                        if (!participant) {
                            userErrors.push({
                                user_id: userToProcess.user_id,
                                error: `User not registered for event ${eventId}`,
                            })
                            continue
                        }

                        // Check if participant has paid
                        const [userPayment] = await sql`
                            SELECT payment_status FROM users WHERE id = ${userToProcess.user_id}
                        `

                        if (!userPayment || userPayment.payment_status === "UNPAID") {
                            userErrors.push({
                                user_id: userToProcess.user_id,
                                error: "Participant has not paid",
                            })
                            continue
                        }

                        // Check if participant has checked in to this specific round
                        const [roundCheckIn] = await sql`
                            SELECT 1 FROM event_round_checkins
                            WHERE user_id = ${userToProcess.user_id}
                            AND round_id = ${roundId}
                        `

                        if (!roundCheckIn) {
                            userErrors.push({
                                user_id: userToProcess.user_id,
                                error: "Participant has not checked in to this round",
                            })
                            continue
                        }

                        // Upsert the result (insert or update if exists)
                        const [inserted] = await sql`
                            INSERT INTO round_results (
                                round_id,
                                user_id,
                                team_id,
                                points,
                                status,
                                eval_by
                            ) VALUES (
                                ${roundId},
                                ${userToProcess.user_id},
                                ${userToProcess.team_id || null},
                                ${finalPoints},
                                ${result.status},
                                ${evalBy}
                            )
                            ON CONFLICT (user_id, round_id) 
                            DO UPDATE SET
                                points = EXCLUDED.points,
                                status = EXCLUDED.status,
                                eval_by = EXCLUDED.eval_by,
                                eval_at = CURRENT_TIMESTAMP
                            RETURNING id, user_id, team_id, points, status, eval_at, eval_by
                        `

                        recordedResults.push(inserted)
                    } catch (error) {
                        console.error(
                            `Error processing result for user ${userToProcess.user_id}:`,
                            error
                        )
                        userErrors.push({
                            user_id: userToProcess.user_id,
                            error: error instanceof Error ? error.message : "Unknown error",
                        })
                    }
                }
            } catch (error) {
                console.error(`Error processing result:`, error)
                if (result.team_id && !result.user_id) {
                    teamErrors.push({
                        team_id: result.team_id,
                        error: error instanceof Error ? error.message : "Unknown error",
                    })
                } else {
                    userErrors.push({
                        user_id: result.user_id || "unknown",
                        error: error instanceof Error ? error.message : "Unknown error",
                    })
                }
            }
        }

        return Result.ok({
            recorded_count: recordedResults.length,
            results: recordedResults,
            user_errors: userErrors,
            team_errors: teamErrors,
        })
    } catch (error) {
        console.error("Error in assignRoundResults:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to assign round results",
        })
    }
}

/**
 * Get round results with participant details (paginated with filters)
 */
export async function getRoundResults(
    eventId: string,
    roundNo: number,
    filters: {
        status?: "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED" | "all"
        sort?: "points_desc" | "points_asc" | "name_asc"
        page?: number
        limit?: number
    } = {}
): Promise<
    Result<
        {
            data: Array<{
                id: number
                user_id: string
                name: string
                email: string
                team_id: string | null
                team_name: string | null
                points: number
                status: string
                eval_at: Date
                eval_by: string
            }>
            total: number
            page: number
            limit: number
            totalPages: number
        },
        { code: "round_not_found" | "internal_error"; message: string }
    >
> {
    try {
        // Get round ID
        const [round] = await sql`
            SELECT id 
            FROM event_rounds 
            WHERE event_id = ${eventId} AND round_no = ${roundNo}
        `

        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: `Round ${roundNo} not found for event ${eventId}`,
            })
        }

        const roundId = round.id
        const { status, sort = "points_desc", page = 1, limit = 50 } = filters
        const offset = (page - 1) * limit

        // Build status filter condition
        const statusFilter = status && status !== "all" ? sql`AND rr.status = ${status}` : sql``

        // Build sort clause
        let orderBy = sql`ORDER BY rr.points DESC`
        switch (sort) {
            case "points_asc":
                orderBy = sql`ORDER BY rr.points ASC`
                break
            case "points_desc":
                orderBy = sql`ORDER BY rr.points DESC`
                break
            case "name_asc":
                orderBy = sql`ORDER BY p.first_name ASC, p.last_name ASC`
                break
        }

        // Get total count
        const [countResult] = await sql`
            SELECT COUNT(*) as total
            FROM round_results rr
            WHERE rr.round_id = ${roundId}
            ${statusFilter}
        `
        const total = parseInt(countResult.total)
        const totalPages = Math.ceil(total / limit)

        // Get paginated results with participant details
        const results = await sql`
            SELECT 
                rr.id,
                rr.user_id,
                CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as name,
                u.email,
                rr.team_id,
                t.name as team_name,
                rr.points,
                rr.status,
                rr.eval_at,
                rr.eval_by
            FROM round_results rr
            JOIN users u ON rr.user_id = u.id
            JOIN profile p ON u.id = p.user_id
            LEFT JOIN teams t ON rr.team_id = t.id
            WHERE rr.round_id = ${roundId}
            ${statusFilter}
            ${orderBy}
            LIMIT ${limit} OFFSET ${offset}
        `

        return Result.ok({
            data: results,
            total,
            page,
            limit,
            totalPages,
        })
    } catch (error) {
        console.error("Error in getRoundResults:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch round results",
        })
    }
}

/**
 * Get all teams for operations with detailed member information
 * Includes teams led by user and teams where user is a member
 */
export async function getTeamsForOperations(userId: string) {
    try {
        // Get teams where user is leader
        const teamsLed = await sql`
            SELECT
                t.id as team_id,
                t.name as team_name,
                t.leader_id,
                'leader' as user_role,
                CONCAT(lp.first_name, ' ', COALESCE(lp.last_name, '')) as leader_name,
                lu.email as leader_email,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
            FROM teams t
            JOIN users lu ON t.leader_id = lu.id
            JOIN profile lp ON lu.id = lp.user_id
            WHERE t.leader_id = ${userId}
            ORDER BY t.name ASC
        `

        // Get teams where user is a member (not leader)
        const teamsAsMember = await sql`
            SELECT
                t.id as team_id,
                t.name as team_name,
                t.leader_id,
                'member' as user_role,
                CONCAT(lp.first_name, ' ', COALESCE(lp.last_name, '')) as leader_name,
                lu.email as leader_email,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
            FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            JOIN users lu ON t.leader_id = lu.id
            JOIN profile lp ON lu.id = lp.user_id
            WHERE tm.user_id = ${userId} AND t.leader_id != ${userId}
            ORDER BY t.name ASC
        `

        // Get detailed member information for each team
        const allTeams = [...teamsLed, ...teamsAsMember]

        const teamsWithMembers = await Promise.all(
            allTeams.map(async team => {
                // Get all members with check-in status
                const members = await sql`
                    SELECT
                        u.id as user_id,
                        CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as name,
                        u.email,
                        u.payment_status,
                        CASE 
                            WHEN ci.participant_id IS NOT NULL THEN true 
                            ELSE false 
                        END as checked_in,
                        ci.checkedin_at
                    FROM team_members tm
                    JOIN users u ON tm.user_id = u.id
                    JOIN profile p ON u.id = p.user_id
                    LEFT JOIN check_ins ci ON u.id = ci.participant_id
                    WHERE tm.team_id = ${team.team_id}
                    ORDER BY p.first_name ASC
                `

                // Get events this team is registered for
                const events = await sql`
                    SELECT DISTINCT
                        e.id as event_id,
                        e.name as event_name,
                        e.event_type,
                        e.start_time,
                        e.venue
                    FROM event_registrations er
                    JOIN events e ON er.event_id = e.id
                    WHERE er.team_id = ${team.team_id}
                    ORDER BY e.start_time ASC
                `

                return {
                    team_id: team.team_id,
                    team_name: team.team_name,
                    leader_id: team.leader_id,
                    leader_name: team.leader_name,
                    leader_email: team.leader_email,
                    user_role: team.user_role,
                    member_count: Number(team.member_count),
                    members: members,
                    events_registered: events,
                }
            })
        )

        return Result.ok({
            teams_led: teamsWithMembers.filter(t => t.user_role === "leader"),
            teams_as_member: teamsWithMembers.filter(t => t.user_role === "member"),
            total_teams: teamsWithMembers.length,
        })
    } catch (error) {
        console.error("Error in getTeamsForOperations:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch teams",
        })
    }
}

/**
 * Assign event prizes (final results) to participants
 */
export async function assignEventPrizes(
    eventId: string,
    assignments: PrizeAssignment[],
    awardedBy: string
): Promise<Result<BulkPrizeResult, AssignPrizesError>> {
    try {
        // Check if event exists
        const [event] = await sql`
            SELECT id FROM events WHERE id = ${eventId}
        `

        if (!event) {
            return Result.err({
                code: "event_not_found",
                message: `Event ${eventId} not found`,
            })
        }

        // Fetch all prizes for this event upfront
        const prizes = await sql`
            SELECT id, position, reward_value
            FROM event_prizes
            WHERE event_id = ${eventId}
        `

        if (prizes.length === 0) {
            return Result.err({
                code: "prize_not_found",
                message: `No prizes configured for event ${eventId}`,
            })
        }

        const prizeByPosition = new Map(
            prizes.map(p => [p.position, { id: p.id, reward_value: p.reward_value }])
        )

        const recordedResults: Array<any> = []
        const errors: Array<{ user_id: string; error: string }> = []

        for (const assignment of assignments) {
            try {
                // Validate prize position exists
                const prize = prizeByPosition.get(assignment.position)
                if (!prize) {
                    const identifier = assignment.user_id || assignment.team_id!
                    errors.push({
                        user_id: identifier,
                        error: `Prize position ${assignment.position} not found for event ${eventId}`,
                    })
                    continue
                }

                const isTeamAssignment = !assignment.user_id && assignment.team_id

                let usersToProcess: Array<{ user_id: string; team_id: string | null }> = []

                if (isTeamAssignment) {
                    const teamMembers = await sql`
                        SELECT tm.user_id, ${assignment.team_id} as team_id
                        FROM team_members tm
                        WHERE tm.team_id = ${assignment.team_id}
                    `

                    if (teamMembers.length === 0) {
                        errors.push({
                            user_id: assignment.team_id!,
                            error: `No members found for team ${assignment.team_id}`,
                        })
                        continue
                    }

                    usersToProcess = teamMembers.map(m => ({
                        user_id: m.user_id,
                        team_id: m.team_id,
                    }))
                } else {
                    usersToProcess = [
                        {
                            user_id: assignment.user_id!,
                            team_id: assignment.team_id || null,
                        },
                    ]
                }

                for (const userToProcess of usersToProcess) {
                    try {
                        // Check if participant is registered for the event
                        const [registration] = await sql`
                            SELECT er.id 
                            FROM event_registrations er
                            WHERE er.event_id = ${eventId} 
                            AND er.user_id = ${userToProcess.user_id}
                            ${userToProcess.team_id ? sql`AND er.team_id = ${userToProcess.team_id}` : sql``}
                        `

                        if (!registration) {
                            errors.push({
                                user_id: userToProcess.user_id,
                                error: `User not registered for event ${eventId}`,
                            })
                            continue
                        }

                        // Check if participant has paid
                        const [userPayment] = await sql`
                            SELECT payment_status FROM users WHERE id = ${userToProcess.user_id}
                        `

                        if (!userPayment || userPayment.payment_status === "UNPAID") {
                            errors.push({
                                user_id: userToProcess.user_id,
                                error: "Participant has not paid",
                            })
                            continue
                        }

                        // Check if user has checked in to all rounds of the event
                        const [roundCheck] = await sql`
                            SELECT 
                                (SELECT COUNT(*) FROM event_rounds WHERE event_id = ${eventId}) as total_rounds,
                                (SELECT COUNT(*) FROM event_round_checkins erc
                                 JOIN event_rounds er ON erc.round_id = er.id
                                 WHERE er.event_id = ${eventId} AND erc.user_id = ${userToProcess.user_id}) as checked_rounds
                        `

                        if (roundCheck && roundCheck.checked_rounds < roundCheck.total_rounds) {
                            errors.push({
                                user_id: userToProcess.user_id,
                                error: `Participant has not checked in to all event rounds (${roundCheck.checked_rounds}/${roundCheck.total_rounds} checked in)`,
                            })
                            continue
                        }

                        // Calculate points based on position
                        const winnerPoints = WINNER_POINTS[assignment.position] || 0

                        // Upsert event result
                        const [inserted] = await sql`
                            INSERT INTO event_results (
                                event_id,
                                user_id,
                                team_id,
                                prize_id,
                                points,
                                awarded_by
                            ) VALUES (
                                ${eventId},
                                ${userToProcess.user_id},
                                ${userToProcess.team_id || null},
                                ${prize.id},
                                ${winnerPoints},
                                ${awardedBy}
                            )
                            ON CONFLICT (event_id, user_id)
                            DO UPDATE SET
                                prize_id = EXCLUDED.prize_id,
                                team_id = EXCLUDED.team_id,
                                points = EXCLUDED.points,
                                awarded_by = EXCLUDED.awarded_by,
                                awarded_at = CURRENT_TIMESTAMP
                            RETURNING id, event_id, user_id, team_id, prize_id, points, awarded_at, awarded_by
                        `

                        recordedResults.push({
                            ...inserted,
                            position: assignment.position,
                            reward_value: prize.reward_value,
                        })
                    } catch (error) {
                        console.error(
                            `Error assigning prize for user ${userToProcess.user_id}:`,
                            error
                        )
                        errors.push({
                            user_id: userToProcess.user_id,
                            error: error instanceof Error ? error.message : "Unknown error",
                        })
                    }
                }
            } catch (error) {
                console.error("Error processing prize assignment:", error)
                const identifier = assignment.user_id || assignment.team_id || "unknown"
                errors.push({
                    user_id: identifier,
                    error: error instanceof Error ? error.message : "Unknown error",
                })
            }
        }

        return Result.ok({
            recorded_count: recordedResults.length,
            results: recordedResults,
            errors,
        })
    } catch (error) {
        console.error("Error in assignEventPrizes:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to assign event prizes",
        })
    }
}
