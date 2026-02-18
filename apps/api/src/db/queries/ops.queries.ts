import { Result } from "true-myth";
import {
    type CheckIn,
    type CheckInError,
    baseCheckInSchema,
    type ScanResult,
    type ScanError,
    type RoundCheckIn,
    type RoundCheckInError,
    baseScanResultSchema,
    baseRoundCheckInSchema,
} from "@melinia/shared"
import sql from "../connection";
import postgres from "postgres";


export async function checkInParticipant(
    participantId: string,
    checkInBy: string
): Promise<Result<CheckIn, CheckInError>> {
    try {
        const [user] = await sql`
            SELECT 1, payment_status FROM users WHERE id = ${participantId} AND role = 'PARTICIPANT';
        `;
        if (!user) {
            return Result.err({
                "code": "user_not_found",
                "message": "Participant doesn't exist"
            });
        }

        if (user.payment_status === "UNPAID") {
            return Result.err({
                "code": "payment_pending",
                "message": "Participant payment pending"
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
        `;

        if (!checkIn) {
            return Result.err({
                code: "internal_error",
                message: "Failed to checkin participant"
            });
        }
        return Result.ok(baseCheckInSchema.parse(checkIn));
    } catch (err) {
        console.error(err);

        if (err instanceof postgres.PostgresError) {
            const constraint = err?.constraint_name
            if (constraint) {
                switch (constraint) {
                    case "check_ins_participant_id_key":
                        return Result.err({
                            code: "already_checked_in",
                            message: "Participant already checked in"
                        });
                }
            }
        }

        return Result.err({
            code: "internal_error",
            message: "Failed to checkin"
        });
    }
}

export async function scanUserForRound(
    userId: string,
    eventId: string,
    roundNo: number
): Promise<Result<ScanResult, ScanError>> {
    try {
        // Verify event exists
        const [event] = await sql`
            SELECT id FROM events WHERE id = ${eventId};
        `;
        if (!event) {
            return Result.err({
                code: "event_not_found",
                message: "Event not found"
            });
        }

        // Verify user exists
        const [user] = await sql`
            SELECT id FROM users WHERE id = ${userId} AND role = 'PARTICIPANT';
        `;
        if (!user) {
            return Result.err({
                code: "user_not_found",
                message: "Participant not found"
            });
        }

        // Fetch the round using round_no and event_id
        const [round] = await sql`
            SELECT id FROM event_rounds 
            WHERE event_id = ${eventId} AND round_no = ${roundNo};
        `;
        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: "Round not found"
            });
        }

        if (roundNo === 1) {
            // Round 1: Check event_registrations
            const [registration] = await sql`
                SELECT 
                    er.user_id,
                    er.team_id,
                    p.first_name as first_name,
                    p.last_name as last_name,
                    t.name as team_name
                FROM event_registrations er
                LEFT JOIN profile p ON p.user_id = er.user_id
                LEFT JOIN teams t ON t.id = er.team_id
                WHERE er.event_id = ${eventId}
                AND (er.user_id = ${userId} OR er.team_id IN (
                    SELECT team_id FROM team_members WHERE user_id = ${userId}
                ));
            `;

            if (!registration) {
                return Result.err({
                    code: "not_registered",
                    message: "Participant is not registered for this event"
                });
            }

            // Team registration
            if (registration.team_id) {
                const members = await sql`
                    SELECT 
                        tm.user_id,
                        p.first_name,
                        p.last_name,
                        u.email,
                        u.status
                    FROM team_members tm
                    JOIN profile p ON p.user_id = tm.user_id
                    JOIN users u ON u.id = tm.user_id
                    WHERE tm.team_id = ${registration.team_id};
                `;
                return Result.ok(baseScanResultSchema.parse({
                    type: "TEAM",
                    team_id: registration.team_id,
                    team_name: registration.team_name,
                    members: members.map(m => ({
                        user_id: m.user_id,
                        first_name: m.first_name,
                        last_name:m.last_name,
                        email:m.email,
                        status:m.status
                    })),
                }));
            }

            // Solo registration
            return Result.ok(baseScanResultSchema.parse({
                type: "SOLO",
                user_id: registration.user_id,
                name: registration.user_name
            }));

        } else {
            // Round 2+: Check round_results of previous round
            const [prevRound] = await sql`
                SELECT id FROM event_rounds
                WHERE event_id = ${eventId} AND round_no = ${roundNo - 1};
            `;
            if (!prevRound) {
                return Result.err({
                    code: "round_not_found",
                    message: "Previous round not found"
                });
            }

            // Check if user qualified in previous round (direct or via team)
            const [result] = await sql`
                SELECT 
                    rr.user_id,
                    rr.team_id,
                    rr.status,
                    u.name as user_name,
                    t.name as team_name
                FROM round_results rr
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
            `;

            if (!result) {
                return Result.err({
                    code: "not_qualified",
                    message: "Participant did not qualify in the previous round"
                });
            }

            // Team result
            if (result.team_id) {
                const members = await sql`
                    SELECT 
                        tm.user_id,
                        u.name,
                        tm.is_leader
                    FROM team_members tm
                    JOIN users u ON u.id = tm.user_id
                    WHERE tm.team_id = ${result.team_id};
                `;
                return Result.ok(baseScanResultSchema.parse({
                    type: "TEAM",
                    team_id: result.team_id,
                    team_name: result.team_name,
                    members: members.map(m => ({
                        user_id: m.user_id,
                        name: m.name,
                        is_leader: m.is_leader
                    }))
                }));
            }

            // Solo result
            return Result.ok(baseScanResultSchema.parse({
                type: "SOLO",
                user_id: result.user_id,
                name: result.user_name
            }));
        }

    } catch (err) {
        console.error(err);
        return Result.err({
            code: "internal_error",
            message: "Failed to scan participant"
        });
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
        // Fetch round
        const [round] = await sql`
            SELECT id FROM event_rounds
            WHERE event_id = ${eventId} AND round_no = ${roundNo};
        `;
        if (!round) {
            return Result.err({
                code: "round_not_found",
                message: "Round not found"
            });
        }

        // Insert all user check-ins for the round
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
        `;

        if (!checkIns.length) {
            return Result.err({
                code: "internal_error",
                message: "Failed to check-in participants"
            });
        }

        return Result.ok(baseRoundCheckInSchema.parse({ checked_in: checkIns }));

    } catch (err) {
        console.error(err);
        if (err instanceof postgres.PostgresError) {
            const constraint = err?.constraint_name;
            if (constraint) {
                switch (constraint) {
                    case "event_round_checkins_user_id_round_id_key":
                        return Result.err({
                            code: "already_checked_in",
                            message: "One or more participants already checked in for this round"
                        });
                    case "event_round_checkins_user_id_fkey":
                        return Result.err({
                            code: "user_not_found",
                            message: "One or more participants not found"
                        });
                }
            }
        }
        return Result.err({
            code: "internal_error",
            message: "Failed to check-in participants"
        });
    }
}
