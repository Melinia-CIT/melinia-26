import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

export type TimelineEventType = "technical" | "non-technical" | "flagship"

export interface TimelineEvent {
    id: string
    name: string
    startTime: Date
    endTime?: Date
    eventType: TimelineEventType
    venue?: string
    eventId?: string
}

interface TimelineProps {
    events: TimelineEvent[]
    date: Date
    showCurrentTime?: boolean
    onEventClick?: (event: TimelineEvent) => void
    className?: string
}

const EVENT_TYPE_COLORS: Record<TimelineEventType, { bg: string; border: string; text: string }> = {
    technical: {
        bg: "bg-rose-500/20",
        border: "border-rose-500",
        text: "text-rose-400",
    },
    "non-technical": {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500",
        text: "text-emerald-400",
    },
    flagship: {
        bg: "bg-blue-500/20",
        border: "border-blue-500",
        text: "text-blue-400",
    },
}

const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 19
const ROW_HEIGHT = 60
const EVENT_HEIGHT = 50
const MAX_VISIBLE_EVENTS = 5
const VERTICAL_PADDING = 12 // Top and bottom padding in pixels

function getEventEndTime(event: TimelineEvent): Date {
    if (event.endTime) return event.endTime
    const start = event.startTime
    return new Date(start.getTime() + 2 * 60 * 60 * 1000)
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}

function formatHour(hour: number): string {
    if (hour === 24) return "12 AM"
    const suffix = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour} ${suffix}`
}

function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    )
}

const Timeline = ({
    events,
    date,
    showCurrentTime = true,
    onEventClick,
    className,
}: TimelineProps) => {
    const filteredEvents = events.filter(event => isSameDay(new Date(event.startTime), date))

    // Calculate dynamic start and end hours based on events (including minutes for accurate range)
    let startHour = DEFAULT_START_HOUR
    let endHour = DEFAULT_END_HOUR

    if (filteredEvents.length > 0) {
        const eventTimes = filteredEvents.flatMap(event => {
            const startDate = event.startTime
            const endDate = getEventEndTime(event)
            return [
                startDate.getHours() + startDate.getMinutes() / 60,
                endDate.getHours() + endDate.getMinutes() / 60,
            ]
        })

        const minHour = Math.min(...eventTimes)
        const maxHour = Math.max(...eventTimes)

        // Floor start hour, ceil end hour to ensure full coverage
        startHour = Math.max(0, Math.floor(minHour))
        endHour = Math.min(24, Math.ceil(maxHour))

        // Ensure at least a 3-hour range
        if (endHour - startHour < 3) {
            endHour = Math.min(24, startHour + 3)
        }
    }

    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

    // Time percentage calculation using dynamic start/end hours
    const timeToPercentage = (date: Date): number => {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const totalMinutes = hours * 60 + minutes
        const startMinutes = startHour * 60
        const endMinutes = endHour * 60
        const range = endMinutes - startMinutes
        if (range <= 0) return 0
        return ((totalMinutes - startMinutes) / range) * 100
    }

    const isCurrentTimeVisible = (): boolean => {
        const now = new Date()
        const currentHour = now.getHours()
        return currentHour >= startHour && currentHour <= endHour
    }

    const getCurrentTimePosition = (): number => {
        const now = new Date()
        return timeToPercentage(now)
    }

    // Group events by parent eventId (one row per event)
    const eventGroups = new Map<string, TimelineEvent[]>()

    for (const event of filteredEvents) {
        const groupKey = event.eventId || event.id
        if (!eventGroups.has(groupKey)) {
            eventGroups.set(groupKey, [])
        }
        eventGroups.get(groupKey)!.push(event)
    }

    // Sort rounds within each group by start time
    eventGroups.forEach(rounds => {
        rounds.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    })

    // Convert to array of groups
    const groupedRows = Array.from(eventGroups.values())

    // Calculate dynamic height based on number of rows (add vertical padding)
    const contentHeight = groupedRows.length * ROW_HEIGHT + VERTICAL_PADDING * 2
    const minHeight = 200 // minimum height in pixels
    const maxVisibleHeight = MAX_VISIBLE_EVENTS * ROW_HEIGHT + VERTICAL_PADDING * 2

    return (
        <div
            className={cn(
                "w-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden flex flex-col",
                className
            )}
        >
            {/* Unified horizontal scrollable container with custom scrollbar */}
            <div className="relative overflow-x-auto timeline-scrollbar">
                <div className="min-w-[1200px] flex flex-col">
                    {/* Fixed height scrollable events area - vertical scroll only with custom scrollbar */}
                    <div
                        className="relative overflow-y-auto overflow-x-hidden w-full timeline-scrollbar"
                        style={{ maxHeight: `${maxVisibleHeight}px` }}
                    >
                        <div
                            className="relative w-full px-4"
                            style={{ height: `${Math.max(contentHeight, minHeight)}px` }}
                        >
                            {/* Time grid background */}
                            <div
                                className="absolute inset-x-4 flex"
                                style={{
                                    top: `${VERTICAL_PADDING}px`,
                                    bottom: `${VERTICAL_PADDING}px`,
                                }}
                            >
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className="flex-1 border-r border-white/5 relative"
                                    />
                                ))}
                            </div>

                            {/* Current time indicator */}
                            {showCurrentTime && isCurrentTimeVisible() && (
                                <div
                                    className="absolute w-px bg-red-500 z-20 pointer-events-none"
                                    style={{
                                        left: `calc(1rem + ${getCurrentTimePosition()}% * (100% - 2rem) / 100)`,
                                        top: `${VERTICAL_PADDING}px`,
                                        bottom: `${VERTICAL_PADDING}px`,
                                    }}
                                >
                                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                                </div>
                            )}

                            {/* Event rows */}
                            <div
                                className="absolute inset-x-4"
                                style={{
                                    top: `${VERTICAL_PADDING}px`,
                                    bottom: `${VERTICAL_PADDING}px`,
                                }}
                            >
                                {groupedRows.map((eventGroup, rowIndex) => (
                                    <div
                                        key={
                                            eventGroup[0]?.eventId || eventGroup[0]?.id || rowIndex
                                        }
                                        className="absolute w-full"
                                        style={{
                                            top: `${rowIndex * ROW_HEIGHT}px`,
                                            height: `${EVENT_HEIGHT}px`,
                                        }}
                                    >
                                        {eventGroup.map(event => {
                                            const startPos = Math.max(
                                                0,
                                                timeToPercentage(event.startTime)
                                            )
                                            const endPos = Math.min(
                                                100,
                                                timeToPercentage(getEventEndTime(event))
                                            )
                                            const width = endPos - startPos
                                            const colors = EVENT_TYPE_COLORS[event.eventType]
                                            const eventEndTime = getEventEndTime(event)

                                            return (
                                                <motion.div
                                                    key={event.id}
                                                    className={cn(
                                                        "absolute h-10 rounded-lg border px-3 py-1.5 cursor-pointer transition-all duration-200 overflow-hidden",
                                                        colors.bg,
                                                        colors.border,
                                                        "hover:brightness-110 hover:scale-105 hover:z-10"
                                                    )}
                                                    style={{
                                                        left: `${startPos}%`,
                                                        width: `${Math.max(width, 1)}%`,
                                                    }}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => onEventClick?.(event)}
                                                    title={`${event.name}\n${formatTime(event.startTime)} - ${formatTime(eventEndTime)}${event.venue ? `\n${event.venue}` : ""}`}
                                                >
                                                    <div className="flex flex-col justify-center h-full">
                                                        <span
                                                            className={cn(
                                                                "text-xs font-semibold truncate",
                                                                colors.text
                                                            )}
                                                        >
                                                            {event.name}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400 truncate">
                                                            {formatTime(event.startTime)} -{" "}
                                                            {formatTime(eventEndTime)}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sticky bottom time axis */}
                    <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 z-30">
                        <div className="relative w-full h-8 px-4">
                            <div className="absolute inset-x-4 inset-y-0 flex">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className="flex-1 border-r border-white/5 relative flex items-center justify-center"
                                    >
                                        <div className="text-xs text-zinc-400 font-mono">
                                            {formatHour(hour)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Timeline
