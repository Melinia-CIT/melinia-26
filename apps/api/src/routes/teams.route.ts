import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { HTTPException } from "hono/http-exception"
import {
    type CreateTeam,
    type RespondInvitationRequest,
    type DeleteTeamMemberRequest,
    type UpdateTeamRequest,
    type AddNewMemberRequest,
    type TeamDetails,
    addNewMemberSchema,
    createTeamSchema,
    respondInvitationSchema,
    deleteTeamMemberSchema,
    updateTeamSchema,
    teamDetailsSchema,
} from "@melinia/shared"
import {
    isPaymentDone,
    checkProfileExists,
    isTeamRegistered,
    checkMemberInTeam,
    getTeamById,
    getTeamByName,
    getUserEmail,
    getUserCollege,
    validateUsersByEmails,
    createTeamRecord,
    addTeamMember,
    createInvitation,
    getInvitationById,
    updateInvitationStatus,
    getTeamMembers,
    getPendingInvitationsForTeam,
    getEventsRegisteredForTeam,
    getTeamMemberExists,
    removeTeamMember,
    updateTeamName,
    updateTeamEvent,
    deleteTeamById,
    deleteInvitationById,
    getPendingInvitationsForUser,
    getTeamsForUser,
    getTeamDetailsWithMembers,
    getInvitationByEmailAndTeam,
} from "../db/queries/teams.queries"
import { authMiddleware } from "../middleware/auth.middleware"

export const teams = new Hono()

// Create Team with Member Invitations
teams.post("/create", authMiddleware, zValidator("json", createTeamSchema), async c => {
    const { name, member_emails } = c.req.valid("json")
    const leader_id = c.get("user_id")

    // Check if leader has completed payment
    const leaderUser = await getUserEmail(leader_id)
    if (!leaderUser) {
        throw new HTTPException(404, { message: "Leader user not found" })
    }

    const leaderPaymentDone = await isPaymentDone(leaderUser.email)
    if (!leaderPaymentDone) {
        throw new HTTPException(402, { message: "Kindly complete payment before creating a team." })
    }

    // Check if leader has completed profile
    const leaderProfileCompleted = await checkProfileExists(leader_id)
    if (!leaderProfileCompleted) {
        throw new HTTPException(400, {
            message:
                "Leader profile not completed. Please complete your profile before creating a team.",
        })
    }

    // Get leader's college_id from profile
    const leaderProfile = await getUserCollege(leader_id)
    if (!leaderProfile || !leaderProfile.college_id) {
        throw new HTTPException(400, {
            message: "Leader profile not found or college not assigned",
        })
    }

    const leader_college_id = leaderProfile.college_id

    // Check if team name is unique
    const existingTeam = await getTeamByName(name)
    if (existingTeam) {
        throw new HTTPException(409, { message: "Team name already taken" })
    }

    // Validate all email ids exist in users table AND belong to same college
    if (member_emails && member_emails.length > 0) {
        const validUsers = await validateUsersByEmails(member_emails)

        const invalidEmails: string[] = []
        const differentCollegeEmails: string[] = []
        const paymentNotDoneEmails: string[] = []
        const profileNotCompletedEmails: string[] = []

        for (const email of member_emails) {
            const user = validUsers.find(u => u.email === email)

            // Check if user exists
            if (!user) {
                invalidEmails.push(email)
                continue
            }

            // Check if user has completed profile
            const profileCompleted = await checkProfileExists(user.id)
            if (!profileCompleted) {
                profileNotCompletedEmails.push(email)
            }

            // Check if user has completed payment
            const paymentDone = await isPaymentDone(email)
            if (!paymentDone) {
                paymentNotDoneEmails.push(email)
                continue
            }

            // Check if user belongs to same college
            if (user.college_id !== leader_college_id) {
                differentCollegeEmails.push(email)
                continue
            }
        }

        if (invalidEmails.length > 0) {
            throw new HTTPException(400, {
                message: `Invalid email(s): ${invalidEmails.join(", ")} do not exist in the system`,
            })
        }

        if (profileNotCompletedEmails.length > 0) {
            throw new HTTPException(400, {
                message: `Profile not completed for these user(s): ${profileNotCompletedEmails.join(", ")}. They must complete their profile before joining a team.`,
            })
        }

        if (paymentNotDoneEmails.length > 0) {
            throw new HTTPException(402, {
                message: `Payment not completed for these user(s): ${paymentNotDoneEmails.join(", ")}. They must complete payment before joining a team.`,
            })
        }

        if (differentCollegeEmails.length > 0) {
            throw new HTTPException(400, {
                message: `Cannot create inter-college teams. These user(s) belong to a different college: ${differentCollegeEmails.join(", ")}`,
            })
        }
    }

    // Create team
    const teamRow = await createTeamRecord(name, leader_id)
    if (!teamRow) {
        throw new HTTPException(500, { message: "Team creation failed" })
    }

    const team_id = teamRow.id

    // Add leader as team member
    await addTeamMember(team_id, leader_id)

    // Get user IDs for invitees and create invitations
    let invitation_ids: number[] = []
    if (member_emails && member_emails.length > 0) {
        const invitees = await validateUsersByEmails(member_emails)

        for (const invitee of invitees) {
            if (invitee.college_id === leader_college_id) {
                const invitationRow = await createInvitation(team_id, invitee.id, leader_id)
                if (invitationRow?.id) {
                    invitation_ids.push(invitationRow.id)
                }
            }
        }
    }

    return c.json(
        {
            message: "Team created successfully",
            data: {
                team_id,
                leader_id: leader_id,
                team_name: name,
                leader_college_id: leader_college_id,
                invitations_sent: invitation_ids.length,
            },
        },
        201
    )
})

// Invite Team Member
teams.post("/:teamId/invite", authMiddleware, zValidator("json", addNewMemberSchema), async c => {
    const { email } = c.req.valid("json")
    const team_id = c.req.param("teamId")
    const requester_id = c.get("user_id")

    // Verify team exists and get leader
    const team = await getTeamById(team_id)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    // Check if requester is team leader
    if (team.leader_id !== requester_id) {
        throw new HTTPException(403, { message: "Only team leader can invite members" })
    }

    // Get leader's college_id from profile
    const leaderProfile = await getUserCollege(requester_id)
    if (!leaderProfile || !leaderProfile.college_id) {
        throw new HTTPException(400, {
            message: "Leader profile not found or college not assigned",
        })
    }

    const leader_college_id = leaderProfile.college_id

    // Check if email exists in users table
    const validUsers = await validateUsersByEmails([email])
    const user = validUsers.find(u => u.email === email)

    if (!user) {
        throw new HTTPException(400, { message: `Email "${email}" does not registered yet` })
    }

    // Check if invitee belongs to same college
    if (user.college_id !== leader_college_id) {
        throw new HTTPException(400, {
            message: `Cannot invite user from a different college. "${email}" belongs to a different college.`,
        })
    }

    const invitee_id = user.id

    // Check if requester is trying to invite themselves
    if (invitee_id === requester_id) {
        throw new HTTPException(400, { message: "Cannot invite yourself to the team" })
    }

    // Check if user has completed payment
    const paymentDone = await isPaymentDone(email)
    if (!paymentDone) {
        throw new HTTPException(402, {
            message: `User "${email}" has not completed payment. They must complete payment before joining a team.`,
        })
    }

    // Check if user has completed profile
    const profileCompleted = await checkProfileExists(invitee_id)
    if (!profileCompleted) {
        throw new HTTPException(400, {
            message: `User "${email}" has not completed their profile. They must complete their profile before joining a team.`,
        })
    }

    // Check if user is already a member of the team
    const existingMember = await getTeamMemberExists(team_id, invitee_id)
    if (existingMember) {
        throw new HTTPException(409, {
            message: `User "${email}" is already a member of this team`,
        })
    }

    // Check if user already has a pending invitation
    const existingInvitations = await getInvitationByEmailAndTeam(team_id, email)
    if (existingInvitations.length > 0) {
        throw new HTTPException(409, {
            message: `User "${email}" already has a pending invitation to this team`,
        })
    }

    // Check if the team is registered
    const isLocked = await isTeamRegistered(team_id)
    if (isLocked) {
        throw new HTTPException(400, {
            message: `Team is registered for an event, so new member cannot be allowed`,
        })
    }

    // Create new invitation
    const invitationRow = await createInvitation(team_id, invitee_id, requester_id)
    if (!invitationRow) {
        throw new HTTPException(500, { message: "Failed to create invitation" })
    }

    return c.json(
        {
            message: `Invitation sent to "${email}" successfully`,
            data: {
                invitation_id: invitationRow.id,
                invitee_email: email,
                team_id: team_id,
                leader_college_id: leader_college_id,
            },
        },
        201
    )
})

// Respond to Team Invitation
teams.post(
    "/respond-invitation",
    authMiddleware,
    zValidator("json", respondInvitationSchema),
    async c => {
        const { invitation_id, user_id } = c.req.valid("json")
        const action = c.req.query("action")
        const current_user_id = c.get("user_id")

        if (user_id !== current_user_id) {
            throw new HTTPException(403, { message: "This invitation is not for you" })
        }

        // Get invitation details
        const invitation = await getInvitationById(invitation_id)
        if (!invitation) {
            throw new HTTPException(404, { message: "Invitation not found" })
        }

        if (await isTeamRegistered(invitation.team_id)) {
            throw new HTTPException(403, {
                message: "Invitation expired, team is already registered!",
            })
        }

        if (invitation.invitee_id !== user_id) {
            throw new HTTPException(403, { message: "This invitation is not for you" })
        }

        if (invitation.status !== "pending") {
            throw new HTTPException(400, { message: `Invitation already ${invitation.status}` })
        }

        if (action === "accept") {
            // Update invitation status
            await updateInvitationStatus(invitation_id, "accepted")

            // Add user to team_members
            await addTeamMember(invitation.team_id, user_id)

            return c.json(
                {
                    message: "Invitation accepted successfully",
                    data: { team_id: invitation.team_id },
                },
                200
            )
        } else if (action === "decline") {
            await updateInvitationStatus(invitation_id, "declined")

            return c.json(
                {
                    message: "Invitation declined",
                    data: {},
                },
                200
            )
        } else {
            throw new HTTPException(400, {
                message: "Invalid action. Use ?action=accept or ?action=decline",
            })
        }
    }
)

// Get All Teams for User
teams.get("/my-teams", authMiddleware, async c => {
    const user_id = c.get("user_id")
    const filter = (c.req.query("filter") as "led" | "member" | "all") || "all"

    const teams = await getTeamsForUser(user_id, filter)

    return c.json(
        {
            message: `List of ${filter === "led" ? "teams led by" : filter === "member" ? "teams user is member of" : "all"} this user`,
            data: teams,
        },
        200
    )
})

// Get Team Details
teams.get("/:teamId", authMiddleware, async c => {
    const teamId = c.req.param("teamId")

    // Get team basic info and leader details
    const team = await getTeamDetailsWithMembers(teamId)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    // Get all members (excluding leader)
    const members = await getTeamMembers(teamId, team.leader_id)

    // Get pending invitations
    const pendingInvites = await getPendingInvitationsForTeam(teamId)

    // Get events registered for this team
    const eventsRegistered = await getEventsRegisteredForTeam(teamId)

    // Calculate team size (leader + members)
    const teamSize = members.length + 1

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
            email: m.email,
        })),
        pending_invites: pendingInvites.map((pi: any) => ({
            invitation_id: pi.invitation_id,
            user_id: pi.user_id,
            first_name: pi.invitee_first_name,
            last_name: pi.invitee_last_name || "",
            email: pi.invitee_email,
        })),
        events_registered: eventsRegistered.map((er: any) => ({
            event_id: er.event_id,
            event_name: er.event_name,
        })),
        team_size: teamSize,
    }

    // Validate response against schema
    const validatedData = teamDetailsSchema.parse(teamData)

    return c.json(
        {
            message: "Team details retrieved successfully",
            data: validatedData,
        },
        200
    )
})

// Get Pending Invitations for Team
teams.get("/:teamId/pending-invitations", authMiddleware, async c => {
    const team_id = c.req.param("teamId")
    const user_id = c.get("user_id")

    // Verify team exists and requester is leader
    const team = await getTeamById(team_id)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    if (team.leader_id !== user_id) {
        throw new HTTPException(403, { message: "Only team leader can view pending invitations" })
    }

    const invitations = await getPendingInvitationsForTeam(team_id)

    return c.json(
        {
            message: "Pending invitations for team retrieved",
            data: invitations,
        },
        200
    )
})

// Delete Team Member
teams.delete("/:teamId/members/:memberId", authMiddleware, async c => {
    const team_id = c.req.param("teamId")
    const member_id = c.req.param("memberId")
    const requester_id = c.get("user_id")

    // Verify requester is the team leader
    const team = await getTeamById(team_id)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    const isRegistered = await isTeamRegistered(team_id)
    if (isRegistered) {
        throw new HTTPException(403, { message: "Team is registered, no modifications allowed" })
    }

    if (team.leader_id !== requester_id) {
        throw new HTTPException(403, { message: "Only team leader can remove members" })
    }

    if (team.leader_id === member_id) {
        throw new HTTPException(400, { message: "Cannot remove team leader" })
    }

    // Check if member exists in team
    const memberExists = await getTeamMemberExists(team_id, member_id)
    if (!memberExists) {
        throw new HTTPException(404, { message: "Member not found in this team" })
    }

    // Delete member from team
    await removeTeamMember(team_id, member_id)

    return c.json(
        {
            message: "Team member removed successfully",
        },
        200
    )
})

// Update Team
teams.put("/:teamId", authMiddleware, zValidator("json", updateTeamSchema), async c => {
    const team_id = c.req.param("teamId")
    const { name, event_id } = c.req.valid("json")
    const requester_id = c.get("user_id")

    // Verify requester is the team leader
    const team = await getTeamById(team_id)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    if (team.leader_id !== requester_id) {
        throw new HTTPException(403, { message: "Only team leader can update team" })
    }

    // Check if new name is unique (if provided and different)
    if (name && name !== team.name) {
        const existingTeam = await getTeamByName(name)
        if (existingTeam) {
            throw new HTTPException(409, { message: "Team name already taken" })
        }
    }

    // Update team
    if (name && event_id) {
        await updateTeamName(team_id, name)
        await updateTeamEvent(team_id, event_id)
    } else if (name) {
        await updateTeamName(team_id, name)
    } else if (event_id) {
        await updateTeamEvent(team_id, event_id)
    } else {
        throw new HTTPException(400, { message: "No fields to update" })
    }

    return c.json(
        {
            message: "Team updated successfully",
            data: {},
        },
        200
    )
})

// Delete Team Invitation
teams.delete("/:teamId/invitations/:invitationId", authMiddleware, async c => {
    const team_id = c.req.param("teamId")
    const invitation_id = parseInt(c.req.param("invitationId"))
    const requester_id = c.get("user_id")

    // Get invitation details
    const invitation = await getInvitationById(invitation_id)
    if (!invitation) {
        throw new HTTPException(404, { message: "Invitation not found" })
    }

    // Get team leader
    const team = await getTeamById(team_id)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    // Check if requester is team leader
    if (team.leader_id !== requester_id) {
        throw new HTTPException(403, { message: "Only team leader can delete invitations" })
    }

    // Delete invitation
    await deleteInvitationById(invitation_id)

    return c.json(
        {
            message: "Invitation deleted successfully",
            data: {},
        },
        200
    )
})

// Delete Team
teams.delete("/:teamId", authMiddleware, async c => {
    const team_id = c.req.param("teamId")
    const requester_id = c.get("user_id")

    const team = await getTeamById(team_id)
    if (!team) {
        throw new HTTPException(404, { message: "Team not found" })
    }

    if (team.leader_id !== requester_id) {
        throw new HTTPException(403, { message: "Only team leader can delete team" })
    }

    // Delete team (cascades to team_members and invitations)
    await deleteTeamById(team_id)

    return c.json(
        {
            message: "Team deleted successfully",
            data: {},
        },
        200
    )
})

// Get Pending Invitations for User
teams.get("/my-invitations/pending", authMiddleware, async c => {
    const user_id = c.get("user_id")

    const invitations = await getPendingInvitationsForUser(user_id)

    return c.json(
        {
            message: "Pending invitations for user retrieved",
            data: invitations,
        },
        200
    )
})
