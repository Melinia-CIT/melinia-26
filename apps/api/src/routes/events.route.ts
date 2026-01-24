import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createEventSchema, EventParamSchema, getEventsQuerySchema } from "@melinia/shared";
import { createEvent, deleteEvent, getEventById, getEvents, listEvents } from "../db/queries";
import {
    authMiddleware,
    adminOnlyMiddleware,
} from "../middleware/auth.middleware";
import { HTTPException } from "hono/http-exception";

export const events = new Hono();

events.post(
    "/",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("json", createEventSchema),
    async (c) => {
        try {
            const data = c.req.valid("json");
            const userId = c.get("user_id");

            const event = await createEvent(userId, data);

            return c.json({
                data: event,
                message: "Event created successfully"
            }, 201);
        } catch (err) {
            console.error(err);
            throw new HTTPException(500, { message: "Failed to create event" });
        }
    }
);

events.get(
    "/",
    zValidator("query", getEventsQuerySchema),
    async (c) => {
        try {
            const { expand } = c.req.valid("query");

            if (!expand) {
                const events = await listEvents();
                return c.json({ events }, 200);
            }

            const events = await getEvents();
            return c.json({ events }, 200);
        } catch (err) {
            console.error(err);
            throw new HTTPException(500, { message: "Failed to fetch events" });
        }
    }
)

events.get(
    "/:id",
    zValidator("param", EventParamSchema),
    async (c) => {
        try {
            const { id } = c.req.valid("param");
            const event = await getEventById(id);
            return c.json({ event }, 200);
        } catch (err) {
            console.error(err);
            if (err instanceof HTTPException) {
                throw err;
            }
            throw new HTTPException(500, { message: "Failed to fetch event" });
        }
    }
)

events.delete(
    "/:id",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("param", EventParamSchema),
    async (c) => {
        try {
            const { id } = c.req.valid("param");
            const deletedEvent = await deleteEvent(id);

            return c.json({
                message: "Event deleted successfully",
                event: deletedEvent
            }, 200);
        } catch (err) {
            console.error(err);
            if (err instanceof HTTPException) {
                throw err;
            }
            throw new HTTPException(500, { message: "Failed to delete event" });
        }
    }
)

// TODO: PATCH /events/:id 
// TODO: POST /events/:id/registrations
// TODO: DELETE /events/:id/registrations/:id
// TODO: GET /users/me/events define this endpoint in users.routes.ts
// TODO: POST /events/:eventid/rounds "createEventRoundsSchema" ZOD Schema
// TODO: DELETE /events/:eventid/rounds/:roundid
// TODO: POST /events/:eventid/rounds/:roundid/rules/:ruleid
// TODO: DELETE /events/:eventid/rounds/:roundid/rules/ "createEventRoundRulesSchema" ZOD Schema
// TODO: DELETE /events/:eventid/crews?user_id=:id&role='organizer|volunteer'
// TODO: POST /events/:id/crews {user_id: user_id, role='organizer|volunteer'}





// // Fetch all the events that a user is registered to
// events.get("/registered", authMiddleware, async (c) => {
//     try {
//         const userId = c.get('user_id');
//         const { statusCode, status, data, message } = await getRegisteredEventsByUser(userId);
// 
//         return sendSuccess(c, data, message, status, statusCode);
//     } catch (error: unknown) {
//         console.error("Error fetching user registered events:", error);
//         return sendError(c);
//     }
// });
// 
// // Get All Events
// events.get("", async (c) => {
//     try {
//         const { statusCode, status, data, message } = await getEvents();
//         return sendSuccess(c, data, message, status, statusCode);
//     } catch (error: unknown) {
//         console.error("Error details:", error);
//         return sendError(c);
//     }
// });
// 
// //To get the details of the specific event
// events.get("/:id", zValidator("param", getEventDetailsSchema),
//     async (c) => {
//         try {
//             const { id } = c.req.valid('param');
//             const formData = { id };
//             const { statusCode, status, data, message } = await getEventById(formData);
// 
//             if (!data) {
//                 throw new HTTPException(404, { message: "Event not found" });
//             }
// 
//             return sendSuccess(c, data, message, status, statusCode);
//         } catch (error: unknown) {
//             console.error(error);
//             return sendError(c);
//         }
//     }
// );
// 
// // Update Event 
// events.patch("/:id",
//     authMiddleware,
//     adminAndOrganizerMiddleware,
//     zValidator("param", getEventDetailsSchema),
//     zValidator("json", updateEventDetailsSchema), async (c) => {
//         try {
//             const { id } = c.req.valid('param');
//             const updateData = await c.req.valid('json');
//             const formData = { ...updateData, id };
//             const { statusCode, status, data, message } = await updateEvent(formData);
// 
//             if (!data) {
//                 return sendError(c, "Event not found", 404);
//             }
// 
//             return sendSuccess(c, data, message, status, statusCode);
//         } catch (error: unknown) {
//             console.error(error);
//             return sendError(c);
//         }
//     });
// 
// // Delete Event
// events.delete("/:id", authMiddleware, adminOnlyMiddleware, zValidator("param", getEventDetailsSchema), async (c) => {
//     try {
//         const { id } = c.req.valid('param');
//         const formData = { id };
//         const { statusCode, status, data, message } = await deleteEvent(formData);
// 
//         if (!data) {
//             throw new HTTPException(404, { message: "Event not found" });
//         }
// 
//         return sendSuccess(c, data, message, status, statusCode);
//     } catch (error: unknown) {
//         console.error(error);
//         return sendError(c);
//     }
// });
// 
// // Register for Event
// events.post("/:id/register",
//     authMiddleware,
//     participantOnlyMiddleware,
//     paymentStatusMiddleware,
//     zValidator("param", getEventDetailsSchema),
//     zValidator("json", eventRegistrationSchema),
//     async (c) => {
//         try {
//             const userId = c.get('user_id');
//             const { id } = c.req.valid('param');
//             const formData = await c.req.valid('json');
// 
//             const { statusCode, status, data, message } = await registerForEvent({
//                 ...formData,
//                 userId,
//                 id
//             });
//             return sendSuccess(c, data, message, status, statusCode);
//         } catch (error: unknown) {
//             console.error("Registration error:", error);
//             return sendError(c);
//         }
//     });
// 
// // Unregister from Event
// events.post("/:id/unregister",
//     authMiddleware,
//     participantOnlyMiddleware,
//     zValidator("param", getEventDetailsSchema),
//     zValidator("json", unregisterEventSchema),
//     async (c) => {
//         try {
//             const userId = c.get('user_id');
//             const { id: eventId } = c.req.valid('param');
//             const { participationType, teamId } = c.req.valid('json');
// 
//             const { statusCode, status, data, message } = await unregisterFromEvent({
//                 eventId,
//                 userId,
//                 participationType,
//                 teamId
//             });
// 
//             return sendSuccess(c, data, message, status, statusCode);
//         } catch (error: unknown) {
//             console.error("Unregistration route error:", error);
//             return sendError(c);
//         }
//     }
// );
// 
// // Check Registration Status for a specific event
// events.get("/:id/status", authMiddleware, zValidator("param", getEventDetailsSchema), async (c) => {
//     try {
//         const userId = c.get('user_id');
//         const { id: eventId } = c.req.valid('param');
//         const teamId = c.req.query('teamId');
// 
//         const result = await getUserEventStatusbyEventId(userId, eventId, teamId);
// 
//         return sendSuccess(
//             c,
//             result.data,
//             result.message,
//             result.status,
//             result.statusCode
//         );
//     } catch (error: unknown) {
//         console.error("Error fetching registration status:", error);
//         return sendError(c);
//     }
// });
// 
// ;

export default events;

