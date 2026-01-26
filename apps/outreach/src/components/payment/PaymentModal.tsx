import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Xmark, CreditCard, SystemRestart, CheckCircle, InfoCircle } from "iconoir-react"
import { paymentService, type OrderResponse } from "../../services/payment"

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
    }, []);

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
                    toast.success("Payment successful!")
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-geist">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isRequired ? onClose : undefined}
            />
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-white font-inst">Payment</h2>
                        {isRequired && <span className="text-xs text-zinc-400">Required</span>}
                    </div>
                    {(
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors"
                            disabled={isProcessing || paymentStatus === "processing"}
                        >
                            <Xmark width={25} height={25} />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {hasAlreadyPaid ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle width={32} height={32} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Payment Completed
                            </h3>
                            <p className="text-zinc-400 text-sm mb-6">
                                You have already completed your registration payment.
                            </p>
                            {!isRequired && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all duration-200"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {paymentStatus === "idle" && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <CreditCard
                                                width={32}
                                                height={32}
                                                className="text-zinc-300"
                                            />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            Complete Registration
                                        </h3>
                                        <p className="text-zinc-400 text-sm">
                                            Pay ₹1 to complete your registration and unlock all
                                            features
                                        </p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400">Registration Fee</span>
                                            <span className="text-white font-semibold">₹1.00</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400">Convenience Fee</span>
                                            <span className="text-white font-semibold">₹0.00</span>
                                        </div>
                                        <div className="border-t border-zinc-700 my-2 pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-semibold">
                                                    Total
                                                </span>
                                                <span className="text-lg font-bold text-white">
                                                    ₹1.00
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attention Box */}
                                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <InfoCircle width={20} height={20} className="text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-yellow-100 font-xs leading-relaxed">
                                            This payment covers only the Melinia’26 Main Track, Flagship events are hosted on Unstop and require separate payment.
                                        </p>
                                    </div>


                                    <button
                                        onClick={handlePay}
                                        disabled={isProcessing}
                                        className="w-full py-3 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <SystemRestart
                                                    width={18}
                                                    height={18}
                                                    className="animate-spin"
                                                    strokeWidth={1.5}
                                                />
                                                Processing...
                                            </>
                                        ) : (
                                            "Pay ₹1"
                                        )}
                                    </button>

                                    <p className="text-xs text-zinc-500 text-center">
                                        Secured by Razorpay. Your payment information is safe.
                                    </p>
                                </div>
                            )}

                            {paymentStatus === "processing" && (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                        <SystemRestart
                                            width={32}
                                            height={32}
                                            className="animate-spin text-zinc-300"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Verifying Payment
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        Please wait while we verify your payment...
                                    </p>
                                </div>
                            )}

                            {paymentStatus === "success" && (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle
                                            width={32}
                                            height={32}
                                            className="text-green-500"
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Payment Successful!
                                    </h3>
                                    <p className="text-zinc-400 text-sm mb-6">
                                        Your registration is complete. You can now access all
                                        features.
                                    </p>
                                </div>
                            )}

                            {paymentStatus === "error" && (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                        <InfoCircle
                                            width={32}
                                            height={32}
                                            className="text-red-500"
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Payment Failed
                                    </h3>
                                    <p className="text-zinc-400 text-sm mb-6">
                                        There was an issue processing your payment. Please try
                                        again.
                                    </p>
                                    <button
                                        onClick={handleRetry}
                                        className="w-full py-3 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg transition-all duration-200"
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
