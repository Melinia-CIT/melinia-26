import { useRef, useEffect, useState } from "react"
import { UseMutationResult } from "@tanstack/react-query"

interface OtpFormProps {
    mutation: UseMutationResult<any, Error, { otp: string }, unknown>
    isVerified: boolean
    onOtpSubmit: (otp: string) => void
}

const OtpForm = ({ mutation, isVerified, onOtpSubmit }: OtpFormProps) => {
    const [otpValue, setOtpValue] = useState<string[]>(["", "", "", "", "", ""])
    const [submitted, setSubmitted] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    // Focus first input when component mounts
    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    // Reset submitted state if mutation fails
    useEffect(() => {
        if (mutation.isError) {
            setSubmitted(false)
        }
    }, [mutation.isError])

    const handleOtpChange = (index: number, value: string) => {
        if (submitted || mutation.isPending || isVerified) return
        const sanitizedValue = value.replace(/[^0-9]/g, "")
        const newOtp = [...otpValue]
        newOtp[index] = sanitizedValue
        setOtpValue(newOtp)

        // Auto focus next input
        if (sanitizedValue && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto submit when full
        const fullOtp = newOtp.join("")
        if (fullOtp.length === 6) {
            setSubmitted(true)
            onOtpSubmit(fullOtp)
            setTimeout(() => inputRefs.current[5]?.focus(), 0)
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        if (submitted || mutation.isPending || isVerified) return
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text")
        const pastedOtp = pastedData.replace(/[^0-9]/g, "").slice(0, 6)

        if (pastedOtp.length > 0) {
            const newOtp = [...otpValue]
            for (let i = 0; i < pastedOtp.length; i++) {
                newOtp[i] = pastedOtp[i]
            }
            setOtpValue(newOtp)

            const nextIndex = Math.min(pastedOtp.length, 5)
            inputRefs.current[nextIndex]?.focus()

            const fullOtp = newOtp.join("")
            if (fullOtp.length === 6) {
                setSubmitted(true)
                onOtpSubmit(fullOtp)
                setTimeout(() => inputRefs.current[5]?.focus(), 0)
            }
        }
    }

    const handleInput = (index: number, e: React.FormEvent<HTMLInputElement>) => {
        const target = e.currentTarget
        const value = target.value
        
        // Handle paste on input event for better mobile support
        if (value.length > 1) {
            const sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, 6)
            if (sanitizedValue.length > 1) {
                const newOtp = [...otpValue]
                for (let i = 0; i < sanitizedValue.length; i++) {
                    newOtp[i] = sanitizedValue[i]
                }
                setOtpValue(newOtp)

                const nextIndex = Math.min(sanitizedValue.length, 5)
                inputRefs.current[nextIndex]?.focus()

                const fullOtp = newOtp.join("")
                if (fullOtp.length === 6) {
                    setSubmitted(true)
                    onOtpSubmit(fullOtp)
                    setTimeout(() => inputRefs.current[5]?.focus(), 0)
                }
                return
            }
        }
        
        handleOtpChange(index, value)
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (submitted || mutation.isPending || isVerified) return
        if (e.key === "Backspace" && !otpValue[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-2 sm:gap-4" ref={containerRef} onPaste={handlePaste}>
                {otpValue.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => {
                            inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        readOnly={submitted || mutation.isPending || isVerified}
                        onInput={e => handleInput(index, e)}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        className={`w-full aspect-square rounded-lg bg-zinc-900 border text-center text-xl font-bold text-white focus:outline-none focus:ring-2 transition-colors
              ${submitted || mutation.isPending || isVerified ? "opacity-50 cursor-not-allowed" : ""}
              ${mutation.isError ? "border-red-500 focus:ring-red-500/50" : "border-zinc-800 focus:ring-zinc-600"}
            `}
                    />
                ))}
            </div>
        </div>
    )
}

export default OtpForm
