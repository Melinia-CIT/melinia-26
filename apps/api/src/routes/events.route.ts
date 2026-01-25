import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createEventSchema, EventParamSchema, getEventsQuerySchema, eventRegistrationSchema, type EventRegistration } from "@melinia/shared";
import {
    createEvent,
    deleteEvent,
    getEventById,
    getEvents,
    listEvents,
    isTeamRegisteredAlready,
    isUserRegisteredAlready,
    getEventRegistrationCount,
    getEventTeamRegistrationCount,
    getConflictingTeamMembers,
    insertSoloRegistration,
    insertTeamRegistration,
    getTeamLeaderId,
    getTeamMemberIds,
    getRegistrationRecordForUser,
    getUserRegStatus,
    isTeamLeader,
    deregisterTeam,
    deregisterUser
} from "../db/queries";
import {
    authMiddleware,
    adminOnlyMiddleware,
    participantOnlyMiddleware,
} from "../middleware/auth.middleware";
import { HTTPException } from "hono/http-exception";
import { paymentStatusMiddleware } from "../middleware/paymentStatus.middleware";

export const events = new Hono();

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

events.get(
    "/:id/status",
    authMiddleware,
    zValidator("param", EventParamSchema),
    async (c) => {
        try {
            const { id } = c.req.valid("param");
            const userId = c.get("user_id");
            const regStatus = await getUserRegStatus(id, userId);
            return c.json({ ...regStatus }, 200);
        } catch (err) {
            console.error(err);
            if (err instanceof HTTPException) {
                throw err;
            }
            throw new HTTPException(500, { message: "Failed to fetch event registration status" });
        }
    }
)

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
// TODO: POST /events/:id/registrations ==> [DONE]
// TODO: DELETE /events/:id/registrations ==> [DONE]
// TODO: GET /users/me/events define this endpoint in users.routes.ts
// TODO: POST /events/:eventid/rounds "createEventRoundsSchema" ZOD Schema
// TODO: DELETE /events/:eventid/rounds/:roundid
// TODO: POST /events/:eventid/rounds/:roundid/rules/:ruleid
// TODO: DELETE /events/:eventid/rounds/:roundid/rules/ "createEventRoundRulesSchema" ZOD Schema
// TODO: DELETE /events/:eventid/crews?user_id=:id&role='organizer|volunteer'
// TODO: POST /events/:id/crews {user_id: user_id, role='organizer|volunteer'}

events.post(
    "/:id/registrations",
    authMiddleware,
    participantOnlyMiddleware,
    paymentStatusMiddleware,
    zValidator("json", eventRegistrationSchema),
    async (c) => {
        const userId = c.get("user_id");
        const eventId = c.req.param('id')!;
        const { team_id, registration_type } = c.req.valid("json");

        // Check if event exists
        const event = await getEventById(eventId);
        if (!event) {
            throw new HTTPException(404, { message: "Event not found" });
        }

        // Validate registration window
        const now = new Date();
        const regStart = new Date(event.registration_start);
        const regEnd = new Date(event.registration_end);

        if (now < regStart) {
            throw new HTTPException(400, {
                message: "Registration has not started yet for this event"
            });
        }

        if (now > regEnd) {
            throw new HTTPException(400, {
                message: "Registration has ended for this event"
            });
        }

        // Validate participation type matches event type
        if (event.participation_type !== registration_type) {
            throw new HTTPException(400, {
                message: `This event requires ${event.participation_type} participation`
            });
        }

        // SOLO REGISTRATION 
        if (registration_type === "solo") {
            // Solo event: teamId should not be provided
            if (team_id) {
                throw new HTTPException(400, {
                    message: "Team registration not allowed for solo events"
                });
            }

            //Check if user already registered for this event (solo)
            const alreadyRegisteredSolo = await isUserRegisteredAlready(eventId, userId);
            if (alreadyRegisteredSolo) {
                throw new HTTPException(409, {
                    message: "You are already registered for this event"
                });
            }

            //Check max registration limit
            const registrationCount = await getEventRegistrationCount(eventId);
            if (registrationCount >= event.max_allowed) {
                throw new HTTPException(400, {
                    message: `Event is full. Maximum ${event.max_allowed} registrations allowed`
                });
            }

            //Register solo user
            const registration = await insertSoloRegistration(eventId, userId);

            return c.json(
                {
                    message: "Solo registration successful",
                    data: registration
                },
                201
            );
        }

        // TEAM REGISTRATION 
        if (registration_type === "team") {
            // Team event: teamId is required
            if (!team_id) {
                throw new HTTPException(400, {
                    message: "Team ID is required for team events"
                });
            }

            //Check if team exists and get leader
            const teamLeaderId = await getTeamLeaderId(team_id);
            if (!teamLeaderId) {
                throw new HTTPException(404, { message: "Team not found" });
            }

            // Only team leader can register
            if (teamLeaderId !== userId) {
                throw new HTTPException(403, {
                    message: "Only team leader can register the team for events"
                });
            }

            // Check if team already registered
            const teamAlreadyRegistered = await isTeamRegisteredAlready(eventId, team_id);
            if (teamAlreadyRegistered) {
                throw new HTTPException(409, {
                    message: "Team is already registered for this event"
                });
            }

            // Get all team members
            const memberIds = await getTeamMemberIds(team_id);
            const teamSize = memberIds.length;

            // Validate team has members
            if (teamSize === 0) {
                throw new HTTPException(400, {
                    message: "Cannot register an empty team"
                });
            }

            // Validate team size constraints
            if (event.min_team_size && teamSize < event.min_team_size) {
                throw new HTTPException(400, {
                    message: `Team size (${teamSize}) is less than minimum required (${event.min_team_size})`
                });
            }

            if (event.max_team_size && teamSize > event.max_team_size) {
                throw new HTTPException(400, {
                    message: `Team size (${teamSize}) exceeds maximum allowed (${event.max_team_size})`
                });
            }

            // Check if any team member already registered for this event
            const conflictingMembers = await getConflictingTeamMembers(eventId, memberIds);
            if (conflictingMembers.length > 0) {
                const conflictingEmails = conflictingMembers.map((r: any) => r.email).join(", ");
                throw new HTTPException(409, {
                    message: `Cannot register team. Following members are already registered for this event: ${conflictingEmails}`
                });
            }

            // Check max team registration limit
            const teamRegistrationCount = await getEventTeamRegistrationCount(eventId);
            if (teamRegistrationCount >= event.max_allowed) {
                throw new HTTPException(400, {
                    message: `Event is full. Maximum ${event.max_allowed} teams allowed`
                });
            }

            // Register all team members
            for (const memberId of memberIds) {
                await insertTeamRegistration(eventId, team_id, memberId);
            }

            return c.json(
                {
                    message: "Team registration successful",
                    data: {
                        team_id: team_id,
                        team_size: teamSize,
                        event_id: eventId
                    }
                },
                201
            );
        }

        // invalid participation type
        throw new HTTPException(400, {
            message: "Invalid participation type. Must be 'solo' or 'team'"
        });
    }
);
events.delete(
    "/:id/registrations",
    authMiddleware,
    participantOnlyMiddleware,
    paymentStatusMiddleware,
    async (c) => {
        const userId = c.get("user_id");
        const eventId = c.req.param("id");

        // Check if event exists
        const event = await getEventById(eventId);
        if (!event) {
            throw new HTTPException(404, { message: "Event not found" });
        }

        // Check if user is registered
        const record = await getRegistrationRecordForUser(userId, eventId);
        if (!record) {
            throw new HTTPException(400, {
                message: "You are not registered for this event"
            });
        }

        // Handle team registration
        if (record.team_id) {
            // Check if user is team leader
            const isLeader = await isTeamLeader(userId, record.team_id);
            if (!isLeader) {
                throw new HTTPException(403, {
                    message: "Only team leader can unregister the team"
                });
            }

            // Deregister entire team
            await deregisterTeam(record.team_id, eventId);

            return c.json(
                { message: "Team unregistered successfully from the event" },
                200
            );
        }

        // else solo registration
        await deregisterUser(userId, eventId);

        return c.json(
            { message: "Unregistered successfully from the event" },
            200
        );
    }
);


export default events;
