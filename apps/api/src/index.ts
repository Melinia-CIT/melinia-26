import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { events, auth, user } from "./routes";

const app = new Hono();

app.use(cors());
app.use(logger());

app.get("/ping", async (c) => {
    return c.json("pong");
});

app.route("/", events);
app.route("/auth", auth);
app.route("/user",user);

export default app;
