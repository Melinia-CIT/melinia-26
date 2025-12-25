import { Hono, type Context } from "hono";
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
import {
    createTeam,
    getAllTeamsForUser,
    acceptTeamInvitation,
    declineTeamInvitation,
    deleteTeam,
    deleteTeamMember,
    getPendingInvitationsForTeam,
    getTeamDetails,
    updateTeam
} from "../db/queries/teams.queries";
import { sendError, sendSuccess } from "../utils/response";
import { authMiddleware } from "../middleware/auth.middleware";
import { HTTPException } from "hono/http-exception";

export const teamRouter = new Hono();

// Create Team //
teamRouter.post("/", authMiddleware, zValidator("json", createTeamSchema), async (c) => {
    try {
        const user_id = c.get('user_id');
        const formData = await c.req.valid('json');

        const { statusCode, status, data, message } = await createTeam(formData, user_id);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

// Get Team details by team_id
teamRouter.get("/:team_id", authMiddleware, async (c) => {
    try {

        const teamID = c.req.param('team_id');
        if(!teamID){
            throw new HTTPException(400, {message:"Invalid Team ID"})
        }
        const { statusCode, status, data, message } = await getTeamDetails(teamID);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

//Update Team 
teamRouter.put("/:team_id", authMiddleware, zValidator("json",updateTeamSchema), async (c) => {
    try {
        const user_id = c.get('user_id');
        const team_id = c.req.param('team_id');
        if(!team_id){
            return sendError(c, "Invalid Team", 400);
        }

        const formData = await c.req.valid('json');

        const { statusCode, status, data, message } = await updateTeam(formData, user_id,team_id);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

// Get Team details by team_id
teamRouter.delete("/:team_id", authMiddleware, async (c) => {
    try {
        const teamID = c.req.param('team_id');
        const userID = c.get('user_id');
        if(!teamID){
            throw new HTTPException(400, {message:"Invalid Team ID"})
        }
        const { statusCode, status, data, message } = await deleteTeam(userID, teamID);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

teamRouter.delete("/:team_id/team_member/:member_id", authMiddleware, async (c) => {
    try {
        const teamID = c.req.param('team_id');
        const memberID = c.req.param('member_id');
        const userID = c.get('user_id');

        if(!teamID){
            return sendError(c, "Invalid Team", 400);
        }
        if(!memberID){
            return sendError(c, "Invalid Member", 400);
        }

        const input:DeleteTeamMemberRequest = {requester_id:userID, member_id:memberID, team_id:teamID}
        const { statusCode, status, data, message } = await deleteTeamMember(input);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

//List of Pending Invitations for a Particular team
teamRouter.get("/:team_id/pending_invitations", authMiddleware, async (c: Context) => {
    try {
        const teamID = c.req.param('team_id');
        if(!teamID){
            return sendError(c, "Invalid team", 400);
        }

        const { statusCode, status, data, message } = await getPendingInvitationsForTeam(teamID);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
})


teamRouter.get("/", authMiddleware, async (c) => {
    try {
        const user_id = c.get("user_id");
        const { statusCode, status, data, message } = await getAllTeamsForUser(user_id);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
});