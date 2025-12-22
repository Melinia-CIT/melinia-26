import z, { email } from "zod"

export const userContactSchema = z.object({
    email: z.email("Invalid email address"),
    phNo: z.string()
        .length(10, "Phone number must exactly 10 digits")
        .regex(/^\d{10}$/, "Phone number must contain only digits").optional()
})

export const otpVerificationSchema = z.object({
    email: z.email("Invalid email address"),
    phNo: z.string()
        .length(10, "Phone number must exactly 10 digits")
        .regex(/^\d{10}$/, "Phone number must contain only digits").optional(),
    otp: z.string()
        .length(6)
        .regex(/^\d{6}$/, "OTP Should be 6 length")
});

export const passwordSchema = z.object({
    passwd: z.string()
        .min(8, "Password must be atleast 8 characters")
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPasswd: z.string()
}).refine((data) => data.passwd === data.confirmPasswd, {
    error: "The password doesn't match",
    path: ["confirmPasswd"]
})

export const profileSchema = z.object({
    firstName: z.string().min(1).max(80).trim(),
    lastName: z.string().min(1).max(80).trim().optional(),
    college: z.string().trim(),
    degree: z.string().trim().or(z.literal("")),
    otherDegree: z.string().trim().optional(),
    year: z.number().min(1).max(5)
}).refine((data) => {
    if (data?.degree.toLowerCase() === "other") {
        return !!data.otherDegree && data.otherDegree.trim().length > 0;
    }
    return true
}, {
    error: "Please specify the degree when 'Other' is selected",
    path: ["other_degree"]
});


export type UserContact = z.infer<typeof userContactSchema>;
export type OTPVerification = z.infer<typeof otpVerificationSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type Profile = z.infer<typeof profileSchema>;


export type VerificationResponse = {
    success: boolean;
    message: string;
    verified?: boolean;
    tempToken?: string;
};

export type RegistrationResponse = {
    success: boolean;
    message: string;
    userId?: string;
};