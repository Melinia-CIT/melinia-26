import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import EventsCard from "../../../components/userland/events/EventsCard"
import api from "../../../services/api"

const shimmerStyle = `
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    .animate-shimmer { animation: shimmer 2s infinite; }
`

if (typeof document !== "undefined") {
    const style = document.createElement("style")
    style.innerHTML = shimmerStyle
    document.head.appendChild(style)
}

interface Round { roundNo: number; roundDescription: string }
interface Prize { position: number; rewardValue: number }
interface Organizer { userId: string; assignedBy: string; firstName?: string | null; lastName?: string | null; phoneNo?: string | null }
interface Rule { id: number; roundNo: number | null; ruleNumber: number; ruleDescription: string }

export interface Event {
    id: string; name: string; description: string; participationType: string; eventType: string;
    maxAllowed: number; minTeamSize: number; maxTeamSize: number; venue: string;
    startTime: string; endTime: string; registrationStart: string; registrationEnd: string;
    createdBy: string; createdAt: string; updatedAt: string;
    rounds: Round[]; prizes: Prize[]; organizers: Organizer[]; rules: Rule[];
}

const Events = () => {
    // 1. State changed to array to support multiple categories
    const [activeFilters, setActiveFilters] = useState<string[]>(["all"])
    const [searchQuery, setSearchQuery] = useState<string>("")

    const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get("/events")
            return response.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    const filters = useMemo(() => {
        if (!eventsData) return [{ label: "All", value: "all" }]
        const types = Array.from(new Set(eventsData.map(e => e.eventType)))
        return [
            { label: "All", value: "all" },
            ...types.map(t => ({
                label: t.charAt(0).toUpperCase() + t.slice(1),
                value: t
            }))
        ]
    }, [eventsData])

    // 2. Updated toggle logic to handle multi-select and "All" behavior
    const handleFilterClick = (value: string) => {
        setActiveFilters((prev) => {
            if (value === "all") return ["all"]
            const newFilters = prev.filter(f => f !== "all")
            if (newFilters.includes(value)) {
                const updated = newFilters.filter(f => f !== value)
                return updated.length === 0 ? ["all"] : updated
            } else {
                return [...newFilters, value]
            }
        })
    }

    const filteredEvents = eventsData?.filter(event => {
        const matchesCategory = activeFilters.includes("all") || activeFilters.includes(event.eventType)
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="flex-1 w-full transition-all duration-300">
            {eventsLoading ? (
                <motion.div className="flex items-start justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-8 w-full px-4 md:px-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="h-10 w-32 sm:h-12 sm:w-40 rounded-lg bg-zinc-800 animate-shimmer" />
                            <div className="h-10 w-full sm:w-64 rounded-full bg-zinc-800 animate-shimmer" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-64 rounded-2xl bg-zinc-800 animate-shimmer" />)}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="mx-auto space-y-10 px-4 md:px-6">
                    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-zinc-200 via-white to-zinc-200 bg-clip-text text-transparent font-inst">
                                Events
                            </h1>
                            
                            <div className="relative w-full sm:w-72">
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-200 text-sm rounded-full px-5 py-2 focus:outline-none focus:border-zinc-600 transition-all"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-lg"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            {filters.map((filter, index) => {
                                const isActive = activeFilters.includes(filter.value)
                                return (
                                    <motion.button
                                        key={filter.value}
                                        onClick={() => handleFilterClick(filter.value)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border relative flex items-center gap-2 group ${
                                            isActive 
                                                ? "text-white border-white/40 bg-white/10" 
                                                : "text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <span className="relative z-10">{filter.label}</span>
                                        
                                        {/* 3. CLOSE BUTTON DISPLAYED WHEN SELECTED */}
                                        {isActive && filter.value !== "all" && (
                                            <span className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 text-[14px] leading-none transition-colors">
                                                ×
                                            </span>
                                        )}
                                        
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-filter-bg" 
                                                className="absolute inset-0 bg-white/[0.03] rounded-full -z-10" 
                                                transition={{ duration: 0.3 }} 
                                            />
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {filteredEvents && filteredEvents.length > 0 ? (
                            <motion.div key={`${activeFilters.join(",")}-${searchQuery}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {filteredEvents.map((event, index) => (
                                    <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                        <EventsCard event={event as any} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div className="flex flex-col items-center justify-center min-h-[40vh] text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h3 className="text-lg font-semibold text-zinc-300 mb-2">No results found</h3>
                                <p className="text-sm text-zinc-500">Try adjusting your search or filters.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

export default Events