import z from "zod";

export const invitationStatusSchema = z.object({
    status: z.enum(["pending", "declined", "accepted"]).optional()
});

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
