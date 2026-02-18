import { Hono } from "hono";
import { authMiddleware, opsAuthMiddleware } from "../middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import {
    type ScanResult,
    type ScanError,
    type RoundCheckIn,
    type RoundCheckInError,
    baseScanResultSchema,
    baseRoundCheckInSchema,
    checkInParamSchema,
    roundCheckInScanSchema,
    roundCheckInParamSchema
} from "@melinia/shared";
import { checkInParticipant, checkInRoundParticipants, getRegistrationRecordForUser, scanUserForRound } from "../db/queries";

export const ops = new Hono();

ops.post(
    "/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("json", checkInParamSchema),
    async (c) => {
        const checkInBy = c.get("user_id");
        const { participant_id } = c.req.valid("json");

        const checkIn = await checkInParticipant(participant_id, checkInBy);
        if (checkIn.isErr) {
            const message = checkIn.error.message;

            switch (checkIn.error.code) {
                case "user_not_found":
                    return c.json({ message }, 404);
                case "already_checked_in":
                    return c.json({ message }, 409);
                case "internal_error":
                    return c.json({ message }, 500);
                case "payment_pending":
                    return c.json({ message }, 402);
            }
        }

        return c.json({ ...(checkIn.value) }, 200);
    }
)

// GET - Scan user QR and return their team/solo details for the round
ops.get(
    "/events/:event_id/round/:round_no/participants",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("query", roundCheckInScanSchema),
    async (c) => {
        const eventId = c.req.param("event_id");
        const roundNo = Number(c.req.param("round_no"));
        const {user_id} = c.req.valid("query");

        if (isNaN(roundNo) || roundNo < 1) {
            return c.json({ message: "Invalid round number" }, 400);
        }

        const scan = await scanUserForRound(user_id, eventId, roundNo);
        if (scan.isErr) {
            const message = scan.error.message;
            switch (scan.error.code) {
                case "user_not_found":
                    return c.json({ message }, 404);
                case "event_not_found":
                    return c.json({ message }, 404);
                case "round_not_found":
                    return c.json({ message }, 404);
                case "not_registered":
                    return c.json({ message }, 403);
                case "not_qualified":
                    return c.json({ message }, 403);
                case "payment_pending":
                    return c.json({message}, 402);
                case "internal_error":
                    return c.json({ message }, 500);
            }
        }
        return c.json({ ...scan.value }, 200);
    }
);

// POST - Check-in the team/solo after organizer confirms members
ops.post(
    "/events/:event_id/round/:round_no/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("json", roundCheckInParamSchema),
    async (c) => {
        const checkInBy = c.get("user_id");
        const eventId = c.req.param("event_id");
        const roundNo = Number(c.req.param("round_no"));
        const { user_ids, team_id } = c.req.valid("json");

        if (isNaN(roundNo) || roundNo < 1) {
            return c.json({ message: "Invalid round number" }, 400);
        }

        const checkIn = await checkInRoundParticipants(
            eventId,
            roundNo,
            user_ids,
            team_id,
            checkInBy
        );

        if (checkIn.isErr) {
            const message = checkIn.error.message;
            switch (checkIn.error.code) {
                case "round_not_found":
                    return c.json({ message }, 404);
                case "event_not_found":
                    return c.json({message}, 404);
                case "user_not_found":
                    return c.json({ message }, 404);
                case "already_checked_in":
                    return c.json({ message }, 409);
                case "payment_pending":
                    return c.json({ message }, 402);
                case "not_qualified":
                    return c.json({message}, 403);
                case "not_registered":
                    return c.json({message}, 403);
                case "internal_error":
                    return c.json({ message }, 500);
            }
        }
        return c.json({message:"Checked in successfully"}, 200);
    }
);

