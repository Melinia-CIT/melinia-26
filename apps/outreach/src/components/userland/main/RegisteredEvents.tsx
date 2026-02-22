import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Calendar, MapPin, Trophy, ArrowRight, Star, User, Community } from "iconoir-react"
import { Spinner } from "../../ui/spinner"
import api from "../../../services/api"
import { useNavigate } from "react-router-dom"
import { UserRegisteredEvents, userRegisteredEventsSchema } from "@melinia/shared"

type UserRegEvents = {
    events: UserRegisteredEvents
}

type UserRegisteredEvent = UserRegisteredEvents[number]
type RegisteredEventWithRegistration = UserRegisteredEvent & {
    registration: {
        mode: "solo" | "team"
        team?: {
            name: string
        }
    }
}

const hasRegistration = (event: UserRegisteredEvent): event is RegisteredEventWithRegistration =>
    "registration" in event

const RegisteredEvents = () => {
    const navigate = useNavigate()

    const { data: events, isLoading } = useQuery<UserRegisteredEvents>({
        queryKey: ["user-registered-events"],
        queryFn: async () => {
            const response = await api.get<UserRegEvents>("/users/me/events")
            return userRegisteredEventsSchema.parse(response.data.events)
        },
    })

    if (isLoading) {
        return (
            <div className="w-full flex justify-center py-10">
                <Spinner w={4} h={4} />
            </div>
        )
    }

    if (!events || events.length === 0) {
        return (
            <>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-2xl font-bold font-inst text-white tracking-tight flex items-center gap-2">
                        Your Events
                    </h2>
                </div>
                <div className="w-full p-8 border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center bg-zinc-900/20">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                        <Star className="w-5 h-5 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 font-medium">No event registrations yet.</p>
                    <button
                        type="button"
                        onClick={() => navigate("/app/events")}
                        className="mt-4 text-xs hover:cursor-pointer transition-colors uppercase tracking-widest flex gap-2 items-center text-zinc-400 hover:text-white group"
                    >
                        <span className="font-semibold">Explore Events</span>
                        <ArrowRight
                            width="14"
                            height="14"
                            className="group-hover:translate-x-1 transition-transform"
                        />
                    </button>
                </div>
            </>
        )
    }

    return (
        <section className="w-full">
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-bold font-inst text-white tracking-tight flex items-center gap-2">
                    Your Events
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {events.length}
                    </span>
                </h2>
            </div>

            {/* Grid is responsive: 1 col on mobile, 2 cols on md, 3 cols on lg */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {events.map((event, index) =>
                    (() => {
                        const isParticipant = hasRegistration(event)
                        const registrationMode = isParticipant ? event.registration.mode : "crew"
                        const teamLabel = isParticipant
                            ? event.registration.mode === "team"
                                ? `Team: ${event.registration.team?.name ?? "Team"}`
                                : "Solo Entry"
                            : "Crew Assignment"
                        const registrationBadgeClass = isParticipant
                            ? registrationMode === "team"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            : "bg-violet-500/10 text-violet-400 border border-violet-500/20"

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4 }}
                                onClick={() => navigate(`/app/events/${event.id}`)}
                                className="group bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-5 rounded-3xl hover:bg-zinc-900 hover:border-white/10 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Registration Mode Badge */}
                                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                    <div className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">
                                        Confirmed
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${registrationBadgeClass}`}
                                    >
                                        {registrationMode === "team" ? (
                                            <Community width="10" height="10" />
                                        ) : registrationMode === "solo" ? (
                                            <User width="10" height="10" />
                                        ) : (
                                            <User width="10" height="10" />
                                        )}
                                        {registrationMode}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 transition-colors pr-20">
                                    {event.name}
                                </h3>

                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mb-4 truncate pr-20">
                                    {teamLabel}
                                </p>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Calendar
                                            width="14"
                                            height="14"
                                            className="text-zinc-500"
                                        />
                                        <span className="text-xs font-medium">
                                            {new Date(event.start_time).toLocaleDateString(
                                                "en-US",
                                                {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                }
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <MapPin width="14" height="14" className="text-zinc-500" />
                                        <span className="text-xs font-medium truncate">
                                            {event.venue}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Trophy
                                            width="14"
                                            height="14"
                                            className="text-amber-500/80"
                                        />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                            {event.event_type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-white/40 group-hover:text-white transition-colors">
                                        View Details
                                        <ArrowRight
                                            width="12"
                                            height="12"
                                            className="group-hover:translate-x-1 transition-transform"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })()
                )}
            </div>
        </section>
    )
}

export default RegisteredEvents
