import { HTTPException } from "hono/http-exception"
import sql from "../connection"
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
import { getUserByMail } from "./users.queries"

// Helper functions
export async function isPaymentDone(email_id: string): Promise<boolean> {
    try {
        const user = await getUserByMail(email_id)

        const { payment_status } = user!

        if (payment_status === "PAID" || payment_status === "EXEMPTED") {
            return true
        }

        return false
    } catch (error: unknown) {
        throw new HTTPException(500, { message: "Internal Server Error" })
    }
}

export async function checkProfileExists(id: string): Promise<boolean> {
    try {
        const user = await sql`
            SELECT 1 FROM users WHERE id = ${id} AND profile_completed = true
        `
        return user.length > 0
    } catch (error: unknown) {
        throw new HTTPException(500, { message: "Internal Server Error" })
    }
}
export async function isTeamRegistered(team_id: string): Promise<boolean> {
    try {
        const [team] = await sql`
            SELECT event_id FROM teams WHERE id = ${team_id}
        `

        // Check if team exists
        if (!team) return false

        return team.event_id !== null && team.event_id !== undefined
    } catch (error: unknown) {
        throw new HTTPException(500, { message: "Internal Server Error" })
    }
}
// Create Team with Member Invitations (Same College Only)
export async function createTeam(input: CreateTeam, leader_id: string) {
    const data = createTeamSchema.parse(input)

    try {
        // 1. Check if leader has completed payment
        const [leaderUser] = await sql`
            SELECT email FROM users WHERE id = ${leader_id}
        `

        if (!leaderUser) {
            return {
                status: false,
                statusCode: 404,
                message: "Leader user not found",
                data: {},
            }
        }

        const leaderPaymentDone = await isPaymentDone(leaderUser.email)
        if (!leaderPaymentDone) {
            //throw new HTTPException(402, {message:"Payment not done"});
            return {
                status: false,
                statusCode: 402,
                message: "Kindly complete payment before creating a team.",
                data: {},
            }
        }

        // 2. Check if leader has completed profile
        const leaderProfileCompleted = await checkProfileExists(leader_id)
        if (!leaderProfileCompleted) {
            return {
                status: false,
                statusCode: 400,
                message:
                    "Leader profile not completed. Please complete your profile before creating a team.",
                data: {},
            }
        }

        // 3. Get leader's college_id from profile
        const [leaderProfile] = await sql`
            SELECT college_id FROM profile WHERE user_id = ${leader_id}
        `

        if (!leaderProfile || !leaderProfile.college_id) {
            return {
                status: false,
                statusCode: 400,
                message: "Leader profile not found or college not assigned",
                data: {},
            }
        }

        const leader_college_id = leaderProfile.college_id

        // 4. Check if team name is unique
        const [existingTeam] = await sql`
            SELECT id FROM teams WHERE name = ${data.name}
        `

        if (existingTeam) {
            return {
                status: false,
                statusCode: 409,
                message: "Team name already taken",
                data: {},
            }
        }

        // 5. Validate all email ids exist in users table AND belong to same college
        // AND have completed payment AND profile
        if (data.member_emails && data.member_emails.length > 0) {
            const validUsers = await sql`
                SELECT u.id, u.email, p.college_id 
                FROM users u
                LEFT JOIN profile p ON u.id = p.user_id
                WHERE u.email = ANY(${data.member_emails}::text[])
            `

            const invalidEmails: string[] = []
            const differentCollegeEmails: string[] = []
            const paymentNotDoneEmails: string[] = []
            const profileNotCompletedEmails: string[] = []

            for (const email of data.member_emails) {
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
                return {
                    status: false,
                    statusCode: 400,
                    message: `Invalid email(s): ${invalidEmails.join(", ")} do not exist in the system`,
                    data: { invalid_emails: invalidEmails },
                }
            }
            if (profileNotCompletedEmails.length > 0) {
                console.log(profileNotCompletedEmails.length)

                return {
                    status: false,
                    statusCode: 400,
                    message: `Profile not completed for these user(s): ${profileNotCompletedEmails.join(", ")}. They must complete their profile before joining a team.`,
                    data: { profile_not_completed_emails: profileNotCompletedEmails },
                }
            }

            if (paymentNotDoneEmails.length > 0) {
                return {
                    status: false,
                    statusCode: 402,
                    message: `Payment not completed for these user(s): ${paymentNotDoneEmails.join(", ")}. They must complete payment before joining a team.`,
                    data: { payment_not_done_emails: paymentNotDoneEmails },
                }
            }

            if (differentCollegeEmails.length > 0) {
                console.log(differentCollegeEmails.length)

                return {
                    status: false,
                    statusCode: 400,
                    message: `Cannot create inter-college teams. These user(s) belong to a different college: ${differentCollegeEmails.join(", ")}`,
                    data: { different_college_emails: differentCollegeEmails },
                }
            }
        }

        // 6. Create team
        const [teamRow] = await sql`
            INSERT INTO teams (name, leader_id)
            VALUES (${data.name}, ${leader_id})
            RETURNING id
        `

        if (!teamRow) throw new Error("Team creation failed")
        const team_id = teamRow.id

        // 7. Add leader as team member
        await sql`
            INSERT INTO team_members (team_id, user_id)
            VALUES (${team_id}, ${leader_id})
        `

        // 8. Get user IDs for invitees and create invitations
        let invitation_ids: number[] = []
        if (data.member_emails && data.member_emails.length > 0) {
            const invitees = await sql`
                SELECT u.id FROM users u
                LEFT JOIN profile p ON u.id = p.user_id
                WHERE u.email = ANY(${data.member_emails}::text[])
                AND p.college_id = ${leader_college_id}
            `

            for (const invitee of invitees) {
                const [invitationRow] = await sql`
                    INSERT INTO invitations (team_id, invitee_id, inviter_id, status)
                    VALUES (${team_id}, ${invitee.id}, ${leader_id}, 'pending')
                    RETURNING id
                `
                if (invitationRow?.id) {
                    invitation_ids.push(invitationRow.id)
                }
            }
        }

        return {
            status: true,
            statusCode: 201,
            message: "Team created successfully",
            data: {
                team_id,
                leader_id: leader_id,
                team_name: data.name,
                leader_college_id: leader_college_id,
                invitations_sent: invitation_ids.length,
            },
        }
    } catch (error) {
        throw error
    }
}

// Invite Team Member (Same College Only)
export async function inviteTeamMember(
    input: AddNewMemberRequest,
    requester_id: string,
    team_id: string
) {
    try {
        const { email } = input

        // 1. Verify team exists and get leader
        const [team] = await sql`
            SELECT leader_id FROM teams WHERE id = ${team_id}
        `

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: "Team not found",
                data: {},
            }
        }

        // 2. Check if requester is team leader
        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: "Only team leader can invite members",
                data: {},
            }
        }

        // 3. Get leader's college_id from profile
        const [leaderProfile] = await sql`
            SELECT college_id FROM profile WHERE user_id = ${requester_id}
        `

        if (!leaderProfile || !leaderProfile.college_id) {
            return {
                status: false,
                statusCode: 400,
                message: "Leader profile not found or college not assigned",
                data: {},
            }
        }

        const leader_college_id = leaderProfile.college_id

        // 4. Check if email exists in users table
        const [user] = await sql`
            SELECT u.id, u.email, p.college_id 
            FROM users u
            LEFT JOIN profile p ON u.id = p.user_id
            WHERE u.email = ${email}
        `

        if (!user) {
            return {
                status: false,
                statusCode: 400,
                message: `Email "${email}" does not registered yet`,
                data: {},
            }
        }

        // 5. Check if invitee belongs to same college
        if (user.college_id !== leader_college_id) {
            return {
                status: false,
                statusCode: 400,
                message: `Cannot invite user from a different college. "${email}" belongs to a different college.`,
                data: {},
            }
        }

        const invitee_id = user.id

        // 6. Check if requester is trying to invite themselves
        if (invitee_id === requester_id) {
            return {
                status: false,
                statusCode: 400,
                message: "Cannot invite yourself to the team",
                data: {},
            }
        }

        // 7. Check if user has completed payment
        const paymentDone = await isPaymentDone(email)
        if (!paymentDone) {
            return {
                status: false,
                statusCode: 402,
                message: `User "${email}" has not completed payment. They must complete payment before joining a team.`,
                data: {},
            }
        }

        // 8. Check if user has completed profile
        const profileCompleted = await checkProfileExists(invitee_id)
        if (!profileCompleted) {
            return {
                status: false,
                statusCode: 400,
                message: `User "${email}" has not completed their profile. They must complete their profile before joining a team.`,
                data: {},
            }
        }

        // 9. Check if user is already a member of the team
        const [existingMember] = await sql`
            SELECT user_id FROM team_members 
            WHERE team_id = ${team_id} AND user_id = ${invitee_id}
        `

        if (existingMember) {
            return {
                status: false,
                statusCode: 409,
                message: `User "${email}" is already a member of this team`,
                data: {},
            }
        }

        // 10. Check if user already has a pending invitation
        const [existingInvitation] = await sql`
            SELECT id, status FROM invitations 
            WHERE team_id = ${team_id} 
            AND invitee_id = ${invitee_id}
            AND status = 'pending'
        `

        if (existingInvitation) {
            return {
                status: false,
                statusCode: 409,
                message: `User "${email}" already has a pending invitation to this team`,
                data: { invitation_id: existingInvitation.id },
            }
        }

        // 11. Check if the team is registered
        const isLocked = await isTeamRegistered(team_id)
        if (isLocked) {
            return {
                status: false,
                statusCode: 400,
                message: `Team is registered for an event, so new member cannot be allowed`,
                data: {},
            }
        }

        // 12. Create new invitation
        const [invitationRow] = await sql`
            INSERT INTO invitations (team_id, invitee_id, inviter_id, status)
            VALUES (${team_id}, ${invitee_id}, ${requester_id}, 'pending')
            RETURNING id
        `

        if (!invitationRow) {
            throw new Error("Failed to create invitation")
        }

        return {
            status: true,
            statusCode: 201,
            message: `Invitation sent to "${email}" successfully`,
            data: {
                invitation_id: invitationRow.id,
                invitee_email: email,
                team_id: team_id,
                leader_college_id: leader_college_id,
            },
        }
    } catch (error) {
        throw error
    }
}
// Accept Team Invitation
export async function acceptTeamInvitation(input: RespondInvitationRequest) {
    const data = respondInvitationSchema.parse(input)

    try {
        const { invitation_id, user_id } = data

        // Get invitation details
        const [invitation] = await sql`
            SELECT team_id, invitee_id, status FROM invitations WHERE id = ${invitation_id}
        `

        if (!invitation) {
            return {
                status: false,
                statusCode: 404,
                message: "Invitation not found",
            }
        }

        if (invitation.invitee_id !== user_id) {
            return {
                status: false,
                statusCode: 403,
                message: "This invitation is not for you",
            }
        }

        if (invitation.status !== "pending") {
            return {
                status: false,
                statusCode: 400,
                message: `Invitation already ${invitation.status}`,
            }
        }

        // Update invitation status
        await sql`
            UPDATE invitations SET status = 'accepted' WHERE id = ${invitation_id}
        `

        // Add user to team_members
        await sql`
            INSERT INTO team_members (team_id, user_id)
            VALUES (${invitation.team_id}, ${user_id})
            ON CONFLICT DO NOTHING
        `

        return {
            status: true,
            statusCode: 200,
            message: "Invitation accepted successfully",
            data: { team_id: invitation.team_id },
        }
    } catch (error) {
        throw error
    }
}

// Decline Team Invitation
export async function declineTeamInvitation(input: RespondInvitationRequest) {
    const data = respondInvitationSchema.parse(input)

    try {
        const { invitation_id, user_id } = data

        const [invitation] = await sql`
            SELECT team_id, invitee_id, status FROM invitations WHERE id = ${invitation_id}
        `

        if (!invitation) {
            return {
                status: false,
                statusCode: 404,
                message: "Invitation not found",
                data: {},
            }
        }

        if (invitation.invitee_id !== user_id) {
            return {
                status: false,
                statusCode: 403,
                message: "This invitation is not for you",
                data: {},
            }
        }

        if (invitation.status !== "pending") {
            return {
                status: false,
                statusCode: 400,
                message: `Invitation already ${invitation.status}`,
                data: {},
            }
        }

        await sql`
            UPDATE invitations SET status = 'declined' WHERE id = ${invitation_id}
        `

        return {
            status: true,
            statusCode: 200,
            message: "Invitation declined",
            data: {},
        }
    } catch (error) {
        throw error
    }
}

// Get All Teams for User - with query param filtering
export async function getAllTeamsForUser(userId: string, filter?: "led" | "member" | "all") {
    try {
        let query

        if (filter === "led") {
            // Teams where user is the leader
            query = sql`
                SELECT
                    t.id,
                    t.name AS team_name,
                    t.event_id,
                    e.name AS event_name,
                    t.leader_id,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
                FROM teams AS t
                LEFT JOIN events AS e ON e.id = t.event_id
                WHERE t.leader_id = ${userId}
                ORDER BY t.id DESC
            `
        } else if (filter === "member") {
            // Teams where user is a member (not leader)
            query = sql`
                SELECT
                    t.id,
                    t.name AS team_name,
                    t.event_id,
                    e.name AS event_name,
                    t.leader_id,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
                FROM team_members AS tm
                JOIN teams AS t ON t.id = tm.team_id
                LEFT JOIN events AS e ON e.id = t.event_id
                WHERE tm.user_id = ${userId} AND t.leader_id != ${userId}
                ORDER BY t.id DESC
            `
        } else {
            // All teams (led + member)
            query = sql`
                SELECT
                    t.id,
                    t.name AS team_name,
                    t.event_id,
                    e.name AS event_name,
                    t.leader_id,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
                FROM teams AS t
                LEFT JOIN events AS e ON e.id = t.event_id
                WHERE t.leader_id = ${userId}
                UNION ALL
                SELECT
                    t.id,
                    t.name AS team_name,
                    t.event_id,
                    e.name AS event_name,
                    t.leader_id,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
                FROM team_members AS tm
                JOIN teams AS t ON t.id = tm.team_id
                LEFT JOIN events AS e ON e.id = t.event_id
                WHERE tm.user_id = ${userId} AND t.leader_id != ${userId}
                ORDER BY id DESC
            `
        }

        const rows = await query

        return {
            status: true,
            statusCode: 200,
            message: `List of ${filter === "led" ? "teams led by" : filter === "member" ? "teams user is member of" : "all"} this user`,
            data: rows,
        }
    } catch (error) {
        throw error
    }
}

// Get Team Details with Members
export async function getTeamDetails(teamId: string) {
    try {
        // Get team basic info and leader details
        const [team] = await sql`
      SELECT
        t.id,
        t.name,
        t.leader_id,
        u.email AS leader_email,
        p.first_name AS leader_first_name,
        p.last_name AS leader_last_name
      FROM teams AS t
      JOIN users AS u ON u.id = t.leader_id
      LEFT JOIN profile AS p ON p.user_id = u.id
      WHERE t.id = ${teamId}
    `

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: "Team not found",
            }
        }

        // Get all members (excluding leader)
        const members = await sql`
      SELECT
        u.id AS user_id,
        p.first_name,
        p.last_name,
        u.email
      FROM team_members AS tm
      JOIN users AS u ON u.id = tm.user_id
      LEFT JOIN profile AS p ON p.user_id = u.id
      WHERE tm.team_id = ${teamId} AND u.id != ${team.leader_id}
      ORDER BY tm.joined_at ASC
    `

        // Get pending invitations
        const pendingInvites = await sql`
      SELECT
        i.id AS invitation_id,
        i.invitee_id AS user_id,
        p.first_name,
        p.last_name,
        u.email
      FROM invitations AS i
      JOIN users AS u ON u.id = i.invitee_id
      LEFT JOIN profile AS p ON p.user_id = u.id
      WHERE i.team_id = ${teamId} AND i.status = 'pending'
      ORDER BY i.id ASC
    `

        // Get events registered for this team
        const eventsRegistered = await sql`
      SELECT DISTINCT
        e.id AS event_id,
        e.name AS event_name
      FROM event_registrations AS er
      JOIN events AS e ON e.id = er.event_id
      WHERE er.team_id = ${teamId}
      ORDER BY e.name ASC
    `

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
                first_name: pi.first_name,
                last_name: pi.last_name || "",
                email: pi.email,
            })),
            events_registered: eventsRegistered.map((er: any) => ({
                event_id: er.event_id,
                event_name: er.event_name,
            })),
            team_size: teamSize,
        }

        // Validate response against schema
        const validatedData = teamDetailsSchema.parse(teamData)

        return {
            status: true,
            statusCode: 200,
            message: "Team details retrieved successfully",
            data: teamData,
        }
    } catch (error) {
        throw error
    }
}
// Get Pending Invitations for Team
export async function getPendingInvitationsForTeam(team_id: string) {
    try {
        const invitations = await sql`
            SELECT
                i.id AS invitation_id,
                i.team_id,
                i.invitee_id,
                u.email AS invitee_email,
                p.first_name AS invitee_first_name,
                p.last_name AS invitee_last_name,
                i.inviter_id,
                ui.email AS inviter_email,
                i.status
            FROM invitations AS i
            JOIN users AS u ON u.id = i.invitee_id
            LEFT JOIN profile AS p ON p.user_id = u.id
            JOIN users AS ui ON ui.id = i.inviter_id
            WHERE i.team_id = ${team_id} AND i.status = 'pending'
            ORDER BY i.id DESC
        `

        return {
            status: true,
            statusCode: 200,
            message: "Pending invitations for team retrieved",
            data: invitations,
        }
    } catch (error) {
        throw error
    }
}
// Delete Team Member (only leader can delete)
export async function deleteTeamMember(input: DeleteTeamMemberRequest) {
    const data = deleteTeamMemberSchema.parse(input)

    try {
        const { team_id, member_id, requester_id } = data

        // Verify requester is the team leader
        const [team] = await sql`
            SELECT leader_id FROM teams WHERE id = ${team_id}
        `

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: "Team not found",
                data: {},
            }
        }

        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: "Only team leader can remove members",
                data: {},
            }
        }

        if (team.leader_id === member_id) {
            return {
                status: false,
                statusCode: 400,
                message: "Cannot remove team leader",
                data: {},
            }
        }

        // Check if member exists in team
        const [memberExists] = await sql`
            SELECT user_id FROM team_members WHERE team_id = ${team_id} AND user_id = ${member_id}
        `

        if (!memberExists) {
            return {
                status: false,
                statusCode: 404,
                message: "Member not found in this team",
                data: {},
            }
        }

        // Delete member from team
        await sql`
            DELETE FROM team_members WHERE team_id = ${team_id} AND user_id = ${member_id}
        `

        return {
            status: true,
            statusCode: 200,
            message: "Team member removed successfully",
        }
    } catch (error) {
        throw error
    }
}

// Update Team (name, event_id)
export async function updateTeam(input: UpdateTeamRequest, requester_id: string, team_id: string) {
    const formData = updateTeamSchema.parse(input)

    try {
        const { name, event_id } = formData

        // Verify requester is the team leader
        const [team] = await sql`
            SELECT leader_id, name AS current_name FROM teams WHERE id = ${team_id}
        `

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: "Team not found",
            }
        }

        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: "Only team leader can update team",
            }
        }

        // Check if new name is unique (if provided and different)
        if (name && name !== team.current_name) {
            const [existingTeam] = await sql`
                SELECT id FROM teams WHERE name = ${name}
            `

            if (existingTeam) {
                return {
                    status: false,
                    statusCode: 409,
                    message: "Team name already taken",
                    data: {},
                }
            }
        }

        // Update team
        if (name && event_id) {
            await sql`
                UPDATE teams 
                SET name = ${name}, event_id = ${event_id}
                WHERE id = ${team_id}
            `
        } else if (name) {
            await sql`
                UPDATE teams 
                SET name = ${name}
                WHERE id = ${team_id}
            `
        } else if (event_id) {
            await sql`
                UPDATE teams 
                SET event_id = ${event_id}
                WHERE id = ${team_id}
            `
        } else {
            return {
                status: false,
                statusCode: 400,
                message: "No fields to update",
                data: {},
            }
        }

        return {
            status: true,
            statusCode: 200,
            message: "Team updated successfully",
            data: {},
        }
    } catch (error) {
        throw error
    }
}
// Delete Team Invitation (only leader can delete)
export async function deleteInvitation(input: { invitation_id: number; requester_id: string }) {
    try {
        const { invitation_id, requester_id } = input

        // Get invitation details
        const [invitation] = await sql`
            SELECT team_id, status FROM invitations WHERE id = ${invitation_id}
        `

        if (!invitation) {
            return {
                status: false,
                statusCode: 404,
                message: "Invitation not found",
                data: {},
            }
        }

        // Get team leader
        const [team] = await sql`
            SELECT leader_id FROM teams WHERE id = ${invitation.team_id}
        `

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: "Team not found",
                data: {},
            }
        }

        // Check if requester is team leader
        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: "Only team leader can delete invitations",
                data: {},
            }
        }

        // Delete invitation
        await sql`
            DELETE FROM invitations WHERE id = ${invitation_id}
        `

        return {
            status: true,
            statusCode: 200,
            message: "Invitation deleted successfully",
            data: {},
        }
    } catch (error) {
        throw error
    }
}

// Delete Team (only leader can delete)
export async function deleteTeam(requester_id: string, team_id: string) {
    try {
        const [team] = await sql`
            SELECT leader_id FROM teams WHERE id = ${team_id}
        `

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: "Team not found",
                data: {},
            }
        }

        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: "Only team leader can delete team",
                data: {},
            }
        }

        // Delete team (cascades to team_members and invitations)
        await sql`
            DELETE FROM teams
            WHERE id = ${team_id}
        `

        return {
            status: true,
            statusCode: 200,
            message: "Team deleted successfully",
            data: {},
        }
    } catch (error) {
        throw error
    }
}

export async function getPendingInvitationsForUser(user_id: string) {
    const invitations = await sql`
            SELECT
                i.id AS invitation_id,
                i.team_id,
                t.name AS team_name,
                i.invitee_id,
                u.email AS invitee_email,
                p.first_name AS invitee_first_name,
                p.last_name AS invitee_last_name,
                i.inviter_id,
                ui.email AS inviter_email,
                i.status
            FROM invitations AS i
            JOIN teams t ON t.id = i.team_id
            JOIN users AS u ON u.id = i.invitee_id
            LEFT JOIN profile AS p ON p.user_id = u.id
            JOIN users AS ui ON ui.id = i.inviter_id
            WHERE u.id = ${user_id} AND i.status = 'pending'
            ORDER BY i.id DESC
        `

    return invitations
}
