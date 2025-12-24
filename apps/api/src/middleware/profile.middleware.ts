import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

type Attributes = {
    user_id: string;
};

type Variables = {
    user_id: string;
};

export const getUserID = createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const token = getCookie(c, 'access-token');
    
    if (!token) {
        return c.json({Status : false, msg: "Forbidden"}, 401);
    }
    
    try {
        const decodedPayload = await verify(token, String(process.env['JWT_SECRET_KEY'])) as Attributes;
        const { user_id } = decodedPayload;
        
        c.set("user_id", user_id);
        
        await next();
    } catch (error) {
        return c.json({status : false, msg: "Invalid token"} ,401);
    }
});
