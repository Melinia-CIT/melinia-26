import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { events } from "./routes";

const app = new Hono();

app.use(cors());
app.use(logger());

app.get("/pint", async (c) => {
    return c.json("pong");
});

app.route("/", events);

export default app;
