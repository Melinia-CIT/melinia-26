'use strict'

import { motion, useReducedMotion, Variants } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import UserCard from "../ui/user-card"
import { HudSectionHeader } from "../ui/hud-section-header"

const leftImageVariants: Variants = {
    initial: { rotate: 0, x: 0, y: 0 },
    animate: {
        rotate: -8,
        x: 0,
        y: 15,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 12,
        },
    },
    hover: {
        rotate: -3,
        x: 0,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 15,
        },
    },
}

const middleImageVariants: Variants = {
    initial: { rotate: 0, x: 0, y: 0 },
    animate: {
        rotate: 6,
        x: 0,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 12,
        },
    },
    hover: {
        rotate: 0,
        x: 0,
        y: -15,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 15,
        },
    },
}

const rightImageVariants: Variants = {
    initial: { rotate: 0, x: 0, y: 0 },
    animate: {
        rotate: -6,
        x: 0,
        y: 25,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 12,
        },
    },
    hover: {
        rotate: 3,
        x: 0,
        y: 15,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 15,
        },
    },
}

interface SectionData {
    title: string
    people: {
        name: string
        role?: string
        imageUrl?: string
        linkedinUrl?: string
        color?: string
    }[]
}

const peopleData: SectionData[] = [
    {
        title: "Event Coordinators",
        people: [
            {
                name: "Alice Johnson",
                role: "Coordinator",
                imageUrl:
                    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Bob Smith",
                role: "Coordinator",
                imageUrl:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Charlie Davis",
                role: "Lead",
                imageUrl:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Diana Prince",
                role: "Manager",
                imageUrl:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
        ],
    },
 
    {
        title: "Dev Team",
        people: [
            {
                name: "Sarah Connor",
                role: "Lead Developer",
                imageUrl:
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "John Doe",
                role: "Frontend Developer",
                imageUrl:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Neo Anderson",
                role: "Backend Developer",
                imageUrl:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Trinity Moss",
                role: "UI/UX Designer",
                imageUrl:
                    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Cypher Reagan",
                role: "DevOps Engineer",
                imageUrl:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Tank",
                role: "System Administrator",
                imageUrl:
                    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
        ],
    },
]

interface InfiniteScrollRowProps {
    people: SectionData["people"]
}

function InfiniteScrollRow({ people }: InfiniteScrollRowProps): React.ReactElement {
    const shouldReduceMotion = useReducedMotion()
    const [cardWidth, setCardWidth] = useState<number>(192)
    const [gap, setGap] = useState<number>(24)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleResize = (): void => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) {
                setCardWidth(window.innerWidth / 2 - 12)
                setGap(24)
            } else {
                setCardWidth(192)
                setGap(64)
            }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const duplicatedPeople = [...people, ...people, ...people]
    const scrollDistance = people.length * (cardWidth + gap)
    const duration = people.length * 3

    const getVariant = (index: number): Variants => {
        const position = index % 3
        if (position === 0) return leftImageVariants
        if (position === 1) return middleImageVariants
        return rightImageVariants
    }

    const animationStyle = shouldReduceMotion
        ? {}
        : {
              animation: `scroll-carousel ${duration}s linear infinite`,
          }

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden py-12 group"
            style={
                {
                    "--scroll-distance": `-${scrollDistance}px`,
                    "--duration": `${duration}s`,
                } as React.CSSProperties
            }
        >
            <style>{`
                @keyframes scroll-carousel {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(var(--scroll-distance));
                    }
                }

                .carousel-container {
                    animation: scroll-carousel var(--duration) linear infinite;
                }

                .carousel-container:hover {
                    animation-play-state: paused;
                }

                @media (prefers-reduced-motion: reduce) {
                    .carousel-container {
                        animation: none;
                    }
                }
            `}</style>

            <div className="carousel-container flex gap-6 md:gap-28">
                {duplicatedPeople.map((person, index) => (
                    <motion.div
                        key={index}
                        className="shrink-0"
                        style={{ width: `${cardWidth}px` }}
                        variants={!shouldReduceMotion ? getVariant(index) : undefined}
                        initial={!shouldReduceMotion ? "initial" : undefined}
                        animate={!shouldReduceMotion ? "animate" : undefined}
                        whileHover={!shouldReduceMotion ? "hover" : undefined}
                    >
                        <UserCard {...person} alwaysShowText={isMobile} />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

interface ColorMapType {
    [key: string]: string
}

export default function People(): React.ReactElement {
    const colorMap: ColorMapType = {
        "Event Coordinators": "#FF0055",
        "Faculty Coordinators": "#00E0FF",
        "Dev Team": "#9D00FF",
    }

    return (
        <section className="relative w-full py-20 bg-zinc-950 text-white overflow-hidden">
            <div className="relative max-w-[96rem] mx-auto px-4 md:px-8 w-full">
                <div className="absolute top-0 bottom-0 left-4 md:left-8 w-px bg-gradient-to-b from-transparent via-[#9D00FF]/30 to-transparent" />
                <div className="absolute top-0 bottom-0 right-4 md:right-8 w-px bg-gradient-to-b from-transparent via-[#FF0066]/30 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center relative"
                >
                    <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Our Team
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 -rotate-[2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>

                <div className="space-y-16 relative">
                    {peopleData.map((section, index) => {
                        const isEven = index % 2 === 0
                        const sectionColor = colorMap[section.title] || "#FF0055"

                        return (
                            <div key={index} className="relative">
                                {index > 0 && (
                                    <div className="absolute -top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9D00FF]/30 to-transparent" />
                                )}
                                <HudSectionHeader
                                    title={section.title}
                                    color={sectionColor}
                                    align={isEven ? "left" : "right"}
                                    className="mb-8"
                                />

                                <InfiniteScrollRow people={section.people} />
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
