import { motion, useReducedMotion, Variants } from "framer-motion"
import { useId } from "react"
import { Linkedin } from "lucide-react"
import { cn } from "../../lib/utils"

interface UserCardProps {
    imageUrl?: string
    blurUrl?: string
    name: string
    role?: string
    linkedinUrl?: string
    variant?: "purple" | "red" | "pink" | "secondary"
    color?: string
    hoverEffect?: "scale" | "glitch" | "glow" | "none"
    glitchOnHover?: boolean
    className?: string
}

const UserCard = ({
    imageUrl,
    blurUrl,
    name,
    role,
    linkedinUrl,
    variant = "purple",
    color,
    hoverEffect = "glitch",
    glitchOnHover = true,
    className = "",
}: UserCardProps) => {
    const shouldReduceMotion = useReducedMotion()
    const shouldAnimate = !shouldReduceMotion
    const uniqueId = useId()
    const gradientId = `user-card-gradient-${uniqueId}`
    const clipId = `user-card-clip-${uniqueId}`

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

    const colors = color
        ? { main: color, gradient: color.replace("#", ""), glow: `${color}66`, border: color }
        : getColors()
    const fallbackColor = color || colors.main

    const cardVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: {
            opacity: 1,
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
    } else {
        cardVariants.hover = {}
    }

    const glowVariants: Variants = {
        initial: { opacity: 0, scale: 0.8 },
        hover: {
            opacity: 0.6,
            scale: 1.1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
        },
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

    const revealVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                staggerChildren: 0.05,
            },
        },
    }

    const cornerDots = [
        { cx: 10, cy: 8 },
        { cx: 18, cy: 8 },
        { cx: 10, cy: 16 },
        { cx: 18, cy: 16 },
        { cx: 182, cy: 8 },
        { cx: 182, cy: 16 },
    ]

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

    return (
        <>
            <style>{`
                .image-blur-container .blur-placeholder {
                    filter: blur(20px);
                }
                
                .image-blur-container .full-image {
                    opacity: 0;
                    transition: opacity 1.2s ease-out;
                }
                
                .image-blur-container .full-image.loaded {
                    opacity: 1;
                }
            `}</style>
            <motion.div
                className={cn("relative w-44 h-64 md:w-64 md:h-80 lg:w-72 lg:h-96", className)}
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

                <div
                    className="relative w-full h-full overflow-hidden"
                    style={{ backgroundColor: imageUrl ? `${fallbackColor}22` : undefined }}
                >
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 192 192"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={colors.main} stopOpacity="0.2" />
                                <stop offset="50%" stopColor={colors.main} stopOpacity="0.05" />
                                <stop offset="100%" stopColor={colors.main} stopOpacity="0" />
                            </linearGradient>
                            <clipPath id={clipId}>
                                <polygon points="12,0 180,0 192,12 192,180 180,192 12,192 0,180 0,12" />
                            </clipPath>
                        </defs>
                        <motion.path
                            d="M12,0 L180,0 L192,12 L192,180 L180,192 L12,192 L0,180 L0,12 Z"
                            fill="transparent"
                            stroke={colors.border}
                            strokeWidth="1"
                            variants={shouldAnimate ? glitchVariants : {}}
                        />
                        {variant !== "secondary" && (
                            <motion.path
                                d="M12,0 L180,0 L192,12 L192,180 L180,192 L12,192 L0,180 L0,12 Z"
                                fill="transparent"
                                stroke={colors.main}
                                strokeWidth="0.5"
                                opacity="0.5"
                            />
                        )}
                        <g>
                            {cornerDots.map((dot, i) => (
                                <motion.circle
                                    key={`dot-${i}`}
                                    cx={dot.cx}
                                    cy={dot.cy}
                                    r="1.2"
                                    fill={colors.main}
                                    variants={dotVariants}
                                    initial="hidden"
                                    animate="show"
                                    whileHover="hover"
                                    custom={i}
                                />
                            ))}
                        </g>
                    </svg>

                    <motion.div
                        className="relative z-10 w-full h-full"
                        initial="visible"
                        animate="visible"
                    >
                        <div
                            className="w-full h-full p-2.5 flex flex-col items-center justify-center"
                            style={{ backgroundColor: imageUrl ? undefined : `${fallbackColor}33` }}
                        >
                            {imageUrl && (
                                <div
                                    className="image-blur-container relative w-full h-full rounded-md overflow-hidden"
                                    style={{
                                        maxHeight: "calc(100% - 8px)",
                                        maxWidth: "calc(100% - 8px)",
                                    }}
                                >
                                    {blurUrl && (
                                        <img
                                            src={blurUrl}
                                            aria-hidden="true"
                                            className="blur-placeholder absolute inset-0 w-full h-full object-cover object-center rounded-md"
                                        />
                                    )}
                                    <img
                                        src={imageUrl}
                                        loading="lazy"
                                        onLoad={e => e.currentTarget.classList.add("loaded")}
                                        className="full-image absolute inset-0 w-full h-full object-cover object-center rounded-md"
                                    />
                                </div>
                            )}
                        </div>

                        <motion.div
                            className="absolute bottom-0 flex flex-col items-start w-full px-5 pb-3 md:pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
                            variants={revealVariants}
                            initial="visible"
                            animate="visible"
                        >
                            <motion.p
                                className="font-heading font-bold text-xs sm:text-sm md:text-lg text-white text-left leading-tight w-full"
                                variants={revealVariants}
                            >
                                {name}
                            </motion.p>
                            <div className="flex items-center justify-between w-full gap-2 pb-1">
                                {role && (
                                    <motion.p
                                        className="font-mono text-[10px] sm:text-[10px] md:text-xs text-white/80 text-left leading-tight flex-1"
                                        variants={revealVariants}
                                    >
                                        {role}
                                    </motion.p>
                                )}
                                {linkedinUrl && (
                                    <motion.a
                                        href={linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`LinkedIn profile for ${name}`}
                                        className="pointer-events-auto flex-shrink-0"
                                        variants={revealVariants}
                                    >
                                        <Linkedin
                                            style={{ color: fallbackColor }}
                                            strokeWidth={2}
                                            className="w-4 h-4 md:w-5 md:h-5"
                                        />
                                    </motion.a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </>
    )
}

export default UserCard
