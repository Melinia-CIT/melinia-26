import z from "zod";

export const createCouponRequestSchema = z.object({
    code: z.string()
        .trim()
        .min(3, "Coupon code must be at least 3 characters")
        .transform((val) => val.toUpperCase()),
});

export const couponResponseSchema = z.object({
    id: z.number(),
    code: z.string(),
    created_at: z.coerce.date(),
});

export const GetCouponsResponseSchema = z.object({
    coupons: z.array(couponResponseSchema),
});

export const couponRedemptionDetailSchema = z.object({
    id: z.number(),
    coupon: z.string(),
    redeemed_at: z.coerce.date(),
    user: z.object({
        id: z.string().nullable(),
        email: z.string().nullable(),
        name: z.string().nullable(),
    }).nullable(),
});

export const redeemCouponSchema = z.object({
    id: z.number(),
    code: z.string(),
    user_id: z.string(),
    redeemed_at: z.coerce.date()
})

export const checkCouponRequestSchema = z.object({
    code: z.string()
        .trim()
        .min(1, "Coupon code cannot be empty")
        .transform((val) => val.toString().toUpperCase()),
});

export type CreateCoupon = z.infer<typeof createCouponRequestSchema>;
export type Coupon = z.infer<typeof couponResponseSchema>;
export type CheckCoupon = z.infer<typeof checkCouponRequestSchema>;
export type ReedeemCoupon = z.infer<typeof redeemCouponSchema>;
