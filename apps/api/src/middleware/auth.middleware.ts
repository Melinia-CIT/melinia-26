import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../utils/jwt";
import { isUserSuspended } from "../db/queries";

type Variables = {
    user_id: string,
    role: string
}

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const authzHeader = c.req.header("Authorization");

    if (!authzHeader?.startsWith("Bearer ")) {
        throw new HTTPException(401, { message: "Invalid authorization header" });
    }

    const token = authzHeader.substring(7);

    if (!token) {
        throw new HTTPException(401, { message: "Access token not found" });
    }

    try {
        const { id, role } = await verifyToken(token) as { id: string, role: string };

        if (await isUserSuspended(id)) {
            return c.json({ message: "Your account has been suspended" }, 403);
        }

        c.set("user_id", id);
        c.set("role", role);
        await next();
    } catch {
        throw new HTTPException(401, { message: "Invalid or expired token" });
    }
});

type RoleCheckConfig = {
    allowedRoles: string[];
    errorMessage: string;
};

const createRoleMiddleware = (config: RoleCheckConfig) =>
    createMiddleware<{ Variables: Variables }>(async (c, next) => {
        const role = c.get("role");
        if (!config.allowedRoles.includes(role)) {
            throw new HTTPException(403, { message: config.errorMessage });
        }
        await next();
    });

export const adminOnlyMiddleware = createRoleMiddleware({
    allowedRoles: ["ADMIN"],
    errorMessage: "Admin access required"
});

export const adminAndOrganizerMiddleware = createRoleMiddleware({
    allowedRoles: ["ADMIN", "ORGANIZER"],
    errorMessage: "Admin or organizer access required"
});

export const participantOnlyMiddleware = createRoleMiddleware({
    allowedRoles: ["PARTICIPANT"],
    errorMessage: "Participant access required"
});

export const opsAuthMiddleware = createRoleMiddleware({
    allowedRoles: ["ADMIN", "ORGANIZER", "VOLUNTEER"],
    errorMessage: "Access denied"
});
