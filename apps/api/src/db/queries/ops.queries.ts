import { Result } from "true-myth";
import {
    type CheckIn,
    type CheckInError,
    type GetCheckIn,
    type GetCheckInError,
    baseCheckInSchema,
    getCheckInSchema,
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
            SELECT COUNT(*) FROM check_ins;
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
