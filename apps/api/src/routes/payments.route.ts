import { Hono } from "hono"

import Razorpay from "razorpay"

import crypto from "crypto"

import { authMiddleware } from "../middleware/auth.middleware"
import {
    getUserEmail,
    createPaymentRecord,
    updatePaymentStatus,
    getUserLatestPaymentStatus,
    checkUserExistsById,
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
    try {
        const user_id = c.get("user_id")

        const user = await getUserEmail(user_id)

        if (!user) {
            return c.json({ error: "User not found" }, 404)
        }

        const order = await razorpay.orders.create({
            amount: 100,
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
        return c.json({ error: "Failed to create order" }, 500)
    }
})

payment.post("/webhook", async c => {
    console.log("Razorpay webhook triggered")

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!
    const signature = c.req.header("x-razorpay-signature")!
    const body = await c.req.text()

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    if (expectedSignature !== signature) {
        return c.json({ error: "Invalid signature" }, 400)
    }

    const event = JSON.parse(body)

    if (event.event === "payment.captured" || event.event === "payment.failed") {
        const payment = event.payload.payment.entity

        const status = event.event === "payment.captured" ? "PAID" : "FAILED"
        const paidAt = status === "PAID" ? new Date(payment.created_at * 1000) : null

        await updatePaymentStatus(payment, status, paidAt)
    }

    return c.json({ status: "ok" })
})

payment.get("/payment-status", authMiddleware, async c => {
    try {
        const userId = c.get("user_id")

        const userExists = await checkUserExistsById(userId)

        if (!userExists) {
            return c.json({ error: "User not found" }, 404)
        }

        const payment = await getUserLatestPaymentStatus(userId)

        if (!payment) {
            return c.json({ error: "No payment record found" }, 404)
        }

        if (payment.payment_status === "PAID") {
            return c.json({ paid: true }, 200)
        }

        if (payment.payment_status === "CREATED") {
            return c.json({ error: "Payment pending" }, 202)
        }

        if (payment.payment_status === "FAILED") {
            return c.json({ error: "Payment failed" }, 402)
        }

        if (payment.payment_status === "REFUNDED") {
            return c.json({ error: "Payment refunded" }, 402)
        }

        return c.json({ error: "Invalid payment state" }, 500)
    } catch (err) {
        console.error("Payment status check failed:", err)
        return c.json({ error: "Internal server error" }, 500)
    }
})
