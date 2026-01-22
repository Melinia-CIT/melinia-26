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
	status: "PAID" | "FAILED" | "REFUNDED" | "PENDING"
	paid?: boolean
	error?: string
}

export const paymentService = {
	createOrder: async (): Promise<OrderResponse> => {
		const response = await api.post<OrderResponse>("/payment/register-melinia")
		return response.data
	},

	getPaymentStatus: async (): Promise<PaymentStatusResponse> => {
		try {
			const response = await api.get("/payment/payment-status")
			if (response.status === 200) {
				return { status: "PAID", paid: true }
			}
			return { status: "PENDING", error: "Unknown status" }
		} catch (error: unknown) {
			const err = error as { response?: { status?: number; data?: { error?: string } } }
			if (err.response?.status === 202) {
				return { status: "PENDING", error: err.response.data?.error }
			}
			if (err.response?.status === 402) {
				const errorMsg = err.response.data?.error
				if (errorMsg?.toLowerCase().includes("failed")) {
					return { status: "FAILED", error: errorMsg }
				}
				if (errorMsg?.toLowerCase().includes("refunded")) {
					return { status: "REFUNDED", error: errorMsg }
				}
			}
			if (err.response?.status === 404) {
				return { status: "PENDING", paid: false, error: "No payment record" }
			}
			throw error
		}
	},
}
