import { Result } from "true-myth"
import {
    type CheckIn,
    type CheckInError,
    type GetCheckIn,
    type GetCheckInError,
    baseCheckInSchema,
    getCheckInSchema,
    type ScanResult,
    type ScanError,
    type RoundCheckIn,
    type RoundCheckInError,
    baseScanResultSchema,
    baseRoundCheckInSchema,
    type RoundResult,
    type BulkOperationResult,
    type AssignResultsError,
    DEFAULT_POINTS,
    WINNER_POINTS,
    type EventRoundCheckInInput,
    type EventRoundCheckIn,
    baseEventRoundCheckInSchema,
    type UserResultError,
    type TeamResultError,
    type PrizeAssignment,
    type BulkPrizeResult,
    type AssignPrizesError,
    type RoundResultWithParticipant,
    type TeamRoundResult,
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

export async function getCheckIns(from: number, limit: number): Promise<Result<GetCheckIn[], GetCheckInError>> {
    try {
        const checkIns = await sql`
            SELECT
                u.id AS participant_id,
                p.first_name,
                p.last_name,
                c.name AS college,
                d.name AS degree,
                u.email,
                u.ph_no,
                ci.checkedin_at,
                ci.checkedin_by
            FROM check_ins ci
            JOIN users u ON u.id = ci.participant_id
            JOIN profile p ON p.user_id = u.id
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            ORDER BY ci.checkedin_at
            LIMIT ${limit}
            OFFSET ${from}
        `;

        const parsedCheckIns = checkIns.map(checkIn => getCheckInSchema.parse(checkIn));
        return Result.ok(parsedCheckIns);
    } catch (err) {
        console.error(err);
        return Result.err({
            code: "internal_error",
            message: "Failed to get checkedin participants"
        });
    }
}

export async function getTotalCheckIns(): Promise<Result<number, GetCheckInError>> {
    try {
        const [row] = await sql`
            SELECT COUNT(*) AS count FROM check_ins;
        `;

        return Result.ok(parseInt(row?.count, 10));
    } catch (err) {
        console.error(err);
        return Result.err({
            code: "internal_error",
            message: "Failed to get total checkedin participants count"
        });
    }
}
export async function scanUserForRound(
    userId: string,
    eventId: string,
    roundNo: number
): Promise<Result<ScanResult, ScanError>> {
    try {
        const [event] = await sql`
            SELECT id FROM events WHERE id = ${eventId};
        `
        if (!event) {
            return Result.err({
                code: "event_not_found",
                message: "Event not found",
            })
        }

        const [user] = await sql`
            SELECT id FROM users WHERE id = ${userId} AND role = 'PARTICIPANT';
        `
        if (!user) {
            return Result.err({
                code: "user_not_found",
                message: "Participant not found",
            })
        }

        const [round] = await sql`
            SELECT id FROM event_rounds 
            WHERE event_id = ${eventId} AND round_no = ${roundNo};
        `
        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: "Round not found",
            })
        }

        if (roundNo === 1) {
            const [registration] = await sql`
                SELECT 
                    er.user_id,
                    er.team_id,
                    p.first_name,
                    p.last_name,
                    u.email,
                    u.status,
                    u.payment_status,
                    t.name as team_name
                FROM event_registrations er
                LEFT JOIN profile p ON p.user_id = er.user_id
                LEFT JOIN users u ON u.id = er.user_id
                LEFT JOIN teams t ON t.id = er.team_id
                WHERE er.event_id = ${eventId}
                AND (er.user_id = ${userId} OR er.team_id IN (
                    SELECT team_id FROM team_members WHERE user_id = ${userId}
                ));
            `

            if (!registration) {
                return Result.err({
                    code: "not_registered",
                    message: "Participant is not registered for this event",
                })
            }

            if (registration.team_id) {
                const members = await sql`
                    SELECT 
                        tm.user_id,
                        p.first_name,
                        p.last_name,
                        u.email,
                        u.status,
                        u.payment_status
                    FROM team_members tm
                    JOIN profile p ON p.user_id = tm.user_id
                    JOIN users u ON u.id = tm.user_id
                    WHERE tm.team_id = ${registration.team_id};
                `
                return Result.ok(
                    baseScanResultSchema.parse({
                        type: "TEAM",
                        team_id: registration.team_id,
                        team_name: registration.team_name,
                        members: members.map(m => ({
                            user_id: m.user_id,
                            first_name: m.first_name,
                            last_name: m.last_name,
                            email: m.email,
                            status: m.status,
                            payment_status: m.payment_status,
                        })),
                    })
                )
            }

            return Result.ok(
                baseScanResultSchema.parse({
                    type: "SOLO",
                    user_id: registration.user_id,
                    first_name: registration.first_name,
                    last_name: registration.last_name,
                    email: registration.email,
                    status: registration.status,
                    payment_status: registration.payment_status,
                })
            )
        } else {
            const [prevRound] = await sql`
                SELECT id FROM event_rounds
                WHERE event_id = ${eventId} AND round_no = ${roundNo - 1};
            `
            if (!prevRound) {
                return Result.err({
                    code: "round_not_found",
                    message: "Previous round not found",
                })
            }

            const [result] = await sql`
                SELECT 
                    rr.user_id,
                    rr.team_id,
                    rr.status AS round_status,
                    p.first_name,
                    p.last_name,
                    u.email,
                    u.status,
                    u.payment_status,
                    t.name as team_name
                FROM round_results rr
                LEFT JOIN profile p ON p.user_id = rr.user_id
                LEFT JOIN users u ON u.id = rr.user_id
                LEFT JOIN teams t ON t.id = rr.team_id
                WHERE rr.round_id = ${prevRound.id}
                AND rr.status = 'QUALIFIED'
                AND (
                    rr.user_id = ${userId}
                    OR rr.team_id IN (
                        SELECT team_id FROM team_members WHERE user_id = ${userId}
                    )
                );
            `

            if (!result) {
                return Result.err({
                    code: "not_qualified",
                    message: "Participant did not qualify in the previous round",
                })
            }

            if (result.team_id) {
                const members = await sql`
                    SELECT 
                        tm.user_id,
                        p.first_name,
                        p.last_name,
                        u.email,
                        u.status,
                        u.payment_status
                    FROM team_members tm
                    JOIN profile p ON p.user_id = tm.user_id
                    JOIN users u ON u.id = tm.user_id
                    WHERE tm.team_id = ${result.team_id};
                `
                return Result.ok(
                    baseScanResultSchema.parse({
                        type: "TEAM",
                        team_id: result.team_id,
                        team_name: result.team_name,
                        members: members.map(m => ({
                            user_id: m.user_id,
                            first_name: m.first_name,
                            last_name: m.last_name,
                            email: m.email,
                            status: m.status,
                            payment_status: m.payment_status,
                        })),
                    })
                )
            }

            return Result.ok(
                baseScanResultSchema.parse({
                    type: "SOLO",
                    user_id: result.user_id,
                    first_name: result.first_name,
                    last_name: result.last_name,
                    email: result.email,
                    status: result.status,
                    payment_status: result.payment_status,
                })
            )
        }
    } catch (err) {
        console.error(err)
        return Result.err({
            code: "internal_error",
            message: "Failed to scan participant",
        })
    }
}

export async function checkInRoundParticipants(
    eventId: string,
    roundNo: number,
    userIds: string[],
    teamId: string | null,
    checkInBy: string
): Promise<Result<RoundCheckIn, RoundCheckInError>> {
    try {
        const [round] = await sql`
            SELECT id FROM event_rounds
            WHERE event_id = ${eventId} AND round_no = ${roundNo};
        `
        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: "Round not found",
            })
        }

        // Check payment status — all users must not be UNPAID
        const unpaidUsers = await sql`
            SELECT id FROM users
            WHERE id = ANY(${userIds}::text[])
            AND payment_status = 'UNPAID';
        `
        if (unpaidUsers.length > 0) {
            const ids = unpaidUsers.map(u => u.id).join(", ")
            return Result.err({
                code: "payment_pending",
                message: `Payment pending for participants: ${ids}`,
            })
        }

        const suspendUsers = await sql`
            SELECT id FROM users
            WHERE id = ANY(${userIds}::text[])
            AND (status = 'SUSPENDED' OR status = 'INACTIVE');
        `
        if (suspendUsers.length > 0) {
            const ids = suspendUsers.map(u => u.id).join(",")
            return Result.err({
                code: "user_not_found",
                message: `Users are Suspened or Inactive: ${ids}`,
            })
        }

        if (roundNo === 1) {
            // All users must be registered for the event
            const registeredUsers = await sql`
                SELECT er.user_id FROM event_registrations er
                WHERE er.event_id = ${eventId}
                AND (
                    er.user_id = ANY(${userIds}::text[])
                    OR er.team_id = ${teamId}
                );
            `
            const registeredIds = registeredUsers.map(r => r.user_id)
            const notRegistered = userIds.filter(id => !registeredIds.includes(id))
            if (notRegistered.length > 0) {
                return Result.err({
                    code: "not_registered",
                    message: `Participants not registered: ${notRegistered.join(", ")}`,
                })
            }
        } else {
            // Round 2+: All users must be QUALIFIED in the previous round
            const [prevRound] = await sql`
                SELECT id FROM event_rounds
                WHERE event_id = ${eventId} AND round_no = ${roundNo - 1};
            `
            if (!prevRound) {
                return Result.err({
                    code: "round_not_found",
                    message: "Previous round not found",
                })
            }

            const qualifiedUsers = await sql`
                SELECT user_id FROM round_results
                WHERE round_id = ${prevRound.id}
                AND status = 'QUALIFIED'
                AND user_id = ANY(${userIds}::text[]);
            `
            const qualifiedIds = qualifiedUsers.map(r => r.user_id)
            const notQualified = userIds.filter(id => !qualifiedIds.includes(id))
            if (notQualified.length > 0) {
                return Result.err({
                    code: "not_qualified",
                    message: `Participants not qualified from previous round: ${notQualified.join(", ")}`,
                })
            }
        }

        // Check already checked-in
        const alreadyCheckedIn = await sql`
            SELECT user_id FROM event_round_checkins
            WHERE round_id = ${round.id}
            AND user_id = ANY(${userIds}::text[]);`
        if (alreadyCheckedIn.length > 0) {
            const ids = alreadyCheckedIn.map(r => r.user_id).join(", ")
            return Result.err({
                code: "already_checked_in",
                message: `Participants already checked in: ${ids}`,
            })
        }

        const checkIns = await sql`
            INSERT INTO event_round_checkins (
                user_id,
                round_id,
                team_id,
                checkedin_by
            )
            SELECT 
                u.user_id,
                ${round.id},
                ${teamId},
                ${checkInBy}
            FROM unnest(${userIds}::text[]) AS u(user_id)
            RETURNING *;
        `

        if (!checkIns.length) {
            return Result.err({
                code: "internal_error",
                message: "Failed to check-in participants",
            })
        }

        return Result.ok(baseRoundCheckInSchema.parse({ checked_in: checkIns }))
    } catch (err) {
        if (err instanceof postgres.PostgresError) {
            const constraint = err?.constraint_name
            if (constraint) {
                switch (constraint) {
                    case "event_round_checkins_user_id_fkey":
                        return Result.err({
                            code: "user_not_found",
                            message: "One or more participants not found",
                        })
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
    from: number,
    limit: number,
    filters: {
        status?: "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED" | "all"
        sort?: "points_desc" | "points_asc" | "name_asc"
    } = {}
): Promise<
    Result<
        RoundResultWithParticipant[],
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
        const { status, sort = "points_desc" } = filters

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

        // Get paginated results with participant details
        const results = await sql`
            SELECT 
                rr.id,
                rr.user_id,
                CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as name,
                u.email,
                u.ph_no,
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
            LIMIT ${limit} OFFSET ${from}
        `

        return Result.ok(results as unknown as RoundResultWithParticipant[])
    } catch (error) {
        console.error("Error in getRoundResults:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch round results",
        })
    }
}

/**
 * Get total count of round results (with optional status filter)
 */
export async function getRoundResultsCount(
    eventId: string,
    roundNo: number,
    status?: "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED" | "all"
): Promise<
    Result<
        number,
        { code: "round_not_found" | "internal_error"; message: string }
    >
> {
    try {
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
        const statusFilter = status && status !== "all" ? sql`AND rr.status = ${status}` : sql``

        const [countResult] = await sql`
            SELECT COUNT(*) as count
            FROM round_results rr
            WHERE rr.round_id = ${roundId}
            ${statusFilter}
        `

        return Result.ok(parseInt(countResult?.count ?? "0"))
    } catch (error) {
        console.error("Error in getRoundResultsCount:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch round results count",
        })
    }
}

/**
 * Get round results grouped by team (paginated)
 */
export async function getRoundResultsByTeam(
    eventId: string,
    roundNo: number,
    from: number,
    limit: number,
    filters: {
        status?: "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED" | "all"
        sort?: "points_desc" | "points_asc" | "name_asc"
    } = {}
): Promise<
    Result<
        TeamRoundResult[],
        { code: "round_not_found" | "internal_error"; message: string }
    >
> {
    try {
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
        const { status, sort = "points_desc" } = filters

        const statusFilter = status && status !== "all" ? sql`AND rr.status = ${status}` : sql``

        let orderBy = sql`ORDER BY MAX(rr.points) DESC`
        switch (sort) {
            case "points_asc":
                orderBy = sql`ORDER BY MAX(rr.points) ASC`
                break
            case "points_desc":
                orderBy = sql`ORDER BY MAX(rr.points) DESC`
                break
            case "name_asc":
                orderBy = sql`ORDER BY MIN(t.name) ASC`
                break
        }

        // Get distinct teams with aggregated info
        const teams = await sql`
            SELECT 
                rr.team_id,
                t.name as team_name,
                MAX(rr.points) as points,
                MAX(rr.status) as status,
                MAX(rr.eval_at) as eval_at,
                json_agg(
                    json_build_object(
                        'user_id', rr.user_id,
                        'name', CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')),
                        'email', u.email
                    )
                ) as members
            FROM round_results rr
            JOIN users u ON rr.user_id = u.id
            JOIN profile p ON u.id = p.user_id
            JOIN teams t ON rr.team_id = t.id
            WHERE rr.round_id = ${roundId}
              AND rr.team_id IS NOT NULL
            ${statusFilter}
            GROUP BY rr.team_id, t.name
            ${orderBy}
            LIMIT ${limit} OFFSET ${from}
        `

        return Result.ok(teams as unknown as TeamRoundResult[])
    } catch (error) {
        console.error("Error in getRoundResultsByTeam:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch team round results",
        })
    }
}

/**
 * Get total count of distinct teams in round results (with optional status filter)
 */
export async function getRoundResultsByTeamCount(
    eventId: string,
    roundNo: number,
    status?: "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED" | "all"
): Promise<
    Result<
        number,
        { code: "round_not_found" | "internal_error"; message: string }
    >
> {
    try {
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
        const statusFilter = status && status !== "all" ? sql`AND rr.status = ${status}` : sql``

        const [countResult] = await sql`
            SELECT COUNT(DISTINCT rr.team_id) as count
            FROM round_results rr
            WHERE rr.round_id = ${roundId}
              AND rr.team_id IS NOT NULL
            ${statusFilter}
        `

        return Result.ok(parseInt(countResult?.count ?? "0"))
    } catch (error) {
        console.error("Error in getRoundResultsByTeamCount:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch team round results count",
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

export async function getEventWinners(eventId: string) {
    try {
        const [event] = await sql`
            SELECT id FROM events WHERE id = ${eventId}
        `

        if (!event) {
            return Result.err({
                code: "event_not_found",
                message: `Event ${eventId} not found`,
            })
        }

        const winners = await sql`
            SELECT 
                er.id,
                er.event_id,
                er.user_id,
                er.team_id,
                er.prize_id,
                er.points,
                er.awarded_at,
                er.awarded_by,
                ep.position as prize_position,
                ep.reward_value
            FROM event_results er
            LEFT JOIN event_prizes ep ON er.prize_id = ep.id
            WHERE er.event_id = ${eventId}
            ORDER BY ep.position ASC NULLS LAST
        `

        return Result.ok(winners)
    } catch (error) {
        console.error("Error in getEventWinners:", error)
        return Result.err({
            code: "internal_error",
            message: "Failed to fetch event winners",
        })
    }
}
