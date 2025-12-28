import { z } from "zod";

export const ParticipationType = z.enum(["solo", "team"]);
export const EventType = z.enum(["technical", "non-technical", "flagship"]);

export const RoundSchema = z.object({
    round_no: z.number().int().min(1, "Round number must be positive"),
    round_description: z.string().min(1, "Round description is required"),
});

export const PrizeSchema = z.object({
    position: z.number().int().min(1, "Position must be positive"),
    reward_value: z.number().int().min(1, "Reward value must be positive"),
});

export const OrganizerSchema = z.object({
    user_id: z.string().min(1, "User ID is required"),
    assigned_by: z.string().nullable().optional(),
});

const baseEventObject = {
    id: z.string(),
    name: z.string().min(1, "Event name is required"),
    description: z.string().min(1, "Description is required"),
    participation_type: ParticipationType.default("solo"),
    event_type: EventType,
    max_allowed: z
        .number()
        .int()
        .positive("Maximum participants must be positive"),
    min_team_size: z.number().int().min(1).nullable().optional(),
    max_team_size: z.number().int().min(1).nullable().optional(),
    venue: z.string().min(1, "Venue is required"),
    event_status: z
        .enum(["not-started", "ongoing", "completed", "cancelled"])
        .default("not-started"),
    registration_status: z.boolean().default(false),
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
    registration_start: z.coerce.date(),
    registration_end: z.coerce.date(),
    created_by: z.string().nullable().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
};

const rawEventSchema = z.object(baseEventObject);

const withRefinements = <T extends z.ZodTypeAny>(schema: T) =>
    schema
        .refine((data: any) => data.end_time > data.start_time, {
            message: "Event end time must be after start time",
            path: ["end_time"],
        })
        .refine((data: any) => data.registration_end <= data.start_time, {
            message: "Registration must end before or when the event starts",
            path: ["registration_end"],
        })
        .refine((data: any) => data.registration_start < data.registration_end, {
            message: "Registration start must be before registration end",
            path: ["registration_start"],
        })
        .refine((data: any) => data.registration_start < data.start_time, {
            message: "Registration must start before the event starts",
            path: ["registration_start"],
        })
        .refine(
            (data: any) => {
                if (data.min_team_size && data.max_team_size) {
                    return data.max_team_size >= data.min_team_size;
                }
                return true;
            },
            {
                message: "Max team size must be >= min team size",
                path: ["max_team_size"],
            }
        );

export const eventSchema = withRefinements(
    rawEventSchema.safeExtend({
        rounds: z.array(RoundSchema).optional(),
        prizes: z.array(PrizeSchema).optional(),
        organizers: z.array(OrganizerSchema).optional(),
    })
);

export const createEventSchema = withRefinements(
    rawEventSchema
        .omit({
            id: true,
            created_at: true,
            updated_at: true,
        })
        .safeExtend({
            rounds: z.array(RoundSchema).optional(),
            prizes: z.array(PrizeSchema).optional(),
            organizers: z.array(OrganizerSchema).optional(),
        })
);

export const updateEventDetailsSchema = withRefinements(
    rawEventSchema
        .omit({
            id: true,
            created_at: true,
            updated_at: true,
        })
        .safeExtend({
            rounds: z.array(RoundSchema).optional(),
            prizes: z.array(PrizeSchema).optional(),
            organizers: z.array(OrganizerSchema).optional(),
        })
);

export const deleteEventSchema = z.object({
    event_id: z.string().min(1, "Event id is required"),
});

export const eventRegistrationSchema = z.object({
    isTeam: z.boolean(),
    team_id: z.string().optional().nullable(),
});


export const getEventDetailsSchema = z.object({
    id: z.string().min(1, "Event id is required"),
});

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
export type GetEventDetailsInput = z.infer<typeof getEventDetailsSchema>;
export type Event = z.infer<typeof eventSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEventDetailsInput = z.infer<typeof updateEventDetailsSchema>;
