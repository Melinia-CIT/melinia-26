import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Community, User, ArrowRight, Trophy } from "iconoir-react"
import { Event } from "@melinia/shared"

type EventCardProps = {
    event: Event
}

const EventsCard = ({ event }: EventCardProps) => {
    const getThemeStyles = (type: string) => {
        const normalizedType = type?.toLowerCase() || ""
        switch (normalizedType) {
            case "non-technical":
                return {
                    badge: "bg-gradient-to-r from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/30",
                    icon: "text-purple-400",
                    hover: "hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/15",
                    border: "border-white/10",
                    glow: "hover:shadow-purple-500/20",
                    gradient:
                        "bg-gradient-to-br from-purple-500/20 via-purple-600/15 via-purple-700/10 to-transparent",
                }
            case "technical":
                return {
                    badge: "bg-gradient-to-r from-rose-500/10 to-rose-600/5 text-rose-400 border-rose-500/30",
                    icon: "text-rose-400",
                    hover: "hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/15",
                    border: "border-white/10",
                    glow: "hover:shadow-rose-500/20",
                    gradient:
                        "bg-gradient-to-br from-rose-500/20 via-rose-600/15 via-rose-700/10 to-transparent",
                }
            case "flagship":
                return {
                    badge: "bg-gradient-to-r from-orange-500/10 to-orange-600/5 text-orange-400 border-orange-500/30",
                    icon: "text-orange-400",
                    hover: "hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/15",
                    border: "border-white/10",
                    glow: "hover:shadow-orange-500/20",
                    gradient:
                        "bg-gradient-to-br from-orange-500/20 via-orange-600/15 via-orange-700/10 to-transparent",
                }
            default:
                return {
                    badge: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
                    icon: "text-zinc-400",
                    hover: "hover:border-zinc-600/40 hover:shadow-lg hover:shadow-zinc-500/15",
                    border: "border-white/10",
                    glow: "hover:shadow-zinc-500/20",
                    gradient:
                        "bg-gradient-to-br from-zinc-900/40 via-zinc-800/30 via-zinc-700/20 to-transparent",
                }
        }
    }

    const theme = getThemeStyles(event.event_type)
    const Icon = event.participation_type === "solo" ? User : Community

    return (
        <Link to={`/app/events/${event.id}`} className="h-full block">
            <motion.div
                className={`group relative overflow-hidden rounded-3xl cursor-pointer h-full flex flex-col border ${theme.border} ${theme.hover} backdrop-blur-xl`}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className={`absolute inset-0 ${theme.gradient}`} />
                <div
                    className={`relative border ${theme.border} p-5 rounded-3xl h-full flex flex-col`}
                >
                    <h3 className="text-lg font-bold text-white mb-2 transition-colors">
                        {event.name}
                    </h3>

                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                        {event.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <Icon width="12" height="12" className={theme.icon} />
                                <span
                                    className={`text-[9px] font-bold uppercase tracking-wider ${theme.icon}`}
                                >
                                    {event.participation_type}
                                </span>
                            </div>
                            <span className="text-zinc-700">|</span>
                            <div className="flex items-center gap-1.5">
                                <Trophy width="12" height="12" className={theme.icon} />
                                <span
                                    className={`text-[9px] font-bold uppercase tracking-wider ${theme.icon}`}
                                >
                                    {event.event_type}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-white/40 group-hover:text-white transition-colors">
                            View Details
                            <ArrowRight
                                width="12"
                                height="12"
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}

export default EventsCard
