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
    id: string; name: string; description: string; participationType: "solo" | "team";
    eventType: "technical" | "non-technical" | "flagship"; maxAllowed: number;
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

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const getEventTypeColor = (type: string) => {
        const colors = {
            technical: "bg-gray-500/10 text-gray-300 border-gray-500/20",
            "non-technical": "bg-amber-700/10 text-amber-600 border-amber-700/20",
            flagship: "bg-yellow-600/10 text-yellow-500 border-yellow-600/20",
        };
        return colors[type as keyof typeof colors] || "bg-zinc-800 text-zinc-400 border-zinc-700";
    };

    const getStatusInfo = (event: Event) => {
        const now = new Date();
        if (now >= new Date(event.startTime) && now <= new Date(event.endTime)) return { text: "Event Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" };
        if (now > new Date(event.endTime)) return { text: "Event Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
        if (now >= new Date(event.registrationStart) && now <= new Date(event.registrationEnd)) return { text: "Registration Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
        return now < new Date(event.registrationStart) ? { text: "Coming Soon", color: "bg-zinc-600/10 text-zinc-300 border-zinc-600/20" } : { text: "Registration Closed", color: "bg-red-500/10 text-red-400 border-red-500/20" };
    };

    if (isLoading) {
        return (
            <main className="flex-1 w-full p-4 md:p-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                >
                    {/* Back button skeleton */}
                    <div className="h-6 w-32 rounded bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />

                    {/* Hero skeleton */}
                    <div className="h-64 rounded-2xl bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />

                    {/* Content skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-48 rounded-2xl bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />
                            ))}
                        </div>
                        <div className="space-y-8">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-40 rounded-2xl bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (error || !event) {
        return (
            <main className="flex-1 w-full p-4 md:p-8">
                <motion.div
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
                    <motion.button
                        onClick={() => navigate("/app/events")}
                        className="mt-4 px-6 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Back to Events
                    </motion.button>
                </motion.div>
            </main>
        );
    }

    const status = getStatusInfo(event);
    const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;
    const generalRules = event.rules?.filter((r) => r.roundNo === null) || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 },
        },
    };

    return (
        <main className="flex-1 w-full p-4 md:p-8">
            <motion.button
                onClick={() => navigate("/app/events")}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Events</span>
            </motion.button>

            {/* Hero Section */}
            <motion.div
                className="relative bg-gradient-to-br from-zinc-800/30 via-zinc-700/20 to-transparent rounded-2xl p-8 md:p-12 mb-8 overflow-hidden border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent" />
                <div className="relative z-10">
                    <motion.div
                        className="flex flex-wrap gap-3 mb-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}
                            variants={itemVariants}
                        >
                            {status.text}
                        </motion.span>
                        <motion.span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(event.eventType)}`}
                            variants={itemVariants}
                        >
                            {event.eventType.toUpperCase()}
                        </motion.span>
                        <motion.span
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10"
                            variants={itemVariants}
                        >
                            {event.participationType === "solo" ? "Solo" : "Team"} Event
                        </motion.span>
                    </motion.div>
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        {event.name}
                    </motion.h1>
                    <motion.p
                        className="text-xl text-zinc-300 max-w-3xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {event.description}
                    </motion.p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    className="lg:col-span-2 space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Info Grid */}
                    <motion.div
                        className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                        variants={itemVariants}
                    >
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-zinc-400 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-zinc-400">Date</p>
                                <p className="text-white font-medium">{formatDate(event.startTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-zinc-400 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-zinc-400">Time</p>
                                <p className="text-white font-medium">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-zinc-400 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-zinc-400">Venue</p>
                                <p className="text-white font-medium">{event.venue}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-zinc-400 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-zinc-400">Participants</p>
                                <p className="text-white font-medium">{event.minTeamSize}-{event.maxTeamSize} per {event.participationType}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Guidelines */}
                    {generalRules.length > 0 && (
                        <motion.div
                            className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                            variants={itemVariants}
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-zinc-400" />
                                General Guidelines
                            </h2>
                            <div className="space-y-3">
                                {generalRules.map((rule, index) => (
                                    <motion.div
                                        key={rule.id}
                                        className="flex gap-3 text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/10"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <span className="text-zinc-400 font-bold">•</span>
                                        <p className="text-sm">{rule.ruleDescription}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Rounds Accordion */}
                    {event.rounds?.length > 0 && (
                        <motion.div
                            className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                            variants={itemVariants}
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Target className="w-6 h-6 text-zinc-400" />
                                Event Rounds
                            </h2>
                            <div className="space-y-4">
                                {event.rounds.map((round) => {
                                    const roundRules = event.rules?.filter(r => r.roundNo === round.roundNo) || [];
                                    const isExpanded = expandedRound === round.roundNo;
                                    return (
                                        <motion.div
                                            key={round.roundNo}
                                            className="bg-zinc-800/40 border border-white/10 rounded-2xl overflow-hidden"
                                            layout
                                        >
                                            <motion.button
                                                onClick={() => setExpandedRound(isExpanded ? null : round.roundNo)}
                                                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                                                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white font-bold border border-white/20">
                                                        {round.roundNo}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white text-lg">Round {round.roundNo}</h3>
                                                        <p className="text-sm text-zinc-400">{round.roundDescription}</p>
                                                    </div>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <ChevronDown className="w-6 h-6 text-zinc-400" />
                                                </motion.div>
                                            </motion.button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        className="bg-white/5 border-t border-white/10 p-5"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        {roundRules.length > 0 ? (
                                                            <ul className="space-y-2">
                                                                {roundRules.map(rule => (
                                                                    <li key={rule.id} className="text-sm text-zinc-300 flex gap-2">
                                                                        <span className="text-zinc-500 font-medium">{rule.ruleNumber}.</span>
                                                                        {rule.ruleDescription}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-zinc-500 italic text-center">No specific rules for this round.</p>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Prize Pool */}
                    {event.prizes?.length > 0 && (
                        <motion.div
                            className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                            variants={itemVariants}
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                Prize Pool
                            </h2>
                            <div className="mb-6">
                                <motion.p
                                    className="text-3xl font-bold text-yellow-500"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    ₹{totalPrizePool.toLocaleString()}
                                </motion.p>
                                <p className="text-sm text-zinc-400">Total Prize Money</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {event.prizes.sort((a, b) => a.position - b.position).map((prize, index) => (
                                    <motion.div
                                        key={prize.position}
                                        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + index * 0.05 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold border ${prize.position === 1 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-white/10 text-white border-white/20"}`}>
                                                {prize.position}
                                            </div>
                                            <span className="font-medium text-white">
                                                {prize.position === 1 ? "First Prize" : prize.position === 2 ? "Second Prize" : `Position ${prize.position}`}
                                            </span>
                                        </div>
                                        <span className="text-xl font-bold text-yellow-500">₹{prize.rewardValue.toLocaleString()}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Sidebar */}
                <motion.div
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-6"
                        variants={itemVariants}
                    >
                        <h3 className="text-xl font-bold mb-4">Registration</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-sm text-zinc-400">Opens</p>
                                <p className="text-white font-medium">{formatDate(event.registrationStart)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Closes</p>
                                <p className="text-white font-medium">{formatDate(event.registrationEnd)}</p>
                            </div>
                        </div>
                        <motion.button
                            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-semibold transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Register Now
                        </motion.button>
                    </motion.div>

                    {event.organizers?.length > 0 && (
                        <motion.div
                            className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                            variants={itemVariants}
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <User2 className="w-5 h-5" />
                                Organizers
                            </h3>
                            <div className="space-y-3">
                                {event.organizers.map((org, i) => (
                                    <motion.div
                                        key={i}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <User2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-white">{org.firstName} {org.lastName}</p>
                                                <p className="text-xs text-zinc-400">Event Organizer</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                            <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                            <span className="text-sm text-zinc-300 font-medium">{org.phoneNo}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </main>
    );
};

export default EventDetail;
