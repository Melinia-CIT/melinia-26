import { z } from "zod";

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
    rule_number: z.number().int().positive("Invalid rule sequence number"),
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

export const baseOrganizerSchema = z.object({
    event_id: z.string(),
    user_id: z.string(),
    assigned_by: z.string(), // user_id MLNUxxxXXX
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});

export const baseVolunteerSchema = z.object({
    event_id: z.string(),
    user_id: z.string(),
    assigned_by: z.string(), // user_id MLNUxxxXXX
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});


export const createEventRoundSchema = 
    baseRoundSchema.omit({
        id: true,
        event_id: true,
        created_at: true,
        updated_at: true
    });
export const createEventRoundsSchema = z.array(createEventRoundSchema);

export const createEventRoundRuleSchema = 
    baseRoundRulesSchema.omit({
        id: true,
        event_id: true,
        round_id: true, 
        created_at: true,
        updated_at: true
    });
export const createEventRoundRulesSchema = z.array(createEventRoundRuleSchema);

export const createEventPrizesSchema = z.array(
    basePrizeSchema.omit({
        id: true,
        event_id: true,
        created_at: true,
        updated_at: true
    })
);

export const addEventOrganizerSchema =  
    baseOrganizerSchema
    .omit({
        user_id: true,
        event_id: true,
        assigned_by: true,
        created_at: true,
        updated_at: true
    })
    .extend({
        email: z.email()
    });

export const addEventOrganizersSchema = z.array(addEventOrganizerSchema);

export const addEventVolunteerSchema = addEventOrganizerSchema
export const addEventVolunteersSchema = z.array(addEventVolunteerSchema);

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
                    )
                })
            ),
            prizes: createEventPrizesSchema,
            organizers: addEventOrganizersSchema.optional()
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

export const fullEventSchema =
    baseEventSchema
        .extend({
            rounds: z.array(
                baseRoundSchema
                    .omit({
                        event_id: true
                    })
                    .extend({
                        rules: z.array(
                            baseRoundRulesSchema
                                .omit({
                                    round_id: true,
                                    event_id: true
                                })
                        )
                    })
            ),
            prizes: z.array(
                basePrizeSchema
                    .omit({
                        event_id: true,
                    })
            ),
            organizers: z.array(
                baseOrganizerSchema
                    .omit({
                        event_id: true
                    })
            )
        });

//export const updateEventDetailsSchema = withRefinements(
//    z.object({
//        name: z.string().min(1, "Event name is required"),
//        description: z.string().min(1, "Description is required"),
//        participationType: ParticipationType.default("solo"),
//        eventType: EventType,
//        maxAllowed: z
//            .number()
//            .int()
//            .positive("Maximum participants must be positive"),
//        minTeamSize: z.number().int().min(1).nullable().optional(),
//        maxTeamSize: z.number().int().min(1).nullable().optional(),
//        venue: z.string().min(1, "Venue is required"),
//        startTime: z.coerce.date(),
//        endTime: z.coerce.date(),
//        registrationStart: z.coerce.date(),
//        registrationEnd: z.coerce.date(),
//        createdBy: z.string().nullable().optional(),
//    })
//        .safeExtend({
//            rounds: z.array(roundSchema).optional(),
//            prizes: z.array(prizeSchema).optional(),
//            organizers: z.array(organizerSchema).optional(),
//            rules: z.array(eventRuleSchema.omit({ id: true, eventId: true, createdAt: true, updatedAt: true })).optional(),
//        })
//);
//
//export const deleteEventSchema = z.object({
//    id: z.string().min(1, "Event id is required"),
//});
//
//export const eventRegistrationSchema = z.object({
//    teamId: z.string().optional().nullable(),
//    participationType: z.enum(["solo", "team"])
//});
//
//export const unregisterEventSchema = z.object({
//    participationType: z.enum(["solo", "team"]),
//    teamId: z.string().optional().nullable(),
//});
//
//export const getEventDetailsSchema = z.object({
//    id: z.string().min(1, "Event id is required"),
//});
//
//export const createEventRuleSchema = z.object({
//    eventId: z.string().min(1, "Event ID is required"),
//    roundNo: z.number().int().nullable().optional(),
//    ruleNumber: z.number().int().min(1, "Rule number must be positive"),
//    ruleDescription: z.string().min(1, "Rule description is required"),
//});
//
//export const updateEventRuleSchema = z.object({
//    id: z.number().int().min(1, "Rule ID is required"),
//    roundNo: z.number().int().nullable().optional(),
//    ruleNumber: z.number().int().min(1, "Rule number must be positive"),
//    ruleDescription: z.string().min(1, "Rule description is required"),
//});
//
//export const deleteEventRuleSchema = z.object({
//    id: z.number().int().min(1, "Rule ID is required"),
//});
//
//export type UnregisterEventInput = z.infer<typeof unregisterEventSchema>;
//export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
//export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
//export type GetEventDetailsInput = z.infer<typeof getEventDetailsSchema>;
//export type Event = z.infer<typeof eventSchema>;
//export type CreateEvent = z.infer<typeof createEventSchema>;
//export type UpdateEventDetailsInput = z.infer<typeof updateEventDetailsSchema>;
//export type EventRule = z.infer<typeof eventRuleSchema>;
//export type CreateEventRule = z.infer<typeof createEventRuleSchema>;
//export type UpdateEventRule = z.infer<typeof updateEventRuleSchema>;
//export type DeleteEventRule = z.infer<typeof deleteEventRuleSchema>;
//export type Prize = z.infer<typeof prizeSchema>;

export type CreateEvent = z.infer<typeof createEventSchema>;
export type FullEvent = z.infer<typeof fullEventSchema>;

export type CreateEventPrizes = z.infer<typeof createEventPrizesSchema>;

export type addEventOrganziers = z.infer<typeof addEventOrganizersSchema>;
export type addEventVolunteers = z.infer<typeof addEventVolunteersSchema>;

export type createRounds = z.infer<typeof createEventRoundsSchema>;
export type createRoundRules = z.infer<typeof createEventRoundRulesSchema>;

export type Event = z.infer<typeof baseEventSchema>;
export type Prize = z.infer<typeof basePrizeSchema>;
export type Organizer = z.infer<typeof baseOrganizerSchema>;
export type Volunteer = z.infer<typeof baseVolunteerSchema>;
export type Round = z.infer<typeof baseRoundSchema>;
export type Rule = z.infer<typeof baseRoundRulesSchema>;