'use strict'

import { motion, useReducedMotion, Variants } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import UserCard from "../ui/user-card"
import { HudSectionHeader } from "../ui/hud-section-header"
import { peopleData, SectionData } from "../../types/people"

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
interface InfiniteScrollRowProps {
    people: SectionData["people"]
}

function InfiniteScrollRow({ people }: InfiniteScrollRowProps): React.ReactElement {
    const shouldReduceMotion = useReducedMotion()
    const [cardWidth, setCardWidth] = useState<number>(192)
    const [gap, setGap] = useState<number>(24)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const carouselRef = useRef<HTMLDivElement>(null)
    const [isScrolling, setIsScrolling] = useState<boolean>(false)
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const handleResize = (): void => {
            const mobile = window.innerWidth < 1024
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

    const duplicatedPeople = [...people, ...people, ...people, ...people, ...people]
    const scrollDistance = people.length * (cardWidth + gap)
    const duration = people.length * 4

    const getVariant = (index: number): Variants => {
        const position = index % 3
        if (position === 0) return leftImageVariants
        if (position === 1) return middleImageVariants
        return rightImageVariants
    }

    // Auto-reset carousel to beginning for seamless infinite loop
    useEffect(() => {
        const carousel = carouselRef.current
        if (!carousel || shouldReduceMotion) return

        const handleAnimationIteration = () => {
            carousel.scrollLeft = 0
        }

        const carouselContainer = carousel.querySelector(".carousel-container")
        if (carouselContainer) {
            carouselContainer.addEventListener("animationiteration", handleAnimationIteration)
            return () => {
                carouselContainer.removeEventListener("animationiteration", handleAnimationIteration)
            }
        }
    }, [shouldReduceMotion])

    const handleScroll = (): void => {
        setIsScrolling(true)

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false)
        }, 150)
    }

    useEffect(() => {
        const carousel = carouselRef.current
        if (carousel) {
            carousel.addEventListener("scroll", handleScroll, { passive: true })
            return () => {
                carousel.removeEventListener("scroll", handleScroll)
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current)
                }
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="relative w-full py-8 px-2 group overflow-visible"
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

                .carousel-container.scrolling {
                    animation-play-state: paused;
                }

                .carousel-container:hover {
                    animation-play-state: paused;
                }

                .carousel-wrapper {
                    scroll-behavior: smooth;
                }

                .carousel-wrapper::-webkit-scrollbar {
                    display: none;
                }

                .carousel-wrapper {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                .carousel-wrapper {
                    overflow-x: auto;
                }

                @media (prefers-reduced-motion: reduce) {
                    .carousel-container {
                        animation: none;
                    }
                }
            `}</style>

            <div
                ref={carouselRef}
                className="carousel-wrapper relative w-full overflow-x-auto lg:overflow-hidden py-12"
            >
                <div
                    className={`carousel-container flex gap-6 md:gap-28 ${isScrolling ? "scrolling" : ""}`}
                >
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
        </div>
    )
}

interface ColorMapType {
    [key: string]: string
}

export default function People(): React.ReactElement {
    const colorMap: ColorMapType = {
        "Event Coordinators": "#FF0055",
        "Dev Team": "#9D00FF",
    }

    return (
        <section className="relative w-full py-20 bg-zinc-950 text-white overflow-hidden">
            <div className="relative  mx-auto px-4 md:px-8 w-full">
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
