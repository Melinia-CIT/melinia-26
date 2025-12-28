import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
    createEventSchema,
    getEventDetailsSchema,
    deleteEventSchema,
    updateEventDetailsSchema,
    eventRegistrationSchema
} from "@packages/shared/dist";
import {
    createEvent, 
    getEvents, 
    getEventById, 
    deleteEvent, 
    updateEvent, 
    registerForEvent, 
    getUserEventRegistrations
} from "../db/queries";
import { sendError, sendSuccess } from "../utils/response";
import { 
    authMiddleware, 
    adminOnlyMiddleware, 
    adminAndOrganizerMiddleware, 
    participantOnlyMiddleware 
} from "../middleware/auth.middleware";
import { HTTPException } from "hono/http-exception";

export const events = new Hono();

// Create Event 
events.post("/create_event", authMiddleware, adminOnlyMiddleware, zValidator("json", createEventSchema), async (c) => {
    try {
        const formData = await c.req.valid('json');
        const { statusCode, status, data, message } = await createEvent(formData);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});

// Get All Events
events.get("/get_all_events", async (c) => {
    try {
        const { statusCode, status, data, message } = await getEvents();
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
});

// Get Event details by event_id
events.post("/get_event_details", zValidator("json", getEventDetailsSchema), async (c) => {
    try {
        const formData = await c.req.valid('json');
        const { statusCode, status, data, message } = await getEventById(formData);
        
        if (!data) {
            throw new HTTPException(404, { message: "Event not found" });
        }
        
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});

// Update Event 
events.post("/update_event_details", authMiddleware, adminAndOrganizerMiddleware, zValidator("json", updateEventDetailsSchema), async (c) => {
    try {
        const formData = await c.req.valid('json');
        const { statusCode, status, data, message } = await updateEvent(formData);
        
        if (!data) {
            return sendError(c, "Event not found", 404);
        }
        
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});

// Delete Event
events.post("/delete_event", authMiddleware, adminOnlyMiddleware, zValidator("json", deleteEventSchema), async (c) => {
    try {
        const formData = await c.req.valid('json');
        const { statusCode, status, data, message } = await deleteEvent(formData);
        
        if (!data) {
            throw new HTTPException(404, { message: "Event not found" });
        }
        
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});

// Register for Event
events.post("/register", authMiddleware, participantOnlyMiddleware, zValidator("json", eventRegistrationSchema), async (c) => {
    try {
        const user_id = c.get('user_id');
        const formData = await c.req.valid('json');
        
        const { statusCode, status, data, message } = await registerForEvent({ ...formData, user_id });
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Registration error:", error);
        return sendError(c);
    }
});

// Get My Registrations
events.get("/my-registrations", authMiddleware, async (c) => {
    try {
        const user_id = c.get("user_id");
        const { statusCode, status, data, message } = await getUserEventRegistrations(user_id);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
});
