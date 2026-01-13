import { motion, useReducedMotion, Variants } from "framer-motion"
import type React from "react"
import { useId } from "react"

interface HudCardProps {
    children: React.ReactNode
    variant?: "purple" | "red" | "pink" | "secondary"
    widthClass?: string
    hoverEffect?: "scale" | "glitch" | "glow" | "none"
    glitchOnHover?: boolean
    className?: string
}

export function HudCard({
    children,
    variant = "purple",
    widthClass = "w-full",
    hoverEffect = "glitch",
    glitchOnHover = true,
    className = "",
}: HudCardProps) {
    const shouldReduceMotion = useReducedMotion()
    const shouldAnimate = !shouldReduceMotion
    const uniqueId = useId()
    const gradientId = `hud-card-gradient-${uniqueId}`

    const getColors = () => {
        switch (variant) {
            case "purple":
                return {
                    main: "#9D00FF",
                    gradient: "157, 0, 255",
                    glow: "rgba(157, 0, 255, 0.4)",
                    border: "#9D00FF",
                }
            case "red":
                return {
                    main: "#FF0066",
                    gradient: "255, 0, 102",
                    glow: "rgba(255, 0, 102, 0.4)",
                    border: "#FF0066",
                }
            case "pink":
                return {
                    main: "#FF69B4",
                    gradient: "255, 105, 180",
                    glow: "rgba(255, 105, 180, 0.4)",
                    border: "#FF69B4",
                }
            default:
                return {
                    main: "#FFFFFF",
                    gradient: "255, 255, 255",
                    glow: "rgba(255, 255, 255, 0.2)",
                    border: "#FFFFFF",
                }
        }
    }

    const colors = getColors()

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 25 },
        },
    }

    if (hoverEffect === "scale") {
        cardVariants.hover = {
            scale: 1.02,
            y: -2,
            transition: { type: "spring", stiffness: 400, damping: 25 },
        }
    }

    const glowVariants: Variants = {
        initial: { opacity: 0, scale: 0.8 },
        hover: {
            opacity: 0.6,
            scale: 1.1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
        },
    }

    const shimmerVariants: Variants = {
        initial: { x: "-100%", opacity: 0 },
        hover:
            shouldAnimate && glitchOnHover
                ? {
                      x: "150%",
                      opacity: [0, 0.5, 0],
                      transition: {
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut",
                      },
                  }
                : { opacity: 0 },
    }

    const glitchVariants: Variants = {
        hover:
            shouldAnimate && glitchOnHover
                ? {
                      x: [0, -2, 2, -1, 1, 0],
                      y: [0, 1, -1, 0.5, -0.5, 0],
                      transition: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                  }
                : {},
    }

    const cornerDots = [
        { cx: 12, cy: 12 },
        { cx: 28, cy: 12 },
        { cx: 12, cy: 28 },
        { cx: 28, cy: 28 },
    ]

    return (
        <motion.div
            className={`relative ${widthClass} ${className}`}
            variants={shouldAnimate ? cardVariants : {}}
            initial="hidden"
            animate="show"
            whileHover={hoverEffect !== "none" ? "hover" : undefined}
        >
            {shouldAnimate && (
                <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                        filter: "blur(10px)",
                    }}
                    variants={glowVariants}
                    initial="initial"
                    whileHover="hover"
                />
            )}

            <div className="relative bg-zinc-900/90 rounded-lg overflow-hidden">
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 320 180"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors.main} stopOpacity="0.3" />
                            <stop offset="50%" stopColor={colors.main} stopOpacity="0.1" />
                            <stop offset="100%" stopColor={colors.main} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d="M12,0 L308,0 L320,12 L320,168 L308,180 L12,180 L0,168 L0,12 Z"
                        fill={`url(#${gradientId})`}
                        stroke={colors.border}
                        strokeWidth="1"
                        variants={shouldAnimate ? glitchVariants : {}}
                    />
                    {variant !== "secondary" && (
                        <motion.path
                            d="M12,0 L308,0 L320,12 L320,168 L308,180 L12,180 L0,168 L0,12 Z"
                            fill="transparent"
                            stroke={colors.main}
                            strokeWidth="0.5"
                            opacity="0.5"
                        />
                    )}
                    {variant !== "secondary" &&
                        cornerDots.map((dot, i) => (
                            <motion.circle
                                key={i}
                                cx={dot.cx}
                                cy={dot.cy}
                                r="2"
                                fill={colors.main}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            />
                        ))}
                    {shouldAnimate && glitchOnHover && variant !== "secondary" && (
                        <motion.g
                            variants={shimmerVariants}
                            initial="initial"
                            whileHover="hover"
                            style={{ pointerEvents: "none" }}
                        >
                            <path
                                d="M0,90 L320,90"
                                stroke={colors.main}
                                strokeWidth="2"
                                opacity="0.3"
                            />
                        </motion.g>
                    )}
                </svg>
                <motion.div
                    className="relative z-10"
                    variants={shouldAnimate ? glitchVariants : {}}
                >
                    {children}
                </motion.div>
            </div>
        </motion.div>
    )
}

interface HudCardHeaderProps {
    title: string
    icon?: React.ReactNode
    variant?: "purple" | "red" | "pink"
    className?: string
}

export function HudCardHeader({
    title,
    icon,
    variant = "purple",
    className = "",
}: HudCardHeaderProps) {
    const uniqueId = useId()
    const gradientId = `hud-header-gradient-${uniqueId}`

    const colors = {
        purple: { main: "#9D00FF" },
        red: { main: "#FF0066" },
        pink: { main: "#FF69B4" },
    }[variant]

    return (
        <div className={`relative mb-4 min-h-[32px] ${className}`}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 32">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.main} stopOpacity="0.2" />
                        <stop offset="50%" stopColor={colors.main} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={colors.main} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d="M4,0 L196,0 L200,4 L200,28 L196,32 L4,32 L0,28 L0,4 Z"
                    fill={`url(#${gradientId})`}
                    stroke={colors.main}
                    strokeWidth="0.5"
                />
                <circle cx="8" cy="16" r="2" fill={colors.main} />
                <circle cx="192" cy="16" r="2" fill={colors.main} />
            </svg>
            <div className="relative z-10 flex items-center gap-2 px-6 py-3">
                {icon && <span className="text-white">{icon}</span>}
                <h3
                    className="font-heading text-sm font-bold uppercase tracking-widest"
                    style={{ color: colors.main }}
                >
                    {title}
                </h3>
            </div>
        </div>
    )
}

interface HudTagProps {
    children: React.ReactNode
    variant?: "purple" | "red" | "pink"
    size?: "small" | "medium"
    className?: string
}

export function HudTag({
    children,
    variant = "purple",
    size = "small",
    className = "",
}: HudTagProps) {
    const shouldReduceMotion = useReducedMotion()
    const shouldAnimate = !shouldReduceMotion
    const uniqueId = useId()
    const gradientId = `hud-tag-gradient-${uniqueId}`

    const colors = {
        purple: { main: "#9D00FF", glow: "rgba(157, 0, 255, 0.4)" },
        red: { main: "#FF0066", glow: "rgba(255, 0, 102, 0.4)" },
        pink: { main: "#FF69B4", glow: "rgba(255, 105, 180, 0.4)" },
    }[variant]

    const sizes = {
        small: { height: "h-7", text: "text-[10px]", padding: "px-2" },
        medium: { height: "h-8", text: "text-xs", padding: "px-3" },
    }[size]

    const tagVariants: Variants = {
        hidden: { scale: 0, opacity: 0 },
        show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 25 } },
        hover: shouldAnimate
            ? {
                  scale: 1.05,
                  boxShadow: `0 0 15px ${colors.glow}`,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
              }
            : {},
    }

    const cornerDot = { cx: 6, cy: 6 }

    return (
        <motion.div
            className={`relative inline-flex items-center ${sizes.height} ${sizes.padding} ${sizes.text} font-medium font-body rounded ${className}`}
            variants={shouldAnimate ? tagVariants : {}}
            initial="hidden"
            animate="show"
            whileHover="hover"
        >
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 60 24"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.main} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={colors.main} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d="M4,0 L56,0 L60,4 L60,20 L56,24 L4,24 L0,20 L0,4 Z"
                    fill={`url(#${gradientId})`}
                    stroke={colors.main}
                    strokeWidth="0.5"
                />
                <circle cx={cornerDot.cx} cy={cornerDot.cy} r="1.5" fill={colors.main} />
                <circle cx={60 - cornerDot.cx} cy={cornerDot.cy} r="1.5" fill={colors.main} />
            </svg>
            <span className="relative z-10 text-white/90">{children}</span>
        </motion.div>
    )
}
