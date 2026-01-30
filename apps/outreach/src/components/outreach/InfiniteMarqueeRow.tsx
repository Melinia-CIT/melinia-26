"use strict"

import { motion, useReducedMotion, Variants } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import UserCard from "../ui/user-card"
import type { SectionData } from "../../types/people"

interface InfiniteMarqueeRowProps {
    people: SectionData["people"]
    direction?: "left" | "right"
    speedPxPerSec?: number
    pauseOnHover?: boolean
    className?: string
}

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

export function InfiniteMarqueeRow({
    people,
    direction = "left",
    speedPxPerSec = 40,
    pauseOnHover = true,
    className = "",
}: InfiniteMarqueeRowProps): React.ReactElement {
    const shouldReduceMotion = useReducedMotion()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const firstCopyRef = useRef<HTMLDivElement>(null)

    const [cardWidth, setCardWidth] = useState<number>(192)
    const [gap, setGap] = useState<number>(24)
    const [lapWidth, setLapWidth] = useState<number>(0)

    const rafIdRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number>(0)
    const isInteractingRef = useRef<boolean>(false)
    const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isInViewRef = useRef<boolean>(false)
    const isPausedRef = useRef<boolean>(false)

    // Responsive card width and gap
    useEffect(() => {
        const handleResize = (): void => {
            const mobile = window.innerWidth < 1081
            if (mobile) {
                setCardWidth(window.innerWidth / 2 - 12)
                setGap(12)
            } else {
                setCardWidth(192)
                setGap(64)
            }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Measure lap width using ResizeObserver
    useEffect(() => {
        const firstCopy = firstCopyRef.current
        if (!firstCopy) return

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const width = entry.contentRect.width
                if (width > 0) {
                    setLapWidth(width)
                }
            }
        })

        resizeObserver.observe(firstCopy)
        return () => resizeObserver.disconnect()
    }, [people, cardWidth, gap])

    // Initialize scroll position to middle copy
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper || lapWidth === 0) return

        wrapper.scrollLeft = lapWidth
    }, [lapWidth])

    // Infinite loop normalization (keeps scroll near middle copy)
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper || lapWidth === 0) return

        const normalizePosition = () => {
            const { scrollLeft } = wrapper

            // If scrolled too far left, jump forward one lap
            if (scrollLeft < lapWidth * 0.5) {
                wrapper.scrollLeft = scrollLeft + lapWidth
            }
            // If scrolled too far right, jump backward one lap
            else if (scrollLeft > lapWidth * 1.5) {
                wrapper.scrollLeft = scrollLeft - lapWidth
            }
        }

        wrapper.addEventListener("scroll", normalizePosition, { passive: true })
        return () => wrapper.removeEventListener("scroll", normalizePosition)
    }, [lapWidth])

    // Auto-scroll via requestAnimationFrame
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper || lapWidth === 0 || shouldReduceMotion) return

        const animate = (currentTime: number) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = currentTime
            }

            let dt = (currentTime - lastTimeRef.current) / 1000
            lastTimeRef.current = currentTime

            // Clamp dt to avoid huge jumps (tab switching, etc.)
            if (dt > 0.05) dt = 0.05

            // Only scroll if not interacting, in view, and not paused
            if (!isInteractingRef.current && isInViewRef.current && !isPausedRef.current) {
                const velocity = direction === "left" ? speedPxPerSec : -speedPxPerSec
                wrapper.scrollLeft += velocity * dt
            }

            rafIdRef.current = requestAnimationFrame(animate)
        }

        rafIdRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
            }
        }
    }, [lapWidth, direction, speedPxPerSec, shouldReduceMotion])

    // Intersection observer (only animate when in view)
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const observer = new IntersectionObserver(
            entries => {
                isInViewRef.current = entries[0].isIntersecting
            },
            { threshold: 0.1 }
        )

        observer.observe(wrapper)
        return () => observer.disconnect()
    }, [])

    // Interaction handling (pause on touch/scroll)
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const handleInteractionStart = () => {
            isInteractingRef.current = true

            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current)
            }
        }

        const handleInteractionEnd = () => {
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current)
            }

            interactionTimeoutRef.current = setTimeout(() => {
                isInteractingRef.current = false
            }, 800)
        }

        const handleMouseEnter = () => {
            if (pauseOnHover) {
                isPausedRef.current = true
            }
        }

        const handleMouseLeave = () => {
            if (pauseOnHover) {
                isPausedRef.current = false
            }
        }

        wrapper.addEventListener("pointerdown", handleInteractionStart)
        wrapper.addEventListener("touchstart", handleInteractionStart, { passive: true })
        wrapper.addEventListener("wheel", handleInteractionStart, { passive: true })
        wrapper.addEventListener("scroll", handleInteractionEnd, { passive: true })
        wrapper.addEventListener("mouseenter", handleMouseEnter)
        wrapper.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            wrapper.removeEventListener("pointerdown", handleInteractionStart)
            wrapper.removeEventListener("touchstart", handleInteractionStart)
            wrapper.removeEventListener("wheel", handleInteractionStart)
            wrapper.removeEventListener("scroll", handleInteractionEnd)
            wrapper.removeEventListener("mouseenter", handleMouseEnter)
            wrapper.removeEventListener("mouseleave", handleMouseLeave)

            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current)
            }
        }
    }, [pauseOnHover])

    const getVariant = (index: number): Variants => {
        const position = index % 3
        if (position === 0) return leftImageVariants
        if (position === 1) return middleImageVariants
        return rightImageVariants
    }

    // Create 3 copies for seamless infinite loop
    const copies = [0, 1, 2]

    return (
        <div className={`relative w-full py-8 px-2 overflow-visible ${className}`}>
            {/* Left edge fade */}
            <div className="absolute inset-y-0 left-0 w-32 sm:w-40 md:w-56 lg:w-64 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />

            {/* Right edge fade */}
            <div className="absolute inset-y-0 right-0 w-32 sm:w-40 md:w-56 lg:w-64 bg-gradient-to-l from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />

            {/* Scroll wrapper */}
            <div
                ref={wrapperRef}
                className="relative w-full overflow-x-auto touch-pan-x overscroll-x-contain select-none py-12"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                <style>{`
                    .marquee-wrapper::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {/* Track with 3 copies */}
                <div ref={trackRef} className="flex gap-3 md:gap-28">
                    {copies.map(copyIndex => (
                        <div
                            key={`copy-${copyIndex}`}
                            ref={copyIndex === 0 ? firstCopyRef : undefined}
                            className="flex gap-3 md:gap-28 shrink-0"
                        >
                            {people.map((person, personIndex) => (
                                <motion.div
                                    key={`${copyIndex}-${person.name}-${person.role ?? ""}-${personIndex}`}
                                    className="shrink-0"
                                    style={{ width: `${cardWidth}px` }}
                                    variants={
                                        !shouldReduceMotion ? getVariant(personIndex) : undefined
                                    }
                                    initial={!shouldReduceMotion ? "initial" : undefined}
                                    animate={!shouldReduceMotion ? "animate" : undefined}
                                    whileHover={!shouldReduceMotion ? "hover" : undefined}
                                >
                                    <UserCard {...person} />
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
