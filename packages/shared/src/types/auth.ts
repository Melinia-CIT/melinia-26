import z, { email } from "zod"

export const generateOTPSchema = z.object({
    email: z.email(),
})

export const verifyOTPSchema = z.object({
    otp: z
        .string()
        .length(6)
        .regex(/^\d{6}$/, "OTP Should be 6 length"),
})

export const registrationSchema = z.object({
    passwd: z
        .string()
        .min(8, "Password must be atleast 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
    confirmPasswd: z.string(),
})

export const profileSchema = z
    .object({
        firstName: z.string().min(1).max(80).trim(),
        lastName: z.string().min(1).max(80).trim().optional(),
        college: z.string().trim(),
        degree: z.string().trim(),
        otherDegree: z.string().trim().nullable().optional(),
        year: z.number().min(1).max(5),
    })
    .refine(
        data => {
            if (data?.degree.toLowerCase() === "other") {
                return !!data.otherDegree && data.otherDegree.trim().length > 0
            }
            return true
        },
        {
            message: "Please specify your degree when degree is 'other'",
            path: ["otherDegree"],
        }
    )
    .refine(
        data => {
            if (data?.degree.toLowerCase() !== "other") {
                return data.otherDegree === null || data.otherDegree === undefined
            }
            return true
        },
        {
            message: "otherDegree must be null when degree is not 'other'",
            path: ["otherDegree"],
        }
    )

export const loginSchema = z.object({
    email: z.email(),
    passwd: z.string().min(1),
})

export const createProfileSchema = profileSchema.safeExtend({
    ph_no: z.string().length(10).regex(/^\d+$/),
})

export const fullProfileSchema = createProfileSchema.safeExtend({
    email: z.email()
})

export const forgotPasswordSchema = z.object({
    email: z.email()
})

export const resetPasswordSchema = z.object({
    token: z.uuidv4(),
    newPasswd: z
        .string()
        .min(8, "Password must be atleast 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
})

export type Profile = z.infer<typeof profileSchema>
export type FullProfile = z.infer<typeof fullProfileSchema>
export type createProfileType = z.infer<typeof createProfileSchema>
export type LoginRequest = z.infer<typeof loginSchema>;
export type GenerateOTPFormData = z.infer<typeof generateOTPSchema>;
export type VerifyOTPType = z.infer<typeof verifyOTPSchema>;
export type RegisterationType = z.infer<typeof registrationSchema>;

