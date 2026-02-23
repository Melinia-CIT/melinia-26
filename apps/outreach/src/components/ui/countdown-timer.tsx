import { motion } from "framer-motion"
import NumberFlow from "@number-flow/react"

export const FEST_START = new Date("2026-02-25T08:00:00+05:30")
export const FEST_END = new Date("2026-02-25T16:00:00+05:30")

export type EventState = "countdown" | "live" | "ended"

export function getEventState(): EventState {
    const now = new Date()
    if (now >= FEST_END) return "ended"
    if (now >= FEST_START) return "live"
    return "countdown"
}

export function calculateTimeRemaining(): {
    days: number
    hours: number
    minutes: number
    seconds: number
} | null {
    const diff = FEST_START.getTime() - Date.now()
    if (diff <= 0) return null
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
    }
}

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

interface CountdownTimerProps {
    time: { days: number; hours: number; minutes: number; seconds: number }
}

// Pure display component — state managed entirely by parent
export default function CountdownTimer({ time }: CountdownTimerProps) {
    return (
        <div className="relative grid grid-cols-4 gap-4 md:gap-16 lg:gap-24 xl:gap-32 2xl:gap-40 justify-items-center">
            <CountdownUnit value={time.days} label="Days" delay={0} />
            <div
                className="absolute top-1/2 -translate-y-1/2 left-[25%] w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#FF0066] via-[#FF69B4] to-transparent"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
            />
            <CountdownUnit value={time.hours} label="Hours" delay={0.1} />
            <div
                className="absolute top-1/2 -translate-y-1/2 left-[50%] -translate-x-[50%] w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#FF0066] via-[#FF69B4] to-transparent"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
            />
            <CountdownUnit value={time.minutes} label="Minutes" delay={0.2} />
            <div
                className="absolute top-1/2 -translate-y-1/2 right-[25%] w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#FF0066] via-[#FF69B4] to-transparent"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
            />
            <CountdownUnit value={time.seconds} label="Seconds" delay={0.3} />
        </div>
    )
}
