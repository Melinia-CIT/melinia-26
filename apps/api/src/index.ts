import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { events, auth, user, teamRouter, payments } from "./routes";

const app = new Hono();

const v1 = new Hono();

app.use(cors());
app.use(logger());

v1.get("/ping", async (c) => {
    return c.json("pong");
});

v1.route("/auth", auth);
v1.route("/user", user);
v1.route("/events", events);
v1.route("/teams", teamRouter);
v1.route("/payment",payments);

app.route("/api/v1", v1);

export default app;
