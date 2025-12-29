import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { events, auth, user, teamRouter } from "./routes";

const app = new Hono();

const v1 = new Hono();

app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use(logger());

v1.get("/ping", async (c) => {
    return c.json("pong");
});

v1.route("/auth", auth);
v1.route("/user", user);
v1.route("/events", events);
v1.route("/teams", teamRouter);

app.route("/api/v1", v1);

export default app;
