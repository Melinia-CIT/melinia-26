import sql from "../connection";
import {
    type CreateTeam,
    type RespondInvitationRequest,
    type DeleteTeamMemberRequest,
    type UpdateTeamRequest,
    type AddNewMemberRequest,
    createTeamSchema,
    respondInvitationSchema,
    deleteTeamMemberSchema,
    updateTeamSchema,
    teamDetailsSchema,
} from "@melinia/shared";

// ============= Helper/Check Functions =============

export async function checkTeamExists(teamId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM teams WHERE id = ${teamId}
    `;
    return result.length > 0;
}

export async function checkMemberInTeam(memberId: string, teamId: string): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM team_members 
        WHERE team_id = ${teamId} AND user_id = ${memberId}
    `;
    return result.length > 0;
}

export async function checkTeamNameExists(name: string): Promise<boolean> {
    const [team] = await sql`
        SELECT 1 FROM teams WHERE name = ${name}
    `;
    return !!team;
}

export async function checkInvitationExists(invitationId: number): Promise<boolean> {
    const result = await sql`
        SELECT 1 FROM invitations WHERE id = ${invitationId}
    `;
    return result.length > 0;
}

export async function isTeamRegistered(teamId: string): Promise<boolean> {
    const [team] = await sql`
        SELECT event_id FROM event_registrations WHERE team_id = ${teamId}
    `;
    if(!team){
        return false;
    }
    return team && team.event_id !== null && team.event_id !== undefined;
}

export async function isTeamLeader(userId: string, teamId: string): Promise<boolean> {
    const [team] = await sql`
        SELECT 1 FROM teams WHERE id = ${teamId} AND leader_id = ${userId}
    `;
    return !!team;
}

export async function getUserCollegeId(userId: string): Promise<string | null> {
    const [profile] = await sql`
        SELECT college_id FROM profile WHERE user_id = ${userId}
    `;
    return profile?.college_id || null;
}

// ============= Team CRUD Operations =============

export async function insertTeam(name: string, leaderId: string): Promise<string> {
    const [teamRow] = await sql`
        INSERT INTO teams (name, leader_id)
        VALUES (${name}, ${leaderId})
        RETURNING id
    `;
    return teamRow?.id;
}

export async function addTeamMember(teamId: string, userId: string): Promise<void> {
    await sql`
        INSERT INTO team_members (team_id, user_id)
        VALUES (${teamId}, ${userId})
    `;
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
    await sql`
        DELETE FROM team_members 
        WHERE team_id = ${teamId} AND user_id = ${userId}
    `;
}

export async function updateTeamName(teamId: string, name: string): Promise<void> {
    await sql`
        UPDATE teams SET name = ${name} WHERE id = ${teamId}
    `;
}

export async function deleteTeamById(teamId: string): Promise<void> {
    await sql`
        DELETE FROM teams WHERE id = ${teamId}
    `;
}

// ============= Invitation Operations =============

export async function createInvitation(
    teamId: string,
    inviteeId: string,
    inviterId: string
): Promise<number> {
    const [invitationRow] = await sql`
        INSERT INTO invitations (team_id, invitee_id, inviter_id, status)
        VALUES (${teamId}, ${inviteeId}, ${inviterId}, 'pending')
        RETURNING id
    `;
    return invitationRow?.id;
}

export async function getInvitationById(invitationId: number) {
    const [invitation] = await sql`
        SELECT team_id, invitee_id, status FROM invitations 
        WHERE id = ${invitationId}
    `;
    return invitation || null;
}

export async function checkPendingInvitation(teamId: string, inviteeId: string): Promise<boolean> {
    const [invitation] = await sql`
        SELECT 1 FROM invitations 
        WHERE team_id = ${teamId} 
        AND invitee_id = ${inviteeId}
        AND status = 'pending'
    `;
    return !!invitation;
}

export async function updateInvitationStatus(
    invitationId: number,
    status: 'accepted' | 'declined'
): Promise<void> {
    await sql`
        UPDATE invitations 
        SET status = ${status} 
        WHERE id = ${invitationId}
    `;
}

export async function deleteInvitationById(invitationId: number): Promise<void> {
    await sql`
        DELETE FROM invitations WHERE id = ${invitationId}
    `;
}

export async function getPendingInvitationsForTeam(teamId: string) {
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
        WHERE i.team_id = ${teamId} AND i.status = 'pending'
        ORDER BY i.id DESC
    `;
    return invitations;
}

export async function getPendingInvitationsForUser(userId: string) {
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
        WHERE u.id = ${userId} AND i.status = 'pending'
        ORDER BY i.id DESC
    `;
    return invitations;
}

// ============= Team Details & Listing =============

export async function getTeamById(teamId: string) {
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
    `;
    return team || null;
}

export async function getTeamMembers(teamId: string, excludeLeaderId: string) {
    const members = await sql`
        SELECT
            u.id AS user_id,
            p.first_name,
            p.last_name,
            u.email
        FROM team_members AS tm
        JOIN users AS u ON u.id = tm.user_id
        LEFT JOIN profile AS p ON p.user_id = u.id
        WHERE tm.team_id = ${teamId} AND u.id != ${excludeLeaderId}
        ORDER BY tm.joined_at ASC
    `;
    return members;
}

export async function getTeamPendingInvites(teamId: string) {
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
    `;
    return pendingInvites;
}

export async function getTeamEvents(teamId: string) {
    const events = await sql`
        SELECT DISTINCT
            e.id AS event_id,
            e.name AS event_name
        FROM event_registrations AS er
        JOIN events AS e ON e.id = er.event_id
        WHERE er.team_id = ${teamId}
        ORDER BY e.name ASC
    `;
    return events;
}

export async function getAllTeamsLedByUser(userId: string) {
    const teams = await sql`
        SELECT
            t.id,
            t.name AS team_name,
            t.leader_id,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
        FROM teams AS t
        WHERE t.leader_id = ${userId}
        ORDER BY t.id DESC
    `;
    return teams;
}

export async function getAllTeamsUserIsMemberOf(userId: string) {
    const teams = await sql`
        SELECT
            t.id,
            t.name AS team_name,
            t.leader_id,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
        FROM team_members AS tm
        JOIN teams AS t ON t.id = tm.team_id
        WHERE tm.user_id = ${userId} AND t.leader_id != ${userId}
        ORDER BY t.id DESC
    `;
    return teams;
}

export async function getAllTeamsForUser(userId: string) {
    const teams = await sql`
        SELECT
            t.id,
            t.name AS team_name,
            t.leader_id,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
        FROM teams AS t
        WHERE t.leader_id = ${userId}
        UNION ALL
        SELECT
            t.id,
            t.name AS team_name,
            t.leader_id,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
        FROM team_members AS tm
        JOIN teams AS t ON t.id = tm.team_id
        WHERE tm.user_id = ${userId} AND t.leader_id != ${userId}
        ORDER BY id DESC
    `;
    return teams;
}
