import { motion } from "framer-motion"
import CountdownTimer from "../ui/countdown-timer"
import { FloatingPathsBackground } from "../ui/floating-paths"

export default function Countdown() {
    return (
        <section className="relative w-full py-16 md:py-24 overflow-hidden bg-zinc-950">
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
                    <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Ready. Set. Fest.
                    </h2>

                    <CountdownTimer />
                </div>
            </motion.div>
        </section>
    )
}
