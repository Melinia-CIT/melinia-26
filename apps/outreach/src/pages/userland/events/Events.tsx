import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Xmark, Search } from "iconoir-react"
import EventsCard from "../../../components/userland/events/EventsCard"
import api from "../../../services/api"
import { baseEventSchema, Event } from "@melinia/shared"

type Events = {
    events: Event[]
}

const Events = () => {
    const [activeFilters, setActiveFilters] = useState<string[]>(["all"])
    const [searchQuery, setSearchQuery] = useState<string>("")

    const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get<Events>("/events")
            return response.data.events.map(e => baseEventSchema.parse(e))
        },
        staleTime: 5 * 60 * 1000,
    })

    const filters = useMemo(() => {
        if (!eventsData) return [{ label: "All", value: "all" }]
        const types = Array.from(new Set(eventsData.map(e => e.event_type)))
        return [
            { label: "All", value: "all" },
            ...types.map(t => ({
                label: t.charAt(0).toUpperCase() + t.slice(1),
                value: t,
            })),
        ]
    }, [eventsData])

    // Updated toggle logic to handle multi-select and "All" behavior
    const handleFilterClick = (value: string) => {
        setActiveFilters(prev => {
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
        const matchesCategory =
            activeFilters.includes("all") || activeFilters.includes(event.event_type)
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="flex-1 w-full transition-all duration-300">
            {eventsLoading ? (
                <motion.div
                    className="flex items-start justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="space-y-8 w-full px-4 md:px-6">
                        {/* Header Skeleton */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="h-10 w-32 sm:h-12 sm:w-40 rounded-lg bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer" />
                            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto justify-center sm:justify-end px-2 sm:px-0">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="h-9 w-20 sm:h-10 sm:w-24 rounded-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer flex-shrink-0"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div
                                    key={i}
                                    className="h-full rounded-3xl bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="mx-auto space-y-10 px-2 md:px-6">
                    <motion.div
                        className="flex flex-col gap-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-zinc-200 via-white to-zinc-200 bg-clip-text text-transparent font-inst self-start">
                                Events
                            </h1>
                            {/* Search bar */}
                            <div className="relative w-full sm:w-72">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-200 text-sm rounded-full px-10 py-2 focus:outline-none focus:border-zinc-600 transition-all flex justify-center items-center"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        <Xmark width={12} height={12} />
                                    </button>
                                )}
                                <Search
                                    strokeWidth={3}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500/60"
                                />
                            </div>
                        </div>
                        {/*Filters*/}
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            {filters.map((filter, index) => {
                                const isActive = activeFilters.includes(filter.value)
                                return (
                                    <motion.button
                                        key={filter.value}
                                        type="button"
                                        onClick={() => handleFilterClick(filter.value)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border relative flex justify-center items-center gap-2 group ${
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
                                            <span className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                                                <Xmark width={12} height={12} />
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
                        {eventsData && eventsData.length > 0 ? (
                            filteredEvents && filteredEvents.length > 0 ? (
                                <motion.div
                                    key={`${activeFilters.join(",")}-${searchQuery}`}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {filteredEvents.map(event => (
                                        <EventsCard key={event.id} event={event} />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="flex flex-col items-center justify-center min-h-[40vh] text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                                        No results found
                                    </h3>
                                    <p className="text-sm text-zinc-500">
                                        Try adjusting your search or filters.
                                    </p>
                                </motion.div>
                            )
                        ) : (
                            <motion.div
                                className="flex flex-col items-center justify-center min-h-[40vh] text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                                    No events
                                </h3>
                                <p className="text-sm text-zinc-500">
                                    Check back later for upcoming events.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

export default Events
