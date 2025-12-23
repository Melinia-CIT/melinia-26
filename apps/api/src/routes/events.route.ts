import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createEventSchema, eventSchema } from "@packages/shared/dist";
import { createEvent, getEvents } from "../db/queries";

export const events = new Hono();

events.post("/events", zValidator("json", createEventSchema), async (c) => {
    const data = c.req.valid("json");

    const event = await createEvent(data);

    return c.json({
        msg: "Event created",
        data: event
    }, 201);
});

events.get("/events", async (c) => {
    const events = await getEvents();

    return c.json({
        events: events
    }, 200);
});
