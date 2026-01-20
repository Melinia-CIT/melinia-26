import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
    type DeleteTeamMemberRequest,
    createTeamSchema,
    updateTeamSchema,
    addNewMemberSchema
} from "@melinia/shared";

import {
    createTeam,
    getAllTeamsForUser,
    acceptTeamInvitation,
    declineTeamInvitation,
    deleteTeam,
    deleteTeamMember,
    getPendingInvitationsForTeam,
    getTeamDetails,
    updateTeam,
    deleteInvitation,
    inviteTeamMember,
    checkMemberInTeam
} from "../db/queries/teams.queries";
import { sendError, sendSuccess } from "../utils/response";
import { authMiddleware } from "../middleware/auth.middleware";
import { paymentStatusMiddleware } from "../middleware/paymentStatus.middleware";
import { HTTPException } from "hono/http-exception";
import { getUserById, getUserByMail } from "../db/queries";

export const teams = new Hono();

// Create Team //
teams.post('/', authMiddleware, paymentStatusMiddleware, zValidator('json', createTeamSchema), async (c) => {
    try {
        const user_id = c.get('user_id');
        const formData = await c.req.valid('json');
        const user = await getUserById(user_id);
        if(!user){
            return sendError(c, "user not found", 401);
        }
        const currentUser = await getUserByMail(user?.email);
        
        // Validate member emails
        for (const email of formData.member_emails) {
            // Check if trying to invite themselves
            if (email === currentUser?.email) {
                return sendError(c, 'You cannot invite yourself!', 400);
            }
            // Verify user exists
            const member = await getUserByMail(email);
            if (!member) {
                return sendError(c, `User with email "${email}" have not registered`, 400);
            }
        }

        const { statusCode, status, data, message } = await createTeam(formData, user_id);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});


// Get Team details by team_id
teams.get("/:team_id", authMiddleware, async (c) => {
    try {

        const teamID = c.req.param('team_id');
        const user_id = c.get('user_id');
        const isTeamMember = await checkMemberInTeam(user_id, teamID)
        if(!isTeamMember){
            return sendError(c, "This is not your team", 403);
        }
        if (!teamID) {
            throw new HTTPException(400, { message: "Invalid Team ID" })
        }
        const { statusCode, status, data, message } = await getTeamDetails(teamID);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

//Update Team 
teams.put("/:team_id", authMiddleware, zValidator("json", updateTeamSchema), async (c) => {
    try {
        const user_id = c.get('user_id');
        const team_id = c.req.param('team_id');
        if (!team_id) {
            return sendError(c, "Invalid Team", 400);
        }

        const formData = await c.req.valid('json');

        const { statusCode, status, data, message } = await updateTeam(formData, user_id, team_id);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

// Delete Team team_id
teams.delete("/:team_id", authMiddleware, async (c) => {
    try {
        const teamID = c.req.param('team_id');
        const userID = c.get('user_id');
        if (!teamID) {
            throw new HTTPException(400, { message: "Invalid Team ID" })
        }
        const { statusCode, status, data, message } = await deleteTeam(userID, teamID);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

// delete a teammate
teams.delete("/:team_id/team_member/:member_id", authMiddleware, async (c) => {
    try {
        const teamID = c.req.param('team_id');
        const memberID = c.req.param('member_id');
        const userID = c.get('user_id');

        if (!teamID) {
            return sendError(c, "Invalid Team", 400);
        }
        if (!memberID) {
            return sendError(c, "Invalid Member", 400);
        }

        const input: DeleteTeamMemberRequest = { requester_id: userID, member_id: memberID, team_id: teamID }
        const { statusCode, status, data, message } = await deleteTeamMember(input);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

//List of Pending Invitations for a Particular team
teams.get("/:team_id/pending_invitations", authMiddleware, async (c: Context) => {
    try {
        const teamID = c.req.param('team_id');
        if (!teamID) {
            return sendError(c, "Invalid team", 400);
        }

        const { statusCode, status, data, message } = await getPendingInvitationsForTeam(teamID);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
})

//Delete a Invitation
teams.delete("/:team_id/pending_invitations/:invitation_id", authMiddleware, async (c: Context) => {
    try {
        const teamID = c.req.param('team_id');
        const invitationID = Number(c.req.param('invitation_id'));
        const userID: string = c.get('user_id');

        if (!teamID) {
            return sendError(c, "Invalid team", 400);
        }
        if (!invitationID) {
            return sendError(c, "Invalid Invitation", 400);
        }
        const input = { requester_id: userID, invitation_id: invitationID };
        const { statusCode, status, data, message } = await deleteInvitation(input);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
})
// Accept invitations
teams.post("/pending_invitations/:invitation_id", authMiddleware, async (c: Context) => {
    try {
        const invitationID = Number(c.req.param('invitation_id'));
        const userID: string = c.get('user_id');

        if (!invitationID) {
            return sendError(c, "Invalid Invitation", 400);
        }
        const input = { user_id: userID, invitation_id: invitationID };
        const { statusCode, status, data, message } = await acceptTeamInvitation(input);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
})

// Decline invitations
teams.put("/pending_invitations/:invitation_id", authMiddleware, async (c: Context) => {
    try {
        const invitationID = Number(c.req.param('invitation_id'));
        const userID: string = c.get('user_id');

        if (!invitationID) {
            return sendError(c, "Invalid Invitation", 400);
        }
        const input = { user_id: userID, invitation_id: invitationID };
        const { statusCode, status, data, message } = await declineTeamInvitation(input);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
})
// Add a new member
teams.post("/:team_id/members", authMiddleware, paymentStatusMiddleware,zValidator("json", addNewMemberSchema), async (c) => {
    try {
        const user_id = c.get('user_id');
        const teamID = c.req.param('team_id');
        const formData = await c.req.valid('json');

        const { statusCode, status, data, message } = await inviteTeamMember(formData, user_id, teamID);

        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
})

 teams.get('/', authMiddleware, async (c) => {
    try {
        const user_id = c.get('user_id');
        const filter = c.req.query('filter') as 'led' | 'member' | 'all' | undefined;

        // Validate filter param

        if (filter && !['led', 'member', 'all'].includes(filter)) {
            return sendError(c, 'Invalid filter parameter', 400);
        }

        const { statusCode, status, data, message } = await getAllTeamsForUser(user_id, filter || 'all');

        return sendSuccess(c, data, message, status, statusCode);
    } 
    catch (error: unknown) {
        console.error('Error details:', error);
        return sendError(c);
    }
});