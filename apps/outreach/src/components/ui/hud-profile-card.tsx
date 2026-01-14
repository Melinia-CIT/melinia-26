import { motion, useReducedMotion, Variants } from "framer-motion"
import { useId } from "react"
import { Linkedin } from "lucide-react"
import type { Person } from "../../types/people"

interface HudProfileCardProps {
    person: Person
    tilt?: number
    zIndex?: number
    className?: string
}

export function HudProfileCard({
    person,
    tilt = 0,
    zIndex = 1,
    className = "",
}: HudProfileCardProps) {
    const shouldReduceMotion = useReducedMotion()
    const shouldAnimate = !shouldReduceMotion
    const uniqueId = useId()
    const gradientId = `hud-profile-gradient-${uniqueId}`

    const hasLinkedIn = !!person.linkedinUrl && person.linkedinUrl.trim() !== ""
    const initials = person.name
        .split(" ")
        .map(word => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    const getCategoryColor = () => {
        switch (person.category) {
            case "organizer":
                return "#9D00FF"
            case "faculty":
                return "#0066FF"
            case "dev-team":
                return "#FF0066"
            default:
                return "#9D00FF"
        }
    }

    const categoryColor = getCategoryColor()

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95, rotate: tilt },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: tilt,
            transition: { type: "spring", stiffness: 300, damping: 25 },
        },
    }

    const glowVariants: Variants = {
        rest: { opacity: 0, scale: 0.8 },
        hover: {
            opacity: 0.6,
            scale: 1.1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
        },
    }

    const tiltVariants: Variants = {
        rest: { rotate: tilt },
        hover: {
            rotate: 0,
            transition: { type: "spring", stiffness: 400, damping: 30 },
        },
    }

    const iconVariants: Variants = {
        rest: { scale: 1 },
        hover: { scale: 1.2, transition: { type: "spring", stiffness: 400, damping: 20 } },
    }

    return (
        <motion.div
            className={`relative ${className}`}
            style={{ zIndex }}
            variants={shouldAnimate ? cardVariants : {}}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            whileHover="hover"
        >
            {shouldAnimate && (
                <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${categoryColor}40 0%, transparent 70%)`,
                        filter: "blur(15px)",
                    }}
                    variants={glowVariants}
                    initial="rest"
                    whileHover="hover"
                />
            )}

            <div
                className="relative bg-zinc-900/90 overflow-hidden"
                style={{
                    clipPath:
                        "polygon(3% 0%, 97% 0%, 100% 8%, 100% 92%, 97% 100%, 3% 100%, 0% 92%, 0% 8%)",
                }}
            >
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 200 260"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={categoryColor} stopOpacity="0.2" />
                            <stop offset="50%" stopColor={categoryColor} stopOpacity="0.1" />
                            <stop offset="100%" stopColor={categoryColor} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M6,0 L194,0 L200,6 L200,254 L194,260 L6,260 L0,254 L0,6 Z"
                        fill={`url(#${gradientId})`}
                        stroke={categoryColor}
                        strokeWidth="0.5"
                        opacity="0.5"
                    />
                    <circle cx="12" cy="12" r="2" fill={categoryColor} />
                    <circle cx="188" cy="12" r="2" fill={categoryColor} />
                    <circle cx="12" cy="248" r="2" fill={categoryColor} />
                    <circle cx="188" cy="248" r="2" fill={categoryColor} />
                </svg>

                <motion.div
                    className="relative z-10 h-full"
                    variants={shouldAnimate ? tiltVariants : {}}
                >
                    <div className="flex flex-col h-full p-3 md:p-4">
                        <div className="flex-1 flex items-center justify-center">
                            <div
                                className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                                style={{
                                    background: `radial-gradient(circle, ${categoryColor}30 0%, ${categoryColor}10 100%)`,
                                    border: `2px solid ${categoryColor}40`,
                                }}
                            >
                                <span
                                    className="font-heading text-lg md:text-2xl font-bold text-white"
                                    style={{ color: categoryColor }}
                                >
                                    {initials}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 md:mt-4">
                            <p className="font-heading text-xs md:text-sm font-semibold text-white text-right leading-tight">
                                {person.name}
                            </p>
                            <p className="font-body text-[10px] md:text-xs text-gray-400 text-right mt-0.5 md:mt-1">
                                {person.role}
                            </p>
                        </div>

                        {hasLinkedIn && (
                            <a
                                href={person.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-3 right-3 md:top-4 md:right-4"
                                aria-label={`LinkedIn profile for ${person.name}`}
                            >
                                <motion.div
                                    variants={shouldAnimate ? iconVariants : {}}
                                    initial="rest"
                                    whileHover="hover"
                                    className="p-1.5 rounded bg-white/5"
                                >
                                    <Linkedin
                                        size={14}
                                        className="text-white/70"
                                        style={{ color: categoryColor }}
                                        strokeWidth={2}
                                    />
                                </motion.div>
                            </a>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
