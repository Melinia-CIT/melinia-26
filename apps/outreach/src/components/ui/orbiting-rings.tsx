import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

interface RingConfig {
    size: number
    duration: number
    dots: number
    color: string
    reverse: boolean
}

const ringConfigs: RingConfig[] = [
    { size: 300, duration: 30, dots: 6, color: "#FF0066", reverse: false },
    { size: 500, duration: 45, dots: 8, color: "#9D00FF", reverse: true },
    { size: 700, duration: 60, dots: 10, color: "#FF0066", reverse: false },
]

function OrbitingRing({ config }: { config: RingConfig }) {
    const dotElements = Array.from({ length: config.dots }, (_, i) => {
        const angle = (i * 360) / config.dots
        return { angle, delay: (i * config.duration) / config.dots / (config.reverse ? -1 : 1) }
    })

    return (
        <motion.div
            className="absolute rounded-full border"
            style={{
                width: config.size,
                height: config.size,
                borderColor: config.color,
                borderWidth: "1px",
                opacity: 0.15,
            }}
            animate={{
                rotate: config.reverse ? 360 : -360,
            }}
            transition={{
                duration: config.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
            }}
        >
            {dotElements.map((dot, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: config.color,
                        boxShadow: `0 0 10px ${config.color}`,
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${dot.angle}deg) translateY(-${config.size / 2}px)`,
                    }}
                />
            ))}
        </motion.div>
    )
}

export function OrbitingRingsBackground({
    children,
    className,
}: {
    className?: string
    children?: React.ReactNode
}) {
    const starPositions = Array.from({ length: 25 }, (_, i) => ({
        left: `${(i * 17 + 23) % 100}%`,
        top: `${(i * 13 + 37) % 100}%`,
        delay: i * 0.2,
        duration: 3 + (i % 4),
    }))

    return (
        <div className={cn("w-full relative overflow-hidden", className)}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                    <defs>
                        <radialGradient id="orbit-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FF0066" stopOpacity="0.12" />
                            <stop offset="50%" stopColor="#9D00FF" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#orbit-glow)" />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                    {ringConfigs.map((config, index) => (
                        <OrbitingRing key={index} config={config} />
                    ))}
                </div>

                <div className="absolute inset-0">
                    {starPositions.map((pos, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full"
                            style={{
                                backgroundColor: i % 2 === 0 ? "#FF0066" : "#9D00FF",
                                left: pos.left,
                                top: pos.top,
                            }}
                            animate={{
                                opacity: [0.15, 0.5, 0.15],
                                scale: [0.8, 1.3, 0.8],
                            }}
                            transition={{
                                duration: pos.duration,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                                delay: pos.delay,
                            }}
                        />
                    ))}
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/25 to-zinc-950/50" />
            {children}
        </div>
    )
}
