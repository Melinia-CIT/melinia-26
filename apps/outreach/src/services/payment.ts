import api from "./api"

export interface OrderResponse {
    id: string
    amount: number
    currency: string
}

export interface VerifyPaymentResponse {
    success: boolean
    message?: string
}

export interface PaymentStatusResponse {
    paid?: boolean
    error?: string
}

export const paymentService = {
    createOrder: async (): Promise<OrderResponse> => {
        const response = await api.post<OrderResponse>("/payment/register-melinia")
        return response.data
    },

    getPaymentStatus: async (): Promise<PaymentStatusResponse> => {
        const response = await api.get<PaymentStatusResponse>("/payment/payment-status")
        return response.data
    },
}
