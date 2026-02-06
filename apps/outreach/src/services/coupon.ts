import api from "./api"

export interface CouponCheckResponse {
    message: string
}

export interface CouponRedeemResponse {
    message: string
}

export const couponService = {
    checkCoupon: async (code: string): Promise<CouponCheckResponse> => {
        const response = await api.get<CouponCheckResponse>("/coupons/check", { code })
        return response.data
    },

    redeemCoupon: async (code: string): Promise<CouponRedeemResponse> => {
        const response = await api.post<CouponRedeemResponse>("/coupons/redeem", { code })
        return response.data
    },
}
