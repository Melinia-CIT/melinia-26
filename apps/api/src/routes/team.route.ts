import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
    type CreateTeam,
    type RespondInvitationRequest,
    type DeleteTeamMemberRequest,
    type DeleteTeamRequest,
    type UpdateTeamRequest,
    createTeamSchema,
    respondInvitationSchema,
    deleteTeamMemberSchema,
    deleteTeamSchema,
    updateTeamSchema,
    getPendingInvitationsSchema
} from "@melinia/shared/dist/";

import { getUserRole } from "../middleware/teams.middleware";
import { createTeam, getAllTeamsForUser, acceptTeamInvitation, getPendingInvitations } from "../db/queries/teams.queries";
import { sendError, sendSuccess } from "../utils/response";

export const teamRouter = new Hono();

teamRouter.post("/", zValidator("json", createTeamSchema),async (c) => {
    try {
        const input = c.req.valid('json');
        const { statusCode, status, data, message } = await createTeam(input);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

teamRouter.get("/pending_invitations",async(c)=>{
    try {
        const user_id = c.req.query('user_id');
        console.log('user_id', user_id)
        if(!user_id){
            return sendSuccess(c, {}, "Forriben", false, 401);
        }
        const { statusCode, status, data, message } = await getPendingInvitations(user_id);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
})


teamRouter.get("/", getUserRole,async (c) => {
    try {
        const user_id = c.get("user_id");
        const { statusCode, status, data, message } = await getAllTeamsForUser(user_id);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
});