import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createEventSchema, eventSchema, type CreateTeam, createTeamSchema } from "@packages/shared/dist";
import { createTeam } from "../db/queries/teams.queries";
import { sendError, sendSuccess } from "../utils/response";

export const teamRouter = new Hono();

teamRouter.post("/", zValidator("json", createTeamSchema), async (c)=>{
    try {
        const input = c.req.valid('json');
        const {statusCode, status, data, message} = await createTeam(input);

        return sendSuccess(c,data,message,status,statusCode);
    } catch (error:unknown) {
        console.error(error);
        return sendError(c);
    }
})