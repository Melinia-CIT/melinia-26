import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
    Calendar, Clock, MapPin, Users, Trophy, Target, ArrowLeft,
    AlertCircle, ShieldCheck, Phone, User2, ChevronDown, CheckCircle2,
} from "lucide-react"
import api from "../../../services/api"
import EventRegister from "./EventRegister"

interface Round { roundNo: number; roundName?: string; roundDescription: string }
interface Prize { position: number; rewardValue: number }
interface Organizer { userId: string; assignedBy: string; firstName: string; lastName: string; phoneNo: string }
interface Rule { id: number; roundNo: number | null; ruleNumber: number; ruleDescription: string }
interface Event {
    id: string
    name: string
    description: string
    participationType: string
    eventType: string
    maxAllowed: number
    minTeamSize: number
    maxTeamSize: number
    venue: string
    startTime: string
    endTime: string
    registrationStart: string
    registrationEnd: string
    rounds: Round[]
    prizes: Prize[]
    organizers: Organizer[]
    rules: Rule[]
}

const EventDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [expandedRound, setExpandedRound] = useState<number | null>(null)
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

    const { data: event, isLoading, error } = useQuery<Event>({
        queryKey: ["event", id],
        queryFn: async () => (await api.get(`/events/${id}`)).data.data,
        enabled: !!id,
    })

    const { data: registrationStatus } = useQuery({
        queryKey: ["event-status", id],
        queryFn: async () => (await api.get(`/events/${id}/status`)).data.data,
        enabled: !!id,
    })

    const isRegistered = registrationStatus?.registration_status === "registered"

    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    const formatTime = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

    const THEMES: Record<string, any> = {
        technical: {
            banner: "from-orange-400/20 via-rose-600/10 to-transparent",
            badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            accent: "text-orange-400",
            icon: "text-orange-500",
            button: "border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white",
        },
        "non-technical": {
            banner: "from-emerald-500/20 via-emerald-900/10 to-transparent",
            badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            accent: "text-emerald-400",
            icon: "text-emerald-500",
            button: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white",
        },
        flagship: {
            banner: "from-blue-600/20 via-blue-900/10 to-transparent",
            badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            accent: "text-blue-400",
            icon: "text-blue-500",
            button: "border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white",
        },
    }

    const getTheme = (type: string) => THEMES[type.toLowerCase()] || {
        banner: "from-zinc-800/30 via-zinc-700/20 to-transparent",
        badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
        accent: "text-zinc-400",
        icon: "text-zinc-500",
        button: "border-white/20 text-white hover:bg-white hover:text-black",
    }

    const getStatus = (event: Event) => {
        const now = new Date()
        const start = new Date(event.startTime)
        const end = new Date(event.endTime)
        const regStart = new Date(event.registrationStart)
        const regEnd = new Date(event.registrationEnd)

        if (now > end) return { text: "Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" }
        if (now >= start && now <= end) return { text: "Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" }
        if (now >= regStart && now <= regEnd) return { text: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
        if (now < regStart) return { text: "Coming Soon", color: "bg-zinc-600/10 text-zinc-300 border-zinc-600/20" }
        return { text: "Reg. Closed", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" }
    }

    const CARD_BASE = "bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-5"
    const BADGE_BASE = "px-2 py-0.5 rounded-full text-[10px] font-bold border"

    if (isLoading) return <main className="flex-1 w-full p-4"><div className="h-48 rounded-xl bg-zinc-800 animate-pulse" /></main>
    if (error || !event) return (
        <main className="flex-1 w-full p-4 flex flex-col items-center justify-center min-h-[50vh]">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <button onClick={() => navigate("/app/events")} className="text-xs bg-zinc-800 px-3 py-1 rounded text-white">Back</button>
        </main>
    )

    const theme = getTheme(event.eventType)
    const status = getStatus(event)
    const partStyle = event.participationType.toLowerCase() === "solo"
        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    const totalPrize = event.prizes?.reduce((sum, p) => sum + p.rewardValue, 0) || 0
    const generalRules = event.rules?.filter(r => r.roundNo === null) || []

    const RoundCard = ({ round }: { round: Round }) => {
        const roundRules = event.rules?.filter(r => r.roundNo === round.roundNo) || []
        const isExpanded = expandedRound === round.roundNo

        return (
            <motion.div layout className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                    onClick={() => setExpandedRound(isExpanded ? null : round.roundNo)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-4 pointer-events-none">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs border border-white/10 bg-white/5 text-white">
                            {round.roundNo}
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                                {round.roundName || `Round ${round.roundNo}`}
                            </h3>
                            <p className="text-[10px] text-zinc-500 uppercase mt-0.5">{round.roundDescription}</p>
                        </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </motion.div>
                </button>

                <AnimatePresence initial={true} mode="popLayout">
                    {isExpanded && (
                        <motion.div
                            key={round.roundNo}
                            // Removed 'layout' from here to prevent conflict with parent
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden bg-black/20"
                        >
                            <div className="px-4 pb-4 pt-3 border-t border-white/5 space-y-2">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Round Specific Rules:</p>
                                {roundRules.length > 0 ? (
                                    roundRules.map(r => (
                                        <div key={r.id} className="text-[11px] text-zinc-300 flex gap-2 bg-white/5 p-2 rounded border border-white/5">
                                            <span className={`${theme.accent} font-bold`}>{r.ruleNumber}.</span>
                                            {r.ruleDescription}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-zinc-600 italic px-2">No specific rules listed for this round.</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col w-full px-4 md:px-6 py-10 md:py-18 gap-8 font-geist">
            <div className="self-start flex items-center fixed z-100 top-6">
                <motion.button
                    onClick={() => navigate("/app/events")}
                    className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white transition-all shadow-2xl"
                    whileHover={{ x: -3 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Back to events</span>
                </motion.button>
            </div>

            <motion.div
                className={`relative bg-gradient-to-br ${theme.banner} rounded-xl p-6 md:p-8 mb-6 overflow-hidden border border-white/10`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`${BADGE_BASE} ${status.color}`}>{status.text}</span>
                        <span className={`${BADGE_BASE} ${theme.badge}`}>{event.eventType.toUpperCase()}</span>
                        <span className={`${BADGE_BASE} ${partStyle}`}>{event.participationType.toUpperCase()} EVENT</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white font-inst">{event.name}</h1>
                    <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">{event.description}</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`${CARD_BASE} p-4 grid grid-cols-2 md:grid-cols-4 gap-4`}>
                        <div className="flex items-start gap-2">
                            <Calendar className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">Date</p>
                                <p className="text-xs text-white font-medium">{formatDate(event.startTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">Time</p>
                                <p className="text-xs text-white font-medium">{formatTime(event.startTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">Venue</p>
                                <p className="text-xs text-white font-medium truncate">{event.venue}</p>
                            </div>
                        </div>
                        {event.participationType.toLowerCase() === "team" && (
                            <div className="flex items-start gap-2">
                                <Users className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Size</p>
                                    <p className="text-xs text-white font-medium">
                                        {event.minTeamSize === event.maxTeamSize
                                            ? `${event.maxTeamSize} members`
                                            : `${event.minTeamSize} - ${event.maxTeamSize} per team`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {generalRules.length > 0 && (
                        <div className={CARD_BASE}>
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                <ShieldCheck className={`w-4 h-4 ${theme.icon}`} /> Guidelines
                            </h2>
                            <div className="space-y-2">
                                {generalRules.map(r => (
                                    <div key={r.id} className="flex gap-2 text-zinc-300 bg-white/5 p-2 rounded-lg border border-white/10 text-xs leading-relaxed">
                                        <span className={`${theme.accent} font-bold`}>/</span>
                                        {r.ruleDescription}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {event.rounds?.length > 0 && (
                        <div className={CARD_BASE}>
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                <Target className={`w-4 h-4 ${theme.icon}`} /> Timeline
                            </h2>
                            <div className="space-y-3">
                                {event.rounds.sort((a, b) => a.roundNo - b.roundNo).map(r => (
                                    <RoundCard key={r.roundNo} round={r} />
                                ))}
                            </div>
                        </div>
                    )}

                    {event.prizes?.length > 0 && (
                        <div className={CARD_BASE}>
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                    <Trophy className="w-4 h-4 text-yellow-500" /> Rewards
                                </h2>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Pool</p>
                                    <p className="text-base font-bold text-white">₹{totalPrize.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {event.prizes.sort((a, b) => a.position - b.position).map(p => (
                                    <div key={p.position} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border ${p.position === 1 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-white/10 text-zinc-400"}`}>
                                                {p.position}
                                            </div>
                                            <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                                                {p.position === 1 ? "Winner" : `Rank ${p.position}`}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-yellow-500">₹{p.rewardValue.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className={`${CARD_BASE} sticky top-20`}>
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Registration</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mb-4">
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Opens</p>
                                <p className="text-xs text-white font-medium">
                                    {formatDate(event.registrationStart)}
                                    <span className="block text-[9px] text-zinc-500 mt-0.5">{formatTime(event.registrationStart)}</span>
                                </p>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Closes</p>
                                <p className="text-xs text-white font-medium">
                                    {formatDate(event.registrationEnd)}
                                    <span className="block text-[9px] text-zinc-500 mt-0.5">{formatTime(event.registrationEnd)}</span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => !isRegistered && status.text === "Open" && setIsRegisterModalOpen(true)}
                            disabled={isRegistered || status.text !== "Open"}
                            className={`w-full py-2.5 rounded-lg font-bold border text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${isRegistered
                                    ? "bg-green-500/10 text-green-400 border-green-500/20 cursor-default"
                                    : status.text !== "Open"
                                        ? "bg-zinc-800/50 text-zinc-500 border-zinc-700 cursor-not-allowed"
                                        : `bg-transparent ${theme.button}`
                                }`}
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

                        {isRegistered && registrationStatus?.team_name && (
                            <p className="mt-4 text-[12px] text-center text-zinc-500 uppercase font-semibold tracking-tighter">
                                Registered via <span className="text-zinc-200 font-semibold">{registrationStatus.team_name}</span> Team
                            </p>
                        )}
                        {isRegistered && !registrationStatus?.team_name && registrationStatus?.mode === "solo" && (
                            <p className="mt-4 text-[12px] text-center text-zinc-500 uppercase font-semibold tracking-tighter">
                                Registered as <span className="text-zinc-200 font-semibold">Solo</span>
                            </p>
                        )}
                    </div>

                    {event.organizers?.length > 0 && (
                        <div className={CARD_BASE}>
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                <User2 className="w-3.5 h-3.5" /> Help
                            </h3>
                            <div className="space-y-2">
                                {event.organizers.map((org, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <p className="font-bold text-white text-[11px] uppercase tracking-tight">{org.firstName} {org.lastName}</p>
                                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                                            <Phone className="w-3 h-3 text-zinc-500" />
                                            <a href={`tel:${org.phoneNo}`} className="text-[10px] text-zinc-400 font-medium hover:text-white transition-colors cursor-pointer select-all">
                                                {org.phoneNo}
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
                        onClose={() => setIsRegisterModalOpen(false)}
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["event-status", id] })}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default EventDetail
