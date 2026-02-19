import { Hono } from "hono"
import { authMiddleware, opsAuthMiddleware } from "../middleware/auth.middleware"
import { zValidator } from "@hono/zod-validator"
import {
    checkInParamSchema,
    assignRoundResultsSchema,
    getRoundResultsQuerySchema,
    eventRoundCheckInSchema,
    assignPrizesSchema,
} from "@packages/shared/dist"
import {
    checkInParticipant,
    assignRoundResults,
    getRoundResults,
    getTeamsForOperations,
    checkInParticipantToRound,
    assignEventPrizes,
} from "../db/queries"
import { z } from "zod"

export const ops = new Hono()

ops.post(
    "/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("json", checkInParamSchema),
    async c => {
        const checkInBy = c.get("user_id")
        const { participant_id } = c.req.valid("json")

        const checkIn = await checkInParticipant(participant_id, checkInBy)
        if (checkIn.isErr) {
            const message = checkIn.error.message

            switch (checkIn.error.code) {
                case "user_not_found":
                    return c.json({ message }, 404)
                case "already_checked_in":
                    return c.json({ message }, 409)
                case "internal_error":
                    return c.json({ message }, 500)
                case "payment_pending":
                    return c.json({ message }, 402)
            }
        }

        return c.json({ ...checkIn.value }, 200)
    }
)

/**
 * POST /api/ops/events/:eventId/rounds/:roundNo/check-in
 * Check in participant to a specific event round
 */
ops.post(
    "/events/:eventId/rounds/:roundNo/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("json", eventRoundCheckInSchema),
    async c => {
        const checkInBy = c.get("user_id")
        const eventId = c.req.param("eventId")
        const roundNo = parseInt(c.req.param("roundNo"), 10)
        const data = c.req.valid("json")

        const checkIn = await checkInParticipantToRound(eventId, roundNo, data, checkInBy)

        if (checkIn.isErr) {
            const { code, message } = checkIn.error

            switch (code) {
                case "round_not_found":
                    return c.json({ message }, 404)
                case "user_not_registered":
                    return c.json({ message }, 404)
                case "not_checked_in_globally":
                    return c.json({ message }, 400)
                case "already_checked_in":
                    return c.json({ message }, 409)
                case "internal_error":
                    return c.json({ message }, 500)
            }
        }

        return c.json(checkIn.value, 201)
    }
)

// Schema for route params
const roundResultsParamSchema = z.object({
    eventId: z.string(),
    roundNo: z.string().transform(val => parseInt(val, 10)),
})

/**
 * POST /api/ops/events/:eventId/rounds/:roundNo/results
 * Assign/update round results (points and status)
 */
ops.post(
    "/events/:eventId/rounds/:roundNo/results",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("param", roundResultsParamSchema),
    zValidator("json", assignRoundResultsSchema),
    async c => {
        const evalBy = c.get("user_id")
        const { eventId, roundNo } = c.req.valid("param")
        const { results } = c.req.valid("json")

        const result = await assignRoundResults(eventId, roundNo, results, evalBy)

        if (result.isErr) {
            const { code, message } = result.error

            switch (code) {
                case "round_not_found":
                    return c.json({ message }, 404)
                case "participant_not_found":
                    return c.json({ message }, 404)
                case "participant_not_checked_in":
                    return c.json({ message }, 400)
                case "participant_not_checked_in_to_round":
                    return c.json({ message }, 400)
                case "invalid_data":
                    return c.json({ message }, 400)
                case "internal_error":
                    return c.json({ message }, 500)
            }
        }

        const data = result.value
        const totalRequested = results.length
        const recorded = data.recorded_count
        const failed = data.user_errors.length + data.team_errors.length

        // All failed - nothing was recorded
        if (recorded === 0) {
            return c.json(
                {
                    message: "Failed to record any round results",
                    data: {
                        recorded_count: 0,
                        results: [],
                    },
                    user_errors: data.user_errors,
                    team_errors: data.team_errors,
                },
                400
            )
        }

        // Some succeeded, some failed - partial success
        if (recorded > 0 && failed > 0) {
            return c.json(
                {
                    message: `Partially recorded round results: ${recorded}/${totalRequested} succeeded`,
                    data: {
                        recorded_count: recorded,
                        results: data.results,
                    },
                    user_errors: data.user_errors,
                    team_errors: data.team_errors,
                },
                207
            ) // 207 Multi-Status
        }

        // All succeeded
        return c.json(
            {
                message: "Round results recorded successfully",
                data: {
                    recorded_count: recorded,
                    results: data.results,
                },
            },
            201
        )
    }
)

/**
 * GET /api/ops/events/:eventId/rounds/:roundNo/results
 * Get all results for a specific round with participant details
 */
ops.get(
    "/events/:eventId/rounds/:roundNo/results",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("param", roundResultsParamSchema),
    zValidator("query", getRoundResultsQuerySchema),
    async c => {
        const { eventId, roundNo } = c.req.valid("param")
        const queryParams = c.req.valid("query")

        const result = await getRoundResults(eventId, roundNo, queryParams)

        if (result.isErr) {
            const { code, message } = result.error

            switch (code) {
                case "round_not_found":
                    return c.json({ message }, 404)
                case "internal_error":
                    return c.json({ message }, 500)
            }
        }

        return c.json(result.value, 200)
    }
)

/**
 * GET /api/ops/teams?user_id=MLNUXXXXXX
 * Get all teams for a specified user with detailed member information
 * Includes teams led by user and teams where user is a member
 * Shows member check-in status and events registered
 *
 * Query params:
 * - user_id: The user ID to fetch teams for (required)
 */
ops.get("/teams", authMiddleware, opsAuthMiddleware, async c => {
    const userId = c.req.query("user_id")

    if (!userId) {
        return c.json({ message: "user_id query parameter is required" }, 400)
    }

    const result = await getTeamsForOperations(userId)

    if (result.isErr) {
        const { code, message } = result.error

        switch (code) {
            case "internal_error":
                return c.json({ message }, 500)
        }
    }

    return c.json(
        {
            message: "Teams retrieved successfully",
            data: result.value,
        },
        200
    )
})

/**
 * POST /api/ops/events/:eventId/prizes
 * Assign event prizes (final results) to participants or teams
 */
ops.post(
    "/events/:eventId/prizes",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("json", assignPrizesSchema),
    async (c) => {
        const awardedBy = c.get("user_id")
        const eventId = c.req.param("eventId")
        const { results } = c.req.valid("json")

        const result = await assignEventPrizes(eventId, results, awardedBy)

        if (result.isErr) {
            const { code, message } = result.error

            switch (code) {
                case "event_not_found":
                    return c.json({ message }, 404)
                case "prize_not_found":
                    return c.json({ message }, 404)
                case "participant_not_checked_in":
                    return c.json({ message }, 400)
                case "invalid_data":
                    return c.json({ message }, 400)
                case "internal_error":
                    return c.json({ message }, 500)
            }
        }

        const data = result.value
        const totalRequested = results.length
        const recorded = data.recorded_count
        const failed = data.errors.length

        if (recorded === 0) {
            return c.json({
                message: "Failed to assign any prizes",
                data: {
                    recorded_count: 0,
                    results: [],
                },
                errors: data.errors,
            }, 400)
        }

        if (recorded > 0 && failed > 0) {
            return c.json({
                message: `Partially assigned prizes: ${recorded}/${totalRequested} succeeded`,
                data: {
                    recorded_count: recorded,
                    results: data.results,
                },
                errors: data.errors,
            }, 207)
        }

        return c.json({
            message: "Prizes assigned successfully",
            data: {
                recorded_count: recorded,
                results: data.results,
            },
        }, 201)
    }
)
