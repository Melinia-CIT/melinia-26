import { z } from "zod";

export const adminLoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    passwd: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
