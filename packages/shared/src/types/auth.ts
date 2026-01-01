import z from "zod"

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
}).refine((data) => data.passwd === data.confirmPasswd, {
    message: "Passwords don't match",
    path: ["confirmPasswd"]
  });


export const loginSchema = z.object({
    email: z.email(),
    passwd: z.string().min(1, "Password can't be empty"),
})

export const forgotPasswordSchema = z.object({
    email: z.email()
});

export const resetPasswordSchema = z.object({
    token: z.uuidv4(),
    newPasswd: z
        .string()
        .min(8, "Password must be atleast 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
});

export type Login = z.infer<typeof loginSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type RegisterationType = z.infer<typeof registrationSchema>;
export type VerifyOTPType = z.infer<typeof verifyOTPSchema>;
export type GenerateOTPFormData = z.infer<typeof generateOTPSchema>;

export interface LoginResponse {
    message: string;
    accessToken: string;
}
