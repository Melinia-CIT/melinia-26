import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { adminLoginSchema } from "@packages/shared/dist/types/admin";
import { adminLogin } from "../db/queries/admin.queries";
import { sendError, sendSuccess } from "../utils/response";
export const adminAuth = new Hono(); 

adminAuth.post("/login", zValidator("json", adminLoginSchema), async (c) => {
    try {
        const input = await c.req.valid("json");
        const { statusCode, status, data, message } = await adminLogin(input,c);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});

export default adminAuth;
