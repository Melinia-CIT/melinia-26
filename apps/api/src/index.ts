import { Hono } from "hono"
import { cors } from "hono/cors"
import { events, auth, user, teams, payment, college, coupons, organizer } from "./routes"
import { HTTPException } from "hono/http-exception"
import { requestLogger } from "./middleware/logger.middleware"
import { setupLogRotation } from "./middleware/logger.config"

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

v1.get("/ping", async c => {
	return c.json("pong")
})

v1.route("/auth", auth)
v1.route("/users", user)
v1.route("/events", events)
v1.route("/teams", teams)
v1.route("/colleges", college)
v1.route("/payment", payment)
v1.route("/coupons", coupons)
v1.route("/organizer", organizer)

app.route("/api/v1", v1)

Bun.serve({
	fetch: app.fetch,
	reusePort: true,
})
