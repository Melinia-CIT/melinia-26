import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import './db/migrations';

const app = new Hono();

app.use(cors());
app.use(logger());

app.get("/hello", async (c) => {
    return c.json({ "msg": "hi" });
});

export default app;
