import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import NumberFlow from "@number-flow/react"
import { FloatingPathsBackground } from "../ui/floating-paths"
import confetti from "canvas-confetti"
import { cn } from "../../lib/utils"

const TARGET_AMOUNT = 100000
const ANIMATION_DURATION = 1600
const PLUS_ANIMATION_DELAY = 0

export default function PrizePoolSection() {
    const [currentAmount, setCurrentAmount] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const [shouldShimmer, setShouldShimmer] = useState(false)
    const [showPlus, setShowPlus] = useState(false)
    const [animationComplete, setAnimationComplete] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isInView = useInView(sectionRef, { once: true, amount: 0.5 })

    useEffect(() => {
        if (isInView && !hasAnimated && canvasRef.current) {
            setHasAnimated(true)
            const confettiInstance = confetti.create(canvasRef.current, {
                resize: true,
                useWorker: true,
            })

            setShowPlus(true)

            setTimeout(() => {
                const startTime = Date.now()

                const animate = () => {
                    const elapsed = Date.now() - startTime
                    const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
                    const easedProgress = 1 - Math.pow(1 - progress, 4)

                    const animatedValue = Math.floor(TARGET_AMOUNT * easedProgress)
                    setCurrentAmount(animatedValue)

                    if (progress < 1) {
                        requestAnimationFrame(animate)
                    } else {
                        setShouldShimmer(true)
                        setAnimationComplete(true)
                        confettiInstance({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ["#00FFFF", "#FF00FF", "#9D00FF", "#FF0066"],
                        })
                        setTimeout(() => setShouldShimmer(false), 1000)
                    }
                }

                animate()
            }, PLUS_ANIMATION_DELAY)
        }
    }, [isInView, hasAnimated])

    return (
        <section
            ref={sectionRef}
            className="relative w-full py-16 md:py-24 overflow-hidden bg-zinc-950"
        >
            <FloatingPathsBackground position={1} className="absolute inset-0">
                <div className="absolute inset-0" />
            </FloatingPathsBackground>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
            />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center"
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-8 md:mb-12 relative"
                >
                    <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Prize Pool
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 -rotate-[2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="flex items-center gap-2">
                        <div className="relative inline-block">
                            <motion.div
                                className="transition-all duration-300"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: showPlus ? 1 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <NumberFlow
                                    value={currentAmount}
                                    className={cn(
                                        "text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tabular-nums",
                                        shouldShimmer
                                            ? "bg-gradient-to-r from-transparent via-white/70 to-transparent bg-clip-text text-transparent bg-[length:200%_100%] animate-[var(--animate-shimmer)]"
                                            : "text-white"
                                    )}
                                    locales="en-IN"
                                    format={{
                                        useGrouping: true,
                                        style: "currency",
                                        currency: "INR",
                                        currencyDisplay: "symbol",
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }}
                                />
                            </motion.div>
                        </div>
                        <motion.span
                            initial={{ opacity: 0, x: -400, rotate: 0 }}
                            animate={
                                showPlus
                                    ? { opacity: 1, x: 0, rotate: animationComplete ? 360 : 0 }
                                    : { opacity: 0, x: -400, rotate: 0 }
                            }
                            transition={{
                                opacity: { duration: 0.3 },
                                x: { duration: 1, ease: [0.25, 0.1, 0.25, 1] },
                                rotate: { duration: 0.5, delay: 1, ease: "easeOut" },
                            }}
                            style={{ transformOrigin: "center center" }}
                            className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#FF0066] self-center"
                        >
                            +
                        </motion.span>
                    </div>
                    <p className="text-xs md:text-sm text-white/60 font-body tracking-wider uppercase">
                        Worth of prizes to be won
                    </p>
                </motion.div>
            </motion.div>
        </section>
    )
}
