import { couponResponseSchema, redeemCouponSchema, type Coupon, type ReedeemCoupon } from "@packages/shared/dist";
import sql from "../connection";

export async function couponExists(code: string): Promise<boolean> {
    const rows = await sql`
        SELECT 1 FROM coupons WHERE code = ${code};
    `;

    return rows.length > 0;
}

export async function couponRedeemed(code: string): Promise<boolean> {
    const rows = await sql`
        SELECT 1
        FROM coupon_redemptions cr
        JOIN coupons c ON c.id = cr.coupon_id
        WHERE c.code = ${code};
    `;

    return rows.length > 0;
}

export async function redeemCoupon(user_id: string, code: string): Promise<ReedeemCoupon> {
    const [row] = await sql`
        WITH redemption AS (
            INSERT INTO coupon_redemptions(user_id, coupon_id)
            VALUES(
                ${user_id},
                (SELECT id FROM coupons WHERE code = ${code})
            )
            RETURNING *
        )

        SELECT
            r.id,
            r.user_id,
            c.code,
            r.redeemed_at
        FROM redemption r
        JOIN coupons c ON c.id = r.coupon_id;
    `;

    return redeemCouponSchema.parse(row);
}

export async function insertCoupon(code: string): Promise<Coupon> {
    const [coupon] = await sql`
        INSERT INTO coupons(code)
        VALUES(${code})
        RETURNING *;
    `;

    return couponResponseSchema.parse(coupon);
}

export async function deleteCoupon(code: string): Promise<Coupon> {
    const [deleted_coupon] = await sql`
        DELETE FROM coupons
        WHERE code = ${code}
        RETURNING *;
    `;

    return couponResponseSchema.parse(deleted_coupon);
}