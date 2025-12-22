import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CreateTeam, createTeamSchema } from "@packages/shared/dist";
import { createTeam, getAllTeamsForUser } from "../db/queries/teams.queries";
import { sendError, sendSuccess } from "../utils/response";

export const teamRouter = new Hono();

teamRouter.post("/", zValidator("json", createTeamSchema), async (c) => {
    try {
        const input = c.req.valid('json');
        const { statusCode, status, data, message } = await createTeam(input);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

teamRouter.get("/:user_id", async (c) => {
    try {
        const user_id = c.req.param("user_id");
        const { statusCode, status, data, message } = await getAllTeamsForUser(user_id);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});