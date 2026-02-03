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

    // Helper function to set cursor at the end
    const setCursorToEnd = (input: HTMLInputElement | null) => {
        if (input) {
            const length = input.value.length
            input.setSelectionRange(length, length)
        }
    }

    // Keep cursor at the end when value changes
    useEffect(() => {
        inputRefs.current.forEach((input) => {
            if (input && document.activeElement === input) {
                setCursorToEnd(input)
            }
        })
    }, [otpValue])

    const handleOtpChange = (index: number, value: string) => {
        if (submitted || mutation.isPending || isVerified) return
        
        const sanitizedValue = value.replace(/[^0-9]/g, "")
        
        // Handle multi-character input (from Gboard suggestions, autocomplete, etc.)
        if (sanitizedValue.length > 1) {
            const newOtp = [...otpValue]
            const digitsToFill = sanitizedValue.slice(0, 6) // Limit to 6 digits
            
            // Fill from current index onwards
            for (let i = 0; i < digitsToFill.length && (index + i) < 6; i++) {
                newOtp[index + i] = digitsToFill[i]
            }
            
            setOtpValue(newOtp)
            
            // Focus the next empty field or last field
            const nextIndex = Math.min(index + digitsToFill.length, 5)
            inputRefs.current[nextIndex]?.focus()
            
            // Auto submit if complete
            const fullOtp = newOtp.join("")
            if (fullOtp.length === 6) {
                setSubmitted(true)
                onOtpSubmit(fullOtp)
                setTimeout(() => inputRefs.current[5]?.focus(), 0)
            }
            return
        }
        
        // Handle single character input (original logic)
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

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (submitted || mutation.isPending || isVerified) return
        
        if (e.key === "Backspace" && !otpValue[index] && index > 0) {
            e.preventDefault()
            inputRefs.current[index - 1]?.focus()
        }
        
        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault()
            inputRefs.current[index - 1]?.focus()
        }
        
        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault()
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setCursorToEnd(e.target)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-2 sm:gap-4">
                {otpValue.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => {
                            inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        readOnly={submitted || mutation.isPending || isVerified}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        onFocus={handleFocus}
                        className={
                            `w-full aspect-square rounded-lg bg-zinc-900 border text-center text-xl font-bold text-white focus:outline-none focus:ring-2 transition-colors
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