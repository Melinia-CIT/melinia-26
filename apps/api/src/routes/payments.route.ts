import {Hono} from "hono"

import Razorpay from "razorpay";

import crypto from "crypto";

import sql from "../db/connection";
import { authMiddleware } from "../middleware/auth.middleware";

const keyId=process.env.RAZORPAY_KEY_ID;
const secretKey=process.env.RAZORPAY_KEY_SECRET;

if(!keyId || !secretKey){
    throw new Error("Razorpay keys missing");
}
const razorpay=new Razorpay({
    key_id:keyId,
    key_secret:secretKey,
});


export function registerPayments(app:Hono){
    
    
    app.post("/register-melinia",authMiddleware, async (c) => {
        try {
            // Example: userId from auth middleware
            const user_id = c.get('user_id');

            const order = await razorpay.orders.create({
            amount: 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            });

            // ✅ Store order in payments table
            await sql`
            INSERT INTO payments (
                user_id,
                order_id,
                payment_status,
                razorpay_order_created_at
            )
            VALUES (
                ${user_id},
                ${order.id},
                'CREATED',
                ${new Date(order.created_at * 1000)}
            )
            `;

            return c.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            });
        } catch (err) {
            console.error("Order creation failed:", err);
            return c.json({ error: "Failed to create order" }, 500);
        }
    });





    

   app.post("/webhook/razorpay", async (c) => {

        console.log("webhook hs been triggered");

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const signature = c.req.header("x-razorpay-signature")!;
        const body = await c.req.text();

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return c.json({ error: "Invalid signature" }, 400);
        }

        const event = JSON.parse(body);

        if (
            event.event === "payment.captured" ||
            event.event === "payment.failed"
        ) {
            const payment = event.payload.payment.entity;

            const status =
            event.event === "payment.captured" ? "PAID" : "FAILED";

            // ✅ Update payment record
            await sql`
            UPDATE payments
            SET
                payment_id = ${payment.id},
                payment_status = ${status},
                razorpay_payment_created_at = ${new Date(
                payment.created_at * 1000
                )},
                updated_at = CURRENT_TIMESTAMP
            WHERE order_id = ${payment.order_id}
                AND payment_status != 'PAID'
            `;
        }

        return c.json({ status: "ok" });
    });

    app.get("/payments-status",authMiddleware, async (c) => {
    
        try {
            const userId = c.get('user_id');

            // 1️⃣ Check if user exists
            const [user] = await sql`
            SELECT id FROM users WHERE id = ${userId}
            `;

            if (!user) {
            return c.json(
                { error: "User not found" },
                404
            );
            }

            // 2️⃣ Get latest payment
            const [payment] = await sql`
            SELECT payment_status
            FROM payments
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 1
            `;

            if (!payment) {
            return c.json(
                { error: "No payment record found" },
                404
            );
            }

            // 3️⃣ Handle payment states
            if (payment.payment_status === "PAID") {
            return c.json(
                { paid: true },
                200
            );
            }

            if (payment.payment_status === "CREATED") {
            return c.json(
                { error: "Payment pending" },
                202
            );
            }

            if (payment.payment_status === "FAILED") {
            return c.json(
                { error: "Payment failed" },
                402
            );
            }

            // 4️⃣ Fallback (should never happen)
            return c.json(
            { error: "Invalid payment state" },
            500
            );

        } catch (err) {
            console.error("Payment status check failed:", err);
            return c.json(
            { error: "Internal server error" },
            500
            );
        }
    });


};