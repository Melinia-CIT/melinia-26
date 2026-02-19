import { Hono } from "hono";
import { authMiddleware, opsAuthMiddleware } from "../middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { checkInParamSchema, paginationSchema } from "@packages/shared/dist";
import { checkInParticipant, getCheckIns, getTotalCheckIns } from "../db/queries";
import {
 	type ScanResult,
	type ScanError,
	type RoundCheckIn,
	type RoundCheckInError,
	baseScanResultSchema,
	baseRoundCheckInSchema,
	roundCheckInScanSchema,
	assignRoundResultsSchema,
	getRoundResultsQuerySchema,
	eventRoundCheckInSchema,
	assignPrizesSchema,
   roundCheckInParamSchema
} from "@melinia/shared";

import {
	checkInRoundParticipants, getRegistrationRecordForUser, scanUserForRound,
	assignRoundResults,
	getRoundResults,
	getTeamsForOperations,
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

ops.get(
    "/check-in",
    authMiddleware,
    opsAuthMiddleware,
    zValidator("query", paginationSchema),
    async (c) => {
        const { from, limit } = c.req.valid("query");

        const checkInsCountResult = await getTotalCheckIns();
        if (checkInsCountResult.isErr) {
            switch (checkInsCountResult.error.code) {
                case "internal_error":
                    return c.json({ message: checkInsCountResult.error.message }, 500);
            }
        }
        const checkInsCount = checkInsCountResult.value;

        const checkInsResult = await getCheckIns(from, limit);
        if (checkInsResult.isErr) {
            switch (checkInsResult.error.code) {
                case "internal_error":
                    return c.json({ message: checkInsResult.error.message }, 500);
            }
        }
        const checkIns = checkInsResult.value;

        return c.json({
            data: checkIns,
            pagination: {
                from: from,
                limit: limit,
                total: checkInsCount,
                returned: checkIns.length,
                has_more: (from + checkIns.length) < checkInsCount
            }
        }, 200)
    }
)
// GET - Scan user QR and return their team/solo details for the round
ops.get(
	"/events/:event_id/round/:round_no/participants",
	authMiddleware,
	opsAuthMiddleware,
	zValidator("query", roundCheckInScanSchema),
	async (c) => {
		const eventId = c.req.param("event_id");
		const roundNo = Number(c.req.param("round_no"));
		const { user_id } = c.req.valid("query");

		if (isNaN(roundNo) || roundNo < 1) {
			return c.json({ message: "Invalid round number" }, 400);
		}

		const scan = await scanUserForRound(user_id, eventId, roundNo);
		if (scan.isErr) {
			const message = scan.error.message;
			switch (scan.error.code) {
				case "user_not_found":
					return c.json({ message }, 404);
				case "event_not_found":
					return c.json({ message }, 404);
				case "round_not_found":
					return c.json({ message }, 404);
				case "not_registered":
					return c.json({ message }, 403);
				case "not_qualified":
					return c.json({ message }, 403);
				case "payment_pending":
					return c.json({ message }, 402);
				case "internal_error":
					return c.json({ message }, 500);
			}
		}
		return c.json({ ...scan.value }, 200);
	}
);

// POST - Check-in the team/solo after organizer confirms members
ops.post(
	"/events/:event_id/round/:round_no/check-in",
	authMiddleware,
	opsAuthMiddleware,
	zValidator("json", roundCheckInParamSchema),
	async (c) => {
		const checkInBy = c.get("user_id");
		const eventId = c.req.param("event_id");
		const roundNo = Number(c.req.param("round_no"));
		const { user_ids, team_id } = c.req.valid("json");

		if (isNaN(roundNo) || roundNo < 1) {
			return c.json({ message: "Invalid round number" }, 400);
		}

		const checkIn = await checkInRoundParticipants(
			eventId,
			roundNo,
			user_ids,
			team_id,
			checkInBy
		);

		if (checkIn.isErr) {
			const message = checkIn.error.message;
			switch (checkIn.error.code) {
				case "round_not_found":
					return c.json({ message }, 404);
				case "event_not_found":
					return c.json({ message }, 404);
				case "user_not_found":
					return c.json({ message }, 404);
				case "already_checked_in":
					return c.json({ message }, 409);
				case "payment_pending":
					return c.json({ message }, 402);
				case "not_qualified":
					return c.json({ message }, 403);
				case "not_registered":
					return c.json({ message }, 403);
				case "internal_error":
					return c.json({ message }, 500);
			}
		}
		return c.json({ message: "Checked in successfully" }, 200);
	}
);

