import { z } from 'zod';
import { invitationStatusSchema } from '.';

export const teamSchema = z.object({
  id: z.string().min(1, "Team ID is required"),
  name: z.string().min(1, "Team name is required").max(255, "Team name is too long"),
  leader_id: z.string().min(1, "Leader ID is required"),
});

// Create team schema - member_emails should be optional or have validation
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(255, "Team name is too long"),
  member_emails: z.array(
    z.string().email("Invalid email format")
  ).default([])
});

// Delete team schema
export const deleteTeamSchema = z.object({
  team_id: z.string().min(1, "Invalid Team ID"),
  requester_id: z.string().min(1, "Invalid User ID")
});

// Respond to invitation schema
export const respondInvitationSchema = z.object({
  invitation_id: z.number().int().positive("Invalid invitation ID"),
  user_id: z.string().min(1, "Invalid User ID")
});

// Delete team member schema
export const deleteTeamMemberSchema = z.object({
  team_id: z.string().min(1, "Invalid Team ID"),
  member_id: z.string().min(1, "Invalid Member ID"),
  requester_id: z.string().min(1, "Invalid Requester ID")
});

// Update team schema (renamed from updateTeamMemberSchema for clarity)
export const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(255, "Team name is too long").optional(),
  event_id: z.string().min(1, "Invalid Event ID").optional()
});
export const addNewMemberSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const memberSchema = z.object({
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});
const pendingInviteSchema = z.object({
  invitation_id: z.number().int().positive(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

const eventSchema = z.object({
  event_id: z.string(),
  event_name: z.string(),
});

export const teamDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),

  leader_id: z.string(),
  leader_first_name: z.string(),
  leader_last_name: z.string(),
  leader_email: z.string().email(),

  members: z.array(memberSchema),
  pending_invites: z.array(pendingInviteSchema),

  events_registered: z.array(eventSchema),

  team_size: z.number().int().nonnegative(),
});
// Type exports
export type Team = z.infer<typeof teamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type RespondInvitationRequest = z.infer<typeof respondInvitationSchema>;
export type DeleteTeamRequest = z.infer<typeof deleteTeamSchema>;
export type DeleteTeamMemberRequest = z.infer<typeof deleteTeamMemberSchema>;
export type UpdateTeamRequest = z.infer<typeof updateTeamSchema>;
export type addNewMemberRequest = z.infer<typeof addNewMemberSchema>
export type TeamDetails = z.infer<typeof teamDetailsSchema>;

// Optional: Additional useful schemas

// Get team details request
export const getTeamDetailsSchema = z.object({
  team_id: z.string().min(1, "Invalid Team ID")
});

export type GetTeamDetailsRequest = z.infer<typeof getTeamDetailsSchema>;

// Get user teams request
export const getUserTeamsSchema = z.object({
  user_id: z.string().min(1, "Invalid User ID")
});

export type GetUserTeamsRequest = z.infer<typeof getUserTeamsSchema>;

// Get pending invitations request
export const getPendingInvitationsSchema = z.object({
  user_id: z.string().min(1, "Invalid User ID")
});

export type GetPendingInvitationsRequest = z.infer<typeof getPendingInvitationsSchema>;