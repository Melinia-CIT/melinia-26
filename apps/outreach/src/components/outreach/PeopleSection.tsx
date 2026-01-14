import { motion } from "framer-motion"
import { FloatingPathsBackground } from "../ui/floating-paths"
import { HudProfileCard } from "../ui/hud-profile-card"
import { peopleData } from "../../types/people"
import type { Person } from "../../types/people"

interface PeopleSectionProps {
    className?: string
}

export default function PeopleSection({ className = "" }: PeopleSectionProps) {
    const allPeople: Person[] = peopleData

    const getRandomProps = (index: number) => {
        const seed = index * 9301 + 49297
        const random = () => {
            let t = seed
            t = (t ^ (t << 15)) & 0x7fffffff
            t = (t ^ (t >> 12)) & 0x7fffffff
            t = (t ^ (t << 4)) & 0x7fffffff
            t = (t ^ (t >> 16)) & 0x7fffffff
            return (t % 100) / 100
        }

        return {
            tilt: Math.floor(random() * 17) - 8,
            zIndex: Math.floor(random() * 10),
            delay: index * 0.1,
        }
    }

    return (
        <section
            className={`relative w-full py-16 md:py-24 overflow-hidden bg-zinc-950 ${className}`}
        >
            <FloatingPathsBackground position={2} className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/30 to-zinc-950/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(157,0,255,0.1),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,0,102,0.1),_transparent_50%)]" />
            </FloatingPathsBackground>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-8xl mx-auto px-4 md:px-8"
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12 relative"
                >
                    <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        The Team
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#9D00FF] to-[#0066FF] mx-auto mt-4 rotate-[2deg] shadow-[0_0_15px_rgba(157,0,255,0.8)]" />
                </motion.div>

                <div className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6 px-2 md:px-4">
                    {allPeople.map((person: Person, index: number) => {
                        const { tilt, zIndex } = getRandomProps(index)

                        return (
                            <div
                                key={person.id}
                                className="w-32 md:w-40 lg:w-48 flex-shrink-0"
                                style={{
                                    transform: `rotate(${tilt}deg)`,
                                    marginTop: `${Math.random() * 8 - 4}px`,
                                    marginBottom: `${Math.random() * 8 - 4}px`,
                                    marginLeft: `${Math.random() * 6 - 3}px`,
                                    marginRight: `${Math.random() * 6 - 3}px`,
                                }}
                            >
                                <HudProfileCard
                                    person={person}
                                    tilt={tilt}
                                    zIndex={zIndex}
                                    className="w-full"
                                />
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </section>
    )
}
