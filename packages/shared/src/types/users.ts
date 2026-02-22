import { z } from "zod";

export const userStatus = z.enum(["INACTIVE", "ACTIVE", "SUSPENDED"]);
export const baseUserSchema = z.object({
    id: z.string(),
    email: z.email("Invalid email address"),
    ph_no: z
        .string()
        .length(10)
        .regex(/^\d+$/)
        .nullable(),
    passwd_hash: z.string(),
    role: z.string(),
    profile_completed: z.boolean(),
    payment_status: z.enum(["PAID", "UNPAID", "EXEMPTED"]),
    status: userStatus,

    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});

export const userStatusParamSchema = z.object({
    status: userStatus
})

export const userSchema = baseUserSchema.omit({ passwd_hash: true });

export const baseProfileSchema = z.object({
    id: z.number(),
    user_id: z.string(),
    first_name: z.string().min(1, { error: "Firstname is required" }).max(80).trim(),
    last_name: z.string().max(80).trim().optional(),
    college: z.string().min(1, { error: "College is required" }).trim(),
    degree: z.string().min(1, { error: "Degree is required" }).trim(),
    year: z.number({ error: "Year of study is required" }).min(1).max(5),

    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
});

export const createProfileSchema = baseProfileSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true
}).extend({
    ph_no: z.string()
        .min(1, { error: "Phone Number is required" })
        .regex(/^\d{10}$/, {
            error: "Mobile number must be exactly 10 digits",
        }),
});

export const profileSchema = baseProfileSchema.omit({
    user_id: true, id: true
});


export const createOrganizerSchema = createProfileSchema.extend({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password too short"),
});

export type BaseUser = z.infer<typeof baseUserSchema>;
export type User = z.infer<typeof userSchema>;
export type BaseProfile = z.infer<typeof baseProfileSchema>;
export type CreateProfile = z.infer<typeof createProfileSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type CreateOrganizer = z.infer<typeof createOrganizerSchema>;
export type UserWithProfile = User & { profile: Profile };
export type UserStatus = z.infer<typeof userStatus>;

// Domain Error
export type UserNotFound = {
    code: "user_not_found";
    message: string;
}

export type ProfileNotFound = {
    code: "profile_not_found";
    message: string;
}

export type ProfileNotCompleted = {
    code: "profile_not_complete";
    message: string;
}

export type InternalError = {
    code: "internal_error";
    message: string
}

export type UserError = UserNotFound | ProfileNotFound | ProfileNotCompleted | InternalError;
export type SuspendError = UserNotFound;
