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
}

interface TimelineProps {
    events: TimelineEvent[]
    date: Date
    height?: string
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

const START_HOUR = 8
const END_HOUR = 22

function timeToPercentage(date: Date): number {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const totalMinutes = hours * 60 + minutes
    const startMinutes = START_HOUR * 60
    const endMinutes = END_HOUR * 60
    const range = endMinutes - startMinutes
    if (range <= 0) return 0
    return ((totalMinutes - startMinutes) / range) * 100
}

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

function isCurrentTimeVisible(): boolean {
    const now = new Date()
    return now.getHours() >= START_HOUR && now.getHours() < END_HOUR
}

function getCurrentTimePosition(): number {
    const now = new Date()
    return timeToPercentage(now)
}

const Timeline = ({
    events,
    date,
    height = "h-64",
    showCurrentTime = true,
    onEventClick,
    className,
}: TimelineProps) => {
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

    const filteredEvents = events.filter(event => isSameDay(new Date(event.startTime), date))

    const sortedEvents = [...filteredEvents].sort((a, b) => {
        const startA = a.startTime.getHours() * 60 + a.startTime.getMinutes()
        const startB = b.startTime.getHours() * 60 + b.startTime.getMinutes()
        return startA - startB
    })

    const rows: TimelineEvent[][] = []
    for (const event of sortedEvents) {
        let placed = false
        for (const row of rows) {
            const lastEventInRow = row[row.length - 1]
            if (canPlaceAfter(lastEventInRow, event)) {
                row.push(event)
                placed = true
                break
            }
        }
        if (!placed) {
            rows.push([event])
        }
    }

    return (
        <div
            className={cn(
                "w-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden",
                className
            )}
        >
            <div className="relative overflow-x-auto">
                <div className={cn("min-w-[800px] relative", height)}>
                    <div className="absolute inset-0 flex pt-0">
                        {hours.map(hour => (
                            <div
                                key={hour}
                                className="flex-1 border-r border-white/5 relative h-full"
                            >
                                <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-zinc-500 font-mono">
                                    {formatHour(hour)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {showCurrentTime && isCurrentTimeVisible() && (
                        <div
                            className="absolute top-0 bottom-8 w-px bg-red-500 z-20 pointer-events-none"
                            style={{ left: `${getCurrentTimePosition()}%` }}
                        >
                            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                        </div>
                    )}

                    <div className="absolute inset-0 pb-6 pt-2">
                        {rows.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="absolute w-full flex items-center"
                                style={{
                                    top: `${rowIndex * 60}px`,
                                    height: "50px",
                                }}
                            >
                                {row.map(event => {
                                    const startPos = Math.max(0, timeToPercentage(event.startTime))
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
                                                width: `${Math.max(width, 5)}%`,
                                                minWidth: "120px",
                                            }}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => onEventClick?.(event)}
                                            title={`${event.name}\n${formatTime(event.startTime)} - ${formatTime(eventEndTime)}${event.venue ? `\n${event.venue}` : ""}`}
                                        >
                                            <div className="flex flex-col justify-center">
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
        </div>
    )
}

function canPlaceAfter(lastEvent: TimelineEvent, newEvent: TimelineEvent): boolean {
    const lastEnd = getEventEndTime(lastEvent).getTime()
    const newStart = newEvent.startTime.getTime()
    return lastEnd <= newStart
}

export default Timeline
