import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { getUserById } from "../db/queries"

type Variables = {
    user_id: string
}

export const paymentStatusMiddleware = createMiddleware<{ Variables: Variables }>(
    async (c, next) => {
        const userId = c.get("user_id")

        const user = await getUserById(userId)

        if (!user) {
            throw new HTTPException(404, { message: "User not found" })
        }

        const { payment_status } = user

        if (payment_status !== "PAID" && payment_status !== "EXEMPTED") {
            throw new HTTPException(402, { message: "Payment required" })
        }

        await next()
    }
)
