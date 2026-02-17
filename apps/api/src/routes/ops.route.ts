import { Hono } from "hono";
import { authMiddleware, opsAuthMiddleware } from "../middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { checkInParamSchema, paginationSchema } from "@packages/shared/dist";
import { checkInParticipant, getCheckIns, getTotalCheckIns } from "../db/queries";

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

ops.get(
    "/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("query", paginationSchema),
    async (c) => {
        const { from, limit } = c.req.valid("query");

        const checkInsCountResult = await getTotalCheckIns();
        if (checkInsCountResult.isErr) {
            switch (checkInsCountResult.error.code) {
                case "internal_error":
                    return c.json({ message: checkInsCountResult.error.message }, 500);
            }
        }
        const checkInsCount = checkInsCountResult.value;

        const checkInsResult = await getCheckIns(from, limit);
        if (checkInsResult.isErr) {
            switch (checkInsResult.error.code) {
                case "internal_error":
                    return c.json({ message: checkInsResult.error.message }, 500);
            }
        }
        const checkIns = checkInsResult.value;

        return c.json({
            data: checkIns,
            pagination: {
                from: from,
                limit: limit,
                total: checkInsCount,
                returned: checkIns.length,
                has_more: (from + checkIns.length) < checkInsCount
            }
        }, 200)
    }
)