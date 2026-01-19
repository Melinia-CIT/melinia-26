import { Hono } from "hono";
import { couponExists, couponRedeemed, deleteCoupon, insertCoupon } from "../db/queries/coupons.queries";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { createCouponRequestSchema, checkCouponRequestSchema } from "@melinia/shared";
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.middleware";

export const coupons = new Hono();

coupons.post(
    "/",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("json", createCouponRequestSchema),
    async (c) => {
        const { code } = await c.req.valid("json");

        if (await couponExists(code)) {
            throw new HTTPException(409, { message: "Coupon already exists" });
        }

        const coupon = await insertCoupon(code);

        return c.json({coupon, message: "Coupon created successfully"}, 200);
    }
);

coupons.delete(
    "/",
    authMiddleware,
    adminOnlyMiddleware,
    zValidator("json", createCouponRequestSchema),
    async (c) => {
        const { code } = await c.req.valid("json");

        if (!await couponExists(code)) {
            throw new HTTPException(409, { message: "Coupon does not exists" });
        }

        const coupon = await deleteCoupon(code);

        return c.json({coupon, message: "Coupon deleted successfully"}, 200);
    }
);

coupons.get(
    "/check",
    zValidator("query", checkCouponRequestSchema),
    async (c) => {
        const { code } = await c.req.valid("query");

        if (!await couponExists(code)) {
            throw new HTTPException(404, { message: "Invalid coupon code" });
        }

        if (await couponRedeemed(code)) {
            throw new HTTPException(409, { message: "Looks like this coupon has already been used." });
        }

        return c.json({ message: "Coupon is valid" }, 200);
    }
);
