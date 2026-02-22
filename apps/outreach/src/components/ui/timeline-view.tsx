import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import Timeline, { TimelineEvent } from "./timeline"
import TimelineShimmer from "./timeline-shimmer"
import api from "../../services/api"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import { useNavigate } from "react-router-dom"
import { UserRegisteredEvents, userRegisteredEventsSchema } from "@melinia/shared"

type UserRegEvents = {
    events: UserRegisteredEvents
}

type UserRegisteredEvent = UserRegisteredEvents[number]
type RegisteredEventWithRounds = UserRegisteredEvent & {
    rounds: {
        round_name: string
        start_time: Date
        end_time: Date
    }[]
}

const hasRounds = (event: UserRegisteredEvent): event is RegisteredEventWithRounds =>
    "rounds" in event

export type { TimelineEvent }

function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    )
}

function formatDateHeader(date: Date): string {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (isSameDay(date, today)) return "Today"
    if (isSameDay(date, tomorrow)) return "Tomorrow"
    if (isSameDay(date, yesterday)) return "Yesterday"

    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    })
}

interface TimelineViewProps {
    onEventClick?: (event: TimelineEvent) => void
    className?: string
}

const TimelineView = ({ onEventClick, className }: TimelineViewProps) => {
    const navigate = useNavigate()
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        return date
    })

    const { data: registeredEvents, isLoading } = useQuery<UserRegisteredEvents>({
        queryKey: ["user-registered-events"],
        queryFn: async () => {
            const response = await api.get<UserRegEvents>("/events/registered")
            return userRegisteredEventsSchema.parse(response.data.events)
        },
        staleTime: 5 * 60 * 1000,
    })

    const allTimelineEvents: TimelineEvent[] = useMemo(() => {
        if (!registeredEvents) return []
        return registeredEvents.flatMap(event =>
            hasRounds(event)
                ? event.rounds.map((round, index) => ({
                      id: `${event.id}-${index}`,
                      eventId: event.id,
                      name: `${event.name} - ${round.round_name}`,
                      startTime: round.start_time,
                      endTime: round.end_time,
                      eventType: event.event_type,
                      venue: event.venue,
                  }))
                : []
        )
    }, [registeredEvents])

    const todaysEvents = useMemo(() => {
        return allTimelineEvents.filter(event => isSameDay(event.startTime, selectedDate))
    }, [allTimelineEvents, selectedDate])

    const hasEventsToday = todaysEvents.length > 0

    const handleEventClick = (event: TimelineEvent) => {
        if (onEventClick) {
            onEventClick(event)
        } else {
            const eventId = event.eventId || event.id
            navigate(`/app/events/${eventId}`)
        }
    }

    const goToPreviousDay = () => {
        const prev = new Date(selectedDate)
        prev.setDate(prev.getDate() - 1)
        setSelectedDate(prev)
    }

    const goToNextDay = () => {
        const next = new Date(selectedDate)
        next.setDate(next.getDate() + 1)
        setSelectedDate(next)
    }

    const goToToday = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setSelectedDate(today)
    }

    const isToday = isSameDay(selectedDate, new Date())

    useEffect(() => {
        if (!isLoading && allTimelineEvents.length > 0) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const hasTodayEvents = allTimelineEvents.some(e => isSameDay(e.startTime, today))
            if (hasTodayEvents) {
                setSelectedDate(today)
            } else {
                const nextEvent = allTimelineEvents
                    .filter(e => e.startTime >= today)
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0]
                if (nextEvent) {
                    const eventDate = new Date(nextEvent.startTime)
                    eventDate.setHours(0, 0, 0, 0)
                    setSelectedDate(eventDate)
                }
            }
        }
    }, [isLoading, allTimelineEvents])

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between font-geist">
                <h2 className="text-2xl font-bold font-inst text-white tracking-tight">
                    Your Timeline
                </h2>
                <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1 border border-white/5">
                    <button
                        type="button"
                        onClick={goToPreviousDay}
                        className="p-2 hover:bg-white/5 rounded-md transition-colors text-zinc-400 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={goToToday}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            isToday
                                ? "bg-indigo-500/20 text-indigo-400"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={goToNextDay}
                        className="p-2 hover:bg-white/5 rounded-md transition-colors text-zinc-400 hover:text-white"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">{formatDateHeader(selectedDate)}</span>
            </div>

            {isLoading ? (
                <TimelineShimmer />
            ) : hasEventsToday ? (
                <Timeline
                    events={todaysEvents}
                    date={selectedDate}
                    showCurrentTime={isToday}
                    onEventClick={handleEventClick}
                />
            ) : (
                <div className="w-full bg-zinc-900/30 rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center text-center h-xl">
                    <Clock className="w-12 h-12 text-zinc-600 mb-4" />
                    <p className="text-zinc-500 text-sm font-medium mt-1">
                        {isToday
                            ? "No events for today. Check other days or register for events."
                            : `No events on ${formatDateHeader(selectedDate)}.`}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/app/events")}
                        className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm hover:bg-indigo-500/20 transition-colors"
                    >
                        Browse Events
                    </button>
                </div>
            )}
        </div>
    )
}

export default TimelineView
