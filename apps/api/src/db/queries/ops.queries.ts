import { Result } from "true-myth";
import {
    type CheckIn,
    type CheckInError,
    baseCheckInSchema,
} from "@melinia/shared"
import sql from "../connection";
import postgres from "postgres";


export async function checkInParticipant(
    userId: string,
    checkInBy: string
): Promise<Result<CheckIn, CheckInError>> {
    try {
        const [user] = await sql`
            SELECT 1, payment_status FROM users WHERE id = ${userId} AND role = 'PARTICIPANT';
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
                ${userId},
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
                    case "check_ins_participant_id_fkey":
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