import { Hono } from "hono";
import { authMiddleware, opsAuthMiddleware } from "../middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { checkInParamSchema } from "@packages/shared/dist";
import { checkInParticipant } from "../db/queries";

export const ops = new Hono();

ops.post(
    "/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("json", checkInParamSchema),
    async (c) => {
        const checkInBy = c.get("user_id");
        const { user_id } = c.req.valid("json");

        const checkIn = await checkInParticipant(user_id, checkInBy);
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
