import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Xmark, CreditCard, SystemRestart, CheckCircle, InfoCircle } from "iconoir-react"
import { TicketPercent } from "lucide-react"
import { paymentService, type OrderResponse } from "../../services/payment"
import { couponService } from "../../services/coupon"

interface RazorpayOptions {
    key: string
    amount: number
    currency: string
    order_id: string
    name: string
    description: string
    handler: () => void
    modal: {
        ondismiss: () => void
    }
    prefill: {
        name: string
        email: string
    }
    theme: {
        color: string
    }
}

interface RazorpayInstance {
    open: () => void
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance
    }
}

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    userName?: string
    userEmail?: string
    onPaymentSuccess?: () => void
    isRequired?: boolean
    hasAlreadyPaid?: boolean
}

export default function PaymentModal({
    isOpen,
    onClose,
    userName = "",
    userEmail = "",
    onPaymentSuccess,
    isRequired = false,
    hasAlreadyPaid = false,
}: PaymentModalProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">(
        "idle"
    )
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const [couponCode, setCouponCode] = useState("")
    const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false)
    const queryClient = useQueryClient()

    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        script.onload = () => {
            setIsScriptLoaded(true)
        }
        script.onerror = () => {
            toast.error("Failed to load payment gateway. Please refresh the page.")
        }
        document.body.appendChild(script)
    }, [])

    const createPaymentOrderMutation = useMutation({
        mutationFn: paymentService.createOrder,
        onSuccess: async order => {
            initiatePayment(order)
        },
        onError: (error: Error) => {
            setIsProcessing(false)
            setPaymentStatus("error")
            toast.error(error.message || "Failed to create payment order")
        },
    })

    const initiatePayment = (order: OrderResponse) => {
        if (!window.Razorpay || !isScriptLoaded) {
            toast.error("Payment gateway not loaded. Please try again.")
            setIsProcessing(false)
            setPaymentStatus("error")
            return
        }

        const options: RazorpayOptions = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            order_id: order.id,
            name: "Melinia",
            description: "Registration Payment",
            handler: async () => {
                setPaymentStatus("processing")
                try {
                    setPaymentStatus("success")
                    toast.success("payment successfull")
                    queryClient.invalidateQueries({ queryKey: ["userMe"] })
                    queryClient.invalidateQueries({ queryKey: ["paymentStatus"] })
                    setTimeout(() => {
                        onPaymentSuccess?.()
                        onClose()
                    }, 2000)
                } catch {
                    setPaymentStatus("error")
                    toast.error("Payment processing failed")
                }
            },
            modal: {
                ondismiss: () => {
                    setIsProcessing(false)
                    setPaymentStatus("idle")
                },
            },
            prefill: {
                name: userName,
                email: userEmail,
            },
            theme: {
                color: "#fafafa",
            },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const handlePay = () => {
        if (!isScriptLoaded) {
            toast.error("Payment gateway is loading. Please wait...")
            return
        }
        setIsProcessing(true)
        setPaymentStatus("processing")
        createPaymentOrderMutation.mutate()
    }

    const handleRetry = () => {
        setPaymentStatus("idle")
    }

    const handleCouponRedeem = async () => {
        if (!couponCode.trim()) {
            toast.error("Please enter a coupon code")
            return
        }

        setIsRedeemingCoupon(true)

        try {
            await couponService.redeemCoupon(couponCode.trim())
            toast.success("payment successfull")
            queryClient.invalidateQueries({ queryKey: ["userMe"] })
            queryClient.invalidateQueries({ queryKey: ["paymentStatus"] })
            setCouponCode("")
            onPaymentSuccess?.()
            onClose()
        } catch (error: unknown) {
            const err = error as { response?: { status?: number; data?: { message?: string } } }
            if (err.response?.status === 404) {
                toast.error("Invalid coupon code")
            } else if (err.response?.status === 409) {
                toast.error("This coupon has already been used")
            } else {
                toast.error(err.response?.data?.message || "Failed to redeem coupon")
            }
        } finally {
            setIsRedeemingCoupon(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-geist">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isRequired ? onClose : undefined}
            />
            <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h2 className="text-base sm:text-lg font-semibold text-white font-inst">
                            Payment
                        </h2>
                        {isRequired && (
                            <span className="text-[10px] sm:text-xs text-zinc-400">Required</span>
                        )}
                    </div>
                    {
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors p-1"
                            disabled={isProcessing || paymentStatus === "processing"}
                        >
                            <Xmark className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    }
                </div>

                <div className="p-4 sm:p-6">
                    {hasAlreadyPaid ? (
                        <div className="text-center py-6 sm:py-8">
                            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                Payment Completed
                            </h3>
                            <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2">
                                You have already completed your registration payment.
                            </p>
                            {!isRequired && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {paymentStatus === "idle" && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="text-center">
                                        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-300" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">
                                            Complete Registration
                                        </h3>
                                        <p className="text-zinc-400 text-xs sm:text-sm px-2">
                                            Pay ₹300 to complete your registration and unlock all
                                            features
                                        </p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-3 sm:p-4 border border-zinc-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400 self-center text-xs sm:text-sm">
                                                Registration Fee
                                            </span>
                                            <span className="text-white font-semibold text-sm sm:text-base">
                                                ₹300.00
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400 text-xs sm:text-sm">
                                                Convenience Fee
                                            </span>
                                            <span className="text-white font-semibold text-sm sm:text-base">
                                                ₹0.00
                                            </span>
                                        </div>
                                        <div className="border-zinc-700 my-2 pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-semibold text-sm sm:text-base">
                                                    Total
                                                </span>
                                                <span className="text-base sm:text-lg font-bold text-white">
                                                    ₹300.00
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attention Box */}
                                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <InfoCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] sm:text-xs text-yellow-100 font-xs leading-relaxed">
                                            Covers only the Melinia'26 Main Track. Flagship events
                                            require separate payment on Unstop.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handlePay}
                                        disabled={isProcessing}
                                        className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <SystemRestart
                                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin"
                                                    strokeWidth={1.5}
                                                />
                                                Processing...
                                            </>
                                        ) : (
                                            "Pay ₹300"
                                        )}
                                    </button>

                                    <p className="text-[10px] sm:text-xs text-zinc-500 text-center">
                                        Secured by Razorpay. Your payment information is safe.
                                    </p>

                                    {/* Inline Coupon Code Section */}
                                    <div className="border-t border-zinc-800 pt-3 sm:pt-4">
                                        <p className="text-white-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-center">
                                            Have a coupon code?
                                        </p>
                                        <div className="relative">
                                            <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-white-500">
                                                <TicketPercent
                                                    strokeWidth={1.5}
                                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={e => {
                                                    setCouponCode(e.target.value.toUpperCase())
                                                }}
                                                placeholder="MLNCXXXXXX"
                                                className="w-full rounded-lg bg-zinc-800/50 border border-white-700 pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white-600 transition-colors duration-200 uppercase"
                                                disabled={isRedeemingCoupon}
                                            />
                                        </div>
                                        {!couponCode && (
                                            <p className="text-zinc-500 text-[10px] sm:text-xs mt-1.5 pl-1 flex items-center gap-1 sm:gap-1.5">
                                                <InfoCircle className="w-3 h-3" strokeWidth={1.5} />
                                                Optional - Enter coupon to skip payment
                                            </p>
                                        )}
                                        {couponCode.trim() && (
                                            <button
                                                onClick={handleCouponRedeem}
                                                disabled={isRedeemingCoupon || !couponCode.trim()}
                                                className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 px-3 sm:px-4 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                            >
                                                {isRedeemingCoupon ? (
                                                    <>
                                                        <SystemRestart
                                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin"
                                                            strokeWidth={1.5}
                                                        />
                                                        Applying...
                                                    </>
                                                ) : (
                                                    "Apply Coupon"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {paymentStatus === "processing" && (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                        <SystemRestart
                                            className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-zinc-300"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                        Verifying Payment
                                    </h3>
                                    <p className="text-zinc-400 text-xs sm:text-sm px-2">
                                        Please wait while we verify your payment...
                                    </p>
                                </div>
                            )}

                            {paymentStatus === "success" && (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                        Payment Successful!
                                    </h3>
                                    <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2">
                                        Your registration is complete. You can now access all
                                        features.
                                    </p>
                                </div>
                            )}

                            {paymentStatus === "error" && (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                        <InfoCircle
                                            className="w-6 h-6 sm:w-8 sm:h-8 text-red-500"
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                        Payment Failed
                                    </h3>
                                    <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2">
                                        There was an issue processing your payment. Please try
                                        again.
                                    </p>
                                    <button
                                        onClick={handleRetry}
                                        className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
