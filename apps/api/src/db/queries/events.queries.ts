import sql from "../connection";
import { type Event, eventSchema, createEventSchema, type CreateEvent } from "@melinia/shared/dist";

export async function getEvents(): Promise<Event[]> {
    const rows = await sql`
        SELECT
            id,
            name,
            description,
            participation_type,
            event_type,
            max_allowed,
            venue,
            start_time,
            end_time,
            registration_start,
            registration_end,
            created_by,
            created_at,
            updated_at
        FROM events;
    `;

    return rows.map(row => eventSchema.parse(row));
}

export async function createEvent(input: CreateEvent): Promise<Event> {
    const data = createEventSchema.parse(input);

    const [row] = await sql`
        INSERT INTO events (
            name,
            description,
            participation_type,
            event_type,
            max_allowed,
            venue,
            start_time,
            end_time,
            registration_start,
            registration_end,
            created_by
        )
        VALUES (
            ${data.name},
            ${data.description},
            ${data.participation_type},
            ${data.event_type},
            ${data.max_allowed},
            ${data.venue},
            ${data.start_time},
            ${data.end_time},
            ${data.registration_start},
            ${data.registration_end},
            ${data.created_by ?? null}
        )
        RETURNING
            id,
            name,
            description,
            participation_type,
            event_type,
            max_allowed,
            venue,
            start_time,
            end_time,
            registration_start,
            registration_end,
            created_by,
            created_at,
            updated_at;
    `;

    return eventSchema.parse(row);
}