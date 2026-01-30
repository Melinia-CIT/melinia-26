"use strict"

import { motion } from "framer-motion"
import { HudSectionHeader } from "../ui/hud-section-header"
import { peopleData } from "../../types/people"
import { InfiniteMarqueeRow } from "./InfiniteMarqueeRow"

interface ColorMapType {
    [key: string]: string
}

export default function People(): React.ReactElement {
    const colorMap: ColorMapType = {
        "Core Team": "#FF0055",
        "Dev Team": "#9D00FF",
    }

    return (
        <section className="relative w-full py-20 bg-zinc-950 text-white overflow-hidden">
            <div className="relative mx-auto px-4 md:px-8 w-full">
                {/* Top-left corner pattern */}
                <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                        <defs>
                            <linearGradient
                                id="corner-gradient-tl"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#9D00FF" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#FF0066" stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.path
                                key={i}
                                d={`M0,${60 + i * 40} Q${60 + i * 40},${60 + i * 40} ${60 + i * 40},0`}
                                stroke="url(#corner-gradient-tl)"
                                strokeWidth={3 - i * 0.3}
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: [0.2 + i * 0.05, 0.6 + i * 0.05, 0.2 + i * 0.05],
                                }}
                                transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Top-right corner pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                        <defs>
                            <linearGradient
                                id="corner-gradient-tr"
                                x1="100%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#FF0066" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#9D00FF" stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.path
                                key={i}
                                d={`M400,${60 + i * 40} Q${340 - i * 40},${60 + i * 40} ${340 - i * 40},0`}
                                stroke="url(#corner-gradient-tr)"
                                strokeWidth={3 - i * 0.3}
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: [0.2 + i * 0.05, 0.6 + i * 0.05, 0.2 + i * 0.05],
                                }}
                                transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Bottom-left corner pattern */}
                <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                        <defs>
                            <linearGradient
                                id="corner-gradient-bl"
                                x1="0%"
                                y1="100%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor="#9D00FF" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#FF0066" stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.path
                                key={i}
                                d={`M0,${340 - i * 40} Q${60 + i * 40},${340 - i * 40} ${60 + i * 40},400`}
                                stroke="url(#corner-gradient-bl)"
                                strokeWidth={3 - i * 0.3}
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: [0.2 + i * 0.05, 0.6 + i * 0.05, 0.2 + i * 0.05],
                                }}
                                transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Bottom-right corner pattern */}
                <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                        <defs>
                            <linearGradient
                                id="corner-gradient-br"
                                x1="100%"
                                y1="100%"
                                x2="0%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor="#FF0066" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#9D00FF" stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.path
                                key={i}
                                d={`M400,${340 - i * 40} Q${340 - i * 40},${340 - i * 40} ${340 - i * 40},400`}
                                stroke="url(#corner-gradient-br)"
                                strokeWidth={3 - i * 0.3}
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: [0.2 + i * 0.05, 0.6 + i * 0.05, 0.2 + i * 0.05],
                                }}
                                transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </svg>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center relative"
                >
                    <h2 className="font-space text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Our Team
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 -rotate-[2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>

                <div className="space-y-16 relative">
                    {peopleData.map((section, index) => {
                        const isEven = index % 2 === 0
                        const sectionColor = colorMap[section.title] || "#FF0055"
                        const direction = isEven ? "left" : "right"

                        return (
                            <div key={section.title} className="relative">
                                <HudSectionHeader
                                    title={section.title}
                                    color={sectionColor}
                                    align={isEven ? "left" : "right"}
                                    className="mb-8"
                                />

                                <div className="-mx-4 md:-mx-8">
                                    <InfiniteMarqueeRow
                                        people={section.people}
                                        direction={direction}
                                        speedPxPerSec={80}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
