import { z } from "zod";

export const userSchema = z.object({
    id: z.string(),
    email: z.email(),

    ph_no: z
        .string()
        .length(10)
        .regex(/^\d+$/)
        .nullable(),

    passwd_hash: z.string(),
    role: z.string(),

    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
});

export const createUserSchema = userSchema.omit({ passwd_hash: true });

export type User = z.infer<typeof userSchema>;
export type createUser = z.infer<typeof createUserSchema>;

