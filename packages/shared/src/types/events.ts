import { z } from "zod";

export const ParticipationType = z.enum(["solo", "team"]);
export const EventType = z.enum(["technical", "non-technical", "flagship"]);

export const roundSchema = z.object({
    roundNo: z.number().int().min(1, "Round number must be positive"),
    roundDescription: z.string().min(1, "Round description is required"),
    roundName:z.string().nullish()
});

export const prizeSchema = z.object({
    position: z.number().int().min(1, "Position must be positive"),
    rewardValue: z.number().int().min(1, "Reward value must be positive"),
});

export const organizerSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    assignedBy: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    phoneNo: z.string().nullable().optional()
});

export const eventRuleSchema = z.object({
    id: z.number().int().optional(), 
    eventId: z.string().optional(), 
    roundNo: z.number().int().nullable().optional(), 
    ruleNumber: z.number().int().min(1, "Rule number must be positive"),
    ruleDescription: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
});

const baseEventObject = {
    id: z.string(),
    name: z.string().min(1, "Event name is required"),
    description: z.string().min(1, "Description is required"),
    participationType: ParticipationType.default("solo"),
    eventType: EventType,
    maxAllowed: z
        .number()
        .int()
        .positive("Maximum participants must be positive"),
    minTeamSize: z.number().int().min(1).nullable().optional(),
    maxTeamSize: z.number().int().min(1).nullable().optional(),
    venue: z.string().min(1, "Venue is required"),
    eventStatus: z
        .enum(["not-started", "ongoing", "completed", "cancelled"])
        .default("not-started"),
    registrationStatus: z.boolean().default(false),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    registrationStart: z.coerce.date(),
    registrationEnd: z.coerce.date(),
    createdBy: z.string().nullable().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
};

const rawEventSchema = z.object(baseEventObject);

const withRefinements = <T extends z.ZodTypeAny>(schema: T) =>
    schema
        .refine((data: any) => data.endTime > data.startTime, {
            message: "Event end time must be after start time",
            path: ["endTime"],
        })
        .refine((data: any) => data.registrationEnd <= data.startTime, {
            message: "Registration must end before or when the event starts",
            path: ["registrationEnd"],
        })
        .refine((data: any) => data.registrationStart < data.registrationEnd, {
            message: "Registration start must be before registration end",
            path: ["registrationStart"],
        })
        .refine((data: any) => data.registrationStart < data.startTime, {
            message: "Registration must start before the event starts",
            path: ["registrationStart"],
        })
        .refine(
            (data: any) => {
                if (data.minTeamSize && data.maxTeamSize) {
                    return data.maxTeamSize >= data.minTeamSize;
                }
                return true;
            },
            {
                message: "Max team size must be >= min team size",
                path: ["maxTeamSize"],
            }
        );

export const eventSchema = withRefinements(
    rawEventSchema.safeExtend({
        rounds: z.array(roundSchema).optional(),
        prizes: z.array(prizeSchema).optional(),
        organizers: z.array(organizerSchema).optional(),
        rules: z.array(eventRuleSchema).optional(), // Added rules
    })
);

export const createEventSchema = withRefinements(
    rawEventSchema
        .omit({
            id: true,
            createdAt: true,
            updatedAt: true,
        })
        .safeExtend({
            rounds: z.array(roundSchema).optional(),
            prizes: z.array(prizeSchema).optional(),
            organizers: z.array(organizerSchema).optional(),
            rules: z.array(eventRuleSchema.omit({ id: true, eventId: true, createdAt: true, updatedAt: true })).optional(), // Added rules for creation
        })
);

export const updateEventDetailsSchema = withRefinements(
    z.object({
        name: z.string().min(1, "Event name is required"),
        description: z.string().min(1, "Description is required"),
        participationType: ParticipationType.default("solo"),
        eventType: EventType,
        maxAllowed: z
            .number()
            .int()
            .positive("Maximum participants must be positive"),
        minTeamSize: z.number().int().min(1).nullable().optional(),
        maxTeamSize: z.number().int().min(1).nullable().optional(),
        venue: z.string().min(1, "Venue is required"),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
        registrationStart: z.coerce.date(),
        registrationEnd: z.coerce.date(),
        createdBy: z.string().nullable().optional(),
    })
    .safeExtend({
        rounds: z.array(roundSchema).optional(),
        prizes: z.array(prizeSchema).optional(),
        organizers: z.array(organizerSchema).optional(),
        rules: z.array(eventRuleSchema.omit({ id: true, eventId: true, createdAt: true, updatedAt: true })).optional(), 
    })
);

export const deleteEventSchema = z.object({
    id: z.string().min(1, "Event id is required"),
});

export const eventRegistrationSchema = z.object({
    teamId: z.string().optional().nullable(),
});

export const getEventDetailsSchema = z.object({
    id: z.string().min(1, "Event id is required"),
});

export const createEventRuleSchema = z.object({
    eventId: z.string().min(1, "Event ID is required"),
    roundNo: z.number().int().nullable().optional(),
    ruleNumber: z.number().int().min(1, "Rule number must be positive"),
    ruleDescription: z.string().min(1, "Rule description is required"),
});

export const updateEventRuleSchema = z.object({
    id: z.number().int().min(1, "Rule ID is required"),
    roundNo: z.number().int().nullable().optional(),
    ruleNumber: z.number().int().min(1, "Rule number must be positive"),
    ruleDescription: z.string().min(1, "Rule description is required"),
});

export const deleteEventRuleSchema = z.object({
    id: z.number().int().min(1, "Rule ID is required"),
});

export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
export type GetEventDetailsInput = z.infer<typeof getEventDetailsSchema>;
export type Event = z.infer<typeof eventSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEventDetailsInput = z.infer<typeof updateEventDetailsSchema>;
export type EventRule = z.infer<typeof eventRuleSchema>;
export type CreateEventRule = z.infer<typeof createEventRuleSchema>;
export type UpdateEventRule = z.infer<typeof updateEventRuleSchema>;
export type DeleteEventRule = z.infer<typeof deleteEventRuleSchema>;