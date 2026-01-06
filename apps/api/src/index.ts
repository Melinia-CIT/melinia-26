import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { events, auth, user, teamRouter, payment } from "./routes";
import college from "./routes/colleges.route";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

const v1 = new Hono();

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status);
    }

    return c.json({ message: "Internal Server Error" }, 500);
});

app.use(
    cors({
        origin: ["http://localhost:5173", "https://d2ects9rfqf4lr.cloudfront.net"],
        credentials: true
    })
);
app.use(logger());

v1.get("/ping", async (c) => {
    return c.json("pong");
});

v1.route("/auth", auth);
v1.route("/users", user);
v1.route("/events", events);
v1.route("/teams", teamRouter);
v1.route("/colleges", college);
v1.route("/payment", payment);

app.route("/api/v1", v1);

export default {
    port: 3000,
    fetch: app.fetch
};
