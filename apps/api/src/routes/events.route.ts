import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import {
    createEventSchema,
    EventParamSchema,
    getEventsQuerySchema,
    eventRegistrationSchema,
    eventPatchSchema,
    roundPatchSchema,
    basePrizeSchema,
    paginationSchema,
    getEventCheckInsParamSchema,
    getEventParticipantsParamSchema,
    assignVolunteersSchema,
} from "@melinia/shared"

import sql from "../db/connection"
import {
    createEvent,
    deleteEvent,
    getEventById,
    getEvents,
    listEvents,
    updateEvent,
    updateEventRound,
    updateEventPrize,
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
    deregisterUser,
    getEventRegCount,
    getEventRegistrations,
    getEventCheckIns,
    getEventCheckInsCount,
    getEventParticipants,
    getEventParticipantsCount,
    assignVolunteersToEvent
} from "../db/queries"
import {
    authMiddleware,
    adminOnlyMiddleware,
    participantOnlyMiddleware,
    opsAuthMiddleware,
    adminAndOrganizerMiddleware,
} from "../middleware/auth.middleware"
import { HTTPException } from "hono/http-exception"
import { paymentStatusMiddleware } from "../middleware/paymentStatus.middleware"
import { Http2ServerRequest } from "http2"

export const events = new Hono()

events.get("/", zValidator("query", getEventsQuerySchema), async c => {
    try {
        const { expand } = c.req.valid("query")

        if (!expand) {
            const events = await listEvents()
            return c.json({ events }, 200)
        }

        const events = await getEvents()
        return c.json({ events }, 200)
    } catch (err) {
        console.error(err)
        throw new HTTPException(500, { message: "Failed to fetch events" })
    }
})

events.get("/:id", zValidator("param", EventParamSchema), async c => {
    try {
        const { id } = c.req.valid("param")
        const event = await getEventById(id)
        return c.json({ event }, 200)
    } catch (err) {
        console.error(err)
        if (err instanceof HTTPException) {
            throw err
        }
        throw new HTTPException(500, { message: "Failed to fetch event" })
    }
})

events.get("/:id/status", authMiddleware, zValidator("param", EventParamSchema), async c => {
    try {
        const { id } = c.req.valid("param")
        const userId = c.get("user_id")
        const regStatus = await getUserRegStatus(id, userId)
        return c.json({ ...regStatus }, 200)
    } catch (err) {
        console.error(err)
        if (err instanceof HTTPException) {
            throw err
        }
        throw new HTTPException(500, { message: "Failed to fetch event registration status" })
    }
})

events.post(
    "/:id/volunteers",
    authMiddleware,
    adminAndOrganizerMiddleware,
    zValidator("param", EventParamSchema),
    zValidator("json", assignVolunteersSchema),
    async (c) => {
        try {
            const userId = c.get("user_id");
            const { id } = c.req.valid("param");
            const { volunteer_ids } = c.req.valid("json");

            const result = await assignVolunteersToEvent(id, volunteer_ids, userId);

            if (result.isErr) {
                const { code, message } = result.error;

                switch (code) {
                    case "event_not_found":
                    case "permission_denied":
                    case "empty_volunteer_list":
                    case "volunteers_not_found":
                    case "invalid_volunteer_role":
                    case "volunteer_already_assigned":
                        return c.json({ message }, 400);

                    case "internal_error":
                    default:
                        console.error("Unexpected error assigning volunteers:", result.error);
                        return c.json({ message }, 500);
                }
            }

            return c.json({
                success: true,
                event_id: id,
                volunteers: result.value.map((v) => v.user_id),
                message: `Volunteers assigned to event ${id}`,
            }, 201);
        } catch (err) {
            console.error("Unhandled exception in /:id/volunteer:", err);
            return c.json({
                message: "Unexpected error occurred while assigning volunteers"
            }, 500);
        }
    }
);

events.post(
    "/",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("json", createEventSchema),
    async c => {
        try {
            const data = c.req.valid("json")
            const userId = c.get("user_id")

            const event = await createEvent(userId, data)

            return c.json(
                {
                    data: event,
                    message: "Event created successfully",
                },
                201
            )
        } catch (err) {
            console.error(err)
            throw new HTTPException(500, { message: "Failed to create event" })
        }
    }
)

events.delete(
    "/:id",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("param", EventParamSchema),
    async c => {
        try {
            const { id } = c.req.valid("param")
            const deletedEvent = await deleteEvent(id)

            return c.json(
                {
                    message: "Event deleted successfully",
                    event: deletedEvent,
                },
                200
            )
        } catch (err) {
            console.error(err)
            if (err instanceof HTTPException) {
                throw err
            }
            throw new HTTPException(500, { message: "Failed to delete event" })
        }
    }
)

events.patch(
    "/:id",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("param", EventParamSchema),
    zValidator("json", eventPatchSchema),

    async c => {
        try {
            const { id } = c.req.valid("param")
            const updates = c.req.valid("json")

            // Apply updates
            const updatedEvent = await updateEvent(id, updates)

            return c.json(
                {
                    message: "Event updated successfully",
                    event: updatedEvent,
                },
                200
            )
        } catch (err) {
            console.error(err)
            if (err instanceof HTTPException) {
                throw err
            }
            throw new HTTPException(500, { message: "Failed to update event" })
        }
    }
)

// Round update endpoint
events.patch(
    "/:eventId/rounds/:roundNo",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator(
        "param",
        z.object({
            eventId: z.string(),
            roundNo: z.coerce.number(),
        })
    ),
    zValidator("json", roundPatchSchema),
    async c => {
        try {
            const { eventId, roundNo } = c.req.valid("param")
            const updates = c.req.valid("json")

            // Apply updates
            const updatedRound = await updateEventRound(eventId, roundNo, updates)

            return c.json(
                {
                    message: "Round updated successfully",
                    round: updatedRound,
                },
                200
            )
        } catch (err) {
            if (err instanceof HTTPException) {
                throw err
            }
            throw new HTTPException(500, { message: "Failed to update round" })
        }
    }
)

// Prize update endpoint
events.patch(
    "/:eventId/prizes/:position",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator(
        "param",
        z.object({
            eventId: z.string(),
            position: z.coerce.number(),
        })
    ),
    zValidator("json", basePrizeSchema.partial()),
    async c => {
        try {
            const { eventId, position } = c.req.valid("param")
            const updates = c.req.valid("json")

            // Verify the prize belongs to the event
            const [prize] = await sql`
                SELECT 1 FROM event_prizes 
                WHERE position = ${position} AND event_id = ${eventId}
            `

            if (!prize) {
                throw new HTTPException(404, {
                    message: "Prize not found or does not belong to this event",
                })
            }

            // Apply updates
            const updatedPrize = await updateEventPrize(eventId, position, updates)

            return c.json(
                {
                    message: "Prize updated successfully",
                    prize: updatedPrize,
                },
                200
            )
        } catch (err) {
            console.error(err)
            if (err instanceof HTTPException) {
                throw err
            }
            throw new HTTPException(500, { message: "Failed to update prize" })
        }
    }
)

// TODO: PATCH /events/:id ==> [DONE]
// TODO: PATCH /events/:eventId/rounds/:roundNo ==> [DONE]
// TODO: PATCH /events/:eventId/prizes/:position ==> [DONE]
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
    async c => {
        const userId = c.get("user_id")
        const eventId = c.req.param("id")!
        const { team_id, registration_type } = c.req.valid("json")

        // Check if event exists
        const event = await getEventById(eventId)
        if (!event) {
            throw new HTTPException(404, { message: "Event not found" })
        }

        // is Flagship event
        if (event.event_type === 'flagship') {
            throw new HTTPException(403, { message: "Flagship events should be registered via Unstop platform" });
        }

        // Validate registration window
        // const now = new Date()
        // const regStart = new Date(event.registration_start)
        // const regEnd = new Date(event.registration_end)

        // if (now < regStart) {
        //     throw new HTTPException(400, {
        //         message: "Registration has not started yet for this event",
        //     })
        // }

        // if (now > regEnd) {
        //     throw new HTTPException(400, {
        //         message: "Registration has ended for this event",
        //     })
        // }

        // Validate participation type matches event type
        // if (event.participation_type !== registration_type) {
        //     throw new HTTPException(400, {
        //         message: `This event requires ${event.participation_type} participation`
        //     });
        // }
        
        const now = new Date();
        if(now > event.end_time){
            throw new HTTPException(401, {
                message:"Game Over! event has ended"
            })
        }
        // SOLO REGISTRATION
        if (registration_type === "solo") {
            // Solo event: teamId should not be provided
            if (team_id) {
                throw new HTTPException(400, {
                    message: "Team registration not allowed for solo events",
                })
            }

            if (event.min_team_size > 1) {
                throw new HTTPException(400, {
                    message: "Solo registration not applicable for this event",
                })
            }

            //Check if user already registered for this event (solo)
            const alreadyRegisteredSolo = await isUserRegisteredAlready(eventId, userId)
            if (alreadyRegisteredSolo) {
                throw new HTTPException(409, {
                    message: "You are already registered for this event",
                })
            }

            //Check max registration limit
            const registrationCount = await getEventRegistrationCount(eventId)
            if (registrationCount >= event.max_allowed) {
                throw new HTTPException(400, {
                    message: `Event is full. Maximum ${event.max_allowed} registrations allowed`,
                })
            }

            //Register solo user
            const registration = await insertSoloRegistration(eventId, userId)

            return c.json(
                {
                    message: "Solo registration successful",
                    data: registration,
                },
                201
            )
        }

        // TEAM REGISTRATION
        if (registration_type === "team") {
            // Team event: teamId is required
            if (!team_id) {
                throw new HTTPException(400, {
                    message: "Team ID is required for team events",
                })
            }

            //Check if team exists and get leader
            const teamLeaderId = await getTeamLeaderId(team_id)
            if (!teamLeaderId) {
                throw new HTTPException(404, { message: "Team not found" })
            }

            // Only team leader can register
            if (teamLeaderId !== userId) {
                throw new HTTPException(403, {
                    message: "Only team leader can register the team for events",
                })
            }

            // Check if team already registered
            const teamAlreadyRegistered = await isTeamRegisteredAlready(eventId, team_id)
            if (teamAlreadyRegistered) {
                throw new HTTPException(409, {
                    message: "Team is already registered for this event",
                })
            }

            // Get all team members
            const memberIds = await getTeamMemberIds(team_id)
            const teamSize = memberIds.length

            // Validate team has members
            if (teamSize === 0) {
                throw new HTTPException(400, {
                    message: "Cannot register an empty team",
                })
            }

            // Validate team size constraints
            if (event.min_team_size && teamSize < event.min_team_size) {
                throw new HTTPException(400, {
                    message: `Team size (${teamSize}) is less than minimum required (${event.min_team_size})`,
                })
            }

            if (event.max_team_size && teamSize > event.max_team_size) {
                throw new HTTPException(400, {
                    message: `Team size (${teamSize}) exceeds maximum allowed (${event.max_team_size})`,
                })
            }

            // Check if any team member already registered for this event
            const conflictingMembers = await getConflictingTeamMembers(eventId, memberIds)
            if (conflictingMembers.length > 0) {
                const conflictingEmails = conflictingMembers.map((r: any) => r.email).join(", ")
                throw new HTTPException(409, {
                    message: `Cannot register team. Following members are already registered for this event: ${conflictingEmails}`,
                })
            }

            // Check max team registration limit
            const teamRegistrationCount = await getEventTeamRegistrationCount(eventId)
            if (teamRegistrationCount >= event.max_allowed) {
                throw new HTTPException(400, {
                    message: `Event is full. Maximum ${event.max_allowed} teams allowed`,
                })
            }

            // Register all team members
            for (const memberId of memberIds) {
                await insertTeamRegistration(eventId, team_id, memberId)
            }

            return c.json(
                {
                    message: "Team registration successful",
                    data: {
                        team_id: team_id,
                        team_size: teamSize,
                        event_id: eventId,
                    },
                },
                201
            )
        }

        // invalid participation type
        throw new HTTPException(400, {
            message: "Invalid participation type. Must be 'solo' or 'team'",
        })
    }
)

events.delete(
    "/:id/registrations",
    authMiddleware,
    participantOnlyMiddleware,
    paymentStatusMiddleware,
    async c => {
        const userId = c.get("user_id")
        const eventId = c.req.param("id")

        // Check if event exists
        const event = await getEventById(eventId)
        if (!event) {
            throw new HTTPException(404, { message: "Event not found" })
        }

        // Check if user is registered
        const record = await getRegistrationRecordForUser(userId, eventId)
        if (!record) {
            throw new HTTPException(400, {
                message: "You are not registered for this event",
            })
        }

        // Handle team registration
        if (record.team_id) {
            // Check if user is team leader
            const isLeader = await isTeamLeader(userId, record.team_id)
            if (!isLeader) {
                throw new HTTPException(403, {
                    message: "Only team leader can unregister the team",
                })
            }

            // Deregister entire team
            await deregisterTeam(record.team_id, eventId)

            return c.json({ message: "Team unregistered successfully from the event" }, 200)
        }

        // else solo registration
        await deregisterUser(userId, eventId)

        return c.json({ message: "Unregistered successfully from the event" }, 200)
    }
)

events.get(
    "/:id/registrations",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("query", paginationSchema),
    async (c) => {
        const id = c.req.param("id");
        const { from, limit } = c.req.valid("query");

        const eventRegResult = await getEventRegistrations(id, from, limit);
        if (eventRegResult.isErr) {
            switch (eventRegResult.error.code) {
                case "event_not_found":
                    return c.json({ message: eventRegResult.error.message }, 404);
                case "internal_error":
                    return c.json({ message: eventRegResult.error.message }, 500);
            }
        }
        const eventRegs = eventRegResult.value;

        const eventRegCountResult = await getEventRegCount(id);
        if (eventRegCountResult.isErr) {
            switch (eventRegCountResult.error.code) {
                case "internal_error":
                    return c.json({ message: eventRegCountResult.error.message }, 500);
            }
        }
        const eventRegCount = eventRegCountResult.value;

        return c.json({
            data: eventRegs,
            pagination: {
                from: from,
                limit: limit,
                total: eventRegCount,
                returned: eventRegs.length,
                has_more: (from + eventRegs.length) < eventRegCount
            }
        }, 200)

    }
)

events.get(
    "/:eventId/rounds/:roundNo/participants",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("param", getEventParticipantsParamSchema),
    zValidator("query", paginationSchema),
    async (c) => {
        const { eventId, roundNo } = c.req.valid("param");
        const { from, limit } = c.req.valid("query");

        const eventParticipantsResult = await getEventParticipants(eventId, roundNo, from, limit)

        if (eventParticipantsResult.isErr) {
            const error = eventParticipantsResult.error;
            switch (error.code) {
                case "event_or_round_not_found":
                    return c.json({ message: error.message }, 404);
                case "internal_error":
                    return c.json({ message: error.message }, 500);
            }
        }
        const eventParticipants = eventParticipantsResult.value;

        const eventParticipantsCountResult = await getEventParticipantsCount(eventId, roundNo);
        if (eventParticipantsCountResult.isErr) {
            const error = eventParticipantsCountResult.error;

            switch (error.code) {
                case "event_or_round_not_found":
                    return c.json({ message: error.message }, 404);
                case "internal_error":
                    return c.json({ message: error.message }, 500);
            }
        }
        const eventParticipantsCount = eventParticipantsCountResult.value;

        return c.json({
            data: eventParticipants,
            pagination: {
                from: from,
                limit: limit,
                total: eventParticipantsCount,
                returned: eventParticipants.length,
                has_more: (from + eventParticipants.length) < eventParticipantsCount
            }
        }, 200)
    }
)

events.get(
    "/:eventId/rounds/:roundId/checkins",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("param", getEventCheckInsParamSchema),
    zValidator("query", paginationSchema),
    async (c) => {
        const { eventId, roundId } = c.req.valid("param");
        const { from, limit } = c.req.valid("query");

        const eventCheckInsResult = await getEventCheckIns(eventId, roundId, from, limit);
        if (eventCheckInsResult.isErr) {
            const error = eventCheckInsResult.error;

            switch (error.code) {
                case "event_or_round_not_found":
                    return c.json({ message: error.message }, 404);
                case "internal_error":
                    return c.json({ message: error.message }, 500);
            }
        }
        const eventCheckIns = eventCheckInsResult.value;

        const eventCheckInsCountResult = await getEventCheckInsCount(eventId, roundId);
        if (eventCheckInsCountResult.isErr) {
            const error = eventCheckInsCountResult.error;

            switch (error.code) {
                case "internal_error":
                    return c.json({ message: error.message }, 500);
            }
        }
        const eventCheckInsCount = eventCheckInsCountResult.value;

        return c.json({
            data: eventCheckIns,
            pagination: {
                from: from,
                limit: limit,
                total: eventCheckInsCount,
                returned: eventCheckIns.length,
                has_more: (from + eventCheckIns.length) < eventCheckInsCount
            }
        }, 200)
    }
)



export default events
