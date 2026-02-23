import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import CountdownTimer from "../ui/countdown-timer"
import { getEventState, calculateTimeRemaining, type EventState } from "../ui/countdown-timer"
import { FloatingPathsBackground } from "../ui/floating-paths"

const LIVE_PHRASES = [
    "THE FEST IS ON",
    "GET IN THE GAME",
    "MAKE IT COUNT",
    "YOUR MOMENT NOW",
    "GO ALL IN",
    "LIGHTS ARE UP",
]

function PulsingDot() {
    return (
        <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0066] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF0066]" />
        </span>
    )
}

function LiveBanner() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const id = setInterval(() => {
            setIndex(i => (i + 1) % LIVE_PHRASES.length)
        }, 2800)
        return () => clearInterval(id)
    }, [])

    return (
        <div className="flex flex-col items-center gap-8 md:gap-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#FF0066]/40 bg-[#FF0066]/10 backdrop-blur-sm"
            >
                <PulsingDot />
                <span className="text-[#FF0066] text-xs font-semibold tracking-[0.25em] uppercase font-sans">
                    Live Now
                </span>
            </motion.div>

            <div className="relative h-[4.5rem] md:h-24 lg:h-32 flex items-center justify-center overflow-hidden w-full">
                <AnimatePresence mode="wait">
                    <motion.h2
                        key={index}
                        initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -32, filter: "blur(8px)" }}
                        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute text-center text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight font-space"
                        style={{
                            background: "linear-gradient(90deg, #FF0066, #FF69B4, #FF0066)",
                            backgroundSize: "200% auto",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            animation: "gradientShift 3s linear infinite",
                        }}
                    >
                        {LIVE_PHRASES[index]}
                    </motion.h2>
                </AnimatePresence>
            </div>

            <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                className="w-32 md:w-48 h-[2px] rounded-full"
                style={{
                    background:
                        "linear-gradient(90deg, transparent, #FF0066, #FF69B4, transparent)",
                }}
            />
        </div>
    )
}

function EventEndedBanner() {
    return (
        <div className="flex flex-col items-center gap-8 md:gap-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/40 backdrop-blur-sm"
            >
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />
                <span className="text-zinc-400 text-xs font-semibold tracking-[0.25em] uppercase font-sans">
                    Event Ended
                </span>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
                className="text-center text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight font-space"
                style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #a1a1aa 60%, #52525b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                }}
            >
                What a fest.
            </motion.h2>

            <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
                className="w-24 md:w-36 h-[2px] rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #71717a, transparent)" }}
            />

            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.6 }}
                className="text-zinc-500 text-sm md:text-base font-sans tracking-widest uppercase"
            >
                See you at Melinia&apos;27
            </motion.p>
        </div>
    )
}

export default function Countdown() {
    const [state, setState] = useState<EventState>(getEventState)
    const [time, setTime] = useState(calculateTimeRemaining)

    // Single 1 s tick drives both the displayed time and the state machine.
    // No gap possible — both update in the same tick.
    useEffect(() => {
        const id = setInterval(() => {
            const newState = getEventState()
            const newTime = calculateTimeRemaining()
            setState(newState)
            setTime(newTime)
        }, 1000)
        return () => clearInterval(id)
    }, [])

    // Fallback so CountdownTimer always gets a valid object while in countdown state
    const displayTime = time ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }

    return (
        <section className="relative w-full py-16 md:py-24 overflow-hidden bg-zinc-950">
            <style>{`
                @keyframes gradientShift {
                    0%   { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>

            <FloatingPathsBackground position={1} className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-zinc-950/8 to-zinc-950/15" />
            </FloatingPathsBackground>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-7xl mx-auto px-6"
            >
                <div className="flex flex-col items-center gap-8 md:gap-12">
                    <AnimatePresence mode="wait">
                        {state === "countdown" && (
                            <motion.div
                                key="countdown"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center gap-8 md:gap-12 w-full"
                            >
                                <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide font-space">
                                    Ready. Set. Fest.
                                </h2>
                                <CountdownTimer time={displayTime} />
                            </motion.div>
                        )}

                        {state === "live" && (
                            <motion.div
                                key="live"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="w-full"
                            >
                                <LiveBanner />
                            </motion.div>
                        )}

                        {state === "ended" && (
                            <motion.div
                                key="ended"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="w-full"
                            >
                                <EventEndedBanner />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </section>
    )
}
