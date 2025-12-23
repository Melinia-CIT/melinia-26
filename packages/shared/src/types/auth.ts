import z from "zod"

export const generateOTPSchema = z.object({
    email: z.email(),
})

export const verifyOTPSchema = z.object({
    otp: z.string()
        .length(6)
        .regex(/^\d{6}$/, "OTP Should be 6 length")
});

export const registrationSchema = z.object({
    passwd: z.string()
        .min(8, "Password must be atleast 8 characters")
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPasswd: z.string()
});

export const profileSchema = z.object({
    firstName: z.string().min(1).max(80).trim(),
    lastName: z.string().min(1).max(80).trim().optional(),
    college: z.string().trim(),
    degree: z.string().trim(),
    otherDegree: z.string().trim().optional(),
    year: z.number().min(1).max(5)
}).refine((data) => {
    if (data?.degree.toLowerCase() === "other") {
        return !!data.otherDegree && data.otherDegree.trim().length > 0;
    }
    return true
}, {
    error: "Please specify your degree.",
    path: ["otherDegree"]
});

export const loginSchema = z.object({
    email: z.email(),
    passwd: z.string().min(1)
});
