import { Hono } from "hono"
import { cors } from "hono/cors"
import { events, auth, user, teamRouter, payment, college, coupons } from "./routes"
import { HTTPException } from "hono/http-exception"
import { requestLogger } from "./middleware/logger.middleware"
import { setupLogRotation } from "./middleware/logger.config"
import adminAuth from "./routes/adminAuth.route";

const app = new Hono()

const v1 = new Hono()

app.onError((err, c) => {
    console.error(err)

    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status)
    }

    return c.json({ message: "Internal Server Error" }, 500)
})

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://d2ects9rfqf4lr.cloudfront.net",
            "https://melinia.in",
            "https://mlndemo.melinia.in",
        ],
        credentials: true,
    })
)
app.use(requestLogger)

setupLogRotation()

<<<<<<< HEAD
v1.get("/ping", async c => {
    return c.json("pong")
})
=======
v1.route("/auth", auth);
v1.route("/users", user);
v1.route("/events", events);
v1.route("/teams", teamRouter);
v1.route("/colleges", college);
v1.route("/payment",payment);
v1.route("/admin/auth",adminAuth);
>>>>>>> 82cd92e (Included the backend files on operations module for auth operations)

v1.route("/auth", auth)
v1.route("/users", user)
v1.route("/events", events)
v1.route("/teams", teamRouter)
v1.route("/colleges", college)
v1.route("/payment", payment)
v1.route("/coupons", coupons)

app.route("/api/v1", v1)

Bun.serve({
    fetch: app.fetch,
    reusePort: true,
})
