import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

export function GridPatternBackground({
    children,
    className,
}: {
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={cn("w-full relative overflow-hidden", className)}>
            <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full">
                    <defs>
                        <pattern
                            id="grid-pattern"
                            width="60"
                            height="60"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 60 0 L 0 0 0 60"
                                fill="none"
                                stroke="rgba(255,0,102,0.08)"
                                strokeWidth="0.5"
                            />
                        </pattern>
                        <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FF0066" stopOpacity="0.15" />
                            <stop offset="50%" stopColor="#9D00FF" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                    <rect width="100%" height="100%" fill="url(#glow-gradient)" />
                </svg>
            </div>
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                            backgroundColor: i % 2 === 0 ? "#FF0066" : "#9D00FF",
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>
            {children}
        </div>
    )
}
