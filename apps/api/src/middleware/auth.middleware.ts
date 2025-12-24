import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../utils/jwt";

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
        c.set("user_id", id);
        c.set("role", role);
        await next();
    } catch {
        throw new HTTPException(401, { message: "Invalid or expired token" });
    }
});