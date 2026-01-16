import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import EventsCard from "../../../components/userland/events/EventsCard";
import api from "../../../services/api";

// Shimmer keyframes
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = shimmerStyle;
    document.head.appendChild(style);
}

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
    firstName?: string | null;
    lastName?: string | null;
    phoneNo?: string | null;
}

interface Rule {
    id: number;
    roundNo: number | null;
    ruleNumber: number;
    ruleDescription: string;
}

export interface Event {
    id: string;
    name: string;
    description: string;
    participationType: string;
    eventType: string;
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

type EventFilter = "all" | "flagship" | "technical" | "non-technical";

const Events = () => {
    const [activeFilter, setActiveFilter] = useState<EventFilter>("all");

    const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get("/events");
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const filteredEvents = eventsData?.filter((event) => {
        if (activeFilter === "all") return true;
        return event.eventType === activeFilter;
    });

    const filters: { label: string; value: EventFilter }[] = [
        { label: "All", value: "all" },
        { label: "Flagship", value: "flagship" },
        { label: "Technical", value: "technical" },
        { label: "Non-Technical", value: "non-technical" },
    ];

    return (
        <main className="flex-1 w-full transition-all duration-300">
            {eventsLoading ? (
                <motion.div
                    className="flex items-center justify-center min-h-[60vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="space-y-8 w-full max-w-[1600px] px-4 md:px-6">
                        {/* Header Skeleton */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="h-12 w-40 rounded-lg bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />
                            <div className="flex gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-10 w-24 rounded-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />
                                ))}
                            </div>
                        </div>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-80 rounded-2xl bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />
                            ))}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="max-w-[1600px] mx-auto space-y-10 px-4 md:px-6">
                    {/* Header Section */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-between gap-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-zinc-200 via-white to-zinc-200 bg-clip-text text-transparent font-inst">
                            Events
                        </h1>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {filters.map((filter, index) => (
                                <motion.button
                                    key={filter.value}
                                    onClick={() => setActiveFilter(filter.value)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border relative ${activeFilter === filter.value
                                        ? "text-white border-white/20"
                                        : "text-zinc-400 border-zinc-700/50 hover:text-white"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    {activeFilter === filter.value && (
                                        <motion.div
                                            layoutId="active-filter"
                                            className="absolute inset-0 bg-white/10 rounded-full"
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                    <span className="relative z-10">{filter.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Events Grid */}
                    <AnimatePresence mode="wait">
                        {filteredEvents && filteredEvents.length > 0 ? (
                            <motion.div
                                key={activeFilter}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {filteredEvents.map((event, index) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <EventsCard event={event as any} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="flex flex-col items-center justify-center min-h-[40vh] text-center"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="text-xl font-semibold text-zinc-300 mb-2">No events found</h3>
                                <p className="text-zinc-500">
                                    No {activeFilter !== "all" ? activeFilter : ""} events available at the moment.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </main>
    );
};

export default Events;
