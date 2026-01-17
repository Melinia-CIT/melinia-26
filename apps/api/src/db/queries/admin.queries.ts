import { getUserByMail } from "./";
import { ioredis } from "../../utils/redis";
import { createAccessToken, createRefreshToken, verifyToken } from "../../utils/jwt";
import { adminLoginSchema, type AdminLoginInput } from "@packages/shared/dist/types/admin";
import { adminOrganizerAndVolunteerMiddleware } from "../../middleware/auth.middleware";

export async function adminLogin(input: AdminLoginInput, c: any) {
    const { email, passwd } = adminLoginSchema.parse(input);

    try {
        const user = await getUserByMail(email);
        if (!user || !await Bun.password.verify(passwd, user.passwd_hash)) {
            return {
                status: false,
                statusCode: 401,
                message: "Invalid email or password",
                data: {}
            };
        }

        // Check if user has admin/organizer/volunteer role
        if (!["ADMIN", "ORGANIZER", "VOLUNTEER"].includes(user.role)) {
            return {
                status: false,
                statusCode: 403,
                message: "Access denied. Admin privileges required.",
                data: {}
            };
        }

        // Generate access token
        const accessToken = await createAccessToken(user.id, user.role);
        const refreshToken = await createRefreshToken(user.id, user.role);

        await ioredis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

        return {
            status: true,
            statusCode: 200,
            message: "Admin login successful",
            data: {
                accessToken,
                userId: user.id,
                role: user.role
            }
        };
    } catch (error) {
        console.error(error);
        return {
            status: false,
            statusCode: 500,
            message: "Login failed",
            data: {}
        };
    }
}
