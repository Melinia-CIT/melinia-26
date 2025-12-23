import { z } from "zod";

export const ParticipationType = z.enum(["solo", "team"]);
export const EventType = z.enum([
    "technical",
    "non-technical",
    "flagship",
]);

export const eventSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Event name is required"),
    description: z.string().min(1, "Description is required"),
    participation_type: ParticipationType.default("solo"),
    event_type: EventType,
    max_allowed: z.number().int().positive("Maximum participants must be positive"),
    venue: z.string().min(1, "Venue is required"),
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
    registration_start: z.coerce.date(),
    registration_end: z.coerce.date(),
    created_by: z.string().nullable().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
})
    .refine((data) => data.end_time > data.start_time, {
        message: "Event end time must be after start time",
        path: ["end_time"],
    })
    .refine((data) => data.registration_end <= data.start_time, {
        message: "Registration must end before or when the event starts",
        path: ["registration_end"],
    })
    .refine((data) => data.registration_start < data.registration_end, {
        message: "Registration start must be before registration end",
        path: ["registration_start"],
    })
    .refine((data) => data.registration_start < data.start_time, {
        message: "Registration must start before the event starts",
        path: ["registration_start"],
    });


export const createEventSchema = eventSchema.omit({
    id: true,
    created_at: true,
    updated_at: true
});
export const updateEventSchema = eventSchema.partial();

export type Event = z.infer<typeof eventSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>; 

