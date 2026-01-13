import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import NumberFlow from "@number-flow/react"
import { FloatingPathsBackground } from "../ui/floating-paths"
import confetti from "canvas-confetti"
import { cn } from "../../lib/utils"

const TARGET_AMOUNT = 100000
const ANIMATION_DURATION = 2000

export default function PrizePoolSection() {
    const [currentAmount, setCurrentAmount] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const [shouldShimmer, setShouldShimmer] = useState(false)
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
            const startTime = Date.now()

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
                const easedProgress = 1 - Math.pow(1 - progress, 3)

                const animatedValue = Math.floor(TARGET_AMOUNT * easedProgress)
                setCurrentAmount(animatedValue)

                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    setShouldShimmer(true)
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col items-center gap-3"
                >
                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-white tracking-wide font-heading">
                        Prize Pool
                    </h2>
                    <div className="flex items-baseline gap-1">
                        <div className="relative inline-block">
                            <motion.div className="transition-all duration-300">
                                <NumberFlow
                                    value={currentAmount}
                                    className={cn(
                                        "text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tabular-nums",
                                        shouldShimmer
                                            ? "bg-gradient-to-r from-transparent via-white/70 to-transparent bg-clip-text text-transparent bg-[length:200%_100%] animate-[var(--animate-shimmer)]"
                                            : "text-white"
                                    )}
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
                    </div>
                    <p className="text-xs md:text-sm text-white/60 font-body tracking-wider uppercase">
                        Worth of prizes to be won
                    </p>
                </motion.div>
            </motion.div>
        </section>
    )
}
