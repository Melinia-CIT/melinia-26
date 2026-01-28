import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Trophy,
    Target,
    ArrowLeft,
    AlertCircle,
    Phone,
    User2,
    ChevronDown,
    CheckCircle2,
    Trash2,
    ExternalLink,
} from "lucide-react"
import api from "../../../services/api"
import EventRegister from "../../../components/userland/events/EventRegister"
import EventUnRegister from "../../../components/userland/events/EventUnregister"
import {
    GetVerboseEvent,
    getVerboseEventResponseSchema,
    UserRegistrationStatus,
} from "@melinia/shared"
import {
    hackathon_event_id,
    hackathon_unstop_url,
    pitch_pit_event_id,
    pitch_pit_unstop_url,
} from "../../../types/event"

type VerboseEvent = {
    event: GetVerboseEvent
}

const EventDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [expandedRound, setExpandedRound] = useState<number | null>(null)
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
    const [isUnregisterModalOpen, setIsUnregisterModalOpen] = useState(false)
    const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false) // New state for redirect dialog

    const {
        data: event,
        isLoading,
        error,
    } = useQuery<GetVerboseEvent>({
        queryKey: ["event", id],
        queryFn: async () => {
            const response = await api.get<VerboseEvent>(`/events/${id}`)
            return getVerboseEventResponseSchema.parse(response.data.event)
        },
        enabled: !!id,
    })

    const { data: regStatus } = useQuery<UserRegistrationStatus>({
        queryKey: ["event-status", id],
        queryFn: async () => {
            const response = await api.get<UserRegistrationStatus>(`/events/${id}/status`)
            return response.data
        },
        enabled: !!id,
    })

    const isRegistered = regStatus?.registered

    const formatDate = (dateString: string) =>
        dateString
            ? new Date(dateString).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
              })
            : "TBA"

    const formatTime = (dateString: string) =>
        dateString
            ? new Date(dateString).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "TBA"

    const getThemeStyles = (type: string) => {
        const typeLower = type?.toLowerCase()
        if (typeLower === "technical")
            return {
                banner: "from-rose-500/20 via-rose-600/10 to-transparent",
                badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                accent: "text-rose-400",
                button: "border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white",
                icon: "text-rose-500",
            }
        if (typeLower === "non-technical")
            return {
                banner: "from-emerald-500/20 via-emerald-900/10 to-transparent",
                badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                accent: "text-emerald-400",
                button: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white",
                icon: "text-emerald-500",
            }
        if (typeLower === "flagship")
            return {
                banner: "from-blue-600/20 via-blue-900/10 to-transparent",
                badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                accent: "text-blue-400",
                button: "border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white",
                icon: "text-blue-500",
            }
        return {
            banner: "from-zinc-800/30 via-zinc-700/20 to-transparent",
            badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
            accent: "text-zinc-400",
            button: "border-white/20 text-white hover:bg-white hover:text-black",
            icon: "text-zinc-500",
        }
    }

    const getStatusInfo = (evt: GetVerboseEvent) => {
        const now = new Date()
        const start = evt.start_time ? new Date(evt.start_time) : null
        const end = evt.end_time ? new Date(evt.end_time) : null
        const regStart = new Date(evt.registration_start)
        const regEnd = new Date(evt.registration_end)

        if (end && now > end)
            return { text: "Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" }
        if (start && end && now >= start && now <= end)
            return { text: "Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" }
        if (now >= regStart && now <= regEnd)
            return { text: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
        if (now < regStart)
            return {
                text: "Coming Soon",
                color: "bg-zinc-600/10 text-zinc-300 border-zinc-600/20",
            }
        return { text: "Reg. Closed", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" }
    }

    // New handler to check event type before opening modal
    const handleRegisterClick = () => {
        if (event?.id === hackathon_event_id || event?.id === pitch_pit_event_id) {
            setIsRedirectModalOpen(true)
        } else {
            setIsRegisterModalOpen(true)
        }
    }

    const handleRedirectConfirm = () => {
        const unstop_url =
            event?.id === hackathon_event_id ? hackathon_unstop_url : pitch_pit_unstop_url
        window.open(unstop_url, "_blank", "noopener,noreferrer")
        setIsRedirectModalOpen(false)
    }

    if (isLoading)
        return (
            <div className="flex-1 w-full p-4">
                <div className="h-48 rounded-xl bg-zinc-800 animate-pulse" />
            </div>
        )
    if (error || !event)
        return (
            <div className="w-full p-4 flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
                <p className="text-sm sm:text-md font-medium font-geist text-zinc-400">
                    Something went wrong. Snap!
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/app/events")}
                    className="text-xs bg-zinc-800 px-3 py-1 rounded text-white"
                >
                    Back
                </button>
            </div>
        )

    const status = getStatusInfo(event)
    const theme = getThemeStyles(event.event_type)
    const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.reward_value, 0) || 0

    return (
        <div className="flex flex-col w-full md:px-8 md:py-6 relative">
            <motion.button
                onClick={() => navigate("/app/events")}
                className="pointer-events-auto flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 text-zinc-100 hover:bg-zinc-800 hover:border-white/20 transition-all shadow-2xl z-99"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            <motion.div
                className={`relative bg-gradient-to-br ${theme.banner} rounded-xl p-6 md:p-8 my-6 overflow-hidden border border-white/10`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}
                        >
                            {status.text}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}
                        >
                            {event.event_type.toUpperCase()}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{event.name}</h1>
                    <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {event.description}
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2">
                            <Calendar className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                    Date
                                </p>
                                <p className="text-xs text-white font-medium">
                                    {formatDate(event.start_time.toString())}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                    Time
                                </p>
                                <p className="text-xs text-white font-medium">
                                    {formatTime(event.start_time.toString())}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className={`w-4 h-4 ${theme.icon} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                    Venue
                                </p>
                                <p className="text-xs text-white font-medium break-words">
                                    {event.venue}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                    Size
                                </p>
                                <p className="text-xs text-white font-medium">
                                    {event.participation_type.toLowerCase() === "solo"
                                        ? "Solo"
                                        : event.min_team_size === event.max_team_size
                                          ? `${event.max_team_size} per team`
                                          : `${event.min_team_size} - ${event.max_team_size} per team`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {event.rounds?.length > 0 && (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                <Target className={`w-4 h-4 ${theme.icon}`} /> Rounds
                            </h2>
                            <div className="space-y-3">
                                {event.rounds
                                    .sort((a: any, b: any) => a.round_no - b.round_no)
                                    .map(round => {
                                        const roundRules = round.rules ?? []
                                        const hasRules = roundRules.length > 0
                                        const isExpanded = expandedRound === round.round_no
                                        const timeLabel =
                                            round.start_time && round.end_time
                                                ? `${formatTime(round.start_time.toString())} - ${formatTime(round.end_time.toString())}`
                                                : round.start_time
                                                  ? formatTime(round.start_time.toString())
                                                  : "TBA"
                                        return (
                                            <div
                                                key={round.round_no}
                                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedRound(
                                                            isExpanded ? null : round.round_no
                                                        )
                                                    }
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs border border-white/10 bg-white/5 text-white">
                                                            {round.round_no}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                                                                {round.round_name ||
                                                                    `Round ${round.round_no}`}
                                                            </h3>
                                                            <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-medium bg-white/10 text-zinc-400 border border-white/10">
                                                                {timeLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <motion.div
                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    >
                                                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                    </motion.div>
                                                </button>
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: "easeInOut",
                                                            }}
                                                            className="overflow-hidden bg-black/20 border-t border-white/5"
                                                        >
                                                            <div className="px-4 pb-4 pt-3 space-y-3">
                                                                {round.round_description && (
                                                                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                                                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                                                                            {
                                                                                round.round_description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {hasRules && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-[9px] text-zinc-500 uppercase font-bold">
                                                                            Rules
                                                                        </p>
                                                                        {roundRules.map(rule => (
                                                                            <div
                                                                                key={rule.id}
                                                                                className="text-[11px] text-zinc-300 flex gap-2 bg-white/5 p-2 rounded border border-white/5"
                                                                            >
                                                                                <span
                                                                                    className={`${theme.accent} font-bold`}
                                                                                >
                                                                                    {rule.rule_no}.
                                                                                </span>
                                                                                {
                                                                                    rule.rule_description
                                                                                }
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {event.prizes?.length > 0 && (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                    <Trophy className="w-4 h-4 text-yellow-500" /> Rewards
                                </h2>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase">
                                        Total Pool
                                    </p>
                                    <p className="text-base font-bold text-white">
                                        ₹{totalPrizePool.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {event.prizes
                                    .sort((a, b) => a.position - b.position)
                                    .map(prize => (
                                        <div
                                            key={prize.position}
                                            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border ${prize.position === 1 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-white/10 text-zinc-400"}`}
                                                >
                                                    {prize.position}
                                                </div>
                                                <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                                                    {prize.position === 1
                                                        ? "Winner"
                                                        : `Rank ${prize.position}`}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-yellow-500">
                                                ₹{prize.reward_value.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                            Registration
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mb-4">
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">
                                    Opens
                                </p>
                                <p className="text-xs text-white font-medium">
                                    {formatDate(event.registration_start.toString())}
                                </p>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">
                                    Closes
                                </p>
                                <p className="text-xs text-white font-medium">
                                    {formatDate(event.registration_end.toString())}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRegisterClick} // Updated to use handler
                            disabled={isRegistered || status.text !== "Open"}
                            className={`w-full py-2.5 rounded-lg font-bold border text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 
                                ${isRegistered ? "bg-green-500/10 text-green-400 border-green-500/20 cursor-default" : status.text !== "Open" ? "bg-zinc-800/50 text-zinc-500 border-zinc-700 cursor-not-allowed" : theme.button}`}
                        >
                            {isRegistered ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" /> Registered
                                </>
                            ) : status.text === "Open" ? (
                                "Register Now"
                            ) : (
                                status.text
                            )}
                        </button>

                        {isRegistered && (
                            <div className="mt-4 space-y-3">
                                <p className="text-[12px] text-center text-zinc-500 uppercase font-semibold tracking-tighter">
                                    {regStatus && "team" in regStatus && regStatus.team?.name ? (
                                        <>
                                            Registered via{" "}
                                            <span className="text-zinc-100 font-bold">
                                                {regStatus.team.name}
                                            </span>{" "}
                                            Team
                                        </>
                                    ) : (
                                        <>
                                            Registered as{" "}
                                            <span className="text-zinc-100 font-bold">Solo</span>
                                        </>
                                    )}
                                </p>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsUnregisterModalOpen(!isUnregisterModalOpen)}
                                    className="w-full py-2 rounded-lg font-bold border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Unregister from Event
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {event.crew?.organizers?.length > 0 && (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                <User2 className="w-3.5 h-3.5" /> Organizers
                            </h3>
                            <div className="space-y-2">
                                {event.crew?.organizers?.map((org: any) => (
                                    <div
                                        key={org.userId}
                                        className="bg-white/5 border border-white/10 rounded-xl p-3"
                                    >
                                        <p className="font-bold text-white text-[11px] uppercase tracking-tight">
                                            {org.first_name} {org.last_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                                            <Phone className="w-3 h-3 text-zinc-500" />
                                            <a
                                                href={`tel:${org.ph_no}`}
                                                className="text-[10px] text-zinc-400 font-medium hover:text-white transition-colors"
                                            >
                                                +91 {org.ph_no}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isRegisterModalOpen && (
                    <EventRegister
                        event={event}
                        onClose={() => setIsRegisterModalOpen(!isRegisterModalOpen)}
                        onSuccess={() =>
                            queryClient.invalidateQueries({ queryKey: ["event-status", id] })
                        }
                    />
                )}
                {isUnregisterModalOpen && (
                    <EventUnRegister
                        eventName={event.name}
                        eventId={event.id}
                        onClose={() => setIsUnregisterModalOpen(!isUnregisterModalOpen)}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["event-status", id] })
                        }}
                    />
                )}

                {/* Redirect Confirmation Modal */}
                {isRedirectModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <ExternalLink className="w-6 h-6 text-zinc-200" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Redirect to Unstop
                                    </h3>
                                    <p className="text-sm text-zinc-300 mt-2">
                                        Flagship events are organised in Unstop platform. Can we
                                        redirect to Unstop?
                                    </p>
                                </div>
                                <div className="flex w-full gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRedirectModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRedirectConfirm}
                                        className="flex-1 py-2.5 rounded-lg bg-blue-900 text-zinc-200 text-sm font-medium transition-colors flex items-center justify-center gap-2 hover:cursor-pointer"
                                    >
                                        Redirect
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default EventDetail
