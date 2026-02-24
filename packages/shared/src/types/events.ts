import { z } from "zod"
import type {
    InternalError,
    UserNotFound,
    ProfileNotCompleted,
    ProfileNotFound,
    SuspendError,
} from "./users"
import type { PaymentPending } from "./payments"
import { memberSchema } from "./teams"

// Base
export const baseEventSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(1, "Event name is required")
        .max(100, "Event name must be less than 100 characters")
        .trim(),
    description: z
        .string()
        .min(1, "Description is required")
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description must be less than 1000 characters")
        .trim(),
    participation_type: z.enum(["solo", "team"]),
    event_type: z.enum(["technical", "non-technical", "flagship"]),
    max_allowed: z
        .number()
        .int("Must be a whole number")
        .positive("Maximum participants must be positive")
        .max(1000, "Maximum participants cannot exceed 1000"),
    min_team_size: z
        .number()
        .int("Must be a whole number")
        .min(1, "Minimum team size must be at least 1")
        .max(20, "Minimum team size cannot exceed 20"),
    max_team_size: z
        .number()
        .int("Must be a whole number")
        .min(1, "Maximum team size must be at least 1")
        .max(20, "Maximum team size cannot exceed 20"),
    venue: z
        .string()
        .min(1, "Venue is required")
        .max(200, "Venue name must be less than 200 characters")
        .trim(),
    registration_start: z.coerce.date(),
    registration_end: z.coerce.date(),
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
    created_by: z.string().min(1, "created_by can't be empty"),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const baseRoundSchema = z.object({
    id: z.number().int(),
    event_id: z.string(),
    round_no: z.number().int().min(1, "Invalid Round number"),
    round_description: z.string().min(1, "Round description can't be empty"),
    round_name: z.string().min(1, "Round name can't be empty"),
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const baseRoundRulesSchema = z.object({
    id: z.number().int(),
    event_id: z.string(),
    round_id: z.number().int().positive("Invalid round number"),
    rule_no: z.number().int().positive("Invalid rule sequence number"),
    rule_description: z.string().min(1, "Invalid rule description"),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const basePrizeSchema = z.object({
    id: z.number().int(),
    event_id: z.string(),
    position: z.number().int().min(1, "Invalid prize position"), // rank and position is interchangeable
    reward_value: z.number().int().min(1, "Invalid prize amount"),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const baseCrewSchema = z.object({
    event_id: z.string(),
    user_id: z.string(),
    assigned_by: z.string(), // user_id MLNUxxxXXX
    created_at: z.coerce.date(),
})

// Rounds
export const createEventRoundSchema = baseRoundSchema.omit({
    id: true,
    event_id: true,
    created_at: true,
    updated_at: true,
})
export const createEventRoundsSchema = z.array(createEventRoundSchema)

// Rules
export const createEventRoundRuleSchema = baseRoundRulesSchema.omit({
    id: true,
    event_id: true,
    round_id: true,
    created_at: true,
    updated_at: true,
})
export const createEventRoundRulesSchema = z.array(createEventRoundRuleSchema)

// Prizes
export const createEventPrizeSchema = basePrizeSchema.omit({
    id: true,
    event_id: true,
    created_at: true,
    updated_at: true,
})
export const createEventPrizesSchema = z.array(createEventPrizeSchema)

// Crew
export const assignEventCrewSchema = z.object({ email: z.email() })
export const assignEventCrewsSchema = z.array(assignEventCrewSchema)
export const getCrewSchema = baseCrewSchema.extend({
    first_name: z.string(),
    last_name: z.string(),
    ph_no: z.string(),
})

// Event Patch Schema for incremental updates
export const eventPatchSchema = baseEventSchema
    .omit({
        id: true,
        created_at: true,
        updated_at: true,
        created_by: true,
    })
    .partial()
    .extend({
        // Add custom validation for timing constraints
        registration_start: z.coerce.date().optional(),
        registration_end: z.coerce.date().optional(),
        start_time: z.coerce.date().optional(),
        end_time: z.coerce.date().optional(),
    })
    .superRefine((data, ctx) => {
        // Validate timing constraints if any timing fields are provided
        if (data.registration_end !== undefined || data.start_time !== undefined) {
            const regEnd = data.registration_end || new Date("9999-12-31")
            const start = data.start_time || new Date("1970-01-01")

            if (regEnd > start) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "registration_end must be before or equal to start_time",
                    path: ["registration_end"],
                })
            }
        }

        if (data.start_time !== undefined || data.end_time !== undefined) {
            const start = data.start_time || new Date("1970-01-01")
            const end = data.end_time || new Date("9999-12-31")

            if (end <= start) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "end_time must be after start_time",
                    path: ["end_time"],
                })
            }
        }

        if (data.registration_start !== undefined || data.registration_end !== undefined) {
            const regStart = data.registration_start || new Date("1970-01-01")
            const regEnd = data.registration_end || new Date("9999-12-31")

            if (regEnd <= regStart) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "registration_end must be after registration_start",
                    path: ["registration_end"],
                })
            }
        }

        // Validate team size constraints
        if (data.min_team_size !== undefined && data.max_team_size !== undefined) {
            if (data.max_team_size < data.min_team_size) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "max_team_size must be greater than or equal to min_team_size",
                    path: ["max_team_size"],
                })
            }
        }
    })

// Event
export const createEventSchema = baseEventSchema
    .omit({
        id: true,
        created_by: true,
        created_at: true,
        updated_at: true,
    })
    .extend({
        rounds: z
            .array(
                createEventRoundSchema.extend({
                    rules: z.array(createEventRoundRuleSchema).optional(),
                })
            )
            .optional(),
        prizes: createEventPrizesSchema.optional(),
        crew: z
            .object({
                organizers: assignEventCrewsSchema.optional(),
                volunteers: assignEventCrewsSchema.optional(),
            })
            .optional(),
    })
    .refine(data => data.max_team_size >= data.min_team_size, {
        message: "Maximum team size must be greater than or equal to minimum team size",
        path: ["max_team_size"],
    })
    .refine(data => data.registration_end > data.registration_start, {
        message: "Registration end date must be after start date",
        path: ["registration_end"],
    })
    .refine(
        data => {
            // If participation type is solo, team sizes should be 1
            if (data.participation_type === "solo") {
                return data.min_team_size === 1 && data.max_team_size === 1
            }
            return true
        },
        {
            message: "Solo events must have team size of 1",
            path: ["participation_type"],
        }
    )
    .refine(
        data => {
            // Registration start should not be in the past (for create operations)
            const now = new Date()
            return data.registration_start >= now
        },
        {
            message: "Registration start date cannot be in the past",
            path: ["registration_start"],
        }
    )

export const verboseEventSchema = baseEventSchema.extend({
    rounds: z
        .array(
            baseRoundSchema
                .omit({
                    event_id: true,
                })
                .extend({
                    rules: z
                        .array(
                            baseRoundRulesSchema.omit({
                                round_id: true,
                                event_id: true,
                            })
                        )
                        .optional()
                        .default([]),
                })
        )
        .optional()
        .default([]),
    prizes: z
        .array(
            basePrizeSchema.omit({
                event_id: true,
            })
        )
        .optional()
        .default([]),
    crew: z.object({
        organizers: z
            .array(
                baseCrewSchema.omit({
                    event_id: true,
                })
            )
            .optional()
            .default([]),
        volunteers: z
            .array(
                baseCrewSchema.omit({
                    event_id: true,
                })
            )
            .optional()
            .default([]),
    }),
})

export const getEventsQuerySchema = z.object({
    expand: z.enum(["all"]).optional(),
})

export const assignVolunteersSchema = z.object({
    volunteer_ids: z.array(z.string()).min(1, "At least one volunteer ID required"),
})

export const removeVolunteerResponseSchema = baseCrewSchema.omit({
    assigned_by: true,
    created_at: true,
})

export const getVerboseEventResponseSchema = verboseEventSchema.extend({
    crew: z.object({
        organizers: z
            .array(
                baseCrewSchema
                    .omit({
                        event_id: true,
                        assigned_by: true,
                    })
                    .extend({
                        first_name: z.string(),
                        last_name: z.string(),
                        ph_no: z.string(),
                    })
            )
            .optional()
            .default([]),

        volunteers: z
            .array(
                baseCrewSchema
                    .omit({
                        event_id: true,
                        assigned_by: true,
                    })
                    .extend({
                        first_name: z.string(),
                        last_name: z.string(),
                        ph_no: z.string(),
                    })
            )
            .optional(),
    }),
})

export const EventParamSchema = z.object({
    id: z.string(),
})

export const RegisteredSolo = z.object({
    registered: z.literal(true),
    mode: z.literal("solo"),
    registered_at: z.coerce.date(),
})

const RegisteredTeam = z.object({
    registered: z.literal(true),
    mode: z.literal("team"),
    registered_at: z.coerce.date(),
    team: z.object({
        id: z.string(),
        name: z.string(),
    }),
})

const NotRegistered = z.object({
    registered: z.literal(false),
})

export const userRegistrationStatus = z.union([RegisteredSolo, RegisteredTeam, NotRegistered])

export const userRegisteredEventsSchema = z
    .array(
        baseEventSchema
            .extend({
                registration: z.union([
                    RegisteredSolo.omit({
                        registered: true,
                    }),
                    RegisteredTeam.omit({
                        registered: true,
                    }),
                ]),
                rounds: z.array(
                    baseRoundSchema.omit({
                        event_id: true,
                        round_description: true,
                    })
                ),
            })
            .or(
                baseEventSchema.omit({
                    updated_at: true,
                    created_at: true,
                    created_by: true,
                })
            )
    )
    .default([])

export const eventRegistrationSchema = z.object({
    registration_type: z.enum(["solo", "team"]),
    team_id: z.string().optional().nullable(),
})

export const getEventRegistrationSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("TEAM"),
        name: z.string(),
        members: z.array(
            z.object({
                participant_id: z.string(),
                first_name: z.string(),
                last_name: z.string(),
                college: z.string(),
                degree: z.string(),
                ph_no: z.string(),
                email: z.email(),
            })
        ),
        registered_at: z.coerce.date(),
    }),
    z.object({
        type: z.literal("SOLO"),
        first_name: z.string(),
        last_name: z.string(),
        participant_id: z.string(),
        college: z.string(),
        degree: z.string(),
        ph_no: z.string(),
        email: z.email(),
        registered_at: z.coerce.date(),
    }),
])

// round update schema
export const roundPatchSchema = baseRoundSchema
    .omit({
        id: true,
        event_id: true, // event_id is structural and usually immutable in a patch
        created_at: true,
        updated_at: true,
    })
    .partial()
    .extend({
        // Add custom validation for timing constraints
        start_time: z.coerce.date().optional(),
        end_time: z.coerce.date().optional(),
    })
    .superRefine((data, ctx) => {
        // Validate timing constraints if any timing fields are provided
        if (data.start_time !== undefined || data.end_time !== undefined) {
            const start = data.start_time || new Date("1970-01-01")
            const end = data.end_time || new Date("9999-12-31")

            if (end <= start) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "end_time must be after start_time",
                    path: ["end_time"],
                })
            }
        }
    })

// Overall Fest CheckIns
export const baseCheckInSchema = z.object({
    id: z.number(),
    participant_id: z.string(),
    checkedin_at: z.coerce.date(),
    checkedin_by: z.string(),
})

export const getCheckInSchema = z.object({
    participant_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    college: z.string(),
    degree: z.string(),
    email: z.email(),
    ph_no: z.string(),
    checkedin_at: z.coerce.date(),
    checkedin_by: z.string(),
})

export const checkInParamSchema = z.object({
    participant_id: z.string().regex(/^MLNU[A-Z0-9]{6}$/, { error: "Invalid user_id" }),
})

// EventsCheckIns
export const getEventCheckInsParamSchema = z.object({
    eventId: z.string(),
    roundId: z.coerce.number(),
})

export const getEventParticipantsParamSchema = getEventCheckInsParamSchema
    .omit({
        roundId: true,
    })
    .extend({
        roundNo: z.coerce.number().min(1, { error: "Round number must be greater than 1" }),
    })

export const getEventCheckInSchema = z.discriminatedUnion("type", [
    z.object({
        team_id: z.string(),
        type: z.literal("TEAM"),
        name: z.string(),
        members: z.array(
            z.object({
                participant_id: z.string(),
                first_name: z.string(),
                last_name: z.string(),
                college: z.string(),
                degree: z.string(),
                ph_no: z.string(),
                email: z.email(),
            })
        ),
        checkedin_at: z.coerce.date(),
        checkedin_by: z.string(),
    }),
    z.object({
        participant_id: z.string(),
        type: z.literal("SOLO"),
        first_name: z.string(),
        last_name: z.string(),
        college: z.string(),
        degree: z.string(),
        ph_no: z.string(),
        email: z.email(),
        checkedin_at: z.coerce.date(),
        checkedin_by: z.string(),
    }),
])

export const getEventParticipantSchema = z.discriminatedUnion("type", [
    z.object({
        team_id: z.string(),
        type: z.literal("TEAM"),
        name: z.string(),
        members: z.array(
            z.object({
                participant_id: z.string(),
                first_name: z.string(),
                last_name: z.string(),
                college: z.string(),
                degree: z.string(),
                ph_no: z.string(),
                email: z.email(),
            })
        ),
        registered_at: z.coerce.date(),
    }),
    z.object({
        participant_id: z.string(),
        type: z.literal("SOLO"),
        first_name: z.string(),
        last_name: z.string(),
        college: z.string(),
        degree: z.string(),
        ph_no: z.string(),
        email: z.email(),
        registered_at: z.coerce.date(),
    }),
])

export const paginationSchema = z.object({
    from: z.coerce.number().min(0).default(0),
    limit: z.coerce.number().min(1).default(10),
})
export const roundCheckInScanSchema = z.object({
    user_id: z.string(),
})

export const roundCheckInParamSchema = z.object({
    user_ids: z.array(z.string()).min(1),
    team_id: z.string().nullable(),
})
export const checkInTeamSchema = memberSchema.safeExtend({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPEND"]),
    payment_status: z.enum(["PAID", "UNPAID", "EXEMPTED"]),
})
export const baseScanResultSchema = z.object({
    type: z.enum(["SOLO", "TEAM"]),
    user_id: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().nullable().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPEND", "SUSPENDED"]).optional(),
    payment_status: z.enum(["PAID", "UNPAID", "EXEMPTED"]).optional(),
    team_id: z.string().optional(),
    team_name: z.string().nullable().optional(),
    members: z.array(checkInTeamSchema).optional(),
})

export const baseRoundCheckInSchema = z.object({
    checked_in: z.array(
        z.object({
            id: z.number(),
            user_id: z.string(),
            round_id: z.number(),
            team_id: z.string().nullable(),
            checkedin_at: z.coerce.date(),
            checkedin_by: z.string(),
        })
    ),
})

export const fetchLeaderBoardSchema = z.object({
    college_id: z.string(),
    college_name: z.string(),
    points: z.number(),
})

export type CreateEvent = z.infer<typeof createEventSchema>
export type Event = z.infer<typeof baseEventSchema>
export type EventPatch = z.infer<typeof eventPatchSchema>
export type VerboseEvent = z.infer<typeof verboseEventSchema>
export type GetVerboseEvent = z.infer<typeof getVerboseEventResponseSchema>
export type UserRegisteredEvents = z.infer<typeof userRegisteredEventsSchema>
export type UserRegistrationStatus = z.infer<typeof userRegistrationStatus>

export type CreateEventPrizes = z.infer<typeof createEventPrizesSchema>
export type Prize = z.infer<typeof basePrizeSchema>

export type GetEventRegistration = z.infer<typeof getEventRegistrationSchema>
export type AssignEventCrews = z.infer<typeof assignEventCrewsSchema>
export type GetCrew = z.infer<typeof getCrewSchema>
export type Crew = z.infer<typeof baseCrewSchema>

export type CreateRounds = z.infer<typeof createEventRoundsSchema>
export type Round = z.infer<typeof baseRoundSchema>
export type EventOrRoundNotFound = {
    code: "event_or_round_not_found"
    message: string
}

export type CreateRoundRules = z.infer<typeof createEventRoundRulesSchema>
export type Rule = z.infer<typeof baseRoundRulesSchema>

export type GetCheckIn = z.infer<typeof getCheckInSchema>
export type FetchLeaderBoard = z.infer<typeof fetchLeaderBoardSchema>
export type GetCheckInError = InternalError

export type GetEventCheckIn = z.infer<typeof getEventCheckInSchema>
export type GetEventCheckInsError = EventOrRoundNotFound | InternalError
export type GetEventRegistrationsError = EventNotFound | InternalError
export type GetEventParticipant = z.infer<typeof getEventParticipantSchema>
export type GetEventParticipantsError = EventOrRoundNotFound | InternalError
export type EventRegistration = z.infer<typeof getEventRegistrationSchema>
export type RoundPatch = z.infer<typeof roundPatchSchema>

export type CheckIn = z.infer<typeof baseCheckInSchema>
export type AlreadyCheckedIn = {
    code: "already_checked_in"
    message: string
}

// Round Check-in Types
export type CheckInTeam = z.infer<typeof checkInTeamSchema>
export type ScanResult = z.infer<typeof baseScanResultSchema>
export type RoundCheckIn = z.infer<typeof baseRoundCheckInSchema>

// Errors
export type NotRegistered = {
    code: "not_registered"
    message: string
}
export type NotQualified = {
    code: "not_qualified"
    message: string
}
export type AlreadyCheckedInRound = {
    code: "already_checked_in"
    message: string
}

export type ScanError =
    | UserNotFound
    | EventNotFound
    | RoundNotFound
    | NotRegistered
    | NotQualified
    | PaymentPending
    | SuspendError
    | ProfileNotCompleted
    | InternalError

export type CheckInError = UserNotFound | AlreadyCheckedIn | PaymentPending | InternalError

// Event Round Check-In
export const eventRoundCheckInSchema = z.object({
    user_id: z.string().regex(/^MLNU[A-Z0-9]{6}$/, "Invalid user ID format"),
    team_id: z
        .string()
        .regex(/^MLNT[A-Z0-9]{6}$/, "Invalid team ID format")
        .optional()
        .nullable(),
})

export const baseEventRoundCheckInSchema = z.object({
    id: z.number(),
    user_id: z.string(),
    round_id: z.number(),
    team_id: z.string().nullable(),
    checkedin_at: z.coerce.date(),
    checkedin_by: z.string(),
})

export type EventRoundCheckIn = z.infer<typeof baseEventRoundCheckInSchema>
export type EventRoundCheckInInput = z.infer<typeof eventRoundCheckInSchema>

export type RoundCheckInError =
    | {
          code: "round_not_found"
          message: string
      }
    | {
          code: "user_not_registered"
          message: string
      }
    | {
          code: "not_checked_in_globally"
          message: string
      }
    | AlreadyCheckedIn
    | UserNotFound
    | EventNotFound
    | RoundNotFound
    | NotRegistered
    | NotQualified
    | AlreadyCheckedInRound
    | PaymentPending
    | SuspendError
    | ProfileNotCompleted
    | InternalError

export type ParticipantNotCheckedInToRound = {
    code: "participant_not_checked_in_to_round"
    message: string
}

export type LeaderboardNotFound = {
    code: "leaderboard_not_found"
    message: string
}

// Round Results
// Default points by status (used when points are not explicitly provided)
export const DEFAULT_POINTS = {
    QUALIFIED: 20,
    ELIMINATED: 10,
    DISQUALIFIED: 0,
} as const

// Winner points by position (used when assigning event prizes)
export const WINNER_POINTS: Record<number, number> = {
    1: 100,
    2: 75,
    3: 50,
} as const

export const roundResultSchema = z
    .object({
        user_id: z
            .string()
            .regex(/^MLNU[A-Z0-9]{6}$/, "Invalid user ID format")
            .optional(),
        team_id: z
            .string()
            .regex(/^MLNT[A-Z0-9]{6}$/, "Invalid team ID format")
            .optional()
            .nullable(),
        points: z.number().int().min(0).max(100).optional(), // Made optional - will use defaults based on status
        status: z.enum(["QUALIFIED", "ELIMINATED", "DISQUALIFIED"]),
    })
    .refine(data => data.user_id || data.team_id, {
        message: "Either user_id or team_id must be provided",
        path: ["user_id"],
    })

export const assignRoundResultsSchema = z.object({
    results: z.array(roundResultSchema).min(1, "At least one result required"),
})

export type RoundResult = z.infer<typeof roundResultSchema>
export type AssignRoundResults = z.infer<typeof assignRoundResultsSchema>

// Round Results Response Types
export type RoundResultRecord = {
    id: number
    user_id: string
    team_id: string | null
    points: number
    status: string
    eval_at: Date
    eval_by: string
}

export type UserResultError = {
    user_id: string
    error: string
}

export type TeamResultError = {
    team_id: string
    error: string
}

export type BulkOperationResult = {
    recorded_count: number
    results: RoundResultRecord[]
    user_errors: UserResultError[]
    team_errors: TeamResultError[]
}

// Round Results Error Types
export type RoundNotFound = {
    code: "round_not_found"
    message: string
}

export type ParticipantNotFound = {
    code: "participant_not_found"
    message: string
}

export type ParticipantNotCheckedIn = {
    code: "participant_not_checked_in"
    message: string
}

export type InvalidData = {
    code: "invalid_data"
    message: string
}

export type AssignResultsError =
    | RoundNotFound
    | ParticipantNotFound
    | ParticipantNotCheckedIn
    | ParticipantNotCheckedInToRound
    | InvalidData
    | InternalError

// Get Round Results Query Schema
export const getRoundResultsQuerySchema = z.object({
    status: z.enum(["QUALIFIED", "ELIMINATED", "DISQUALIFIED", "all"]).optional(),
    sort: z.enum(["points_desc", "points_asc", "name_asc"]).optional().default("points_desc"),
    from: z.coerce.number().min(0).default(0),
    limit: z.coerce.number().int().min(1).default(50),
    group_by: z.enum(["team", "individual"]).optional().default("individual"),
})

export type GetRoundResultsQuery = z.infer<typeof getRoundResultsQuerySchema>

// Round Result with Participant Details
export type RoundResultWithParticipant = {
    id: number
    user_id: string
    name: string
    email: string
    ph_no: string
    team_id: string | null
    team_name: string | null
    points: number
    status: string
    eval_at: Date
    eval_by: string
}

// Team-grouped Round Result
export type TeamRoundResult = {
    team_id: string
    team_name: string
    points: number
    status: string
    eval_at: Date
    members: Array<{
        user_id: string
        name: string
        email: string
    }>
}

// Paginated Round Results Response
export type PaginatedRoundResults = {
    data: RoundResultWithParticipant[]
    pagination: {
        from: number
        limit: number
        total: number
        returned: number
        has_more: boolean
    }
}

export type GetRoundResultsError = RoundNotFound | InternalError

// Event Prize Assignment
export const prizeAssignmentSchema = z
    .object({
        user_id: z
            .string()
            .regex(/^MLNU[A-Z0-9]{6}$/, "Invalid user ID format")
            .optional(),
        team_id: z
            .string()
            .regex(/^MLNT[A-Z0-9]{6}$/, "Invalid team ID format")
            .optional()
            .nullable(),
        position: z.number().int().positive("Position must be a positive integer"),
    })
    .refine(data => data.user_id || data.team_id, {
        message: "Either user_id or team_id must be provided",
        path: ["user_id"],
    })

export const assignPrizesSchema = z.object({
    results: z.array(prizeAssignmentSchema).min(1, "At least one result required"),
})

export type PrizeAssignment = z.infer<typeof prizeAssignmentSchema>
export type AssignPrizes = z.infer<typeof assignPrizesSchema>

export type PrizeAssignmentRecord = {
    id: number
    event_id: string
    user_id: string
    team_id: string | null
    prize_id: number
    /** Aliased as `prize_position` in the DB query (ep.position as prize_position) */
    prize_position: number
    reward_value: number
    points: number
    awarded_at: Date
    awarded_by: string
    team_name?: string | null
    participant_name?: string | null
}

export type BulkPrizeResult = {
    recorded_count: number
    results: PrizeAssignmentRecord[]
    errors: Array<{ user_id: string; error: string }>
}

export type EventNotFound = {
    code: "event_not_found"
    message: string
}

export type PrizeNotFound = {
    code: "prize_not_found"
    message: string
}

export type AssignPrizesError =
    | EventNotFound
    | PrizeNotFound
    | ParticipantNotCheckedIn
    | InvalidData
    | InternalError

// Volunteer Assignment Errors
export type AssigningUserNotFound = {
    code: "assigning_user_not_found"
    message: string
}

export type PermissionDenied = {
    code: "permission_denied"
    message: string
}

export type VolunteersNotFound = {
    code: "volunteers_not_found"
    message: string
}

export type InvalidVolunteerRole = {
    code: "invalid_volunteer_role"
    message: string
}

export type VolunteerAlreadyAssigned = {
    code: "volunteer_already_assigned"
    message: string
}

export type EmptyVolunteerList = {
    code: "empty_volunteer_list"
    message: string
}

export type AssignVolunteersError =
    | EventNotFound
    | AssigningUserNotFound
    | PermissionDenied
    | VolunteersNotFound
    | InvalidVolunteerRole
    | VolunteerAlreadyAssigned
    | EmptyVolunteerList
    | InternalError

export type VolunteerNotFound = {
    code: "volunteer_not_found"
    message: string
}

export type RemoveVolunteer = z.infer<typeof removeVolunteerResponseSchema>

export type RemoveVolunteerError =
    | EventNotFound
    | PermissionDenied
    | VolunteerNotFound
    | InternalError

export type GetLeaderboardError = InternalError

export type CheckInNotFound = {
    code: "check_in_not_found"
    message: string
}

export type ResultsAlreadyDeclared = {
    code: "results_already_declared"
    message: string
}

export type DeleteRoundCheckInError =
    | EventNotFound
    | RoundNotFound
    | UserNotFound
    | CheckInNotFound
    | ResultsAlreadyDeclared
    | InternalError
