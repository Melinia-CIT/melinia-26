import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
    createEventSchema,
    getEventDetailsSchema,
    updateEventDetailsSchema,
    eventRegistrationSchema,
    unregisterEventSchema
} from "@melinia/shared";
import {
    createEvent, 
    getEvents, 
    getEventById, 
    deleteEvent, 
    updateEvent, 
    registerForEvent, 
    getUserEventStatusbyEventId,
    getRegisteredEventsByUser,
    unregisterFromEvent
} from "../db/queries";
import { sendError, sendSuccess } from "../utils/response";
import { 
    authMiddleware, 
    adminOnlyMiddleware, 
    adminAndOrganizerMiddleware, 
    participantOnlyMiddleware 
} from "../middleware/auth.middleware";
import { 
    paymentStatusMiddleware
} from "../middleware/paymentStatus.middleware";
import { HTTPException } from "hono/http-exception";

export const events = new Hono();

// Create Event 
events.post("", authMiddleware, adminOnlyMiddleware, zValidator("json", createEventSchema), async (c) => {
    try {
        const formData = await c.req.valid('json');
        const { statusCode, status, data, message } = await createEvent(formData);
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error(error);
        return sendError(c);
    }
});

// Fetch all the events that a user is registered to
events.get("/registered", authMiddleware, async (c) => {
    try {
        const userId = c.get('user_id');
        const { statusCode, status, data, message } = await getRegisteredEventsByUser(userId);
        
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error fetching user registered events:", error);
        return sendError(c);
    }
});

// Get All Events
events.get("", async (c) => {
    try {
        const { statusCode, status, data, message } = await getEvents();
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Error details:", error);
        return sendError(c);
    }
});

//To get the details of the specific event
events.get("/:id", zValidator("param", getEventDetailsSchema), 
  async (c) => {
    try {
      const { id } = c.req.valid('param'); 
      const formData = { id }; 
      const { statusCode, status, data, message } = await getEventById(formData);
      
      if (!data) {
        throw new HTTPException(404, { message: "Event not found" });
      }
      
      return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
      console.error(error);
      return sendError(c);
    }
  }
);

// Update Event 
events.patch("/:id", authMiddleware, adminAndOrganizerMiddleware, zValidator("param", getEventDetailsSchema), zValidator("json", updateEventDetailsSchema), async (c) => {
    try {
        const { id } = c.req.valid('param');
        const updateData = await c.req.valid('json');
        const formData = { ...updateData, id };
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
events.delete("/:id", authMiddleware, adminOnlyMiddleware, zValidator("param", getEventDetailsSchema), async (c) => {
    try {
        const { id } = c.req.valid('param');
        const formData = { id };
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
events.post("/:id/register", authMiddleware, participantOnlyMiddleware,paymentStatusMiddleware, zValidator("param", getEventDetailsSchema), zValidator("json", eventRegistrationSchema), async (c) => {
    try {
        const userId = c.get('user_id');
        const { id } = c.req.valid('param');
        const formData = await c.req.valid('json');  
        
        const { statusCode, status, data, message } = await registerForEvent({ 
            ...formData, 
            userId, 
            id 
        });
        return sendSuccess(c, data, message, status, statusCode);
    } catch (error: unknown) {
        console.error("Registration error:", error);
        return sendError(c);
    }
});

// Unregister from Event
events.post("/:id/unregister", 
    authMiddleware, 
    participantOnlyMiddleware, 
    zValidator("param", getEventDetailsSchema), 
    zValidator("json", unregisterEventSchema), 
    async (c) => {
        try {
            const userId = c.get('user_id'); 
            const { id: eventId } = c.req.valid('param');
            const { participationType, teamId } = c.req.valid('json');

            const { statusCode, status, data, message } = await unregisterFromEvent({
                eventId,
                userId,
                participationType,
                teamId
            });

            return sendSuccess(c, data, message, status, statusCode);
        } catch (error: unknown) {
            console.error("Unregistration route error:", error);
            return sendError(c);
        }
    }
);

// Check Registration Status for a specific event
events.get("/:id/status", authMiddleware, zValidator("param", getEventDetailsSchema), async (c) => {
    try {
        const userId = c.get('user_id'); 
        const { id: eventId } = c.req.valid('param');
        const teamId = c.req.query('teamId');

        const result = await getUserEventStatusbyEventId(userId, eventId, teamId);
        
        return sendSuccess(
            c, 
            result.data, 
            result.message, 
            result.status, 
            result.statusCode
        );
    } catch (error: unknown) {
        console.error("Error fetching registration status:", error);
        return sendError(c);
    }
});

