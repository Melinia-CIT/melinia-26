import { useState, useEffect, useMemo, useRef } from "react"
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useMotionTemplate,
    useAnimationFrame,
} from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus, Minus, MapPin, Clock, Trophy, User, Box, Award } from "lucide-react"
import { HudButton } from "../ui/hud-button"
import { HudCard, HudCardHeader, HudTag } from "../ui/hud-card"
import api from "../../services/api"

// --- Types ---
interface Round {
    roundNo: number
    roundName: string
    roundDescription: string
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

const Events = () => {
    const navigate = useNavigate()
    const [currentEventIndex, setCurrentEventIndex] = useState(0)
    const [activeFilter, setActiveFilter] = useState<EventFilter>("flagship")
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())
    const descriptionRef = useRef<HTMLDivElement>(null)
    const touchStartRef = useRef<number | null>(null)
    const isSwipingRef = useRef(false)

    // Grid Background Logic
    const containerRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const gridOffsetX = useMotionValue(0)
    const gridOffsetY = useMotionValue(0)

    const speed = 0.5

    useAnimationFrame(() => {
        gridOffsetX.set((gridOffsetX.get() + speed) % 40)
        gridOffsetY.set((gridOffsetY.get() + speed) % 40)
    })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - left)
        mouseY.set(e.clientY - top)
    }

    const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, white 0%, transparent 80%)`

    const { data: allEvents, isLoading } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get("/events")
            return response.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    //Sort events strictly by category order (Flagship -> Technical -> Non-Technical)
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

    useEffect(() => {
        if (sortedEvents && sortedEvents[currentEventIndex]) {
            const type = sortedEvents[currentEventIndex].eventType?.toLowerCase()
            if (type === "flagship" || type === "technical" || type === "non-technical") {
                setActiveFilter(type as EventFilter)
            }
        }
    }, [currentEventIndex, sortedEvents])

    useEffect(() => {
        const currentType = sortedEvents?.[currentEventIndex]?.eventType?.toLowerCase() as
            | EventFilter
            | undefined
        if (currentType && currentType !== activeFilter) {
            setActiveFilter(currentType)
        }
    }, [currentEventIndex, sortedEvents, activeFilter])

    const currentEvent = sortedEvents?.[currentEventIndex]

    const handleNextEvent = () =>
        setCurrentEventIndex(prev => (prev + 1) % (sortedEvents?.length || 1))
    const handlePrevEvent = () =>
        setCurrentEventIndex(
            prev => (prev - 1 + (sortedEvents?.length || 1)) % (sortedEvents?.length || 1)
        )

    // Touch handlers for swipe navigation
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isSwipingRef.current) return
        touchStartRef.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null || isSwipingRef.current) return
        const touchEnd = e.touches[0].clientX
        const diff = touchStartRef.current - touchEnd
        const threshold = 50

        if (Math.abs(diff) > threshold) {
            isSwipingRef.current = true
            if (diff > 0) {
                handleNextEvent()
            } else {
                handlePrevEvent()
            }
            touchStartRef.current = null
            setTimeout(() => {
                isSwipingRef.current = false
            }, 500)
        }
    }

    const toggleRoundExpansion = (roundNo: number) => {
        setExpandedRounds(prev => {
            if (prev.has(roundNo)) {
                return new Set()
            }
            return new Set([roundNo])
        })
    }

    const handleRegister = () => {
        navigate(`/app/events/${currentEvent?.id}`)
    }

    const getEventTypeColor = (eventType: string) => {
        const t = eventType?.toLowerCase()
        if (t === "flagship") return "#FF0066" // Red
        if (t === "technical") return "#9D00FF" // Purple
        if (t === "non-technical") return "#FF69B4" // Pink
        return "#FFFFFF"
    }

    const getEventVariant = (eventType: string) => {
        const t = eventType?.toLowerCase()
        if (t === "flagship") return "red"
        if (t === "technical") return "purple"
        if (t === "non-technical") return "pink"
        return "secondary"
    }

    const getPrizeColor = (position: number) => {
        if (position === 1) return "#FFD700"
        if (position === 2) return "#C0C0C0"
        if (position === 3) return "#CD7F32"
        return "#FF0066"
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
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white font-body selection:bg-[#FF0066] selection:text-white"
        >
            {/* Animated Grid Background */}
            <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none">
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
            </div>
            <motion.div
                className="absolute inset-0 z-0 opacity-60 pointer-events-none"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            >
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 max-w-8xl mx-auto px-4 md:px-8 py-12 md:py-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12 relative"
                >
                    <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Events
                    </h1>
                    <div className="h-2 w-24 bg-linear-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 rotate-[-2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>

                {/* Filter Tabs */}
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

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-stretch">
                    {/* COLUMN 1: ROUNDS (Left Sidebar) */}
                    <div className="lg:col-span-1 flex flex-col h-full order-2 lg:order-1">
                        <div className="w-auto mb-3 md:mb-4">
                            <HudCardHeader
                                title="Rounds"
                                variant="purple"
                                icon={<Box size={18} className="text-purple-500" />}
                            />
                        </div>

                        <div className="flex flex-col gap-3 md:gap-4 w-full">
                            {[...(currentEvent?.rounds || [])]
                                .sort((a, b) => a.roundNo - b.roundNo)
                                .map(round => (
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
                                            className="!p-0 border-x-0 border-l-0 border-r-0 bg-white/5"
                                        >
                                            <div className="relative w-full bg-transparent overflow-hidden">
                                                <button
                                                    onClick={() =>
                                                        toggleRoundExpansion(round.roundNo)
                                                    }
                                                    className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-[#9D00FF]/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="font-heading text-lg md:text-xl font-bold text-[#9D00FF]">
                                                                0{round.roundNo}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-heading text-sm md:text-base font-bold text-white">
                                                                {round.roundName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-1 rounded bg-white/10">
                                                        {expandedRounds.has(round.roundNo) ? (
                                                            <Minus
                                                                size={14}
                                                                className="text-[#FF0066]"
                                                            />
                                                        ) : (
                                                            <Plus
                                                                size={14}
                                                                className="text-[#FF0066]"
                                                            />
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

                    {/* COLUMN 2: MAIN EVENT (Center) */}
                    <div className="lg:col-span-1 lg:col-start-2 lg:col-end-3 flex flex-col h-full items-center order-1 lg:order-2 relative z-20">
                        <AnimatePresence mode="wait">
                            {currentEvent && (
                                <motion.div
                                    key={currentEvent.id}
                                    initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
                                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                    exit={{ opacity: 0, scale: 1.05, rotateX: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full flex flex-col items-center touch-pan-y"
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                >
                                    <HudCard
                                        variant={getEventVariant(currentEvent.eventType)}
                                        widthClass="w-full max-w-xl"
                                        hoverEffect="glitch"
                                        glitchOnHover
                                    >
                                        {/* Image Section */}
                                        <div className="relative aspect-[4/1] md:aspect-[16/6] w-full overflow-hidden bg-gray-900">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-50" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                                            <div
                                                className="absolute top-2 md:top-4 left-2 md:left-4 z-20 px-2 py-1 md:px-3 md:py-1 rounded text-white font-heading font-bold text-[10px] md:text-xs uppercase tracking-wider skew-x-[-10deg]"
                                                style={{
                                                    backgroundColor: getEventTypeColor(
                                                        currentEvent?.eventType || ""
                                                    ),
                                                }}
                                            >
                                                {currentEvent?.eventType}
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                                <span className="font-heading text-3xl md:text-6xl text-white/5 font-black uppercase select-none text-center px-4">
                                                    {currentEvent?.name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 p-4 md:p-8 relative flex flex-col overflow-hidden">
                                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-pink-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                                            <h2 className="font-heading text-2xl md:text-4xl font-black text-white mb-3 md:mb-4 uppercase leading-none">
                                                {currentEvent.name}
                                            </h2>

                                            <div
                                                className="text-gray-400 font-body leading-relaxed mb-3 md:mb-4 border-l-4 pl-3 md:pl-4 text-sm md:text-base flex-shrink-0 h-24 overflow-y-auto custom-scrollbar"
                                                style={{
                                                    borderColor: getEventTypeColor(
                                                        currentEvent?.eventType || ""
                                                    ),
                                                }}
                                            >
                                                <div ref={descriptionRef}>
                                                    {currentEvent?.description}
                                                </div>
                                            </div>

                                            {/* Meta Info Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 flex-shrink-0">
                                                {/* Venue */}
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
                                                {/* Time */}
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
                                                {/* Team Size */}
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
                                                {/* Type */}
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

                                            {/* Register Button */}
                                            <div className="w-full flex-shrink-0">
                                                <HudButton
                                                    variant={getEventVariant(
                                                        currentEvent?.eventType || ""
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Navigation Controls */}
                        <div className="w-full max-w-xl flex items-center justify-center gap-2 sm:gap-3 md:gap-8 mt-3 sm:mt-4 md:mt-8 px-2 sm:px-4">
                            <HudButton
                                variant={getEventVariant(currentEvent?.eventType || "")}
                                style="style2"
                                size="small"
                                onClick={handlePrevEvent}
                                enableAnimations={(sortedEvents?.length || 0) > 1}
                            >
                                ◀
                            </HudButton>

                            <div className="font-mono text-white/50 text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-0">
                                {String(currentEventIndex + 1).padStart(2, "0")} /{" "}
                                {String(sortedEvents?.length || 0).padStart(2, "0")}
                            </div>

                            <HudButton
                                variant={getEventVariant(currentEvent?.eventType || "")}
                                style="style2"
                                size="small"
                                onClick={handleNextEvent}
                                enableAnimations={(sortedEvents?.length || 0) > 1}
                            >
                                ▶
                            </HudButton>
                        </div>
                    </div>

                    {/* COLUMN 3: RIGHT SIDE (Prizes + Organizers) */}
                    <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6 order-3 lg:order-3 h-full">
                        {/* Prizes Section */}
                        <div className="flex flex-col gap-2 md:gap-3 w-full">
                            <div className="w-auto">
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
                                            showDots={false}
                                        >
                                            <div className="flex items-center justify-between p-3 md:p-4">
                                                <div className="flex items-center gap-2">
                                                    <Award
                                                        size={20}
                                                        style={{
                                                            color: getPrizeColor(prize.position),
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-heading text-sm md:text-base text-white">
                                                            {prize.position === 1
                                                                ? "1st"
                                                                : prize.position === 2
                                                                  ? "2nd"
                                                                  : prize.position === 3
                                                                    ? "3rd"
                                                                    : `${prize.position}th`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className="font-mono text-lg md:text-xl font-bold drop-shadow-[0_0_8px_rgba(255,0,102,0.5)]"
                                                    style={{ color: getPrizeColor(prize.position) }}
                                                >
                                                    ₹{prize.rewardValue.toLocaleString()}
                                                </span>
                                            </div>
                                        </HudCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Organizers Section */}
                        <div className="flex flex-col gap-2 md:gap-3 w-full">
                            <div className="w-auto">
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
                                            showDots={false}
                                        >
                                            <div className="flex flex-wrap gap-2 p-3 md:p-4 content-start items-center">
                                                <HudTag key={i} variant="pink" size="medium">
                                                    {org.firstName} {org.lastName}
                                                </HudTag>
                                                <a
                                                    href={`tel:+91${org.phoneNo}`}
                                                    className="font-heading text-sm sm:text-base md:text-lg text-white ml-auto hover:text-purple-400 transition-colors"
                                                >
                                                    +91 {org.phoneNo}
                                                </a>
                                            </div>
                                        </HudCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Pagination Dots - HUD Bar */}
                <div className="hidden md:flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2 md:gap-y-3 mt-8 md:mt-12 min-h-[60px] px-2 md:px-4">
                    {categoryOrder.map((category, catIdx) => {
                        const categoryEvents = groupedEvents[category]
                        if (categoryEvents.length === 0) return null

                        return (
                            <div key={category} className="flex items-center gap-2 md:gap-3">
                                {/* Category Label */}
                                <span
                                    className="font-mono text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap"
                                    style={{ color: getEventTypeColor(category) }}
                                >
                                    {category}
                                </span>

                                {/* Event Dots */}
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
                                                            event.eventType || ""
                                                        ),
                                                        width: "100%",
                                                        height: "100%",
                                                        opacity: isActive ? 1 : 0.4,
                                                        boxShadow: isActive
                                                            ? `0 0 8px ${getEventTypeColor(event.eventType || "")}`
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
                                {/* Divider between categories (except last) */}
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

const GridPattern = ({ offsetX, offsetY }: { offsetX: any; offsetY: any }) => {
    return (
        <svg className="w-full h-full">
            <defs>
                <motion.pattern
                    id="grid-pattern"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9D00FF" strokeWidth="2" />
                    <path d="M 0 0 L 40 0" fill="none" stroke="#FF0066" strokeWidth="2" />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
    )
}

export default Events
