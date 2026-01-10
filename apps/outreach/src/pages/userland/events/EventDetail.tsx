import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Trophy,
    Target,
    ArrowLeft,
    AlertCircle,
    ShieldCheck,
    Phone,
    User2,
    ChevronDown
} from "lucide-react";
import api from "../../../services/api";

interface Round { roundNo: number; roundDescription: string; }
interface Prize { position: number; rewardValue: number; }
interface Organizer { userId: string; assignedBy: string; firstName: string; lastName: string; phoneNo: string; }
interface Rule { id: number; roundNo: number | null; ruleNumber: number; ruleDescription: string; }
interface Event {
    id: string; name: string; description: string; participationType: string;
    eventType: string; maxAllowed: number;
    minTeamSize: number; maxTeamSize: number; venue: string; startTime: string;
    endTime: string; registrationStart: string; registrationEnd: string;
    rounds: Round[]; prizes: Prize[]; organizers: Organizer[]; rules: Rule[];
}

const EventDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [expandedRound, setExpandedRound] = useState<number | null>(null);

    const { data: event, isLoading, error } = useQuery<Event>({
        queryKey: ["event", id],
        queryFn: async () => {
            const response = await api.get(`/events/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const getThemeStyles = (type: string) => {
        const typeLower = type?.toLowerCase();
        if (typeLower === "technical") return {
            banner: "from-orange-400/20 via-rose-600/10 to-transparent",
            badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            accent: "text-orange-400",
            button: "border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white",
            icon: "text-orange-500", // Fixed: Added missing property
            shadow: "rgba(251, 146, 60, 0.4)"
        };
        if (typeLower === "non-technical") return {
            banner: "from-emerald-500/20 via-emerald-900/10 to-transparent",
            badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            accent: "text-emerald-400",
            button: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white",
            icon: "text-emerald-500", // Fixed: Added missing property
            shadow: "rgba(52, 211, 153, 0.4)"
        };
        if (typeLower === "flagship") return {
            banner: "from-blue-600/20 via-blue-900/10 to-transparent",
            badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            accent: "text-blue-400",
            button: "border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white",
            icon: "text-blue-500", // Fixed: Added missing property
            shadow: "rgba(96, 165, 250, 0.4)"
        };
        return {
            banner: "from-zinc-800/30 via-zinc-700/20 to-transparent",
            badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
            accent: "text-zinc-400",
            button: "border-white/20 text-white hover:bg-white hover:text-black",
            icon: "text-zinc-500", // Fixed: Added missing property
            shadow: "rgba(255, 255, 255, 0.1)"
        };
    };

    const getStatusInfo = (event: Event) => {
        const now = new Date();
        if (now >= new Date(event.startTime) && now <= new Date(event.endTime)) return { text: "Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" };
        if (now > new Date(event.endTime)) return { text: "Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
        if (now >= new Date(event.registrationStart) && now <= new Date(event.registrationEnd)) return { text: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
        return { text: "Coming Soon", color: "bg-zinc-600/10 text-zinc-300 border-zinc-600/20" };
    };

    if (isLoading) return <main className="flex-1 w-full p-4"><div className="h-48 rounded-xl bg-zinc-800 animate-pulse" /></main>;
    if (error || !event) return <main className="flex-1 w-full p-4 flex flex-col items-center justify-center min-h-[50vh]"><AlertCircle className="w-12 h-12 text-red-400 mb-2" /><button onClick={() => navigate("/app/events")} className="text-xs bg-zinc-800 px-3 py-1 rounded text-white">Back</button></main>;

    const status = getStatusInfo(event);
    const theme = getThemeStyles(event.eventType);
    const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;
    const generalRules = event.rules?.filter((r) => r.roundNo === null) || [];

    return (
        <main className="flex-1 w-full p-4 md:px-8 md:py-6">
            <motion.button
                onClick={() => navigate("/app/events")}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-white mb-4 transition-colors"
                whileHover={{ x: -2 }}
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Back</span>
            </motion.button>

            <motion.div
                className={`relative bg-gradient-to-br ${theme.banner} rounded-xl p-6 md:p-8 mb-6 overflow-hidden border border-white/10`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>{status.text}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>{event.eventType.toUpperCase()}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{event.name}</h1>
                    <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">{event.description}</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2">
                            <Calendar className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div><p className="text-[10px] font-bold text-zinc-500 uppercase">Date</p><p className="text-xs text-white font-medium">{formatDate(event.startTime)}</p></div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div><p className="text-[10px] font-bold text-zinc-500 uppercase">Time</p><p className="text-xs text-white font-medium">{formatTime(event.startTime)}</p></div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div><p className="text-[10px] font-bold text-zinc-500 uppercase">Venue</p><p className="text-xs text-white font-medium truncate w-24 md:w-auto">{event.venue}</p></div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users className={`w-4 h-4 ${theme.icon} mt-0.5`} />
                            <div><p className="text-[10px] font-bold text-zinc-500 uppercase">Size</p><p className="text-xs text-white font-medium">{event.maxTeamSize} Max</p></div>
                        </div>
                    </div>

                    {generalRules.length > 0 && (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                <ShieldCheck className={`w-4 h-4 ${theme.icon}`} /> Guidelines
                            </h2>
                            <div className="space-y-2">
                                {generalRules.map((rule) => (
                                    <div key={rule.id} className="flex gap-2 text-zinc-300 bg-white/5 p-2 rounded-lg border border-white/10 text-xs leading-relaxed">
                                        <span className={`${theme.accent} font-bold`}>/</span>{rule.ruleDescription}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {event.rounds?.length > 0 && (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-zinc-200">
                                <Target className={`w-4 h-4 ${theme.icon}`} /> Timeline
                            </h2>
                            <div className="space-y-3">
                                {event.rounds.map((round) => {
                                    const roundRules = event.rules?.filter(r => r.roundNo === round.roundNo) || [];
                                    const isExpanded = expandedRound === round.roundNo;
                                    return (
                                        <div key={round.roundNo} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                            <button 
                                                onClick={() => setExpandedRound(isExpanded ? null : round.roundNo)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 pointer-events-none">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs border border-white/10 bg-white/5 text-white`}>{round.roundNo}</div>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-white uppercase tracking-tight">Round {round.roundNo}</h3>
                                                        <p className="text-[10px] text-zinc-500 uppercase">{round.roundDescription}</p>
                                                    </div>
                                                </div>
                                                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                </motion.div>
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                                        className="overflow-hidden bg-black/20"
                                                    >
                                                        <div className="px-4 pb-4 pt-3 border-t border-white/5 space-y-2">
                                                            {roundRules.length > 0 ? (
                                                                roundRules.map(rule => (
                                                                    <div key={rule.id} className="text-[11px] text-zinc-400 flex gap-2">
                                                                        <span className={`${theme.accent} font-bold`}>{rule.ruleNumber}.</span>
                                                                        {rule.ruleDescription}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-[10px] text-zinc-600 italic">No specific rules listed.</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
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
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Pool</p>
                                    <p className="text-base font-bold text-white">₹{totalPrizePool.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {event.prizes.sort((a, b) => a.position - b.position).map((prize) => (
                                    <div key={prize.position} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border ${prize.position === 1 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-white/10 text-zinc-400"}`}>{prize.position}</div>
                                            <span className="text-[10px] font-medium text-white uppercase tracking-wider">{prize.position === 1 ? "Winner" : `Rank ${prize.position}`}</span>
                                        </div>
                                        <span className="text-xs font-bold text-yellow-500">₹{prize.rewardValue.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sticky top-6">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Registration</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mb-4">
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Opens</p>
                                <p className="text-xs text-white font-medium">{formatDate(event.registrationStart)}</p>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Closes</p>
                                <p className="text-xs text-white font-medium">{formatDate(event.registrationEnd)}</p>
                            </div>
                        </div>
                        <button className={`w-full py-2.5 rounded-lg font-bold border text-[10px] uppercase tracking-widest transition-colors duration-300 bg-transparent ${theme.button}`}>
                            Register Now
                        </button>
                    </div>

                    {event.organizers?.length > 0 && (
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-1.5"><User2 className="w-3.5 h-3.5" /> Help</h3>
                            <div className="space-y-2">
                                {event.organizers.map((org, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <p className="font-bold text-white text-[11px] uppercase tracking-tight">{org.firstName} {org.lastName}</p>
                                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                                            <Phone className="w-3 h-3 text-zinc-500" />
                                            <span className="text-[10px] text-zinc-400 font-medium">{org.phoneNo}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default EventDetail;