import sql from "../connection";
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
    updateTeamSchema
} from "@melinia/shared/dist/";

// Create Team with Member Invitations
export async function createTeam(input: CreateTeam, leader_id:string) {
    const data = createTeamSchema.parse(input);

    try {
        // Check if team name is unique
        const [existingTeam] = await sql`
            SELECT id FROM teams WHERE name = ${data.name}
        `;

        if (existingTeam) {
            return {
                status: false,
                statusCode: 409,
                message: 'Team name already taken'
            };
        }

        // Validate all email ids exist in users table
        if (data.member_emails && data.member_emails.length > 0) {
            const validUsers = await sql`
                SELECT email FROM users WHERE email = ANY(${data.member_emails}::text[])
            `;

            const validEmails = validUsers.map(u => u.email);
            const invalidEmails = data.member_emails.filter(e => !validEmails.includes(e));

            if (invalidEmails.length > 0) {
                return {
                    status: false,
                    statusCode: 400,
                    message: `Invalid email(s): ${invalidEmails.join(', ')} do not exist in the system`,
                    data: { invalid_emails: invalidEmails }
                };
            }
        }

        // Create team - handle optional event_id
        let teamRow: { id: string } | undefined;
        
        if (data.event_id) {
            [teamRow] = await sql`
                INSERT INTO teams (name, leader_id, event_id)
                VALUES (${data.name}, ${leader_id}, ${data.event_id})
                RETURNING id
            `;
        } else {
            [teamRow] = await sql`
                INSERT INTO teams (name, leader_id)
                VALUES (${data.name}, ${leader_id})
                RETURNING id
            `;
        }

        if (!teamRow) throw new Error('Team creation failed');
        const team_id = teamRow.id;

        // Add leader as team member
        await sql`
            INSERT INTO team_members (team_id, user_id)
            VALUES (${team_id}, ${leader_id})
        `;

        // Get user IDs for invitees and create invitations
        let invitation_ids: number[] = [];
        if (data.member_emails && data.member_emails.length > 0) {
            const invitees = await sql`
                SELECT id FROM users WHERE email = ANY(${data.member_emails}::text[])
            `;

            for (const invitee of invitees) {
                const [invitationRow] = await sql`
                    INSERT INTO invitations (team_id, invitee_id, inviter_id, status)
                    VALUES (${team_id}, ${invitee.id}, ${leader_id}, 'pending')
                    RETURNING id
                `;
                if (invitationRow?.id) {
                    invitation_ids.push(invitationRow.id);
                }
            }
        }

        return {
            status: true,
            statusCode: 201,
            message: 'Team created successfully',
            data: {
                team_id,
                leader_id: leader_id,
                team_name: data.name,
                invitations_sent: invitation_ids.length
            }
        };
    } catch (error) {
        throw error;
    }
}

// Accept Team Invitation
export async function acceptTeamInvitation(input: RespondInvitationRequest) {
    const data = respondInvitationSchema.parse(input);
    
    try {
        const { invitation_id, user_id } = data;

        // Get invitation details
        const [invitation] = await sql`
            SELECT team_id, invitee_id, status FROM invitations WHERE id = ${invitation_id}
        `;

        if (!invitation) {
            return {
                status: false,
                statusCode: 404,
                message: 'Invitation not found'
            };
        }

        if (invitation.invitee_id !== user_id) {
            return {
                status: false,
                statusCode: 403,
                message: 'This invitation is not for you'
            };
        }

        if (invitation.status !== 'pending') {
            return {
                status: false,
                statusCode: 400,
                message: `Invitation already ${invitation.status}`
            };
        }

        // Update invitation status
        await sql`
            UPDATE invitations SET status = 'accepted' WHERE id = ${invitation_id}
        `;

        // Add user to team_members
        await sql`
            INSERT INTO team_members (team_id, user_id)
            VALUES (${invitation.team_id}, ${user_id})
            ON CONFLICT DO NOTHING
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'Invitation accepted successfully',
            data: { team_id: invitation.team_id }
        };
    } catch (error) {
        throw error;
    }
}

// Decline Team Invitation
export async function declineTeamInvitation(input: RespondInvitationRequest) {
    const data = respondInvitationSchema.parse(input);
    
    try {
        const { invitation_id, user_id } = data;

        const [invitation] = await sql`
            SELECT team_id, invitee_id, status FROM invitations WHERE id = ${invitation_id}
        `;

        if (!invitation) {
            return {
                status: false,
                statusCode: 404,
                message: 'Invitation not found'
            };
        }

        if (invitation.invitee_id !== user_id) {
            return {
                status: false,
                statusCode: 403,
                message: 'This invitation is not for you'
            };
        }

        if (invitation.status !== 'pending') {
            return {
                status: false,
                statusCode: 400,
                message: `Invitation already ${invitation.status}`
            };
        }

        await sql`
            UPDATE invitations SET status = 'declined' WHERE id = ${invitation_id}
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'Invitation declined'
        };
    } catch (error) {
        throw error;
    }
}

// Get All Teams for User
export async function getAllTeamsForUser(userId: string) {
    try {
        const rows = await sql`
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
            WHERE tm.user_id = ${userId}
            ORDER BY t.id DESC
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'List of all teams for this user',
            data: rows
        };
    } catch (error) {
        throw error;
    }
}

// Get Team Details with Members
export async function getTeamDetails(teamId: string) {
    try {
        const [team] = await sql`
            SELECT
                t.id,
                t.name,
                t.leader_id,
                t.event_id,
                e.name AS event_name
            FROM teams AS t
            LEFT JOIN events AS e ON e.id = t.event_id
            WHERE t.id = ${teamId}
        `;

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: 'Team not found'
            };
        }

        const members = await sql`
            SELECT
                u.id,
                u.email,
                p.first_name,
                p.last_name,
                tm.joined_at
            FROM team_members AS tm
            JOIN users AS u ON u.id = tm.user_id
            LEFT JOIN profile AS p ON p.user_id = u.id
            WHERE tm.team_id = ${teamId}
            ORDER BY tm.joined_at ASC
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'Team details retrieved successfully',
            data: {
                ...team,
                members
            }
        };
    } catch (error) {
        throw error;
    }
}

// Get Pending Invitations for User
export async function getPendingInvitations(userId: string) {
    try {
        const invitations = await sql`
            SELECT
                i.id AS invitation_id,
                i.team_id,
                t.name AS team_name,
                i.inviter_id,
                u.email AS inviter_email,
                p.first_name AS inviter_first_name,
                p.last_name AS inviter_last_name,
                i.status,
                e.name AS event_name
            FROM invitations AS i
            JOIN teams AS t ON t.id = i.team_id
            JOIN users AS u ON u.id = i.inviter_id
            LEFT JOIN profile AS p ON p.user_id = u.id
            LEFT JOIN events AS e ON e.id = t.event_id
            WHERE i.invitee_id = ${userId} AND i.status = 'pending'
            ORDER BY i.id DESC
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'Pending invitations retrieved',
            data: invitations
        };
    } catch (error) {
        throw error;
    }
}

// Delete Team Member (only leader can delete)
export async function deleteTeamMember(input: DeleteTeamMemberRequest) {
    const data = deleteTeamMemberSchema.parse(input);
    
    try {
        const { team_id, member_id, requester_id } = data;

        // Verify requester is the team leader
        const [team] = await sql`
            SELECT leader_id FROM teams WHERE id = ${team_id}
        `;

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: 'Team not found'
            };
        }

        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: 'Only team leader can remove members'
            };
        }

        if (team.leader_id === member_id) {
            return {
                status: false,
                statusCode: 400,
                message: 'Cannot remove team leader'
            };
        }

        // Check if member exists in team
        const [memberExists] = await sql`
            SELECT user_id FROM team_members WHERE team_id = ${team_id} AND user_id = ${member_id}
        `;

        if (!memberExists) {
            return {
                status: false,
                statusCode: 404,
                message: 'Member not found in this team'
            };
        }

        // Delete member from team
        await sql`
            DELETE FROM team_members WHERE team_id = ${team_id} AND user_id = ${member_id}
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'Team member removed successfully'
        };
    } catch (error) {
        throw error;
    }
}

// Update Team (name, event_id)
export async function updateTeam(input: UpdateTeamRequest) {
    const data = updateTeamSchema.parse(input);
    
    try {
        const { team_id, requester_id, name, event_id } = data;

        // Verify requester is the team leader
        const [team] = await sql`
            SELECT leader_id, name AS current_name FROM teams WHERE id = ${team_id}
        `;

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: 'Team not found'
            };
        }

        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: 'Only team leader can update team'
            };
        }

        // Check if new name is unique (if provided and different)
        if (name && name !== team.current_name) {
            const [existingTeam] = await sql`
                SELECT id FROM teams WHERE name = ${name}
            `;

            if (existingTeam) {
                return {
                    status: false,
                    statusCode: 409,
                    message: 'Team name already taken'
                };
            }
        }

        // Update team
        if (name && event_id) {
            await sql`
                UPDATE teams 
                SET name = ${name}, event_id = ${event_id}
                WHERE id = ${team_id}
            `;
        } else if (name) {
            await sql`
                UPDATE teams 
                SET name = ${name}
                WHERE id = ${team_id}
            `;
        } else if (event_id) {
            await sql`
                UPDATE teams 
                SET event_id = ${event_id}
                WHERE id = ${team_id}
            `;
        } else {
            return {
                status: false,
                statusCode: 400,
                message: 'No fields to update'
            };
        }

        return {
            status: true,
            statusCode: 200,
            message: 'Team updated successfully'
        };
    } catch (error) {
        throw error;
    }
}

// Delete Team (only leader can delete)
export async function deleteTeam(input: DeleteTeamRequest) {
    const data = deleteTeamSchema.parse(input);
    
    try {
        const { team_id, requester_id } = data;

        const [team] = await sql`
            SELECT leader_id FROM teams WHERE id = ${team_id}
        `;

        if (!team) {
            return {
                status: false,
                statusCode: 404,
                message: 'Team not found'
            };
        }

        if (team.leader_id !== requester_id) {
            return {
                status: false,
                statusCode: 403,
                message: 'Only team leader can delete team'
            };
        }

        // Delete team (cascades to team_members and invitations)
        await sql`
            DELETE FROM teams WHERE id = ${team_id}
        `;

        return {
            status: true,
            statusCode: 200,
            message: 'Team deleted successfully'
        };
    } catch (error) {
        throw error;
    }
}