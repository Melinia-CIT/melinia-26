import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { sendError } from '../utils/response';

type Roles = {
    role_id: string;
    user_id: string;
};

type Variables = {
    role_id: string;
    user_id: string;
};

export const getUserRole = createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const token = await getCookie(c, 'access-token');
    
    if (!token) {
        return sendError(c, "Forbidden", 401);
    }
    
    try {
        const decodedPayload = await verify(token, String(process.env['JWT_SECRET_KEY'])) as Roles;
        const { role_id, user_id } = decodedPayload;
        
        c.set("role_id", role_id);
        c.set("user_id", user_id);
        
        await next();
    } catch (error) {
        return sendError(c, "Invalid token", 401);
    }
});