import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import NumberFlow from "@number-flow/react"

const targetDate = new Date("2026-02-25T08:00:00+05:30")

interface CountdownUnitProps {
    value: number
    label: string
    delay: number
}

function CountdownUnit({ value, label, delay }: CountdownUnitProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-2 md:gap-4 w-full max-w-[140px] md:max-w-[320px] lg:max-w-[440px] xl:max-w-[560px] 2xl:max-w-[640px]"
        >
            <NumberFlow
                value={value}
                className="text-3xl md:text-5xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-semibold text-white tabular-nums"
                format={{ useGrouping: false }}
            />
            <span className="font-sans bg-gradient-to-r from-[#FF0066] to-[#FF69B4] bg-clip-text text-transparent text-[10px] md:text-xs lg:text-sm font-medium tracking-widest uppercase">
                {label}
            </span>
        </motion.div>
    )
}

function calculateTimeRemaining() {
    const now = new Date()
    const difference = targetDate.getTime() - now.getTime()

    if (difference <= 0) {
        return null
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
}

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState<{
        days: number
        hours: number
        minutes: number
        seconds: number
    } | null>(calculateTimeRemaining())

    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (!timeLeft && !isVisible) {
            return
        }

        if (!timeLeft) {
            const timer = setTimeout(() => {
                setIsVisible(false)
            }, 3000)
            return () => clearTimeout(timer)
        }

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeRemaining()
            setTimeLeft(newTimeLeft)

            if (!newTimeLeft) {
                const hideTimer = setTimeout(() => {
                    setIsVisible(false)
                }, 3000)
                return () => clearTimeout(hideTimer)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, isVisible])

    if (!isVisible) {
        return null
    }

    const displayTime = timeLeft || { days: 0, hours: 0, minutes: 0, seconds: 0 }

    return (
        <div className="relative grid grid-cols-4 gap-4 md:gap-16 lg:gap-24 xl:gap-32 2xl:gap-40 justify-items-center">
            <CountdownUnit value={displayTime.days} label="Days" delay={0} />
            <div
                className="absolute top-1/2 -translate-y-1/2 left-[25%] w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#FF0066] via-[#FF69B4] to-transparent"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
            />
            <CountdownUnit value={displayTime.hours} label="Hours" delay={0.1} />
            <div
                className="absolute top-1/2 -translate-y-1/2 left-[50%] -translate-x-[50%] w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#FF0066] via-[#FF69B4] to-transparent"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
            />
            <CountdownUnit value={displayTime.minutes} label="Minutes" delay={0.2} />
            <div
                className="absolute top-1/2 -translate-y-1/2 right-[25%] w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#FF0066] via-[#FF69B4] to-transparent"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
            />
            <CountdownUnit value={displayTime.seconds} label="Seconds" delay={0.3} />
        </div>
    )
}
