import { z } from "zod";

// Base
export const baseEventSchema = z.object({
    id: z.string(),
    name: z.string()
        .min(1, "Event name is required")
        .max(100, "Event name must be less than 100 characters")
        .trim(),
    description: z.string()
        .min(1, "Description is required")
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description must be less than 1000 characters")
        .trim(),
    participation_type: z.enum(["solo", "team"]),
    event_type: z.enum(["technical", "non-technical", "flagship"]),
    max_allowed: z.number()
        .int("Must be a whole number")
        .positive("Maximum participants must be positive")
        .max(1000, "Maximum participants cannot exceed 1000"),
    min_team_size: z.number()
        .int("Must be a whole number")
        .min(1, "Minimum team size must be at least 1")
        .max(20, "Minimum team size cannot exceed 20"),
    max_team_size: z.number()
        .int("Must be a whole number")
        .min(1, "Maximum team size must be at least 1")
        .max(20, "Maximum team size cannot exceed 20"),
    venue: z.string()
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
    updated_at: z.coerce.date()
});

export const baseRoundRulesSchema = z.object({
    id: z.number().int(),
    event_id: z.string(),
    round_id: z.number().int().positive("Invalid round number"),
    rule_no: z.number().int().positive("Invalid rule sequence number"),
    rule_description: z.string().min(1, "Invalid rule description"),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});

export const basePrizeSchema = z.object({
    id: z.number().int(),
    event_id: z.string(),
    position: z.number().int().min(1, "Invalid prize position"), // rank and position is interchangeable
    reward_value: z.number().int().min(1, "Invalid prize amount"),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});

export const baseCrewSchema = z.object({
    event_id: z.string(),
    user_id: z.string(),
    assigned_by: z.string(), // user_id MLNUxxxXXX
    created_at: z.coerce.date(),
});


// Rounds
export const createEventRoundSchema =
    baseRoundSchema.omit({
        id: true,
        event_id: true,
        created_at: true,
        updated_at: true
    });
export const createEventRoundsSchema = z.array(createEventRoundSchema);

// Rules
export const createEventRoundRuleSchema =
    baseRoundRulesSchema.omit({
        id: true,
        event_id: true,
        round_id: true,
        created_at: true,
        updated_at: true
    });
export const createEventRoundRulesSchema = z.array(createEventRoundRuleSchema);

// Prizes
export const createEventPrizeSchema =
    basePrizeSchema
        .omit({
            id: true,
            event_id: true,
            created_at: true,
            updated_at: true
        })
export const createEventPrizesSchema = z.array(createEventPrizeSchema);

// Crew    
export const assignEventCrewSchema = z.object({ email: z.string() });
export const assignEventCrewsSchema = z.array(assignEventCrewSchema);
export const getCrewSchema =
    baseCrewSchema
        .extend({
            first_name: z.string(),
            last_name: z.string(),
            ph_no: z.string()
        })

// Event
export const createEventSchema =
    baseEventSchema
        .omit({
            id: true,
            created_by: true,
            created_at: true,
            updated_at: true
        })
        .extend({
            rounds: z.array(
                createEventRoundSchema
                    .extend({
                        rules: z.array(
                            createEventRoundRuleSchema
                        ).optional()
                    })
            ).optional(),
            prizes: createEventPrizesSchema.optional(),
            crew: z
                .object({
                    organizers: assignEventCrewsSchema.optional(),
                    volunteers: assignEventCrewsSchema.optional()
                })
                .optional()
        })
        .refine(
            (data) => data.max_team_size >= data.min_team_size,
            {
                message: "Maximum team size must be greater than or equal to minimum team size",
                path: ["max_team_size"],
            }
        ).refine(
            (data) => data.registration_end > data.registration_start,
            {
                message: "Registration end date must be after start date",
                path: ["registration_end"],
            }
        ).refine(
            (data) => {
                // If participation type is solo, team sizes should be 1
                if (data.participation_type === "solo") {
                    return data.min_team_size === 1 && data.max_team_size === 1;
                }
                return true;
            },
            {
                message: "Solo events must have team size of 1",
                path: ["participation_type"],
            }
        ).refine(
            (data) => {
                // Registration start should not be in the past (for create operations)
                const now = new Date();
                return data.registration_start >= now;
            },
            {
                message: "Registration start date cannot be in the past",
                path: ["registration_start"],
            }
        );

export const verboseEventSchema =
    baseEventSchema
        .extend({
            rounds: z
                .array(
                    baseRoundSchema
                        .omit({
                            event_id: true
                        })
                        .extend({
                            rules: z
                                .array(
                                    baseRoundRulesSchema
                                        .omit({
                                            round_id: true,
                                            event_id: true
                                        })
                                )
                                .optional()
                                .default([])
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
            crew: z
                .object({
                    organizers: z
                        .array(
                            baseCrewSchema
                                .omit({
                                    event_id: true
                                })
                        )
                        .optional()
                        .default([]),
                    volunteers: z
                        .array(
                            baseCrewSchema
                                .omit({
                                    event_id: true
                                })
                        )
                        .optional()
                        .default([])
                })
        });

export const getEventsQuerySchema = z
    .object({
        expand: z
            .enum(["all"])
            .optional()
    })

export const EventParamSchema = z
    .object({
        id: z.string()
    })

export const getVerboseEventResponseSchema =
    verboseEventSchema
        .extend({
            crew: z
                .object({
                    organizers: z
                        .array(
                            baseCrewSchema
                                .omit({
                                    event_id: true,
                                    assigned_by: true
                                })
                                .extend({
                                    first_name: z.string(),
                                    last_name: z.string(),
                                    ph_no: z.string()
                                })
                        )
                })
        })

export const userRegisteredEventsSchema = z
    .array(
        baseEventSchema
            .extend({
                team_name: z.string().nullable(),
                mode: z.enum(["solo", "team"]),
                rounds: z.array(
                    baseRoundSchema
                        .omit({
                            event_id: true,
                            round_description: true,
                        })
                )
            })
    )
    .default([])

export const RegisteredSolo = z.object({
    registered: z.literal(true),
    mode: z.literal("solo"),
    registered_at: z.coerce.date()
})

const RegisteredTeam = z.object({
    registered: z.literal(true),
    mode: z.literal("team"),
    registered_at: z.coerce.date(),
    team: z.object({
        id: z.string(),
        name: z.string()
    })
})

const NotRegistered = z.object({
    registered: z.literal(false)
})

export const userRegistrationStatus = z.union([
    RegisteredSolo,
    RegisteredTeam,
    NotRegistered
])


export const eventRegistrationSchema = z.object({
    registration_type: z.enum(['solo', 'team']),
    team_id: z.string().optional().nullable()
});

export type CreateEvent = z.infer<typeof createEventSchema>;
export type Event = z.infer<typeof baseEventSchema>;
export type VerboseEvent = z.infer<typeof verboseEventSchema>;
export type GetVerboseEvent = z.infer<typeof getVerboseEventResponseSchema>;
export type UserRegisteredEvents = z.infer<typeof userRegisteredEventsSchema>;
export type UserRegistrationStatus = z.infer<typeof userRegistrationStatus>;

export type CreateEventPrizes = z.infer<typeof createEventPrizesSchema>;
export type Prize = z.infer<typeof basePrizeSchema>;

export type AssignEventCrews = z.infer<typeof assignEventCrewsSchema>;
export type GetCrew = z.infer<typeof getCrewSchema>;
export type Crew = z.infer<typeof baseCrewSchema>;

export type CreateRounds = z.infer<typeof createEventRoundsSchema>;
export type Round = z.infer<typeof baseRoundSchema>;

export type CreateRoundRules = z.infer<typeof createEventRoundRulesSchema>;
export type Rule = z.infer<typeof baseRoundRulesSchema>;

export type EventRegistration = z.infer<typeof eventRegistrationSchema>;
