import { motion, useReducedMotion } from "framer-motion"
import { HyperText } from "./hyper-text"
import { useId } from "react"

interface HudSectionHeaderProps {
    title: string
    color: string
    align?: "left" | "right"
    className?: string
}

export function HudSectionHeader({
    title,
    color,
    align = "left",
    className = "",
}: HudSectionHeaderProps) {
    const shouldReduceMotion = useReducedMotion()
    const shouldAnimate = !shouldReduceMotion
    const uniqueId = useId()
    const gradientId = `header-gradient-${uniqueId}`

    const containerVariants: any = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            filter: shouldAnimate ? "blur(4px)" : "blur(0px)",
        },
        show: {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
            },
        },
    }

    const glowVariants: any = {
        initial: {
            opacity: 0,
            scale: 0.8,
        },
        hover: {
            opacity: 0.6,
            scale: 1.1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
            },
        },
    }

    const glitchVariants: any = {
        normal: { x: 0, y: 0, rotate: 0 },
        glitch: {
            x: [-2, 2, -1, 1, 0],
            y: [1, -1, 1, -1, 0],
            rotate: [-0.5, 0.5, -0.3, 0.3, 0],
            transition: { duration: 0.3, ease: "easeInOut" },
        },
    }

    const dotVariants: any = {
        hidden: {
            scale: 0,
            opacity: 0,
            filter: "blur(2px)",
        },
        show: (i: number) => ({
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.3 + i * 0.05,
            },
        }),
        hover: {
            scale: 1.2,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 25,
                mass: 0.4,
            },
        },
    }

    const lineVariants: any = {
        normal: { opacity: 0.5, scale: 1 },
        pulse: {
            opacity: [0.3, 0.8, 0.3],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
        hover: {
            opacity: [0.5, 0.9, 0.5],
            scale: 1.02,
            transition: {
                duration: 0.5,
                ease: "easeInOut",
            },
        },
    }

    return (
        <div
            className={`w-full flex items-center ${align === "right" ? "justify-end" : "justify-start"} ${className}`}
        >
            <motion.div
                className="relative inline-block w-48 h-10 md:w-auto md:h-12 max-w-full"
                variants={shouldAnimate ? containerVariants : {}}
                initial={shouldAnimate ? "hidden" : "show"}
                animate="show"
            >
                <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{
                        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                        filter: "blur(12px)",
                    }}
                    variants={shouldAnimate ? glowVariants : {}}
                    initial="initial"
                    animate="hover"
                />

                <motion.div
                    variants={shouldAnimate ? glitchVariants : {}}
                    initial="normal"
                    whileHover="glitch"
                    className="relative h-full w-full overflow-hidden"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 192 40"
                        className="w-full h-full"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
                                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                                <stop offset="100%" stopColor={`${color}00`} />
                            </linearGradient>
                        </defs>
                        <motion.path
                            d="M191.5 0.5H15.457L6.457 9.5V39.5H178.457L191.5 26.457Z"
                            fill={`url(#${gradientId})`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                                duration: shouldAnimate ? 0.8 : 0,
                                delay: 0.2,
                                ease: "easeOut",
                            }}
                        />
                        <motion.path
                            d="M178.5 40H6.457V9.457L15.457 0.5H192V26.457ZM7.457 39H177.891L190.5 26.391V1.5H15.891L7.457 9.934Z"
                            fill={color}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                                duration: shouldAnimate ? 0.6 : 0,
                                delay: 0.4,
                                ease: "easeOut",
                            }}
                        />
                        <g>
                            {[
                                { cx: 181, cy: 6, index: 0 },
                                { cx: 181, cy: 10, index: 1 },
                                { cx: 186, cy: 6, index: 2 },
                                { cx: 186, cy: 10, index: 3 },
                            ].map(dot => (
                                <motion.circle
                                    key={`${dot.cx}-${dot.cy}`}
                                    cx={dot.cx}
                                    cy={dot.cy}
                                    r="1.2"
                                    fill={color}
                                    variants={dotVariants}
                                    initial="hidden"
                                    animate="show"
                                    whileHover="hover"
                                    custom={dot.index}
                                />
                            ))}
                        </g>
                        <g>
                            {[
                                { cx: 4, cy: 16, index: 4 },
                                { cx: 4, cy: 24, index: 5 },
                            ].map(dot => (
                                <motion.circle
                                    key={`${dot.cx}-${dot.cy}`}
                                    cx={dot.cx}
                                    cy={dot.cy}
                                    r="0.6"
                                    fill={color}
                                    variants={dotVariants}
                                    initial="hidden"
                                    animate="show"
                                    whileHover="hover"
                                    custom={dot.index}
                                />
                            ))}
                        </g>
                    </svg>

                    <motion.div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            className="absolute inset-y-0 w-[2px]"
                            style={{
                                background: `linear-gradient(180deg, ${color}00, ${color}, ${color}00)`,
                                boxShadow: `0 0 10px ${color}`,
                            }}
                            animate={{
                                x: ["-100%", "100%"],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1,
                            }}
                        />
                    </motion.div>

                    <div className="absolute inset-0 flex items-center justify-center px-8">
                        <div className="overflow-hidden w-full">
                            <HyperText
                                text={title}
                                className="font-mono text-xs md:text-sm text-white tracking-widest text-center uppercase truncate block"
                                duration={shouldAnimate ? 800 : 0}
                                animateOnLoad={shouldAnimate}
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                className={`flex-1 h-px ${align === "right" ? "order-first mr-4" : "ml-4"}`}
                style={{
                    background: `linear-gradient(${align === "right" ? "90deg" : "270deg"}, ${color}00, ${color}, ${color}00)`,
                }}
                variants={shouldAnimate ? lineVariants : {}}
                initial="normal"
                animate="pulse"
                whileHover="hover"
            />
        </div>
    )
}
