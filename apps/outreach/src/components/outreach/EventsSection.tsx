import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus, Minus, MapPin, Clock, Trophy, User, Box } from "lucide-react"
import { FloatingPathsBackground } from "../ui/floating-paths"
import { HudButton } from "../ui/hud-button"
import { HudCard, HudCardHeader, HudTag } from "../ui/hud-card"
import api from "../../services/api"

// --- Types ---
interface Round {
    roundNo: number
    roundDescription: string
    roundName: string
}
interface Prize {
    position: number
    rewardValue: number
}
interface Organizer {
    userId: string
    assignedBy: string
    phoneNo: number
    firstName?: string | null
    lastName?: string | null
}
interface Event {
    id: string
    name: string
    description: string
    participationType: string
    eventType: string
    venue: string
    startTime: string
    endTime: string
    minTeamSize: number
    maxTeamSize: number
    maxAllowed: number
    rounds: Round[]
    prizes: Prize[]
    organizers: Organizer[]
}

type EventFilter = "flagship" | "technical" | "non-technical"

const EventsSection = () => {
    const navigate = useNavigate()
    const [currentEventIndex, setCurrentEventIndex] = useState(0)
    const [activeFilter, setActiveFilter] = useState<EventFilter>("flagship")
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())

    const { data: allEvents, isLoading } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get("/events")
            return response.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    const categoryPriority: Record<string, number> = {
        flagship: 1,
        technical: 2,
        "non-technical": 3,
    }

    const sortedEvents = useMemo(() => {
        if (!allEvents) return []
        return [...allEvents].sort((a, b) => {
            const priorityA = categoryPriority[a.eventType?.toLowerCase() || ""] ?? 99
            const priorityB = categoryPriority[b.eventType?.toLowerCase() || ""] ?? 99
            return priorityA - priorityB
        })
    }, [allEvents])

    // --- EFFECT 1: Sync Filter Tab when navigating events ---
    // This updates the filter button visual state when you click Next/Prev
    useEffect(() => {
        if (sortedEvents && sortedEvents[currentEventIndex]) {
            const type = sortedEvents[currentEventIndex].eventType?.toLowerCase()
            if (type === "flagship" || type === "technical" || type === "non-technical") {
                setActiveFilter(type as EventFilter)
            }
        }
    }, [currentEventIndex, sortedEvents])

    // --- EFFECT 2: Jump to category start ONLY when clicking a Tab ---
    // FIX: We removed 'currentEventIndex' from the dependency array to break the infinite loop.
    // This effect only triggers when 'activeFilter' changes (e.g., user clicks a button), 
    // NOT when 'currentEventIndex' changes (which triggers Effect 1).
    useEffect(() => {
        const currentEventType = sortedEvents?.[currentEventIndex]?.eventType?.toLowerCase()

        // If the user requested a different filter than the current event's type, jump to start
        if (currentEventType !== activeFilter) {
            const firstIndex = sortedEvents?.findIndex(
                event => event.eventType?.toLowerCase() === activeFilter
            )
            if (firstIndex !== undefined && firstIndex !== -1) {
                setCurrentEventIndex(firstIndex)
            }
        }
    }, [activeFilter, sortedEvents]) // Removed 'currentEventIndex' dependency

    const currentEvent = sortedEvents?.[currentEventIndex]

    const handleNextEvent = () =>
        setCurrentEventIndex(prev => (prev + 1) % (sortedEvents?.length || 1))
    const handlePrevEvent = () =>
        setCurrentEventIndex(
            prev => (prev - 1 + (sortedEvents?.length || 1)) % (sortedEvents?.length || 1)
        )

    const toggleRoundExpansion = (roundNo: number) => {
        setExpandedRounds(prev => {
            const next = new Set(prev)
            next.has(roundNo) ? next.delete(roundNo) : next.add(roundNo)
            return next
        })
    }

    const handleRegister = () => {
        navigate(`/app/events/${currentEvent?.id}`)
    }

    const getEventTypeColor = (eventType: string) => {
        const t = eventType?.toLowerCase()
        if (t === "flagship") return "#FF0066"
        if (t === "technical") return "#9D00FF"
        if (t === "non-technical") return "#FF69B4"
        return "#FFFFFF"
    }

    const getEventVariant = (eventType: string) => {
        const t = eventType?.toLowerCase()
        if (t === "flagship") return "red"
        if (t === "technical") return "purple"
        if (t === "non-technical") return "pink"
        return "secondary"
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString)
            .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
            .replace(",", " |")
    }

    const groupedEvents = useMemo(() => {
        const groups = {
            flagship: [] as Event[],
            technical: [] as Event[],
            "non-technical": [] as Event[],
        }
        sortedEvents?.forEach(event => {
            const type = event.eventType?.toLowerCase()
            if (type === "flagship") groups.flagship.push(event)
            else if (type === "technical") groups.technical.push(event)
            else if (type === "non-technical") groups["non-technical"].push(event)
        })
        return groups
    }, [sortedEvents])

    const categoryOrder = ["flagship", "technical", "non-technical"] as const

    if (isLoading || !sortedEvents)
        return (
            <section className="relative min-h-screen w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                <div className="text-[#FF0066] font-heading text-xl md:text-2xl animate-pulse tracking-widest px-4 text-center">
                    LOADING MULTIVERSE...
                </div>
            </section>
        )

    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white font-body selection:bg-[#FF0066] selection:text-white">
            <FloatingPathsBackground position={2} className="absolute inset-0 opacity-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,255,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,0,102,0.15),transparent_50%)]" />
                <div
                    className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "4px 4px",
                    }}
                />
            </FloatingPathsBackground>

            <div className="relative z-10 max-w-8xl mx-auto px-4 md:px-8 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12 relative"
                >
                    <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Events
                    </h1>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 rotate-[-2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>

                <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-16">
                    {(["flagship", "technical", "non-technical"] as EventFilter[]).map(filter => (
                        <motion.button
                            key={filter}
                            onClick={() => {
                                if (activeFilter === filter) {
                                    const firstIndex = sortedEvents?.findIndex(
                                        event => event.eventType?.toLowerCase() === filter
                                    )
                                    if (firstIndex !== undefined && firstIndex !== -1) {
                                        setCurrentEventIndex(firstIndex)
                                    }
                                } else {
                                    setActiveFilter(filter)
                                }
                            }}
                            style={{
                                opacity: activeFilter === filter ? 1 : 0.5,
                                filter:
                                    activeFilter === filter ? "brightness(1.1)" : "brightness(0.7)",
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            <HudButton
                                variant={getEventVariant(filter)}
                                style="style2"
                                size="small"
                            >
                                {filter}
                            </HudButton>
                        </motion.button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-stretch">
                    <div className="lg:col-span-1 flex flex-col h-full order-2 lg:order-1">
                        <div className="w-full mb-3 md:mb-4">
                            <HudCardHeader
                                title="Rounds"
                                variant="purple"
                                icon={<Box size={18} className="text-purple-500" />}
                            />
                        </div>

                        <div className="flex flex-col gap-3 md:gap-4 w-full">
                            {currentEvent?.rounds?.map(round => (
                                <motion.div
                                    key={round.roundNo}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="relative group flex-1"
                                >
                                    <HudCard
                                        variant="secondary"
                                        widthClass="w-full"
                                        hoverEffect="glow"
                                        className="p-0! border-x-0 border-l-0 border-r-0 bg-white/5"
                                    >
                                        <div className="relative w-full bg-transparent overflow-hidden">
                                            <button
                                                onClick={() => toggleRoundExpansion(round.roundNo)}
                                                className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-[#9D00FF]/20 flex items-center justify-center flex-shrink-0">
                                                        <span className="font-heading text-lg md:text-xl font-bold text-[#9D00FF]">
                                                            0{round.roundNo}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-1 rounded bg-white/10">
                                                    {expandedRounds.has(round.roundNo) ? (
                                                        <Minus size={14} className="text-[#FF0066]" />
                                                    ) : (
                                                        <Plus size={14} className="text-[#FF0066]" />
                                                    )}
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {expandedRounds.has(round.roundNo) && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: "auto" }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden bg-white/5 border-t border-white/10"
                                                    >
                                                        <p className="p-3 md:p-4 text-xs md:text-sm text-gray-300 font-mono leading-relaxed">
                                                            {round.roundDescription}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </HudCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1 lg:col-start-2 lg:col-end-3 flex flex-col h-full items-center order-1 lg:order-2 relative z-20">
                        {/* AnimatePresence Warning Fix: Added initial={false} to handle React 18 Strict Mode double mounting issues */}
                        <AnimatePresence mode="wait" initial={false}>
                            {currentEvent && (
                                <motion.div
                                    key={currentEvent.id}
                                    initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
                                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                    exit={{ opacity: 0, scale: 1.05, rotateX: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    <HudCard
                                        variant={getEventVariant(currentEvent.eventType)}
                                        widthClass="w-full max-w-xl"
                                        hoverEffect="glitch"
                                        glitchOnHover
                                    >
                                        <div className="relative aspect-3/2 md:aspect-16/6 w-full overflow-hidden bg-gray-900">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-50" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                                            <div
                                                className="absolute top-2 md:top-4 left-2 md:left-4 z-20 px-2 py-1 md:px-3 md:py-1 rounded text-white font-heading font-bold text-[10px] md:text-xs uppercase tracking-wider skew-x-[-10deg]"
                                                style={{
                                                    backgroundColor: getEventTypeColor(
                                                        currentEvent.eventType
                                                    ),
                                                }}
                                            >
                                                {currentEvent.eventType}
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                                <span className="font-heading text-3xl md:text-6xl text-white/5 font-black uppercase select-none text-center px-4">
                                                    {currentEvent.name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-4 md:p-8 relative">
                                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-pink-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                                            <h2 className="font-heading text-2xl md:text-4xl font-black text-white mb-3 md:mb-4 uppercase leading-none">
                                                {currentEvent.name}
                                            </h2>
                                            <p
                                                className="text-gray-400 font-body leading-relaxed mb-4 md:mb-6 border-l-4 pl-3 md:pl-4 text-sm md:text-base"
                                                style={{
                                                    borderColor: getEventTypeColor(
                                                        currentEvent.eventType
                                                    ),
                                                }}
                                            >
                                                {currentEvent.description}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                                                <div className="flex items-center gap-2 md:gap-3 text-white">
                                                    <div className="p-1.5 md:p-2 rounded-full bg-purple-500/20 text-purple-400">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] md:text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                                            Venue
                                                        </span>
                                                        <span className="text-xs md:text-sm font-medium truncate">
                                                            {currentEvent.venue}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-3 text-white">
                                                    <div className="p-1.5 md:p-2 rounded-full bg-red-500/20 text-red-400">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] md:text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                                            Start
                                                        </span>
                                                        <span className="text-xs md:text-sm font-medium">
                                                            {formatDateTime(currentEvent.startTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-3 text-white">
                                                    <div className="p-1.5 md:p-2 rounded-full bg-purple-500/20 text-purple-400">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] md:text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                                            Team Size
                                                        </span>
                                                        <span className="text-xs md:text-sm font-medium">
                                                            {currentEvent.minTeamSize} -{" "}
                                                            {currentEvent.maxTeamSize}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-3 text-white">
                                                    <div className="p-1.5 md:p-2 rounded-full bg-red-500/20 text-red-400">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] md:text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                                            Type
                                                        </span>
                                                        <span className="text-xs md:text-sm font-medium capitalize">
                                                            {currentEvent.participationType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full">
                                                <HudButton
                                                    variant={getEventVariant(
                                                        currentEvent.eventType
                                                    )}
                                                    style="style1"
                                                    size="default"
                                                    onClick={handleRegister}
                                                >
                                                    Register Now ▸
                                                </HudButton>
                                            </div>
                                        </div>
                                    </HudCard>

                                    <div className="w-full max-w-xl flex items-center justify-center gap-3 md:gap-8 mt-4 md:mt-8 px-2">
                                        <HudButton
                                            variant={getEventVariant(currentEvent.eventType)}
                                            style="style2"
                                            size="small"
                                            onClick={handlePrevEvent}
                                            enableAnimations={(sortedEvents?.length || 0) > 1}
                                        >
                                            ◀
                                        </HudButton>

                                        <div className="font-mono text-white/50 text-xs md:text-sm px-2 md:px-0">
                                            {String(currentEventIndex + 1).padStart(2, "0")} /{" "}
                                            {String(sortedEvents?.length || 0).padStart(2, "0")}
                                        </div>

                                        <HudButton
                                            variant={getEventVariant(currentEvent.eventType)}
                                            style="style2"
                                            size="small"
                                            onClick={handleNextEvent}
                                            enableAnimations={(sortedEvents?.length || 0) > 1}
                                        >
                                            ▶
                                        </HudButton>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6 order-3 lg:order-3 h-full">
                        <div className="flex flex-col gap-2 md:gap-3 w-full">
                            <div className="w-full">
                                <HudCardHeader
                                    title="Prize Pool"
                                    variant="red"
                                    icon={<Trophy size={18} className="text-yellow-400" />}
                                />
                            </div>
                            <div className="space-y-2 md:space-y-3 w-full">
                                {currentEvent?.prizes?.map(prize => (
                                    <motion.div
                                        key={prize.position}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                    >
                                        <HudCard
                                            variant="red"
                                            widthClass="w-full"
                                            hoverEffect="glow"
                                        >
                                            <div className="flex items-center justify-between p-3 md:p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">
                                                        Position
                                                    </span>
                                                    <span className="font-heading text-lg md:text-xl text-white">
                                                        {prize.position}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-lg md:text-xl text-[#FF0066] font-bold drop-shadow-[0_0_8px_rgba(255,0,102,0.5)]">
                                                    ₹{prize.rewardValue.toLocaleString()}
                                                </span>
                                            </div>
                                        </HudCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 md:gap-3 w-full">
                            <div className="w-full">
                                <HudCardHeader
                                    title="Organizers"
                                    variant="pink"
                                    icon={<User size={18} />}
                                />
                            </div>
                            <div className="space-y-2 md:space-y-3 w-full">
                                {currentEvent?.organizers?.map((org, i) => (
                                    <motion.div
                                        key={org.firstName}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                    >
                                        <HudCard
                                            variant="pink"
                                            widthClass="w-full"
                                            hoverEffect="glow"
                                        >
                                            <div className="flex flex-wrap gap-2 p-3 md:p-4 content-start items-center">
                                                <HudTag key={i} variant="pink" size="small">
                                                    {org.firstName} {org.lastName}
                                                </HudTag>
                                                <span className="font-heading text-base md:text-xl text-white ml-auto">
                                                    {org.phoneNo}
                                                </span>
                                            </div>
                                        </HudCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2 md:gap-y-3 mt-8 md:mt-12 min-h-[60px] px-2 md:px-4">
                    {categoryOrder.map((category, catIdx) => {
                        const categoryEvents = groupedEvents[category]
                        if (categoryEvents.length === 0) return null

                        return (
                            <div key={category} className="flex items-center gap-2 md:gap-3">
                                <span
                                    className="font-mono text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap"
                                    style={{ color: getEventTypeColor(category) }}
                                >
                                    {category}
                                </span>

                                <div className="flex items-center gap-1 md:gap-2">
                                    {categoryEvents.map(event => {
                                        const globalIndex = sortedEvents.indexOf(event)
                                        const isActive = currentEventIndex === globalIndex

                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() => setCurrentEventIndex(globalIndex)}
                                                className="relative transition-all duration-300"
                                                style={{
                                                    width: isActive ? "28px" : "8px",
                                                    height: "8px",
                                                }}
                                                aria-label={`View ${event.name}`}
                                            >
                                                <span
                                                    className="absolute inset-0 rounded-full transition-all duration-300"
                                                    style={{
                                                        backgroundColor: getEventTypeColor(
                                                            event.eventType
                                                        ),
                                                        width: "100%",
                                                        height: "100%",
                                                        opacity: isActive ? 1 : 0.4,
                                                        boxShadow: isActive
                                                            ? `0 0 8px ${getEventTypeColor(event.eventType)}`
                                                            : "none",
                                                        transform: isActive
                                                            ? "scale(1.1)"
                                                            : "scale(1)",
                                                    }}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                                {catIdx < categoryOrder.length - 1 && (
                                    <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2 hidden sm:block" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default EventsSection
