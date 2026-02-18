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
        const [event] = await sql`
            SELECT id FROM events WHERE id = ${eventId};
        `;
        if (!event) {
            return Result.err({
                code: "event_not_found",
                message: "Event not found"
            });
        }

        const [user] = await sql`
            SELECT id FROM users WHERE id = ${userId} AND role = 'PARTICIPANT';
        `;
        if (!user) {
            return Result.err({
                code: "user_not_found",
                message: "Participant not found"
            });
        }

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
            `;

            if (!registration) {
                return Result.err({
                    code: "not_registered",
                    message: "Participant is not registered for this event"
                });
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
                `;
                return Result.ok(baseScanResultSchema.parse({
                    type: "TEAM",
                    team_id: registration.team_id,
                    team_name: registration.team_name,
                    members: members.map(m => ({
                        user_id: m.user_id,
                        first_name: m.first_name,
                        last_name: m.last_name,
                        email: m.email,
                        status: m.status,
                        payment_status: m.payment_status
                    }))
                }));
            }

            return Result.ok(baseScanResultSchema.parse({
                type: "SOLO",
                user_id: registration.user_id,
                first_name: registration.first_name,
                last_name: registration.last_name,
                email: registration.email,
                status: registration.status,
                payment_status: registration.payment_status
            }));

        } else {
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
            `;

            if (!result) {
                return Result.err({
                    code: "not_qualified",
                    message: "Participant did not qualify in the previous round"
                });
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
                `;
                return Result.ok(baseScanResultSchema.parse({
                    type: "TEAM",
                    team_id: result.team_id,
                    team_name: result.team_name,
                    members: members.map(m => ({
                        user_id: m.user_id,
                        first_name: m.first_name,
                        last_name: m.last_name,
                        email: m.email,
                        status: m.status,
                        payment_status: m.payment_status
                    }))
                }));
            }

            return Result.ok(baseScanResultSchema.parse({
                type: "SOLO",
                user_id: result.user_id,
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
                status: result.status,
                payment_status: result.payment_status
            }));
        }

    } catch (err) {
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

        // Check payment status — all users must not be UNPAID
        const unpaidUsers = await sql`
            SELECT id FROM users
            WHERE id = ANY(${userIds}::text[])
            AND payment_status = 'UNPAID';
        `;
        if (unpaidUsers.length > 0) {
            const ids = unpaidUsers.map(u => u.id).join(", ");
            return Result.err({
                code: "payment_pending",
                message: `Payment pending for participants: ${ids}`
            });
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
            `;
            const registeredIds = registeredUsers.map(r => r.user_id);
            const notRegistered = userIds.filter(id => !registeredIds.includes(id));
            if (notRegistered.length > 0) {
                return Result.err({
                    code: "not_registered",
                    message: `Participants not registered: ${notRegistered.join(", ")}`
                });
            }
        } else {

            // Round 2+: All users must be QUALIFIED in the previous round
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

            const qualifiedUsers = await sql`
                SELECT user_id FROM round_results
                WHERE round_id = ${prevRound.id}
                AND status = 'QUALIFIED'
                AND user_id = ANY(${userIds}::text[]);
            `;
            const qualifiedIds = qualifiedUsers.map(r => r.user_id);
            const notQualified = userIds.filter(id => !qualifiedIds.includes(id));
            if (notQualified.length > 0) {
                return Result.err({
                    code: "not_qualified",
                    message: `Participants not qualified from previous round: ${notQualified.join(", ")}`
                });
            }
        }

        // Check already checked-in
        const alreadyCheckedIn = await sql`
            SELECT user_id FROM event_round_checkins
            WHERE round_id = ${round.id}
            AND user_id = ANY(${userIds}::text[]);`;
        if (alreadyCheckedIn.length > 0) {
            const ids = alreadyCheckedIn.map(r => r.user_id).join(", ");
            return Result.err({
                code: "already_checked_in",
                message: `Participants already checked in: ${ids}`
            });
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
        `;

        if (!checkIns.length) {
            return Result.err({
                code: "internal_error",
                message: "Failed to check-in participants"
            });
        }

        return Result.ok(baseRoundCheckInSchema.parse({ checked_in: checkIns }));

    } catch (err) {
        if (err instanceof postgres.PostgresError) {
            const constraint = err?.constraint_name;
            if (constraint) {
                switch (constraint) {
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
