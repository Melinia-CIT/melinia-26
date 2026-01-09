import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, Trophy, MapPin, Clock, Target } from "lucide-react";

interface Round {
    roundNo: number;
    roundDescription: string;
}

interface Prize {
    position: number;
    rewardValue: number;
}

interface Organizer {
    userId: string;
    assignedBy: string;
}

interface Rule {
    id: number;
    roundNo: number | null;
    ruleNumber: number;
    ruleDescription: string;
}

interface Event {
    id: string;
    name: string;
    description: string;
    participationType: "solo" | "team";
    eventType: "technical" | "non-technical" | "flagship";
    maxAllowed: number;
    minTeamSize: number;
    maxTeamSize: number;
    venue: string;
    startTime: string;
    endTime: string;
    registrationStart: string;
    registrationEnd: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    rounds: Round[];
    prizes: Prize[];
    organizers: Organizer[];
    rules: Rule[];
}

interface EventsCardProps {
    event: Event;
}

const EventsCard = ({ event }: EventsCardProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (event: Event) => {
        const now = new Date();
        const regStart = new Date(event.registrationStart);
        const regEnd = new Date(event.registrationEnd);
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        if (now >= eventStart && now <= eventEnd) {
            return "bg-green-500/10 text-green-400 border-green-500/20";
        } else if (now > eventEnd) {
            return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        } else if (now >= regStart && now <= regEnd) {
            return "bg-blue-500/10 text-blue-400 border-blue-500/20";
        } else {
            return "bg-purple-500/10 text-purple-400 border-purple-500/20";
        }
    };

    const getStatusText = (event: Event) => {
        const now = new Date();
        const regStart = new Date(event.registrationStart);
        const regEnd = new Date(event.registrationEnd);
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        if (now >= eventStart && now <= eventEnd) {
            return "ONGOING";
        } else if (now > eventEnd) {
            return "COMPLETED";
        } else if (now >= regStart && now <= regEnd) {
            return "REGISTRATION OPEN";
        } else {
            return "UPCOMING";
        }
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case "technical":
                return "bg-gray-500/10 text-gray-300 border border-gray-500/20";
            case "non-technical":
                return "bg-amber-700/10 text-amber-600 border border-amber-700/20";
            case "flagship":
                return "bg-yellow-600/10 text-yellow-500 border border-yellow-600/20";
            default:
                return "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50";
        }
    };

    return (
        <Link to={`/app/events/${event.id}`}>
            <motion.div
                className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-2xl hover:shadow-black/40 hover:border-white/20"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header Gradient Background */}
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-zinc-800/30 via-zinc-700/20 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent" />

                    <div className="absolute top-4 right-4 flex gap-2">
                        <motion.span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getEventTypeColor(event.eventType)}`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            {event.eventType.toUpperCase()}
                        </motion.span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors duration-300 line-clamp-2">
                        {event.name}
                    </h3>

                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2 flex-1">
                        {event.description}
                    </p>

                    {/* Info Grid */}
                    <div className="space-y-2.5 mt-auto">
                        <motion.div
                            className="flex items-center gap-2 text-sm text-zinc-400"
                            whileHover={{ color: "#d4d4d8" }}
                        >
                            <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            <span>{formatDate(event.startTime)}</span>
                            <Clock className="w-4 h-4 text-zinc-400 ml-2 flex-shrink-0" />
                            <span>{formatTime(event.startTime)}</span>
                        </motion.div>

                        <motion.div
                            className="flex items-center gap-2 text-sm text-zinc-400"
                            whileHover={{ color: "#d4d4d8" }}
                        >
                            <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                        </motion.div>
                    </div>
                </div>

                {/* Hover Border Glow */}
                <motion.div
                    className="absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none"
                    initial={{ borderColor: "rgba(255, 255, 255, 0)" }}
                    whileHover={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </Link>
    );
};

export default EventsCard;
