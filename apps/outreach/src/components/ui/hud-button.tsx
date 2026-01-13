import { motion, useReducedMotion } from "framer-motion"
import type React from "react"
import { useId, useState } from "react"
import { HyperText } from "./hyper-text"

interface HudButtonProps {
    children: React.ReactNode
    variant?: "primary" | "secondary" | "purple" | "red" | "pink"
    style?: "style1" | "style2"
    size?: "small" | "default" | "large"
    onClick?: () => void
    delay?: number
    enableAnimations?: boolean
}

export function HudButton({
    children,
    variant = "primary",
    style = "style1",
    size = "default",
    onClick,
    delay = 0,
    enableAnimations = true,
}: HudButtonProps) {
    const shouldReduceMotion = useReducedMotion()
    const shouldAnimate = enableAnimations && !shouldReduceMotion
    const [isHovered, setIsHovered] = useState(false)

    const getColors = () => {
        if (variant === "purple") {
            return {
                main: "var(--color-purple)",
                gradient: "var(--color-purple)",
                text: "text-white",
                glow: "rgba(157, 0, 255, 0.4)",
                border: "var(--color-purple)",
            }
        } else if (variant === "red") {
            return {
                main: "var(--color-red)",
                gradient: "var(--color-red)",
                text: "text-white",
                glow: "rgba(255, 0, 102, 0.4)",
                border: "var(--color-red)",
            }
        } else if (variant === "pink") {
            return {
                main: "#FF69B4",
                gradient: "#FF69B4",
                text: "text-white",
                glow: "rgba(255, 105, 180, 0.4)",
                border: "#FF69B4",
            }
        } else if (variant === "primary") {
            return {
                main: "#4ade80",
                gradient: "#4ade80",
                text: "text-green-300",
                glow: "rgba(74, 222, 128, 0.3)",
                border: "#4ade80",
            }
        } else {
            return {
                main: "#64748b",
                gradient: "#64748b",
                text: "text-slate-300",
                glow: "rgba(100, 116, 139, 0.2)",
                border: "#64748b",
            }
        }
    }

    const colors = getColors()

    const buttonVariants: any = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95,
            filter: shouldAnimate ? "blur(4px)" : "blur(0px)",
        },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
                delay,
                duration: shouldAnimate ? undefined : 0,
            },
        },
    }

    const containerVariants: any = {
        hover: {
            scale: 1.02,
            y: -2,
            rotateX: 2,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 0.6,
            },
        },
        tap: {
            scale: 0.98,
            y: 0,
            rotateX: 0,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
            },
        },
    }

    const glowVariants: any = {
        initial: {
            opacity: 0,
            scale: 0.8,
        },
        hover: {
            opacity:
                variant === "primary" ||
                variant === "purple" ||
                variant === "red" ||
                variant === "pink"
                    ? 0.6
                    : 0.3,
            scale: 1.1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
            },
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
                delay: delay + 0.3 + i * 0.05,
                duration: shouldAnimate ? undefined : 0,
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

    const shimmerVariants: any = {
        initial: {
            x: "-100%",
            opacity: 0,
        },
        animate: {
            x: "100%",
            opacity: [0, 0.5, 0],
            transition: {
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
            },
        },
    }

    const uniqueId = useId()
    const gradientId1 = `gradient1-${uniqueId}`
    const gradientId2 = `gradient2-${uniqueId}`
    const gradientId = `gradient-${uniqueId}`

    const getSizeStyles = () => {
        if (style === "style1") {
            return {
                widthClass: "w-36 md:w-[182px]",
                heightClass: "h-11 md:h-[44px]",
                textClass: "text-xs md:text-sm tracking-wider",
            }
        }

        switch (size) {
            case "small":
                return {
                    widthClass: "w-28 md:w-[140px]",
                    heightClass: "h-9 md:h-[39px]",
                    textClass: "text-[10px] md:text-xs tracking-wide",
                }
            case "large":
                return {
                    widthClass: "w-44 md:w-[234px]",
                    heightClass: "h-14 md:h-[65px]",
                    textClass: "text-sm md:text-base tracking-wider",
                }
            default:
                return {
                    widthClass: "w-36 md:w-[187px]",
                    heightClass: "h-12 md:h-[52px]",
                    textClass: "text-xs md:text-sm tracking-wider",
                }
        }
    }

    const sizeStyles = getSizeStyles()

    const renderStyle1SVG = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="182.288"
            height="43.721"
            viewBox="0 0 182.288 43.721"
            className="w-full h-full"
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="93.198"
                    y1="-53.343"
                    x2="93.198"
                    y2="68.841"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor={colors.gradient} />
                    <stop offset="0.005" stopColor={colors.gradient} stopOpacity="0.986" />
                    <stop offset="0.085" stopColor={colors.gradient} stopOpacity="0.781" />
                    <stop offset="0.17" stopColor={colors.gradient} stopOpacity="0.596" />
                    <stop offset="0.258" stopColor={colors.gradient} stopOpacity="0.436" />
                    <stop offset="0.351" stopColor={colors.gradient} stopOpacity="0.301" />
                    <stop offset="0.449" stopColor={colors.gradient} stopOpacity="0.191" />
                    <stop offset="0.554" stopColor={colors.gradient} stopOpacity="0.106" />
                    <stop offset="0.669" stopColor={colors.gradient} stopOpacity="0.046" />
                    <stop offset="0.804" stopColor={colors.gradient} stopOpacity="0.011" />
                    <stop offset="1" stopColor={colors.gradient} stopOpacity="0" />
                </linearGradient>
            </defs>
            <g>
                <g>
                    <motion.path
                        d="M181.788.5H13.7L4.609,9.593V43.221H170.048l11.74-11.74Z"
                        fill={`url(#${gradientId})`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: shouldAnimate ? 0.8 : 0,
                            delay: delay + 0.2,
                            ease: "easeOut",
                        }}
                    />
                    <motion.path
                        d="M170.256,43.721H4.108V9.386L13.494,0H182.288V31.688Zm-165.148-1H169.842l11.446-11.447V1H13.908l-8.8,8.8Z"
                        fill={colors.border}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: shouldAnimate ? 0.6 : 0,
                            delay: delay + 0.4,
                            ease: "easeOut",
                        }}
                    />
                    <g>
                        {[
                            { cx: "169.908", cy: "7.326", index: 0 },
                            { cx: "169.908", cy: "11.908", index: 1 },
                            { cx: "174.373", cy: "7.326", index: 2 },
                            { cx: "174.373", cy: "11.908", index: 3 },
                        ].map(dot => (
                            <motion.circle
                                key={`${dot.cx}-${dot.cy}`}
                                cx={dot.cx}
                                cy={dot.cy}
                                r="1.161"
                                fill={colors.main}
                                variants={dotVariants}
                                initial="hidden"
                                animate="show"
                                whileHover="hover"
                                custom={dot.index}
                            />
                        ))}
                    </g>
                </g>
                <g>
                    {[
                        { cx: "0.621", cy: "19.214", index: 4 },
                        { cx: "0.621", cy: "24.506", index: 5 },
                    ].map(dot => (
                        <motion.circle
                            key={`${dot.cx}-${dot.cy}`}
                            cx={dot.cx}
                            cy={dot.cy}
                            r="0.621"
                            fill={colors.main}
                            variants={dotVariants}
                            initial="hidden"
                            animate="show"
                            whileHover="hover"
                            custom={dot.index}
                        />
                    ))}
                </g>
            </g>
        </svg>
    )

    const renderStyle2SVG = () => (
        <svg
            viewBox="0 0 187 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <defs>
                <linearGradient
                    id={gradientId1}
                    x1="94.9995"
                    y1="-62.017"
                    x2="94.9995"
                    y2="80.9853"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.95"
                    />
                    <stop
                        offset="0.005"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.92"
                    />
                    <stop
                        offset="0.085"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.85"
                    />
                    <stop
                        offset="0.17"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.75"
                    />
                    <stop
                        offset="0.258"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.65"
                    />
                    <stop
                        offset="0.351"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.55"
                    />
                    <stop
                        offset="0.449"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.45"
                    />
                    <stop
                        offset="0.554"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.35"
                    />
                    <stop
                        offset="0.669"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.25"
                    />
                    <stop
                        offset="0.804"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0.15"
                    />
                    <stop
                        offset="1"
                        stopColor={variant === "primary" ? colors.gradient : "#1a1a1a"}
                        stopOpacity="0"
                    />
                </linearGradient>
                <linearGradient
                    id={gradientId2}
                    x1="95.4995"
                    y1="-65.5377"
                    x2="95.4995"
                    y2="83.1847"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.8"
                    />
                    <stop
                        offset="0.005"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.75"
                    />
                    <stop
                        offset="0.085"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.65"
                    />
                    <stop
                        offset="0.17"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.55"
                    />
                    <stop
                        offset="0.258"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.45"
                    />
                    <stop
                        offset="0.351"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.35"
                    />
                    <stop
                        offset="0.449"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.25"
                    />
                    <stop
                        offset="0.554"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.18"
                    />
                    <stop
                        offset="0.669"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.12"
                    />
                    <stop
                        offset="0.804"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0.06"
                    />
                    <stop
                        offset="1"
                        stopColor={variant === "primary" ? colors.gradient : "#2a2a2a"}
                        stopOpacity="0"
                    />
                </linearGradient>
            </defs>

            {/* Corner dots - top right */}
            {[
                { cx: "174.161", cy: "7.161", index: 0 },
                { cx: "174.161", cy: "11.739", index: 1 },
                { cx: "178.63", cy: "7.161", index: 2 },
                { cx: "178.63", cy: "11.739", index: 3 },
            ].map(dot => (
                <motion.circle
                    key={`${dot.cx}-${dot.cy}`}
                    cx={dot.cx}
                    cy={dot.cy}
                    r="1.161"
                    fill={variant === "primary" ? colors.main : "#EFEFEF"}
                    variants={dotVariants}
                    initial="hidden"
                    animate="show"
                    whileHover="hover"
                    custom={dot.index}
                />
            ))}

            {/* Main button shape */}
            <motion.path
                d="M4.5 6L10 0.5H181L186.5 6V46L181 51.5H10L4.5 45.7834V6Z"
                fill={`url(#${gradientId1})`}
                stroke={variant === "primary" ? colors.border : "white"}
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                    duration: shouldAnimate ? 0.8 : 0,
                    delay: delay + 0.2,
                    ease: "easeOut",
                }}
            />

            {/* Side dots - left */}
            {[
                { cx: "0.621", cy: "23.621", index: 4 },
                { cx: "0.621", cy: "28.91", index: 5 },
            ].map(dot => (
                <motion.circle
                    key={`${dot.cx}-${dot.cy}`}
                    cx={dot.cx}
                    cy={dot.cy}
                    r="0.621"
                    fill={variant === "primary" ? colors.main : "#EFEFEF"}
                    variants={dotVariants}
                    initial="hidden"
                    animate="show"
                    whileHover="hover"
                    custom={dot.index}
                />
            ))}

            {/* Border outline */}
            <motion.path
                d="M181.07 52H9.9311L4 46.1001V5.8994L9.9311 0H181.07L187 5.8994V46.1001L181.07 52ZM10.1235 51.5332H180.876L186.531 45.9069V6.09266L180.876 0.466799L10 0.5L4.5 6L4.46916 45.9069L10.1235 51.5332Z"
                fill="white"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                    duration: shouldAnimate ? 0.6 : 0,
                    delay: delay + 0.4,
                    ease: "easeOut",
                }}
            />
            <motion.path
                d="M181.07 52H9.9311L4 46.1001V5.8994L9.9311 0H181.07L187 5.8994V46.1001L181.07 52ZM10.1235 51.5332H180.876L186.531 45.9069V6.09266L180.876 0.466799L10 0.5L4.5 6L4.46916 45.9069L10.1235 51.5332Z"
                fill={`url(#${gradientId2})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                    duration: shouldAnimate ? 0.6 : 0,
                    delay: delay + 0.5,
                    ease: "easeOut",
                }}
            />
        </svg>
    )

    return (
        <motion.button
            className={`relative cursor-pointer transform-gpu ${sizeStyles.widthClass} ${sizeStyles.heightClass}`}
            variants={shouldAnimate ? buttonVariants : {}}
            initial={shouldAnimate ? "hidden" : "show"}
            animate="show"
            whileHover="hover"
            whileTap="tap"
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
                perspective: "1000px",
            }}
        >
            <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    filter: "blur(10px)",
                }}
                variants={shouldAnimate ? glowVariants : {}}
                initial="initial"
                animate={isHovered ? "hover" : "initial"}
            />

            {shouldAnimate &&
                (variant === "primary" ||
                    variant === "purple" ||
                    variant === "red" ||
                    variant === "pink") && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                                width: "30%",
                                height: "100%",
                            }}
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                        />
                    </div>
                )}

            <motion.div
                variants={shouldAnimate ? containerVariants : {}}
                className="relative cursor-pointer h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
            >
                {style === "style1" ? renderStyle1SVG() : renderStyle2SVG()}

                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                delay: delay + 0.6,
                                duration: shouldAnimate ? 0.4 : 0,
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                            },
                        }}
                    >
                        <HyperText
                            text={children as string}
                            className={`cursor-pointer ${sizeStyles.textClass} ${colors.text}`}
                            duration={shouldAnimate ? 800 : 0}
                            animateOnLoad={shouldAnimate}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </motion.button>
    )
}
