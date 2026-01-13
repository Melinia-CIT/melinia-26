import React from "react"
import { motion } from "motion/react"
import { cn } from "../../lib/utils"

export function FloatingPathsBackground({
    position,
    children,
    className,
}: {
    position: number
    className?: string
    children: React.ReactNode
}) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }))

    return (
        <div className={cn("w-full relative", className)}>
            <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
                    <defs>
                        <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF0066" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#FF69B4" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>
                    {paths.map(path => (
                        <motion.path
                            key={path.id}
                            d={path.d}
                            stroke="url(#path-gradient)"
                            strokeWidth={path.width}
                            strokeOpacity={0.3 + path.id * 0.015}
                            initial={{ pathLength: 0.3, opacity: 0.8 }}
                            animate={{
                                pathLength: 1,
                                opacity: [0.5, 0.8, 0.5],
                                pathOffset: [0, 1, 0],
                            }}
                            transition={{
                                duration: 20 + Math.random() * 10,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                            }}
                        />
                    ))}
                </svg>
            </div>
            {children}
        </div>
    )
}
