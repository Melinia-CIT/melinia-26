import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
    createTeamSchema,
    addNewMemberSchema,
    teamDetailsSchema
} from "@melinia/shared";
import { HTTPException } from "hono/http-exception";

import { authMiddleware } from "../middleware/auth.middleware";
import { paymentStatusMiddleware } from "../middleware/paymentStatus.middleware";
import { getUserById, getUserByMail, checkProfileExists } from "../db/queries";
import {
    insertTeam,
    addTeamMember,
    createInvitation,
    checkTeamNameExists,
    getUserCollegeId,
    checkMemberInTeam,
    checkTeamExists,
    getTeamById,
    getTeamMembers,
    getTeamPendingInvites,
    getTeamEvents,
    isTeamLeader,
    updateTeamName, 
    deleteTeamById,
    removeTeamMember,
    isTeamRegistered,
    getPendingInvitationsForTeam,
    deleteInvitationById,
    getInvitationById,
    updateInvitationStatus,
    checkPendingInvitation,
    getAllTeamsLedByUser,
    getAllTeamsUserIsMemberOf,
    getAllTeamsForUser
} from "../db/queries";

export const teams = new Hono();

// ============= Create Team =============
teams.post(
    "/",
    authMiddleware,
    paymentStatusMiddleware,
    zValidator("json", createTeamSchema),
    async (c) => {
        const userId = c.get("user_id");
        const { name, member_emails } = c.req.valid("json");

        // Check if leader exists
        const leader = await getUserById(userId);
        if (!leader) {
            throw new HTTPException(404, { message: "User not found" });
        }

        // Check if leader profile is completed
        const leaderProfileCompleted = await checkProfileExists(userId);
        if (!leaderProfileCompleted) {
            throw new HTTPException(400, {
                message: "Please complete your profile before creating a team"
            });
        }



        // Get leader's college
        const leaderCollegeId = await getUserCollegeId(userId);
        if (!leaderCollegeId) {
            throw new HTTPException(400, {
                message: "College information not found in your profile"
            });
        }

        // Check if team name is unique
        const teamNameExists = await checkTeamNameExists(name);
        if (teamNameExists) {
            throw new HTTPException(409, { message: "Team name already taken" });
        }

        // Validate member emails
        if (member_emails && member_emails.length > 0) {
            for (const email of member_emails) {
                // Check if trying to invite themselves
                if (email === leader.email) {
                    throw new HTTPException(400, { message: "You cannot invite yourself" });
                }

                // Check if user exists
                const member = await getUserByMail(email);
                if (!member) {
                    throw new HTTPException(400, {
                        message: `User with email "${email}" has not registered`
                    });
                }

                // Check if member profile is completed
                const memberProfileCompleted = await checkProfileExists(member.id);
                if (!memberProfileCompleted) {
                    throw new HTTPException(400, {
                        message: `User "${email}" must complete their profile before joining a team`
                    });
                }

                // Check if member belongs to same college
                const memberCollegeId = await getUserCollegeId(member.id);
                if (memberCollegeId !== leaderCollegeId) {
                    throw new HTTPException(400, {
                        message: `Cannot create inter-college teams. User "${email}" belongs to a different college`
                    });
                }

                //check payment status for teammate
                if(member.payment_status==='UNPAID'){
                    throw new HTTPException(402, {
                        message:`User ${email} does not complete the payment for Melinia'26`
                    })
                }
            }
        }

        // Create team
        const teamId = await insertTeam(name, userId);

        // Add leader as team member
        await addTeamMember(teamId, userId);

        // Send invitations
        const invitationIds: number[] = [];
        if (member_emails && member_emails.length > 0) {
            for (const email of member_emails) {
                const member = await getUserByMail(email);
                if (member) {
                    const invitationId = await createInvitation(teamId, member.id, userId);
                    invitationIds.push(invitationId);
                }
            }
        }

        return c.json(
            {
                message: "Team created successfully",
                data: {
                    team_id: teamId,
                    leader_id: userId,
                    team_name: name,
                    invitations_sent: invitationIds.length
                }
            },
            201
        );
    }
);

// ============= Get Team Details =============
teams.get("/:team_id", authMiddleware, async (c) => {
    const teamId = c.req.param("team_id");
    const userId = c.get("user_id");

    // Check if team exists
    const teamExists = await checkTeamExists(teamId);
    if (!teamExists) {
        throw new HTTPException(404, { message: "Team not found" });
    }

    // Check if user is a member of the team
    const isMember = await checkMemberInTeam(userId, teamId);
    if (!isMember) {
        throw new HTTPException(403, { message: "You are not a member of this team" });
    }

    // Get team details
    const team = await getTeamById(teamId);
    if(!team){
        throw new HTTPException(401, {message:"Team not found"})
    }
    const members = await getTeamMembers(teamId, team.leader_id);
    const pendingInvites = await getTeamPendingInvites(teamId);
    const eventsRegistered = await getTeamEvents(teamId);

    const teamData = {
        id: team.id,
        name: team.name,
        leader_id: team.leader_id,
        leader_first_name: team.leader_first_name,
        leader_last_name: team.leader_last_name || "",
        leader_email: team.leader_email,
        members: members.map((m: any) => ({
            user_id: m.user_id,
            first_name: m.first_name,
            last_name: m.last_name || "",
            email: m.email
        })),
        pending_invites: pendingInvites.map((pi: any) => ({
            invitation_id: pi.invitation_id,
            user_id: pi.user_id,
            first_name: pi.first_name,
            last_name: pi.last_name || "",
            email: pi.email
        })),
        events_registered: eventsRegistered.map((er: any) => ({
            event_id: er.event_id,
            event_name: er.event_name
        })),
        team_size: members.length + 1
    };
    teamDetailsSchema.parse(teamData);

    return c.json({ message: "Team details retrieved successfully", data: teamData }, 200);
});

// ============= Update Team =============
// teams.put("/:team_id", authMiddleware, zValidator("json", updateTeamSchema), async (c) => {
//     const userId = c.get("user_id");
//     const teamId = c.req.param("team_id");
//     const { name, event_id } = c.req.valid("json");

//     // Check if team exists
//     const teamExists = await checkTeamExists(teamId);
//     if (!teamExists) {
//         throw new HTTPException(404, { message: "Team not found" });
//     }

//     // Check if user is team leader
//     const isLeader = await isTeamLeader(userId, teamId);
//     if (!isLeader) {
//         throw new HTTPException(403, { message: "Only team leader can update team" });
//     }

//     // Check if new name is unique (if provided)
//     if (name) {
//         const team = await getTeamById(teamId);
//         if (name !== team?.name) {
//             const nameExists = await checkTeamNameExists(name);
//             if (nameExists) {
//                 throw new HTTPException(409, { message: "Team name already taken" });
//             }
//         }
//     }

//     // Update team
//     if (!name && !event_id) {
//         throw new HTTPException(400, { message: "No fields to update" });
//     }

//     if (name && event_id) {
//         await updateTeamNameAndEvent(teamId, name, event_id);
//     } else if (name) {
//         await updateTeamName(teamId, name);
//     } else if (event_id) {
//         await updateTeamEvent(teamId, event_id);
//     }

//     return c.json({ message: "Team updated successfully" }, 200);
// });

// ============= Delete Team =============
teams.delete("/:team_id", authMiddleware, async (c) => {
    const teamId = c.req.param("team_id");
    const userId = c.get("user_id");

    // Check if team exists
    const teamExists = await checkTeamExists(teamId);
    if (!teamExists) {
        throw new HTTPException(404, { message: "Team not found" });
    }

    // Check if user is team leader
    const isLeader = await isTeamLeader(userId, teamId);
    if (!isLeader) {
        throw new HTTPException(403, { message: "Only team leader can delete team" });
    }

    // Delete team
    await deleteTeamById(teamId);

    return c.json({ message: "Team deleted successfully" }, 200);
});

// ============= Delete Team Member =============
teams.delete("/:team_id/team_member/:member_id", authMiddleware, async (c) => {
    const teamId = c.req.param("team_id");
    const memberId = c.req.param("member_id");
    const userId = c.get("user_id");

    // Check if team exists
    const teamExists = await checkTeamExists(teamId);
    if (!teamExists) {
        throw new HTTPException(404, { message: "Team not found" });
    }

    // Check if user is team leader
    const isLeader = await isTeamLeader(userId, teamId);
    if (!isLeader) {
        throw new HTTPException(403, { message: "Only team leader can remove members" });
    }

    // Check if trying to remove themselves (leader)
    if (memberId === userId) {
        throw new HTTPException(400, { message: "Cannot remove team leader" });
    }

    // Check if team is registered
    const registered = await isTeamRegistered(teamId);
    if (registered) {
        throw new HTTPException(403, {
            message: "Team is registered for an event. No modifications allowed"
        });
    }

    // Check if member exists in team
    const memberExists = await checkMemberInTeam(memberId, teamId);
    if (!memberExists) {
        throw new HTTPException(404, { message: "Member not found in this team" });
    }

    // Remove member
    await removeTeamMember(teamId, memberId);

    return c.json({ message: "Team member removed successfully" }, 200);
});

// ============= Get Pending Invitations for Team =============
teams.get("/:team_id/pending_invitations", authMiddleware, async (c) => {
    const teamId = c.req.param("team_id");

    // Check if team exists
    const teamExists = await checkTeamExists(teamId);
    if (!teamExists) {
        throw new HTTPException(404, { message: "Team not found" });
    }

    const invitations = await getPendingInvitationsForTeam(teamId);

    return c.json(
        { message: "Pending invitations retrieved successfully", data: invitations },
        200
    );
});

// ============= Delete Invitation =============
teams.delete("/:team_id/pending_invitations/:invitation_id", authMiddleware, paymentStatusMiddleware,async (c) => {
    const teamId = c.req.param("team_id");
    const invitationId = Number(c.req.param("invitation_id"));
    const userId = c.get("user_id");

    if (!invitationId || isNaN(invitationId)) {
        throw new HTTPException(400, { message: "Invalid invitation ID" });
    }

    // Check if team exists
    const teamExists = await checkTeamExists(teamId);
    if (!teamExists) {
        throw new HTTPException(404, { message: "Team not found" });
    }

    // Check if user is team leader
    const isLeader = await isTeamLeader(userId, teamId);
    if (!isLeader) {
        throw new HTTPException(403, { message: "Only team leader can delete invitations" });
    }

    // Get invitation to verify it belongs to this team
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
        throw new HTTPException(404, { message: "Invitation not found" });
    }

    if (invitation.team_id !== teamId) {
        throw new HTTPException(403, { message: "Invitation does not belong to this team" });
    }

    // Delete invitation
    await deleteInvitationById(invitationId);

    return c.json({ message: "Invitation deleted successfully" }, 200);
});

// ============= Accept Invitation =============
teams.post("/pending_invitations/:invitation_id", authMiddleware, paymentStatusMiddleware,async (c) => {
    const invitationId = Number(c.req.param("invitation_id"));
    const userId = c.get("user_id");

    if (!invitationId || isNaN(invitationId)) {
        throw new HTTPException(400, { message: "Invalid invitation ID" });
    }

    // Get invitation
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
        throw new HTTPException(404, { message: "Invitation not found" });
    }

    // Check if invitation is for this user
    if (invitation.invitee_id !== userId) {
        throw new HTTPException(403, { message: "This invitation is not for you" });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
        throw new HTTPException(400, { message: `Invitation already ${invitation.status}` });
    }

    // Check if team is registered
    const registered = await isTeamRegistered(invitation.team_id);
    if (registered) {
        throw new HTTPException(403, {
            message: "Invitation expired. Team is already registered for an event"
        });
    }

    // Accept invitation
    await updateInvitationStatus(invitationId, "accepted");
    await addTeamMember(invitation.team_id, userId);

    return c.json(
        { message: "Invitation accepted successfully", data: { team_id: invitation.team_id } },
        200
    );
});

// ============= Decline Invitation =============
teams.put("/pending_invitations/:invitation_id", authMiddleware, paymentStatusMiddleware,async (c) => {
    const invitationId = Number(c.req.param("invitation_id"));
    const userId = c.get("user_id");

    if (!invitationId || isNaN(invitationId)) {
        throw new HTTPException(400, { message: "Invalid invitation ID" });
    }

    // Get invitation
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
        throw new HTTPException(404, { message: "Invitation not found" });
    }

    // Check if invitation is for this user
    if (invitation.invitee_id !== userId) {
        throw new HTTPException(403, { message: "This invitation is not for you" });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
        throw new HTTPException(400, { message: `Invitation already ${invitation.status}` });
    }

    // Decline invitation
    await updateInvitationStatus(invitationId, "declined");

    return c.json({ message: "Invitation declined successfully" }, 200);
});

// ============= Add New Member =============
teams.post(
    "/:team_id/members",
    authMiddleware,
    paymentStatusMiddleware,
    zValidator("json", addNewMemberSchema),
    async (c) => {
        const userId = c.get("user_id");
        const teamId = c.req.param("team_id");
        const { email } = c.req.valid("json");

        // Check if team exists
        const teamExists = await checkTeamExists(teamId);
        if (!teamExists) {
            throw new HTTPException(404, { message: "Team not found" });
        }

        // Check if user is team leader
        const isLeader = await isTeamLeader(userId, teamId);
        if (!isLeader) {
            throw new HTTPException(403, { message: "Only team leader can invite members" });
        }

        // Check if team is registered
        const registered = await isTeamRegistered(teamId);
        if (registered) {
            throw new HTTPException(403, {
                message: "Team is registered for an event. Cannot add new members"
            });
        }

        // Get leader's college
        const leaderCollegeId = await getUserCollegeId(userId);
        if (!leaderCollegeId) {
            throw new HTTPException(400, {
                message: "Leader college information not found"
            });
        }

        // Check if invitee exists
        const invitee = await getUserByMail(email);
        if (!invitee) {
            throw new HTTPException(400, {
                message: `User with email "${email}" has not registered`
            });
        }

        // Check if trying to invite themselves
        if (invitee.id === userId) {
            throw new HTTPException(400, { message: "Cannot invite yourself to the team" });
        }

        // Check if invitee belongs to same college
        const inviteeCollegeId = await getUserCollegeId(invitee.id);
        if (inviteeCollegeId !== leaderCollegeId) {
            throw new HTTPException(400, {
                message: `Cannot invite user from a different college. "${email}" belongs to a different college`
            });
        }

        // Check if invitee profile is completed
        const profileCompleted = await checkProfileExists(invitee.id);
        if (!profileCompleted) {
            throw new HTTPException(400, {
                message: `User "${email}" must complete their profile before joining a team`
            });
        }

        // Check if user is already a member
        const alreadyMember = await checkMemberInTeam(invitee.id, teamId);
        if (alreadyMember) {
            throw new HTTPException(409, {
                message: `User "${email}" is already a member of this team`
            });
        }

        // Check if user already has pending invitation
        const hasPendingInvitation = await checkPendingInvitation(teamId, invitee.id);
        if (hasPendingInvitation) {
            throw new HTTPException(409, {
                message: `User "${email}" already has a pending invitation to this team`
            });
        }

        // Check if invitee complete payment
        if(invitee.payment_status==='UNPAID'){
            throw new HTTPException(402, {
                message:`Invitee have not completed payment`
            })
        }
        

        // Create invitation
        const invitationId = await createInvitation(teamId, invitee.id, userId);

        return c.json(
            {
                message: `Invitation sent to "${email}" successfully`,
                data: {
                    invitation_id: invitationId,
                    invitee_email: email,
                    team_id: teamId
                }
            },
            201
        );
    }
);

// ============= Get All Teams for User =============
teams.get("/", authMiddleware, async (c) => {
    const userId = c.get("user_id");
    const filter = c.req.query("filter") as "led" | "member" | "all" | undefined;

    // Validate filter
    if (filter && !["led", "member", "all"].includes(filter)) {
        throw new HTTPException(400, { message: "Invalid filter parameter" });
    }

    let teams;
    const filterType = filter || "all";

    if (filterType === "led") {
        teams = await getAllTeamsLedByUser(userId);
    } else if (filterType === "member") {
        teams = await getAllTeamsUserIsMemberOf(userId);
    } else {
        teams = await getAllTeamsForUser(userId);
    }

    return c.json(
        {
            message: `List of ${filterType === "led" ? "teams led by" : filterType === "member" ? "teams user is member of" : "all"} user`,
            data: teams
        },
        200
    );
});