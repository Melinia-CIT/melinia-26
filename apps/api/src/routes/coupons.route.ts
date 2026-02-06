import { Hono } from "hono"
import {
    couponExists,
    couponRedeemed,
    deleteCoupon,
    insertCoupon,
    redeemCoupon,
} from "../db/queries/coupons.queries"
import { HTTPException } from "hono/http-exception"
import { zValidator } from "@hono/zod-validator"
import { createCouponRequestSchema, checkCouponRequestSchema } from "@melinia/shared"
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.middleware"
import { updateUserPaymentStatus } from "../db/queries/users.queries"

export const coupons = new Hono()

coupons.post(
    "/",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("json", createCouponRequestSchema),
    async c => {
        const { code } = await c.req.valid("json")

        if (await couponExists(code)) {
            throw new HTTPException(409, { message: "Coupon already exists" })
        }

        const coupon = await insertCoupon(code)

        return c.json({ coupon, message: "Coupon created successfully" }, 200)
    }
)

coupons.delete(
    "/",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("json", createCouponRequestSchema),
    async c => {
        const { code } = await c.req.valid("json")

        if (!(await couponExists(code))) {
            throw new HTTPException(409, { message: "Coupon does not exists" })
        }

        const coupon = await deleteCoupon(code)

        return c.json({ coupon, message: "Coupon deleted successfully" }, 200)
    }
)

coupons.get("/check", zValidator("query", checkCouponRequestSchema), async c => {
    const { code } = await c.req.valid("query")

    if (!(await couponExists(code))) {
        throw new HTTPException(404, { message: "Invalid coupon code" })
    }

    if (await couponRedeemed(code)) {
        throw new HTTPException(409, { message: "Looks like this coupon has already been used." })
    }

    return c.json({ message: "Coupon is valid" }, 200)
})

coupons.post("/redeem", authMiddleware, zValidator("json", checkCouponRequestSchema), async c => {
    const { code } = c.req.valid("json")
    const userId = c.get("user_id")

    if (!(await couponExists(code))) {
        throw new HTTPException(404, { message: "Invalid coupon code" })
    }

    if (await couponRedeemed(code)) {
        throw new HTTPException(409, { message: "Coupon has already been used." })
    }

    // Redeem the coupon
    await redeemCoupon(userId, code)

    // Update user payment status to EXEMPTED
    await updateUserPaymentStatus(userId, "EXEMPTED")

    return c.json({ message: "Coupon redeemed successfully. " }, 200)
})
