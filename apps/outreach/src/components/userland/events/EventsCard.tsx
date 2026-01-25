import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Calendar, MapPin, Clock } from "lucide-react"
import { Community, User } from "iconoir-react";
import { Event } from "@melinia/shared"

type EventCardProps = {
    event: Event
}

const EventsCard = ({ event }: EventCardProps) => {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getThemeStyles = (type: string) => {
        const normalizedType = type?.toLowerCase() || ""
        switch (normalizedType) {
            case "technical":
                return {
                    header: "from-rose-500/20 via-rose-600/10 to-transparent",
                    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                    accent: "#e11d48",
                }
            case "non-technical":
                return {
                    header: "from-emerald-500/20 via-emerald-900/10 to-transparent",
                    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                    accent: "#34d399",
                }
            case "flagship":
                return {
                    header: "from-blue-600/20 via-blue-900/10 to-transparent",
                    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                    accent: "#60a5fa",
                }
            default:
                return {
                    header: "from-zinc-800/30 via-zinc-700/20 to-transparent",
                    badge: "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50",
                    accent: "#ffffff",
                }
        }
    }

    const theme = getThemeStyles(event.event_type)
    const Icon = event.participation_type === "solo" ? User : Community

    return (
        <Link to={`/app/events/${event.id}`} className="h-full block">
            <motion.div
                className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-2xl hover:border-white/20"
                whileHover="hover"
                initial="initial"
            >
                <div className="absolute inset-0 z-50 pointer-events-none">
                    <svg
                        className="w-full h-full"
                        fill="none"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <filter
                                id={`video-glow-${event.id}`}
                                x="-20%"
                                y="-20%"
                                width="140%"
                                height="140%"
                            >
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feFlood
                                    floodColor={theme.accent}
                                    floodOpacity="0.8"
                                    result="glowColor"
                                />
                                <feComposite
                                    in="glowColor"
                                    in2="blur"
                                    operator="in"
                                    result="softGlow"
                                />
                                <feMerge>
                                    <feMergeNode in="softGlow" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <motion.rect
                            x="1"
                            y="1"
                            width="calc(100% - 2px)"
                            height="calc(100% - 2px)"
                            rx="16"
                            stroke={theme.accent}
                            variants={{
                                initial: { strokeWidth: 1, opacity: 0.1 },
                                hover: { strokeWidth: 1.5, opacity: 0.3 },
                            }}
                        />

                        <motion.rect
                            x="1"
                            y="1"
                            width="calc(100% - 2px)"
                            height="calc(100% - 2px)"
                            rx="16"
                            stroke={theme.accent}
                            filter={`url(#video-glow-${event.id})`}
                            strokeLinecap="round"
                            pathLength="100"
                            variants={{
                                initial: { strokeWidth: 0, opacity: 0 },
                                hover: {
                                    strokeWidth: 4,
                                    opacity: 1,
                                    strokeDasharray: "40 60", // 40% Bright, 60% Faded
                                    strokeDashoffset: [0, -100],
                                    transition: {
                                        strokeDashoffset: {
                                            repeat: Infinity,
                                            duration: 3,
                                            ease: "linear",
                                        },
                                        strokeWidth: { duration: 0.3 },
                                        opacity: { duration: 0.3 },
                                    },
                                },
                            }}
                        />
                    </svg>
                </div>

                {/* Header Section */}
                <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${theme.header}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent" />
                    <div className="absolute top-4 left-4">
                        <motion.span
                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ${theme.badge}`}
                        >
                            <Icon className="w-3 h-3" />
                            {event.participation_type?.toUpperCase() || "SOLO"}
                        </motion.span>
                    </div>
                    <div className="absolute top-4 right-4">
                        <motion.span
                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold border ${theme.badge}`}
                        >
                            {event.event_type.toUpperCase()}
                        </motion.span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors duration-300 line-clamp-2">
                        {event.name}
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
                        {event.description}
                    </p>

                    <div className="space-y-2.5 mt-auto">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            <span>{event.start_time ? formatDate(event.start_time) : "TBA"}</span>
                            <Clock className="w-4 h-4 text-zinc-400 ml-2 flex-shrink-0" />
                            <span>{event.start_time ? formatTime(event.start_time) : "TBA"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{event.venue || "Venue TBA"}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}

export default EventsCard
