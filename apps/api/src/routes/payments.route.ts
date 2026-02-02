import { Hono } from "hono"
import Razorpay from "razorpay"
import crypto from "crypto"
import { HTTPException } from "hono/http-exception"
import { authMiddleware } from "../middleware/auth.middleware"
import { paymentStatusMiddleware } from "../middleware/paymentStatus.middleware"
import {
    getUserEmail,
    createPaymentRecord,
    updatePaymentStatus,
    getUserLatestPaymentStatus,
    checkUserExistsById,
    getUserIdByOrderId,
    updateUserPaymentStatus,
} from "../db/queries"

const keyId = process.env.RAZORPAY_KEY_ID
const secretKey = process.env.RAZORPAY_KEY_SECRET

if (!keyId || !secretKey) {
    throw new Error("Razorpay keys missing")
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: secretKey,
})

export const payment = new Hono()

payment.post("/register-melinia", authMiddleware, async c => {
    const user_id = c.get("user_id")

    const user = await getUserEmail(user_id)

    if (!user) {
        throw new HTTPException(404, { message: "User not found" })
    }

    try {
        const order = await razorpay.orders.create({
            amount: 30000,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        })

        await createPaymentRecord(user_id, order.id, user.email, order)

        return c.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        })
    } catch (err) {
        console.error("Order creation failed:", err)
        throw new HTTPException(500, { message: "Failed to create order" })
    }
})

payment.post("/webhook", async c => {
    console.log("Razorpay webhook triggered")

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!
    const signature = c.req.header("x-razorpay-signature")!
    const body = await c.req.text()

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    if (expectedSignature !== signature) {
        throw new HTTPException(400, { message: "Invalid signature" })
    }

    const event = JSON.parse(body)

    if (event.event === "payment.captured" || event.event === "payment.failed") {
        const payment = event.payload.payment.entity

        const status = event.event === "payment.captured" ? "PAID" : "FAILED"
        const paidAt = status === "PAID" ? new Date(payment.created_at * 1000) : null

        await updatePaymentStatus(payment, status, paidAt)

        if (status === "PAID") {
            const userId = await getUserIdByOrderId(payment.order_id)
            if (userId) {
                await updateUserPaymentStatus(userId, "PAID")
            }
        }
    }

    return c.json({ status: "ok" })
})

payment.get("/payment-status", authMiddleware, paymentStatusMiddleware, async c => {
    try {
        return c.json({ paid: true }, 200)
    } catch (err) {
        console.error("Payment status check failed:", err)
        throw new HTTPException(500, { message: "Internal server error" })
    }
})
